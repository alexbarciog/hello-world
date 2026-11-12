// Intentsly tools for the MCP server. Every query runs with the signed-in
// user's own token, so row-level security limits it to their workspace exactly
// as in the app. The service-role client is used only for the LinkedIn safety
// budget and its ledger, which the app also keeps server-side.
import { McpServer } from 'npm:@modelcontextprotocol/sdk@1.31.0/server/mcp.js';
import { z } from 'npm:zod@3.25.76';
import type { Access } from '../_shared/billing.ts';
import { getLinkedInBudget, recordLinkedInAction, triggerLinkedInCooldown } from '../_shared/linkedin-budget.ts';
import {
  findChatWith, getMessages, isFromMe, linkedinIdFromUrl, listChats, messageTime,
  resolveProviderId, sendToChat, startChat, type Unipile, UnipileError,
} from './unipile.ts';

export interface ToolContext {
  db: any; // user-scoped client (RLS)
  admin: any; // service role: budget + ledger only
  userId: string;
  orgId: string | null;
  access: Access;
  linkedin: Unipile | null;
  appUrl: string;
}

const READ = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
const READ_LINKEDIN = { ...READ, openWorldHint: true };
const WRITE = { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false };

class ToolError extends Error {}

function ok(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

function fail(message: string) {
  return { content: [{ type: 'text' as const, text: message }], isError: true };
}

/** Wraps a handler: plan check, then uniform error reporting. */
function guarded<A>(ctx: ToolContext, fn: (args: A) => Promise<unknown>, opts: { needsPlan?: boolean } = {}) {
  return async (args: A) => {
    if ((opts.needsPlan ?? true) && ctx.access === 'none') {
      return fail(
        `This Intentsly account has no active plan or trial, so Claude can't use it right now. ` +
        `Start a trial or pick a plan at ${ctx.appUrl}/billing, then try again.`,
      );
    }
    try {
      return ok(await fn(args));
    } catch (e) {
      if (e instanceof ToolError) return fail(e.message);
      console.error('[mcp] tool error:', e);
      return fail('Something went wrong on the Intentsly side. Please try again in a minute.');
    }
  };
}

function check<T>(res: { data: T; error: any }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

/** Limits a table query to the user's current workspace, like the app does. */
function inWorkspace(ctx: ToolContext, q: any) {
  return ctx.orgId ? q.eq('organization_id', ctx.orgId) : q.eq('user_id', ctx.userId);
}

/** Strips characters that would break a PostgREST or() filter. */
function searchTerm(s: string) {
  return s.replace(/[,()*%\\]/g, ' ').trim().slice(0, 80);
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

function fullName(c: { first_name?: string | null; last_name?: string | null }) {
  return [c.first_name, c.last_name].filter(Boolean).join(' ') || null;
}

function leadSummary(c: any) {
  return {
    lead_id: c.id,
    name: fullName(c),
    title: c.title,
    company: c.company,
    buying_signal: c.signal,
    signal_post_excerpt: c.signal_post_excerpt ? String(c.signal_post_excerpt).slice(0, 280) : null,
    signal_post_url: c.signal_post_url,
    intent_tier: c.relevance_tier,
    score: c.ai_score,
    review_status: c.approval_status,
    lead_status: c.lead_status,
    list: c.list_name,
    linkedin_url: c.linkedin_url,
    last_signal_at: c.last_signal_at,
    found_at: c.imported_at,
  };
}

const LEAD_COLUMNS =
  'id, first_name, last_name, title, company, signal, signal_post_excerpt, signal_post_url, relevance_tier, ai_score, approval_status, lead_status, list_name, linkedin_url, last_signal_at, imported_at';

function requireLinkedIn(ctx: ToolContext): Unipile {
  if (!ctx.linkedin) {
    throw new ToolError(`No LinkedIn account is connected to Intentsly yet. Connect one at ${ctx.appUrl}/integrations.`);
  }
  return ctx.linkedin;
}

async function loadLead(ctx: ToolContext, leadId: string) {
  const lead = check(await inWorkspace(ctx, ctx.db.from('contacts').select('*').eq('id', leadId)).maybeSingle());
  if (!lead) throw new ToolError(`No lead with id ${leadId} in this workspace.`);
  return lead as any;
}

async function loadCampaign(ctx: ToolContext, campaignId: string) {
  const c = check(await inWorkspace(ctx, ctx.db.from('campaigns').select('*').eq('id', campaignId)).maybeSingle());
  if (!c) throw new ToolError(`No campaign with id ${campaignId} in this workspace.`);
  return c as any;
}

/** The list a campaign draws its leads from (agent-sourced campaigns use the agent's list). */
async function campaignListId(ctx: ToolContext, campaign: any): Promise<string | null> {
  if (campaign.source_list_id) return campaign.source_list_id;
  if (!campaign.source_agent_id) return null;
  const agent = check(await ctx.db.from('signal_agents').select('leads_list_name').eq('id', campaign.source_agent_id).maybeSingle()) as any;
  if (!agent?.leads_list_name) return null;
  const list = check(await ctx.db.from('lists').select('id').eq('name', agent.leads_list_name).eq('user_id', campaign.user_id).limit(1).maybeSingle()) as any;
  return list?.id ?? null;
}

function campaignSummary(c: any) {
  return {
    campaign_id: c.id,
    name: c.company_name || 'My Campaign',
    status: c.status,
    goal: c.campaign_goal,
    conversational_ai: !!c.conversational_ai,
    daily_connect_limit: c.daily_connect_limit,
    invitations_sent: c.invitations_sent ?? 0,
    invitations_accepted: c.invitations_accepted ?? 0,
    messages_sent: c.messages_sent ?? 0,
    replies: c.messages_replied ?? 0,
    created_at: c.created_at,
  };
}

export function registerTools(server: McpServer, ctx: ToolContext) {
  // ── Account ───────────────────────────────────────────────────────────
  server.registerTool('get_account_overview', {
    title: 'Account overview',
    description:
      'Start here. Summarises the Intentsly account: plan status, connected LinkedIn account, how many LinkedIn ' +
      'invitations and messages can still be sent today under the account safety limits, and counts of leads, ' +
      'leads waiting for review, active campaigns, active signal agents and upcoming meetings.',
    inputSchema: {},
    annotations: READ,
  }, guarded(ctx, async () => {
    const [leads, hotWeek, pending, campaigns, agents, meetings, invite, message] = await Promise.all([
      inWorkspace(ctx, ctx.db.from('contacts').select('id', { count: 'exact', head: true })),
      inWorkspace(ctx, ctx.db.from('contacts').select('id', { count: 'exact', head: true }))
        .eq('relevance_tier', 'hot').gte('imported_at', daysAgo(7)),
      inWorkspace(ctx, ctx.db.from('contacts').select('id', { count: 'exact', head: true })).eq('approval_status', 'pending'),
      inWorkspace(ctx, ctx.db.from('campaigns').select('id', { count: 'exact', head: true })).eq('status', 'active'),
      inWorkspace(ctx, ctx.db.from('signal_agents').select('id', { count: 'exact', head: true })).eq('status', 'active'),
      inWorkspace(ctx, ctx.db.from('meetings').select('id', { count: 'exact', head: true }))
        .eq('status', 'scheduled').gte('scheduled_at', new Date().toISOString()),
      ctx.linkedin ? getLinkedInBudget(ctx.admin, ctx.userId, 'invite') : null,
      ctx.linkedin ? getLinkedInBudget(ctx.admin, ctx.userId, 'message') : null,
    ]);
    const profile = check(await ctx.db.from('profiles').select('linkedin_display_name').eq('user_id', ctx.userId).maybeSingle()) as any;
    return {
      plan: ctx.access === 'none'
        ? `No active plan or trial. Start one at ${ctx.appUrl}/billing to use Intentsly from Claude.`
        : 'Active',
      linkedin: ctx.linkedin
        ? {
          connected: true,
          name: profile?.linkedin_display_name ?? null,
          invitations_left_today: invite?.remainingToday ?? 0,
          messages_left_today: message?.remainingToday ?? 0,
          note: message && !message.allowed ? message.reason : undefined,
        }
        : { connected: false, connect_at: `${ctx.appUrl}/integrations` },
      leads_total: leads.count ?? 0,
      hot_leads_last_7_days: hotWeek.count ?? 0,
      leads_waiting_for_review: pending.count ?? 0,
      active_campaigns: campaigns.count ?? 0,
      active_signal_agents: agents.count ?? 0,
      upcoming_meetings: meetings.count ?? 0,
    };
  }, { needsPlan: false }));

  // ── Leads ─────────────────────────────────────────────────────────────
  server.registerTool('search_leads', {
    title: 'Search leads',
    description:
      'Find leads (people showing buying intent) that Intentsly collected. Filter by free text (name, company, ' +
      'job title or the buying signal), intent tier, review status, list or recency. Returns the buying signal ' +
      'that made each person a lead. Use get_lead for full details.',
    inputSchema: {
      query: z.string().max(80).optional().describe('Free text matched against name, company, title and buying signal'),
      intent_tier: z.enum(['hot', 'warm', 'cold']).optional().describe('hot = strongest buying intent'),
      review_status: z.enum(['pending', 'approved', 'rejected', 'auto_approved']).optional()
        .describe('pending = waiting for the user to approve or reject'),
      list: z.string().max(120).optional().describe('Exact lead list name (see list_lead_lists)'),
      found_in_last_days: z.number().int().min(1).max(365).optional(),
      sort: z.enum(['newest', 'score']).default('newest'),
      limit: z.number().int().min(1).max(50).default(20),
    },
    annotations: READ,
  }, guarded(ctx, async (a: any) => {
    let q = inWorkspace(ctx, ctx.db.from('contacts').select(LEAD_COLUMNS));
    if (a.query) {
      const t = searchTerm(a.query);
      if (t) {
        q = q.or(['first_name', 'last_name', 'company', 'title', 'signal'].map((c) => `${c}.ilike.%${t}%`).join(','));
      }
    }
    if (a.intent_tier) q = q.eq('relevance_tier', a.intent_tier);
    if (a.review_status) q = q.eq('approval_status', a.review_status);
    if (a.list) q = q.eq('list_name', a.list);
    if (a.found_in_last_days) q = q.gte('imported_at', daysAgo(a.found_in_last_days));
    q = a.sort === 'score'
      ? q.order('ai_score', { ascending: false, nullsFirst: false })
      : q.order('imported_at', { ascending: false });
    const rows = check(await q.limit(a.limit ?? 20)) as any[];
    return { count: rows.length, leads: rows.map(leadSummary) };
  }));

  server.registerTool('get_lead', {
    title: 'Get lead details',
    description:
      'Full details for one lead: buying signal and source post, LinkedIn profile summary, AI intent insights, ' +
      'which campaigns they are in (invitation status, last reply) and meetings.',
    inputSchema: { lead_id: z.string().uuid() },
    annotations: READ,
  }, guarded(ctx, async ({ lead_id }: { lead_id: string }) => {
    const lead = await loadLead(ctx, lead_id);
    const [requests, meetings] = await Promise.all([
      ctx.db.from('campaign_connection_requests')
        .select('campaign_id, status, sent_at, accepted_at, current_step, conversation_stopped, reply_sentiment, last_reply_excerpt, last_incoming_message_at, chat_id')
        .eq('contact_id', lead_id).eq('user_id', ctx.userId),
      ctx.db.from('meetings').select('scheduled_at, status, notes').eq('contact_id', lead_id).order('scheduled_at'),
    ]);
    return {
      ...leadSummary(lead),
      email: lead.email,
      industry: lead.industry,
      linkedin_headline: lead.linkedin_headline,
      location: lead.linkedin_location,
      about: lead.linkedin_about ? String(lead.linkedin_about).slice(0, 600) : null,
      signal_count: lead.signal_count,
      intent_insights: lead.intent_insights ?? null,
      campaigns: (check(requests) as any[] ?? []).map((r) => ({
        campaign_id: r.campaign_id,
        invitation: r.status,
        invited_at: r.sent_at,
        accepted_at: r.accepted_at,
        sequence_step: r.current_step,
        ai_conversation_stopped: r.conversation_stopped,
        replied_at: r.last_incoming_message_at,
        reply_sentiment: r.reply_sentiment,
        last_reply: r.last_reply_excerpt,
        has_linkedin_conversation: !!r.chat_id,
      })),
      meetings: check(meetings) ?? [],
    };
  }));

  server.registerTool('list_lead_lists', {
    title: 'List lead lists',
    description: 'Lead lists in the workspace with how many leads each holds. Signal agents and imports save leads into lists.',
    inputSchema: {},
    annotations: READ,
  }, guarded(ctx, async () => {
    const lists = check(await inWorkspace(ctx, ctx.db.from('lists').select('id, name, description, created_at'))
      .order('created_at', { ascending: false }).limit(100)) as any[];
    const counts = await Promise.all(lists.map((l) =>
      ctx.db.from('contact_lists').select('id', { count: 'exact', head: true }).eq('list_id', l.id)
    ));
    return lists.map((l, i) => ({ list_id: l.id, name: l.name, description: l.description, leads: counts[i].count ?? 0 }));
  }));

  server.registerTool('review_leads', {
    title: 'Approve or reject leads',
    description:
      'Approve or reject leads that are waiting for review. Approved leads can be contacted by campaigns; ' +
      'rejected leads are skipped. Use search_leads with review_status "pending" to find them.',
    inputSchema: {
      lead_ids: z.array(z.string().uuid()).min(1).max(100),
      decision: z.enum(['approved', 'rejected']),
    },
    annotations: WRITE,
  }, guarded(ctx, async ({ lead_ids, decision }: { lead_ids: string[]; decision: string }) => {
    const updated = check(await inWorkspace(ctx, ctx.db.from('contacts').update({ approval_status: decision }))
      .in('id', lead_ids).select('id')) as any[];
    return { updated: updated.length, decision, not_found_or_not_yours: lead_ids.length - updated.length };
  }));

  // ── Signal agents ─────────────────────────────────────────────────────
  server.registerTool('list_signal_agents', {
    title: 'List signal agents',
    description:
      'Signal agents watch LinkedIn (keywords, competitors, hashtags, post engagement) for people showing buying ' +
      'intent and save them as leads. Lists each agent with its status, what it watches and how many leads it found.',
    inputSchema: {},
    annotations: READ,
  }, guarded(ctx, async () => {
    const agents = check(await inWorkspace(ctx, ctx.db.from('signal_agents')
      .select('id, name, agent_type, status, keywords, results_count, leads_list_name, manual_approval, last_launched_at, next_launch_at, ideal_lead_description'))
      .order('created_at', { ascending: false })) as any[];
    return agents.map((a) => ({
      agent_id: a.id,
      name: a.name,
      type: a.agent_type,
      status: a.status,
      watches: a.keywords,
      ideal_lead: a.ideal_lead_description,
      leads_found: a.results_count ?? 0,
      saves_to_list: a.leads_list_name,
      leads_need_review: !!a.manual_approval,
      last_run: a.last_launched_at,
      next_run: a.next_launch_at,
    }));
  }));

  server.registerTool('set_signal_agent_status', {
    title: 'Pause or resume a signal agent',
    description: 'Pause a signal agent, or resume it so it keeps looking for new buying-intent leads.',
    inputSchema: { agent_id: z.string().uuid(), status: z.enum(['active', 'paused']) },
    annotations: WRITE,
  }, guarded(ctx, async ({ agent_id, status }: { agent_id: string; status: string }) => {
    const patch: Record<string, unknown> = { status };
    if (status === 'active') patch.last_launched_at = new Date().toISOString();
    const rows = check(await ctx.db.from('signal_agents').update(patch).eq('id', agent_id).eq('user_id', ctx.userId).select('id, name, status')) as any[];
    if (!rows.length) throw new ToolError('Agent not found, or it belongs to another workspace member who must change it.');
    return { agent_id, name: rows[0].name, status: rows[0].status };
  }));

  // ── Campaigns ─────────────────────────────────────────────────────────
  server.registerTool('list_campaigns', {
    title: 'List campaigns',
    description: 'LinkedIn outreach campaigns with their status and results (invitations sent and accepted, messages, replies).',
    inputSchema: { status: z.enum(['active', 'paused', 'draft']).optional() },
    annotations: READ,
  }, guarded(ctx, async ({ status }: { status?: string }) => {
    let q = inWorkspace(ctx, ctx.db.from('campaigns').select('*')).order('created_at', { ascending: false });
    if (status) q = q.eq('status', status);
    return (check(await q.limit(100)) as any[]).map(campaignSummary);
  }));

  server.registerTool('get_campaign', {
    title: 'Get campaign details',
    description:
      'One campaign in detail: settings, message sequence, funnel (invited, accepted, replied, meetings) and the ' +
      'most recent replies from leads.',
    inputSchema: { campaign_id: z.string().uuid() },
    annotations: READ,
  }, guarded(ctx, async ({ campaign_id }: { campaign_id: string }) => {
    const c = await loadCampaign(ctx, campaign_id);
    const [reqs, meetings] = await Promise.all([
      ctx.db.from('campaign_connection_requests')
        .select('contact_id, status, last_incoming_message_at, reply_sentiment, last_reply_excerpt')
        .eq('campaign_id', campaign_id).limit(5000),
      ctx.db.from('meetings').select('id', { count: 'exact', head: true }).eq('campaign_id', campaign_id),
    ]);
    const rows = (check(reqs) as any[]) ?? [];
    const by = (s: string[]) => rows.filter((r) => s.includes(r.status)).length;
    const replied = rows.filter((r) => r.last_incoming_message_at)
      .sort((a, b) => String(b.last_incoming_message_at).localeCompare(String(a.last_incoming_message_at)));
    const recent = replied.slice(0, 10);
    const names = new Map<string, any>();
    if (recent.length) {
      const leads = check(await ctx.db.from('contacts').select('id, first_name, last_name, company, title')
        .in('id', recent.map((r) => r.contact_id))) as any[];
      for (const l of leads) names.set(l.id, l);
    }
    const steps = Array.isArray(c.workflow_steps) ? c.workflow_steps : [];
    return {
      ...campaignSummary(c),
      value_proposition: c.value_proposition,
      tone: c.message_tone,
      language: c.language,
      target_titles: c.icp_job_titles,
      sequence: steps.map((s: any, i: number) => ({
        step: i + 1,
        type: s?.type ?? null,
        delay_days: s?.delay_days ?? null,
        written_by_ai: !!s?.ai_icebreaker,
        template: s?.message ? String(s.message).slice(0, 500) : null,
      })),
      funnel: {
        in_campaign: rows.length,
        invited: by(['sent', 'accepted', 'completed']),
        accepted: by(['accepted', 'completed']),
        replied: replied.length,
        meetings: meetings.count ?? 0,
        failed_or_skipped: by(['failed', 'skipped_unreachable', 'skipped_already_connected']),
      },
      recent_replies: recent.map((r) => {
        const l = names.get(r.contact_id);
        return {
          lead_id: r.contact_id,
          name: l ? fullName(l) : null,
          company: l?.company ?? null,
          replied_at: r.last_incoming_message_at,
          sentiment: r.reply_sentiment,
          excerpt: r.last_reply_excerpt,
        };
      }),
    };
  }));

  server.registerTool('set_campaign_status', {
    title: 'Start or pause a campaign',
    description:
      'Start (active) or pause a LinkedIn campaign. An active campaign sends connection invitations and ' +
      'follow-up messages automatically, within the account daily safety limits. Confirm with the user before ' +
      'starting a campaign.',
    inputSchema: { campaign_id: z.string().uuid(), status: z.enum(['active', 'paused']) },
    annotations: { ...WRITE, openWorldHint: true },
  }, guarded(ctx, async ({ campaign_id, status }: { campaign_id: string; status: string }) => {
    const c = await loadCampaign(ctx, campaign_id);
    if (status === 'active') {
      if (!ctx.linkedin) throw new ToolError(`Connect a LinkedIn account at ${ctx.appUrl}/integrations before starting a campaign.`);
      if (c.status === 'draft') {
        throw new ToolError(`This campaign is still a draft. Finish setting it up at ${ctx.appUrl}/campaigns/${campaign_id} before starting it.`);
      }
    }
    const rows = check(await ctx.db.from('campaigns').update({ status }).eq('id', campaign_id).eq('user_id', ctx.userId).select('id, status')) as any[];
    if (!rows.length) throw new ToolError('Only the person who created this campaign can start or pause it.');
    return { campaign_id, name: c.company_name || 'My Campaign', status: rows[0].status };
  }));

  server.registerTool('add_leads_to_campaign', {
    title: 'Add leads to a campaign',
    description:
      'Queue leads for a campaign. The campaign then invites them on LinkedIn and runs its message sequence on its ' +
      'normal schedule (only while the campaign is active, within the daily safety limits). Leads already queued are skipped.',
    inputSchema: {
      campaign_id: z.string().uuid(),
      lead_ids: z.array(z.string().uuid()).min(1).max(200),
    },
    annotations: WRITE,
  }, guarded(ctx, async ({ campaign_id, lead_ids }: { campaign_id: string; lead_ids: string[] }) => {
    const c = await loadCampaign(ctx, campaign_id);
    const listId = await campaignListId(ctx, c);
    if (!listId) {
      throw new ToolError(`This campaign has no lead list to add to yet. Pick its lead source at ${ctx.appUrl}/campaigns/${campaign_id}.`);
    }
    const leads = check(await inWorkspace(ctx, ctx.db.from('contacts').select('id')).in('id', lead_ids)) as any[];
    const existing = check(await ctx.db.from('contact_lists').select('contact_id').eq('list_id', listId)
      .in('contact_id', leads.map((l) => l.id))) as any[];
    const already = new Set(existing.map((e) => e.contact_id));
    const toAdd = leads.map((l) => l.id).filter((id) => !already.has(id));
    if (toAdd.length) {
      check(await ctx.db.from('contact_lists').insert(toAdd.map((contact_id) => ({ contact_id, list_id: listId }))));
    }
    return {
      campaign: c.company_name || 'My Campaign',
      campaign_status: c.status,
      added: toAdd.length,
      already_in_campaign: already.size,
      not_found: lead_ids.length - leads.length,
      note: c.status === 'active' ? 'They will be invited on the next scheduled run.' : 'The campaign is not active, so nothing is sent until it is started.',
    };
  }));

  server.registerTool('list_meetings', {
    title: 'List meetings',
    description: 'Meetings booked with leads, upcoming by default.',
    inputSchema: { include_past: z.boolean().default(false), limit: z.number().int().min(1).max(50).default(20) },
    annotations: READ,
  }, guarded(ctx, async ({ include_past, limit }: { include_past: boolean; limit: number }) => {
    let q = inWorkspace(ctx, ctx.db.from('meetings').select('id, contact_id, campaign_id, scheduled_at, status, notes'));
    if (!include_past) q = q.gte('scheduled_at', new Date().toISOString());
    const meetings = check(await q.order('scheduled_at', { ascending: !include_past }).limit(limit ?? 20)) as any[];
    const ids = [...new Set(meetings.map((m) => m.contact_id).filter(Boolean))];
    const leads = ids.length ? check(await ctx.db.from('contacts').select('id, first_name, last_name, company, title').in('id', ids)) as any[] : [];
    const byId = new Map(leads.map((l) => [l.id, l]));
    return meetings.map((m) => {
      const l = byId.get(m.contact_id);
      return {
        scheduled_at: m.scheduled_at,
        status: m.status,
        lead_id: m.contact_id,
        name: l ? fullName(l) : null,
        company: l?.company ?? null,
        title: l?.title ?? null,
        campaign_id: m.campaign_id,
        notes: m.notes,
      };
    });
  }));

  // ── LinkedIn inbox ────────────────────────────────────────────────────
  server.registerTool('list_linkedin_conversations', {
    title: 'List LinkedIn conversations',
    description:
      'Recent LinkedIn conversations from the connected account (the Intentsly Unibox), newest first, with the ' +
      'last message and whether it is unread. Matches people to Intentsly leads where possible.',
    inputSchema: {
      unread_only: z.boolean().default(false),
      limit: z.number().int().min(1).max(30).default(15),
    },
    annotations: READ_LINKEDIN,
  }, guarded(ctx, async ({ unread_only, limit }: { unread_only: boolean; limit: number }) => {
    const li = requireLinkedIn(ctx);
    const chats = await listChats(li, unread_only ? 50 : (limit ?? 15));
    const picked = chats
      .filter((c) => !unread_only || Number(c.unread_count ?? 0) > 0 || c.unread === true)
      .slice(0, limit ?? 15);
    const providerIds = picked.map((c) => c.attendee_provider_id).filter(Boolean);
    const leads = providerIds.length
      ? check(await inWorkspace(ctx, ctx.db.from('contacts').select('id, first_name, last_name, company, title, linkedin_profile_id'))
        .in('linkedin_profile_id', providerIds)) as any[]
      : [];
    const leadBy = new Map(leads.map((l) => [l.linkedin_profile_id, l]));
    const last = await Promise.all(picked.map((c) => getMessages(li, c.id, 1).then((m) => m[0]).catch(() => null)));
    return picked.map((c, i) => {
      const lead = leadBy.get(c.attendee_provider_id);
      const attendee = Array.isArray(c.attendees) ? c.attendees[0] : null;
      const msg = last[i];
      return {
        chat_id: c.id,
        with: (lead && fullName(lead)) || attendee?.display_name || c.name || 'LinkedIn member',
        lead_id: lead?.id ?? null,
        company: lead?.company ?? null,
        unread: Number(c.unread_count ?? 0) > 0 || c.unread === true,
        last_message: msg ? { from: isFromMe(msg) ? 'me' : 'them', text: String(msg.text ?? '').slice(0, 300), at: messageTime(msg) } : null,
      };
    });
  }));

  server.registerTool('get_linkedin_conversation', {
    title: 'Read a LinkedIn conversation',
    description: 'The messages in one LinkedIn conversation, oldest first. Pass a chat_id from list_linkedin_conversations, or a lead_id.',
    inputSchema: {
      chat_id: z.string().max(200).optional(),
      lead_id: z.string().uuid().optional(),
      limit: z.number().int().min(1).max(50).default(20),
    },
    annotations: READ_LINKEDIN,
  }, guarded(ctx, async (a: { chat_id?: string; lead_id?: string; limit: number }) => {
    const li = requireLinkedIn(ctx);
    const chatId = a.chat_id || (a.lead_id ? await chatForLead(ctx, li, await loadLead(ctx, a.lead_id)) : null);
    if (!chatId) throw new ToolError(a.lead_id ? 'There is no LinkedIn conversation with this lead yet.' : 'Pass chat_id or lead_id.');
    const msgs = await getMessages(li, chatId, a.limit ?? 20).catch((e) => {
      if (e instanceof UnipileError && e.status === 404) throw new ToolError('That conversation no longer exists on the connected LinkedIn account.');
      throw e;
    });
    return {
      chat_id: chatId,
      messages: msgs
        .sort((x, y) => String(messageTime(x)).localeCompare(String(messageTime(y))))
        .map((m) => ({ from: isFromMe(m) ? 'me' : 'them', text: m.text ?? '', at: messageTime(m) })),
    };
  }));

  server.registerTool('send_linkedin_message', {
    title: 'Send a LinkedIn message',
    description:
      'Send a LinkedIn direct message from the connected account, to a lead (lead_id) or into an existing ' +
      'conversation (chat_id). The lead must already be a 1st-degree connection; otherwise add them to a campaign, ' +
      'which sends the connection invitation first. Counts against the account daily message limit. Always show ' +
      'the user the exact message and get their confirmation before calling this tool.',
    inputSchema: {
      text: z.string().min(1).max(3000).describe('The exact message to send'),
      lead_id: z.string().uuid().optional(),
      chat_id: z.string().max(200).optional(),
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  }, guarded(ctx, async (a: { text: string; lead_id?: string; chat_id?: string }) => {
    const li = requireLinkedIn(ctx);
    const text = a.text.trim();
    if (!text) throw new ToolError('The message is empty.');
    if (!a.lead_id && !a.chat_id) throw new ToolError('Pass lead_id or chat_id.');

    const budget = await getLinkedInBudget(ctx.admin, ctx.userId, 'message');
    if (!budget.allowed) {
      throw new ToolError(`Not sent: the LinkedIn safety limit stops more messages right now (${budget.reason}). This protects the account from LinkedIn restrictions.`);
    }

    try {
      let chatId = a.chat_id ?? null;
      let lead: any = null;
      if (!chatId && a.lead_id) {
        lead = await loadLead(ctx, a.lead_id);
        chatId = await chatForLead(ctx, li, lead);
      }
      if (chatId) {
        await sendToChat(li, chatId, text);
      } else {
        const providerId = await providerIdForLead(li, lead);
        if (!providerId) throw new ToolError('Could not find this lead on LinkedIn from their profile URL.');
        chatId = await startChat(li, providerId, text);
      }
      await recordLinkedInAction(ctx.admin, ctx.userId, li.accountId, 'message');
      return { sent: true, chat_id: chatId, to: lead ? fullName(lead) : undefined, messages_left_today: Math.max(0, budget.remainingToday - 1) };
    } catch (e) {
      if (e instanceof UnipileError) {
        if (e.status === 429) {
          await triggerLinkedInCooldown(ctx.admin, ctx.userId, 'LinkedIn rate limit while sending from Claude');
          throw new ToolError('Not sent: LinkedIn is rate-limiting this account, so Intentsly paused LinkedIn activity for a while to keep it safe.');
        }
        if (e.status === 422 || e.status === 403) {
          throw new ToolError('Not sent: LinkedIn did not allow a direct message. This person is probably not a 1st-degree connection yet — add them to a campaign to invite them first.');
        }
        if (e.status === 404) throw new ToolError('Not sent: that conversation no longer exists on the connected LinkedIn account.');
      }
      throw e;
    }
  }));
}

async function providerIdForLead(li: Unipile, lead: any): Promise<string | null> {
  if (!lead) return null;
  const publicId = lead.linkedin_profile_id || linkedinIdFromUrl(lead.linkedin_url);
  return publicId ? await resolveProviderId(li, publicId) : null;
}

/** Existing LinkedIn conversation with a lead: the campaign's chat first, then a lookup on LinkedIn. */
async function chatForLead(ctx: ToolContext, li: Unipile, lead: any): Promise<string | null> {
  const req = check(await ctx.db.from('campaign_connection_requests').select('chat_id')
    .eq('contact_id', lead.id).eq('user_id', ctx.userId).not('chat_id', 'is', null).limit(1).maybeSingle()) as any;
  if (req?.chat_id) {
    const alive = await getMessages(li, req.chat_id, 1).then(() => true).catch(() => false);
    if (alive) return req.chat_id;
  }
  const providerId = await providerIdForLead(li, lead);
  return providerId ? await findChatWith(li, providerId) : null;
}

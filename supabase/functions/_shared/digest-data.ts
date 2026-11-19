// Builds one account's weekly digest numbers from real tables. Used by the
// scheduler and the admin preview, so the preview is exactly what would go out.
import type { DailyLeadsPayload, DigestPayload } from "./email-templates/index.ts";

// deno-lint-ignore no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any;

export async function buildDigestPayload(db: Db, userId: string, firstName: string | null, now: Date = new Date()): Promise<DigestPayload> {
  const since = new Date(now.getTime() - 7 * 86_400_000).toISOString();
  const { data: profile } = await db.from("profiles").select("current_organization_id").eq("user_id", userId).maybeSingle();
  const orgId = profile?.current_organization_id ?? null;

  let contacts = db.from("contacts").select("id", { count: "exact", head: true }).gte("imported_at", since);
  contacts = orgId ? contacts.or(`user_id.eq.${userId},organization_id.eq.${orgId}`) : contacts.eq("user_id", userId);

  const [signals, messages, replies, meetings] = await Promise.all([
    contacts,
    db.from("linkedin_actions").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("action_type", "message").gte("created_at", since),
    db.from("campaign_connection_requests").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("last_incoming_message_at", since),
    db.from("meetings").select("contact_id").eq("user_id", userId).neq("status", "cancelled").gte("created_at", since),
  ]);

  const payload: DigestPayload = {
    firstName,
    signals: signals.count ?? 0,
    messages: messages.count ?? 0,
    replies: replies.count ?? 0,
    // One lead can have several meeting rows; count people.
    meetings: new Set((meetings.data ?? []).map((m: { contact_id: string }) => m.contact_id)).size,
  };

  if (payload.signals + payload.messages + payload.replies + payload.meetings === 0) {
    const { data: agent } = await db.from("signal_agents").select("signals_config, icp_job_titles")
      .eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle();
    const keywords: string[] = agent?.signals_config?.keywords?.keyword_posts ?? [];
    if (keywords.length) {
      payload.keywords = keywords.slice(0, 3);
      const { data: stats } = await db.rpc("buying_signal_stats", { _terms: keywords.slice(0, 10), _days: 7 });
      payload.missedCount = stats?.count ?? null;
    }
  }
  return payload;
}

/** Latest campaign's time zone, else UTC. */
export async function accountTimezone(db: Db, userId: string): Promise<string> {
  const { data } = await db.from("campaigns").select("timezone").eq("user_id", userId)
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  return data?.timezone || "UTC";
}

/**
 * Leads the account's ACTIVE signal agents added between start and end: rows
 * added to each agent's lead list (lists.source_agent_id, or the list named
 * after the agent for lists created before that column existed). A person in
 * two agents' lists counts once in the total.
 */
export async function buildDailyLeadsPayload(
  db: Db, userId: string, firstName: string | null, start: string, end: string,
): Promise<DailyLeadsPayload> {
  const { data: agents } = await db.from("signal_agents").select("id, name, leads_list_name")
    .eq("user_id", userId).eq("status", "active");
  if (!agents?.length) return { firstName, total: 0, agents: [] };

  const { data: lists } = await db.from("lists").select("id, name, source_agent_id").eq("user_id", userId);
  const listAgent = new Map<string, string>(); // list id → agent id
  for (const a of agents) {
    const listName = a.leads_list_name || a.name;
    for (const l of lists ?? []) {
      if (l.source_agent_id === a.id || (!l.source_agent_id && l.name === listName)) listAgent.set(l.id, a.id);
    }
  }
  if (!listAgent.size) return { firstName, total: 0, agents: [] };

  const { data: rows } = await db.from("contact_lists").select("contact_id, list_id")
    .in("list_id", [...listAgent.keys()]).gte("added_at", start).lt("added_at", end).limit(10000);

  const perAgent = new Map<string, Set<string>>();
  const all = new Set<string>();
  for (const r of rows ?? []) {
    const agentId = listAgent.get(r.list_id);
    if (!agentId) continue;
    if (!perAgent.has(agentId)) perAgent.set(agentId, new Set());
    perAgent.get(agentId)!.add(r.contact_id);
    all.add(r.contact_id);
  }
  return {
    firstName,
    total: all.size,
    agents: agents
      .map((a: { id: string; name: string }) => ({ name: a.name, count: perAgent.get(a.id)?.size ?? 0 }))
      .filter((a: { count: number }) => a.count > 0)
      .sort((a: { count: number }, b: { count: number }) => b.count - a.count),
  };
}

// Executes a single "email" workflow step for a given connection request.
// - Skips (status=skipped, skip_reason=no_email) when the contact has no email on file.
// - Uses a pre-scheduled message if present; otherwise generates subject+body via Lovable AI.
// - Sends via Resend.
// - Advances campaign_connection_requests.current_step on success.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { decryptPassword } from '../_shared/email-account-crypto.ts';
import { sendSmtp } from '../_shared/smtp-send.ts';

function replaceVars(tpl: string, c: any): string {
  if (!tpl) return '';
  return tpl
    .replace(/\{\{?\s*first_name\s*\}?\}/gi, c?.first_name || '')
    .replace(/\{\{?\s*last_name\s*\}?\}/gi, c?.last_name || '')
    .replace(/\{\{?\s*company\s*\}?\}/gi, c?.company || '')
    .replace(/\{\{?\s*title\s*\}?\}/gi, c?.title || '')
    .replace(/\{\{?\s*signal\s*\}?\}/gi, c?.signal || '');
}

async function generateEmailWithAI(opts: {
  apiKey: string;
  campaign: any;
  contact: any;
  stepInstructions?: string;
  stepIndex: number;
}): Promise<{ subject: string; body: string } | null> {
  const { apiKey, campaign, contact, stepInstructions, stepIndex } = opts;

  const system = `You write short, human, peer-to-peer B2B outreach emails.
Rules:
- 4–6 sentences max. Plain text. No greetings like "I hope this finds you well".
- Reference the lead's real signal or role naturally. No fluff, no jargon.
- Banned words: leverage, utilize, synergy, streamline, seamless, robust, holistic, cutting-edge, bandwidth, ecosystem, thrilled, delighted, "quick chat", "hop on a call".
- End with a single soft ask (a question, not a calendar link).
- Return STRICT JSON: {"subject": "...", "body": "..."}. Nothing else.`;

  const user = `Company: ${campaign.company_name || ''}
Value prop: ${campaign.value_proposition || ''}
Campaign goal: ${campaign.campaign_goal || ''}
Tone: ${campaign.message_tone || 'conversational'}
Follow-up step number: ${stepIndex + 1}
${stepInstructions ? `Custom instructions for this step: ${stepInstructions}` : ''}

Lead:
- Name: ${contact.first_name || ''} ${contact.last_name || ''}
- Title: ${contact.title || ''}
- Company: ${contact.company || ''}
- Industry: ${contact.industry || ''}
- Signal: ${contact.signal || ''}

Write the email now.`;

  try {
    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        response_format: { type: 'json_object' },
      }),
    });
    if (!res.ok) {
      console.error('[execute-email-step] AI error', res.status, await res.text());
      return null;
    }
    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content || '{}';
    const parsed = JSON.parse(raw);
    if (!parsed?.subject || !parsed?.body) return null;
    return { subject: String(parsed.subject).trim(), body: String(parsed.body).trim() };
  } catch (e) {
    console.error('[execute-email-step] AI exception', e);
    return null;
  }
}

async function sendResendEmail(opts: {
  apiKey: string;
  fromEmail: string;
  fromName: string;
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: boolean; error?: string; id?: string }> {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${opts.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${opts.fromName} <${opts.fromEmail}>`,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: `Resend ${res.status}: ${JSON.stringify(data)}` };
    }
    return { ok: true, id: data?.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

function bodyToHtml(body: string): string {
  const escaped = body
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return escaped
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 12px 0;line-height:1.55;font-family:-apple-system,Segoe UI,Roboto,sans-serif;font-size:14px;color:#111">${p.replace(/\n/g, '<br/>')}</p>`)
    .join('\n');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY not configured');

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const { request_id, step_index } = await req.json();
    if (!request_id || typeof step_index !== 'number') {
      return new Response(JSON.stringify({ error: 'request_id and step_index required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Load request
    const { data: reqRow, error: reqErr } = await supabase
      .from('campaign_connection_requests')
      .select('id, contact_id, campaign_id, current_step, user_id')
      .eq('id', request_id)
      .single();
    if (reqErr || !reqRow) throw new Error('request not found');

    const { data: campaign, error: cErr } = await supabase
      .from('campaigns')
      .select('id, user_id, company_name, value_proposition, campaign_goal, message_tone, workflow_steps')
      .eq('id', reqRow.campaign_id)
      .single();
    if (cErr || !campaign) throw new Error('campaign not found');

    const workflowSteps: any[] = Array.isArray(campaign.workflow_steps) ? campaign.workflow_steps : [];
    const step = workflowSteps[step_index];
    if (!step || step.type !== 'email') {
      return new Response(JSON.stringify({ error: 'step is not an email step' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: contact, error: contactErr } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, company, title, industry, signal, email')
      .eq('id', reqRow.contact_id)
      .single();
    if (contactErr || !contact) throw new Error('contact not found');

    // Ensure a scheduled_messages row exists (for status tracking)
    const { data: existingSched } = await supabase
      .from('scheduled_messages')
      .select('id, message, subject, status')
      .eq('campaign_id', campaign.id)
      .eq('contact_id', contact.id)
      .eq('step_index', step_index)
      .eq('channel', 'email')
      .maybeSingle();

    let schedId = existingSched?.id as string | undefined;
    if (!schedId) {
      const { data: created, error: cSchedErr } = await supabase
        .from('scheduled_messages')
        .insert({
          campaign_id: campaign.id,
          contact_id: contact.id,
          connection_request_id: reqRow.id,
          step_index,
          message: '',
          status: 'pending',
          channel: 'email',
          user_id: reqRow.user_id,
          scheduled_for: new Date().toISOString().split('T')[0],
        })
        .select('id')
        .single();
      if (cSchedErr) console.error('[execute-email-step] failed to create scheduled row', cSchedErr);
      schedId = created?.id;
    }

    // Skip if no email
    if (!contact.email || !contact.email.trim()) {
      if (schedId) {
        await supabase
          .from('scheduled_messages')
          .update({ status: 'skipped', skip_reason: 'no_email' })
          .eq('id', schedId);
      }
      // Advance step so the sequence doesn't get stuck
      await supabase
        .from('campaign_connection_requests')
        .update({
          current_step: (reqRow.current_step || 1) + 1,
          step_completed_at: new Date().toISOString(),
        })
        .eq('id', reqRow.id);
      return new Response(JSON.stringify({ status: 'skipped', reason: 'no_email' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Resolve subject + body
    let subject = '';
    let body = '';

    if (existingSched?.message && existingSched?.subject) {
      subject = existingSched.subject;
      body = existingSched.message;
    } else if (step.ai_sdr && LOVABLE_API_KEY) {
      const gen = await generateEmailWithAI({
        apiKey: LOVABLE_API_KEY,
        campaign,
        contact,
        stepInstructions: step.step_instructions || step.custom_instructions,
        stepIndex: step_index,
      });
      if (!gen) {
        if (schedId) {
          await supabase
            .from('scheduled_messages')
            .update({ status: 'failed', skip_reason: 'ai_generation_failed' })
            .eq('id', schedId);
        }
        return new Response(JSON.stringify({ error: 'ai generation failed' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      subject = replaceVars(gen.subject, contact);
      body = replaceVars(gen.body, contact);
    } else {
      subject = replaceVars(step.subject || '', contact);
      body = replaceVars(step.message || '', contact);
    }

    if (!subject.trim() || !body.trim()) {
      if (schedId) {
        await supabase
          .from('scheduled_messages')
          .update({ status: 'failed', skip_reason: 'empty_subject_or_body' })
          .eq('id', schedId);
      }
      return new Response(JSON.stringify({ error: 'empty subject or body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Resolve sender
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('user_id', campaign.user_id)
      .single();

    const fromEmail = step.from_email || 'onboarding@resend.dev';
    const fromName = step.from_name || profile?.full_name || campaign.company_name || 'Intentsly';

    const sendRes = await sendResendEmail({
      apiKey: RESEND_API_KEY,
      fromEmail,
      fromName,
      to: contact.email,
      subject,
      html: bodyToHtml(body),
    });

    if (!sendRes.ok) {
      if (schedId) {
        await supabase
          .from('scheduled_messages')
          .update({ status: 'failed', skip_reason: sendRes.error?.slice(0, 500) || 'send_failed', subject, message: body })
          .eq('id', schedId);
      }
      return new Response(JSON.stringify({ error: sendRes.error }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (schedId) {
      await supabase
        .from('scheduled_messages')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          subject,
          message: body,
        })
        .eq('id', schedId);
    }

    // Advance step
    await supabase
      .from('campaign_connection_requests')
      .update({
        current_step: (reqRow.current_step || 1) + 1,
        step_completed_at: new Date().toISOString(),
      })
      .eq('id', reqRow.id);

    return new Response(
      JSON.stringify({ status: 'sent', id: sendRes.id, subject }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    console.error('[execute-email-step] fatal', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

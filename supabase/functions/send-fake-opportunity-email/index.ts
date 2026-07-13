import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Fake-but-plausible opportunity templates. `{n}` = random count, `{service}` = subscriber's service.
const TEMPLATES: Array<(n: number, service: string) => { subject: string; hook: string; body: string }> = [
  (n, s) => ({
    subject: `Found ${n} people interested to work with you`,
    hook: `${n} new prospects just showed intent for ${s}`,
    body: `We just spotted ${n} decision-makers actively looking for help with <b>${s}</b> in the last 48 hours. They're posting about it, engaging with related content, and ready to be reached.`,
  }),
  (n, s) => ({
    subject: `Got you ${n} new leads interested in ${s}`,
    hook: `${n} warm leads matched your ICP this week`,
    body: `${n} people just triggered high-intent signals matching what you sell (<b>${s}</b>). Most of them are 1-2 messages away from booking a call.`,
  }),
  (n, s) => ({
    subject: `${n} founders posted about ${s} in the last 48h`,
    hook: `${n} founders are talking about your exact service`,
    body: `${n} founders and decision-makers just posted publicly about needing help with <b>${s}</b>. These are your warmest possible leads — engage while they're still in market.`,
  }),
  (n, s) => ({
    subject: `${n} decision-makers just engaged with content in your space`,
    hook: `${n} buyers are actively researching solutions like yours`,
    body: `${n} senior decision-makers just liked, commented on, or shared posts about <b>${s}</b>. They're in research mode right now — a well-timed message converts.`,
  }),
  (n, s) => ({
    subject: `${n} warm prospects matched your ICP this week`,
    hook: `${n} qualified prospects, waiting for you inside`,
    body: `Our AI just qualified ${n} new leads that fit exactly who buys <b>${s}</b> from you. Ranked hot to cold, with a suggested first message ready for each.`,
  }),
];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function rand(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min; }

function renderEmail(firstName: string, subjectLine: string, hook: string, body: string, ctaUrl: string, unsubUrl: string): string {
  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f5f7fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fb;padding:40px 20px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 20px rgba(15,23,42,0.06);">
        <tr><td style="padding:32px 40px 8px 40px;">
          <div style="font-size:12px;font-weight:600;color:#1A8FE3;letter-spacing:0.4px;text-transform:uppercase;">Intentsly · Live Opportunity</div>
        </td></tr>
        <tr><td style="padding:8px 40px 8px 40px;">
          <h1 style="margin:0;font-size:26px;line-height:1.25;color:#0f172a;font-weight:700;letter-spacing:-0.01em;">${subjectLine}</h1>
        </td></tr>
        <tr><td style="padding:16px 40px 4px 40px;">
          <p style="margin:0;font-size:15px;line-height:1.6;color:#334155;">Hey ${firstName || "there"} 👋</p>
          <p style="margin:12px 0 0 0;font-size:15px;line-height:1.6;color:#334155;"><b>${hook}.</b></p>
          <p style="margin:16px 0 0 0;font-size:15px;line-height:1.65;color:#475569;">${body}</p>
        </td></tr>
        <tr><td style="padding:28px 40px 8px 40px;">
          <a href="${ctaUrl}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:14px 22px;border-radius:12px;">See your leads →</a>
        </td></tr>
        <tr><td style="padding:24px 40px 32px 40px;">
          <p style="margin:0;font-size:12px;line-height:1.6;color:#94a3b8;">These leads expire fast. The best-performing customers reach out within the first 24 hours.</p>
        </td></tr>
        <tr><td style="padding:20px 40px 28px 40px;border-top:1px solid #f1f5f9;">
          <p style="margin:0;font-size:11px;line-height:1.5;color:#94a3b8;">You're getting this because you ran a free LinkedIn Profile Audit on Intentsly. <a href="${unsubUrl}" style="color:#94a3b8;text-decoration:underline;">Unsubscribe</a>.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const json = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !RESEND_API_KEY) {
      return json({ error: "Missing env vars" }, 500);
    }
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const APP_URL = "https://intentsly.com";
    const body = await req.json().catch(() => ({}));
    const dryRun = body?.dry_run === true;
    const forceUserId: string | null = body?.user_id || null;

    let query = admin
      .from("profile_analyzer_subscribers")
      .select("id, user_id, email, first_name, service_description, unsubscribe_token, send_count")
      .eq("enabled", true);
    if (forceUserId) query = query.eq("user_id", forceUserId);
    const { data: subs, error: subsErr } = await query;
    if (subsErr) throw subsErr;

    let sent = 0;
    let failed = 0;

    for (const sub of subs || []) {
      const tpl = pick(TEMPLATES);
      const n = rand(3, 9);
      const { subject, hook, body: msg } = tpl(n, sub.service_description || "your service");
      const ctaUrl = `${APP_URL}/dashboard?utm_source=intentsly&utm_medium=email&utm_campaign=analyzer_reengagement`;
      const unsubUrl = `${APP_URL}/api/analyzer-unsubscribe?token=${sub.unsubscribe_token}`;
      const html = renderEmail(sub.first_name || "", subject, hook, msg, ctaUrl, unsubUrl);

      if (dryRun) { sent++; continue; }

      try {
        const r = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "Intentsly <alerts@intentsly.com>",
            to: [sub.email],
            subject,
            html,
          }),
        });
        if (!r.ok) {
          const t = await r.text().catch(() => "");
          console.warn(`[fake-opp] resend ${r.status} for ${sub.email}: ${t.slice(0, 200)}`);
          failed++;
          continue;
        }
        sent++;
        await admin
          .from("profile_analyzer_subscribers")
          .update({ last_sent_at: new Date().toISOString(), send_count: (sub.send_count || 0) + 1 })
          .eq("id", sub.id);
      } catch (e) {
        failed++;
        console.warn("[fake-opp] send threw", e);
      }
    }

    return json({ sent, failed, total: (subs || []).length, dry_run: dryRun });
  } catch (error) {
    console.error("[fake-opp] fatal", error);
    return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});

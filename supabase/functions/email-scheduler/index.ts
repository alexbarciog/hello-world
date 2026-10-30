// Runs every 15 minutes (pg_cron). Finds due marketing emails and sends them
// through send-email. Both programs are off until their secret is "true":
//   EMAIL_NURTURE_ENABLED  free-tool leads: day 0, 2, 5, then nothing
//   EMAIL_DIGEST_ENABLED   weekly digest, Tuesday 09:00 account time
// Each send is claimed in the database first, so overlapping runs can't double
// send. Idempotent, so being callable with the public key is harmless.
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { sendEmail } from "../_shared/email.ts";
import { makeUnsubToken, type UnsubTarget } from "../_shared/email-tokens.ts";
import { digestDue, nextNurtureStep, weekStartOf } from "../_shared/email-schedule.ts";
import { NURTURE_STEPS, weeklyDigest, type EmailCtx, type RenderedEmail } from "../_shared/email-templates/index.ts";
import { accountTimezone, buildDigestPayload } from "../_shared/digest-data.ts";

const SITE = Deno.env.get("SITE_URL") || "https://intentsly.com";
const MAX_PER_RUN = 200;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

async function emailCtx(target: UnsubTarget): Promise<{ ctx: EmailCtx; headers: Record<string, string> }> {
  const secret = Deno.env.get("EMAIL_TOKEN_SECRET") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const token = await makeUnsubToken(target, secret);
  const oneClick = `${Deno.env.get("SUPABASE_URL")}/functions/v1/email-unsubscribe?token=${encodeURIComponent(token)}`;
  return {
    ctx: { siteUrl: SITE, unsubscribeUrl: `${SITE}/u/${token}`, postalAddress: Deno.env.get("EMAIL_POSTAL_ADDRESS") || undefined },
    headers: { "List-Unsubscribe": `<${oneClick}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
  };
}

Deno.serve(async () => {
  const nurtureOn = Deno.env.get("EMAIL_NURTURE_ENABLED") === "true";
  const digestOn = Deno.env.get("EMAIL_DIGEST_ENABLED") === "true";
  if (!nurtureOn && !digestOn) return json({ skipped: "both programs are off" });

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
  const summary = { nurture_sent: 0, digest_sent: 0, errors: [] as string[] };

  // Every account, to stop nurture on signup and to address digests.
  const usersByEmail = new Map<string, string>();
  const usersById = new Map<string, { email: string; firstName: string | null }>();
  for (let page = 1; ; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) return json({ error: error.message }, 500);
    for (const u of data.users) {
      if (!u.email) continue;
      usersByEmail.set(u.email.toLowerCase(), u.id);
      usersById.set(u.id, { email: u.email, firstName: u.user_metadata?.first_name ?? null });
    }
    if (data.users.length < 1000) break;
  }
  const now = new Date();

  // ── Free-tool nurture ──
  if (nurtureOn) {
    const { data: leads } = await db.from("tool_leads")
      .select("id, email, tool, input_summary, report, created_at")
      .eq("consent_marketing", true).is("unsubscribed_at", null)
      .gte("created_at", new Date(now.getTime() - 30 * 86_400_000).toISOString())
      .order("created_at", { ascending: true }).limit(2000);

    // One sequence per person: the first tool they used.
    const seen = new Set<string>();
    const first = (leads ?? []).filter((l) => {
      const key = l.email.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    const ids = first.map((l) => l.id);
    const { data: sends } = ids.length
      ? await db.from("tool_nurture_sends").select("lead_id, step, sent_at").in("lead_id", ids)
      : { data: [] };

    for (const lead of first) {
      if (summary.nurture_sent >= MAX_PER_RUN) break;
      // "Stop the sequence the moment the email signs up."
      if (usersByEmail.has(lead.email.toLowerCase())) continue;
      const sent = (sends ?? []).filter((s) => s.lead_id === lead.id).map((s) => ({ step: s.step, sentAt: s.sent_at }));
      const step = nextNurtureStep({ createdAt: lead.created_at, sent }, now);
      if (step === null) continue;

      try {
        const service = lead.tool === "buying_signal_finder" ? lead.input_summary : null;
        let weekCount: number | null = null;
        if (step === 5 && service) {
          const { data: stats } = await db.rpc("buying_signal_stats", { _terms: [service], _days: 7 });
          weekCount = stats?.count ?? null;
        }
        const { ctx, headers } = await emailCtx({ kind: "e", value: lead.email.toLowerCase() });
        const email: RenderedEmail = NURTURE_STEPS.find((s) => s.step === step)!.render(
          { tool: lead.tool, service, report: lead.report, weekCount }, ctx,
        );
        const { error: claimErr } = await db.from("tool_nurture_sends").insert({ lead_id: lead.id, step });
        if (claimErr) continue; // another run got it
        const result = await sendEmail({
          to: lead.email, from: "Intentsly <noreply@intentsly.com>", reply_to: "alex@intentsly.com",
          subject: email.subject, text: email.text, template: email.template, headers,
        });
        if (!result.ok) {
          await db.from("tool_nurture_sends").delete().eq("lead_id", lead.id).eq("step", step);
          summary.errors.push(`nurture ${lead.id}: ${result.error}`);
          continue;
        }
        await db.from("tool_nurture_sends").update({ resend_id: result.id ?? null }).eq("lead_id", lead.id).eq("step", step);
        summary.nurture_sent++;
      } catch (e) {
        summary.errors.push(`nurture ${lead.id}: ${e instanceof Error ? e.message : e}`);
      }
    }
  }

  // ── Weekly digest ──
  if (digestOn) {
    const { data: accounts } = await db.from("profiles")
      .select("user_id").in("subscription_status", ["trialing", "active", "legacy_free"]).eq("email_opt_out", false);
    const week = weekStartOf(now);
    const weekIndex = Math.floor(new Date(week).getTime() / (7 * 86_400_000));

    for (const { user_id: userId } of accounts ?? []) {
      if (summary.digest_sent >= MAX_PER_RUN) break;
      const user = usersById.get(userId);
      if (!user) continue;
      try {
        if (!digestDue(now, await accountTimezone(db, userId))) continue;
        const { data: already } = await db.from("digest").select("account_id").eq("account_id", userId).eq("week", week).maybeSingle();
        if (already) continue;

        const payload = await buildDigestPayload(db, userId, user.firstName, now);
        const { error: claimErr } = await db.from("digest").insert({ account_id: userId, week, payload });
        if (claimErr) continue; // another run got it
        const { ctx, headers } = await emailCtx({ kind: "u", value: userId });
        const email = weeklyDigest(payload, { ...ctx, weekIndex });
        const result = await sendEmail({
          to: user.email, from: "Alex from Intentsly <alex@intentsly.com>",
          subject: email.subject, text: email.text, template: email.template, headers,
        });
        if (!result.ok) {
          await db.from("digest").delete().eq("account_id", userId).eq("week", week);
          summary.errors.push(`digest ${userId}: ${result.error}`);
          continue;
        }
        await db.from("digest").update({ sent_at: new Date().toISOString() }).eq("account_id", userId).eq("week", week);
        summary.digest_sent++;
      } catch (e) {
        summary.errors.push(`digest ${userId}: ${e instanceof Error ? e.message : e}`);
      }
    }
  }

  if (summary.errors.length) console.error("[email-scheduler]", summary.errors.slice(0, 10));
  return json(summary);
});

// Win-back automation: finds users who signed up TODAY OR LATER (cutoff baked in),
// set up a signal agent, returned at least 1 day after signup, and never activated
// a paid subscription — then sends them Alex's 40% OFF email exactly once.
//
// Designed to be invoked by pg_cron on a recurring schedule (e.g. hourly).

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Only target users who registered FROM this date onwards (today, going forward).
const SIGNUP_CUTOFF_ISO = "2026-04-24T00:00:00Z";

const FROM_ADDRESS = "Alex from Intentsly <alex@intentsly.com>";

function buildSubject(first: string) {
  return `${first}, noticed you set things up — here's 40% off (and a personal offer)`;
}

function buildHtml(first: string) {
  return `<!DOCTYPE html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#1a1a1a;max-width:600px;margin:0 auto;padding:24px;line-height:1.6;font-size:16px;">
<p>Hey ${first},</p>

<p>Alex here, founder of Intentsly.</p>

<p>I noticed you set up your signal agent and came back to check the app a couple of times — but you probably didn't see any leads showing up yet. That's because lead delivery only kicks in once the subscription is active.</p>

<p>I get it — paying upfront before seeing results feels backwards. So I want to make this a no-brainer for you:</p>

<p><strong>40% OFF your subscription</strong> with this code: <code style="background:#f4f4f5;padding:4px 10px;border-radius:6px;font-size:15px;font-weight:600;">DISCOUNT40</code></p>

<p><strong>And here's the bonus if you activate now:</strong><br/>
I'll personally set up your entire lead generation and outreach system for you. I've been doing sales for 12+ years — I know exactly what works and what doesn't. I'll build it the right way, end to end.</p>

<p>And honestly? I'm so confident in this that <strong>I guarantee your first client will come sooner than you expect.</strong></p>

<p style="margin:32px 0;"><a href="https://intentsly.com/billing" style="background:#000;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">Activate with 40% OFF →</a></p>

<p>If you have any questions or want to chat first, just reply to this email — it goes straight to me.</p>

<p>Talk soon,<br/>Alex<br/><span style="color:#666;font-size:14px;">Founder, Intentsly</span></p>
</body></html>`;
}

function extractFirstName(row: {
  meta_first_name: string | null;
  linkedin_display_name: string | null;
  email: string;
}): string {
  const candidate =
    (row.meta_first_name && row.meta_first_name.trim()) ||
    (row.linkedin_display_name && row.linkedin_display_name.trim().split(/\s+/)[0]) ||
    row.email.split("@")[0];
  // Capitalise first letter, keep rest as-is.
  return candidate.charAt(0).toUpperCase() + candidate.slice(1);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");

    // Optional dry-run mode for testing
    let dryRun = false;
    if (req.method === "POST") {
      try {
        const body = await req.json();
        dryRun = body?.dry_run === true;
      } catch {
        // no body, ignore
      }
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false },
    });

    // Pull all auth users created on/after the cutoff. (Paginated.)
    const eligible: Array<{
      user_id: string;
      email: string;
      first_name: string;
    }> = [];

    let page = 1;
    const perPage = 1000;
    while (true) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
      if (error) throw error;
      const users = data?.users ?? [];
      if (users.length === 0) break;

      for (const u of users) {
        if (!u.email) continue;
        if (!u.created_at) continue;
        if (new Date(u.created_at) < new Date(SIGNUP_CUTOFF_ISO)) continue;

        // 1. Profile exists + last_seen_at is on a later DAY than signup.
        const { data: profile } = await admin
          .from("profiles")
          .select("user_id, last_seen_at, current_organization_id")
          .eq("user_id", u.id)
          .maybeSingle();
        if (!profile?.last_seen_at) continue;

        const signupDate = new Date(u.created_at).toISOString().slice(0, 10);
        const lastSeenDate = new Date(profile.last_seen_at)
          .toISOString()
          .slice(0, 10);
        if (lastSeenDate <= signupDate) continue;

        // 2. Has at least one signal agent.
        const { count: agentCount } = await admin
          .from("signal_agents")
          .select("id", { count: "exact", head: true })
          .eq("user_id", u.id);
        if (!agentCount || agentCount < 1) continue;

        // 3. Org plan is still 'free' (no active subscription).
        if (!profile.current_organization_id) continue;
        const { data: org } = await admin
          .from("organizations")
          .select("plan")
          .eq("id", profile.current_organization_id)
          .maybeSingle();
        if (!org || org.plan !== "free") continue;

        // 4. Not already emailed.
        const { data: alreadySent } = await admin
          .from("discount40_email_log")
          .select("user_id")
          .eq("user_id", u.id)
          .maybeSingle();
        if (alreadySent) continue;

        const meta = (u.user_metadata ?? {}) as Record<string, unknown>;
        const firstName = extractFirstName({
          meta_first_name:
            (meta.first_name as string | undefined) ??
            (meta.full_name as string | undefined)?.split(/\s+/)[0] ??
            (meta.name as string | undefined)?.split(/\s+/)[0] ??
            null,
          linkedin_display_name: null,
          email: u.email,
        });

        eligible.push({
          user_id: u.id,
          email: u.email,
          first_name: firstName,
        });
      }

      if (users.length < perPage) break;
      page += 1;
    }

    console.log(
      `[discount40-winback] eligible=${eligible.length} dryRun=${dryRun}`
    );

    if (dryRun) {
      return new Response(
        JSON.stringify({ success: true, dry_run: true, eligible }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const sent: Array<{ email: string; id?: string }> = [];
    const failed: Array<{ email: string; error: string }> = [];
    const skipped: Array<{ email: string; reason: string }> = [];

    for (const r of eligible) {
      try {
        // CRITICAL: Reserve this user FIRST by inserting the log row.
        // The DB has a UNIQUE index on user_id, so if another concurrent run
        // already inserted (or this user was emailed previously), this throws
        // and we skip — guaranteeing one-email-per-user-forever, even under
        // overlapping cron invocations or retries.
        const { error: reserveErr } = await admin
          .from("discount40_email_log")
          .insert({
            user_id: r.user_id,
            email: r.email,
            first_name: r.first_name,
          });

        if (reserveErr) {
          // Unique violation = already sent (or being sent). Safe to skip.
          skipped.push({
            email: r.email,
            reason: reserveErr.message,
          });
          continue;
        }

        const resp = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: FROM_ADDRESS,
            to: [r.email],
            subject: buildSubject(r.first_name),
            html: buildHtml(r.first_name),
          }),
        });
        const json = await resp.json();
        if (!resp.ok) {
          // Roll back the reservation so the user can be retried on the
          // next cron tick (e.g. transient Resend outage).
          await admin
            .from("discount40_email_log")
            .delete()
            .eq("user_id", r.user_id);
          failed.push({
            email: r.email,
            error: `Resend ${resp.status}: ${JSON.stringify(json)}`,
          });
          continue;
        }

        sent.push({ email: r.email, id: json?.id });

        // Small spacing between sends to be gentle on Resend rate limits.
        await new Promise((res) => setTimeout(res, 300));
      } catch (e) {
        failed.push({
          email: r.email,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        eligible: eligible.length,
        sent: sent.length,
        failed: failed.length,
        details: { sent, failed },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[discount40-winback] error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

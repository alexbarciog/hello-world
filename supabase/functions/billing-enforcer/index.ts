// Runs every 15 minutes (pg_cron). Two jobs, both idempotent:
//  1. End trials early once the account has received its trial signal cap
//     (Stripe bills the card immediately: trial_end = now).
//  2. Read-only mode: pause signal agents and campaigns of accounts that have
//     no access (past_due, canceled, expired legacy, never checked out).
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { trialCapReached } from "../_shared/billing.ts";
import { accessForUsers, countTrialSignals, pauseAccount } from "../_shared/account-access.ts";
import { PAYMENTS_ENABLED } from "../_shared/payments-policy.ts";
import { json, stripeClient } from "../_shared/stripe.ts";

Deno.serve(async () => {
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
  const summary = { trials_ended: 0, accounts_paused: 0, errors: [] as string[] };

  try {
    // ── 1. Trial signal cap ──
    if (PAYMENTS_ENABLED) {
      const { data: cap } = await db.from("plan_limits").select("value").eq("key", "trial_signal_cap").maybeSingle();
      const signalCap = cap?.value ?? 0;
      const { data: trialing } = await db
        .from("profiles")
        .select("user_id, current_organization_id, subscription_id, trial_started_at")
        .eq("subscription_status", "trialing")
        .not("subscription_id", "is", null);
      if (signalCap > 0 && trialing?.length) {
        const stripe = stripeClient();
        for (const p of trialing) {
          try {
            const delivered = await countTrialSignals(db, p.user_id, p.current_organization_id, p.trial_started_at);
            if (!trialCapReached(delivered, signalCap)) continue;
            await stripe.subscriptions.update(p.subscription_id, { trial_end: "now" });
            summary.trials_ended++;
            console.log(`[billing-enforcer] trial ended early for ${p.user_id}: ${delivered}/${signalCap} signals`);
            // stripe-webhook records the new status from customer.subscription.updated.
          } catch (e) {
            summary.errors.push(`trial ${p.user_id}: ${e instanceof Error ? e.message : e}`);
          }
        }
      }
    }

    // ── 2. Read-only mode ──
    const [{ data: agents }, { data: campaigns }] = await Promise.all([
      db.from("signal_agents").select("user_id").eq("status", "active"),
      db.from("campaigns").select("user_id").eq("status", "active"),
    ]);
    const running = [...new Set([...(agents ?? []), ...(campaigns ?? [])].map((r: { user_id: string }) => r.user_id))];
    const access = await accessForUsers(db, running);
    for (const userId of running) {
      if (access.get(userId) !== "none") continue;
      const paused = await pauseAccount(db, userId);
      if (paused.agents || paused.campaigns) {
        summary.accounts_paused++;
        console.log(`[billing-enforcer] paused ${userId}: ${paused.agents} agents, ${paused.campaigns} campaigns`);
      }
    }

    return json(summary);
  } catch (e) {
    console.error("[billing-enforcer]", e);
    return json({ ...summary, error: e instanceof Error ? e.message : String(e) }, 500);
  }
});

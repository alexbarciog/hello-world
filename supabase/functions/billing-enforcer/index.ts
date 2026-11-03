// Runs every 15 minutes (pg_cron). Read-only mode: pauses signal agents and
// campaigns of accounts that have no access (payment failed, canceled,
// expired, or never subscribed once Creem is live). Idempotent.
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { accessForUsers, pauseAccount } from "../_shared/account-access.ts";
import { json } from "../_shared/stripe.ts";

Deno.serve(async () => {
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
  const summary = { accounts_paused: 0 };

  try {
    // ── Read-only mode ──
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

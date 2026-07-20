import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getLinkedInBudget, recordLinkedInAction, humanDelay } from "../_shared/linkedin-budget.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const UNIPILE_DSN = Deno.env.get("UNIPILE_DSN")!;
const UNIPILE_API_KEY = Deno.env.get("UNIPILE_API_KEY")!;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function resolveSocialPostId(accountId: string, postId: string) {
  if (postId.startsWith("urn:li:")) return postId;
  try {
    const r = await fetch(`https://${UNIPILE_DSN}/api/v1/posts/${encodeURIComponent(postId)}?account_id=${encodeURIComponent(accountId)}`, {
      headers: { "X-API-KEY": UNIPILE_API_KEY, accept: "application/json" },
    });
    if (!r.ok) return postId;
    const d = await r.json();
    return d?.social_id || d?.id || postId;
  } catch {
    return postId;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const nowIso = new Date().toISOString();

    // Pick due comments (approved, or drafted when spike doesn't require approval).
    // Also retry the prior Unipile schema failure caused by sending account_id as a query param.
    const { data: due } = await admin.from("engagement_spike_comments")
      .select("*, engagement_spikes!inner(id, user_id, status, require_approval)")
      .lte("scheduled_drop_at", nowIso)
      .in("status", ["approved", "drafted", "failed"])
      .limit(50);

    let sent = 0, failed = 0;
    // Per-user LinkedIn budget cache — comments count against the shared
    // engagement pool. Exhausted users' rows stay pending for the next run.
    const budgetByUser = new Map<string, boolean>();
    for (const row of due || []) {
      const spike = (row as any).engagement_spikes;
      if (!spike || spike.status === "cancelled" || spike.status === "failed") continue;
      if (!budgetByUser.has(row.user_id)) {
        const verdict = await getLinkedInBudget(admin, row.user_id, "comment");
        budgetByUser.set(row.user_id, verdict.allowed);
        if (!verdict.allowed) console.log(`[spikes] user ${row.user_id} deferred: ${verdict.reason}`);
      }
      if (!budgetByUser.get(row.user_id)) continue; // retry next run
      if (row.status === "failed" && !String(row.error || "").includes("/account_id")) continue;
      // If spike requires approval, only send approved
      if (spike.require_approval && row.status !== "approved" && row.status !== "failed") continue;
      if (!row.comment_text || !row.post_id) {
        await admin.from("engagement_spike_comments").update({ status: "skipped", error: "missing text or post_id" }).eq("id", row.id);
        continue;
      }
      // Get user's unipile id
      const { data: profile } = await admin.from("profiles")
        .select("unipile_account_id").eq("user_id", row.user_id).maybeSingle();
      const accountId = profile?.unipile_account_id;
      if (!accountId) {
        await admin.from("engagement_spike_comments").update({ status: "failed", error: "no unipile account" }).eq("id", row.id);
        failed++; continue;
      }
      // Mark spike running
      if (spike.status !== "running") {
        await admin.from("engagement_spikes").update({ status: "running" }).eq("id", spike.id);
      }
      const socialPostId = await resolveSocialPostId(accountId, row.post_id);
      const url = `https://${UNIPILE_DSN}/api/v1/posts/${encodeURIComponent(socialPostId)}/comments`;
      const r = await fetch(url, {
        method: "POST",
        headers: { "X-API-KEY": UNIPILE_API_KEY, "Content-Type": "application/json", accept: "application/json" },
        body: JSON.stringify({ account_id: accountId, text: row.comment_text }),
      });
      const text = await r.text();
      if (r.ok) {
        let payload: any = {}; try { payload = JSON.parse(text); } catch {}
        await admin.from("engagement_spike_comments").update({
          status: "sent",
          sent_at: new Date().toISOString(),
          unipile_comment_id: payload?.id || payload?.comment_id || null,
        }).eq("id", row.id);
        sent++;
        await recordLinkedInAction(admin, row.user_id, accountId, "comment");
        // Re-evaluate budget after each send so a run can't blow past the cap
        const verdict = await getLinkedInBudget(admin, row.user_id, "comment");
        budgetByUser.set(row.user_id, verdict.allowed);
        await humanDelay(6000, 18000);
      } else {
        console.error("comment post failed", r.status, text);
        await admin.from("engagement_spike_comments").update({
          status: "failed", error: `Unipile ${r.status}: ${text.slice(0, 200)}`,
        }).eq("id", row.id);
        failed++;
      }
    }

    // Mark complete spikes whose every comment is in a terminal state and scheduled_for has passed
    const { data: maybeDone } = await admin.from("engagement_spikes")
      .select("id, scheduled_for")
      .in("status", ["running", "ready"])
      .lt("scheduled_for", nowIso);
    for (const s of maybeDone || []) {
      const { data: pending } = await admin.from("engagement_spike_comments")
        .select("id", { count: "exact", head: true })
        .eq("spike_id", s.id)
        .in("status", ["approved", "drafted"]);
      const pendCount = (pending as any)?.length ?? 0;
      // Use count via head — fallback: separate query
      const { count } = await admin.from("engagement_spike_comments")
        .select("id", { count: "exact", head: true })
        .eq("spike_id", s.id)
        .in("status", ["approved", "drafted"]);
      if ((count ?? pendCount) === 0) {
        await admin.from("engagement_spikes").update({ status: "completed" }).eq("id", s.id);
      }
    }

    return json({ ok: true, sent, failed });
  } catch (e) {
    console.error("process-engagement-spikes error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});

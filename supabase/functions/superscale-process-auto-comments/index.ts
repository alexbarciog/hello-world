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

function json(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

async function fetchPostStats(accountId: string, postId: string) {
  // Unipile: GET /api/v1/posts/{post_id}?account_id=...
  try {
    const r = await fetch(`https://${UNIPILE_DSN}/api/v1/posts/${encodeURIComponent(postId)}?account_id=${encodeURIComponent(accountId)}`, {
      headers: { "X-API-KEY": UNIPILE_API_KEY, accept: "application/json" },
    });
    if (!r.ok) {
      console.error("[auto-comment] post stats fetch failed", r.status, await r.text());
      return null;
    }
    const d = await r.json();
    const likes = Number(d?.reaction_counter ?? d?.reactions ?? d?.likes ?? d?.like_count ?? 0);
    const comments = Number(d?.comment_counter ?? d?.comments ?? d?.comment_count ?? 0);
    return { likes, comments };
  } catch (e) {
    console.error("[auto-comment] stats error", e);
    return null;
  }
}

async function resolveSocialPostId(accountId: string, postId: string) {
  if (postId.startsWith("urn:li:")) return postId;
  try {
    const r = await fetch(`https://${UNIPILE_DSN}/api/v1/posts/${encodeURIComponent(postId)}?account_id=${encodeURIComponent(accountId)}`, {
      headers: { "X-API-KEY": UNIPILE_API_KEY, accept: "application/json" },
    });
    if (!r.ok) {
      console.error("[auto-comment] post resolve failed", r.status, await r.text());
      return postId;
    }
    const d = await r.json();
    return d?.social_id || d?.id || postId;
  } catch (e) {
    console.error("[auto-comment] post resolve error", e);
    return postId;
  }
}

async function postComment(accountId: string, postId: string, text: string) {
  const socialPostId = await resolveSocialPostId(accountId, postId);
  const url = `https://${UNIPILE_DSN}/api/v1/posts/${encodeURIComponent(socialPostId)}/comments`;
  const r = await fetch(url, {
    method: "POST",
    headers: { "X-API-KEY": UNIPILE_API_KEY, "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify({ account_id: accountId, text }),
  });
  const t = await r.text();
  console.log("[auto-comment] unipile response", r.status, socialPostId, t.slice(0, 400));
  return { ok: r.ok, status: r.status, text: t, socialPostId };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: posts } = await admin
      .from("linkedin_posts")
      .select("id,user_id,unipile_post_id,posted_at,auto_comment_text,auto_comment_trigger,auto_comment_threshold")
      .eq("status", "posted")
      .eq("auto_comment_enabled", true)
      .is("auto_comment_posted_at", null)
      .not("unipile_post_id", "is", null)
      .not("posted_at", "is", null)
      .limit(50);

    const results: any[] = [];
    for (const p of posts || []) {
      if (!p.auto_comment_text || !p.auto_comment_trigger || p.auto_comment_threshold == null) {
        results.push({ id: p.id, skipped: "incomplete_config" });
        continue;
      }

      const { data: prof } = await admin.from("profiles")
        .select("unipile_account_id").eq("user_id", p.user_id).maybeSingle();
      const accountId = prof?.unipile_account_id;
      if (!accountId) { results.push({ id: p.id, skipped: "no_account" }); continue; }

      let shouldFire = false;
      if (p.auto_comment_trigger === "minutes") {
        const elapsed = (Date.now() - new Date(p.posted_at).getTime()) / 60000;
        shouldFire = elapsed >= Number(p.auto_comment_threshold);
      } else {
        const stats = await fetchPostStats(accountId, p.unipile_post_id);
        if (!stats) { results.push({ id: p.id, skipped: "stats_failed" }); continue; }
        if (p.auto_comment_trigger === "likes") shouldFire = stats.likes >= Number(p.auto_comment_threshold);
        else if (p.auto_comment_trigger === "comments") shouldFire = stats.comments >= Number(p.auto_comment_threshold);
      }

      if (!shouldFire) { results.push({ id: p.id, waiting: true }); continue; }

      // LinkedIn safety budget — deferred posts retry on the next cron run.
      const budget = await getLinkedInBudget(admin, p.user_id, "comment");
      if (!budget.allowed) { results.push({ id: p.id, deferred: budget.reason }); continue; }

      await humanDelay(3000, 9000);
      const r = await postComment(accountId, p.unipile_post_id, p.auto_comment_text);
      if (r.ok) {
        await admin.from("linkedin_posts").update({ auto_comment_posted_at: new Date().toISOString(), unipile_post_id: r.socialPostId }).eq("id", p.id);
        await recordLinkedInAction(admin, p.user_id, accountId, "comment");
        results.push({ id: p.id, ok: true });
      } else {
        results.push({ id: p.id, ok: false, error: r.text.slice(0, 200) });
      }
    }
    return json({ ok: true, processed: (posts || []).length, results });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});

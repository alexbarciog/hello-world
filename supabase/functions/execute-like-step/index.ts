/**
 * execute-like-step
 *
 * Runtime executor for a `type: "like"` workflow step.
 * Mirrors execute-comment-step but posts a "like" reaction on the lead's
 * signal post instead of a text comment.
 *
 * Body: { request_id: string, step_index: number }
 *
 * Also supports a synchronous inline mode used by send-connection-requests
 * for pre-invitation steps: pass { inline: true, contact, account_id, step }
 * and no scheduled_messages row / request advance will be written.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const UNIPILE_API_KEY = Deno.env.get("UNIPILE_API_KEY")!;
const UNIPILE_DSN = Deno.env.get("UNIPILE_DSN")!;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isAuthoredSignal(signal: string | null | undefined): boolean {
  if (!signal) return false;
  return /^\s*posted about\b/i.test(signal);
}

function extractPostId(url: string | null | undefined): string | null {
  if (!url) return null;
  const m1 = url.match(/urn:li:(?:activity|share|ugcPost):(\d+)/i);
  if (m1) return m1[1];
  const m2 = url.match(/activity[-:_](\d{15,25})/i);
  if (m2) return m2[1];
  const m3 = url.match(/(\d{18,25})/);
  if (m3) return m3[1];
  return null;
}

async function likePost(postId: string, accountId: string): Promise<{ ok: boolean; status: number; details?: string }> {
  const res = await fetch(
    `https://${UNIPILE_DSN}/api/v1/posts/${encodeURIComponent(postId)}/reactions`,
    {
      method: "POST",
      headers: {
        "X-API-KEY": UNIPILE_API_KEY,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({ account_id: accountId, reaction_type: "like" }),
    },
  );
  if (!res.ok) {
    const details = await res.text();
    return { ok: false, status: res.status, details };
  }
  return { ok: true, status: res.status };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // ── Inline mode (pre-invitation execution) ────────────────────────────────
    if (body.inline === true) {
      const step = body.step;
      const contact = body.contact;
      const accountId = body.account_id;
      if (!step || !contact || !accountId) return json({ error: "missing inline params" }, 400);
      const postFilter = step.post_filter || "authored_only";
      if (postFilter === "authored_only" && !isAuthoredSignal(contact.signal)) {
        return json({ status: "skipped", reason: "not_authored_signal" });
      }
      const postId = extractPostId(contact.signal_post_url);
      if (!postId) return json({ status: "skipped", reason: "no_post_id" });
      const result = await likePost(postId, accountId);
      return json({ status: result.ok ? "sent" : "failed", details: result.details });
    }

    // ── Standard mode (post-invitation, called from followups) ────────────────
    const { request_id, step_index } = body;
    if (!request_id) return json({ error: "request_id required" }, 400);

    const { data: cr, error: crErr } = await supabase
      .from("campaign_connection_requests")
      .select("id, campaign_id, contact_id, user_id, current_step")
      .eq("id", request_id)
      .single();
    if (crErr || !cr) return json({ error: "request not found" }, 404);

    const { data: campaign } = await supabase
      .from("campaigns")
      .select("id, workflow_steps, user_id")
      .eq("id", cr.campaign_id)
      .single();
    if (!campaign) return json({ error: "campaign not found" }, 404);

    const steps: any[] = Array.isArray(campaign.workflow_steps) ? campaign.workflow_steps : [];
    const step = steps[step_index];
    if (!step || step.type !== "like") return json({ error: "step is not a like step" }, 400);

    const { data: contact } = await supabase
      .from("contacts")
      .select("id, first_name, signal, signal_post_url")
      .eq("id", cr.contact_id)
      .single();
    if (!contact) return json({ error: "contact not found" }, 404);

    const postFilter = step.post_filter || "authored_only";
    const authored = isAuthoredSignal(contact.signal);

    async function advance(status: "sent" | "skipped" | "failed", note: string) {
      await supabase.from("scheduled_messages").insert({
        campaign_id: campaign.id,
        contact_id: contact.id,
        connection_request_id: cr.id,
        step_index,
        action_type: "like",
        status,
        sent_at: status === "sent" ? new Date().toISOString() : null,
        message: note,
      } as any);
      if (status !== "failed") {
        const newStep = (cr.current_step || 1) + 1;
        await supabase
          .from("campaign_connection_requests")
          .update({ current_step: newStep, step_completed_at: new Date().toISOString() })
          .eq("id", cr.id);
      }
    }

    if (postFilter === "authored_only" && !authored) {
      const reason = `Signal type was "${contact.signal || "unknown"}" — like step only runs on posts written by the lead.`;
      await advance("skipped", `[SKIPPED] ${reason}`);
      return json({ status: "skipped", reason });
    }

    const postId = extractPostId(contact.signal_post_url);
    if (!postId) {
      await advance("skipped", `[SKIPPED] Could not extract post id from signal_post_url`);
      return json({ status: "skipped", reason: "no_post_id" });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("unipile_account_id")
      .eq("user_id", campaign.user_id)
      .single();
    const accountId = profile?.unipile_account_id;
    if (!accountId) return json({ status: "failed", reason: "no_unipile_account" });

    const result = await likePost(postId, accountId);
    if (!result.ok) {
      console.error(`[execute-like-step] Unipile ${result.status}: ${result.details}`);
      await advance("failed", `[FAILED ${result.status}] like`);
      return json({ status: "failed", details: result.details }, 200);
    }

    await advance("sent", "Liked post");
    return json({ status: "sent" });
  } catch (e) {
    console.error("execute-like-step error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});

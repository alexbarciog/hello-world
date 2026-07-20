/**
 * execute-comment-step
 *
 * Runtime executor for a `type: "comment"` workflow step.
 * Called by process-campaign-followups for a single connection request row
 * whose next step is a comment step.
 *
 * Behavior:
 * - If the step's post_filter === "authored_only" AND the contact's signal is
 *   not a "Posted about" signal, the step is SKIPPED (not failed):
 *     * scheduled_messages row is marked skipped with a reason
 *     * campaign_connection_requests.current_step is advanced
 *     * workflow continues to the next step
 * - Otherwise, we generate a personalized comment via Lovable AI using the
 *   lead's signal post text, then POST it to Unipile
 *   `/api/v1/posts/{post_id}/comments`.
 *
 * Body: { request_id: string, step_index: number }
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getLinkedInBudget, recordLinkedInAction, humanDelay } from "../_shared/linkedin-budget.ts";

/** Resolve the owning user for an account id (inline mode has no user_id). */
async function userForAccount(supabase: any, accountId: string): Promise<string | null> {
  const { data } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("unipile_account_id", accountId)
    .maybeSingle();
  return data?.user_id ?? null;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
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
  // Common LinkedIn post URL formats
  //  https://www.linkedin.com/posts/{slug}-activity-{id}-xxxx
  //  https://www.linkedin.com/feed/update/urn:li:activity:{id}
  //  https://www.linkedin.com/feed/update/urn:li:share:{id}
  const m1 = url.match(/urn:li:(?:activity|share|ugcPost):(\d+)/i);
  if (m1) return m1[1];
  const m2 = url.match(/activity[-:_](\d{15,25})/i);
  if (m2) return m2[1];
  const m3 = url.match(/(\d{18,25})/);
  if (m3) return m3[1];
  return null;
}

const SYSTEM = `You write LinkedIn comments that sound like a real human peer, not a marketer.

Hard rules:
- 1 to 3 sentences. Never more.
- React to ONE specific idea in the post. Reference it concretely.
- Conversational, casual, slightly imperfect. Contractions ok.
- NO greetings, NO sign-offs, NO @mentions, NO links, NO pitching.
- Banned phrases: "great post", "love this", "100%", "leverage", "synergy",
  "tech stack", "crushing it", "this!", "couldn't agree more", "well said", "🔥".
- No emoji unless the instructions explicitly ask for one.

Output ONLY the comment text. No quotes, no labels.`;

async function generateComment(instructions: string, post: string, firstName: string, company: string): Promise<string> {
  const userMsg = `The lead is ${firstName || "the author"}${company ? ` from ${company}` : ""}. Their post:
"""
${post.slice(0, 1500)}
"""

Campaign owner instructions:
${instructions}

Write the comment now.`;
  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: userMsg },
      ],
    }),
  });
  if (!r.ok) {
    throw new Error(`AI generation failed [${r.status}]: ${await r.text()}`);
  }
  const d = await r.json();
  return (d?.choices?.[0]?.message?.content || "").trim().replace(/^["']|["']$/g, "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // ── Inline mode (pre-invitation execution from send-connection-requests) ──
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

      // LinkedIn safety budget (likes+comments share the engagement pool)
      const inlineUserId = await userForAccount(supabase, accountId);
      if (inlineUserId) {
        const budget = await getLinkedInBudget(supabase, inlineUserId, "comment");
        if (!budget.allowed) return json({ status: "skipped", reason: `budget: ${budget.reason}` });
      }

      const postText = (contact.signal || "").replace(/^posted about\s*/i, "").slice(0, 1500);
      let comment = "";
      try {
        comment = await generateComment(
          step.ai_instructions || "Write a helpful, human comment that adds value. End with a light question.",
          postText,
          contact.first_name || "",
          contact.company || "",
        );
      } catch (e) {
        console.error("[execute-comment-step] inline generation failed:", e);
        return json({ status: "failed", reason: "generation_failed" });
      }
      if (!comment) return json({ status: "failed", reason: "empty_generation" });

      await humanDelay(3000, 10000);
      const postRes = await fetch(
        `https://${UNIPILE_DSN}/api/v1/posts/${encodeURIComponent(postId)}/comments`,
        {
          method: "POST",
          headers: {
            "X-API-KEY": UNIPILE_API_KEY,
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify({ account_id: accountId, text: comment }),
        },
      );
      if (!postRes.ok) {
        const details = await postRes.text();
        console.error(`[execute-comment-step] inline Unipile ${postRes.status}: ${details}`);
        return json({ status: "failed", details });
      }
      if (inlineUserId) await recordLinkedInAction(supabase, inlineUserId, accountId, "comment");
      return json({ status: "sent", comment });
    }

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
    if (!step || step.type !== "comment") return json({ error: "step is not a comment step" }, 400);

    const { data: contact } = await supabase
      .from("contacts")
      .select("id, first_name, company, signal, signal_post_url")
      .eq("id", cr.contact_id)
      .single();
    if (!contact) return json({ error: "contact not found" }, 404);

    const postFilter = step.post_filter || "authored_only";
    const authored = isAuthoredSignal(contact.signal);

    // ─── SKIP path ───────────────────────────────────────────────────────────
    if (postFilter === "authored_only" && !authored) {
      const reason = `Signal type was "${contact.signal || "unknown"}" — step only runs on posts written by the lead.`;
      await supabase.from("scheduled_messages").insert({
        campaign_id: campaign.id,
        contact_id: contact.id,
        connection_request_id: cr.id,
        step_index,
        action_type: "comment",
        status: "skipped",
        message: `[SKIPPED] ${reason}`,
      } as any);

      const newStep = (cr.current_step || 1) + 1;
      await supabase
        .from("campaign_connection_requests")
        .update({
          current_step: newStep,
          step_completed_at: new Date().toISOString(),
        })
        .eq("id", cr.id);

      console.log(`[execute-comment-step] SKIP req=${cr.id} — ${reason}`);
      return json({ status: "skipped", reason });
    }

    // ─── EXECUTE path ────────────────────────────────────────────────────────
    const postId = extractPostId(contact.signal_post_url);
    if (!postId) {
      await supabase.from("scheduled_messages").insert({
        campaign_id: campaign.id,
        contact_id: contact.id,
        connection_request_id: cr.id,
        step_index,
        action_type: "comment",
        status: "failed",
        message: `[FAILED] Could not extract LinkedIn post id from signal_post_url`,
      } as any);
      return json({ status: "failed", reason: "no_post_id" });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("unipile_account_id")
      .eq("user_id", campaign.user_id)
      .single();
    const accountId = profile?.unipile_account_id;
    if (!accountId) return json({ status: "failed", reason: "no_unipile_account" });

    // LinkedIn safety budget — when exhausted, DON'T advance the step; the
    // followup engine retries on a later run once budget is available.
    const budget = await getLinkedInBudget(supabase, campaign.user_id, "comment");
    if (!budget.allowed) {
      console.log(`[execute-comment-step] deferred: ${budget.reason}`);
      return json({ status: "deferred", reason: budget.reason });
    }

    const postText = (contact.signal || "").replace(/^posted about\s*/i, "").slice(0, 1500);
    const comment = await generateComment(
      step.ai_instructions || "Write a helpful, human comment that adds value. End with a light question.",
      postText,
      contact.first_name || "",
      contact.company || "",
    );

    if (!comment) {
      return json({ status: "failed", reason: "empty_generation" });
    }

    await humanDelay(3000, 10000);
    const postRes = await fetch(
      `https://${UNIPILE_DSN}/api/v1/posts/${encodeURIComponent(postId)}/comments`,
      {
        method: "POST",
        headers: {
          "X-API-KEY": UNIPILE_API_KEY,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ account_id: accountId, text: comment }),
      },
    );

    if (!postRes.ok) {
      const details = await postRes.text();
      console.error(`[execute-comment-step] Unipile ${postRes.status}: ${details}`);
      await supabase.from("scheduled_messages").insert({
        campaign_id: campaign.id,
        contact_id: contact.id,
        connection_request_id: cr.id,
        step_index,
        action_type: "comment",
        status: "failed",
        message: `[FAILED ${postRes.status}] ${comment}`,
      } as any);
      return json({ status: "failed", details }, 200);
    }

    await supabase.from("scheduled_messages").insert({
      campaign_id: campaign.id,
      contact_id: contact.id,
      connection_request_id: cr.id,
      step_index,
      action_type: "comment",
      status: "sent",
      sent_at: new Date().toISOString(),
      message: comment,
    } as any);

    const newStep = (cr.current_step || 1) + 1;
    await supabase
      .from("campaign_connection_requests")
      .update({
        current_step: newStep,
        step_completed_at: new Date().toISOString(),
      })
      .eq("id", cr.id);

    await recordLinkedInAction(supabase, campaign.user_id, accountId, "comment");
    return json({ status: "sent", comment });
  } catch (e) {
    console.error("execute-comment-step error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});

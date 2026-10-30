// Emails the Intentsly team on behalf of a signed-in user. The browser can't
// hold the send-email secret, so the two app-triggered emails (new signup,
// support ticket) go through here: fixed recipients, fixed templates, user
// input escaped, sender identity taken from the session — not the request.
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { escapeHtml, sendEmail } from "../_shared/email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

// Same values as the support form (src/pages/Support.tsx).
const SUPPORT_CATEGORIES: Record<string, string> = {
  technical: "Technical Issue",
  billing: "Billing & Subscription",
  account: "Account Access",
  feature: "Feature Request",
  general: "General Inquiry",
};
const clip = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
  const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
  const { data: userData } = await db.auth.getUser(token);
  const user = userData?.user;
  if (!user?.email) return json({ error: "Not signed in" }, 401);

  const body = await req.json().catch(() => ({}));
  const meta = user.user_metadata ?? {};
  const name = escapeHtml([meta.first_name, meta.last_name].filter(Boolean).join(" ") || meta.full_name || "");
  const email = escapeHtml(user.email);

  if (body.kind === "signup") {
    // Only for brand-new accounts, so this can't be replayed as a spam relay.
    const ageMs = Date.now() - new Date(user.created_at).getTime();
    if (ageMs > 15 * 60 * 1000) return json({ skipped: "not a new account" });
    const company = escapeHtml(clip(body.company, 200));
    const invitedBy = escapeHtml(clip(body.invited_by, 200));
    const result = await sendEmail({
      to: "alex@intentsly.com",
      from: "Intentsly <noreply@intentsly.com>",
      template: "signup_notice",
      subject: `New signup: ${name || user.email} (${user.email})`.slice(0, 200),
      html: `
        <h2>New user just registered on Intentsly</h2>
        <p><strong>Name:</strong> ${name || "—"}</p>
        <p><strong>Email:</strong> ${email}</p>
        ${company ? `<p><strong>Company:</strong> ${company}</p>` : ""}
        ${invitedBy ? `<p><strong>Invited by:</strong> ${invitedBy}</p>` : ""}
        <p><strong>Signed up at:</strong> ${new Date(user.created_at).toUTCString()}</p>`,
    });
    return result.ok ? json({ success: true }) : json({ error: result.error }, 502);
  }

  if (body.kind === "support") {
    const subject = clip(body.subject, 200).trim();
    const message = clip(body.message, 5000).trim();
    const categoryLabel = SUPPORT_CATEGORIES[body.category] ?? "General Inquiry";
    if (!subject || !message) return json({ error: "subject and message are required" }, 400);
    const result = await sendEmail({
      to: "info@intentsly.com",
      from: "Intentsly <support@intentsly.com>",
      reply_to: user.email,
      template: "support_ticket",
      subject: `[Support - ${categoryLabel}] ${subject}`.slice(0, 250),
      html: `
        <h2>New Support Ticket</h2>
        <p><strong>From:</strong> ${name ? `${name} · ` : ""}${email}</p>
        <p><strong>Category:</strong> ${categoryLabel}</p>
        <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
        <hr />
        <p>${escapeHtml(message).replace(/\n/g, "<br />")}</p>`,
    });
    return result.ok ? json({ success: true }) : json({ error: result.error }, 502);
  }

  return json({ error: "unknown kind" }, 400);
});

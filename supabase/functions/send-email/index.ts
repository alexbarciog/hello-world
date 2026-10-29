// The only gateway to Resend for app email. Callers must prove they are
// server-side: either the x-send-secret header (SEND_EMAIL_SECRET) or the
// service-role key as the bearer token. Everything else gets 401.
// Only allowlisted @intentsly.com senders; every attempt is logged to email_log.
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { checkSendAuth, normalizeFrom } from "../_shared/send-email-policy.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const auth = checkSendAuth(req.headers, {
    sendSecret: Deno.env.get("SEND_EMAIL_SECRET") ?? "",
    serviceRoleKey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  });
  if (!auth.ok) return json({ error: "unauthorized" }, 401);

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) return json({ error: "RESEND_API_KEY is not configured" }, 500);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid JSON" }, 400);
  }
  const { to, subject, html, text, reply_to, template, headers } = body as {
    to?: string | string[];
    subject?: string;
    html?: string;
    text?: string;
    reply_to?: string;
    template?: string;
    headers?: Record<string, string>;
  };
  if (!to || !subject || (!html && !text)) {
    return json({ error: "Missing required fields: to, subject, html or text" }, 400);
  }
  const from = normalizeFrom(body.from as string | undefined);
  if (!from) return json({ error: "from address not allowed" }, 400);

  const recipients = Array.isArray(to) ? to : [to];
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
  const log = (status: "sent" | "failed", resendId: string | null, error: string | null) =>
    db.from("email_log").insert({
      to: recipients.join(", "),
      from,
      template: template ?? null,
      subject,
      resend_id: resendId,
      status,
      error,
      caller: auth.via,
    }).then(({ error: logErr }) => {
      if (logErr) console.error("[send-email] email_log insert failed:", logErr.message);
    });

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: recipients,
        subject,
        ...(html ? { html } : {}),
        ...(text ? { text } : {}),
        ...(reply_to ? { reply_to } : {}),
        ...(headers ? { headers } : {}),
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      const message = `Resend API error [${response.status}]: ${JSON.stringify(data)}`;
      await log("failed", null, message);
      return json({ success: false, error: message }, 502);
    }
    await log("sent", data.id ?? null, null);
    return json({ success: true, id: data.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await log("failed", null, message);
    console.error("[send-email]", message);
    return json({ success: false, error: message }, 500);
  }
});

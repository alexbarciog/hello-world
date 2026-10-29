// Server-side helper: send an email through the send-email function, which
// enforces the sender allowlist and writes email_log. Use this instead of
// calling Resend directly.
export interface OutgoingEmail {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  reply_to?: string;
  /** Short name for email_log, e.g. "signup_notice". */
  template?: string;
  headers?: Record<string, string>;
}

export async function sendEmail(email: OutgoingEmail): Promise<{ ok: boolean; id?: string; error?: string }> {
  const secret = Deno.env.get("SEND_EMAIL_SECRET");
  const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-email`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(secret
        ? { "x-send-secret": secret }
        : { Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` }),
    },
    body: JSON.stringify(email),
  });
  const data = await res.json().catch(() => ({}));
  return res.ok ? { ok: true, id: data.id } : { ok: false, error: data.error || `send-email ${res.status}` };
}

export const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

// Send a single email via SMTP using denomailer.
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';

export interface SmtpConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  secure: boolean; // true = TLS on connect (usually port 465); false = STARTTLS / plain (587/25)
}

export interface SendArgs {
  from: string;
  fromName?: string;
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendSmtp(cfg: SmtpConfig, msg: SendArgs): Promise<{ ok: boolean; error?: string }> {
  const client = new SMTPClient({
    connection: {
      hostname: cfg.host,
      port: cfg.port,
      tls: cfg.secure,
      auth: { username: cfg.username, password: cfg.password },
    },
  });
  try {
    await client.send({
      from: msg.fromName ? `${msg.fromName} <${msg.from}>` : msg.from,
      to: msg.to,
      subject: msg.subject,
      html: msg.html,
      replyTo: msg.replyTo,
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  } finally {
    try { await client.close(); } catch { /* ignore */ }
  }
}

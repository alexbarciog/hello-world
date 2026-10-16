// ops-support-mail: mirrors the info@intentsly.com SpaceMail inbox into public.support_messages
// and sends replies from that same mailbox, so customers see answers from info@ and every
// reply is kept in the mailbox's Sent folder.
//
// POST {action:"sync"}                         pull new INBOX mail (IMAP, peek only: flags untouched)
// POST {action:"send", ticket_id, body_text}   reply to one inbound message (SMTP + copy to Sent)
// POST {action:"check"}                        log in to IMAP and SMTP and report, nothing else
//
// Auth: header x-ops-secret must equal public.ops_config.ops_secret.
// Secrets: SPACEMAIL_USER (e.g. info@intentsly.com), SPACEMAIL_PASSWORD.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { ImapFlow } from "npm:imapflow@1";
import { simpleParser } from "npm:mailparser@3";
import nodemailer from "npm:nodemailer@6";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MAIL_USER = Deno.env.get("SPACEMAIL_USER") || "";
const MAIL_PASS = Deno.env.get("SPACEMAIL_PASSWORD") || "";
const HOST = Deno.env.get("SPACEMAIL_HOST") || "mail.spacemail.com";
const FROM_NAME = Deno.env.get("SUPPORT_FROM_NAME") || "Intentsly";
const FIRST_SYNC_DAYS = 14;
const MAX_PER_SYNC = 50;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const imap = () =>
  new ImapFlow({ host: HOST, port: 993, secure: true, auth: { user: MAIL_USER, pass: MAIL_PASS }, logger: false });
const smtp = () =>
  nodemailer.createTransport({ host: HOST, port: 465, secure: true, auth: { user: MAIL_USER, pass: MAIL_PASS } });

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getConf(admin: any) {
  const { data } = await admin.from("ops_config").select("key, value");
  return Object.fromEntries((data ?? []).map((r: { key: string; value: string }) => [r.key, r.value]));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sync(admin: any, lastUid: number) {
  const client = imap();
  await client.connect();
  let inserted = 0;
  let maxUid = lastUid;
  const lock = await client.getMailboxLock("INBOX");
  try {
    let uids: number[];
    if (lastUid > 0) {
      uids = ((await client.search({ uid: `${lastUid + 1}:*` }, { uid: true })) || []).filter((u: number) => u > lastUid);
    } else {
      const since = new Date(Date.now() - FIRST_SYNC_DAYS * 864e5);
      uids = (await client.search({ since }, { uid: true })) || [];
    }
    uids = uids.sort((a, b) => a - b).slice(0, MAX_PER_SYNC);
    if (uids.length) {
      for await (const msg of client.fetch(uids, { uid: true, source: true }, { uid: true })) {
        maxUid = Math.max(maxUid, msg.uid);
        const p = await simpleParser(msg.source);
        const from = p.from?.value?.[0];
        const text = (p.text || "").slice(0, 20000);
        let replyTo = p.replyTo?.value?.[0]?.address || from?.address || null;
        // In-app ticket form: sent from noreply@ with the user's address in the body ("From: user@x").
        if (/^\[Support - /i.test(p.subject || "")) {
          const m = text.match(/From:\s*([^\s<]+@[^\s>]+)/i) || text.match(EMAIL_RE);
          if (m) replyTo = (m[1] || m[0]).trim();
        }
        const refs = Array.isArray(p.references) ? p.references.join(" ") : (p.references || null);
        const row = {
          message_id: p.messageId || `uid-${msg.uid}@${HOST}`,
          imap_uid: msg.uid,
          direction: "in",
          from_email: from?.address || null,
          from_name: from?.name || null,
          reply_to_email: replyTo,
          to_email: Array.isArray(p.to) ? p.to[0]?.value?.[0]?.address : p.to?.value?.[0]?.address,
          subject: p.subject || "(no subject)",
          body_text: text,
          in_reply_to: p.inReplyTo || null,
          references_header: refs,
          received_at: (p.date || new Date()).toISOString(),
        };
        const { error } = await admin.from("support_messages").upsert(row, { onConflict: "message_id", ignoreDuplicates: true });
        if (!error) inserted++;
      }
    }
  } finally {
    lock.release();
    await client.logout().catch(() => {});
  }
  if (maxUid > lastUid) {
    await admin.from("ops_config").upsert({ key: "support_last_uid", value: String(maxUid), updated_at: new Date().toISOString() });
  }
  return { inserted, last_uid: maxUid };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function send(admin: any, ticketId: string, bodyText: string) {
  const { data: t } = await admin.from("support_messages").select("*").eq("id", ticketId).eq("direction", "in").maybeSingle();
  if (!t) throw new Error("ticket not found");
  if (["answered", "ignored"].includes(t.status)) throw new Error(`ticket already ${t.status}`);
  const to = t.reply_to_email || t.from_email;
  if (!to || !EMAIL_RE.test(to)) throw new Error("ticket has no valid reply address");
  if (to.toLowerCase().endsWith("@intentsly.com")) throw new Error("refusing to reply to an intentsly.com address");
  if (!bodyText || bodyText.trim().length < 20) throw new Error("reply too short");

  const baseSubject = String(t.subject || "").replace(/^\[Support - [^\]]*\]\s*/i, "");
  const subject = /^re:/i.test(baseSubject) ? baseSubject : `Re: ${baseSubject}`.trim();
  const references = [t.references_header, t.message_id].filter(Boolean).join(" ") || undefined;
  const mail = {
    from: { name: FROM_NAME, address: MAIL_USER },
    to,
    subject,
    text: bodyText,
    inReplyTo: t.message_id || undefined,
    references,
  };

  // Build the raw message once so the copy in Sent is byte-identical to what was delivered.
  const built = await nodemailer.createTransport({ streamTransport: true, buffer: true }).sendMail(mail);
  const raw = built.message as Uint8Array;
  const info = await smtp().sendMail({ envelope: { from: MAIL_USER, to: [to] }, raw });

  // Best effort: keep a copy in the mailbox's Sent folder.
  try {
    const client = imap();
    await client.connect();
    const boxes = await client.list();
    const sent = boxes.find((b: { specialUse?: string }) => b.specialUse === "\\Sent")?.path || "Sent";
    await client.append(sent, raw, ["\\Seen"]);
    await client.logout();
  } catch (e) {
    console.error("append to Sent failed", e);
  }

  const now = new Date().toISOString();
  await admin.from("support_messages").insert({
    message_id: info.messageId || built.messageId,
    direction: "out",
    from_email: MAIL_USER,
    to_email: to,
    subject,
    body_text: bodyText,
    in_reply_to: t.message_id,
    references_header: references,
    received_at: now,
    status: "sent",
    answer_to: t.id,
  });
  await admin.from("support_messages").update({ status: "answered", handled_at: now }).eq("id", t.id);
  return { sent_to: to, message_id: info.messageId };
}

Deno.serve(async (req) => {
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const conf = await getConf(admin);
  if (!conf.ops_secret || req.headers.get("x-ops-secret") !== conf.ops_secret) return json({ error: "Unauthorized" }, 401);
  if (!MAIL_USER || !MAIL_PASS) return json({ ok: false, error: "SPACEMAIL_USER / SPACEMAIL_PASSWORD not set" }, 200);

  const body = await req.json().catch(() => ({}));
  try {
    if (body.action === "sync") return json({ ok: true, ...(await sync(admin, Number(conf.support_last_uid || 0))) });
    if (body.action === "send") return json({ ok: true, ...(await send(admin, String(body.ticket_id || ""), String(body.body_text || ""))) });
    if (body.action === "check") {
      const c = imap();
      await c.connect();
      const status = await c.status("INBOX", { messages: true, unseen: true });
      await c.logout();
      await smtp().verify();
      return json({ ok: true, inbox: status });
    }
    return json({ error: "unknown action" }, 400);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("ops-support-mail", body.action, msg);
    return json({ ok: false, error: msg.slice(0, 400) }, 500);
  }
});

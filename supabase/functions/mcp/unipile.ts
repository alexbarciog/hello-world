// Thin Unipile client for the MCP server: the same calls the app's LinkedIn
// senders make (process-campaign-followups, linkedin-messaging).

export interface Unipile {
  dsn: string;
  apiKey: string;
  accountId: string;
}

export class UnipileError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function call(u: Unipile, path: string, init: RequestInit = {}): Promise<any> {
  const res = await fetch(`https://${u.dsn}/api/v1${path}`, {
    ...init,
    headers: {
      'X-API-KEY': u.apiKey,
      'Accept': 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new UnipileError(res.status, `LinkedIn provider error ${res.status}${text ? `: ${text.slice(0, 200)}` : ''}`);
  }
  return res.json().catch(() => ({}));
}

function items(data: any): any[] {
  const list = data?.items || data?.data || (Array.isArray(data) ? data : []);
  return Array.isArray(list) ? list : [];
}

export function isFromMe(msg: any): boolean {
  const v = msg?.is_sender ?? msg?.from_me;
  return v === true || v === 1 || v === 'true' || v === '1' ||
    msg?.direction === 'outbound' || msg?.direction === 'outgoing';
}

export function messageTime(msg: any): string | null {
  return msg?.timestamp || msg?.date || msg?.created_at || null;
}

export function linkedinIdFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(/linkedin\.com\/in\/([^/?#]+)/);
  if (!m) return null;
  try { return decodeURIComponent(m[1]); } catch { return m[1]; }
}

/** LinkedIn public identifier or URL slug → Unipile provider id. */
export async function resolveProviderId(u: Unipile, publicId: string): Promise<string | null> {
  try {
    const data = await call(u, `/users/${encodeURIComponent(publicId)}?account_id=${encodeURIComponent(u.accountId)}`);
    return data?.provider_id || null;
  } catch {
    return null;
  }
}

export async function listChats(u: Unipile, limit: number): Promise<any[]> {
  const q = new URLSearchParams({ account_id: u.accountId, limit: String(limit) });
  return items(await call(u, `/chats?${q}`));
}

export async function findChatWith(u: Unipile, providerId: string): Promise<string | null> {
  const q = new URLSearchParams({ account_id: u.accountId, attendee_provider_id: providerId, limit: '1' });
  try {
    const chat = items(await call(u, `/chats?${q}`))[0];
    if (!chat) return null;
    const matches = chat.attendee_provider_id === providerId ||
      (Array.isArray(chat.attendees) && chat.attendees.some((a: any) => a?.provider_id === providerId));
    return matches ? (chat.id || chat.chat_id || null) : null;
  } catch {
    return null;
  }
}

export async function getMessages(u: Unipile, chatId: string, limit: number): Promise<any[]> {
  return items(await call(u, `/chats/${encodeURIComponent(chatId)}/messages?limit=${limit}`));
}

export async function sendToChat(u: Unipile, chatId: string, text: string): Promise<void> {
  await call(u, `/chats/${encodeURIComponent(chatId)}/messages`, { method: 'POST', body: JSON.stringify({ text }) });
}

/** Opens (or reuses) the 1:1 conversation with a LinkedIn member and sends the first message. */
export async function startChat(u: Unipile, providerId: string, text: string): Promise<string | null> {
  const data = await call(u, '/chats', {
    method: 'POST',
    body: JSON.stringify({ account_id: u.accountId, attendees_ids: [providerId], text }),
  });
  return data?.chat_id || data?.id || null;
}

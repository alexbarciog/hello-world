const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const profileCache = new Map<string, { name: string; avatar_url: string | null }>();

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const UNIPILE_API_KEY = Deno.env.get('UNIPILE_API_KEY');
    const UNIPILE_DSN = Deno.env.get('UNIPILE_DSN');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

    if (!UNIPILE_API_KEY || !UNIPILE_DSN || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Missing server configuration');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const userId = claimsData.claims.sub;

    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('unipile_account_id')
      .eq('user_id', userId)
      .single();

    if (profileErr || !profile?.unipile_account_id) {
      return json({ error: 'LinkedIn account not connected', code: 'NO_LINKEDIN' }, 400);
    }

    const accountId = profile.unipile_account_id;
    const body = await req.json().catch(() => ({}));
    const action = body.action;

    if (action === 'list_chats') {
      const cursor = typeof body.cursor === 'string' ? body.cursor : '';
      const limit = Math.min(Number(body.limit) || 15, 15);
      const enrich = body.enrich === true;
      const url = new URL(`https://${UNIPILE_DSN}/api/v1/chats`);
      url.searchParams.set('account_id', accountId);
      url.searchParams.set('limit', String(limit));
      if (cursor) url.searchParams.set('cursor', cursor);

      const res = await fetch(url.toString(), {
        headers: { 'X-API-KEY': UNIPILE_API_KEY, 'Accept': 'application/json' },
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error('[list_chats] Unipile error:', res.status, errText);
        throw new Error(`Unipile error: ${res.status}`);
      }

      const data = await res.json();
      const rawItems: Record<string, unknown>[] = data?.items || data?.data || (Array.isArray(data) ? data : []);

      if (rawItems.length > 0) {
        console.log('[list_chats] Raw chat sample keys:', Object.keys(rawItems[0]));
        console.log('[list_chats] Raw chat sample:', JSON.stringify(rawItems[0], null, 2));
      }

      const enriched = await Promise.all(
        rawItems.map(async (chat) => {
          const attendees = Array.isArray(chat.attendees)
            ? (chat.attendees as Array<Record<string, unknown>>)
            : [];
          const firstAttendee = attendees[0];
          const participantProviderId =
            (typeof chat.attendee_provider_id === 'string' && chat.attendee_provider_id) ||
            (typeof firstAttendee?.provider_id === 'string' && firstAttendee.provider_id) ||
            null;

          const participantProfile =
            enrich && participantProviderId
              ? await fetchParticipantProfile(participantProviderId, accountId, UNIPILE_API_KEY, UNIPILE_DSN)
              : null;

          const fetchedLastMessage =
            enrich && typeof chat.id === 'string'
              ? await fetchLatestMessage(chat.id, UNIPILE_API_KEY, UNIPILE_DSN)
              : null;

          const lastMessage = fetchedLastMessage || (isRecord(chat.last_message) ? chat.last_message : undefined);
          const displayName =
            extractDisplayName(firstAttendee) ||
            (typeof chat.name === 'string' ? sanitizeName(chat.name) : '') ||
            participantProfile?.name ||
            'LinkedIn User';
          const avatarUrl = extractAvatarUrl(firstAttendee) || participantProfile?.avatar_url || null;
          const msgText = extractMessageText(lastMessage);
          const msgTimestamp =
            extractMessageTimestamp(lastMessage) ||
            (typeof chat.timestamp === 'string' ? chat.timestamp : '') ||
            (typeof chat.updated_at === 'string' ? chat.updated_at : '');
          const isUnread =
            Number(chat.unread_count ?? 0) > 0 ||
            toBoolean(chat.unread) ||
            toBoolean(chat.is_unread);

          const normalizedAttendees = attendees.length
            ? attendees
            : participantProfile
              ? [{
                  display_name: participantProfile.name,
                  profile_picture_url: participantProfile.avatar_url,
                  provider_id: participantProviderId,
                }]
              : attendees;

          return {
            ...chat,
            attendees: normalizedAttendees,
            last_message: lastMessage ?? chat.last_message,
            _resolved_name: displayName,
            _resolved_avatar: avatarUrl,
            _resolved_msg_text: msgText,
            _resolved_msg_timestamp: msgTimestamp,
            _resolved_msg_is_sender: resolveIsSender(lastMessage),
            _is_unread: isUnread,
          };
        })
      );

      return json({ ...data, items: enriched });
    }

    if (action === 'get_messages') {
      const chatId = body.chat_id;
      if (!chatId) return json({ error: 'chat_id required' }, 400);

      const cursor = body.cursor || '';
      const limit = Math.min(body.limit || 30, 50);
      const url = new URL(`https://${UNIPILE_DSN}/api/v1/chats/${encodeURIComponent(chatId)}/messages`);
      url.searchParams.set('limit', String(limit));
      if (cursor) url.searchParams.set('cursor', cursor);

      const res = await fetch(url.toString(), {
        headers: { 'X-API-KEY': UNIPILE_API_KEY, 'Accept': 'application/json' },
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error('[get_messages] Unipile error:', res.status, errText);
        throw new Error(`Unipile error: ${res.status}`);
      }

      const data = await res.json();
      const rawItems: Record<string, unknown>[] = data?.items || data?.data || (Array.isArray(data) ? data : []);

      if (rawItems.length > 0) {
        console.log('[get_messages] Raw message sample keys:', Object.keys(rawItems[0]));
        console.log('[get_messages] Raw message sample:', JSON.stringify(rawItems[0], null, 2));
      }

      const normalizedItems = rawItems.map((msg) => {
        const isSender =
          msg.is_sender === true ||
          msg.is_sender === 1 ||
          msg.is_sender === 'true' ||
          msg.is_sender === '1' ||
          msg.from_me === true ||
          msg.from_me === 1 ||
          msg.from_me === 'true' ||
          msg.from_me === '1' ||
          (msg.direction && (msg.direction === 'outbound' || msg.direction === 'outgoing'));

        return {
          ...msg,
          is_sender: isSender,
        };
      });

      return json({ ...data, items: normalizedItems });
    }

    if (action === 'send_message') {
      const chatId = body.chat_id;
      const text = body.text;
      if (!chatId || !text?.trim()) {
        return json({ error: 'chat_id and text required' }, 400);
      }

      const res = await fetch(
        `https://${UNIPILE_DSN}/api/v1/chats/${encodeURIComponent(chatId)}/messages`,
        {
          method: 'POST',
          headers: {
            'X-API-KEY': UNIPILE_API_KEY,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ text: text.trim() }),
        }
      );

      if (!res.ok) {
        const errText = await res.text();
        console.error('[send_message] Unipile error:', res.status, errText);
        throw new Error(`Unipile error: ${res.status}`);
      }

      const data = await res.json();
      return json(data);
    }

    return json({ error: 'Invalid action. Use: list_chats, get_messages, send_message' }, 400);
  } catch (error) {
    console.error('linkedin-messaging error:', error);
    return json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toBoolean(value: unknown): boolean {
  return value === true || value === 1 || value === '1' || value === 'true';
}

function sanitizeName(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  const normalized = trimmed.toLowerCase();
  if (normalized === 'unknown' || normalized === 'linkedin user') return '';
  return trimmed;
}

function extractDisplayName(attendee?: Record<string, unknown>): string {
  if (!attendee) return '';

  const directCandidates = [attendee.display_name, attendee.name, attendee.full_name];
  for (const candidate of directCandidates) {
    if (typeof candidate === 'string') {
      const sanitized = sanitizeName(candidate);
      if (sanitized) return sanitized;
    }
  }

  const firstName = typeof attendee.first_name === 'string' ? attendee.first_name : '';
  const lastName = typeof attendee.last_name === 'string' ? attendee.last_name : '';
  return sanitizeName([firstName, lastName].filter(Boolean).join(' '));
}

function extractAvatarUrl(attendee?: Record<string, unknown>): string | null {
  if (!attendee) return null;
  const candidates = [
    attendee.profile_picture_url,
    attendee.profile_picture,
    attendee.avatar_url,
    attendee.picture_url,
    attendee.image_url,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate;
    }
  }

  return null;
}

function extractMessageText(message?: Record<string, unknown>): string {
  if (!message) return '';

  const candidates = [message.text, message.body, message.content, message.subject, message.title];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }

  const attachments = Array.isArray(message.attachments)
    ? message.attachments
    : Array.isArray(message.files)
      ? message.files
      : [];

  return attachments.length > 0 ? 'Attachment' : '';
}

function extractMessageTimestamp(message?: Record<string, unknown>): string {
  if (!message) return '';
  const candidates = [message.timestamp, message.date, message.created_at, message.updated_at];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate;
    }
  }

  return '';
}

function resolveIsSender(message?: Record<string, unknown>): boolean {
  if (!message) return false;

  return (
    toBoolean(message.is_sender) ||
    toBoolean(message.from_me) ||
    (typeof message.direction === 'string' &&
      ['outbound', 'outgoing'].includes(message.direction.toLowerCase()))
  );
}

async function fetchLatestMessage(
  chatId: string,
  apiKey: string,
  dsn: string
): Promise<Record<string, unknown> | null> {
  try {
    const url = new URL(`https://${dsn}/api/v1/chats/${encodeURIComponent(chatId)}/messages`);
    url.searchParams.set('limit', '1');

    const res = await fetch(url.toString(), {
      headers: { 'X-API-KEY': apiKey, 'Accept': 'application/json' },
    });

    if (!res.ok) {
      console.warn('[list_chats] latest message lookup failed:', res.status, 'for chat:', chatId);
      return null;
    }

    const data = await res.json();
    const items: Record<string, unknown>[] = data?.items || data?.data || (Array.isArray(data) ? data : []);
    return items[0] ?? null;
  } catch (error) {
    console.warn('[list_chats] latest message lookup error for chat:', chatId, error);
    return null;
  }
}

async function fetchParticipantProfile(
  providerId: string,
  accountId: string,
  apiKey: string,
  dsn: string
): Promise<{ name: string; avatar_url: string | null }> {
  const cached = profileCache.get(providerId);
  if (cached) return cached;

  try {
    const url = new URL(`https://${dsn}/api/v1/users/${encodeURIComponent(providerId)}`);
    url.searchParams.set('account_id', accountId);

    const res = await fetch(url.toString(), {
      headers: { 'X-API-KEY': apiKey, 'Accept': 'application/json' },
    });

    if (!res.ok) {
      console.warn('[enrichChat] user lookup failed:', res.status, 'for provider_id:', providerId);
      const fallback = { name: 'LinkedIn User', avatar_url: null };
      profileCache.set(providerId, fallback);
      return fallback;
    }

    const data = await res.json();
    const name =
      sanitizeName(data.display_name || data.name || data.full_name || '') ||
      sanitizeName([data.first_name, data.last_name].filter(Boolean).join(' ')) ||
      'LinkedIn User';
    const avatar_url =
      data.profile_picture_url ||
      data.picture_url ||
      data.avatar_url ||
      data.image_url ||
      data.profile_photo ||
      null;

    console.log('[enrichChat] profile fetched:', { providerId, name, hasAvatar: !!avatar_url });

    const result = { name, avatar_url };
    profileCache.set(providerId, result);
    return result;
  } catch (err) {
    console.error('[enrichChat] profile fetch error:', err);
    const fallback = { name: 'LinkedIn User', avatar_url: null };
    profileCache.set(providerId, fallback);
    return fallback;
  }
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

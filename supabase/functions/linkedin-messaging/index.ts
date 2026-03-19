const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Cache for user profile lookups within a single request (provider_id → profile data)
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

    // Auth
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

    // Get unipile_account_id from profile
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

    // ── list_chats ──
    if (action === 'list_chats') {
      const cursor = body.cursor || '';
      const limit = Math.min(body.limit || 15, 15);
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

      // Log first chat structure to understand available fields
      if (rawItems.length > 0) {
        console.log('[list_chats] Raw chat keys:', Object.keys(rawItems[0]));
        console.log('[list_chats] Raw chat sample:', JSON.stringify(rawItems[0], null, 2));
      }

      // Enrich chats sequentially with 500ms delay to avoid 429 rate limiting
      const enriched: Record<string, unknown>[] = [];
      for (let i = 0; i < rawItems.length; i++) {
        const enrichedChat = await enrichChat(rawItems[i], accountId, UNIPILE_API_KEY, UNIPILE_DSN);
        enriched.push(enrichedChat);
        // 1s delay between profile lookups to respect Unipile rate limits
        if (i < rawItems.length - 1) {
          await new Promise((r) => setTimeout(r, 1000));
        }
      }

      return json({ ...data, items: enriched });
    }

    // ── get_messages ──
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

      // Log first message structure for debugging
      if (rawItems.length > 0) {
        console.log('[get_messages] Raw message sample keys:', Object.keys(rawItems[0]));
        console.log('[get_messages] Raw message sample:', JSON.stringify(rawItems[0], null, 2));
      }

      // Normalize is_sender field across different Unipile response formats
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

    // ── send_message ──
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

/* ── Enrich a single chat with participant name/photo and last message ── */

async function enrichChat(
  chat: Record<string, unknown>,
  accountId: string,
  apiKey: string,
  dsn: string
): Promise<Record<string, unknown>> {
  const attendeeProviderId = chat.attendee_provider_id as string | undefined;

  // Try to extract name from chat data first (avoid extra API call)
  const existingAttendees = chat.attendees as Array<Record<string, unknown>> | undefined;
  const chatName = chat.name as string | undefined;

  let participantInfo: { name: string; avatar_url: string | null } | null = null;

  // Check if chat already has REAL attendee info (not the generic "LinkedIn User" fallback)
  const hasRealName = existingAttendees?.length &&
    existingAttendees[0]?.display_name &&
    (existingAttendees[0].display_name as string) !== 'LinkedIn User';

  if (hasRealName) {
    participantInfo = {
      name: existingAttendees![0].display_name as string,
      avatar_url: (existingAttendees![0].profile_picture_url as string) || null,
    };
  } else if (chatName && chatName !== 'LinkedIn User') {
    participantInfo = { name: chatName, avatar_url: null };
  } else if (attendeeProviderId) {
    // Call profile API since we only have the generic fallback name
    participantInfo = await fetchParticipantProfile(attendeeProviderId, accountId, apiKey, dsn);
  }

  return {
    ...chat,
    attendees: participantInfo
      ? [
          {
            display_name: participantInfo.name,
            profile_picture_url: participantInfo.avatar_url ?? undefined,
            provider_id: attendeeProviderId,
          },
        ]
      : [],
  };
}

/* ── Fetch participant profile from Unipile ── */

async function fetchParticipantProfile(
  providerId: string,
  accountId: string,
  apiKey: string,
  dsn: string
): Promise<{ name: string; avatar_url: string | null }> {
  // Use in-request cache to avoid duplicate lookups
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

    // Extract name from various possible fields
    const name =
      data.display_name ||
      data.name ||
      (data.first_name || data.last_name
        ? [data.first_name, data.last_name].filter(Boolean).join(' ')
        : null) ||
      data.full_name ||
      'LinkedIn User';

    // Extract avatar from various possible fields
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

/* ── Fetch latest message for a chat ── */

async function fetchLastMessage(
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
      console.warn('[enrichChat] messages lookup failed:', res.status, 'for chat:', chatId);
      return null;
    }

    const data = await res.json();
    const items: Record<string, unknown>[] = data?.items || data?.data || (Array.isArray(data) ? data : []);

    if (!items.length) return null;

    const msg = items[0];
    // Normalize to a stable shape
    return {
      text: msg.text || msg.body || msg.content || '',
      timestamp: msg.timestamp || msg.date || msg.created_at || null,
      is_sender: msg.is_sender ?? false,
    };
  } catch (err) {
    console.error('[enrichChat] last message fetch error:', err);
    return null;
  }
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

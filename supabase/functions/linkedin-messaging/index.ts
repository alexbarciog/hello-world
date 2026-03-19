const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
      const limit = Math.min(body.limit || 30, 50);
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
      return json(data);
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
      return json(data);
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

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

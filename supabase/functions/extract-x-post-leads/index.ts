import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const POST_URL_RE = /(?:x|twitter)\.com\/([A-Za-z0-9_]{1,20})\/status\/(\d{5,25})/i;

function parseName(fullName: string | null | undefined): { first: string; last: string | null } {
  const raw = (fullName || '').trim();
  if (!raw) return { first: 'Unknown', last: null };
  const parts = raw.split(/\s+/);
  return { first: parts[0], last: parts.slice(1).join(' ') || null };
}

function normalizeHandle(v: string | null | undefined): string {
  return (v || '').replace(/^@/, '').toLowerCase().trim();
}

function extractHandleFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    if (!/(?:^|\.)(x|twitter)\.com$/i.test(u.hostname)) return null;
    const seg = u.pathname.split('/').filter(Boolean)[0];
    if (!seg) return null;
    return normalizeHandle(seg);
  } catch { return null; }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const APIFY_TOKEN = Deno.env.get('APIFY_TOKEN')!;
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !APIFY_TOKEN) {
      throw new Error('Missing required environment variables');
    }

    // Auth from JWT
    const authHeader = req.headers.get('Authorization') || '';
    const jwt = authHeader.replace(/^Bearer\s+/i, '');
    if (!jwt) return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: userRes, error: userErr } = await admin.auth.getUser(jwt);
    if (userErr || !userRes?.user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const user = userRes.user;

    const body = await req.json().catch(() => ({}));
    const post_url: string = String(body.post_url || '').trim();
    const list_id: string | null = body.list_id ?? null;
    const campaign_id: string | null = body.campaign_id ?? null;
    const include_likers: boolean = body.include_likers !== false;
    const include_commenters: boolean = body.include_commenters !== false;

    const m = post_url.match(POST_URL_RE);
    if (!m) {
      return new Response(JSON.stringify({ error: 'Invalid X post URL. Expected format: https://x.com/{user}/status/{id}' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const postAuthorHandleFromUrl = normalizeHandle(m[1]);
    const tweetId = m[2];
    const canonicalUrl = `https://x.com/${m[1]}/status/${tweetId}`;

    // Resolve organization
    const { data: profile } = await admin.from('profiles').select('current_organization_id').eq('user_id', user.id).maybeSingle();
    const organization_id: string | null = profile?.current_organization_id ?? null;

    // Collect competitor handles from the user's campaigns
    const { data: userCampaigns } = await admin
      .from('campaigns')
      .select('competitor_pages')
      .eq('user_id', user.id);
    const competitorHandles = new Set<string>();
    for (const c of userCampaigns || []) {
      for (const url of ((c as any).competitor_pages || [])) {
        const h = extractHandleFromUrl(url);
        if (h) competitorHandles.add(h);
      }
    }

    console.log(`[extract-x] user=${user.id} tweet=${tweetId} competitors=${competitorHandles.size} likers=${include_likers} comments=${include_commenters}`);

    // 1) Fetch the original post to confirm the author handle (URL is source of truth if lookup fails)
    let postAuthorHandle = postAuthorHandleFromUrl;
    try {
      const metaUrl = `https://api.apify.com/v2/acts/apidojo~tweet-scraper/run-sync-get-dataset-items?token=${APIFY_TOKEN}&maxItems=1`;
      const metaRes = await fetch(metaUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startUrls: [canonicalUrl], maxItems: 1 }),
      });
      if (metaRes.ok) {
        const arr = await metaRes.json();
        const t = Array.isArray(arr) ? arr[0] : null;
        const h = normalizeHandle(t?.user?.screen_name || t?.author?.userName || t?.author || '');
        if (h) postAuthorHandle = h;
      }
    } catch (e) { console.warn('[extract-x] post meta fetch failed', e); }

    type Engager = {
      handle: string;
      name: string | null;
      bio: string | null;
      profile_url: string;
      engagement: 'like' | 'comment';
    };
    const engagersByHandle = new Map<string, Engager>();

    // 2) Commenters — apidojo~tweet-scraper conversation_id search
    if (include_commenters) {
      try {
        const cUrl = `https://api.apify.com/v2/acts/apidojo~tweet-scraper/run-sync-get-dataset-items?token=${APIFY_TOKEN}&maxItems=200`;
        const cRes = await fetch(cUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            searchTerms: [`conversation_id:${tweetId}`],
            maxItems: 200,
            sort: 'Latest',
          }),
        });
        if (cRes.ok) {
          const replies = await cRes.json();
          if (Array.isArray(replies)) {
            for (const r of replies) {
              const u = r.user || r.author || {};
              const handle = normalizeHandle(u.screen_name || u.userName || u.username || r.screen_name || r.username);
              if (!handle) continue;
              if (handle === postAuthorHandle) continue;
              if (engagersByHandle.has(handle)) continue;
              engagersByHandle.set(handle, {
                handle,
                name: u.name || u.displayName || r.name || null,
                bio: u.description || u.bio || null,
                profile_url: `https://x.com/${handle}`,
                engagement: 'comment',
              });
            }
            console.log(`[extract-x] pulled ${replies.length} replies`);
          }
        } else {
          console.warn(`[extract-x] commenters actor ${cRes.status}: ${await cRes.text().catch(() => '')}`);
        }
      } catch (e) { console.warn('[extract-x] commenters failed', e); }
    }

    // 3) Likers — try known Apify liker actors, best-effort
    if (include_likers) {
      const likerActors = [
        'kaitoeasyapi~premium-x-tweet-liker-scraper',
        'apidojo~tweet-liker-scraper',
      ];
      let ok = false;
      for (const actor of likerActors) {
        try {
          const lUrl = `https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?token=${APIFY_TOKEN}&maxItems=200`;
          const lRes = await fetch(lUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tweetUrl: canonicalUrl, tweet_url: canonicalUrl, startUrls: [canonicalUrl], maxItems: 200 }),
          });
          if (!lRes.ok) {
            console.warn(`[extract-x] liker actor ${actor} ${lRes.status}`);
            continue;
          }
          const likers = await lRes.json();
          if (!Array.isArray(likers)) continue;
          for (const l of likers) {
            const u = l.user || l;
            const handle = normalizeHandle(u.screen_name || u.userName || u.username);
            if (!handle) continue;
            if (handle === postAuthorHandle) continue;
            if (engagersByHandle.has(handle)) continue; // commenters win
            engagersByHandle.set(handle, {
              handle,
              name: u.name || u.displayName || null,
              bio: u.description || u.bio || null,
              profile_url: `https://x.com/${handle}`,
              engagement: 'like',
            });
          }
          console.log(`[extract-x] pulled ${likers.length} likers via ${actor}`);
          ok = true;
          break;
        } catch (e) { console.warn(`[extract-x] liker actor ${actor} threw`, e); }
      }
      if (!ok) console.warn('[extract-x] no liker actor succeeded; skipping likers');
    }

    // Filter competitors
    let skipped_competitor = 0;
    const finalEngagers: Engager[] = [];
    for (const eng of engagersByHandle.values()) {
      if (competitorHandles.has(eng.handle)) { skipped_competitor++; continue; }
      finalEngagers.push(eng);
    }

    if (finalEngagers.length === 0) {
      return new Response(JSON.stringify({
        inserted: 0,
        skipped_competitor,
        skipped_duplicate: 0,
        message: 'No engagers found (or the actor returned nothing).',
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Resolve target list
    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    let listName = `Extracted from X post · ${today}`;
    let targetListId: string | null = list_id;

    if (targetListId) {
      const { data: existing } = await admin.from('lists').select('name').eq('id', targetListId).maybeSingle();
      if (existing?.name) listName = existing.name;
    } else {
      const { data: newList, error: listErr } = await admin
        .from('lists')
        .insert({ user_id: user.id, organization_id, name: listName, description: `Leads extracted from ${canonicalUrl}` } as any)
        .select('id')
        .single();
      if (listErr) throw listErr;
      targetListId = newList.id;
    }

    // Skip duplicates already in this org (by x_url)
    const xUrls = finalEngagers.map(e => e.profile_url);
    const { data: existing } = await admin
      .from('contacts')
      .select('x_url')
      .eq('organization_id', organization_id as any)
      .in('x_url', xUrls);
    const existingSet = new Set((existing || []).map((r: any) => (r.x_url || '').toLowerCase()));

    let inserted = 0;
    let skipped_duplicate = 0;
    const insertedIds: string[] = [];

    for (const eng of finalEngagers) {
      if (existingSet.has(eng.profile_url.toLowerCase())) { skipped_duplicate++; continue; }
      const { first, last } = parseName(eng.name);
      const signalLabel = eng.engagement === 'like' ? `Liked X post` : `Commented on X post`;
      const { data: row, error: insErr } = await admin.from('contacts').insert({
        user_id: user.id,
        organization_id,
        first_name: first,
        last_name: last,
        title: eng.bio ? eng.bio.slice(0, 500) : null,
        company: null,
        industry: null,
        linkedin_url: null,
        x_url: eng.profile_url,
        signal: signalLabel,
        signal_post_url: canonicalUrl,
        signal_post_excerpt: null,
        relevance_tier: 'cold',
        lead_status: 'unknown',
        approval_status: 'auto_approved',
        list_name: listName,
        source: 'x_post_extraction',
        ai_score: 1,
      } as any).select('id').single();
      if (insErr) { console.warn('[extract-x] insert err', insErr.message); continue; }
      insertedIds.push(row.id);
      await admin.from('contact_lists').insert({ contact_id: row.id, list_id: targetListId } as any);
      inserted++;
    }

    // Score leads if a campaign was provided
    if (campaign_id && insertedIds.length > 0) {
      try {
        await admin.functions.invoke('score-leads', { body: { campaign_id } });
      } catch (e) { console.warn('[extract-x] score-leads invoke failed', e); }
    }

    return new Response(JSON.stringify({
      inserted,
      skipped_competitor,
      skipped_duplicate,
      list_id: targetListId,
      list_name: listName,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('[extract-x] fatal', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function extractPostId(url: string | null | undefined): string | null {
  if (!url) return null;
  const m1 = url.match(/urn:li:(?:activity|share|ugcPost):(\d+)/i);
  if (m1) return m1[1];
  const m2 = url.match(/activity[-:_](\d{15,25})/i);
  if (m2) return m2[1];
  const m3 = url.match(/(\d{18,25})/);
  if (m3) return m3[1];
  return null;
}

function parseName(fullName: string | null | undefined): { first: string; last: string | null } {
  const raw = (fullName || '').trim();
  if (!raw) return { first: 'Unknown', last: null };
  const parts = raw.split(/\s+/);
  return { first: parts[0], last: parts.slice(1).join(' ') || null };
}

function sanitizeLinkedinUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
    if (!/linkedin\.com$/i.test(u.hostname.replace(/^www\./, ''))) return null;
    u.search = ''; u.hash = '';
    return u.toString().replace(/\/+$/, '').toLowerCase();
  } catch { return null; }
}

function extractCompanySlugFromUrl(url: string): string | null {
  const m = url.match(/linkedin\.com\/company\/([^/?#]+)/i);
  return m ? m[1].toLowerCase() : null;
}

function extractProfileSlugFromUrl(url: string): string | null {
  const m = url.match(/linkedin\.com\/in\/([^/?#]+)/i);
  return m ? m[1].toLowerCase() : null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const jsonResp = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const UNIPILE_API_KEY = Deno.env.get('UNIPILE_API_KEY')!;
    const UNIPILE_DSN = Deno.env.get('UNIPILE_DSN')!;
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !UNIPILE_API_KEY || !UNIPILE_DSN) {
      return jsonResp({ error: 'Missing required environment variables' }, 500);
    }

    const jwt = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    if (!jwt) return jsonResp({ error: 'Not authenticated' }, 401);

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: userRes, error: userErr } = await admin.auth.getUser(jwt);
    if (userErr || !userRes?.user) return jsonResp({ error: 'Not authenticated' }, 401);
    const user = userRes.user;

    const body = await req.json().catch(() => ({}));
    const post_url: string = String(body.post_url || '').trim();
    const list_id: string | null = body.list_id ?? null;
    const campaign_id: string | null = body.campaign_id ?? null;
    const include_likers: boolean = body.include_likers !== false;
    const include_commenters: boolean = body.include_commenters !== false;

    const postId = extractPostId(post_url);
    if (!postId) {
      return jsonResp({ error: 'Invalid LinkedIn post URL. Expected a linkedin.com/posts/... or linkedin.com/feed/update/... URL.' }, 400);
    }

    // Resolve profile → org + Unipile account
    const { data: profile } = await admin
      .from('profiles')
      .select('current_organization_id, unipile_account_id')
      .eq('user_id', user.id)
      .maybeSingle();
    const organization_id: string | null = profile?.current_organization_id ?? null;
    const accountId: string | null = profile?.unipile_account_id ?? null;
    if (!accountId) {
      return jsonResp({ error: 'Please connect your LinkedIn account first (Settings → LinkedIn).' }, 400);
    }

    // Collect competitor slugs from user's campaigns
    const { data: userCampaigns } = await admin
      .from('campaigns')
      .select('competitor_pages')
      .eq('user_id', user.id);
    const competitorCompanies = new Set<string>();
    for (const c of userCampaigns || []) {
      for (const url of ((c as any).competitor_pages || [])) {
        const slug = extractCompanySlugFromUrl(String(url || ''));
        if (slug) competitorCompanies.add(slug);
      }
    }

    // 1) Post metadata → try to identify author slug so we can skip them
    let postAuthorSlug: string | null = null;
    let postText = '';
    try {
      const r = await fetch(`https://${UNIPILE_DSN}/api/v1/posts/${encodeURIComponent(postId)}?account_id=${accountId}`, {
        headers: { 'X-API-KEY': UNIPILE_API_KEY },
      });
      if (r.ok) {
        const p = await r.json();
        postText = String(p?.text || p?.commentary || '');
        const auth = p?.author || p?.user || {};
        postAuthorSlug = (auth?.public_identifier || auth?.public_id || null);
        if (!postAuthorSlug && auth?.linkedin_url) postAuthorSlug = extractProfileSlugFromUrl(String(auth.linkedin_url));
      } else {
        console.warn('[extract-li] post meta failed', r.status);
      }
    } catch (e) { console.warn('[extract-li] post meta threw', e); }

    type Engager = {
      key: string;
      first_name: string;
      last_name: string | null;
      headline: string | null;
      linkedin_url: string | null;
      company: string | null;
      engagement: 'like' | 'comment';
    };
    const engagersByKey = new Map<string, Engager>();

    // 2) Fetch reactions (likes)
    let reactions_fetched = 0;
    if (include_likers) {
      try {
        const r = await fetch(`https://${UNIPILE_DSN}/api/v1/posts/${encodeURIComponent(postId)}/reactions?account_id=${accountId}&limit=100`, {
          headers: { 'X-API-KEY': UNIPILE_API_KEY },
        });
        if (r.ok) {
          const data = await r.json();
          const items = (data?.items || []) as any[];
          reactions_fetched = items.length;
          for (const it of items) {
            const p = it.author || it.user || it;
            const slug = p.public_identifier || p.public_id || p.provider_id || p.id || (p.linkedin_url ? extractProfileSlugFromUrl(String(p.linkedin_url)) : null);
            const key = String(slug || `${p.first_name || p.name || ''}|${p.headline || ''}`);
            if (!key) continue;
            if (postAuthorSlug && String(slug || '').toLowerCase() === postAuthorSlug.toLowerCase()) continue;
            if (engagersByKey.has(key)) continue;
            const fullName = p.name || [p.first_name, p.last_name].filter(Boolean).join(' ');
            const { first, last } = parseName(fullName);
            const liUrl = sanitizeLinkedinUrl(p.linkedin_url || p.public_url || (slug ? `https://www.linkedin.com/in/${slug}` : null));
            engagersByKey.set(key, {
              key,
              first_name: p.first_name || first,
              last_name: p.last_name ?? last,
              headline: p.headline || p.title || null,
              linkedin_url: liUrl,
              company: p.company || p.current_company?.name || null,
              engagement: 'like',
            });
          }
        } else {
          console.warn('[extract-li] reactions failed', r.status, (await r.text().catch(() => '')).slice(0, 400));
        }
      } catch (e) { console.warn('[extract-li] reactions threw', e); }
    }

    // 3) Fetch comments
    let comments_fetched = 0;
    if (include_commenters) {
      try {
        const r = await fetch(`https://${UNIPILE_DSN}/api/v1/posts/${encodeURIComponent(postId)}/comments?account_id=${accountId}&limit=100`, {
          headers: { 'X-API-KEY': UNIPILE_API_KEY },
        });
        if (r.ok) {
          const data = await r.json();
          const items = (data?.items || []) as any[];
          comments_fetched = items.length;
          for (const it of items) {
            const p = it.author || it.user || it;
            const slug = p.public_identifier || p.public_id || p.provider_id || p.id || (p.linkedin_url ? extractProfileSlugFromUrl(String(p.linkedin_url)) : null);
            const key = String(slug || `${p.first_name || p.name || ''}|${p.headline || ''}`);
            if (!key) continue;
            if (postAuthorSlug && String(slug || '').toLowerCase() === postAuthorSlug.toLowerCase()) continue;
            // Comments override reactions (richer signal)
            const fullName = p.name || [p.first_name, p.last_name].filter(Boolean).join(' ');
            const { first, last } = parseName(fullName);
            const liUrl = sanitizeLinkedinUrl(p.linkedin_url || p.public_url || (slug ? `https://www.linkedin.com/in/${slug}` : null));
            engagersByKey.set(key, {
              key,
              first_name: p.first_name || first,
              last_name: p.last_name ?? last,
              headline: p.headline || p.title || null,
              linkedin_url: liUrl,
              company: p.company || p.current_company?.name || null,
              engagement: 'comment',
            });
          }
        } else {
          console.warn('[extract-li] comments failed', r.status, (await r.text().catch(() => '')).slice(0, 400));
        }
      } catch (e) { console.warn('[extract-li] comments threw', e); }
    }

    console.log(`[extract-li] user=${user.id} post=${postId} reactions=${reactions_fetched} comments=${comments_fetched} unique=${engagersByKey.size}`);

    // Filter competitors
    let skipped_competitor = 0;
    const finalEngagers: Engager[] = [];
    for (const eng of engagersByKey.values()) {
      const co = (eng.company || '').toLowerCase();
      if (co && Array.from(competitorCompanies).some(cc => co.includes(cc) || cc.includes(co))) {
        skipped_competitor++;
        continue;
      }
      finalEngagers.push(eng);
    }

    if (finalEngagers.length === 0) {
      return jsonResp({
        inserted: 0,
        skipped_competitor,
        skipped_duplicate: 0,
        reactions_fetched,
        comments_fetched,
        message: 'No engagers found for this post.',
      });
    }

    // Resolve target list
    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    let listName = `Extracted from LinkedIn post · ${today}`;
    let targetListId: string | null = list_id;
    const canonicalUrl = post_url;

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

    // Dedupe against existing contacts in this org by linkedin_url
    const liUrls = finalEngagers.map(e => e.linkedin_url).filter(Boolean) as string[];
    let existingSet = new Set<string>();
    if (liUrls.length > 0) {
      const { data: existing } = await admin
        .from('contacts')
        .select('linkedin_url')
        .eq('organization_id', organization_id as any)
        .in('linkedin_url', liUrls);
      existingSet = new Set((existing || []).map((r: any) => (r.linkedin_url || '').toLowerCase()));
    }

    let inserted = 0;
    let skipped_duplicate = 0;
    const insertedIds: string[] = [];

    for (const eng of finalEngagers) {
      if (eng.linkedin_url && existingSet.has(eng.linkedin_url.toLowerCase())) { skipped_duplicate++; continue; }
      const signalLabel = eng.engagement === 'like' ? 'Liked LinkedIn post' : 'Commented on LinkedIn post';
      const { data: row, error: insErr } = await admin.from('contacts').insert({
        user_id: user.id,
        organization_id,
        first_name: eng.first_name || 'Unknown',
        last_name: eng.last_name,
        title: eng.headline ? eng.headline.slice(0, 500) : null,
        company: eng.company,
        industry: null,
        linkedin_url: eng.linkedin_url,
        signal: signalLabel,
        signal_post_url: canonicalUrl,
        signal_post_excerpt: postText ? postText.slice(0, 500) : null,
        relevance_tier: 'cold',
        lead_status: 'unknown',
        approval_status: 'auto_approved',
        list_name: listName,
        source: 'linkedin_post_extraction',
        ai_score: 1,
      } as any).select('id').single();
      if (insErr) { console.warn('[extract-li] insert err', insErr.message); continue; }
      insertedIds.push(row.id);
      await admin.from('contact_lists').insert({ contact_id: row.id, list_id: targetListId } as any);
      inserted++;
    }

    if (campaign_id && insertedIds.length > 0) {
      try {
        await admin.functions.invoke('score-leads', { body: { campaign_id } });
      } catch (e) { console.warn('[extract-li] score-leads invoke failed', e); }
    }

    return jsonResp({
      inserted,
      skipped_competitor,
      skipped_duplicate,
      reactions_fetched,
      comments_fetched,
      list_id: targetListId,
      list_name: listName,
    });
  } catch (error) {
    console.error('[extract-li] fatal', error);
    return jsonResp({ error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});

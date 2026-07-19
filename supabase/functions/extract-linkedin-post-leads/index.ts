import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { resolvePublicLinkedinUrl, urlHasInternalId } from '../_shared/linkedin-public-url.ts';
import { enrichProfileInPlace } from '../_shared/profile-enrichment.ts';

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

function isLikelyInternalLinkedInId(value: string | null | undefined): boolean {
  if (!value) return false;
  const v = String(value).trim();
  if (!v) return false;
  return (
    /^urn:li:/i.test(v) ||
    /^ACo[A-Za-z0-9_-]{8,}$/i.test(v) ||
    /^\d{8,}$/.test(v) ||
    v.includes('=')
  );
}

function sanitizeLinkedinProfileUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
    if (!/linkedin\.com$/i.test(u.hostname.replace(/^www\./, ''))) return null;
    const slug = extractProfileSlugFromUrl(u.toString());
    if (!slug) return null;
    // Keep internal-ID URLs (e.g. /in/ACoAA...) — LinkedIn resolves them and
    // it's better to give the user a working link than nothing.
    u.search = ''; u.hash = '';
    return u.toString().replace(/\/+$/, '').toLowerCase();
  } catch { return null; }
}

function buildLinkedInUrl(publicSlug: string | null, providerId: string | null): string | null {
  if (publicSlug && !isLikelyInternalLinkedInId(publicSlug)) {
    return `https://www.linkedin.com/in/${publicSlug}`;
  }
  if (providerId && /^ACo[A-Za-z0-9_-]{8,}$/i.test(providerId)) {
    return `https://www.linkedin.com/in/${providerId}`;
  }
  if (publicSlug) return `https://www.linkedin.com/in/${publicSlug}`;
  return null;
}

function extractCompanySlugFromUrl(url: string): string | null {
  const m = url.match(/linkedin\.com\/company\/([^/?#]+)/i);
  return m ? m[1].toLowerCase() : null;
}

function extractProfileSlugFromUrl(url: string): string | null {
  const m = url.match(/linkedin\.com\/in\/([^/?#]+)/i);
  return m ? m[1].toLowerCase() : null;
}

function pickFirst(...values: unknown[]): string | null {
  for (const v of values) {
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  }
  return null;
}

function publicSlugFromProfile(p: any): string | null {
  const fromUrl = extractProfileSlugFromUrl(String(p?.linkedin_url || p?.public_url || p?.profile_url || p?.public_profile_url || p?.url || ''));
  const direct = pickFirst(p?.public_identifier, p?.public_id, p?.publicIdentifier, p?.public_profile_id);
  const slug = (fromUrl || direct || '').trim().toLowerCase();
  if (!slug || isLikelyInternalLinkedInId(slug)) return null;
  return slug;
}

function providerIdFromProfile(p: any): string | null {
  return pickFirst(
    p?.provider_id,
    p?.member_id,
    p?.profile_id,
    p?.id,
    p?.entity_urn,
    p?.urn,
    p?.attendee_provider_id,
  );
}

function normalizeCompany(profile: any): string | null {
  return pickFirst(
    profile?.company,
    profile?.current_company?.name,
    profile?.currentCompany?.name,
    profile?.current_positions?.[0]?.company,
    profile?.current_positions?.[0]?.company_name,
    profile?.position?.company,
    profile?.experiences?.[0]?.company,
    profile?.work_experience?.[0]?.company,
  );
}

function extractItems(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data?.results)) return payload.data.results;
  if (Array.isArray(payload?.elements)) return payload.elements;
  return [];
}

function extractNextCursor(payload: any): string | null {
  const cursor = pickFirst(
    payload?.cursor,
    payload?.next_cursor,
    payload?.nextCursor,
    payload?.paging?.cursor,
    payload?.paging?.next_cursor,
    payload?.pagination?.cursor,
    payload?.pagination?.next_cursor,
    payload?.metadata?.next_cursor,
    payload?.data?.cursor,
    payload?.data?.next_cursor,
  );
  if (cursor) return cursor;
  const nextUrl = pickFirst(payload?.next, payload?.paging?.next, payload?.pagination?.next);
  if (!nextUrl) return null;
  try {
    const u = new URL(nextUrl.startsWith('http') ? nextUrl : `https://placeholder.local${nextUrl}`);
    return pickFirst(u.searchParams.get('cursor'), u.searchParams.get('next_cursor'));
  } catch { return null; }
}

function appendQuery(url: string, params: Record<string, string | number | null | undefined>): string {
  const u = new URL(url);
  for (const [k, v] of Object.entries(params)) {
    if (v !== null && v !== undefined && String(v).trim()) u.searchParams.set(k, String(v));
  }
  return u.toString();
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const SELLER_KEYWORDS = [
  'agency', 'consultant', 'consulting', 'freelancer', 'fractional', 'coach', 'coaching',
  'lead generation', 'lead-gen', 'lead gen', 'appointment setting', 'cold email', 'outbound',
  'sdr as a service', 'demand generation', 'growth partner', 'b2b sales', 'sales automation',
  'linkedin automation', 'marketing agency', 'seo agency', 'ads agency', 'paid ads', 'copywriter',
];

const BUYER_ROLE_KEYWORDS = [
  'founder', 'co-founder', 'ceo', 'owner', 'partner', 'director', 'vp', 'head of', 'chief',
  'revenue', 'sales', 'growth', 'marketing', 'business development', 'commercial', 'go-to-market', 'gtm',
];

function looksLikeSameMarketSeller(text: string, businessContext: string): boolean {
  const hay = text.toLowerCase();
  if (!SELLER_KEYWORDS.some(k => hay.includes(k))) return false;
  const ctx = businessContext.toLowerCase();
  const marketHints = [
    'lead', 'linkedin', 'outbound', 'appointment', 'sales', 'sdr', 'growth', 'marketing', 'demand', 'email', 'agency',
  ].filter(k => ctx.includes(k));
  if (marketHints.length === 0) return false;
  return marketHints.some(k => hay.includes(k));
}

function deterministicScore(headline: string, company: string, businessContext: string): { is_competitor: boolean; score: number; reason: string } | null {
  const text = `${headline} ${company}`.trim();
  if (!text) return null;
  if (looksLikeSameMarketSeller(text, businessContext)) {
    return { is_competitor: true, score: 1, reason: 'Appears to sell similar services.' };
  }
  const lower = text.toLowerCase();
  if (BUYER_ROLE_KEYWORDS.some(k => lower.includes(k))) {
    return { is_competitor: false, score: 2, reason: 'Looks like a possible buyer role.' };
  }
  return null;
}

// ─── AI classifier: competitor + buyer-fit score (1-3) ─────────────────────
async function classifyLeads(
  items: { id: string; name: string; headline: string; company: string; location: string }[],
  businessContext: string,
  idealLead: string,
): Promise<Map<string, { is_competitor: boolean; score: number; reason: string }>> {
  const out = new Map<string, { is_competitor: boolean; score: number; reason: string }>();
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY || items.length === 0 || !businessContext) return out;

  const systemPrompt = `You classify LinkedIn users who engaged with a post. For each person you see NAME + HEADLINE + COMPANY + LOCATION.

USER'S BUSINESS:
${businessContext}
${idealLead ? `\nIDEAL LEAD PROFILE:\n${idealLead}\n` : ''}

For each PERSON output:
1) is_competitor (boolean): TRUE if the person SELLS the same/similar service as the user's business (another agency, consultant, freelancer, or vendor in the same category — anyone who could compete for the same clients). Examples of competitors when user sells "AI lead-gen": "Founder @ OutreachAgency", "Lead-gen consultant", "We help B2B book meetings", "Cold email expert". In-house roles like "VP Sales at Acme", "Head of Growth at SaaSCo" are NOT competitors.
2) score (integer 1-3): buyer fit for the user's business.
   - 3 = HOT: role + industry clearly matches ideal lead, plausible decision-maker who would buy this service.
   - 2 = WARM: adjacent role/industry, could buy but not obvious.
   - 1 = COLD: student, intern, retired, unrelated industry, junior IC in unrelated function, or headline gives no signal.
   If is_competitor=true, always return score=1.
 3) reason: 1 short sentence.

Never mark someone HOT unless they look like a buyer or decision maker. Do not reward competitors for posting/selling similar services.
Be strict on score=3. Default to 2 when the person has a plausible buyer role but incomplete data. Respond ONLY via the tool call.`;

  for (let i = 0; i < items.length; i += 15) {
    const batch = items.slice(i, i + 15);
    const userMsg = batch.map((b, idx) =>
      `PERSON ${idx + 1} [id=${b.id}]\nNAME: ${b.name || '(none)'}\nHEADLINE: ${b.headline || '(none)'}\nCOMPANY: ${b.company || '(none)'}\nLOCATION: ${b.location || '(none)'}`
    ).join('\n\n');
    try {
      const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Lovable-API-Key': LOVABLE_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMsg },
          ],
          tools: [{
            type: 'function',
            function: {
              name: 'classify_leads',
              parameters: {
                type: 'object',
                properties: {
                  results: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        is_competitor: { type: 'boolean' },
                        score: { type: 'integer', minimum: 1, maximum: 3 },
                        reason: { type: 'string' },
                      },
                      required: ['id', 'is_competitor', 'score', 'reason'],
                      additionalProperties: false,
                    },
                  },
                },
                required: ['results'],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: 'function', function: { name: 'classify_leads' } },
        }),
      });
      if (!res.ok) { console.warn('[extract-li] classifier HTTP', res.status); continue; }
      const data = await res.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall) continue;
      const parsed = JSON.parse(toolCall.function.arguments);
      for (const r of (parsed.results || [])) {
        if (typeof r?.id !== 'string') continue;
        const isC = r.is_competitor === true;
        const score = Math.max(1, Math.min(3, Number(r.score) || 1));
        out.set(r.id, { is_competitor: isC, score: isC ? 1 : score, reason: String(r.reason || '') });
      }
    } catch (e) { console.warn('[extract-li] classifier error', e); }
  }
  return out;
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

    // Heavy work runs in the background so the client never hits a gateway 504.
    // We return 202 immediately; on completion we insert a notification for the user.
    const runExtraction = async () => {
      try {
        const result = await performExtraction({
          admin, user, organization_id, accountId,
          UNIPILE_DSN, UNIPILE_API_KEY,
          post_url, postId, list_id, campaign_id,
          include_likers, include_commenters,
        });
        const { inserted = 0, added_to_list = 0, skipped_competitor = 0, skipped_low_fit = 0, skipped_duplicate = 0, raw_unique = 0, list_name } = result || {};
        const totalToList = inserted + added_to_list;
        const bodyText = totalToList > 0
          ? `Added ${totalToList} lead${totalToList === 1 ? '' : 's'} to "${list_name}" (${inserted} new, ${added_to_list} existing) from ${raw_unique} engager${raw_unique === 1 ? '' : 's'}.`
          : `No qualified leads found (skipped ${skipped_competitor} competitors, ${skipped_low_fit} low-fit, ${skipped_duplicate} duplicates).`;
        await admin.from('notifications').insert({
          user_id: user.id,
          type: 'lead_extraction_complete',
          title: 'LinkedIn post extraction finished',
          body: bodyText,
          link: '/contacts',
        } as any);
      } catch (e) {
        console.error('[extract-li] background fatal', e);
        await admin.from('notifications').insert({
          user_id: user.id,
          type: 'lead_extraction_failed',
          title: 'LinkedIn post extraction failed',
          body: e instanceof Error ? e.message : 'Unknown error',
          link: '/contacts',
        } as any).catch(() => {});
      }
    };

    // @ts-ignore EdgeRuntime is provided by Supabase Edge Runtime
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime?.waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(runExtraction());
    } else {
      // Fallback: fire and forget
      runExtraction();
    }

    return jsonResp({ background: true, message: 'Extraction started. You will be notified when it finishes.' }, 202);
  } catch (error) {
    console.error('[extract-li] fatal', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function performExtraction(ctx: {
  admin: any; user: any; organization_id: string | null; accountId: string;
  UNIPILE_DSN: string; UNIPILE_API_KEY: string;
  post_url: string; postId: string;
  list_id: string | null; campaign_id: string | null;
  include_likers: boolean; include_commenters: boolean;
}) {
  const { admin, user, organization_id, accountId, UNIPILE_DSN, UNIPILE_API_KEY,
    post_url, postId, list_id, campaign_id, include_likers, include_commenters } = ctx;


    // Load user's campaigns for competitor list + business context
    const { data: userCampaigns } = await admin
      .from('campaigns')
      .select('id, company_name, description, industry, services, competitor_pages, icp_job_titles, icp_industries, icp_locations, icp_company_sizes')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    const competitorCompanies = new Set<string>();
    for (const c of userCampaigns || []) {
      for (const url of ((c as any).competitor_pages || [])) {
        const slug = extractCompanySlugFromUrl(String(url || ''));
        if (slug) competitorCompanies.add(slug);
      }
    }
    // Pick a context campaign: explicit id > first campaign
    const ctxCampaign =
      (campaign_id && (userCampaigns || []).find((c: any) => c.id === campaign_id)) ||
      (userCampaigns || [])[0] ||
      null;
    const businessContext = ctxCampaign
      ? [
          ctxCampaign.company_name ? `Company: ${ctxCampaign.company_name}` : '',
          ctxCampaign.industry ? `Industry: ${ctxCampaign.industry}` : '',
          ctxCampaign.description ? `What we sell: ${ctxCampaign.description}` : '',
          Array.isArray(ctxCampaign.services) && ctxCampaign.services.length ? `Services: ${ctxCampaign.services.join(', ')}` : '',
        ].filter(Boolean).join('\n')
      : '';
    const idealLead = ctxCampaign
      ? [
          Array.isArray(ctxCampaign.icp_job_titles) && ctxCampaign.icp_job_titles.length ? `Job titles: ${ctxCampaign.icp_job_titles.join(', ')}` : '',
          Array.isArray(ctxCampaign.icp_industries) && ctxCampaign.icp_industries.length ? `Industries: ${ctxCampaign.icp_industries.join(', ')}` : '',
          Array.isArray(ctxCampaign.icp_locations) && ctxCampaign.icp_locations.length ? `Locations: ${ctxCampaign.icp_locations.join(', ')}` : '',
          Array.isArray(ctxCampaign.icp_company_sizes) && ctxCampaign.icp_company_sizes.length ? `Company sizes: ${ctxCampaign.icp_company_sizes.join(', ')}` : '',
        ].filter(Boolean).join('\n')
      : '';

    // 1) Post metadata → try to identify author slug so we can skip them
    let postAuthorSlug: string | null = null;
    let postAuthorName: string | null = null;
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
        const first = String(auth?.first_name || '').trim();
        const last = String(auth?.last_name || '').trim();
        const full = String(auth?.name || auth?.full_name || '').trim();
        postAuthorName = (first || last) ? `${first} ${last}`.trim() : (full || null);
      } else {
        console.warn('[extract-li] post meta failed', r.status);
      }
    } catch (e) { console.warn('[extract-li] post meta threw', e); }

    type Engager = {
      key: string;
      profile_id: string | null;
      public_slug: string | null;
      first_name: string;
      last_name: string | null;
      full_name: string | null;
      headline: string | null;
      linkedin_url: string | null;
      company: string | null;
      location: string | null;
      engagement: 'like' | 'comment';
    };
    const engagersByKey = new Map<string, Engager>();

    const upsertEngager = (rawProfile: any, engagement: 'like' | 'comment') => {
      const p = rawProfile?.author || rawProfile?.user || rawProfile?.profile || rawProfile?.member || rawProfile;
      const publicSlug = publicSlugFromProfile(p);
      const profileId = providerIdFromProfile(p);
      const fullName = pickFirst(p?.name, p?.full_name, p?.display_name, [p?.first_name, p?.last_name].filter(Boolean).join(' '));
      const { first, last } = parseName(fullName);
      const key = publicSlug ? `slug:${publicSlug}` : profileId ? `id:${profileId}` : fullName ? `name:${fullName.toLowerCase()}|${pickFirst(p?.headline, p?.title) || ''}` : null;
      if (!key) return;
      if (postAuthorSlug && publicSlug && publicSlug.toLowerCase() === postAuthorSlug.toLowerCase()) return;

      const rawUrl = pickFirst(p?.linkedin_url, p?.public_url, p?.profile_url, p?.public_profile_url, p?.url);
      const linkedinUrl = sanitizeLinkedinProfileUrl(rawUrl) || buildLinkedInUrl(publicSlug, profileId);
      const existing = engagersByKey.get(key);
      if (existing && existing.engagement === 'comment') return;
      engagersByKey.set(key, {
        key,
        profile_id: profileId,
        public_slug: publicSlug,
        first_name: pickFirst(p?.first_name) || first,
        last_name: pickFirst(p?.last_name) || last,
        full_name: fullName,
        headline: pickFirst(p?.headline, p?.title, p?.occupation),
        linkedin_url: linkedinUrl,
        company: normalizeCompany(p),
        location: pickFirst(p?.location, p?.geo?.full, p?.geo_region, p?.country),
        engagement,
      });
    };

    const fetchPagedPostItems = async (kind: 'reactions' | 'comments') => {
      const all: any[] = [];
      let cursor: string | null = null;
      let pages = 0;
      const seenCursors = new Set<string>();
      while (pages < 12 && all.length < 1000) {
        pages++;
        const base = `https://${UNIPILE_DSN}/api/v1/posts/${encodeURIComponent(postId)}/${kind}`;
        const url = appendQuery(base, { account_id: accountId, limit: 100, cursor });
        const r = await fetch(url, { headers: { 'X-API-KEY': UNIPILE_API_KEY, 'Accept': 'application/json' } });
        if (!r.ok) {
          console.warn(`[extract-li] ${kind} failed`, r.status, (await r.text().catch(() => '')).slice(0, 400));
          break;
        }
        const payload = await r.json();
        const items = extractItems(payload);
        all.push(...items);
        const next = extractNextCursor(payload);
        if (!next || seenCursors.has(next) || items.length === 0) break;
        seenCursors.add(next);
        cursor = next;
      }
      return { items: all.slice(0, 1000), pages };
    };

    const enrichEngagers = async () => {
      let enriched = 0;
      const targets = Array.from(engagersByKey.values()).filter(e =>
        e.profile_id && (!e.headline || !e.company || !e.linkedin_url || !e.public_slug)
      ).slice(0, 300);
      for (const eng of targets) {
        try {
          await sleep(80);
          const r = await fetch(`https://${UNIPILE_DSN}/api/v1/linkedin/profile/${encodeURIComponent(eng.profile_id!)}?account_id=${encodeURIComponent(accountId)}`, {
            headers: { 'X-API-KEY': UNIPILE_API_KEY, 'Accept': 'application/json' },
          });
          if (!r.ok) continue;
          const p = await r.json();
          const publicSlug = publicSlugFromProfile(p) || eng.public_slug;
          const rawUrl = pickFirst(p?.linkedin_url, p?.public_url, p?.profile_url, p?.public_profile_url, p?.url);
          const liUrl = sanitizeLinkedinProfileUrl(rawUrl) || buildLinkedInUrl(publicSlug, eng.profile_id) || eng.linkedin_url;
          const fullName = pickFirst(p?.name, p?.full_name, p?.display_name, eng.full_name);
          const parsedName = parseName(fullName);
          eng.public_slug = publicSlug;
          eng.first_name = pickFirst(p?.first_name, eng.first_name) || parsedName.first;
          eng.last_name = pickFirst(p?.last_name, eng.last_name) || parsedName.last;
          eng.full_name = fullName || eng.full_name;
          eng.headline = pickFirst(p?.headline, p?.title, p?.occupation, eng.headline);
          eng.company = normalizeCompany(p) || eng.company;
          eng.location = pickFirst(p?.location, p?.geo?.full, p?.geo_region, p?.country, eng.location);
          eng.linkedin_url = liUrl;
          enriched++;
        } catch (e) {
          console.warn('[extract-li] profile enrich threw', e);
        }
      }
      return enriched;
    };

    // 2) Fetch reactions (likes)
    let reactions_fetched = 0;
    let reaction_pages = 0;
    if (include_likers) {
      try {
        const fetched = await fetchPagedPostItems('reactions');
        reactions_fetched = fetched.items.length;
        reaction_pages = fetched.pages;
        for (const it of fetched.items) upsertEngager(it, 'like');
      } catch (e) { console.warn('[extract-li] reactions threw', e); }
    }

    // 3) Fetch comments
    let comments_fetched = 0;
    let comment_pages = 0;
    if (include_commenters) {
      try {
        const fetched = await fetchPagedPostItems('comments');
        comments_fetched = fetched.items.length;
        comment_pages = fetched.pages;
        for (const it of fetched.items) upsertEngager(it, 'comment');
      } catch (e) { console.warn('[extract-li] comments threw', e); }
    }

    const profiles_enriched = await enrichEngagers();

    console.log(`[extract-li] user=${user.id} post=${postId} reactions=${reactions_fetched}/${reaction_pages}p comments=${comments_fetched}/${comment_pages}p unique=${engagersByKey.size} enriched=${profiles_enriched}`);

    // Filter competitors (explicit competitor pages + deterministic seller heuristics first)
    let skipped_competitor = 0;
    const prefiltered: Engager[] = [];
    const deterministicMap = new Map<string, { is_competitor: boolean; score: number; reason: string }>();
    for (const eng of engagersByKey.values()) {
      const co = (eng.company || '').toLowerCase();
      if (co && Array.from(competitorCompanies).some(cc => co.includes(cc) || cc.includes(co))) {
        skipped_competitor++;
        continue;
      }
      const deterministic = deterministicScore(eng.headline || '', eng.company || '', businessContext);
      if (deterministic?.is_competitor) {
        skipped_competitor++;
        continue;
      }
      if (deterministic) deterministicMap.set(eng.key, deterministic);
      prefiltered.push(eng);
    }

    // AI classify: competitor detection (by headline) + buyer-fit score 1-3
    const classifierItems = prefiltered.map(e => ({
      id: e.key,
      name: e.full_name || [e.first_name, e.last_name].filter(Boolean).join(' '),
      headline: (e.headline || '').slice(0, 200),
      company: (e.company || '').slice(0, 100),
      location: (e.location || '').slice(0, 100),
    }));
    const classifyMap = await classifyLeads(classifierItems, businessContext, idealLead);
    for (const [key, val] of deterministicMap) {
      if (!classifyMap.has(key)) classifyMap.set(key, val);
    }

    let skipped_low_fit = 0;
    const finalEngagers: (Engager & { ai_score: number; relevance_tier: 'hot' | 'warm' | 'cold' })[] = [];
    for (const eng of prefiltered) {
      const c = classifyMap.get(eng.key);
      if (c?.is_competitor) { skipped_competitor++; continue; }
      const score = c?.score ?? (businessContext ? 2 : 2); // incomplete enriched data should not collapse to only 3 imported leads
      // Drop obvious dead weight when we have context to judge
      if (businessContext && classifyMap.size > 0 && score <= 1) { skipped_low_fit++; continue; }
      const tier: 'hot' | 'warm' | 'cold' = score >= 3 ? 'hot' : score === 2 ? 'warm' : 'cold';
      finalEngagers.push({ ...eng, ai_score: score, relevance_tier: tier });
    }

    if (finalEngagers.length === 0) {
      return {
        inserted: 0,
        skipped_competitor,
        skipped_low_fit,
        skipped_duplicate: 0,
        reactions_fetched,
        comments_fetched,
        reaction_pages,
        comment_pages,
        profiles_enriched,
        raw_unique: engagersByKey.size,
        list_name: null,
        message: 'No qualified engagers found for this post.',
      };
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

    // Look up existing contacts by LinkedIn profile id or URL so we can either skip
    // (creating a duplicate) or attach them to the selected list.
    const liUrls = finalEngagers.map(e => e.linkedin_url).filter(Boolean) as string[];
    const profileIds = finalEngagers.map(e => e.profile_id).filter(Boolean) as string[];
    const existingByUrl = new Map<string, string>(); // linkedin_url(lower) -> contact.id
    const existingById = new Map<string, string>();  // linkedin_profile_id -> contact.id
    if (liUrls.length > 0) {
      let q = admin.from('contacts').select('id, linkedin_url').in('linkedin_url', liUrls);
      q = organization_id ? q.eq('organization_id', organization_id as any) : q.eq('user_id', user.id);
      const { data: existing } = await q;
      for (const r of (existing || []) as any[]) {
        if (r.linkedin_url) existingByUrl.set(String(r.linkedin_url).toLowerCase(), r.id);
      }
    }
    if (profileIds.length > 0) {
      let q = admin.from('contacts').select('id, linkedin_profile_id').in('linkedin_profile_id', profileIds);
      q = organization_id ? q.eq('organization_id', organization_id as any) : q.eq('user_id', user.id);
      const { data: existing } = await q;
      for (const r of (existing || []) as any[]) {
        if (r.linkedin_profile_id) existingById.set(String(r.linkedin_profile_id), r.id);
      }
    }

    // Pre-load contact_lists memberships for existing contacts so we don't re-add
    const existingContactIds = Array.from(new Set([...existingByUrl.values(), ...existingById.values()]));
    const alreadyInList = new Set<string>();
    if (existingContactIds.length > 0 && targetListId) {
      const { data: memberships } = await admin
        .from('contact_lists')
        .select('contact_id')
        .eq('list_id', targetListId)
        .in('contact_id', existingContactIds);
      for (const m of (memberships || []) as any[]) alreadyInList.add(String(m.contact_id));
    }

    let inserted = 0;
    let added_to_list = 0;
    let skipped_duplicate = 0;
    const insertedIds: string[] = [];

    for (const eng of finalEngagers) {
      const existingId =
        (eng.profile_id && existingById.get(eng.profile_id)) ||
        (eng.linkedin_url && existingByUrl.get(eng.linkedin_url.toLowerCase())) ||
        null;

      if (existingId) {
        // Contact already exists — attach to selected list if not already there.
        if (targetListId && !alreadyInList.has(existingId)) {
          const { error: linkErr } = await admin
            .from('contact_lists')
            .insert({ contact_id: existingId, list_id: targetListId } as any);
          if (!linkErr) {
            alreadyInList.add(existingId);
            added_to_list++;
          }
        }
        skipped_duplicate++;
        continue;
      }

      const authorFirst = (postAuthorName || '').split(/\s+/)[0] || '';
      const signalLabel = eng.engagement === 'like'
        ? (authorFirst ? `Liked ${authorFirst}'s LinkedIn post` : 'Liked LinkedIn post')
        : (authorFirst ? `Commented on ${authorFirst}'s LinkedIn post` : 'Commented on LinkedIn post');
      // Enrich with experience so title/company come from the real current
      // position rather than the headline; also yields the public slug.
      const pseudo: any = { linkedin_url: eng.linkedin_url, provider_id: eng.profile_id, public_id: eng.public_slug, headline: eng.headline, company: eng.company };
      await enrichProfileInPlace(pseudo, accountId, UNIPILE_API_KEY, UNIPILE_DSN);
      let engagerUrl = eng.linkedin_url;
      if (urlHasInternalId(engagerUrl) || (!engagerUrl && eng.profile_id)) {
        const pub = await resolvePublicLinkedinUrl(pseudo, accountId, UNIPILE_API_KEY, UNIPILE_DSN);
        engagerUrl = pub.linkedin_url || engagerUrl;
      }
      const { data: row, error: insErr } = await admin.from('contacts').insert({
        user_id: user.id,
        organization_id,
        first_name: eng.first_name || 'Unknown',
        last_name: eng.last_name,
        title: (pseudo.current_role || eng.headline || '').slice(0, 500) || null,
        company: pseudo.company || eng.company,
        industry: pseudo.industry || null,
        linkedin_url: engagerUrl,
        linkedin_profile_id: eng.profile_id,
        signal: signalLabel,
        signal_post_url: canonicalUrl,
        signal_post_excerpt: postText ? postText.slice(0, 500) : null,
        signal_post_author: postAuthorName,
        relevance_tier: eng.relevance_tier,
        lead_status: 'unknown',
        approval_status: 'auto_approved',
        list_name: listName,
        source: 'linkedin_post_extraction',
        ai_score: eng.ai_score,
      } as any).select('id').single();
      if (insErr) { console.warn('[extract-li] insert err', insErr.message); continue; }
      if (eng.profile_id) existingById.set(eng.profile_id, row.id);
      if (eng.linkedin_url) existingByUrl.set(eng.linkedin_url.toLowerCase(), row.id);
      insertedIds.push(row.id);
      if (targetListId) {
        await admin.from('contact_lists').insert({ contact_id: row.id, list_id: targetListId } as any);
        alreadyInList.add(row.id);
      }
      inserted++;
    }


    return {
      inserted,
      added_to_list,
      skipped_competitor,
      skipped_low_fit,
      skipped_duplicate,
      reactions_fetched,
      comments_fetched,
      reaction_pages,
      comment_pages,
      profiles_enriched,
      raw_unique: engagersByKey.size,
      list_id: targetListId,
      list_name: listName,
    };
}


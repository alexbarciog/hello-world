const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─── Shared types & helpers (same as signal-keyword-posts) ────────────────────

interface ICPFilters { jobTitles: string[]; industries: string[]; locations: string[]; companySizes: string[]; companyTypes: string[]; excludeKeywords: string[]; competitorCompanies: string[]; }
interface MatchResult { titleMatch: boolean; industryMatch: boolean; locationMatch: boolean; score: number; matchedFields: string[]; }

const START = Date.now();
const MAX_RUNTIME_MS = 105_000;
function hasTime() { return Date.now() - START < MAX_RUNTIME_MS; }

const BUYING_INTENT_KEYWORDS = ['ceo','cto','coo','cfo','cmo','cro','cpo','cio','founder','co-founder','cofounder','owner','partner','president','principal','vp','vice president','director','head of','chief','general manager','managing director','svp','evp','avp'];
const REJECT_TITLES = ['software developer','software engineer','frontend developer','backend developer','full stack developer','fullstack developer','web developer','mobile developer','junior developer','senior developer','staff engineer','intern','data analyst','qa engineer','test engineer','devops engineer','graphic designer','ui designer','ux designer','student','fresher','trainee','apprentice','accountant','bookkeeper','cashier','clerk','receptionist','administrative assistant','office assistant'];

function normalizeText(value: string): string { return (value || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').trim(); }
function fuzzyMatchList(value: string, candidates: string[]): boolean { const h = normalizeText(value); if (!h) return false; return candidates.some(c => { const n = normalizeText(c); return n ? (h.includes(n) || n.includes(h)) : false; }); }

function scoreProfileAgainstICP(profile: any, icp: ICPFilters): MatchResult {
  const title = profile.headline || profile.title || profile.role || '';
  const industry = profile.industry || '';
  const location = profile.location || profile.country || '';
  const titleMatch = icp.jobTitles.length === 0 || fuzzyMatchList(title, icp.jobTitles);
  const industryMatch = icp.industries.length === 0 || fuzzyMatchList(industry, icp.industries);
  const locationMatch = icp.locations.length === 0 || fuzzyMatchList(location, icp.locations);
  const matchedFields: string[] = []; let score = 0;
  if (icp.jobTitles.length > 0 && titleMatch) { score += 40; matchedFields.push('title'); } else if (icp.jobTitles.length === 0) score += 20;
  if (icp.industries.length > 0 && industryMatch) { score += 30; matchedFields.push('industry'); } else if (icp.industries.length === 0) score += 15;
  if (icp.locations.length > 0 && locationMatch) { score += 20; matchedFields.push('location'); } else if (icp.locations.length === 0) score += 10;
  if (icp.companySizes.length > 0) { const cs = profile.company_size || profile.current_company?.employee_count || ''; if (cs && fuzzyMatchList(String(cs), icp.companySizes)) { score += 10; matchedFields.push('company_size'); } } else score += 5;
  return { titleMatch, industryMatch, locationMatch, score: Math.min(100, score), matchedFields };
}

function hasBuyingIntent(hl: string): boolean { return BUYING_INTENT_KEYWORDS.some(kw => (hl||'').toLowerCase().includes(kw)); }
function isClearlyIrrelevant(hl: string): boolean { return REJECT_TITLES.some(kw => (hl||'').toLowerCase().includes(kw)); }
function classifyContact(match: MatchResult, icp: ICPFilters, headline?: string): 'hot'|'warm'|'cold'|null {
  const hl = headline || '';
  if (isClearlyIrrelevant(hl)) return null;
  if (icp.jobTitles.length > 0 && match.titleMatch) return 'hot';
  if (hasBuyingIntent(hl) && (icp.industries.length === 0 || match.industryMatch)) return 'hot';
  if (hasBuyingIntent(hl)) return 'warm';
  if (icp.industries.length > 0 && match.industryMatch && hl.length > 5) return 'warm';
  if (hl.length > 5) return 'cold';
  if (icp.jobTitles.length === 0 && icp.industries.length === 0) return 'cold';
  return null;
}
function matchesTitleOrIndustry(m: MatchResult, icp: ICPFilters, hl?: string): boolean { return classifyContact(m, icp, hl) !== null; }

function relaxedIndustryMatch(profile: any, industries: string[]): boolean {
  if (industries.length === 0) return true;
  const text = [profile.industry||'', profile.headline||profile.title||'', profile.company||profile.current_company?.name||''].join(' ').toLowerCase();
  return industries.some(ind => { const words = normalizeText(ind).split(/\s+/).filter(w => w.length > 3); return words.some(word => text.includes(word)); });
}
function matchesIndustry(profile: any, match: MatchResult, icp: ICPFilters): boolean {
  if (icp.industries.length === 0) return true;
  if (match.industryMatch) return true;
  return relaxedIndustryMatch(profile, icp.industries);
}

function isExcluded(profile: any, excludeKeywords: string[], competitorCompanies: string[] = []): boolean {
  const company = (profile.company||profile.current_company?.name||'').toLowerCase().trim();
  const headline = (profile.headline||profile.title||'').toLowerCase();
  if (competitorCompanies.length > 0) { const t = `${company} ${headline}`; for (const c of competitorCompanies) { if (t.includes(c)) return true; } }
  if (excludeKeywords.length === 0) return false;
  const text = [profile.headline,profile.title,profile.company,profile.current_company?.name,profile.industry].filter(Boolean).join(' ').toLowerCase();
  return excludeKeywords.some(kw => text.includes(kw));
}

function unipileGet(path: string, apiKey: string, dsn: string) { return fetch(`https://${dsn}${path}`, { headers: { 'X-API-KEY': apiKey } }); }
function normalizeProfile(item: any): any {
  if (!item.first_name && item.name) { const parts = item.name.split(' '); item.first_name = parts[0]; item.last_name = parts.slice(1).join(' ') || ''; }
  return item;
}
async function fetchProfileIfNeeded(item: any, accountId: string, apiKey: string, dsn: string): Promise<any|null> {
  const norm = normalizeProfile({ ...item });
  if (norm.first_name && (norm.headline || norm.title)) return norm;
  const id = item.public_identifier||item.provider_id||item.public_id||item.author_id;
  const numericOrUrn = item.id;
  const fetchId = id || (numericOrUrn && !String(numericOrUrn).startsWith('urn:') && !String(numericOrUrn).startsWith('ACo') ? numericOrUrn : null);
  if (!fetchId) return norm.first_name ? norm : null;
  try { const res = await unipileGet(`/api/v1/linkedin/profile/${fetchId}?account_id=${accountId}`, apiKey, dsn); if (!res.ok) { await res.text(); return norm.first_name ? norm : null; } return normalizeProfile(await res.json()); } catch { return norm.first_name ? norm : null; }
}
function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function ensureList(supabase: any, userId: string, listName: string, agentId: string): Promise<string|null> {
  const { data: existing } = await supabase.from('lists').select('id').eq('user_id', userId).eq('name', listName).limit(1);
  if (existing?.length > 0) return existing[0].id;
  const { data: created, error } = await supabase.from('lists').insert({ user_id: userId, name: listName, source_agent_id: agentId }).select('id').single();
  if (error) { console.error(`Create list error: ${error.message}`); return null; } return created?.id || null;
}

async function insertContact(supabase: any, profile: any, userId: string, agentId: string, listName: string, match: MatchResult, signal: string, signalPostUrl: string|null, icp?: ICPFilters): Promise<boolean> {
  const linkedinProfileId = profile.public_id||profile.public_identifier||profile.provider_id||profile.id;
  if (!linkedinProfileId) return false;
  const { data: existing } = await supabase.from('contacts').select('id').eq('user_id', userId).eq('linkedin_profile_id', linkedinProfileId).limit(1);
  if (existing?.length > 0) return false;
  const firstName = profile.first_name||profile.name?.split(' ')[0]||'Unknown';
  const lastName = profile.last_name||profile.name?.split(' ').slice(1).join(' ')||'';
  const hl = profile.headline||profile.title||'';
  const emptyIcp: ICPFilters = { jobTitles:[],industries:[],locations:[],companySizes:[],companyTypes:[],excludeKeywords:[],competitorCompanies:[] };
  const relevanceTier = classifyContact(match, icp||emptyIcp, hl)||'cold';
  const signalAHit = true; const signalBHit = match.score >= 60; const signalCHit = match.score >= 80;
  const aiScore = Math.min(3, [signalAHit,signalBHit,signalCHit].filter(Boolean).length);
  const { data: inserted, error } = await supabase.from('contacts').insert({
    user_id: userId, first_name: firstName, last_name: lastName, title: profile.headline||profile.title||null,
    company: profile.company||profile.current_company?.name||null,
    linkedin_url: profile.linkedin_url||profile.public_url||profile.profile_url||(linkedinProfileId ? `https://www.linkedin.com/in/${linkedinProfileId}` : null),
    linkedin_profile_id: linkedinProfileId, source_campaign_id: null, signal, signal_post_url: signalPostUrl,
    ai_score: aiScore, signal_a_hit: signalAHit, signal_b_hit: signalBHit, signal_c_hit: signalCHit,
    email_enriched: false, list_name: listName,
    company_icon_color: ['orange','blue','green','purple','pink','gray'][Math.floor(Math.random()*6)],
    relevance_tier: relevanceTier,
  }).select('id').single();
  if (error) { console.error(`Insert contact error: ${error.message}`); return false; }
  if (inserted?.id && listName) { const listId = await ensureList(supabase, userId, listName, agentId); if (listId) await supabase.from('contact_lists').insert({ contact_id: inserted.id, list_id: listId }); }
  return true;
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { agent_id, account_id, user_id, list_name, hashtags, icp: icpRaw, competitor_companies } = await req.json();
    if (!agent_id || !account_id || !hashtags?.length) {
      return new Response(JSON.stringify({ leads: 0, error: 'Missing required params' }), { status: 400, headers: corsHeaders });
    }

    const UNIPILE_API_KEY = Deno.env.get('UNIPILE_API_KEY')!;
    const UNIPILE_DSN = Deno.env.get('UNIPILE_DSN')!;
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const icp: ICPFilters = {
      jobTitles: icpRaw?.jobTitles||[], industries: icpRaw?.industries||[], locations: icpRaw?.locations||[],
      companySizes: icpRaw?.companySizes||[], companyTypes: icpRaw?.companyTypes||[],
      excludeKeywords: icpRaw?.excludeKeywords||[], competitorCompanies: competitor_companies||[],
    };

    let inserted = 0;
    const allPosts: any[] = [];

    // Phase 1: Search posts for all hashtags
    for (let tag of hashtags) {
      if (!hasTime()) break;
      if (!tag.startsWith('#')) tag = `#${tag}`;
      await delay(150);
      try {
        const res = await fetch(`https://${UNIPILE_DSN}/api/v1/linkedin/search?account_id=${account_id}`, {
          method: 'POST',
          headers: { 'X-API-KEY': UNIPILE_API_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({ api: 'classic', category: 'posts', keywords: tag, date_posted: 'past_week' }),
        });
        if (!res.ok) { await res.text(); continue; }
        const data = await res.json();
        const items = (data.items || data.results || []).slice(0, 15);
        console.log(`hashtag "${tag}": ${items.length} posts`);
        for (const item of items) allPosts.push({ ...item, _hashtag: tag });
      } catch (e) { console.error(`Hashtag "${tag}":`, e); }
    }

    // Sort by engagement, take top posts
    const topPosts = allPosts
      .sort((a, b) => ((b.likes_count||0)+(b.comments_count||0)) - ((a.likes_count||0)+(a.comments_count||0)))
      .slice(0, 20);

    // Phase 2: Scan engagers on each post (skip authors — we only want engagers)
    for (const post of topPosts) {
      if (!hasTime()) break;
      await delay(150);
      const postId = post.social_id || post.id || post.provider_id;
      if (!postId) continue;

      try {
        const reactionsRes = await unipileGet(`/api/v1/posts/${postId}/reactions?account_id=${account_id}&limit=25`, UNIPILE_API_KEY, UNIPILE_DSN);
        if (!reactionsRes.ok) { await reactionsRes.text(); continue; }
        const reactionsData = await reactionsRes.json();
        const engagers = (reactionsData.items || []).slice(0, 25);
        const postUrl = post.url || post.share_url || post.permalink || `https://www.linkedin.com/feed/update/${postId}`;

        for (const engager of engagers) {
          if (!hasTime()) break;
          const profile = engager.author || engager;
          const fullProfile = await fetchProfileIfNeeded(profile, account_id, UNIPILE_API_KEY, UNIPILE_DSN);
          if (!fullProfile) continue;
          const match = scoreProfileAgainstICP(fullProfile, icp);
          const hl = fullProfile.headline || fullProfile.title || '';
          if (!matchesTitleOrIndustry(match, icp, hl)) continue;
          if (!matchesIndustry(fullProfile, match, icp)) continue;
          if (isExcluded(fullProfile, icp.excludeKeywords, icp.competitorCompanies)) continue;
          const signal = `Engaged with ${post._hashtag}`;
          const ok = await insertContact(supabase, fullProfile, user_id, agent_id, list_name, match, signal, postUrl, icp);
          if (ok) { inserted++; console.log(`+1 "${fullProfile.first_name} ${fullProfile.last_name||''}" (${hl})`); }
        }
      } catch (e) { console.error('Hashtag engager fetch:', e); }
    }

    console.log(`signal-hashtag-engagement: ${inserted} leads total (${Math.round((Date.now()-START)/1000)}s)`);
    return new Response(JSON.stringify({ leads: inserted }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('signal-hashtag-engagement error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error', leads: 0 }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

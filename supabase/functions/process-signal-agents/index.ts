const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ICPFilters {
  jobTitles: string[];
  industries: string[];
  locations: string[];
  companySizes: string[];
  companyTypes: string[];
  excludeKeywords: string[];
}

interface MatchResult {
  titleMatch: boolean;
  industryMatch: boolean;
  locationMatch: boolean;
  score: number;
  matchedFields: string[];
}

interface SignalsConfig {
  enabled?: string[];
  keywords?: Record<string, string[]>;
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const UNIPILE_API_KEY = Deno.env.get('UNIPILE_API_KEY');
  const UNIPILE_DSN = Deno.env.get('UNIPILE_DSN');

  if (!UNIPILE_API_KEY) return errorResponse('UNIPILE_API_KEY not configured');
  if (!UNIPILE_DSN) return errorResponse('UNIPILE_DSN not configured');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { data: agents, error: agentErr } = await supabase
      .from('signal_agents')
      .select('*')
      .eq('status', 'active')
      .limit(20);

    if (agentErr) throw new Error(`Failed to load agents: ${agentErr.message}`);
    if (!agents || agents.length === 0) {
      return jsonResponse({ message: 'No active signal agents', processed: 0 });
    }

    let totalLeads = 0;

    for (const agent of agents) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('unipile_account_id')
          .eq('user_id', agent.user_id)
          .single();

        if (!profile?.unipile_account_id) {
          console.log(`Skipping agent ${agent.id}: no Unipile account`);
          continue;
        }

        const accountId = profile.unipile_account_id;
        const config: SignalsConfig = (agent.signals_config as SignalsConfig) || {};
        const enabled = config.enabled || [];
        const signalKeywords = config.keywords || {};

        const icp: ICPFilters = {
          jobTitles: (agent.icp_job_titles || []).map((s: string) => s.trim()).filter(Boolean),
          industries: (agent.icp_industries || []).map((s: string) => s.trim()).filter(Boolean),
          locations: (agent.icp_locations || []).map((s: string) => s.trim()).filter(Boolean),
          companySizes: (agent.icp_company_sizes || []).map((s: string) => s.trim()).filter(Boolean),
          companyTypes: (agent.icp_company_types || []).map((s: string) => s.trim()).filter(Boolean),
          excludeKeywords: (agent.icp_exclude_keywords || []).map((s: string) => s.toLowerCase().trim()).filter(Boolean),
        };

        const listName = agent.leads_list_name || agent.name || 'Signal Leads';
        let agentLeads = 0;

        console.log(`Agent ${agent.id}: enabled signals = [${enabled.join(', ')}]`);

        // ── 1. Profile Viewers ──
        if (enabled.includes('profile_viewers')) {
          const count = await handleProfileViewers(supabase, accountId, UNIPILE_API_KEY, UNIPILE_DSN, icp, agent.user_id, listName, agent.id);
          agentLeads += count;
        }

        // ── 2. Post Engagers ──
        if (enabled.includes('post_engagers')) {
          const count = await handlePostEngagers(supabase, accountId, UNIPILE_API_KEY, UNIPILE_DSN, icp, agent.user_id, listName, agent.id);
          agentLeads += count;
        }

        // ── 3. Keyword Posts ──
        if (enabled.includes('keyword_posts')) {
          const kws = signalKeywords['keyword_posts'] || agent.keywords || [];
          if (kws.length > 0) {
            const count = await handleKeywordPosts(supabase, accountId, UNIPILE_API_KEY, UNIPILE_DSN, icp, agent.user_id, listName, agent.id, kws);
            agentLeads += count;
          }
        }

        // ── 4. Hashtag Engagement ──
        if (enabled.includes('hashtag_engagement')) {
          const kws = signalKeywords['hashtag_engagement'] || [];
          if (kws.length > 0) {
            const count = await handleHashtagEngagement(supabase, accountId, UNIPILE_API_KEY, UNIPILE_DSN, icp, agent.user_id, listName, agent.id, kws);
            agentLeads += count;
          }
        }

        // ── 5. Competitor Followers ──
        if (enabled.includes('competitor_followers')) {
          const urls = signalKeywords['competitor_followers'] || [];
          if (urls.length > 0) {
            const count = await handleCompetitorFollowers(supabase, accountId, UNIPILE_API_KEY, UNIPILE_DSN, icp, agent.user_id, listName, agent.id, urls);
            agentLeads += count;
          }
        }

        // ── 6. Competitor Post Engagers ──
        if (enabled.includes('competitor_engagers')) {
          const urls = signalKeywords['competitor_engagers'] || [];
          if (urls.length > 0) {
            const count = await handleCompetitorPostEngagers(supabase, accountId, UNIPILE_API_KEY, UNIPILE_DSN, icp, agent.user_id, listName, agent.id, urls);
            agentLeads += count;
          }
        }

        // ── 7. Profile Engagers (people engaging with specific profiles) ──
        if (enabled.includes('profile_engagers')) {
          const urls = signalKeywords['profile_engagers'] || [];
          if (urls.length > 0) {
            const count = await handleProfileEngagers(supabase, accountId, UNIPILE_API_KEY, UNIPILE_DSN, icp, agent.user_id, listName, agent.id, urls);
            agentLeads += count;
          }
        }

        // Update agent metadata
        await supabase.from('signal_agents').update({
          last_launched_at: new Date().toISOString(),
          results_count: (agent.results_count || 0) + agentLeads,
        }).eq('id', agent.id);

        // Insert notification
        if (agentLeads > 0) {
          await supabase.from('notifications').insert({
            user_id: agent.user_id,
            title: `${agent.name}: ${agentLeads} new leads`,
            body: `Your signal agent "${agent.name}" discovered ${agentLeads} new leads matching your ICP.`,
            type: 'signal',
            link: '/contacts',
          });
        }

        totalLeads += agentLeads;
        console.log(`Agent ${agent.id}: inserted ${agentLeads} leads`);
      } catch (e) {
        console.error(`Error processing agent ${agent.id}:`, e);
      }
    }

    return jsonResponse({
      message: `Processed ${agents.length} agents, ${totalLeads} total leads`,
      processed: agents.length,
      leads_inserted: totalLeads,
    });
  } catch (error) {
    console.error('process-signal-agents error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Unknown error');
  }
});

// ─── Signal Handlers ──────────────────────────────────────────────────────────

async function handleProfileViewers(
  supabase: any, accountId: string, apiKey: string, dsn: string,
  icp: ICPFilters, userId: string, listName: string, agentId: string,
): Promise<number> {
  try {
    const res = await unipileGet(`/api/v1/linkedin/profile/me/viewers?account_id=${accountId}`, apiKey, dsn);
    if (!res.ok) { console.error(`Profile viewers: ${res.status}`); return 0; }
    const data = await res.json();
    const viewers = data.items || data.viewers || data.results || [];

    let inserted = 0;
    for (const viewer of viewers.slice(0, 20)) {
      await delay(500);
      const profile = await fetchProfileSafe(viewer, accountId, apiKey, dsn);
      if (!profile) continue;

      const match = scoreProfileAgainstICP(profile, icp);
      if (!matchesTitleOrIndustry(match, icp)) continue;
      if (isExcluded(profile, icp.excludeKeywords)) continue;

      const ok = await insertContact(supabase, profile, userId, agentId, listName, match, 'Viewed your profile', null);
      if (ok) inserted++;
    }
    return inserted;
  } catch (e) { console.error('handleProfileViewers:', e); return 0; }
}

async function handlePostEngagers(
  supabase: any, accountId: string, apiKey: string, dsn: string,
  icp: ICPFilters, userId: string, listName: string, agentId: string,
): Promise<number> {
  try {
    // Get user's recent posts
    const postsRes = await unipileGet(`/api/v1/linkedin/profile/me/posts?account_id=${accountId}&limit=5`, apiKey, dsn);
    if (!postsRes.ok) { console.error(`My posts: ${postsRes.status}`); return 0; }
    const postsData = await postsRes.json();
    const posts = (postsData.items || postsData.posts || []).slice(0, 5);

    let inserted = 0;
    for (const post of posts) {
      await delay(1500);
      const postId = post.id || post.provider_id;
      if (!postId) continue;

      // Get reactions/comments on each post
      const reactionsRes = await unipileGet(`/api/v1/linkedin/post/${postId}/reactions?account_id=${accountId}`, apiKey, dsn);
      if (!reactionsRes.ok) continue;
      const reactionsData = await reactionsRes.json();
      const engagers = (reactionsData.items || reactionsData.reactions || []).slice(0, 15);

      const postUrl = post.url || post.share_url || post.permalink || (postId ? `https://www.linkedin.com/feed/update/${postId}` : null);
      const postText = post.text || post.commentary || '';
      const snippet = postText.length > 50 ? postText.slice(0, 47) + '...' : postText;

      for (const engager of engagers) {
        await delay(500);
        const profile = await fetchProfileSafe(engager, accountId, apiKey, dsn);
        if (!profile) continue;

        const match = scoreProfileAgainstICP(profile, icp);
        if (!matchesTitleOrIndustry(match, icp)) continue;
        if (isExcluded(profile, icp.excludeKeywords)) continue;

        const signal = snippet ? `Reacted to your post: "${snippet}"` : 'Reacted to your post';
        const ok = await insertContact(supabase, profile, userId, agentId, listName, match, signal, postUrl);
        if (ok) inserted++;
      }
    }
    return inserted;
  } catch (e) { console.error('handlePostEngagers:', e); return 0; }
}

async function handleKeywordPosts(
  supabase: any, accountId: string, apiKey: string, dsn: string,
  icp: ICPFilters, userId: string, listName: string, agentId: string, keywords: string[],
): Promise<number> {
  let inserted = 0;
  const allPosts: any[] = [];

  for (const keyword of keywords.slice(0, 5)) {
    await delay(2000);
    try {
      const res = await fetch(`https://${dsn}/api/v1/linkedin/search?account_id=${accountId}`, {
        method: 'POST',
        headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ api: 'classic', category: 'posts', keywords: keyword, date_posted: 'past_week' }),
      });
      if (!res.ok) continue;
      const data = await res.json();
      for (const item of (data.items || data.results || []).slice(0, 10)) {
        allPosts.push({ ...item, _keyword: keyword });
      }
    } catch (e) { console.error(`Keyword search "${keyword}":`, e); }
  }

  // Get top 10 posts by engagement
  const topPosts = allPosts
    .sort((a, b) => ((b.likes_count || 0) + (b.comments_count || 0)) - ((a.likes_count || 0) + (a.comments_count || 0)))
    .slice(0, 10);

  for (const post of topPosts) {
    await delay(1500);
    const authorId = post.author_id || post.author?.id || post.author?.provider_id || post.provider_id;
    if (!authorId) continue;

    try {
      const profileRes = await unipileGet(`/api/v1/linkedin/profile/${authorId}?account_id=${accountId}`, apiKey, dsn);
      if (!profileRes.ok) continue;
      const profile = await profileRes.json();

      const match = scoreProfileAgainstICP(profile, icp);
      if (!matchesTitleOrIndustry(match, icp)) continue;
      if (isExcluded(profile, icp.excludeKeywords)) continue;

      const postUrl = post.url || post.share_url || post.permalink || (post.id ? `https://www.linkedin.com/feed/update/${post.id}` : null);
      const signal = `Posted about "${post._keyword}"`;
      const ok = await insertContact(supabase, { ...profile, _post: post }, userId, agentId, listName, match, signal, postUrl);
      if (ok) inserted++;
    } catch (e) { console.error('Keyword post author fetch:', e); }
  }
  return inserted;
}

async function handleHashtagEngagement(
  supabase: any, accountId: string, apiKey: string, dsn: string,
  icp: ICPFilters, userId: string, listName: string, agentId: string, hashtags: string[],
): Promise<number> {
  let inserted = 0;
  const allPosts: any[] = [];

  for (let tag of hashtags.slice(0, 5)) {
    if (!tag.startsWith('#')) tag = `#${tag}`;
    await delay(2000);
    try {
      const res = await fetch(`https://${dsn}/api/v1/linkedin/search?account_id=${accountId}`, {
        method: 'POST',
        headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ api: 'classic', category: 'posts', keywords: tag, date_posted: 'past_week' }),
      });
      if (!res.ok) continue;
      const data = await res.json();
      for (const item of (data.items || data.results || []).slice(0, 10)) {
        allPosts.push({ ...item, _hashtag: tag });
      }
    } catch (e) { console.error(`Hashtag search "${tag}":`, e); }
  }

  const topPosts = allPosts
    .sort((a, b) => ((b.likes_count || 0) + (b.comments_count || 0)) - ((a.likes_count || 0) + (a.comments_count || 0)))
    .slice(0, 10);

  // For hashtag, get engagers (commenters/reactors) not just authors
  for (const post of topPosts) {
    await delay(1500);
    const postId = post.id || post.provider_id;
    if (!postId) continue;

    try {
      const reactionsRes = await unipileGet(`/api/v1/linkedin/post/${postId}/reactions?account_id=${accountId}`, apiKey, dsn);
      if (!reactionsRes.ok) continue;
      const reactionsData = await reactionsRes.json();
      const engagers = (reactionsData.items || reactionsData.reactions || []).slice(0, 10);

      const postUrl = post.url || post.share_url || post.permalink || (postId ? `https://www.linkedin.com/feed/update/${postId}` : null);

      for (const engager of engagers) {
        await delay(500);
        const profile = await fetchProfileSafe(engager, accountId, apiKey, dsn);
        if (!profile) continue;

        const match = scoreProfileAgainstICP(profile, icp);
        if (!matchesTitleOrIndustry(match, icp)) continue;
        if (isExcluded(profile, icp.excludeKeywords)) continue;

        const signal = `Engaged with ${post._hashtag}`;
        const ok = await insertContact(supabase, profile, userId, agentId, listName, match, signal, postUrl);
        if (ok) inserted++;
      }
    } catch (e) { console.error('Hashtag engager fetch:', e); }
  }
  return inserted;
}

async function handleCompetitorFollowers(
  supabase: any, accountId: string, apiKey: string, dsn: string,
  icp: ICPFilters, userId: string, listName: string, agentId: string, urls: string[],
): Promise<number> {
  let inserted = 0;

  for (const url of urls.slice(0, 3)) {
    await delay(2000);
    const companyId = extractLinkedInId(url);
    if (!companyId) continue;

    try {
      // Try to get company name for the signal text
      let companyName = companyId;
      try {
        const compRes = await unipileGet(`/api/v1/linkedin/company/${companyId}?account_id=${accountId}`, apiKey, dsn);
        if (compRes.ok) {
          const compData = await compRes.json();
          companyName = compData.name || compData.company_name || companyId;
        }
      } catch (_) { /* use ID as fallback */ }

      const followersRes = await unipileGet(`/api/v1/linkedin/company/${companyId}/followers?account_id=${accountId}&limit=30`, apiKey, dsn);
      if (!followersRes.ok) { console.error(`Competitor followers ${companyId}: ${followersRes.status}`); continue; }
      const followersData = await followersRes.json();
      const followers = (followersData.items || followersData.followers || followersData.results || []).slice(0, 20);

      for (const follower of followers) {
        await delay(500);
        const profile = await fetchProfileSafe(follower, accountId, apiKey, dsn);
        if (!profile) continue;

        const match = scoreProfileAgainstICP(profile, icp);
        if (!matchesTitleOrIndustry(match, icp)) continue;
        if (isExcluded(profile, icp.excludeKeywords)) continue;

        const signal = `Follows ${companyName}`;
        const ok = await insertContact(supabase, profile, userId, agentId, listName, match, signal, url);
        if (ok) inserted++;
      }
    } catch (e) { console.error(`Competitor followers ${url}:`, e); }
  }
  return inserted;
}

async function handleCompetitorPostEngagers(
  supabase: any, accountId: string, apiKey: string, dsn: string,
  icp: ICPFilters, userId: string, listName: string, agentId: string, urls: string[],
): Promise<number> {
  let inserted = 0;

  for (const url of urls.slice(0, 3)) {
    await delay(2000);
    const companyId = extractLinkedInId(url);
    if (!companyId) continue;

    try {
      let companyName = companyId;
      try {
        const compRes = await unipileGet(`/api/v1/linkedin/company/${companyId}?account_id=${accountId}`, apiKey, dsn);
        if (compRes.ok) {
          const compData = await compRes.json();
          companyName = compData.name || compData.company_name || companyId;
        }
      } catch (_) { /* fallback */ }

      // Get competitor's recent posts
      const postsRes = await unipileGet(`/api/v1/linkedin/company/${companyId}/posts?account_id=${accountId}&limit=5`, apiKey, dsn);
      if (!postsRes.ok) continue;
      const postsData = await postsRes.json();
      const posts = (postsData.items || postsData.posts || []).slice(0, 5);

      for (const post of posts) {
        await delay(1500);
        const postId = post.id || post.provider_id;
        if (!postId) continue;

        const reactionsRes = await unipileGet(`/api/v1/linkedin/post/${postId}/reactions?account_id=${accountId}`, apiKey, dsn);
        if (!reactionsRes.ok) continue;
        const reactionsData = await reactionsRes.json();
        const engagers = (reactionsData.items || reactionsData.reactions || []).slice(0, 10);

        const postUrl = post.url || post.share_url || post.permalink || (postId ? `https://www.linkedin.com/feed/update/${postId}` : null);

        for (const engager of engagers) {
          await delay(500);
          const profile = await fetchProfileSafe(engager, accountId, apiKey, dsn);
          if (!profile) continue;

          const match = scoreProfileAgainstICP(profile, icp);
          if (!matchesTitleOrIndustry(match, icp)) continue;
          if (isExcluded(profile, icp.excludeKeywords)) continue;

          const signal = `Engaged with ${companyName}'s post`;
          const ok = await insertContact(supabase, profile, userId, agentId, listName, match, signal, postUrl);
          if (ok) inserted++;
        }
      }
    } catch (e) { console.error(`Competitor engagers ${url}:`, e); }
  }
  return inserted;
}

async function handleProfileEngagers(
  supabase: any, accountId: string, apiKey: string, dsn: string,
  icp: ICPFilters, userId: string, listName: string, agentId: string, profileUrls: string[],
): Promise<number> {
  let inserted = 0;

  for (const url of profileUrls.slice(0, 3)) {
    await delay(2000);
    const profileId = extractLinkedInId(url);
    if (!profileId) continue;

    try {
      // Get the target profile's recent posts
      const postsRes = await unipileGet(`/api/v1/linkedin/profile/${profileId}/posts?account_id=${accountId}&limit=5`, apiKey, dsn);
      if (!postsRes.ok) continue;
      const postsData = await postsRes.json();
      const posts = (postsData.items || postsData.posts || []).slice(0, 5);

      let profileName = profileId;
      // Try to get name from first post author or profile
      try {
        const profRes = await unipileGet(`/api/v1/linkedin/profile/${profileId}?account_id=${accountId}`, apiKey, dsn);
        if (profRes.ok) {
          const profData = await profRes.json();
          profileName = [profData.first_name, profData.last_name].filter(Boolean).join(' ') || profileId;
        }
      } catch (_) { /* fallback */ }

      for (const post of posts) {
        await delay(1500);
        const postId = post.id || post.provider_id;
        if (!postId) continue;

        const reactionsRes = await unipileGet(`/api/v1/linkedin/post/${postId}/reactions?account_id=${accountId}`, apiKey, dsn);
        if (!reactionsRes.ok) continue;
        const reactionsData = await reactionsRes.json();
        const engagers = (reactionsData.items || reactionsData.reactions || []).slice(0, 10);

        const postUrl = post.url || post.share_url || post.permalink || (postId ? `https://www.linkedin.com/feed/update/${postId}` : null);

        for (const engager of engagers) {
          await delay(500);
          const profile = await fetchProfileSafe(engager, accountId, apiKey, dsn);
          if (!profile) continue;

          const match = scoreProfileAgainstICP(profile, icp);
          if (!matchesTitleOrIndustry(match, icp)) continue;
          if (isExcluded(profile, icp.excludeKeywords)) continue;

          const signal = `Engaged with ${profileName}'s post`;
          const ok = await insertContact(supabase, profile, userId, agentId, listName, match, signal, postUrl);
          if (ok) inserted++;
        }
      }
    } catch (e) { console.error(`Profile engagers ${url}:`, e); }
  }
  return inserted;
}

// ─── ICP Scoring (shared with discover-leads) ─────────────────────────────────

function scoreProfileAgainstICP(profile: any, icp: ICPFilters): MatchResult {
  const title = profile.headline || profile.title || profile.role || '';
  const industry = profile.industry || '';
  const location = profile.location || profile.country || '';

  const titleMatch = icp.jobTitles.length === 0 || fuzzyMatchList(title, icp.jobTitles);
  const industryMatch = icp.industries.length === 0 || fuzzyMatchList(industry, icp.industries);
  const locationMatch = icp.locations.length === 0 || fuzzyMatchList(location, icp.locations);

  const matchedFields: string[] = [];
  let score = 0;

  if (icp.jobTitles.length > 0 && titleMatch) { score += 40; matchedFields.push('title'); }
  else if (icp.jobTitles.length === 0) score += 20;

  if (icp.industries.length > 0 && industryMatch) { score += 30; matchedFields.push('industry'); }
  else if (icp.industries.length === 0) score += 15;

  if (icp.locations.length > 0 && locationMatch) { score += 20; matchedFields.push('location'); }
  else if (icp.locations.length === 0) score += 10;

  if (icp.companySizes.length > 0) {
    const companySize = profile.company_size || profile.current_company?.employee_count || '';
    if (companySize && fuzzyMatchList(String(companySize), icp.companySizes)) {
      score += 10; matchedFields.push('company_size');
    }
  } else score += 5;

  return { titleMatch, industryMatch, locationMatch, score: Math.min(100, score), matchedFields };
}

function matchesTitleOrIndustry(match: MatchResult, icp: ICPFilters): boolean {
  // At least title OR industry must match (if defined)
  if (icp.jobTitles.length > 0 && match.titleMatch) return true;
  if (icp.industries.length > 0 && match.industryMatch) return true;
  // If neither is defined in ICP, accept all
  if (icp.jobTitles.length === 0 && icp.industries.length === 0) return true;
  return false;
}

function isExcluded(profile: any, excludeKeywords: string[]): boolean {
  if (excludeKeywords.length === 0) return false;
  const text = [profile.headline, profile.title, profile.company, profile.current_company?.name, profile.industry]
    .filter(Boolean).join(' ').toLowerCase();
  return excludeKeywords.some((kw) => text.includes(kw));
}

function fuzzyMatchList(value: string, candidates: string[]): boolean {
  const haystack = normalizeText(value);
  if (!haystack) return false;
  return candidates.some((c) => {
    const needle = normalizeText(c);
    if (!needle) return false;
    return haystack.includes(needle) || needle.includes(haystack);
  });
}

function normalizeText(value: string): string {
  return (value || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
}

// ─── Contact Insertion ────────────────────────────────────────────────────────

async function insertContact(
  supabase: any, profile: any, userId: string, agentId: string,
  listName: string, match: MatchResult, signal: string, signalPostUrl: string | null,
): Promise<boolean> {
  const linkedinProfileId = profile.public_id || profile.provider_id || profile.id;
  if (!linkedinProfileId) return false;

  // Dedup check
  const { data: existing } = await supabase
    .from('contacts')
    .select('id')
    .eq('user_id', userId)
    .eq('linkedin_profile_id', linkedinProfileId)
    .limit(1);

  if (existing && existing.length > 0) return false;

  const firstName = profile.first_name || profile.name?.split(' ')[0] || 'Unknown';
  const lastName = profile.last_name || profile.name?.split(' ').slice(1).join(' ') || '';

  const signalAHit = true;
  const signalBHit = match.score >= 60;
  const signalCHit = match.score >= 80;
  const aiScore = Math.min(3, [signalAHit, signalBHit, signalCHit].filter(Boolean).length);

  const { error } = await supabase.from('contacts').insert({
    user_id: userId,
    first_name: firstName,
    last_name: lastName,
    title: profile.headline || profile.title || null,
    company: profile.company || profile.current_company?.name || null,
    linkedin_url: profile.linkedin_url || profile.public_url || (linkedinProfileId ? `https://www.linkedin.com/in/${linkedinProfileId}` : null),
    linkedin_profile_id: linkedinProfileId,
    source_campaign_id: null,
    signal,
    signal_post_url: signalPostUrl,
    ai_score: aiScore,
    signal_a_hit: signalAHit,
    signal_b_hit: signalBHit,
    signal_c_hit: signalCHit,
    email_enriched: false,
    list_name: listName,
    company_icon_color: ['orange', 'blue', 'green', 'purple', 'pink', 'gray'][Math.floor(Math.random() * 6)],
  });

  if (error) { console.error(`Insert contact error: ${error.message}`); return false; }
  return true;
}

// ─── Unipile Helpers ──────────────────────────────────────────────────────────

function unipileGet(path: string, apiKey: string, dsn: string) {
  return fetch(`https://${dsn}${path}`, { headers: { 'X-API-KEY': apiKey } });
}

async function fetchProfileSafe(item: any, accountId: string, apiKey: string, dsn: string): Promise<any | null> {
  // If item already has profile data, use it
  if (item.first_name || item.headline) return item;

  const id = item.author_id || item.provider_id || item.id || item.public_id;
  if (!id) return null;

  try {
    const res = await unipileGet(`/api/v1/linkedin/profile/${id}?account_id=${accountId}`, apiKey, dsn);
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

function extractLinkedInId(url: string): string | null {
  if (!url) return null;
  // Handle /company/name/ or /in/name/ patterns
  const match = url.match(/linkedin\.com\/(?:company|in)\/([^/?]+)/);
  if (match) return match[1];
  // If it's just a plain ID/name
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '') || null;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function delay(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

function errorResponse(message: string) {
  return new Response(JSON.stringify({ error: message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

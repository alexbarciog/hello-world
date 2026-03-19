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
      .in('status', ['active', 'paused'])
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

        // Resolve user's own LinkedIn identifier for post_engagers / profile_viewers
        let userLinkedInId: string | null = null;
        if (enabled.includes('post_engagers') || enabled.includes('profile_viewers')) {
          userLinkedInId = await resolveUserLinkedInId(accountId, UNIPILE_API_KEY, UNIPILE_DSN);
          if (userLinkedInId) {
            console.log(`Resolved user LinkedIn ID: ${userLinkedInId}`);
          } else {
            console.log(`Could not resolve user LinkedIn ID for account ${accountId}`);
          }
        }

        // ── 1. Profile Viewers ──
        // Note: Unipile does not have a dedicated "profile viewers" endpoint.
        // We skip this signal type as it's not supported by the API.
        if (enabled.includes('profile_viewers')) {
          console.log('profile_viewers: skipped (not supported by Unipile API)');
        }

        // ── 2. Post Engagers ──
        if (enabled.includes('post_engagers') && userLinkedInId) {
          const count = await handlePostEngagers(supabase, accountId, UNIPILE_API_KEY, UNIPILE_DSN, icp, agent.user_id, listName, agent.id, userLinkedInId);
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
        // Unipile doesn't have a company followers endpoint directly.
        // We use people search with company name as a workaround.
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

        // ── 7. Profile Engagers ──
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

// ─── Resolve User's Own LinkedIn Identifier ───────────────────────────────────

async function resolveUserLinkedInId(accountId: string, apiKey: string, dsn: string): Promise<string | null> {
  try {
    // Use the "own profile" endpoint: GET /api/v1/users/me
    const res = await unipileGet(`/api/v1/users/me?account_id=${accountId}`, apiKey, dsn);
    if (!res.ok) {
      console.error(`Resolve user ID: /api/v1/users/me returned ${res.status}`);
      // Fallback: try the LinkedIn-specific endpoint
      const res2 = await unipileGet(`/api/v1/linkedin/profile/me?account_id=${accountId}`, apiKey, dsn);
      if (!res2.ok) {
        console.error(`Resolve user ID fallback: ${res2.status}`);
        return null;
      }
      const data2 = await res2.json();
      return data2.provider_id || data2.public_id || data2.id || null;
    }
    const data = await res.json();
    return data.provider_id || data.public_id || data.id || null;
  } catch (e) {
    console.error('resolveUserLinkedInId error:', e);
    return null;
  }
}

// ─── Signal Handlers ──────────────────────────────────────────────────────────

async function handlePostEngagers(
  supabase: any, accountId: string, apiKey: string, dsn: string,
  icp: ICPFilters, userId: string, listName: string, agentId: string, userLinkedInId: string,
): Promise<number> {
  try {
    // Correct Unipile endpoint: GET /api/v1/users/{identifier}/posts
    const postsRes = await unipileGet(`/api/v1/users/${userLinkedInId}/posts?account_id=${accountId}&limit=5`, apiKey, dsn);
    if (!postsRes.ok) {
      console.error(`User posts (${userLinkedInId}): ${postsRes.status}`);
      return 0;
    }
    const postsData = await postsRes.json();
    const posts = (postsData.items || postsData.posts || []).slice(0, 5);

    console.log(`post_engagers: found ${posts.length} user posts`);

    let inserted = 0;
    for (const post of posts) {
      await delay(1500);
      // Use social_id for reactions endpoint (more reliable per Unipile docs)
      const postId = post.social_id || post.id || post.provider_id;
      if (!postId) continue;

      // Correct Unipile endpoint: GET /api/v1/posts/{post_id}/reactions
      const reactionsRes = await unipileGet(`/api/v1/posts/${postId}/reactions?account_id=${accountId}&limit=20`, apiKey, dsn);
      if (!reactionsRes.ok) {
        console.error(`Post reactions for ${postId}: ${reactionsRes.status}`);
        continue;
      }
      const reactionsData = await reactionsRes.json();
      const engagers = (reactionsData.items || []).slice(0, 15);

      console.log(`post_engagers: post ${postId} has ${engagers.length} reactions`);

      const postUrl = post.url || post.share_url || post.permalink || `https://www.linkedin.com/feed/update/${postId}`;
      const postText = post.text || post.commentary || '';
      const snippet = postText.length > 50 ? postText.slice(0, 47) + '...' : postText;

      for (const engager of engagers) {
        await delay(500);
        // Reactions return author object with profile data
        const profile = engager.author || engager;
        if (!profile) continue;

        // If we need more profile data, fetch it
        const fullProfile = await fetchProfileIfNeeded(profile, accountId, apiKey, dsn);
        if (!fullProfile) continue;

        const match = scoreProfileAgainstICP(fullProfile, icp);
        const hl = fullProfile.headline || fullProfile.title || '';
        if (!matchesTitleOrIndustry(match, icp, hl)) continue;
        if (isExcluded(fullProfile, icp.excludeKeywords)) continue;

        const signal = snippet ? `Reacted to your post: "${snippet}"` : 'Reacted to your post';
        const ok = await insertContact(supabase, fullProfile, userId, agentId, listName, match, signal, postUrl, icp);
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
      // Same search endpoint as discover-leads (verified working)
      const res = await fetch(`https://${dsn}/api/v1/linkedin/search?account_id=${accountId}`, {
        method: 'POST',
        headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ api: 'classic', category: 'posts', keywords: keyword, date_posted: 'past_week' }),
      });
      if (!res.ok) {
        console.error(`Keyword search "${keyword}": ${res.status}`);
        continue;
      }
      const data = await res.json();
      const items = (data.items || data.results || []).slice(0, 10);
      console.log(`keyword_posts "${keyword}": found ${items.length} posts`);
      for (const item of items) {
        allPosts.push({ ...item, _keyword: keyword });
      }
    } catch (e) { console.error(`Keyword search "${keyword}":`, e); }
  }

  // Get top 10 posts by engagement
  const topPosts = allPosts
    .sort((a, b) => ((b.likes_count || 0) + (b.comments_count || 0)) - ((a.likes_count || 0) + (a.comments_count || 0)))
    .slice(0, 10);

  console.log(`keyword_posts: top ${topPosts.length} posts to process`);

  for (const post of topPosts) {
    await delay(1500);

    // Log post structure to understand available fields
    console.log(`keyword_posts: post keys = ${Object.keys(post).join(', ')}`);
    if (post.author) console.log(`keyword_posts: author keys = ${Object.keys(post.author).join(', ')}`);
    if (post.actor) console.log(`keyword_posts: actor keys = ${Object.keys(post.actor).join(', ')}`);

    // Try multiple author field locations, but do not fetch profiles by LinkedIn author ID.
    // Unipile search often returns LinkedIn/provider IDs here that are not valid for /users/{id}.
    const authorData = post.author || post.actor || post.author_detail || null;
    const authorId = post.author_id || authorData?.id || authorData?.provider_id || post.provider_id || post.actor_id;

    let profile: any = null;

    if (authorData) {
      const name = authorData.first_name || authorData.name || authorData.title || authorData.headline || post.author_name || post.actor_name || '';
      const nameParts = name.split(' ').filter(Boolean);
      profile = {
        first_name: authorData.first_name || nameParts[0] || 'Unknown',
        last_name: authorData.last_name || nameParts.slice(1).join(' ') || null,
        headline: authorData.headline || authorData.occupation || authorData.title || post.author_headline || null,
        industry: authorData.industry || null,
        location: authorData.location || authorData.geo_location || null,
        company: authorData.company || authorData.current_company?.name || authorData.company_name || null,
        public_id: authorData.public_identifier || authorData.public_id || authorData.vanity_name || authorId,
        linkedin_url: authorData.profile_url || authorData.public_profile_url || authorData.url || (authorData.vanity_name ? `https://www.linkedin.com/in/${authorData.vanity_name}` : null),
        provider_id: authorData.provider_id || authorId,
      };
      console.log(`keyword_posts: built profile from inline data: ${profile.first_name} ${profile.last_name || ''} — ${profile.headline || 'no headline'}`);
    } else {
      console.log(`keyword_posts: skipping post without inline author data (${authorId || 'no author id'})`);
      continue;
    }

    if (!profile) continue;

    const match = scoreProfileAgainstICP(profile, icp);
    const hl = profile.headline || profile.title || '';
    if (!matchesTitleOrIndustry(match, icp, hl)) { console.log(`keyword_posts: REJECTED author "${profile.first_name} ${profile.last_name || ''}" (${hl})`); continue; }
    if (isExcluded(profile, icp.excludeKeywords)) continue;

    const postUrl = post.url || post.share_url || post.permalink || (post.id ? `https://www.linkedin.com/feed/update/${post.id}` : null);
    const signal = `Posted about "${post._keyword}"`;
    const ok = await insertContact(supabase, { ...profile, _post: post }, userId, agentId, listName, match, signal, postUrl, icp);
    if (ok) { inserted++; console.log(`keyword_posts: ACCEPTED author "${profile.first_name} ${profile.last_name || ''}" (${hl})`); }

    // ── Also scan engagers (reactions) on this post ──
    const postId = post.social_id || post.id || post.provider_id;
    if (postId) {
      try {
        await delay(1500);
        const reactionsRes = await unipileGet(`/api/v1/posts/${postId}/reactions?account_id=${accountId}&limit=20`, apiKey, dsn);
        if (reactionsRes.ok) {
          const reactionsData = await reactionsRes.json();
          const engagers = (reactionsData.items || []).slice(0, 15);
          console.log(`keyword_posts: post ${postId} has ${engagers.length} engagers to check`);

          for (const engager of engagers) {
            await delay(500);
            const engagerProfile = engager.author || engager;
            const fullEngager = await fetchProfileIfNeeded(engagerProfile, accountId, apiKey, dsn);
            if (!fullEngager) continue;

            const eMatch = scoreProfileAgainstICP(fullEngager, icp);
            const eHl = fullEngager.headline || fullEngager.title || '';
            if (!matchesTitleOrIndustry(eMatch, icp, eHl)) continue;
            if (isExcluded(fullEngager, icp.excludeKeywords)) continue;

            const eSignal = `Engaged with post about "${post._keyword}"`;
            const eOk = await insertContact(supabase, fullEngager, userId, agentId, listName, eMatch, eSignal, postUrl, icp);
            if (eOk) { inserted++; console.log(`keyword_posts: ACCEPTED engager "${fullEngager.first_name || ''} ${fullEngager.last_name || ''}" (${eHl})`); }
          }
        } else {
          console.log(`keyword_posts: reactions fetch for ${postId}: ${reactionsRes.status}`);
          await reactionsRes.text();
        }
      } catch (e) { console.error('keyword_posts engager scan:', e); }
    }
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
      const items = (data.items || data.results || []).slice(0, 10);
      console.log(`hashtag "${tag}": found ${items.length} posts`);
      for (const item of items) {
        allPosts.push({ ...item, _hashtag: tag });
      }
    } catch (e) { console.error(`Hashtag search "${tag}":`, e); }
  }

  const topPosts = allPosts
    .sort((a, b) => ((b.likes_count || 0) + (b.comments_count || 0)) - ((a.likes_count || 0) + (a.comments_count || 0)))
    .slice(0, 10);

  // For hashtag, get engagers (reactors) not just authors
  for (const post of topPosts) {
    await delay(1500);
    const postId = post.social_id || post.id || post.provider_id;
    if (!postId) continue;

    try {
      // Correct endpoint: /api/v1/posts/{post_id}/reactions
      const reactionsRes = await unipileGet(`/api/v1/posts/${postId}/reactions?account_id=${accountId}&limit=20`, apiKey, dsn);
      if (!reactionsRes.ok) {
        console.error(`Hashtag reactions for ${postId}: ${reactionsRes.status}`);
        continue;
      }
      const reactionsData = await reactionsRes.json();
      const engagers = (reactionsData.items || []).slice(0, 10);

      const postUrl = post.url || post.share_url || post.permalink || `https://www.linkedin.com/feed/update/${postId}`;

      for (const engager of engagers) {
        await delay(500);
        const profile = engager.author || engager;
        const fullProfile = await fetchProfileIfNeeded(profile, accountId, apiKey, dsn);
        if (!fullProfile) continue;

        const match = scoreProfileAgainstICP(fullProfile, icp);
        const hl = fullProfile.headline || fullProfile.title || '';
        if (!matchesTitleOrIndustry(match, icp, hl)) continue;
        if (isExcluded(fullProfile, icp.excludeKeywords)) continue;

        const signal = `Engaged with ${post._hashtag}`;
        const ok = await insertContact(supabase, fullProfile, userId, agentId, listName, match, signal, postUrl, icp);
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

  // Unipile doesn't have a direct "company followers" endpoint.
  // Workaround: search for people who work at / are associated with the competitor company.
  for (const url of urls.slice(0, 3)) {
    await delay(2000);
    const companyName = extractCompanyName(url);
    if (!companyName) continue;

    console.log(`competitor_followers: searching people associated with "${companyName}"`);

    try {
      // Use people search with company name as keyword
      const res = await fetch(`https://${dsn}/api/v1/linkedin/search?account_id=${accountId}`, {
        method: 'POST',
        headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ api: 'classic', category: 'people', keywords: companyName }),
      });
      if (!res.ok) {
        console.error(`Competitor people search "${companyName}": ${res.status}`);
        continue;
      }
      const data = await res.json();
      const people = (data.items || data.results || []).slice(0, 20);

      console.log(`competitor_followers "${companyName}": found ${people.length} people`);

      for (const person of people) {
        await delay(500);
        const profile = {
          ...person,
          title: person.headline || person.title || null,
          linkedin_url: person.profile_url || person.public_profile_url || null,
          public_id: person.public_identifier || person.id || null,
          company: person.current_positions?.[0]?.company || null,
        };

        const match = scoreProfileAgainstICP(profile, icp);
        const hl = profile.headline || profile.title || '';
        if (!matchesTitleOrIndustry(match, icp, hl)) continue;
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
    const companyName = extractCompanyName(url);
    if (!companyId) continue;

    try {
      // Correct Unipile endpoint: GET /api/v1/users/{identifier}/posts?is_company=true
      const postsRes = await unipileGet(`/api/v1/users/${companyId}/posts?account_id=${accountId}&is_company=true&limit=5`, apiKey, dsn);
      if (!postsRes.ok) {
        console.error(`Competitor posts for ${companyId}: ${postsRes.status}`);
        continue;
      }
      const postsData = await postsRes.json();
      const posts = (postsData.items || postsData.posts || []).slice(0, 5);

      console.log(`competitor_engagers "${companyName}": found ${posts.length} posts`);

      for (const post of posts) {
        await delay(1500);
        const postId = post.social_id || post.id || post.provider_id;
        if (!postId) continue;

        // Correct endpoint: /api/v1/posts/{post_id}/reactions
        const reactionsRes = await unipileGet(`/api/v1/posts/${postId}/reactions?account_id=${accountId}&limit=20`, apiKey, dsn);
        if (!reactionsRes.ok) continue;
        const reactionsData = await reactionsRes.json();
        const engagers = (reactionsData.items || []).slice(0, 10);

        const postUrl = post.url || post.share_url || post.permalink || `https://www.linkedin.com/feed/update/${postId}`;

        for (const engager of engagers) {
          await delay(500);
          const profile = engager.author || engager;
          const fullProfile = await fetchProfileIfNeeded(profile, accountId, apiKey, dsn);
          if (!fullProfile) continue;

          const match = scoreProfileAgainstICP(fullProfile, icp);
          const hl = fullProfile.headline || fullProfile.title || '';
          if (!matchesTitleOrIndustry(match, icp, hl)) continue;
          if (isExcluded(fullProfile, icp.excludeKeywords)) continue;

          const signal = `Engaged with ${companyName || companyId}'s post`;
          const ok = await insertContact(supabase, fullProfile, userId, agentId, listName, match, signal, postUrl);
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
      // Correct Unipile endpoint: GET /api/v1/users/{identifier}/posts
      const postsRes = await unipileGet(`/api/v1/users/${profileId}/posts?account_id=${accountId}&limit=5`, apiKey, dsn);
      if (!postsRes.ok) {
        console.error(`Profile engagers posts for ${profileId}: ${postsRes.status}`);
        continue;
      }
      const postsData = await postsRes.json();
      const posts = (postsData.items || postsData.posts || []).slice(0, 5);

      let profileName = profileId;
      try {
        const profRes = await unipileGet(`/api/v1/linkedin/profile/${profileId}?account_id=${accountId}`, apiKey, dsn);
        if (profRes.ok) {
          const profData = await profRes.json();
          profileName = [profData.first_name, profData.last_name].filter(Boolean).join(' ') || profileId;
        }
      } catch (_) { /* fallback */ }

      console.log(`profile_engagers "${profileName}": found ${posts.length} posts`);

      for (const post of posts) {
        await delay(1500);
        const postId = post.social_id || post.id || post.provider_id;
        if (!postId) continue;

        // Correct endpoint: /api/v1/posts/{post_id}/reactions
        const reactionsRes = await unipileGet(`/api/v1/posts/${postId}/reactions?account_id=${accountId}&limit=20`, apiKey, dsn);
        if (!reactionsRes.ok) continue;
        const reactionsData = await reactionsRes.json();
        const engagers = (reactionsData.items || []).slice(0, 10);

        const postUrl = post.url || post.share_url || post.permalink || `https://www.linkedin.com/feed/update/${postId}`;

        for (const engager of engagers) {
          await delay(500);
          const profile = engager.author || engager;
          const fullProfile = await fetchProfileIfNeeded(profile, accountId, apiKey, dsn);
          if (!fullProfile) continue;

          const match = scoreProfileAgainstICP(fullProfile, icp);
          const hl = fullProfile.headline || fullProfile.title || '';
          if (!matchesTitleOrIndustry(match, icp, hl)) continue;
          if (isExcluded(fullProfile, icp.excludeKeywords)) continue;

          const signal = `Engaged with ${profileName}'s post`;
          const ok = await insertContact(supabase, fullProfile, userId, agentId, listName, match, signal, postUrl);
          if (ok) inserted++;
        }
      }
    } catch (e) { console.error(`Profile engagers ${url}:`, e); }
  }
  return inserted;
}

// ─── ICP Scoring ──────────────────────────────────────────────────────────────

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

// Buying-intent titles: decision makers, budget holders, founders
const BUYING_INTENT_KEYWORDS = [
  'ceo', 'cto', 'coo', 'cfo', 'cmo', 'cro', 'cpo', 'cio',
  'founder', 'co-founder', 'cofounder', 'owner', 'partner',
  'president', 'principal',
  'vp', 'vice president',
  'director', 'head of', 'chief',
  'general manager', 'managing director',
  'svp', 'evp', 'avp',
];

// Clearly irrelevant individual contributor titles to reject
const REJECT_TITLES = [
  'software developer', 'software engineer', 'frontend developer', 'backend developer',
  'full stack developer', 'fullstack developer', 'web developer', 'mobile developer',
  'junior developer', 'senior developer', 'staff engineer', 'intern',
  'data analyst', 'qa engineer', 'test engineer', 'devops engineer',
  'graphic designer', 'ui designer', 'ux designer',
  'student', 'fresher', 'trainee', 'apprentice',
  'accountant', 'bookkeeper', 'cashier', 'clerk',
  'receptionist', 'administrative assistant', 'office assistant',
];

function hasBuyingIntent(headline: string): boolean {
  const h = (headline || '').toLowerCase();
  return BUYING_INTENT_KEYWORDS.some((kw) => h.includes(kw));
}

function isClearlyIrrelevant(headline: string): boolean {
  const h = (headline || '').toLowerCase();
  return REJECT_TITLES.some((kw) => h.includes(kw));
}

// Returns relevance tier: 'hot' | 'warm' | 'cold' | null (null = reject)
function classifyContact(match: MatchResult, icp: ICPFilters, headline?: string): 'hot' | 'warm' | 'cold' | null {
  const hl = headline || '';
  
  // Always reject clearly irrelevant individual contributors
  if (isClearlyIrrelevant(hl)) return null;
  
  // HOT: exact ICP title match OR buying intent + industry match
  if (icp.jobTitles.length > 0 && match.titleMatch) return 'hot';
  if (hasBuyingIntent(hl) && (icp.industries.length === 0 || match.industryMatch)) return 'hot';
  
  // WARM: buying intent but no industry match, OR industry match with non-trivial title
  if (hasBuyingIntent(hl)) return 'warm';
  if (icp.industries.length > 0 && match.industryMatch && hl.length > 5) return 'warm';
  
  // COLD: has a title that's not rejected — just engagement signal, no clear ICP fit
  if (hl.length > 5) return 'cold';
  
  // No title info at all — accept as cold if we have no filters, otherwise reject
  if (icp.jobTitles.length === 0 && icp.industries.length === 0) return 'cold';
  return null;
}

// Backward compat wrapper used by all signal handlers
function matchesTitleOrIndustry(match: MatchResult, icp: ICPFilters, headline?: string): boolean {
  return classifyContact(match, icp, headline) !== null;
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
  icp?: ICPFilters,
): Promise<boolean> {
  const linkedinProfileId = profile.public_id || profile.public_identifier || profile.provider_id || profile.id;
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
  const hl = profile.headline || profile.title || '';

  // Determine relevance tier using actual ICP
  const emptyIcp: ICPFilters = { jobTitles: [], industries: [], locations: [], companySizes: [], companyTypes: [], excludeKeywords: [] };
  const relevanceTier = classifyContact(match, icp || emptyIcp, hl) || 'cold';

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
    linkedin_url: profile.linkedin_url || profile.public_url || profile.profile_url || (linkedinProfileId ? `https://www.linkedin.com/in/${linkedinProfileId}` : null),
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
    relevance_tier: relevanceTier,
  });

  if (error) { console.error(`Insert contact error: ${error.message}`); return false; }
  return true;
}

// ─── Unipile Helpers ──────────────────────────────────────────────────────────

function unipileGet(path: string, apiKey: string, dsn: string) {
  return fetch(`https://${dsn}${path}`, { headers: { 'X-API-KEY': apiKey } });
}

async function fetchProfileIfNeeded(item: any, accountId: string, apiKey: string, dsn: string): Promise<any | null> {
  // If item already has sufficient profile data, use it directly
  if (item.first_name && (item.headline || item.title)) return item;

  // Try to get identifier from various fields
  const id = item.provider_id || item.id || item.public_id || item.public_identifier || item.author_id;
  if (!id) return item.first_name ? item : null; // Return partial data if we have at least a name

  try {
    // Use the same profile endpoint that works in discover-leads
    const res = await unipileGet(`/api/v1/linkedin/profile/${id}?account_id=${accountId}`, apiKey, dsn);
    if (!res.ok) return item.first_name ? item : null;
    return await res.json();
  } catch { return item.first_name ? item : null; }
}

function extractLinkedInId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/linkedin\.com\/(?:company|in)\/([^/?]+)/);
  if (match) return match[1];
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '') || null;
}

function extractCompanyName(url: string): string | null {
  if (!url) return null;
  const id = extractLinkedInId(url);
  if (!id) return null;
  // Convert URL slug to readable name: "my-company-name" → "My Company Name"
  return id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function delay(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

function errorResponse(message: string) {
  return new Response(JSON.stringify({ error: message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

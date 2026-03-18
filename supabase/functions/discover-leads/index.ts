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
  score: number; // 0-100
  matchedFields: string[];
}

type PrecisionMode = 'discovery' | 'high_precision';

// ─── Main Handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const UNIPILE_API_KEY = Deno.env.get('UNIPILE_API_KEY');
  const UNIPILE_DSN = Deno.env.get('UNIPILE_DSN');
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

  if (!UNIPILE_API_KEY) return errorResponse('UNIPILE_API_KEY not configured');
  if (!UNIPILE_DSN) return errorResponse('UNIPILE_DSN not configured');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { data: campaigns, error: campErr } = await supabase
      .from('campaigns')
      .select('*')
      .eq('status', 'active')
      .limit(5);

    if (campErr) throw new Error(`Failed to load campaigns: ${campErr.message}`);
    if (!campaigns || campaigns.length === 0) {
      return jsonResponse({ message: 'No active campaigns found', processed: 0 });
    }

    let totalLeadsInserted = 0;

    for (const campaign of campaigns) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('unipile_account_id')
          .eq('user_id', campaign.user_id)
          .single();

        if (!profile?.unipile_account_id) {
          console.log(`Skipping campaign ${campaign.id}: user has no Unipile account`);
          continue;
        }

        const accountId = profile.unipile_account_id;
        const precisionMode: PrecisionMode = (campaign.precision_mode === 'high_precision') ? 'high_precision' : 'discovery';

        // Build structured ICP filters
        const icp: ICPFilters = {
          jobTitles: (campaign.icp_job_titles || []).map((s: string) => s.trim()).filter(Boolean),
          industries: (campaign.icp_industries || []).map((s: string) => s.trim()).filter(Boolean),
          locations: (campaign.icp_locations || []).map((s: string) => s.trim()).filter(Boolean),
          companySizes: (campaign.icp_company_sizes || []).map((s: string) => s.trim()).filter(Boolean),
          companyTypes: (campaign.icp_company_types || []).map((s: string) => s.trim()).filter(Boolean),
          excludeKeywords: (campaign.icp_exclude_keywords || []).map((s: string) => s.toLowerCase().trim()).filter(Boolean),
        };

        console.log(`Campaign ${campaign.id} [${precisionMode}]: ICP = titles:${icp.jobTitles.length}, industries:${icp.industries.length}, locations:${icp.locations.length}`);

        // Auto-generate keywords if missing
        let keywords: string[] = campaign.discovery_keywords || [];
        if (keywords.length === 0) {
          keywords = await generateKeywords(campaign, LOVABLE_API_KEY);
          if (keywords.length > 0) {
            await supabase.from('campaigns').update({ discovery_keywords: keywords }).eq('id', campaign.id);
          } else {
            console.log(`Campaign ${campaign.id}: keyword generation failed, skipping`);
            continue;
          }
        }

        // ── Collect candidates from Unipile ──
        let candidateProfiles = await searchPostAuthors(keywords, accountId, UNIPILE_API_KEY, UNIPILE_DSN);

        if (candidateProfiles.length < 3) {
          console.log(`Campaign ${campaign.id}: only ${candidateProfiles.length} from posts, trying people search`);
          const peopleFallback = await searchPeopleFallback(campaign, icp, accountId, UNIPILE_API_KEY, UNIPILE_DSN);
          candidateProfiles = deduplicateProfiles([...candidateProfiles, ...peopleFallback]);
        }

        console.log(`Campaign ${campaign.id}: ${candidateProfiles.length} total candidates`);

        // ── Score & filter with precision mode ──
        const scoredCandidates = candidateProfiles
          .map((p) => ({ profile: p, match: scoreProfileAgainstICP(p, icp) }))
          .filter((c) => !isExcluded(c.profile, icp.excludeKeywords))
          .sort((a, b) => b.match.score - a.match.score);

        let matchingLeads: typeof scoredCandidates;

        if (precisionMode === 'high_precision') {
          // ── HIGH PRECISION: Only leads that match ALL available ICP criteria ──
          matchingLeads = scoredCandidates.filter((c) => {
            // Must match title if titles are defined
            if (icp.jobTitles.length > 0 && !c.match.titleMatch) return false;
            // Must match industry if industries are defined
            if (icp.industries.length > 0 && !c.match.industryMatch) return false;
            // Must match location if locations are defined
            if (icp.locations.length > 0 && !c.match.locationMatch) return false;
            return true;
          });

          console.log(`Campaign ${campaign.id} [high_precision]: ${matchingLeads.length} strict matches from ${scoredCandidates.length} candidates`);

        } else {
          // ── DISCOVERY: Progressive relaxation ──
          // Tier 1: Full ICP match (score >= 80)
          matchingLeads = scoredCandidates.filter((c) => c.match.score >= 80);

          if (matchingLeads.length < 3) {
            // Tier 2: At least title match (score >= 50)
            matchingLeads = scoredCandidates.filter((c) => c.match.score >= 50);
            console.log(`Campaign ${campaign.id} [discovery]: relaxed to score>=50, got ${matchingLeads.length}`);
          }

          if (matchingLeads.length < 3) {
            // Tier 3: Any partial match (score >= 25)
            matchingLeads = scoredCandidates.filter((c) => c.match.score >= 25);
            console.log(`Campaign ${campaign.id} [discovery]: relaxed to score>=25, got ${matchingLeads.length}`);
          }

          if (matchingLeads.length < 3 && scoredCandidates.length > 0) {
            // Tier 4: Take best available candidates regardless of score
            matchingLeads = scoredCandidates.slice(0, Math.min(scoredCandidates.length, 8));
            console.log(`Campaign ${campaign.id} [discovery]: using top ${matchingLeads.length} by score`);
          }
        }

        console.log(`Campaign ${campaign.id}: ${matchingLeads.length} leads to insert`);

        // ── Insert contacts ──
        for (const { profile: lead, match } of matchingLeads) {
          const linkedinProfileId = lead.public_id || lead.provider_id || lead.id;
          if (!linkedinProfileId) continue;

          const { data: existing } = await supabase
            .from('contacts')
            .select('id')
            .eq('user_id', campaign.user_id)
            .eq('linkedin_profile_id', linkedinProfileId)
            .limit(1);

          if (existing && existing.length > 0) continue;

          const post = lead._post;
          const postEngagement = (post?.likes_count || 0) + (post?.comments_count || 0);
          const isTopActive = postEngagement > 50;
          const isRecentJobChange = checkRecentJobChange(lead);

          const signalAHit = true; // Found via search = intent signal
          const signalBHit = isTopActive || isRecentJobChange;
          const signalCHit = match.score >= 60;
          const aiScore = Math.min(3, [signalAHit, signalBHit, signalCHit].filter(Boolean).length);

          let signal = `ICP match (${match.matchedFields.join(', ') || 'keyword'})`;
          if (isTopActive) signal = 'Top 5% most active in your ICP (LinkedIn)';
          if (isRecentJobChange) signal = 'Strategic Window: Just hired (<90d)';

          const firstName = lead.first_name || lead.name?.split(' ')[0] || 'Unknown';
          const lastName = lead.last_name || lead.name?.split(' ').slice(1).join(' ') || '';

          const contact = {
            user_id: campaign.user_id,
            first_name: firstName,
            last_name: lastName,
            title: lead.headline || lead.title || null,
            company: lead.company || lead.current_company?.name || null,
            linkedin_url: lead.linkedin_url || lead.public_url || (linkedinProfileId ? `https://www.linkedin.com/in/${linkedinProfileId}` : null),
            linkedin_profile_id: linkedinProfileId,
            source_campaign_id: campaign.id,
            signal,
            ai_score: aiScore,
            signal_a_hit: signalAHit,
            signal_b_hit: signalBHit,
            signal_c_hit: signalCHit,
            email_enriched: false,
            list_name: campaign.company_name || 'Campaign Leads',
            company_icon_color: ['orange', 'blue', 'green', 'purple', 'pink', 'gray'][Math.floor(Math.random() * 6)],
          };

          const { error: insertErr } = await supabase.from('contacts').insert(contact);
          if (insertErr) {
            console.error(`Failed to insert contact: ${insertErr.message}`);
          } else {
            totalLeadsInserted++;
          }
        }
      } catch (e) {
        console.error(`Error processing campaign ${campaign.id}:`, e);
      }
    }

    return jsonResponse({
      message: `Processed ${campaigns.length} campaigns, inserted ${totalLeadsInserted} leads`,
      processed: campaigns.length,
      leads_inserted: totalLeadsInserted,
    });
  } catch (error) {
    console.error('discover-leads error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Unknown error');
  }
});

// ─── ICP Scoring ──────────────────────────────────────────────────────────────

function scoreProfileAgainstICP(profile: any, icp: ICPFilters): MatchResult {
  const title = profile.headline || profile.title || profile.role || '';
  const industry = profile.industry || '';
  const location = profile.location || profile.country || '';
  const company = profile.company || profile.current_company?.name || '';

  const titleMatch = icp.jobTitles.length === 0 || fuzzyMatchList(title, icp.jobTitles);
  const industryMatch = icp.industries.length === 0 || fuzzyMatchList(industry, icp.industries);
  const locationMatch = icp.locations.length === 0 || fuzzyMatchList(location, icp.locations);

  const matchedFields: string[] = [];
  let score = 0;

  // Title is the most important signal (40 pts)
  if (icp.jobTitles.length > 0 && titleMatch) {
    score += 40;
    matchedFields.push('title');
  } else if (icp.jobTitles.length === 0) {
    score += 20; // No criteria = partial credit
  }

  // Industry (30 pts)
  if (icp.industries.length > 0 && industryMatch) {
    score += 30;
    matchedFields.push('industry');
  } else if (icp.industries.length === 0) {
    score += 15;
  }

  // Location (20 pts)
  if (icp.locations.length > 0 && locationMatch) {
    score += 20;
    matchedFields.push('location');
  } else if (icp.locations.length === 0) {
    score += 10;
  }

  // Company size bonus (10 pts) — can only check if we have data
  if (icp.companySizes.length > 0) {
    const companySize = profile.company_size || profile.current_company?.employee_count || '';
    if (companySize && fuzzyMatchList(String(companySize), icp.companySizes)) {
      score += 10;
      matchedFields.push('company_size');
    }
  } else {
    score += 5;
  }

  return { titleMatch, industryMatch, locationMatch, score: Math.min(100, score), matchedFields };
}

function isExcluded(profile: any, excludeKeywords: string[]): boolean {
  if (excludeKeywords.length === 0) return false;
  const text = [
    profile.headline, profile.title, profile.company,
    profile.current_company?.name, profile.industry,
  ].filter(Boolean).join(' ').toLowerCase();

  return excludeKeywords.some((kw) => text.includes(kw));
}

function fuzzyMatchList(value: string, candidates: string[]): boolean {
  const haystack = normalizeText(value);
  if (!haystack) return false;
  return candidates.some((candidate) => {
    const needle = normalizeText(candidate);
    if (!needle) return false;
    // Bidirectional contains for flexibility
    return haystack.includes(needle) || needle.includes(haystack);
  });
}

function normalizeText(value: string): string {
  return (value || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
}

// ─── Unipile Search ───────────────────────────────────────────────────────────

async function searchPostAuthors(
  keywords: string[],
  accountId: string,
  apiKey: string,
  dsn: string,
): Promise<any[]> {
  const posts: any[] = [];

  for (const keyword of keywords.slice(0, 5)) {
    if (posts.length >= 5) break;
    await delay(2000);

    try {
      const res = await fetch(`https://${dsn}/api/v1/linkedin/search?account_id=${accountId}`, {
        method: 'POST',
        headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ api: 'classic', category: 'posts', keywords: keyword, date_posted: 'past_week' }),
      });

      if (!res.ok) {
        console.error(`Post search error for "${keyword}": ${res.status}`);
        continue;
      }

      const data = await res.json();
      for (const item of (data.items || data.results || [])) {
        if (posts.length >= 5) break;
        posts.push(item);
      }
    } catch (e) {
      console.error(`Search failed for "${keyword}":`, e);
    }
  }

  // Extract author profiles
  const profiles: any[] = [];
  for (const post of posts) {
    await delay(1500);
    try {
      const authorId = post.author_id || post.author?.id || post.author?.provider_id || post.provider_id || post.actor_id || post.actor?.id;
      if (!authorId) continue;

      const res = await fetch(`https://${dsn}/api/v1/linkedin/profile/${authorId}?account_id=${accountId}`, {
        headers: { 'X-API-KEY': apiKey },
      });
      if (!res.ok) continue;

      const profileData = await res.json();
      profiles.push({ ...profileData, _post: post });
    } catch (e) {
      console.error('Profile fetch failed:', e);
    }
  }

  return profiles;
}

async function searchPeopleFallback(
  campaign: any,
  icp: ICPFilters,
  accountId: string,
  apiKey: string,
  dsn: string,
): Promise<any[]> {
  // Build search queries from ICP — prioritize job titles, then keywords
  const searches = [
    ...icp.jobTitles.slice(0, 3),
    ...(campaign.discovery_keywords || []).slice(0, 2),
  ].filter(Boolean);

  const profiles: any[] = [];

  for (const keyword of searches) {
    if (profiles.length >= 10) break;
    await delay(1200);

    try {
      // Build the search body with available Unipile filters
      const searchBody: any = {
        api: 'classic',
        category: 'people',
        keywords: keyword,
      };

      // Unipile accepts location as text in classic people search
      // We pass the first location as a location hint
      if (icp.locations.length > 0) {
        searchBody.keywords = `${keyword} ${icp.locations[0]}`;
      }

      const res = await fetch(`https://${dsn}/api/v1/linkedin/search?account_id=${accountId}`, {
        method: 'POST',
        headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify(searchBody),
      });

      if (!res.ok) {
        console.error(`People search failed for "${keyword}": ${res.status}`);
        continue;
      }

      const data = await res.json();
      for (const item of (data.items || data.results || [])) {
        if (profiles.length >= 10) break;
        profiles.push({
          ...item,
          title: item.headline || item.title || null,
          linkedin_url: item.profile_url || item.public_profile_url || null,
          public_id: item.public_identifier || item.id || null,
          company: item.current_positions?.[0]?.company || null,
        });
      }
    } catch (e) {
      console.error(`People search error for "${keyword}":`, e);
    }
  }

  return profiles;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function deduplicateProfiles(profiles: any[]): any[] {
  const seen = new Set<string>();
  return profiles.filter((p) => {
    const id = p.public_id || p.provider_id || p.id || '';
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function checkRecentJobChange(profile: any): boolean {
  const experience = profile.experience || profile.positions || [];
  if (!Array.isArray(experience) || experience.length === 0) return false;
  const startDate = experience[0]?.start_date || experience[0]?.started_at;
  if (!startDate) return false;
  return new Date(startDate) >= new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function errorResponse(message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status: 500,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function generateKeywords(campaign: any, lovableApiKey: string | undefined): Promise<string[]> {
  if (!lovableApiKey) return [];

  try {
    const prompt = `Company: ${campaign.company_name || 'Unknown'}
Industry: ${campaign.industry || 'Unknown'}
Description: ${campaign.description || 'No description'}
Target Job Titles: ${(campaign.icp_job_titles || []).join(', ') || 'Unknown'}
Target Industries: ${(campaign.icp_industries || []).join(', ') || 'Unknown'}
Pain Points: ${(campaign.pain_points || []).join(', ') || 'Unknown'}

Generate exactly 5 short LinkedIn search keyword phrases (2-4 words each) that potential buyers of this company's product/service would engage with on LinkedIn. Return only the keywords array.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'You are a B2B sales intelligence expert. Generate LinkedIn search keywords for finding potential buyers.' },
          { role: 'user', content: prompt },
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'return_keywords',
            description: 'Return LinkedIn search keywords',
            parameters: {
              type: 'object',
              properties: {
                keywords: { type: 'array', items: { type: 'string' } },
              },
              required: ['keywords'],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: 'function', function: { name: 'return_keywords' } },
      }),
    });

    if (!response.ok) return [];
    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) return [];
    return (JSON.parse(toolCall.function.arguments).keywords || []).slice(0, 5);
  } catch (e) {
    console.error('Keyword generation failed:', e);
    return [];
  }
}

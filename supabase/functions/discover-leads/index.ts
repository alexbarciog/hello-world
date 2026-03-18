const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
        // Get user's unipile_account_id
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

        // Auto-generate keywords if missing
        let keywords: string[] = campaign.discovery_keywords || [];
        if (keywords.length === 0) {
          console.log(`Campaign ${campaign.id}: no keywords, generating...`);
          keywords = await generateKeywords(campaign, LOVABLE_API_KEY);
          if (keywords.length > 0) {
            await supabase
              .from('campaigns')
              .update({ discovery_keywords: keywords })
              .eq('id', campaign.id);
            console.log(`Campaign ${campaign.id}: generated keywords = ${keywords.join(', ')}`);
          } else {
            console.log(`Campaign ${campaign.id}: keyword generation failed, skipping`);
            continue;
          }
        }

        console.log(`Campaign ${campaign.id}: keywords = ${keywords.join(', ')}`);

        // Search LinkedIn posts via Unipile
        const posts: any[] = [];
        for (const keyword of keywords.slice(0, 5)) {
          if (posts.length >= 5) break;
          await delay(2000);

          try {
            const searchUrl = `https://${UNIPILE_DSN}/api/v1/linkedin/search?account_id=${accountId}`;
            const searchRes = await fetch(searchUrl, {
              method: 'POST',
              headers: {
                'X-API-KEY': UNIPILE_API_KEY,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                api: 'classic',
                category: 'posts',
                keywords: keyword,
                date_posted: 'past_week',
              }),
            });

            if (!searchRes.ok) {
              const errText = await searchRes.text();
              console.error(`Unipile search error for "${keyword}": ${searchRes.status} ${errText}`);
              continue;
            }

            const searchData = await searchRes.json();
            const items = searchData.items || searchData.results || [];
            for (const item of items) {
              if (posts.length >= 5) break;
              posts.push(item);
            }
          } catch (e) {
            console.error(`Search failed for keyword "${keyword}":`, e);
          }
        }

        console.log(`Campaign ${campaign.id}: found ${posts.length} posts`);

        // Extract post authors
        const authorProfiles: any[] = [];
        for (const post of posts) {
          await delay(1500);
          try {
            const authorId = post.author_id || post.author?.id || post.provider_id;
            if (!authorId) continue;

            const profileUrl = `https://${UNIPILE_DSN}/api/v1/linkedin/profile/${authorId}?account_id=${accountId}`;
            const profileRes = await fetch(profileUrl, {
              headers: { 'X-API-KEY': UNIPILE_API_KEY },
            });

            if (!profileRes.ok) {
              await profileRes.text();
              continue;
            }

            const profileData = await profileRes.json();
            authorProfiles.push({ ...profileData, _post: post });
          } catch (e) {
            console.error('Profile fetch failed:', e);
          }
        }

        console.log(`Campaign ${campaign.id}: extracted ${authorProfiles.length} profiles`);

        // Filter against ICP
        const matchingLeads = authorProfiles.filter((p) => {
          const title = (p.headline || p.title || '').toLowerCase();
          const industry = (p.industry || '').toLowerCase();
          const location = (p.location || p.country || '').toLowerCase();

          const normalizedJobTitles = (campaign.icp_job_titles || []).map((t: string) => t.toLowerCase().replace(/\s+cer$/g, '').trim());
          const normalizedIndustries = (campaign.icp_industries || []).map((i: string) => i.toLowerCase().trim());
          const normalizedLocations = (campaign.icp_locations || []).map((l: string) => l.toLowerCase().trim());

          const titleMatch = !normalizedJobTitles.length ||
            normalizedJobTitles.some((t: string) => t && title.includes(t));
          const industryMatch = !normalizedIndustries.length ||
            normalizedIndustries.some((i: string) => i && industry.includes(i));
          const locationMatch = !normalizedLocations.length ||
            normalizedLocations.some((l: string) => l && location.includes(l));

          return titleMatch && industryMatch && locationMatch;
        });

        console.log(`Campaign ${campaign.id}: ${matchingLeads.length} matching leads`);

        // Score and insert
        for (const lead of matchingLeads) {
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

          const signalAHit = true;
          const signalBHit = isTopActive;
          const signalCHit = isRecentJobChange;
          const aiScore = [signalAHit, signalBHit, signalCHit].filter(Boolean).length;

          let signal = 'Matched your ICP criteria';
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function checkRecentJobChange(profile: any): boolean {
  const experience = profile.experience || profile.positions || [];
  if (!Array.isArray(experience) || experience.length === 0) return false;

  const current = experience[0];
  const startDate = current?.start_date || current?.started_at;
  if (!startDate) return false;

  const start = new Date(startDate);
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  return start >= ninetyDaysAgo;
}

async function generateKeywords(campaign: any, lovableApiKey: string | undefined): Promise<string[]> {
  if (!lovableApiKey) {
    console.error('LOVABLE_API_KEY not configured, cannot generate keywords');
    return [];
  }

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
                keywords: { type: 'array', items: { type: 'string' }, description: '5 keyword phrases' },
              },
              required: ['keywords'],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: 'function', function: { name: 'return_keywords' } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('AI gateway error during keyword generation:', response.status, errText);
      return [];
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) return [];

    const result = JSON.parse(toolCall.function.arguments);
    return (result.keywords || []).slice(0, 5);
  } catch (e) {
    console.error('Keyword generation failed:', e);
    return [];
  }
}

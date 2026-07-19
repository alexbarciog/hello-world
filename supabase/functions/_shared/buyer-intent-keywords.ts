// Shared buyer-intent keyword generation for campaign discovery paths
// (generate-discovery-keywords, discover-leads fallback).
//
// Keywords are LinkedIn post SEARCH QUERIES, not exact-match triggers: each one
// is sent to Unipile post search and downstream AI/scoring judges the returned
// posts. The objective is RETRIEVAL — queries whose result pools are dense in
// real buyers — never invented buyer-drama phrases nobody actually posts.
// The full pipeline (categories, scorer, live backtest, history feedback) lives
// in generate-signal-keywords; this is the lean 5-keyword variant for campaigns.

export const BUYER_INTENT_KEYWORD_SYSTEM_PROMPT = `You are a LinkedIn lead-discovery specialist. You produce SEARCH QUERIES, not slogans.

HOW YOUR OUTPUT IS USED: each phrase is sent verbatim to LinkedIn's post search, which returns the most recent posts containing those words. A downstream filter judges each post's author. Two things matter, in this order:
1. VOLUME — real people must actually publish posts containing these exact words.
2. BUYER DENSITY — a high share of those authors must need this product/service right now.

THE FREQUENCY TEST (apply to every phrase): "Will at least 20 different people worldwide publish a LinkedIn post containing these exact words this month?" If not → REJECT. Invented micro-drama always fails: "devs ghosted me", "api costs spiking", "gigster too slow" sound like buyer pain but virtually nobody writes those exact words, so they retrieve zero or random results.

THE GOLD STANDARD is the direct ask post — people publicly asking their network for help: "can anyone recommend a development agency", "looking for an agency to build our mvp", "who do you use for payroll". Most of your phrases must be fragments of ask posts or first-person need statements, in natural word order: "recommend a development agency", "looking for an agency", "need someone to build".

THE VENDOR TEST: if a company selling this service would post the phrase to attract clients ("app development tips", "how to scale your team"), reject it. Ask-fragments naturally pass — vendors answer asks, they don't post them.

FORMAT RULES: lowercase, 2-5 words (prefer 3-4), natural word order, no hashtags, no quotes, no punctuation. Each phrase must read as a literal fragment of a real post.`;

// Minimal deterministic guard — mirrors the vendor list in generate-signal-keywords.
const VENDOR_PHRASES = [
  'tips', 'best practices', 'guide', 'how to', 'strategy',
  'we help', 'our service', 'our agency', 'book a call',
  'free consultation', 'check out', 'learn more', 'case study',
  'thought leadership', 'growth hacking', 'scale your',
  'boost your', 'improve your', 'optimize your', 'optimise your',
  'hire us', 'dm me', 'we build', 'we offer',
];

function isValidKeyword(phrase: string): boolean {
  const lower = phrase.toLowerCase().trim();
  if (!lower) return false;
  const wordCount = lower.split(/\s+/).length;
  if (wordCount < 2 || wordCount > 5) return false;
  if (VENDOR_PHRASES.some(p => lower.includes(p))) return false;
  return true;
}

export function buildCampaignKeywordPrompt(campaign: any, count: number): string {
  return `Company: ${campaign.company_name || 'Unknown'}
Industry: ${campaign.industry || 'Unknown'}
Description: ${campaign.description || 'No description'}
Target Job Titles: ${(campaign.icp_job_titles || []).join(', ') || 'Unknown'}
Target Industries: ${(campaign.icp_industries || []).join(', ') || 'Unknown'}
Pain Points: ${(campaign.pain_points || []).join(', ') || 'Unknown'}

Generate exactly ${count} LinkedIn post search keyword phrases that BUYERS of this company's product/service would write when they need it. Prioritise direct-ask fragments ("recommend a [category]", "looking for a [category]") and first-person need statements ("need an mvp built", "looking to outsource development"). Use the words buyers use for the category, not the seller's marketing label. Every phrase must pass the FREQUENCY TEST and the VENDOR TEST.`;
}

/**
 * Generate `count` retrieval-optimised buyer-intent keywords for a campaign.
 * Fail-open: returns [] on any error so callers keep their existing fallbacks.
 */
export async function generateCampaignBuyerKeywords(
  campaign: any,
  lovableApiKey: string | undefined,
  count = 5,
): Promise<string[]> {
  if (!lovableApiKey) return [];
  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        temperature: 0.25,
        messages: [
          { role: 'system', content: BUYER_INTENT_KEYWORD_SYSTEM_PROMPT },
          { role: 'user', content: buildCampaignKeywordPrompt(campaign, count + 3) },
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'return_keywords',
            description: 'Return retrieval-optimised LinkedIn buyer-intent search keywords',
            parameters: {
              type: 'object',
              properties: {
                keywords: { type: 'array', items: { type: 'string' }, description: `${count + 3} keyword phrases, 2-5 words each, lowercase` },
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
      console.error('[BUYER_KW] AI gateway error:', response.status, await response.text());
      return [];
    }
    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) return [];
    const raw: string[] = JSON.parse(toolCall.function.arguments).keywords || [];
    // Ask for a few extra, validate, then trim to `count`.
    return raw
      .map(k => (typeof k === 'string' ? k.toLowerCase().trim() : ''))
      .filter(isValidKeyword)
      .slice(0, count);
  } catch (e) {
    console.error('[BUYER_KW] keyword generation failed:', e);
    return [];
  }
}

// Generates "Agent suggestions" — job titles found in rejected profiles that
// the AI thinks could be real buyers. Triggered async after a run finalizes
// when total_leads < 20 OR icp_match_failed > 50.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;

interface RejectedProfile {
  headline?: string;
  industry?: string;
  company?: string;
  companyIndustry?: string;
  rejectionReason?: string;
  signalType?: string;
}

async function callGemini(prompt: string, opts: { temperature?: number } = {}): Promise<string> {
  const r = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      temperature: opts.temperature ?? 0.2,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`Gemini ${r.status}: ${t.slice(0, 300)}`);
  }
  const d = await r.json();
  return d.choices?.[0]?.message?.content ?? '';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { runId, agentId } = await req.json();
    if (!runId) {
      return new Response(JSON.stringify({ error: 'runId required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Load run + agent
    const { data: run } = await supabase
      .from('signal_agent_runs')
      .select('*, signal_agents(*)')
      .eq('id', runId)
      .single();

    if (!run) {
      return new Response(JSON.stringify({ error: 'run not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const agent = run.signal_agents;
    const rejectedSample: RejectedProfile[] = (run.rejected_profiles_sample as any) ?? [];

    if (rejectedSample.length < 10) {
      console.log(`[SUGGESTIONS] Run ${runId}: only ${rejectedSample.length} rejected profiles — not enough to suggest`);
      await supabase.from('signal_agent_runs').update({
        ai_suggestions: { suggestions: [], summary: 'Not enough rejected profiles to analyze.', recommended_action: null, generated_at: new Date().toISOString() },
        suggestions_generated_at: new Date().toISOString(),
      }).eq('id', runId);
      return new Response(JSON.stringify({ suggestions: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const currentIcpTitles: string[] = agent?.icp_job_titles ?? [];
    const currentIcpIndustries: string[] = agent?.icp_industries ?? [];

    // Description fallback — signal_agents has no description column, so use name + signals
    const productContext = agent?.name || 'B2B product/service';

    const prompt = `You are analysing rejected LinkedIn profiles from a B2B lead generation run.

CONTEXT:
The user runs a signal agent named: "${productContext}"
Current ICP job titles: ${currentIcpTitles.length ? currentIcpTitles.join(', ') : '(none set)'}
Current ICP industries: ${currentIcpIndustries.length ? currentIcpIndustries.join(', ') : '(none set)'}

REJECTED PROFILES (${rejectedSample.length} total, showing sample):
${rejectedSample.slice(0, 50).map((p, i) =>
  `${i + 1}. "${p.headline ?? ''}" | Industry: ${p.industry ?? ''} | Company: ${p.company ?? ''}`
).join('\n')}

YOUR TASK:
Look through these rejected profiles and identify job titles that SHOULD have been accepted as potential buyers — people who likely have budget authority and a genuine need for what this user sells, but were rejected because their title was not in the ICP list.

STRICT RULES for what to suggest:
- Only suggest titles where the person could realistically be a BUYER of this product
- Only suggest titles where the person has some budget authority or purchase influence
- Never suggest: interns, students, junior roles, individual contributors with no purchase power
- Never suggest titles already in the current ICP list (case-insensitive)
- Never suggest a title just because it appeared frequently — only if it makes sense as a buyer
- Be opinionated — if a title is borderline, do not suggest it
- Use short, normalised titles (e.g. "Head of Sales", not the full headline)

Return ONLY valid JSON, no markdown:
{
  "suggestions": [
    {
      "title": "short normalised job title",
      "reason": "one sentence explaining why this person could buy the product",
      "frequency": <integer count of how many times similar titles appeared in the rejected sample>,
      "confidence": "high" | "medium" | "low",
      "example_headlines": ["up to 2 real headline examples from the rejected list"]
    }
  ],
  "summary": "one sentence describing the overall pattern in rejections",
  "recommended_action": "discovery_mode" | "widen_icp" | "change_competitors" | "keywords_only"
}`;

    let parsed: any;
    try {
      const raw = await callGemini(prompt, { temperature: 0.2 });
      const cleaned = raw.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.error(`[SUGGESTIONS] Gemini call/parse failed for run ${runId}:`, e);
      return new Response(JSON.stringify({ error: 'AI parse failed' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const lowerCurrent = new Set(currentIcpTitles.map(t => t.toLowerCase().trim()));
    const filtered = (parsed.suggestions ?? [])
      .filter((s: any) => s && typeof s.title === 'string')
      .filter((s: any) => s.confidence !== 'low')
      .filter((s: any) => !lowerCurrent.has(s.title.toLowerCase().trim()))
      .slice(0, 10);

    const payload = {
      suggestions: filtered,
      summary: parsed.summary ?? null,
      recommended_action: parsed.recommended_action ?? null,
      generated_at: new Date().toISOString(),
    };

    await supabase.from('signal_agent_runs').update({
      ai_suggestions: payload,
      suggestions_generated_at: new Date().toISOString(),
    }).eq('id', runId);

    console.log(`[SUGGESTIONS] Run ${runId}: ${filtered.length} suggestions saved (action=${parsed.recommended_action})`);

    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('generate-agent-suggestions error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

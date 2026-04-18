import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    if (!LOVABLE_API_KEY) throw new Error('Missing LOVABLE_API_KEY');

    const { lead, force } = await req.json();
    if (!lead) {
      return new Response(JSON.stringify({ error: 'lead data required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Cache check — return existing insights if available (unless force regen)
    if (!force && lead.id) {
      const { data: existing } = await admin
        .from('contacts')
        .select('intent_insights, intent_insights_generated_at')
        .eq('id', lead.id)
        .single();
      if (existing?.intent_insights) {
        return new Response(JSON.stringify({
          ...existing.intent_insights,
          generated_at: existing.intent_insights_generated_at,
          cached: true,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    const name = [lead.first_name, lead.last_name].filter(Boolean).join(' ');
    const signalHits = [lead.signal_a_hit, lead.signal_b_hit, lead.signal_c_hit].filter(Boolean).length;

    const prompt = `You are a B2B sales intelligence analyst. Analyze this lead and provide 3-4 concise, actionable insights. Be specific and practical — no generic advice.

Lead Profile:
- Name: ${name}
- Title: ${lead.title || 'Unknown'}
- Company: ${lead.company || 'Unknown'}
- Industry: ${lead.industry || 'Unknown'}
- Intent Level: ${lead.relevance_tier} (${signalHits}/3 signal hits)
- Signal: ${lead.signal || 'None'}
- Lead Status: ${lead.lead_status}
- AI Score: ${lead.ai_score || 0}/100

Provide insights in this JSON format:
{
  "summary": "One-line assessment of this lead (max 15 words)",
  "insights": [
    { "icon": "🎯", "text": "Specific insight about timing, approach, or opportunity" }
  ],
  "suggested_action": "One specific next step to take with this lead"
}`;

    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'You are a B2B sales intelligence analyst. Always respond with valid JSON only, no markdown.' },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('AI Gateway error:', res.status, errText);
      throw new Error(`AI error: ${res.status}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { summary: 'Unable to parse insights', insights: [], suggested_action: 'Review lead manually' };
    }

    // Persist cache
    const generatedAt = new Date().toISOString();
    if (lead.id) {
      await admin
        .from('contacts')
        .update({
          intent_insights: parsed,
          intent_insights_generated_at: generatedAt,
        })
        .eq('id', lead.id);
    }

    return new Response(JSON.stringify({ ...parsed, generated_at: generatedAt, cached: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('generate-lead-insights error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

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

    const { contactId, headline, postText, jobTitle, company, name, force } = await req.json();
    if (!contactId) {
      return new Response(JSON.stringify({ error: 'contactId required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Check cache
    if (!force) {
      const { data: existing } = await admin
        .from('contacts')
        .select('personality_prediction, personality_generated_at')
        .eq('id', contactId)
        .single();
      if (existing?.personality_prediction) {
        return new Response(JSON.stringify({
          prediction: existing.personality_prediction,
          generated_at: existing.personality_generated_at,
          cached: true,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    const prompt = `You are an expert in behavioral psychology and professional communication analysis.

Analyze this LinkedIn professional based on their available data and predict their personality and communication style. Be specific and actionable — a salesperson should be able to use this to close a deal.

PERSON: ${name || 'Unknown'}
JOB TITLE: ${jobTitle || 'Unknown'}
COMPANY: ${company || 'Unknown'}
LINKEDIN HEADLINE: ${headline || 'Not available'}
RECENT POST/ACTIVITY: ${postText || 'Not available'}

Return ONLY valid JSON with no markdown:
{
  "disc_type": "D | I | S | C | DI | DC | IS | SC",
  "disc_label": "e.g. Initiator / Driver / Analyst / Supporter",
  "primary_traits": ["3 single-word traits e.g. Visionary, Direct, Results-driven"],
  "communication_style": "2 sentence summary of how they communicate",
  "how_to_approach": ["3 specific tips for approaching this person"],
  "what_energizes": ["3 things that motivate them professionally"],
  "what_to_avoid": ["3 things that will turn them off"],
  "email_tips": ["3 specific tips for writing them an email"],
  "best_hook": "The single best opening line to use when reaching out to this specific person based on their personality",
  "confidence": "high | medium | low"
}`;

    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a behavioral analyst. Always respond with valid JSON only, no markdown.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('AI Gateway error:', res.status, errText);
      if (res.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded, please try again shortly.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (res.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits to your Lovable workspace.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI error: ${res.status}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;

    let prediction;
    try {
      prediction = JSON.parse(content);
    } catch {
      throw new Error('Failed to parse AI response');
    }

    // Cache to db
    const generatedAt = new Date().toISOString();
    await admin
      .from('contacts')
      .update({
        personality_prediction: prediction,
        personality_generated_at: generatedAt,
      })
      .eq('id', contactId);

    return new Response(JSON.stringify({
      prediction,
      generated_at: generatedAt,
      cached: false,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('generate-personality-prediction error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

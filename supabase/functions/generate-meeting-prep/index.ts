const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contactId, meetingId } = await req.json();
    if (!contactId || !meetingId) {
      return new Response(JSON.stringify({ error: 'contactId and meetingId required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Fetch contact, meeting, and campaign data in parallel
    const [contactRes, meetingRes] = await Promise.all([
      supabase.from('contacts').select('*').eq('id', contactId).single(),
      supabase.from('meetings').select('*').eq('id', meetingId).single(),
    ]);

    if (!contactRes.data) {
      return new Response(JSON.stringify({ error: 'Contact not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const contact = contactRes.data;
    const meeting = meetingRes.data;

    // Fetch campaign data if available
    let campaign: any = null;
    if (meeting?.campaign_id) {
      const { data } = await supabase.from('campaigns').select('company_name, value_proposition, pain_points, campaign_goal, website').eq('id', meeting.campaign_id).single();
      campaign = data;
    }

    // Try to scrape company website for context
    let companyWebContent = '';
    const companyWebsite = campaign?.website || '';
    if (companyWebsite) {
      try {
        const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
        if (firecrawlKey) {
          let url = companyWebsite.trim();
          if (!url.startsWith('http')) url = `https://${url}`;
          const scrapeRes = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${firecrawlKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, formats: ['summary'], onlyMainContent: true }),
          });
          if (scrapeRes.ok) {
            const scrapeData = await scrapeRes.json();
            companyWebContent = scrapeData?.data?.summary || scrapeData?.summary || '';
          }
        }
      } catch (e) {
        console.error('Firecrawl scrape failed (non-critical):', e);
      }
    }

    // Fetch conversation history if chat exists
    let conversationSummary = '';
    const connReqRes = await supabase.from('campaign_connection_requests').select('chat_id').eq('contact_id', contactId).not('chat_id', 'is', null).limit(1).single();
    if (connReqRes.data?.chat_id) {
      try {
        const unipileDsn = Deno.env.get('UNIPILE_DSN');
        const unipileKey = Deno.env.get('UNIPILE_API_KEY');
        if (unipileDsn && unipileKey) {
          const msgRes = await fetch(`${unipileDsn}/api/v1/chats/${connReqRes.data.chat_id}/messages`, {
            headers: { 'X-API-KEY': unipileKey },
          });
          if (msgRes.ok) {
            const msgData = await msgRes.json();
            const messages = (msgData?.items || msgData || []).slice(0, 20);
            conversationSummary = messages.map((m: any) => `${m.is_sender ? 'You' : contact.first_name}: ${m.text}`).reverse().join('\n');
          }
        }
      } catch (e) {
        console.error('Failed to fetch conversation (non-critical):', e);
      }
    }

    const prompt = `You are a B2B sales meeting preparation expert. Generate a comprehensive meeting prep research document.

CONTACT INFO:
- Name: ${contact.first_name} ${contact.last_name || ''}
- Title: ${contact.title || 'Unknown'}
- Company: ${contact.company || 'Unknown'}
- LinkedIn: ${contact.linkedin_url || 'N/A'}
- Signal/Trigger: ${contact.signal || 'None'}

${campaign ? `YOUR COMPANY CONTEXT:
- Company: ${campaign.company_name || 'N/A'}
- Value Proposition: ${campaign.value_proposition || 'N/A'}
- Pain Points You Solve: ${(campaign.pain_points || []).join(', ')}
- Campaign Goal: ${campaign.campaign_goal || 'N/A'}` : ''}

${companyWebContent ? `THEIR COMPANY WEBSITE SUMMARY:\n${companyWebContent.substring(0, 2000)}` : ''}

${conversationSummary ? `CONVERSATION HISTORY:\n${conversationSummary.substring(0, 3000)}` : ''}

Meeting scheduled for: ${meeting?.scheduled_at ? new Date(meeting.scheduled_at).toLocaleString() : 'TBD'}
${meeting?.notes ? `Meeting notes: ${meeting.notes}` : ''}

Generate a JSON response with these exact keys:
{
  "company_summary": "2-3 sentences about what the lead's company does, their market position, and any relevant recent news or funding",
  "lead_bio": "2-3 sentences about the lead's role, likely responsibilities, and what matters to them based on their title and signal",
  "talking_points": ["5 specific, personalized talking points that connect your value prop to their likely pain points"],
  "potential_objections": [{"objection": "likely concern", "rebuttal": "how to address it"}],
  "conversation_summary": "Brief summary of your conversation so far, key topics discussed, and their engagement level. Say 'No prior conversation' if none.",
  "recommended_agenda": ["3-4 suggested agenda items for the meeting"]
}

Be specific and actionable. No generic advice.`;

    const aiRes = await fetch('https://ai.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a meeting prep research assistant. Always respond with valid JSON only, no markdown fences.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!aiRes.ok) {
      const err = await aiRes.text();
      console.error('AI API error:', err);
      return new Response(JSON.stringify({ error: 'AI generation failed' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const aiData = await aiRes.json();
    let rawContent = aiData?.choices?.[0]?.message?.content || '';
    
    // Strip markdown fences if present
    rawContent = rawContent.replace(/^```json?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();

    let research: any;
    try {
      research = JSON.parse(rawContent);
    } catch {
      console.error('Failed to parse AI response as JSON:', rawContent);
      research = {
        company_summary: rawContent.substring(0, 500),
        lead_bio: '',
        talking_points: [],
        potential_objections: [],
        conversation_summary: '',
        recommended_agenda: [],
      };
    }

    // Save to meeting record
    await supabase.from('meetings').update({
      prep_research: research,
      prep_generated_at: new Date().toISOString(),
    }).eq('id', meetingId);

    return new Response(JSON.stringify({ success: true, research }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('generate-meeting-prep error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

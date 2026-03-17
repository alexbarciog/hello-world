import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { campaign_id } = await req.json();
    if (!campaign_id) {
      return new Response(JSON.stringify({ error: "campaign_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Load the campaign config
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", campaign_id)
      .single();

    if (campaignError || !campaign) {
      return new Response(JSON.stringify({ error: "Campaign not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build context for AI
    const icpContext = {
      jobTitles: campaign.icp_job_titles ?? [],
      industries: campaign.icp_industries ?? [],
      companySizes: campaign.icp_company_sizes ?? [],
      locations: campaign.icp_locations ?? [],
      companyTypes: campaign.icp_company_types ?? [],
    };

    const signalContext = {
      engagementKeywords: campaign.engagement_keywords ?? [],
      influencerProfiles: campaign.influencer_profiles ?? [],
      competitorPages: campaign.competitor_pages ?? [],
      triggerJobChanges: campaign.trigger_job_changes ?? false,
      triggerFundedCompanies: campaign.trigger_funded_companies ?? false,
      triggerTopActive: campaign.trigger_top_active ?? false,
    };

    const hasSignalA = signalContext.influencerProfiles.length > 0 || signalContext.competitorPages.length > 0;
    const hasSignalB = signalContext.triggerJobChanges || signalContext.triggerFundedCompanies || signalContext.triggerTopActive;
    const hasSignalC = signalContext.engagementKeywords.length > 0;

    const precisionMode = campaign.precision_mode ?? "discovery";
    const scoreThreshold = precisionMode === "high_precision" ? 90 : 50;

    const systemPrompt = `You are a B2B lead generation AI. Generate realistic, diverse, and highly contextual lead personas based on the provided campaign configuration. Each lead should feel like a real person — use varied, realistic first and last names from different backgrounds. Always return valid JSON.`;

    const userPrompt = `Generate 8 high-intent B2B lead personas for this campaign:

Company: ${campaign.company_name ?? "Unknown"}
Industry: ${campaign.industry ?? "Unknown"}
Description: ${campaign.description ?? ""}
Pain Points: ${campaign.pain_points ?? ""}
Campaign Goal: ${campaign.campaign_goal ?? "start conversations"}

ICP Profile:
- Target Job Titles: ${icpContext.jobTitles.join(", ") || "Any"}
- Target Industries: ${icpContext.industries.join(", ") || "Any"}
- Company Sizes: ${icpContext.companySizes.join(", ") || "Any"}
- Locations: ${icpContext.locations.join(", ") || "Global"}

Intent Signals Available:
- Signal A (Social Intent): ${hasSignalA ? `Competitor pages: ${signalContext.competitorPages.join(", ")}; Influencers: ${signalContext.influencerProfiles.join(", ")}` : "Not configured"}
- Signal B (Growth Intent): Job changes=${signalContext.triggerJobChanges}, Funded=${signalContext.triggerFundedCompanies}, Top active=${signalContext.triggerTopActive}
- Signal C (Contextual Intent): Keywords: ${signalContext.engagementKeywords.join(", ") || "None"}

For each lead, determine which signals they triggered (A/B/C), then calculate a score:
- Base ICP match: 10-20 pts (if job title, industry, size all match = 20, partial = 10)
- Signal A hit: +40 pts
- Signal B hit: +35 pts
- Signal C hit: +25 pts

Return a JSON array of 8 leads. Each lead object:
{
  "name": "Full Name",
  "title": "Job Title",
  "company": "Company Name",
  "company_size": "51-200",
  "industry": "Industry Name",
  "location": "City, Country",
  "signal_a_hit": true/false,
  "signal_b_hit": true/false,
  "signal_c_hit": true/false,
  "score": 85,
  "reason": "One sentence explaining why this lead was selected, referencing specific signals and ICP match factors."
}

Make leads contextually accurate to the campaign. Vary name diversity. Make reasons specific and compelling.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "save_leads",
              description: "Save the generated leads array",
              parameters: {
                type: "object",
                properties: {
                  leads: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        title: { type: "string" },
                        company: { type: "string" },
                        company_size: { type: "string" },
                        industry: { type: "string" },
                        location: { type: "string" },
                        signal_a_hit: { type: "boolean" },
                        signal_b_hit: { type: "boolean" },
                        signal_c_hit: { type: "boolean" },
                        score: { type: "integer" },
                        reason: { type: "string" },
                      },
                      required: ["name", "title", "company", "score", "reason"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["leads"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "save_leads" } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits required. Please add funds to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "No leads generated by AI" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { leads: rawLeads } = JSON.parse(toolCall.function.arguments);

    // Apply precision filtering and assign precision_tier
    const scoredLeads = rawLeads
      .map((lead: any) => {
        // Recalculate score server-side to ensure integrity
        let score = 10; // base
        if (lead.signal_a_hit) score += 40;
        if (lead.signal_b_hit) score += 35;
        if (lead.signal_c_hit) score += 25;

        // Check ICP match bonus
        const titleMatch = icpContext.jobTitles.some((t: string) =>
          lead.title?.toLowerCase().includes(t.toLowerCase())
        );
        const industryMatch = icpContext.industries.some((i: string) =>
          lead.industry?.toLowerCase().includes(i.toLowerCase())
        );
        if (titleMatch) score += 5;
        if (industryMatch) score += 5;
        score = Math.min(score, 100);

        let precision_tier = "discovery";
        if (score >= 90) precision_tier = "hot";
        else if (score >= 70) precision_tier = "warm";

        return {
          campaign_id,
          name: lead.name,
          title: lead.title,
          company: lead.company,
          company_size: lead.company_size ?? null,
          industry: lead.industry ?? null,
          location: lead.location ?? null,
          signal_a_hit: lead.signal_a_hit ?? false,
          signal_b_hit: lead.signal_b_hit ?? false,
          signal_c_hit: lead.signal_c_hit ?? false,
          score,
          precision_tier,
          reason: lead.reason,
        };
      })
      .filter((lead: any) => lead.score >= scoreThreshold);

    // Insert leads into DB
    const { error: insertError } = await supabase.from("leads").insert(scoredLeads);
    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to save leads" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ success: true, leads_generated: scoredLeads.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("score-leads error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

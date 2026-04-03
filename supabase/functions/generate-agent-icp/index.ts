import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { agentName, website, companyName, industry, country, description, painPoints, campaignGoal, icpJobTitles, icpIndustries, icpCompanyTypes, icpCompanySizes, icpLocations, icpExcludeKeywords, precisionMode, engagementKeywords } = body;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const contextParts: string[] = [];
    if (companyName) contextParts.push(`Company: ${companyName}`);
    if (website) contextParts.push(`Website: ${website}`);
    if (industry) contextParts.push(`Industry: ${industry}`);
    if (country) contextParts.push(`Country: ${country}`);
    if (description) contextParts.push(`Description: ${description}`);
    if (painPoints) contextParts.push(`Pain points: ${painPoints}`);
    if (campaignGoal) contextParts.push(`Campaign goal: ${campaignGoal}`);
    if (icpJobTitles?.length) contextParts.push(`Existing target job titles: ${icpJobTitles.join(", ")}`);
    if (icpIndustries?.length) contextParts.push(`Existing target industries: ${icpIndustries.join(", ")}`);
    if (icpCompanyTypes?.length) contextParts.push(`Existing target company types: ${icpCompanyTypes.join(", ")}`);
    if (icpCompanySizes?.length) contextParts.push(`Existing target company sizes: ${icpCompanySizes.join(", ")}`);
    if (icpLocations?.length) contextParts.push(`Existing target locations: ${icpLocations.join(", ")}`);
    if (icpExcludeKeywords?.length) contextParts.push(`Excluded keywords: ${icpExcludeKeywords.join(", ")}`);
    if (precisionMode) contextParts.push(`Precision mode: ${precisionMode}`);
    if (engagementKeywords?.length) contextParts.push(`Engagement keywords: ${engagementKeywords.join(", ")}`);

    const businessInfo = contextParts.length > 0
      ? `\n\nBusiness context from onboarding:\n${contextParts.join("\n")}`
      : "";

    const ALLOWED_INDUSTRIES = ["Accounting","Advertising","Aerospace","Agriculture","AI & Machine Learning","Automotive","Banking","Biotech","Blockchain & Crypto","Chemical","Civil Engineering","Clean Energy","Cloud Computing","Construction","Consulting","Consumer Electronics","Cybersecurity","Data Analytics","Defense","E-commerce","Education","Energy & Utilities","Entertainment","Environmental Services","Event Management","Fashion & Apparel","Finance","Fintech","Food & Beverage","Gaming","Government","Healthcare","Hospitality & Tourism","HR & Recruiting","Insurance","Interior Design","IoT","Legal","Logistics & Supply Chain","Manufacturing","Marketing","Media & Publishing","Medical Devices","Mining","Non-Profit","Oil & Gas","Pharmaceutical","Photography","PropTech","Public Relations","Real Estate","Renewable Energy","Retail","Robotics","SaaS","Semiconductors","Sports & Fitness","Staffing","Technology","Telecommunications","Transportation","Travel","Venture Capital & Private Equity","Warehousing","Wellness & Health"];
    const ALLOWED_COMPANY_TYPES = ["Startup","SMB","Mid-Market","Enterprise","Agency","Non-Profit"];
    const ALLOWED_COMPANY_SIZES = ["1-10","11-50","51-200","201-500","501-1000","1000+"];

    const userPrompt = `Generate an ICP for an AI signal agent named "${agentName || "My Agent"}".${businessInfo}\n\nIMPORTANT: For industries, you MUST only select from this exact list: ${ALLOWED_INDUSTRIES.join(", ")}.\nFor company types, select from: ${ALLOWED_COMPANY_TYPES.join(", ")}.\nFor company sizes, select from: ${ALLOWED_COMPANY_SIZES.join(", ")}.\nDo NOT invent new values outside these lists.\n\nBased on this business information, suggest highly relevant and specific job titles, locations, industries, company types, company sizes, and keywords to exclude. The ICP should be tailored to this specific business.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "You are an expert B2B sales strategist. Generate an Ideal Customer Profile (ICP) for a signal agent based on the business context provided. Return structured data using the provided tool.",
          },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_icp",
              description: "Generate ICP configuration for a signal agent",
              parameters: {
                type: "object",
                properties: {
                  job_titles: { type: "array", items: { type: "string" }, description: "Target job titles (5-8 items)" },
                  locations: { type: "array", items: { type: "string" }, description: "Target geographic locations (3-5 items)" },
                  industries: { type: "array", items: { type: "string" }, description: "Target industries (3-6 items)" },
                  company_types: { type: "array", items: { type: "string" }, description: "Company types like Startup, Enterprise, SMB (2-4 items)" },
                  company_sizes: { type: "array", items: { type: "string" }, description: "Company size ranges like 1-10, 11-50, 51-200 (2-4 items)" },
                  exclude_keywords: { type: "array", items: { type: "string" }, description: "Companies or keywords to exclude (2-4 items)" },
                },
                required: ["job_titles", "locations", "industries", "company_types", "company_sizes", "exclude_keywords"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_icp" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limited. Try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Credits required." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway error: ${status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const icp = JSON.parse(toolCall.function.arguments);
    // Filter to only allowed values
    const allowedSet = new Set(ALLOWED_INDUSTRIES);
    const allowedTypesSet = new Set(ALLOWED_COMPANY_TYPES);
    const allowedSizesSet = new Set(ALLOWED_COMPANY_SIZES);
    if (icp.industries) icp.industries = icp.industries.filter((i: string) => allowedSet.has(i));
    if (icp.company_types) icp.company_types = icp.company_types.filter((t: string) => allowedTypesSet.has(t));
    if (icp.company_sizes) icp.company_sizes = icp.company_sizes.filter((s: string) => allowedSizesSet.has(s));
    return new Response(JSON.stringify(icp), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-agent-icp error:", e);
    return new Response(JSON.stringify({ error: e.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

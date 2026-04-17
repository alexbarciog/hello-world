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

    // ── If a website is provided, scrape it for fresh business context ──
    let scrapedSummary = "";
    if (website) {
      try {
        const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
        if (FIRECRAWL_API_KEY) {
          const url = website.startsWith("http") ? website : `https://${website}`;
          console.log("[generate-agent-icp] Scraping website:", url);
          const fcRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true }),
            signal: AbortSignal.timeout(20000),
          });
          if (fcRes.ok) {
            const fcData = await fcRes.json();
            const md: string = fcData?.data?.markdown || "";
            scrapedSummary = md.slice(0, 6000);
            console.log("[generate-agent-icp] Scraped chars:", scrapedSummary.length);
          } else {
            console.warn("[generate-agent-icp] Firecrawl failed:", fcRes.status);
          }
        }
      } catch (e) {
        console.warn("[generate-agent-icp] Website scrape failed:", e instanceof Error ? e.message : e);
      }
    }

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

    const websiteBlock = scrapedSummary ? `\n\n=== LIVE WEBSITE CONTENT (${website}) ===\n${scrapedSummary}\n=== END WEBSITE ===\n\nIMPORTANT: Ground the ICP in the LIVE WEBSITE CONTENT above. That is the source of truth for what this business actually sells.` : "";
    const businessInfo = contextParts.length > 0
      ? `\n\nBusiness context from onboarding:\n${contextParts.join("\n")}${websiteBlock}`
      : websiteBlock;

    const ALLOWED_INDUSTRIES = ["Accounting","Advertising","Aerospace","Agriculture","AI & Machine Learning","Automotive","Banking","Biotech","Blockchain & Crypto","Chemical","Civil Engineering","Clean Energy","Cloud Computing","Construction","Consulting","Consumer Electronics","Cybersecurity","Data Analytics","Defense","E-commerce","Education","Energy & Utilities","Entertainment","Environmental Services","Event Management","Fashion & Apparel","Finance","Fintech","Food & Beverage","Gaming","Government","Healthcare","Hospitality & Tourism","HR & Recruiting","Insurance","Interior Design","IoT","Legal","Logistics & Supply Chain","Manufacturing","Marketing","Media & Publishing","Medical Devices","Mining","Non-Profit","Oil & Gas","Pharmaceutical","Photography","PropTech","Public Relations","Real Estate","Renewable Energy","Retail","Robotics","SaaS","Semiconductors","Sports & Fitness","Staffing","Technology","Telecommunications","Transportation","Travel","Venture Capital & Private Equity","Warehousing","Wellness & Health"];
    const ALLOWED_COMPANY_TYPES = ["Startup","SMB","Mid-Market","Enterprise","Agency","Non-Profit"];
    const ALLOWED_COMPANY_SIZES = ["1-10","11-50","51-200","201-500","501-1000","1000+"];

    const userPrompt = `Generate a highly specific, aggressive ICP for this signal agent.

AGENT NAME: "${agentName || "My Agent"}"
${businessInfo}

WHAT I NEED YOU TO DO:
1. Identify the SINGLE most likely buyer persona for this business based on the description above
2. Generate job titles that EXACTLY match who would buy this — be specific to their role and seniority
3. Pick only the industries where this service is actually purchased regularly
4. Set company sizes that match where the budget and pain exist simultaneously
5. Add exclude keywords that will prevent wasting time on irrelevant leads

CRITICAL RULES:
- For industries: ONLY select from this exact list: ${ALLOWED_INDUSTRIES.join(", ")}
- For company types: ONLY select from: ${ALLOWED_COMPANY_TYPES.join(", ")}
- For company sizes: ONLY select from: ${ALLOWED_COMPANY_SIZES.join(", ")}
- Do NOT invent values outside these lists
- Job titles should be LinkedIn-searchable — exactly how someone would write their title on their profile
- Think about what the buyer's LinkedIn headline looks like, not what their formal HR title is

ANTI-PATTERNS TO AVOID:
- Do not add every industry — only the ones where this service is a regular purchase
- Do not add senior titles if the product targets mid-level buyers and vice versa
- Do not suggest locations based on where the company is — suggest where their CUSTOMERS are
- Do not generate safe, hedged ICPs — be opinionated and specific

Generate the ICP now.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content: `You are an aggressive B2B sales strategist. Your job is to generate the most specific, high-converting ICP possible for a signal agent that monitors LinkedIn for buying intent.

The ICP must be laser-focused on people who would ACTUALLY BUY the service being offered — not people who might be vaguely interested.

## How to think about this

Step 1 — What does this company SELL?
Read the description, pain points, and campaign goal carefully. Understand the exact service or product.

Step 2 — Who FEELS the pain most acutely?
Not who theoretically cares — who wakes up at 3am thinking about this problem?

Step 3 — Who HAS THE BUDGET to fix it?
At a startup (1-50 people) this is almost always the Founder or CEO.
At a mid-market company (50-500) this is a VP or Director level.
At enterprise this is a C-suite or SVP level.

Step 4 — Who ACTIVELY SEARCHES for this type of solution on LinkedIn?
These are your job titles. Be specific to the department that owns the problem.

## Job title rules
- If selling to small companies: include Founder, Co-founder, CEO — they DO make these decisions
- If selling design services: target the person who owns brand/marketing, not the designer
- If selling dev services: target the person who NEEDS dev work, not the developer
- Always include both the decision maker AND the champion who feels the pain daily
- 8-12 titles is better than 5-8. Cast a wide net within the right persona.
- Bad: "Executive", "Manager", "Director" — too generic
- Good: "Head of Marketing", "Founder", "VP Product", "Growth Lead" — specific enough to find on LinkedIn

## Location rules
- If company is in Romania or Eastern Europe, still suggest English-speaking markets (US, UK, Australia) unless they specifically said otherwise — that is where the budget is
- Default to 4-5 locations unless told otherwise

## Industry rules
- Be ruthless. Only include industries that would ACTUALLY pay for this service.
- 3-5 industries is enough. More than 6 means you are being too broad.
- Always pick from the allowed list provided.

## Exclude keywords rules
- Exclude competitors by name if you know them
- Exclude job-seeker signals: "looking for work", "open to opportunities", "freelance"
- Exclude students and interns always

Return precise, opinionated data. Do not hedge. Do not be generic. A focused ICP that finds 20 perfect leads is better than a broad ICP that finds 200 useless ones.`,
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
                  job_titles: { type: "array", items: { type: "string" }, description: "8-12 specific LinkedIn job titles of the BUYER persona. These should be exactly how someone writes their title on LinkedIn. Include both decision makers (VP/Director/Head of/Founder) and champions (the person who feels the pain daily). Tailor completely to what this specific business sells — a design agency targets Founders and CMOs at startups, not designers. A dev agency targets CTOs and Product Managers, not developers." },
                  locations: { type: "array", items: { type: "string" }, description: "Target geographic locations (4-5 items). Suggest where the CUSTOMERS are, not where the company is based." },
                  industries: { type: "array", items: { type: "string" }, description: "Target industries (3-5 items). Only industries that regularly purchase this type of service." },
                  company_types: { type: "array", items: { type: "string" }, description: "Company types like Startup, Enterprise, SMB (2-4 items)" },
                  company_sizes: { type: "array", items: { type: "string" }, description: "Company size ranges like 1-10, 11-50, 51-200 (2-4 items)" },
                  exclude_keywords: { type: "array", items: { type: "string" }, description: "Companies or keywords to exclude — always include job-seeker signals and student/intern (3-6 items)" },
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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// These MUST match the dropdown options in Step3ICP.tsx
const VALID_LOCATIONS = [
  "Global", "Europe", "North America", "South America", "Asia Pacific",
  "Middle East & Africa", "Western Europe", "Eastern Europe",
  "United States", "United Kingdom", "Germany", "France", "Romania",
  "Netherlands", "Spain", "Italy", "Poland", "Sweden", "Denmark",
  "Norway", "Finland", "Switzerland", "Austria", "Belgium", "Portugal",
  "Canada", "Australia", "India", "Singapore", "Brazil",
];

const VALID_COMPANY_TYPES = [
  "Private Company", "Public Company", "Startup", "SME",
  "Enterprise", "Non-Profit", "Government", "Partnership", "Sole Proprietorship",
];

const VALID_COMPANY_SIZES = [
  "1-10", "11-50", "51-200", "201-500", "501-1000", "1001-5000", "5000+",
];

const VALID_INDUSTRIES = [
  "Technology & Software", "E-commerce & Retail", "Food & Beverages",
  "Healthcare & Medical", "Finance & Banking", "Real Estate",
  "Education & Training", "Marketing & Advertising",
  "Consulting & Professional Services", "Manufacturing & Industrial",
  "Travel & Hospitality", "Media & Entertainment", "Non-Profit & NGO",
  "Legal Services", "Restaurants", "Logistics & Supply Chain", "Other",
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyName, industry, description, language } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are a world-class B2B sales strategist. Your job is to create an Ideal Customer Profile (ICP) — the profile of the BUYER, not the company itself.

Given a company's info, determine:
- WHO would buy their product/service? What job titles are the decision-makers and champions?
- WHERE are the best markets for this company to sell into?
- WHICH industries have the highest demand for what this company offers?
- WHAT type and size of companies are the best fit as customers?

Think strategically: the ICP should maximize the company's chances of closing deals. Consider:
- Pain points the company solves and who feels those pains most acutely
- Budget authority — who signs off on this type of purchase?
- Market fit — where is demand strongest for this offering?

CRITICAL CONSTRAINTS — you MUST only use values from these exact lists:

Target Locations (pick 1-3): ${JSON.stringify(VALID_LOCATIONS)}
Target Industries (pick 2-4): ${JSON.stringify(VALID_INDUSTRIES)}
Company Types (pick 1-3): ${JSON.stringify(VALID_COMPANY_TYPES)}
Company Sizes (pick 2-3): ${JSON.stringify(VALID_COMPANY_SIZES)}

For jobTitles, generate 3-6 specific, realistic titles (e.g., "VP of Engineering", "Head of Growth", "Chief Marketing Officer"). These are free-text and don't need to match a list.`;

    const userPrompt = `Company: ${companyName || 'Unknown'}
Industry: ${industry || 'Unknown'}
Description: ${description || 'No description provided'}
Language: ${language || 'English (US)'}

Create the ideal buyer profile for this company. Who should they target to win clients?`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'suggest_icp',
              description: 'Return a structured Ideal Customer Profile representing the ideal BUYER for this company.',
              parameters: {
                type: 'object',
                properties: {
                  jobTitles: {
                    type: 'array',
                    items: { type: 'string' },
                    description: '3-6 specific decision-maker job titles who would buy this product/service',
                  },
                  targetLocations: {
                    type: 'array',
                    items: { type: 'string' },
                    description: `1-3 locations from: ${VALID_LOCATIONS.join(', ')}`,
                  },
                  targetIndustries: {
                    type: 'array',
                    items: { type: 'string' },
                    description: `2-4 industries from: ${VALID_INDUSTRIES.join(', ')}`,
                  },
                  companyTypes: {
                    type: 'array',
                    items: { type: 'string' },
                    description: `1-3 company types from: ${VALID_COMPANY_TYPES.join(', ')}`,
                  },
                  companySizes: {
                    type: 'array',
                    items: { type: 'string' },
                    description: `2-3 sizes from: ${VALID_COMPANY_SIZES.join(', ')}`,
                  },
                },
                required: ['jobTitles', 'targetLocations', 'targetIndustries', 'companyTypes', 'companySizes'],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'suggest_icp' } },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('AI gateway error:', response.status, text);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      throw new Error('No tool call returned from AI');
    }

    let icp: Record<string, string[]>;
    try {
      icp = JSON.parse(toolCall.function.arguments);
    } catch {
      throw new Error('Failed to parse ICP from AI response');
    }

    // Validate against allowed values (filter out hallucinated options)
    icp.targetLocations = (icp.targetLocations || []).filter(v => VALID_LOCATIONS.includes(v));
    icp.targetIndustries = (icp.targetIndustries || []).filter(v => VALID_INDUSTRIES.includes(v));
    icp.companyTypes = (icp.companyTypes || []).filter(v => VALID_COMPANY_TYPES.includes(v));
    icp.companySizes = (icp.companySizes || []).filter(v => VALID_COMPANY_SIZES.includes(v));

    // Ensure at least some defaults if AI returned nothing valid
    if (icp.targetLocations.length === 0) icp.targetLocations = ['Europe'];
    if (icp.companyTypes.length === 0) icp.companyTypes = ['Private Company'];

    return new Response(JSON.stringify(icp), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('generate-icp error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

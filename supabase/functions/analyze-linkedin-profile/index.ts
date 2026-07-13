import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LINKEDIN_RE = /^https?:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\/in\/[^/?#\s]+/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const json = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !FIRECRAWL_API_KEY || !LOVABLE_API_KEY) {
      return json({ error: "Missing environment variables" }, 500);
    }

    const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    if (!jwt) return json({ error: "Not authenticated" }, 401);

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: userRes, error: userErr } = await admin.auth.getUser(jwt);
    if (userErr || !userRes?.user) return json({ error: "Not authenticated" }, 401);
    const user = userRes.user;

    const body = await req.json().catch(() => ({}));
    const linkedin_url = String(body.linkedin_url || "").trim();
    const service_description = String(body.service_description || "").trim().slice(0, 500);
    if (!LINKEDIN_RE.test(linkedin_url)) return json({ error: "Invalid LinkedIn URL" }, 400);
    if (service_description.length < 3) return json({ error: "Service description is required" }, 400);

    // Insert pending row
    const { data: row, error: insErr } = await admin
      .from("linkedin_profile_analyses")
      .insert({ user_id: user.id, linkedin_url, service_description, status: "pending" })
      .select("id")
      .single();
    if (insErr) throw insErr;
    const analysisId = row.id;

    // 1) Fetch profile page via Firecrawl
    let scraped: any = null;
    let scrapeError: string | null = null;
    try {
      const fcRes = await fetch("https://api.firecrawl.dev/v2/scrape", {
        method: "POST",
        headers: { Authorization: `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ url: linkedin_url, formats: ["markdown"], onlyMainContent: true }),
      });
      const fcBody = await fcRes.json().catch(() => ({}));
      if (!fcRes.ok) {
        scrapeError = fcBody?.error || `Firecrawl ${fcRes.status}`;
      } else {
        scraped = fcBody;
      }
    } catch (e) {
      scrapeError = e instanceof Error ? e.message : "Firecrawl error";
    }

    const profileMarkdown: string = (scraped?.markdown || scraped?.data?.markdown || "").slice(0, 12000);
    const profileTitle: string = scraped?.metadata?.title || scraped?.data?.metadata?.title || "";

    // If we couldn't scrape, still run AI with just the URL + description so the user gets something useful
    const systemPrompt = `You are a world-class LinkedIn conversion strategist. You audit LinkedIn profiles of founders, agency owners, freelancers, and consultants and identify EXACTLY why their profile isn't converting profile views into inbound sales conversations.

You are brutally specific, never generic. You reference concrete signals from the profile text.
You write rewrites in the person's voice — first-person, punchy, imperfect, no corporate fluff.
You NEVER use: "leverage", "synergy", "tech stack", "unlock", "empower", "unleash", "in today's world".

RESPOND ONLY via the audit_profile tool.`;

    const userPrompt = `LinkedIn URL: ${linkedin_url}
Profile page title: ${profileTitle || "(unknown)"}
Main service they told us they sell: "${service_description}"

RAW PROFILE CONTENT (scraped from public LinkedIn page):
"""
${profileMarkdown || "(Profile content could not be scraped — audit based on the service description and generate a best-effort profile assuming a typical LinkedIn setup for someone selling this service.)"}
"""

Audit this profile end-to-end. Focus on what's stopping inbound leads from booking a call.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "audit_profile",
              description: "Return the full structured LinkedIn profile audit.",
              parameters: {
                type: "object",
                properties: {
                  detected_services: { type: "array", items: { type: "string" }, description: "Services the AI thinks this person sells based on their profile. 2-5 items." },
                  overall_score: { type: "number", description: "0-100 conversion score." },
                  headline_score: { type: "number" },
                  about_score: { type: "number" },
                  banner_score: { type: "number" },
                  social_proof_score: { type: "number" },
                  headline_diagnosis: { type: "string", description: "1-2 sentences on what's wrong with the current headline." },
                  rewritten_headline: { type: "string", description: "A new headline (max 220 chars) written in their voice, ready to paste." },
                  about_diagnosis: { type: "string", description: "1-2 sentences on what's wrong with the About section." },
                  rewritten_about_hook: { type: "string", description: "The first 3 lines of a rewritten About section — hook, promise, proof." },
                  top_3_issues: {
                    type: "array",
                    description: "The top 3 issues silently killing their inbound.",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        why_it_costs_you: { type: "string", description: "Loss-framed reason this is costing them leads." },
                        exact_fix: { type: "string", description: "Concrete action they can take today." },
                      },
                      required: ["title", "why_it_costs_you", "exact_fix"],
                      additionalProperties: false,
                    },
                  },
                  missing_keywords: { type: "array", items: { type: "string" }, description: "5-8 keywords buyers of their service search for that are missing from the profile." },
                  conversion_signals_missing: { type: "array", items: { type: "string" }, description: "3-6 trust signals absent from the profile." },
                  quick_wins: { type: "array", items: { type: "string" }, description: "5-7 fast wins to implement today." },
                },
                required: [
                  "detected_services",
                  "overall_score",
                  "headline_score",
                  "about_score",
                  "banner_score",
                  "social_proof_score",
                  "headline_diagnosis",
                  "rewritten_headline",
                  "about_diagnosis",
                  "rewritten_about_hook",
                  "top_3_issues",
                  "missing_keywords",
                  "conversion_signals_missing",
                  "quick_wins",
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "audit_profile" } },
      }),
    });

    if (aiRes.status === 429) {
      await admin.from("linkedin_profile_analyses").update({ status: "failed", error: "rate_limited" }).eq("id", analysisId);
      return json({ error: "Too many requests. Please try again in a moment." }, 429);
    }
    if (aiRes.status === 402) {
      await admin.from("linkedin_profile_analyses").update({ status: "failed", error: "credits_exhausted" }).eq("id", analysisId);
      return json({ error: "AI credits exhausted. Please contact support." }, 402);
    }
    if (!aiRes.ok) {
      const t = await aiRes.text().catch(() => "");
      await admin.from("linkedin_profile_analyses").update({ status: "failed", error: `ai_${aiRes.status}` }).eq("id", analysisId);
      return json({ error: "AI request failed", details: t.slice(0, 500) }, aiRes.status);
    }
    const aiData = await aiRes.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      await admin.from("linkedin_profile_analyses").update({ status: "failed", error: "no_tool_call" }).eq("id", analysisId);
      return json({ error: "AI returned no structured output" }, 500);
    }
    const report = JSON.parse(toolCall.function.arguments);

    await admin
      .from("linkedin_profile_analyses")
      .update({ status: "ready", report, error: scrapeError })
      .eq("id", analysisId);

    // Upsert subscriber for weekly fake-opportunity emails
    try {
      const firstName = (user.user_metadata?.first_name as string | undefined) || (user.email || "").split("@")[0];
      await admin
        .from("profile_analyzer_subscribers")
        .upsert(
          {
            user_id: user.id,
            email: user.email!,
            first_name: firstName,
            linkedin_url,
            service_description,
            enabled: true,
          },
          { onConflict: "user_id" }
        );
    } catch (e) {
      console.warn("[analyze-li] subscriber upsert failed", e);
    }

    return json({ id: analysisId, status: "ready", report, scrape_error: scrapeError });
  } catch (error) {
    console.error("[analyze-li] fatal", error);
    return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});

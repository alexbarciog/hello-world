import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const UNIPILE_DSN = Deno.env.get("UNIPILE_DSN")!;
const UNIPILE_API_KEY = Deno.env.get("UNIPILE_API_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const AVATAR_COLORS = ["orange","blue","green","purple","pink","teal","red","indigo"];
function pickColor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = seed.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

// Map UI seniority labels -> Unipile classic seniority codes
const SENIORITY_MAP: Record<string, string> = {
  "owner": "owner",
  "founder": "owner",
  "c-level": "cxo",
  "vp": "vp",
  "director": "director",
  "head of": "senior",
};

// Approx Unipile classic function codes
const FUNCTION_MAP: Record<string, string> = {
  "sales": "sales",
  "marketing": "marketing",
  "operations": "operations",
  "engineering": "engineering",
  "product": "product_management",
  "finance": "finance",
  "hr": "human_resources",
  "other": "",
};

// Seniority ranking for sorting (higher = better)
const SENIORITY_RANK: Record<string, number> = {
  "owner": 100,
  "cxo": 90,
  "partner": 85,
  "vp": 80,
  "director": 70,
  "senior": 60,
};

function extractCompanyPublicId(url: string): string | null {
  const m = url.match(/linkedin\.com\/(?:company|school|showcase)\/([^/?#]+)/i);
  return m ? decodeURIComponent(m[1]) : null;
}

async function unipileFetch(path: string, accountId: string, body: Record<string, unknown>, signal?: AbortSignal) {
  const url = `https://${UNIPILE_DSN}${path}${path.includes("?") ? "&" : "?"}account_id=${encodeURIComponent(accountId)}`;
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "X-API-KEY": UNIPILE_API_KEY,
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify(body),
    signal,
  });
  const text = await resp.text();
  let payload: any = {};
  try { payload = JSON.parse(text); } catch { /* ignore */ }
  return { ok: resp.ok, status: resp.status, payload, text };
}

async function unipileGet(path: string, accountId: string, signal?: AbortSignal) {
  const url = `https://${UNIPILE_DSN}${path}${path.includes("?") ? "&" : "?"}account_id=${encodeURIComponent(accountId)}`;
  const resp = await fetch(url, {
    method: "GET",
    headers: {
      "X-API-KEY": UNIPILE_API_KEY,
      accept: "application/json",
    },
    signal,
  });
  const text = await resp.text();
  let payload: any = {};
  try { payload = JSON.parse(text); } catch { /* ignore */ }
  return { ok: resp.ok, status: resp.status, payload, text };
}

async function callAI(prompt: string, system: string): Promise<string> {
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!resp.ok) {
    const t = await resp.text();
    console.error("AI gateway error", resp.status, t);
    return "";
  }
  const data = await resp.json();
  return data?.choices?.[0]?.message?.content || "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) return json({ error: "Unauthorized" }, 401);
    const userId = claimsData.claims.sub as string;

    const body = await req.json().catch(() => ({}));
    const seed_urls: string[] = Array.isArray(body.seed_urls) ? body.seed_urls.map((u: string) => String(u).trim()).filter(Boolean) : [];
    const filters = body.filters || {};
    const list_id: string | undefined = body.list_id || undefined;
    const new_list_name: string | undefined = body.new_list_name?.trim() || undefined;
    const signal_mode: "industry" | "ai" = body.signal_mode === "ai" ? "ai" : "industry";

    if (seed_urls.length < 3 || seed_urls.length > 4) {
      return json({ error: "Provide 3 to 4 LinkedIn company URLs" }, 400);
    }
    if (!seed_urls.every((u) => /linkedin\.com\/(?:company|school|showcase)\//i.test(u))) {
      return json({ error: "All seed URLs must be linkedin.com/company/... pages" }, 400);
    }
    if (!list_id && !new_list_name) {
      return json({ error: "Provide list_id or new_list_name" }, 400);
    }

    const max_companies = Math.max(5, Math.min(100, Number(filters.max_companies) || 25));
    const max_per_company = Math.max(1, Math.min(3, Number(filters.max_per_company) || 2));
    const seniorities: string[] = Array.isArray(filters.seniorities) ? filters.seniorities : ["owner","founder","c-level","vp","director","head of"];
    const functions: string[] = Array.isArray(filters.functions) ? filters.functions : [];
    const userIndustries: string[] = Array.isArray(filters.industries) ? filters.industries : [];
    const companySizes: string[] = Array.isArray(filters.company_sizes) ? filters.company_sizes : [];
    const locations: string[] = Array.isArray(filters.locations) ? filters.locations : [];

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Resolve org & unipile account
    const { data: profile } = await admin
      .from("profiles")
      .select("current_organization_id")
      .eq("user_id", userId)
      .maybeSingle();
    const orgId = profile?.current_organization_id;
    if (!orgId) return json({ error: "No active organization" }, 400);

    const { data: org } = await admin
      .from("organizations")
      .select("unipile_account_id")
      .eq("id", orgId)
      .maybeSingle();
    const accountId = org?.unipile_account_id;
    if (!accountId) return json({ error: "LinkedIn account not connected for this workspace" }, 400);

    // Resolve target list
    let targetListId = list_id;
    let listName = "";
    if (!targetListId && new_list_name) {
      const { data: created, error: listErr } = await admin
        .from("lists")
        .insert({
          name: new_list_name,
          user_id: userId,
          organization_id: orgId,
          description: "Lookalike leads",
        })
        .select("id, name")
        .single();
      if (listErr) return json({ error: `Failed to create list: ${listErr.message}` }, 500);
      targetListId = created.id;
      listName = created.name;
    } else if (targetListId) {
      const { data: l } = await admin.from("lists").select("name").eq("id", targetListId).maybeSingle();
      listName = l?.name || "Lookalike leads";
    }

    // Create run record
    const { data: run, error: runErr } = await admin
      .from("lookalike_runs")
      .insert({
        user_id: userId,
        organization_id: orgId,
        status: "profiling",
        seed_urls,
        filters,
        list_id: targetListId,
      })
      .select("id")
      .single();
    if (runErr) return json({ error: `Failed to create run: ${runErr.message}` }, 500);
    const runId = run.id;

    const controller = new AbortController();
    const overallTimeout = setTimeout(() => controller.abort(), 90_000);

    let inserted = 0;
    let duplicates = 0;
    let companies_scanned = 0;
    let decision_makers_found = 0;

    try {
      // ───────── Step 1: Seed enrichment (companies) ─────────
      const seedCompanies: Array<{ url: string; id: string | null; name: string; industry: string; description: string; size: string }> = [];
      for (const url of seed_urls) {
        const publicId = extractCompanyPublicId(url);
        if (!publicId) continue;
        const { ok, payload } = await unipileGet(`/api/v1/linkedin/company/${encodeURIComponent(publicId)}`, accountId, controller.signal);
        if (!ok) {
          // Still record minimal info so the pipeline can continue
          seedCompanies.push({ url, id: null, name: publicId, industry: "", description: "", size: "" });
          continue;
        }
        const p = payload || {};
        seedCompanies.push({
          url,
          id: p.id || p.entity_urn || p.provider_id || null,
          name: p.name || publicId,
          industry: p.industry || p.industry_name || (Array.isArray(p.industries) ? p.industries[0] : "") || "",
          description: p.description || p.tagline || "",
          size: p.staff_count || p.staff_count_range || p.company_size || "",
        });
        await new Promise((r) => setTimeout(r, 150));
      }

      // ───────── Step 2: ICP synthesis ─────────
      await admin.from("lookalike_runs").update({ status: "searching_companies" }).eq("id", runId);

      const seedSummary = seedCompanies.map((s, i) => `Seed ${i+1}: ${s.name} — industry: ${s.industry || "n/a"}${s.description ? ` — ${String(s.description).slice(0, 200)}` : ""}`).join("\n");
      const userIndustriesText = userIndustries.length ? `User-selected industries: ${userIndustries.join(", ")}` : "";
      const aiPrompt = `Best customer companies (lookalike seeds):\n${seedSummary}\n\n${userIndustriesText}\n\nReturn JSON with:\n- "industry_keywords": 3-5 short LinkedIn-search keywords for company industries (strings)\n- "icp_summary": one sentence describing the ICP`;
      const aiRaw = await callAI(aiPrompt, "You are a B2B sales strategist. Return ONLY valid JSON, no markdown.");
      let icp: { industry_keywords: string[]; icp_summary: string } = { industry_keywords: [], icp_summary: "" };
      try {
        const cleaned = aiRaw.replace(/```json\s*|\s*```/g, "").trim();
        icp = JSON.parse(cleaned);
      } catch {
        icp.industry_keywords = [...new Set(seedCompanies.map((s) => s.industry).filter(Boolean))].slice(0, 5);
      }
      // Merge user-selected industries first
      const industryKeywords = [...new Set([...userIndustries, ...(icp.industry_keywords || [])])].slice(0, 5);
      const searchKeywords = industryKeywords.join(" OR ") || seedCompanies[0]?.industry || "";

      // ───────── Step 3: Company search ─────────
      const companies: Array<{ id: string; name: string; industry?: string }> = [];
      const seenCompanyIds = new Set<string>();
      let cursor: string | null = null;
      const COMPANY_PAGE_SIZE = 50;

      // Pre-fetch existing org companies for dedup
      const { data: existingContacts } = await admin
        .from("contacts")
        .select("company")
        .eq("organization_id", orgId)
        .not("company", "is", null);
      const existingCompanies = new Set<string>(
        (existingContacts || []).map((r: any) => String(r.company || "").toLowerCase().trim()).filter(Boolean)
      );
      // Also exclude the seed companies themselves
      seedCompanies.forEach((s) => { if (s.name) existingCompanies.add(s.name.toLowerCase().trim()); });

      for (let p = 0; p < 5 && companies.length < max_companies; p++) {
        const searchBody: Record<string, unknown> = {
          api: "classic",
          category: "companies",
          keywords: searchKeywords,
          limit: Math.min(COMPANY_PAGE_SIZE, max_companies - companies.length),
        };
        if (companySizes.length) searchBody.company_size = companySizes;
        if (locations.length) searchBody.location = locations;
        if (cursor) searchBody.cursor = cursor;

        const { ok, payload, status, text } = await unipileFetch(`/api/v1/linkedin/search`, accountId, searchBody, controller.signal);
        if (!ok) {
          console.error("Company search failed", status, text.slice(0, 300));
          if (p === 0) throw new Error(`Company search failed (${status})`);
          break;
        }
        const items: any[] = payload.items || payload.data || [];
        cursor = payload.cursor || payload.next_cursor || null;

        for (const it of items) {
          const cid = it.id || it.entity_urn || it.company_id || it.public_identifier;
          if (!cid) continue;
          const cidStr = String(cid);
          if (seenCompanyIds.has(cidStr)) continue;
          const name = it.name || it.company_name || "";
          if (!name) continue;
          if (existingCompanies.has(name.toLowerCase().trim())) continue;
          seenCompanyIds.add(cidStr);
          companies.push({ id: cidStr, name, industry: it.industry || it.industry_name });
          if (companies.length >= max_companies) break;
        }
        if (!cursor || items.length === 0) break;
        await new Promise((r) => setTimeout(r, 200));
      }
      companies_scanned = companies.length;

      // ───────── Step 4: Decision-maker extraction ─────────
      await admin.from("lookalike_runs").update({ status: "extracting_dms", companies_scanned }).eq("id", runId);

      const seniorityCodes = [...new Set(seniorities.map((s) => SENIORITY_MAP[s.toLowerCase()]).filter(Boolean))];
      const functionCodes = functions.map((f) => FUNCTION_MAP[f.toLowerCase()]).filter(Boolean);

      const allLeads: Array<{
        company: { id: string; name: string; industry?: string };
        seedMatch: typeof seedCompanies[0];
        candidate: any;
        rank: number;
      }> = [];

      for (const company of companies) {
        if (controller.signal.aborted) break;
        const peopleBody: Record<string, unknown> = {
          api: "classic",
          category: "people",
          company: [company.id],
          limit: Math.max(5, max_per_company * 3),
        };
        if (seniorityCodes.length) peopleBody.seniority = seniorityCodes;
        if (functionCodes.length) peopleBody.function = functionCodes;

        const { ok, payload } = await unipileFetch(`/api/v1/linkedin/search`, accountId, peopleBody, controller.signal);
        if (!ok) continue;
        const items: any[] = payload.items || payload.data || [];

        const ranked = items.map((it) => {
          const sen = String(it.seniority || it.seniority_level || "").toLowerCase();
          let rank = SENIORITY_RANK[sen] || 50;
          const headline = String(it.headline || it.title || "").toLowerCase();
          if (/founder|co-founder|owner/.test(headline)) rank += 20;
          else if (/chief|cxo|cmo|ceo|cto|cfo|coo/.test(headline)) rank += 15;
          else if (/vp|vice president/.test(headline)) rank += 10;
          else if (/director/.test(headline)) rank += 5;
          else if (/head of/.test(headline)) rank += 3;
          return { it, rank };
        }).sort((a, b) => b.rank - a.rank).slice(0, max_per_company);

        // Find best matching seed (by industry similarity, fall back to first)
        const seedMatch = seedCompanies.find((s) => s.industry && company.industry && s.industry.toLowerCase() === String(company.industry).toLowerCase()) || seedCompanies[0];

        for (const { it, rank } of ranked) {
          allLeads.push({ company, seedMatch, candidate: it, rank });
        }
        decision_makers_found += ranked.length;
        await new Promise((r) => setTimeout(r, 150));
      }

      // ───────── Step 5: Build candidate rows + dedup ─────────
      const candidates = allLeads.map(({ company, seedMatch, candidate }) => {
        const profileId = candidate.id || candidate.member_id || candidate.profile_id || candidate.entity_urn || candidate.public_identifier || candidate.public_id || null;
        const publicId = candidate.public_identifier || candidate.public_id || null;
        const linkedinUrl = publicId ? `https://www.linkedin.com/in/${publicId}` : candidate.profile_url || candidate.url || null;
        const firstName = candidate.first_name || candidate.firstName || (candidate.name ? String(candidate.name).split(" ")[0] : "") || "Unknown";
        const lastName = candidate.last_name || candidate.lastName || (candidate.name ? String(candidate.name).split(" ").slice(1).join(" ") : "") || null;
        const headline = candidate.headline || candidate.title || candidate.occupation || null;
        const industry = candidate.industry || candidate.industry_name || company.industry || null;
        return {
          linkedin_profile_id: profileId ? String(profileId) : null,
          linkedin_url: linkedinUrl,
          first_name: firstName,
          last_name: lastName,
          title: headline,
          company: company.name,
          industry,
          seedMatch,
        };
      }).filter((c) => c.linkedin_profile_id || c.linkedin_url);

      const profileIds = candidates.map((c) => c.linkedin_profile_id).filter(Boolean) as string[];
      const urls = candidates.map((c) => c.linkedin_url).filter(Boolean) as string[];
      const existingIds = new Set<string>();
      const existingUrls = new Set<string>();
      if (profileIds.length) {
        const { data: ex } = await admin.from("contacts").select("linkedin_profile_id").eq("organization_id", orgId).in("linkedin_profile_id", profileIds);
        ex?.forEach((r: any) => r.linkedin_profile_id && existingIds.add(r.linkedin_profile_id));
      }
      if (urls.length) {
        const { data: exU } = await admin.from("contacts").select("linkedin_url").eq("organization_id", orgId).in("linkedin_url", urls);
        exU?.forEach((r: any) => r.linkedin_url && existingUrls.add(r.linkedin_url));
      }

      const toInsert = candidates.filter((c) => {
        const dupId = c.linkedin_profile_id && existingIds.has(c.linkedin_profile_id);
        const dupUrl = c.linkedin_url && existingUrls.has(c.linkedin_url);
        if (dupId || dupUrl) { duplicates++; return false; }
        return true;
      });

      // ───────── Step 6: Signal generation ─────────
      const signals: string[] = [];
      if (signal_mode === "industry") {
        for (const c of toInsert) {
          const ind = c.industry || "their industry";
          signals.push(`Works in ${ind} — lookalike of ${c.seedMatch?.name || "your best client"}`);
        }
      } else {
        // Batch AI calls (10 leads each)
        const BATCH = 10;
        for (let i = 0; i < toInsert.length; i += BATCH) {
          if (controller.signal.aborted) break;
          const batch = toInsert.slice(i, i + BATCH);
          const prompt = `For each lead, return a one-sentence signal (≤140 chars) explaining why this lead matches our ICP. Reference what makes their company similar to our best customer.\n\n` +
            batch.map((c, idx) => `${idx+1}. ${c.first_name} ${c.last_name || ""} — ${c.title || ""} @ ${c.company} (industry: ${c.industry || "n/a"}). Best-customer match: ${c.seedMatch?.name || ""} (industry: ${c.seedMatch?.industry || "n/a"})`).join("\n") +
            `\n\nReturn JSON: {"signals": ["sentence 1", "sentence 2", ...]} matching the order above.`;
          const raw = await callAI(prompt, "You write concise B2B sales signals. Return ONLY valid JSON.");
          let parsed: { signals: string[] } = { signals: [] };
          try {
            const cleaned = raw.replace(/```json\s*|\s*```/g, "").trim();
            parsed = JSON.parse(cleaned);
          } catch { /* fallback below */ }
          for (let j = 0; j < batch.length; j++) {
            const s = parsed.signals?.[j];
            if (s && typeof s === "string") signals.push(s.slice(0, 200));
            else signals.push(`Decision-maker at ${batch[j].company} — lookalike of ${batch[j].seedMatch?.name || "your best client"}`);
          }
        }
      }

      // ───────── Step 7: Insert ─────────
      if (toInsert.length > 0) {
        const rows = toInsert.map((c, idx) => ({
          user_id: userId,
          organization_id: orgId,
          first_name: c.first_name,
          last_name: c.last_name,
          title: c.title,
          company: c.company,
          industry: c.industry,
          linkedin_url: c.linkedin_url,
          linkedin_profile_id: c.linkedin_profile_id,
          relevance_tier: "warm",
          approval_status: "auto_approved",
          signal: signals[idx] || `Lookalike of ${c.seedMatch?.name || "your best client"}`,
          signal_a_hit: true,
          ai_score: 7,
          company_icon_color: pickColor(c.company || c.first_name),
          list_name: listName || null,
        }));

        // Insert in chunks
        const CHUNK = 100;
        for (let i = 0; i < rows.length; i += CHUNK) {
          const chunk = rows.slice(i, i + CHUNK);
          const { data: ins, error: insErr } = await admin.from("contacts").insert(chunk).select("id");
          if (insErr) { console.error("Insert error", insErr); continue; }
          if (targetListId && ins?.length) {
            await admin.from("contact_lists").insert(ins.map((r: any) => ({ list_id: targetListId, contact_id: r.id })));
          }
          inserted += ins?.length || 0;
        }
      }

      await admin.from("lookalike_runs").update({
        status: "completed",
        inserted,
        duplicates,
        companies_scanned,
        decision_makers_found,
      }).eq("id", runId);

      return json({ success: true, inserted, duplicates, companies_scanned, decision_makers_found, list_id: targetListId, run_id: runId });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      console.error("find-lookalike-leads pipeline error", e);
      await admin.from("lookalike_runs").update({
        status: "failed",
        error: msg,
        inserted,
        duplicates,
        companies_scanned,
        decision_makers_found,
      }).eq("id", runId);
      return json({ error: msg, run_id: runId, inserted, duplicates, companies_scanned }, 500);
    } finally {
      clearTimeout(overallTimeout);
    }
  } catch (e) {
    console.error("find-lookalike-leads error", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return json({ error: msg }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

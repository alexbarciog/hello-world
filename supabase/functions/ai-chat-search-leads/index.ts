// AI Chat — searches LinkedIn via Unipile based on accumulated criteria
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Criteria {
  role?: string;
  industries?: string[];
  locations?: string[];
  company_sizes?: string[];
  exclude_keywords?: string[];
  intent_keywords?: string[];
}

interface LeadOut {
  linkedin_url: string;
  first_name: string;
  last_name: string;
  full_name: string;
  title: string;
  company: string;
  location: string;
  avatar_url?: string;
  match_score: number;
  reasons: string[];
}

function buildSearchKeywords(c: Criteria): string {
  const parts: string[] = [];
  if (c.role) parts.push(c.role);
  if (c.intent_keywords?.length) parts.push(c.intent_keywords.slice(0, 2).join(" "));
  return parts.join(" ").trim() || "founder";
}

function scoreLead(lead: any, c: Criteria): { score: number; reasons: string[] } {
  let score = 50;
  const reasons: string[] = [];
  const title = String(lead.headline ?? lead.title ?? "").toLowerCase();
  const company = String(lead.current_company ?? lead.company ?? "").toLowerCase();
  const location = String(lead.location ?? "").toLowerCase();

  if (c.role) {
    const role = c.role.toLowerCase();
    if (title.includes(role)) { score += 20; reasons.push(`Title matches "${c.role}"`); }
  }
  for (const ind of c.industries ?? []) {
    if (company.includes(ind.toLowerCase()) || title.includes(ind.toLowerCase())) {
      score += 8; reasons.push(`Works in ${ind}`); break;
    }
  }
  for (const loc of c.locations ?? []) {
    if (location.includes(loc.toLowerCase())) {
      score += 10; reasons.push(`Based in ${loc}`); break;
    }
  }
  for (const intent of c.intent_keywords ?? []) {
    if (title.includes(intent.toLowerCase())) {
      score += 7; reasons.push(`Signals: ${intent}`); break;
    }
  }
  for (const excl of c.exclude_keywords ?? []) {
    if (title.includes(excl.toLowerCase()) || company.includes(excl.toLowerCase())) {
      score -= 30; reasons.push(`Contains excluded term "${excl}"`);
    }
  }
  if (reasons.length === 0 && lead.headline) reasons.push(lead.headline.slice(0, 80));
  return { score: Math.max(0, Math.min(100, score)), reasons: reasons.slice(0, 3) };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { Authorization: authHeader, apikey: anonKey },
    });
    if (!userRes.ok) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const user = await userRes.json();

    const { criteria = {}, excludeLinkedInUrls = [] } = await req.json();
    const c = criteria as Criteria;

    // Get user's Unipile account
    const profileRes = await fetch(`${supabaseUrl}/rest/v1/profiles?user_id=eq.${user.id}&select=unipile_account_id`, {
      headers: { Authorization: authHeader, apikey: anonKey },
    });
    const profiles = await profileRes.json();
    const accountId = profiles?.[0]?.unipile_account_id;
    if (!accountId) {
      return new Response(JSON.stringify({ error: "Connect your LinkedIn account first via Integrations." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const unipileDsn = Deno.env.get("UNIPILE_DSN");
    const unipileKey = Deno.env.get("UNIPILE_API_KEY");
    if (!unipileDsn || !unipileKey) throw new Error("Unipile not configured");

    const keywords = buildSearchKeywords(c);
    const exclude = new Set<string>(excludeLinkedInUrls.map((u: string) => u.toLowerCase()));

    // Unipile classic LinkedIn people search
    const searchBody: any = {
      api: "classic",
      category: "people",
      keywords,
    };

    const searchRes = await fetch(`https://${unipileDsn}/api/v1/linkedin/search?account_id=${accountId}&limit=30`, {
      method: "POST",
      headers: { "X-API-KEY": unipileKey, "Content-Type": "application/json", accept: "application/json" },
      body: JSON.stringify(searchBody),
    });

    if (!searchRes.ok) {
      const txt = await searchRes.text();
      console.error("Unipile search error", searchRes.status, txt);
      throw new Error(`Unipile search failed: ${searchRes.status}`);
    }

    const searchData = await searchRes.json();
    const items: any[] = searchData.items ?? searchData.data ?? [];

    const leads: LeadOut[] = [];
    for (const it of items) {
      const publicId = it.public_identifier ?? it.public_id ?? it.profile_url?.split("/in/")?.[1]?.replace(/\/$/, "");
      const linkedinUrl = it.profile_url ?? (publicId ? `https://www.linkedin.com/in/${publicId}` : "");
      if (!linkedinUrl || exclude.has(linkedinUrl.toLowerCase())) continue;

      const firstName = it.first_name ?? it.name?.split(" ")?.[0] ?? "";
      const lastName = it.last_name ?? it.name?.split(" ")?.slice(1)?.join(" ") ?? "";
      const fullName = it.name ?? `${firstName} ${lastName}`.trim();

      const lead = {
        first_name: firstName,
        last_name: lastName,
        full_name: fullName || "Unknown",
        title: it.headline ?? it.title ?? it.current_position ?? "",
        company: it.current_company ?? it.company ?? "",
        location: it.location ?? "",
        avatar_url: it.profile_picture_url ?? it.avatar_url ?? undefined,
        linkedin_url: linkedinUrl,
        headline: it.headline,
      };

      const { score, reasons } = scoreLead(lead, c);
      if (score < 30) continue;

      leads.push({
        linkedin_url: lead.linkedin_url,
        first_name: lead.first_name,
        last_name: lead.last_name,
        full_name: lead.full_name,
        title: lead.title,
        company: lead.company,
        location: lead.location,
        avatar_url: lead.avatar_url,
        match_score: score,
        reasons,
      });
    }

    leads.sort((a, b) => b.match_score - a.match_score);
    const top = leads.slice(0, 15);

    return new Response(JSON.stringify({ leads: top, total_found: items.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("ai-chat-search-leads error", e);
    return new Response(JSON.stringify({ error: e.message ?? "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

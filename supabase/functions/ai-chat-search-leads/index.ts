// AI Chat — finds high-intent buyer LEADS by:
//   1) AI-generating sharp buyer-intent search queries from criteria
//   2) Searching LinkedIn POSTS (past week) via Unipile for each query
//   3) AI-scoring each post for buying intent (0-100), keeping ≥80
//   4) Returning the post AUTHORS as leads, with the signal post URL + reason
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
  // Free-form description of what the user is selling — comes from chat history
  selling?: string;
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
  decisioner_score: number;
  reasons: string[];
  signal_post_url?: string;
  signal_post_excerpt?: string;
}

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

// ── STAGE 1 ── AI generates demand-side, buyer-intent queries
//   - Exactly 5 short keyword queries
//   - Each query is 2–3 words MAX (Unipile post search works best on tight phrases)
//   - Avoid any keyword we already tried in previous searches this session
async function generateBuyerIntentQueries(c: Criteria, previousKeywords: string[] = []): Promise<string[]> {
  const cleanPrev = Array.from(new Set(previousKeywords.map((k) => String(k).toLowerCase().trim()).filter(Boolean)));
  const fallback = (c.intent_keywords?.length ? c.intent_keywords : [c.role || "need help"]).slice(0, 5);
  if (!LOVABLE_API_KEY) return fallback;

  const prompt = `You are a B2B buyer-intent research expert. Your job: produce LinkedIn POST search keywords that surface people EXPRESSING DEMAND (not vendors selling).

INPUT CRITERIA:
- Target role: ${c.role || "any"}
- Industries: ${(c.industries || []).join(", ") || "any"}
- Locations: ${(c.locations || []).join(", ") || "any"}
- What the user is offering / wants buyers for: ${c.selling || c.intent_keywords?.join(", ") || "(unspecified — infer from intent_keywords)"}

${cleanPrev.length > 0 ? `ALREADY TRIED (do NOT repeat these or close paraphrases — pick fresh angles):
${cleanPrev.map((k) => `- ${k}`).join("\n")}
` : ""}
HARD RULES:
- Return EXACTLY 5 keyword phrases.
- Each phrase MUST be 2 or 3 words. Never 1 word, never 4+ words.
- Use BUYER language pairing demand verbs/adjectives with the offering noun (e.g. "need recruiters", "hiring SDRs", "looking CRM", "tired Apollo", "best ATS", "switching HubSpot", "scaling outbound").
- Each of the 5 phrases must target a DIFFERENT angle (pain, evaluation, switching, hiring trigger, growth trigger, frustration).
- NEVER use vendor/seller phrasing ("our platform", "we help"). NEVER include hashtags, quotes, AND/OR operators, or punctuation.
- Phrases must be DIFFERENT from anything in the ALREADY TRIED list (no synonyms, no plural variants).
- Return ONLY a JSON array of 5 strings, nothing else.

Example for "lead generation platform" (already tried: "need leads"):
["tired apollo", "switching zoominfo", "best b2b leads", "scaling outbound", "hiring SDRs"]`;

  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 12000);
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_API_KEY}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
      }),
      signal: ctrl.signal,
    }).finally(() => clearTimeout(t));
    if (!res.ok) return fallback;
    const data = await res.json();
    const txt: string = data.choices?.[0]?.message?.content ?? "";
    const match = txt.match(/\[[\s\S]*\]/);
    if (!match) return fallback;
    const arr = JSON.parse(match[0]);
    if (!Array.isArray(arr)) return fallback;
    const prevSet = new Set(cleanPrev);
    const cleaned = arr
      .map(String)
      .map((s) => s.trim().replace(/["'#]/g, "").replace(/\s+/g, " "))
      .filter(Boolean)
      .filter((s) => {
        const wc = s.split(" ").length;
        return wc >= 2 && wc <= 3;
      })
      .filter((s) => !prevSet.has(s.toLowerCase()))
      .filter((s, i, a) => a.findIndex((x) => x.toLowerCase() === s.toLowerCase()) === i)
      .slice(0, 5);
    return cleaned.length > 0 ? cleaned : fallback;
  } catch (e) {
    console.warn("[AI_CHAT_SEARCH] keyword gen failed:", e instanceof Error ? e.message : e);
    return fallback;
  }
}

// ── Derive `selling` from the chat conversation when criteria.selling is missing.
// This is critical: without `selling`, query generation hallucinates topics.
async function deriveSellingFromConversation(
  conversation: { role: string; content: string }[],
): Promise<string> {
  if (!LOVABLE_API_KEY || !Array.isArray(conversation) || conversation.length === 0) return "";
  // Take the last ~20 turns of just user+assistant
  const trimmed = conversation
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-20)
    .map((m) => `${m.role === "user" ? "USER" : "ASSISTANT"}: ${m.content.slice(0, 800)}`)
    .join("\n");
  if (!trimmed.trim()) return "";

  const prompt = `Read this chat between a B2B founder (USER) and an AI lead-finder (ASSISTANT). Extract ONE sentence describing what the USER is selling/offering, written from a BUYER's perspective (what a buyer would search for). If the user is vague, use the most concrete clue. Return ONLY the sentence, no quotes, no preamble. If genuinely impossible, return an empty string.

CHAT:
${trimmed}

OFFERING (one sentence, buyer's perspective):`;

  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 10000);
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_API_KEY}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
      }),
      signal: ctrl.signal,
    }).finally(() => clearTimeout(t));
    if (!res.ok) return "";
    const data = await res.json();
    const txt: string = (data.choices?.[0]?.message?.content ?? "").trim().replace(/^["']|["']$/g, "");
    if (txt.length < 5 || txt.length > 300) return "";
    return txt;
  } catch (e) {
    console.warn("[AI_CHAT_SEARCH] deriveSelling failed:", e instanceof Error ? e.message : e);
    return "";
  }
}

// ── Cheap topical pre-filter: extract content words from `selling` and require
// at least one to appear in the post text. Saves AI scoring on obvious off-topic posts.
function extractTopicTokens(selling: string): string[] {
  const STOP = new Set([
    "a","an","the","and","or","of","for","to","in","on","with","that","is","are","be","my","our","your","their",
    "this","these","those","it","at","as","by","from","into","up","down","out","over","under","i","we","you","they",
    "platform","tool","tools","service","services","software","app","application","system","solution","solutions",
    "product","products","company","companies","business","businesses","help","helps","helping","based","using","new",
    "best","top","good","great","make","makes","making","get","getting","build","builds","building","provide","provides",
    "people","customers","clients","users","leads","sales","outreach","b2b","saas","ai","auto","automatic","automated",
    "small","large","big","more","less","other","any","some","all","one","two","etc",
  ]);
  return Array.from(
    new Set(
      selling
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length >= 4 && !STOP.has(w))
    )
  ).slice(0, 10);
}

function postMatchesTopic(text: string, tokens: string[]): boolean {
  if (tokens.length === 0) return true; // no topic info → keep
  const lower = text.toLowerCase();
  return tokens.some((t) => lower.includes(t));
}

// ── STAGE 3 ── AI scores a batch of posts for buying intent
async function scorePostsForBuyingIntent(
  posts: { id: string; text: string; authorHeadline: string }[],
  c: Criteria,
): Promise<Map<string, { score: number; reason: string }>> {
  const out = new Map<string, { score: number; reason: string }>();
  if (!LOVABLE_API_KEY || posts.length === 0) return out;

  const prompt = `You are a B2B intent classifier. Score each LinkedIn post 0-100 for how strongly the AUTHOR is expressing buying intent for this offering:

OFFERING: ${c.selling || c.intent_keywords?.join(", ") || c.role || "(unspecified)"}

SCORING RUBRIC:
- 90-100: Author explicitly asking for/needing this product RIGHT NOW ("looking for…", "any recommendations for…", "tired of X, need Y")
- 75-89: Author describing a pain that this product solves, in active research mode
- 60-74: Author hinting at need or evaluating options, but not actively buying
- 40-59: Topical interest only — talking about the space, no personal need
- 0-39: Vendor/seller post, generic thought-leadership, unrelated, or job-seeker

REJECT (score 0):
- Anyone SELLING this offering (vendors, agencies, "we help companies…")
- Job-seekers, recruiters, "open to work"
- Generic motivational content

POSTS:
${posts.map((p, i) => `[${i + 1}] id=${p.id}\nAuthor: ${p.authorHeadline || "(unknown)"}\nText: ${(p.text || "").slice(0, 600)}`).join("\n\n")}

Return ONLY a JSON array: [{"id":"...","score":NN,"reason":"≤12 words"}]`;

  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 25000);
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_API_KEY}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
      }),
      signal: ctrl.signal,
    }).finally(() => clearTimeout(t));
    if (!res.ok) {
      console.warn("[AI_CHAT_SEARCH] intent scoring HTTP", res.status);
      return out;
    }
    const data = await res.json();
    const txt: string = data.choices?.[0]?.message?.content ?? "";
    const match = txt.match(/\[[\s\S]*\]/);
    if (!match) return out;
    const arr = robustParseScoreArray(match[0]);
    for (const r of arr) {
      if (r?.id !== undefined && r?.id !== null) {
        out.set(String(r.id), { score: Number(r.score) || 0, reason: String(r.reason || "") });
      }
    }
  } catch (e) {
    console.warn("[AI_CHAT_SEARCH] intent scoring failed:", e instanceof Error ? e.message : e);
  }
  return out;
}

// Robust parser — Gemini occasionally returns unquoted keys, trailing commas,
// or stray // comments. We try strict JSON first, then progressive cleanups,
// then a per-object regex fallback so a single malformed entry doesn't drop everything.
function robustParseScoreArray(raw: string): Array<{ id: string; score: number; reason: string }> {
  const tryParse = (s: string): any[] | null => {
    try { const v = JSON.parse(s); return Array.isArray(v) ? v : null; } catch { return null; }
  };
  let v = tryParse(raw);
  if (v) return v;
  // Strip // and /* */ comments
  let cleaned = raw.replace(/\/\/[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
  // Remove trailing commas before } or ]
  cleaned = cleaned.replace(/,(\s*[}\]])/g, "$1");
  v = tryParse(cleaned);
  if (v) return v;
  // Quote unquoted keys: {id: → {"id":
  cleaned = cleaned.replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:/g, '$1"$2":');
  v = tryParse(cleaned);
  if (v) return v;
  // Last resort: regex per-object
  const out: Array<{ id: string; score: number; reason: string }> = [];
  const re = /["']?id["']?\s*:\s*["']?([^"',}]+)["']?\s*,\s*["']?score["']?\s*:\s*(\d+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    out.push({ id: m[1].trim(), score: Number(m[2]), reason: "" });
  }
  return out;
}

function extractPostText(post: any): string {
  return String(post.text || post.commentary || post.description || post.title || "").trim();
}

function extractPostUrl(post: any): string {
  const id = post.social_id || post.share_url || post.permalink || post.url;
  if (typeof id === "string" && id.startsWith("http")) return id;
  if (post.share_url) return String(post.share_url);
  if (post.activity_id) return `https://www.linkedin.com/feed/update/urn:li:activity:${post.activity_id}/`;
  if (typeof id === "string" && id.includes("urn:li:activity:")) {
    return `https://www.linkedin.com/feed/update/${id}/`;
  }
  return "";
}

function extractAuthor(post: any): any {
  return post.author || post.actor || post.author_detail || null;
}

function authorPublicId(author: any): string {
  return (
    author?.public_identifier ||
    author?.public_id ||
    author?.profile_url?.split("/in/")?.[1]?.replace(/\/$/, "") ||
    ""
  );
}

function buildLinkedInUrl(author: any): string {
  if (author?.profile_url) return String(author.profile_url);
  const pid = authorPublicId(author);
  return pid ? `https://www.linkedin.com/in/${pid}` : "";
}

// ── Decisioner scoring: how senior/decision-making is this person at their company?
// Heuristic first (instant + free), then AI for ambiguous titles.
function heuristicDecisionerScore(headline: string): number | null {
  const h = (headline || "").toLowerCase();
  if (!h.trim()) return null;
  if (/\b(student|intern|graduate|seeking|open to work|job seek|aspiring|trainee)\b/.test(h)) return 10;
  if (/\b(founder|co-?founder|ceo|owner|managing director|\bmd\b|president|proprietor)\b/.test(h)) return 95;
  if (/\bchief\s+\w+\s+officer\b|\b(cto|cfo|cmo|coo|cpo|cro|cso|ciso|cio)\b/.test(h)) return 90;
  if (/\b(vp|vice president|svp|evp)\b/.test(h)) return 85;
  if (/\b(head of|director of|director)\b/.test(h)) return 80;
  if (/\b(principal|partner)\b/.test(h)) return 78;
  if (/\b(senior manager|sr\.? manager|team lead|tech lead|\blead\b)\b/.test(h)) return 65;
  if (/\b(assistant|associate|junior|jr\.?|coordinator|analyst)\b/.test(h) && !/\b(senior|lead|head|director|vp|chief)\b/.test(h)) return 35;
  if (/\b(manager|mgr)\b/.test(h)) return 55;
  if (/\b(senior|sr\.?|specialist)\b/.test(h)) return 50;
  return null;
}

async function scoreDecisionersWithAI(
  candidates: { id: string; headline: string; company: string }[],
): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (!LOVABLE_API_KEY || candidates.length === 0) return out;

  const prompt = `You are a B2B sales authority classifier. For each person, score 0-100 how likely they personally have BUDGET / DECISION-MAKING power to buy a B2B tool for their company.

RUBRIC:
- 90-100: Founders, CEOs, owners, MDs, Presidents (esp. small/mid orgs)
- 80-89: C-level (CTO, CMO, COO, CFO, CRO, etc.), VPs, SVPs, EVPs
- 70-79: Heads of <function>, Directors, Partners, Principals
- 60-69: Senior Managers, Team Leads with budget influence
- 40-59: Managers, ICs with some influence
- 20-39: Junior staff, coordinators, assistants, analysts
- 0-19: Students, interns, job-seekers, "open to work", retired, irrelevant

PEOPLE:
${candidates.map((p, i) => `[${i}] id=${p.id}\nHeadline: ${p.headline.slice(0, 200)}\nCompany: ${p.company.slice(0, 100)}`).join("\n\n")}

Return ONLY a JSON array: [{"id":"...","score":NN}]`;

  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 20000);
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_API_KEY}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
      }),
      signal: ctrl.signal,
    }).finally(() => clearTimeout(t));
    if (!res.ok) return out;
    const data = await res.json();
    const txt: string = data.choices?.[0]?.message?.content ?? "";
    const match = txt.match(/\[[\s\S]*\]/);
    if (!match) return out;
    const arr = robustParseScoreArray(match[0]);
    for (const r of arr) {
      if (r?.id !== undefined && r?.id !== null) {
        out.set(String(r.id), Math.max(0, Math.min(100, Number(r.score) || 0)));
      }
    }
  } catch (e) {
    console.warn("[AI_CHAT_SEARCH] decisioner scoring failed:", e instanceof Error ? e.message : e);
  }
  return out;
}

const DECISIONER_THRESHOLD = 70;

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

    const { criteria = {}, excludeLinkedInUrls = [], conversation = [], previousKeywords = [] } = await req.json();
    const c = criteria as Criteria;

    // ── If `selling` is missing, derive it from the chat conversation.
    // This is the #1 reason searches go off-topic — the model never called
    // `update_search_criteria` so we never captured what the user actually sells.
    if (!c.selling || c.selling.trim().length < 5) {
      const derived = await deriveSellingFromConversation(conversation);
      if (derived) {
        c.selling = derived;
        console.log("[AI_CHAT_SEARCH] derived selling from chat:", derived);
      }
    }
    if (!c.selling || c.selling.trim().length < 5) {
      console.warn("[AI_CHAT_SEARCH] no `selling` in criteria or chat — search will be weak");
    }

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

    // ── STAGE 1: AI-generate buyer-intent post queries (5 phrases, 2-3 words each, no repeats vs previous searches)
    const queries = await generateBuyerIntentQueries(c, Array.isArray(previousKeywords) ? previousKeywords : []);
    console.log("[AI_CHAT_SEARCH] queries:", JSON.stringify(queries), "previousCount:", (previousKeywords || []).length);

    const exclude = new Set<string>(excludeLinkedInUrls.map((u: string) => u.toLowerCase()));

    // ── STAGE 2: For each query, search LinkedIn posts (past week)
    const allPosts: { post: any; query: string }[] = [];
    const seenPostIds = new Set<string>();
    const searchUrl = `https://${unipileDsn}/api/v1/linkedin/search?account_id=${accountId}&limit=25`;
    const searchHeaders = { "X-API-KEY": unipileKey, "Content-Type": "application/json", accept: "application/json" };

    for (const query of queries) {
      try {
        const body = { api: "classic", category: "posts", keywords: query, date_posted: "past_week", limit: 25 };
        const res = await fetch(searchUrl, { method: "POST", headers: searchHeaders, body: JSON.stringify(body) });
        if (!res.ok) {
          console.warn(`[AI_CHAT_SEARCH] query "${query}" HTTP ${res.status}`);
          continue;
        }
        const data = await res.json();
        const items = data.items || data.results || [];
        for (const p of items) {
          const id = p.social_id || p.id || p.provider_id;
          if (!id || seenPostIds.has(id)) continue;
          seenPostIds.add(id);
          allPosts.push({ post: p, query });
        }
        console.log(`[AI_CHAT_SEARCH] "${query}" → ${items.length} posts (total unique: ${allPosts.length})`);
      } catch (e) {
        console.warn(`[AI_CHAT_SEARCH] query "${query}" error:`, e instanceof Error ? e.message : e);
      }
    }

    if (allPosts.length === 0) {
      return new Response(JSON.stringify({ leads: [], total_found: 0, queries }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Pre-filter: must have author + meaningful text + author URL not already in exclude
    //               + (if we have a `selling`) topical overlap, so we don't waste AI scoring on off-topic posts
    const topicTokens = c.selling ? extractTopicTokens(c.selling) : [];
    const candidates: { post: any; text: string; author: any; url: string; topical: boolean }[] = [];
    for (const { post } of allPosts) {
      const text = extractPostText(post);
      if (text.length < 40) continue;
      const author = extractAuthor(post);
      if (!author) continue;
      const url = buildLinkedInUrl(author);
      if (!url || exclude.has(url.toLowerCase())) continue;
      // Filter "LinkedIn Member" private profiles
      const fn = String(author.first_name || author.firstName || "").toLowerCase();
      const ln = String(author.last_name || author.lastName || "").toLowerCase();
      if (fn === "linkedin" && ln === "member") continue;
      const topical = postMatchesTopic(text, topicTokens);
      candidates.push({ post, text, author, url, topical });
    }

    if (candidates.length === 0) {
      return new Response(JSON.stringify({ leads: [], total_found: allPosts.length, queries }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prefer topical posts; fall back to non-topical only if we don't have 40 topical ones
    const topical = candidates.filter((c) => c.topical);
    const nonTopical = candidates.filter((c) => !c.topical);
    const toScore = (topical.length >= 15 ? topical : [...topical, ...nonTopical]).slice(0, 40);
    console.log(`[AI_CHAT_SEARCH] candidates:${candidates.length} topical:${topical.length} scoring:${toScore.length} topicTokens:${JSON.stringify(topicTokens)}`);

    // ── STAGE 3: AI score each post 0-100 for buying intent
    const forAI = toScore.map((cand, i) => ({
      id: String(i),
      text: cand.text,
      authorHeadline: String(cand.author.headline || cand.author.title || ""),
    }));
    const scores = await scorePostsForBuyingIntent(forAI, c);

    // ── STAGE 3b: Decisioner score per author (heuristic + AI fallback for ambiguous titles)
    const decisionerScores = new Map<string, number>();
    const ambiguous: { id: string; headline: string; company: string }[] = [];
    for (let i = 0; i < toScore.length; i++) {
      const author = toScore[i].author;
      const headline = String(author.headline || author.title || "");
      const company = String(author.current_company || author.company || "");
      const heur = heuristicDecisionerScore(headline);
      if (heur !== null) {
        decisionerScores.set(String(i), heur);
      } else {
        ambiguous.push({ id: String(i), headline, company });
      }
    }
    if (ambiguous.length > 0) {
      const aiScores = await scoreDecisionersWithAI(ambiguous);
      for (const [k, v] of aiScores.entries()) decisionerScores.set(k, v);
      for (const a of ambiguous) {
        if (!decisionerScores.has(a.id)) decisionerScores.set(a.id, 40);
      }
    }

    // ── STAGE 4: Tiered intent threshold + ALWAYS require decisioner ≥ DECISIONER_THRESHOLD (70).
    const seenAuthors = new Set<string>();
    let filteredOutByDecisioner = 0;
    function buildLeads(threshold: number): LeadOut[] {
      const out: LeadOut[] = [];
      for (let i = 0; i < toScore.length; i++) {
        const scoreData = scores.get(String(i));
        if (!scoreData || scoreData.score < threshold) continue;

        const decisioner = decisionerScores.get(String(i)) ?? 0;
        if (decisioner < DECISIONER_THRESHOLD) {
          filteredOutByDecisioner++;
          continue;
        }

        const { post, text, author, url } = toScore[i];
        const lowUrl = url.toLowerCase();
        if (seenAuthors.has(lowUrl)) continue;
        seenAuthors.add(lowUrl);

        const fullName =
          author.name ||
          `${author.first_name || author.firstName || ""} ${author.last_name || author.lastName || ""}`.trim();
        const firstName = author.first_name || author.firstName || fullName.split(" ")[0] || "";
        const lastName = author.last_name || author.lastName || fullName.split(" ").slice(1).join(" ") || "";

        out.push({
          linkedin_url: url,
          first_name: firstName,
          last_name: lastName,
          full_name: fullName || "Unknown",
          title: String(author.headline || author.title || ""),
          company: String(author.current_company || author.company || ""),
          location: String(author.location || ""),
          avatar_url: author.profile_picture_url || author.avatar_url || undefined,
          match_score: scoreData.score,
          decisioner_score: decisioner,
          reasons: [scoreData.reason || `Buying intent ${scoreData.score}/100`, `“${text.slice(0, 90)}…”`],
          signal_post_url: extractPostUrl(post) || undefined,
          signal_post_excerpt: text.slice(0, 240),
        });
      }
      return out;
    }

    let leads = buildLeads(80);
    let usedThreshold = 80;
    if (leads.length < 3) {
      seenAuthors.clear();
      filteredOutByDecisioner = 0;
      leads = buildLeads(65);
      usedThreshold = 65;
    }
    if (leads.length === 0) {
      seenAuthors.clear();
      filteredOutByDecisioner = 0;
      leads = buildLeads(50);
      usedThreshold = 50;
    }

    leads.sort((a, b) => (b.match_score - a.match_score) || (b.decisioner_score - a.decisioner_score));
    const top = leads.slice(0, 15);

    console.log(`[AI_CHAT_SEARCH] DONE — queries:${queries.length} posts:${allPosts.length} candidates:${candidates.length} scored:${scores.size} threshold:${usedThreshold} decisioner_threshold:${DECISIONER_THRESHOLD} dropped_low_decisioner:${filteredOutByDecisioner} kept:${leads.length}`);

    return new Response(JSON.stringify({ leads: top, total_found: allPosts.length, queries, threshold: usedThreshold }), {
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

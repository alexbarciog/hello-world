// Fake LinkedIn Profile Checker: runs one check. Public (verify_jwt = false).
// POST { url, turnstile_token?, source? }
//
// Reads ONLY the public profile, through Firecrawl (the same call as
// analyze-linkedin-profile). Never uses a LinkedIn account or Unipile, never
// contacts the person. The raw scrape is scored and dropped; only the signals
// are stored.
//
// Returns the teaser only: { id, risk_score, risk_level, top_signal,
// more_count, low_confidence, owned }. The other signals stay on the server
// until a signed-in owner opens the report (get-fake-profile-report).
//
// Limits: 5 checks per IP per 24h (30 per signed-in user), and a global daily
// cap of new scrapes (FPC_DAILY_CAP, default 300). A URL checked in the last
// 7 days is served from that result without scraping again.
//
// Secrets: TURNSTILE_SECRET_KEY (verification is skipped, with a warning, until
// it's set), FPC_IP_SALT (falls back to the service key), FIRECRAWL_API_KEY,
// LOVABLE_API_KEY.
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import {
  AI_TOOL, aiPrompt, LOW_CONFIDENCE_NOTE, normaliseProfileUrl, parseAiSignals, parseProfile, ruleSignals, scoreSignals,
  type Signal, SIGNAL_BY_KEY, sortSignals, topSignal,
} from "../_shared/fake-profile.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const IP_LIMIT = 5;
const USER_LIMIT = 30;
const CACHE_DAYS = 7;
const DAY_MS = 86_400_000;
const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

async function sha256(text: string): Promise<string> {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = Deno.env.get("TURNSTILE_SECRET_KEY");
  if (!secret) {
    console.warn("[check-fake-profile] TURNSTILE_SECRET_KEY not set, skipping bot check");
    return true;
  }
  if (!token) return false;
  const form = new FormData();
  form.append("secret", secret);
  form.append("response", token);
  if (ip !== "unknown") form.append("remoteip", ip);
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form, signal: AbortSignal.timeout(8_000) });
    const data = await res.json();
    return data?.success === true;
  } catch (e) {
    console.error("[check-fake-profile] turnstile error", e);
    return false;
  }
}

async function scrape(url: string): Promise<{ markdown: string; error: string | null }> {
  try {
    const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: { Authorization: `Bearer ${Deno.env.get("FIRECRAWL_API_KEY")}`, "Content-Type": "application/json" },
      body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true }),
      signal: AbortSignal.timeout(45_000),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return { markdown: "", error: body?.error || `firecrawl ${res.status}` };
    return { markdown: String(body?.markdown || body?.data?.markdown || "").slice(0, 20_000), error: null };
  } catch (e) {
    return { markdown: "", error: e instanceof Error ? e.message : "firecrawl error" };
  }
}

async function aiJudgement(profile: ReturnType<typeof parseProfile>): Promise<{ signals: Signal[]; summary: string }> {
  const prompt = aiPrompt(profile);
  try {
    const res = await fetch(AI_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: prompt.system }, { role: "user", content: prompt.user }],
        tools: [AI_TOOL],
        tool_choice: { type: "function", function: { name: "report_signals" } },
      }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) throw new Error(`ai gateway ${res.status}`);
    const data = await res.json();
    const args = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    return parseAiSignals(args ? JSON.parse(args) : null);
  } catch (e) {
    console.error("[check-fake-profile] ai judgement failed", e instanceof Error ? e.message : e);
    return parseAiSignals(null);
  }
}

/** Only when a photo URL is in the scrape. Low weight, and never stated as fact. */
async function photoCheck(photoUrl: string | null): Promise<Signal> {
  const weight = SIGNAL_BY_KEY.photo_stock_ai.weight;
  const unknown: Signal = { key: "photo_stock_ai", status: "unknown", title: "Photo not visible to logged-out visitors", observed: "", weight };
  if (!photoUrl) return unknown;
  try {
    const res = await fetch(AI_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{
          role: "user",
          content: [
            { type: "text", text: 'Is this LinkedIn profile photo likely a stock photo or an AI-generated face? Answer as JSON {"verdict":"likely"|"unlikely"|"unsure"}. Say "likely" only for clear signs (stock-photo staging or watermark, typical AI-face artefacts such as warped ears, earrings or background). Otherwise "unlikely" or "unsure".' },
            { type: "image_url", image_url: { url: photoUrl } },
          ],
        }],
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return unknown;
    const data = await res.json();
    const verdict = String(JSON.parse(data?.choices?.[0]?.message?.content ?? "{}")?.verdict ?? "");
    if (verdict === "likely") return { ...unknown, status: "caution", title: "The photo looks like it may be a stock or AI image" };
    if (verdict === "unlikely") return { ...unknown, status: "fine", title: "Nothing about the photo looks like a stock or AI image" };
    return { ...unknown, title: "Couldn't tell anything from the photo" };
  } catch {
    return unknown;
  }
}

const teaser = (row: {
  id: string; risk_score: number; risk_level: string; top_signal: unknown; signals: Signal[]; low_confidence: boolean;
}, owned: boolean) => ({
  id: row.id,
  risk_score: row.risk_score,
  risk_level: row.risk_level,
  top_signal: row.top_signal,
  more_count: Math.max(0, row.signals.filter((x) => x.status !== "unknown").length - (row.top_signal ? 1 : 0)),
  low_confidence: row.low_confidence,
  low_confidence_note: row.low_confidence ? LOW_CONFIDENCE_NOTE : null,
  owned,
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
  const body = await req.json().catch(() => ({}));
  const ip = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  try {
    if (!(await verifyTurnstile(String(body.turnstile_token || ""), ip))) {
      return json({ error: "We couldn't confirm you're a person. Please reload the page and try again.", code: "bot_check" }, 403);
    }

    const url = normaliseProfileUrl(String(body.url || ""));
    if (!url) {
      return json({ error: "Paste a personal LinkedIn profile link, like https://www.linkedin.com/in/name.", code: "bad_url" }, 400);
    }

    // Signed in? The anon key isn't a user token, so this is null for visitors.
    const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    let userId: string | null = null;
    if (token) {
      const { data } = await db.auth.getUser(token);
      userId = data?.user?.id ?? null;
    }

    const salt = Deno.env.get("FPC_IP_SALT") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ipHash = await sha256(`${ip}:${salt}`);
    const urlHash = await sha256(url);
    const since = new Date(Date.now() - DAY_MS).toISOString();
    const source = typeof body.source === "string" ? body.source.slice(0, 200) : null;

    const LIMIT_MSG = "You've used today's free checks. Come back tomorrow to check more profiles.";
    if (userId) {
      const { count } = await db.from("fake_profile_checks").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", since);
      if ((count ?? 0) >= USER_LIMIT) return json({ error: LIMIT_MSG, code: "rate_limited" }, 429);
    } else {
      const { count } = await db.from("fake_profile_checks").select("id", { count: "exact", head: true }).eq("ip_hash", ipHash).gte("created_at", since);
      if ((count ?? 0) >= IP_LIMIT) return json({ error: LIMIT_MSG, code: "rate_limited" }, 429);
    }

    // Same profile checked recently: copy that result, no new scrape.
    const { data: hit } = await db
      .from("fake_profile_checks")
      .select("id, risk_score, risk_level, low_confidence, signals, top_signal, summary, scrape_ok, linkedin_url")
      .eq("url_hash", urlHash)
      .eq("status", "done")
      .gte("created_at", new Date(Date.now() - CACHE_DAYS * DAY_MS).toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (hit) {
      const { data: copy, error } = await db
        .from("fake_profile_checks")
        .insert({
          user_id: userId, linkedin_url: url, url_hash: urlHash, ip_hash: ipHash, status: "done", source,
          risk_score: hit.risk_score, risk_level: hit.risk_level, low_confidence: hit.low_confidence, signals: hit.signals,
          top_signal: hit.top_signal, summary: hit.summary, scrape_ok: hit.scrape_ok, cached_from: hit.id,
        })
        .select("id, risk_score, risk_level, top_signal, signals, low_confidence")
        .single();
      if (error) throw error;
      return json({ ...teaser(copy, !!userId), cached: true });
    }

    const cap = Number(Deno.env.get("FPC_DAILY_CAP") || 300);
    const { count: today } = await db
      .from("fake_profile_checks").select("id", { count: "exact", head: true }).is("cached_from", null).gte("created_at", since);
    if ((today ?? 0) >= cap) {
      return json({ error: "The checker is busy today. Please try again tomorrow.", code: "daily_cap" }, 429);
    }

    const { data: row, error: insErr } = await db
      .from("fake_profile_checks")
      .insert({ user_id: userId, linkedin_url: url, url_hash: urlHash, ip_hash: ipHash, status: "pending", source })
      .select("id")
      .single();
    if (insErr) throw insErr;

    const { markdown, error: scrapeError } = await scrape(url);
    if (markdown.replace(/\s+/g, " ").trim().length < 80) {
      await db.from("fake_profile_checks").update({ status: "failed", scrape_ok: false, error: (scrapeError || "empty_scrape").slice(0, 300) }).eq("id", row.id);
      return json({
        error: "We couldn't read this profile. Check the link is right; some profiles are hidden from logged-out visitors.",
        code: "unreadable",
      }, 422);
    }

    const profile = parseProfile(markdown);
    const [ai, photo] = await Promise.all([aiJudgement(profile), photoCheck(profile.photoUrl)]);
    const signals = sortSignals([...ruleSignals(profile), ...ai.signals, photo]);
    const score = scoreSignals(signals, profile.textLength);
    const top = topSignal(signals);
    const scrapeOk = !scrapeError && !!profile.name && profile.textLength >= 400;

    const { data: done, error: upErr } = await db
      .from("fake_profile_checks")
      .update({
        status: "done", scrape_ok: scrapeOk, error: scrapeError, signals, top_signal: top, summary: ai.summary || null,
        risk_score: score.risk_score, risk_level: score.risk_level, low_confidence: score.low_confidence,
      })
      .eq("id", row.id)
      .select("id, risk_score, risk_level, top_signal, signals, low_confidence")
      .single();
    if (upErr) throw upErr;
    console.log(`[check-fake-profile] ${row.id}: ${score.risk_level} ${score.risk_score}${score.low_confidence ? " (low confidence)" : ""}`);
    return json(teaser(done, !!userId));
  } catch (e) {
    console.error("[check-fake-profile]", e);
    return json({ error: "Something went wrong. Please try again in a minute." }, 500);
  }
});

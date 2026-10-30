// Backend for the free tools. Public (no account needed).
// POST { action: "hook" | "grade" | "signals" | "save_lead", ... }
// AI calls: 20 per IP per day per tool; identical inputs are served from cache.
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import {
  extractJson, graderPrompt, hookPrompt, MAX_INPUT_CHARS, MAX_SERVICE_CHARS, parseGraderResult, parseHookResult,
  parseSignalsResult, signalsPrompt, validateLead, type AiPrompt,
} from "../_shared/free-tools.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const DAILY_LIMIT = 20;
const CACHE_DAYS = 30;

async function sha256(text: string): Promise<string> {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function callAi(prompt: AiPrompt): Promise<unknown> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "system", content: prompt.system }, { role: "user", content: prompt.user }],
      response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`ai gateway ${res.status}`);
  const data = await res.json();
  return extractJson(data?.choices?.[0]?.message?.content ?? "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
  const body = await req.json().catch(() => ({}));

  const ip = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const ipHash = await sha256(`${ip}:${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.slice(0, 16)}`);
  const allowed = async (tool: string) => {
    const { data, error } = await db.rpc("tool_rate_limit", { _ip_hash: ipHash, _tool: tool, _max: DAILY_LIMIT });
    return error ? false : data === true;
  };
  const LIMITED = { error: "You've reached today's free limit for this tool. Come back tomorrow, or try Intentsly free.", code: "rate_limited" };

  // AI answer for this input: from cache, else the model (rate-limited), else null.
  const aiResult = async <T,>(tool: string, input: string, prompt: AiPrompt, parse: (raw: unknown) => T | null) => {
    const key = await sha256(`${tool}:${input.trim().toLowerCase()}`);
    const since = new Date(Date.now() - CACHE_DAYS * 86_400_000).toISOString();
    const { data: hit } = await db.from("tool_cache").select("result").eq("key", key).gte("created_at", since).maybeSingle();
    if (hit) return { value: hit.result as T };
    if (!(await allowed(tool))) return { limited: true as const };
    const parsed = parse(await callAi(prompt));
    if (parsed) await db.from("tool_cache").upsert({ key, tool, result: parsed, created_at: new Date().toISOString() });
    return { value: parsed };
  };

  try {
    switch (body.action) {
      case "hook":
      case "grade": {
        const text = typeof body.text === "string" ? body.text.trim() : "";
        if (text.length < 10) return json({ error: "Paste a bit more text first." }, 400);
        if (text.length > MAX_INPUT_CHARS) return json({ error: `Please keep it under ${MAX_INPUT_CHARS} characters.` }, 400);
        const r = body.action === "hook"
          ? await aiResult("hook_analyzer", text, hookPrompt(text), parseHookResult)
          : await aiResult("cold_message_grader", text, graderPrompt(text), parseGraderResult);
        if ("limited" in r) return json(LIMITED, 429);
        return r.value ? json({ result: r.value }) : json({ error: "We couldn't analyse that. Please try again." }, 502);
      }
      case "signals": {
        const service = typeof body.service === "string" ? body.service.trim() : "";
        if (service.length < 3 || service.length > MAX_SERVICE_CHARS) return json({ error: "Type a service, like \"web design\"." }, 400);
        // Known service pages already have their own wording; only stats are needed.
        const r = body.stats_only
          ? { value: null }
          : await aiResult("buying_signal_finder", service, signalsPrompt(service), parseSignalsResult);
        if ("limited" in r) return json(LIMITED, 429);
        if (!body.stats_only && !r.value) return json({ error: "We couldn't look that up. Please try again." }, 502);
        const terms = Array.isArray(body.terms)
          ? body.terms.filter((t: unknown) => typeof t === "string").slice(0, 10).map((t: string) => t.slice(0, MAX_SERVICE_CHARS))
          : [service];
        const { data: stats } = await db.rpc("buying_signal_stats", { _terms: terms });
        return json({ result: r.value, stats: stats ?? { count: null, roles: [] } });
      }
      case "save_lead": {
        const v = validateLead(body);
        if (!v.ok) return json({ error: v.error }, 400);
        if (!(await allowed("save_lead"))) return json(LIMITED, 429);
        // The emailed report is our own cached result for this input. Anything
        // the browser claims as a result is never mailed: the form accepts any
        // address, so it must not be able to deliver arbitrary text.
        let report: unknown = null;
        const input = typeof body.input_text === "string" ? body.input_text.trim().slice(0, MAX_INPUT_CHARS) : "";
        if (input) {
          const key = await sha256(`${v.row.tool}:${input.toLowerCase()}`);
          const { data: hit } = await db.from("tool_cache").select("result").eq("key", key).maybeSingle();
          report = hit?.result ?? null;
          // Prebuilt service pages never called the AI, so produce the report now.
          // A failure here must not lose the lead.
          if (!report && v.row.tool === "buying_signal_finder" && input.length <= MAX_SERVICE_CHARS) {
            try {
              const r = await aiResult("buying_signal_finder", input, signalsPrompt(input), parseSignalsResult);
              report = "value" in r ? r.value : null;
            } catch (e) {
              console.warn("[free-tool] report generation failed", e instanceof Error ? e.message : e);
            }
          }
        }
        const { error } = await db.from("tool_leads").insert({ ...v.row, report });
        return error ? json({ error: "Couldn't save that. Please try again." }, 500) : json({ success: true });
      }
      default:
        return json({ error: "unknown action" }, 400);
    }
  } catch (e) {
    console.error("[free-tool]", e instanceof Error ? e.message : e);
    return json({ error: "The analyser is busy right now. Please try again in a minute.", code: "unavailable" }, 503);
  }
});

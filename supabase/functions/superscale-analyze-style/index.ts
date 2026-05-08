import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function hash(s: string) {
  const buf = new TextEncoder().encode(s);
  const h = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(h)).map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: auth } } });
    const { data: ud } = await userClient.auth.getUser();
    if (!ud?.user) return json({ error: "Unauthorized" }, 401);
    const userId = ud.user.id;
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { force } = await req.json().catch(() => ({}));

    const { data: refs } = await admin.from("superscale_design_refs")
      .select("image_url, position").eq("user_id", userId).order("position").limit(8);

    if (!refs || refs.length < 3) {
      return json({ error: "Add at least 3 design references first" }, 400);
    }

    const refsKey = await hash(refs.map((r: any) => r.image_url).join("|"));

    const { data: existing } = await admin.from("superscale_style_profile")
      .select("*").eq("user_id", userId).maybeSingle();

    if (!force && existing && existing.refs_hash === refsKey) {
      return json({ ok: true, cached: true, style: existing.style_json });
    }

    const { data: member } = await admin.from("organization_members")
      .select("organization_id").eq("user_id", userId).maybeSingle();

    const userContent: any[] = [
      { type: "text", text: `You are a senior brand designer. Analyze these LinkedIn post images that the creator loves. Extract the SHARED visual DNA — what makes them feel like one cohesive style. Return STRICT JSON matching this schema (no prose, no markdown):

{
  "palette": ["#hex", ...]                    // 3-6 dominant hex colors across the set
  "accent_colors": ["#hex", ...],             // 1-2 punchy accents
  "background_style": "string",               // e.g. "solid pastel", "soft gradient", "off-white paper"
  "typography": {
    "style": "string",                        // e.g. "bold sans serif, condensed"
    "weight": "string",                       // "ultra-bold" | "bold" | "regular"
    "casing": "string",                       // "ALL CAPS" | "Title Case" | "lowercase" | "mixed"
    "size_feel": "string"                     // "huge headline takes 60% of frame"
  },
  "has_text_overlay": true | false,           // do most refs have text on them?
  "layout_patterns": ["string", ...],         // e.g. "centered headline", "left-aligned with portrait right"
  "composition": "string",                    // 1-sentence summary of how things are arranged
  "mood": "string",                           // e.g. "playful, confident, modern"
  "recurring_motifs": ["string", ...],        // shapes, icons, devices, photo style
  "imagery_style": "string",                  // "flat illustration" | "photo with bold caption" | "abstract shapes" | etc.
  "do": ["short rule", ...],                  // 4-6 imperative rules to follow when generating new images in this style
  "dont": ["short rule", ...]                 // 3-4 rules to avoid
}

Be specific and concrete. The output will be fed directly to an image model.` },
      ...refs.slice(0, 8).map((r: any) => ({ type: "image_url", image_url: { url: r.image_url } })),
    ];

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: userContent }],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("style analyze failed", aiResp.status, t);
      if (aiResp.status === 429) return json({ error: "Rate limit, try again in a minute" }, 429);
      if (aiResp.status === 402) return json({ error: "Out of AI credits — top up in Settings" }, 402);
      return json({ error: "Style analysis failed" }, 500);
    }

    const data = await aiResp.json();
    const raw = data?.choices?.[0]?.message?.content || "{}";
    let style: any;
    try { style = JSON.parse(raw); } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      style = m ? JSON.parse(m[0]) : {};
    }

    const upsert = {
      user_id: userId,
      organization_id: member?.organization_id ?? null,
      style_json: style,
      refs_hash: refsKey,
      refs_count: refs.length,
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      await admin.from("superscale_style_profile").update(upsert).eq("user_id", userId);
    } else {
      await admin.from("superscale_style_profile").insert(upsert);
    }

    return json({ ok: true, cached: false, style, refs_count: refs.length });
  } catch (e) {
    console.error("superscale-analyze-style error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});

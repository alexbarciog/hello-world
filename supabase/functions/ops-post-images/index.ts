// ops-post-images: generates images for the founder's queued LinkedIn posts with OpenAI's
// image model (the one ChatGPT uses), stores them in the public `superscale` bucket and
// releases the post to the existing publisher (superscale-publish-post) by setting
// status = 'scheduled'.
//
// Queue contract (rows in public.linkedin_posts):
//   status = 'awaiting_image', user_id = ops_config.owner_user_id,
//   generated_image_prompt = what to draw, scheduled_for = when to publish.
// Called every few minutes by pg_cron with header x-ops-secret. The secret and the owner's
// user id live in public.ops_config (RLS on, no policies: only the service role can read it).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";
const MODEL = Deno.env.get("OPENAI_IMAGE_MODEL") || "gpt-image-1";
const SIZE = Deno.env.get("OPENAI_IMAGE_SIZE") || "1024x1024";
const QUALITY = Deno.env.get("OPENAI_IMAGE_QUALITY") || "medium";
const MAX_PER_RUN = 3;
const MAX_ATTEMPTS = 3;
const TEXT_ONLY_FALLBACK_MS = 15 * 60 * 1000; // publish without image if the slot is this close

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

async function generate(prompt: string): Promise<Uint8Array> {
  const r = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, prompt, size: SIZE, quality: QUALITY, n: 1 }),
  });
  const txt = await r.text();
  if (!r.ok) throw new Error(`OpenAI ${r.status}: ${txt.slice(0, 300)}`);
  const b64 = JSON.parse(txt)?.data?.[0]?.b64_json;
  if (!b64) throw new Error("OpenAI returned no image");
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf;
}

Deno.serve(async (req) => {
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { data: cfg } = await admin.from("ops_config").select("key, value").in("key", ["ops_secret", "owner_user_id"]);
  const conf = Object.fromEntries((cfg ?? []).map((r: { key: string; value: string }) => [r.key, r.value]));
  const secret = req.headers.get("x-ops-secret") || "";
  if (!conf.ops_secret || secret !== conf.ops_secret) return json({ error: "Unauthorized" }, 401);
  const OWNER: string = conf.owner_user_id || "";
  if (!OWNER) return json({ error: "owner_user_id missing in ops_config" }, 500);

  const { data: rows, error } = await admin
    .from("linkedin_posts")
    .select("id, generated_image_prompt, scheduled_for, metrics")
    .eq("user_id", OWNER)
    .eq("status", "awaiting_image")
    .order("scheduled_for", { ascending: true })
    .limit(MAX_PER_RUN);
  if (error) return json({ error: error.message }, 500);

  const results: unknown[] = [];
  for (const row of rows ?? []) {
    const metrics = (row.metrics ?? {}) as Record<string, unknown>;
    const attempts = Number(metrics.image_attempts ?? 0);
    const dueSoon = row.scheduled_for && new Date(row.scheduled_for).getTime() - Date.now() < TEXT_ONLY_FALLBACK_MS;

    // Out of attempts, no key, or about to miss the slot: publish text-only rather than skip the slot.
    if (!OPENAI_API_KEY || attempts >= MAX_ATTEMPTS || (dueSoon && attempts > 0)) {
      if (dueSoon || attempts >= MAX_ATTEMPTS) {
        await admin.from("linkedin_posts").update({
          status: "scheduled",
          metrics: { ...metrics, image_fallback: "text_only" },
          error: OPENAI_API_KEY ? "Image generation failed; posted without image" : "OPENAI_API_KEY not set; posted without image",
        }).eq("id", row.id);
        results.push({ id: row.id, ok: true, image: false });
      } else {
        results.push({ id: row.id, ok: false, waiting: "OPENAI_API_KEY not set" });
      }
      continue;
    }

    try {
      const prompt = String(row.generated_image_prompt || "").trim();
      if (!prompt) throw new Error("generated_image_prompt is empty");
      const buf = await generate(prompt);
      const path = `${OWNER}/ops/${row.id}.png`;
      const up = await admin.storage.from("superscale").upload(path, buf, { contentType: "image/png", upsert: true });
      if (up.error) throw new Error(`upload: ${up.error.message}`);
      const { data: pub } = admin.storage.from("superscale").getPublicUrl(path);
      await admin.from("linkedin_posts").update({
        image_url: pub.publicUrl,
        status: "scheduled",
        error: null,
        metrics: { ...metrics, image_attempts: attempts + 1, image_model: MODEL },
      }).eq("id", row.id);
      results.push({ id: row.id, ok: true, image: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("ops-post-images", row.id, msg);
      await admin.from("linkedin_posts").update({
        error: msg.slice(0, 500),
        metrics: { ...metrics, image_attempts: attempts + 1 },
      }).eq("id", row.id);
      results.push({ id: row.id, ok: false, error: msg.slice(0, 200) });
    }
  }
  return json({ ok: true, processed: results.length, results });
});

// Upserts one blog article. Auth: shared secret in the x-publish-token header
// (set BLOG_PUBLISH_TOKEN as an Edge Function secret). Deploy with verify_jwt = false.
//
// Articles are prerendered to static HTML at build time, so a new article needs
// a deploy to be served as HTML. If BLOG_DEPLOY_HOOK_URL is set (a deploy hook
// from the hosting provider), it is called after each published article.
import { createClient } from "jsr:@supabase/supabase-js@2";

const FIELDS = ["slug", "title", "meta_title", "meta_description", "excerpt", "content_md", "primary_keyword",
  "secondary_keywords", "cluster", "article_type", "faq", "cover_image_url", "author_name", "author_title",
  "reading_minutes", "word_count", "status", "published_at"];

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  const secret = Deno.env.get("BLOG_PUBLISH_TOKEN") ?? "";
  const given = req.headers.get("x-publish-token") ?? "";
  if (secret.length < 24 || !safeEqual(secret, given)) return json({ error: "unauthorized" }, 401);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: "invalid JSON" }, 400); }
  const row: Record<string, unknown> = {};
  for (const k of FIELDS) if (body[k] !== undefined) row[k] = body[k];
  for (const k of ["slug", "title", "meta_title", "meta_description", "excerpt", "content_md"]) {
    if (typeof row[k] !== "string" || !(row[k] as string).trim()) return json({ error: `missing ${k}` }, 400);
  }
  if (!["draft", "published", "archived"].includes((row.status as string) ?? "draft")) return json({ error: "bad status" }, 400);
  if ((row.content_md as string).length > 200_000) return json({ error: "content too large" }, 413);

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  // Keep the original publish date when an existing article is updated.
  const { data: existing } = await db.from("blog_posts").select("published_at").eq("slug", row.slug).maybeSingle();
  if (existing?.published_at) row.published_at = existing.published_at;

  const { data, error } = await db.from("blog_posts").upsert(row, { onConflict: "slug" })
    .select("id, slug, status, published_at").single();
  if (error) return json({ error: error.message }, 500);

  let rebuild = "not configured";
  const hook = Deno.env.get("BLOG_DEPLOY_HOOK_URL");
  if (hook && data.status === "published") {
    try {
      const res = await fetch(hook, { method: "POST", signal: AbortSignal.timeout(10000) });
      rebuild = res.ok ? "triggered" : `hook returned ${res.status}`;
    } catch {
      rebuild = "hook unreachable";
    }
  }
  return json({ ok: true, updated: Boolean(existing), post: data, rebuild });
});

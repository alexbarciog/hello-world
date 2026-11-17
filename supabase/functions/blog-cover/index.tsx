// blog-cover: renders the 1200x630 cover image of a content page (blog, guides, learn,
// solutions, compare) from its title, stores it and points blog_posts.cover_image_url at it.
// No AI, no photos: a fixed template, so every page gets a consistent, on-brand cover.
//
// Auth: header x-ops-secret must equal ops_config.value where key = 'ops_secret'
// (deployed with verify_jwt = false, like the ops-* functions).
//
//   POST {slug}                      -> render, upload superscale/covers/<slug>.png,
//                                       set cover_image_url (with ?v=<epoch>), return {ok, url}
//   POST {action:"backfill", limit?} -> covers for published rows without one (NULL or not under
//                                       /covers/), each rendered in its own invocation (CPU budget),
//                                       sequentially, max 15 per call; call again until remaining = 0
//   GET  ?slug=...                   -> the PNG for that row, nothing stored (preview)
//   GET  ?title=...&section=...      -> the PNG for arbitrary text, nothing stored (preview)
//
// A trigger on blog_posts (migration 20261117200000_blog_cover_trigger.sql) calls POST {slug}
// whenever a row is published or a published title changes.
//
// Text must stay within Latin-1: any other glyph makes the renderer fetch fallback fonts and
// fail, so titles go through latin1() first (smart quotes, dashes, arrows -> ASCII).
import React from "https://esm.sh/react@18.2.0";
import { ImageResponse } from "https://deno.land/x/og_edge@0.0.6/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const h = React.createElement;
const W = 1200, H = 630;
const BATCH = 15;

const C = {
  ink: "#0a0a0a",
  muted: "#5b6170",
  line: "rgba(10,10,10,0.06)",
  border: "rgba(10,10,10,0.10)",
  blue: "#1A8FE3",
  lime: "#E6FF8A",
  teal: "#9BE8D8",
  sky: "#5AA9F0",
};

const SECTION_LABEL: Record<string, string> = {
  blog: "Blog",
  guides: "Guide",
  learn: "Learn",
  solutions: "Solutions",
  compare: "Compare",
};

// ---------------------------------------------------------------------------------------------
// Pure rendering (exported so it can be rendered locally without Supabase).

type Font = { name: string; data: ArrayBuffer; weight: 500 | 600 | 700; style: "normal" };
let fontCache: Font[] | null = null;
export async function fonts(): Promise<Font[]> {
  if (fontCache) return fontCache;
  const get = (w: number) =>
    fetch(`https://cdn.jsdelivr.net/fontsource/fonts/inter@5.0.0/latin-${w}-normal.woff`).then((r) => {
      if (!r.ok) throw new Error(`font inter ${w}: ${r.status}`);
      return r.arrayBuffer();
    });
  const [f5, f6, f7] = await Promise.all([get(500), get(600), get(700)]);
  fontCache = [
    { name: "Inter", data: f5, weight: 500, style: "normal" },
    { name: "Inter", data: f6, weight: 600, style: "normal" },
    { name: "Inter", data: f7, weight: 700, style: "normal" },
  ];
  return fontCache;
}

/** Map typography to ASCII and drop anything outside Latin-1 (the renderer has no fallback font). */
export function latin1(input: string): string {
  let s = String(input ?? "")
    .replace(/[‘’‚‛′´`]/g, "'")
    .replace(/[“”„‟″«»]/g, '"')
    .replace(/\s*—\s*/g, " - ") // em dash
    .replace(/\s+[–‒―]\s+/g, " - ") // spaced en dash
    .replace(/[‐‑‒–―−]/g, "-") // en dash in ranges, hyphens, minus
    .replace(/…/g, "...")
    .replace(/[→➡➔➜⇒]/g, "->")
    .replace(/[←⇐]/g, "<-")
    .replace(/↔/g, "<->")
    .replace(/™/g, "TM")
    .replace(/[•‣●·]/g, "-")
    .replace(/×/g, "x")
    .replace(/[  -​  　]/g, " ")
    .replace(/[‌‍⁠﻿]/g, "");
  // Accented letters outside Latin-1 (e.g. "ł", "ă"): strip the accent when possible.
  s = Array.from(s).map((ch) => {
    if (ch.charCodeAt(0) <= 0xff) return ch;
    const base = ch.normalize("NFKD").replace(/[̀-ͯ]/g, "");
    return Array.from(base).every((c) => c.charCodeAt(0) <= 0xff) ? base : "";
  }).join("");
  // Control characters out; collapse whitespace.
  return s.replace(/[\u0000-\u001F\u007F-\u009F]/g, " ").replace(/\s+/g, " ").trim();
}

const TITLE_W = 700;
/** Rough line count for Inter 600 at `size` with the title's letter-spacing. */
function estimateLines(text: string, size: number) {
  const perLine = Math.max(8, Math.floor(TITLE_W / (size * 0.535)));
  let lines = 1, cur = 0;
  for (const word of titleTokens(text)) {
    const len = word.length;
    if (cur === 0) cur = len;
    else if (cur + 1 + len <= perLine) cur += 1 + len;
    else { lines++; cur = len; }
    while (cur > perLine) { lines++; cur -= perLine; }
  }
  return lines;
}
/** Words of the title; a short last word is glued to the one before so it never sits alone. */
function titleTokens(text: string) {
  const words = text.split(" ").filter(Boolean);
  if (words.length >= 3 && words[words.length - 1].length <= 6) {
    const last = words.pop()!;
    words[words.length - 1] += " " + last;
  }
  return words;
}

/** Largest size from 64px down to 44px that fits in 3 lines (4 at the floor). */
export function titleSize(text: string) {
  for (let s = 64; s >= 44; s -= 2) if (estimateLines(text, s) <= 3) return s;
  return 44;
}

// The Intentsly mark (blue plus with a smile over a light diagonal cross), as an inline SVG so
// the render never depends on a network asset.
const MARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
<g transform="rotate(45 50 50)"><rect x="39" y="6" width="22" height="88" rx="7" fill="#A9C8F6"/></g>
<g transform="rotate(-45 50 50)"><rect x="39" y="6" width="22" height="88" rx="7" fill="#5E97EE"/></g>
<rect x="37" y="3" width="26" height="94" rx="8" fill="#1F6FEB"/>
<rect x="3" y="37" width="94" height="26" rx="8" fill="#1F6FEB"/>
<circle cx="50" cy="50" r="19" fill="#1F6FEB"/>
<path d="M38 49 Q50 61 62 49" stroke="#fff" stroke-width="5.5" stroke-linecap="round" fill="none"/>
</svg>`;
const MARK_URI = `data:image/svg+xml;base64,${btoa(MARK_SVG)}`;

function Logo() {
  return h("div", { style: { display: "flex", alignItems: "center", gap: 12 } },
    h("img", { src: MARK_URI, width: 40, height: 40 }),
    h("div", { style: { fontFamily: "Inter", fontWeight: 700, fontSize: 30, color: C.ink, letterSpacing: -0.8 } }, "Intentsly"));
}

function Grid() {
  const cells = 56;
  const lines = [];
  for (let x = cells; x < W; x += cells) {
    lines.push(h("div", { key: `v${x}`, style: { position: "absolute", left: x, top: 0, width: 1, height: H, background: C.line } }));
  }
  for (let y = cells; y < H; y += cells) {
    lines.push(h("div", { key: `h${y}`, style: { position: "absolute", left: 0, top: y, width: W, height: 1, background: C.line } }));
  }
  return h("div", { style: { position: "absolute", left: 0, top: 0, width: W, height: H, display: "flex" } }, ...lines);
}

// Right-hand gradient panel: lime -> teal -> blue, with soft "signal" rings and the mark.
function Panel() {
  const cx = 150, cy = 262; // ring centre inside the panel
  const ring = (r: number, a: number) =>
    h("div", { key: `r${r}`, style: { position: "absolute", left: cx - r, top: cy - r, width: r * 2, height: r * 2, borderRadius: r, border: `2px solid rgba(255,255,255,${a})` } });
  return h("div", {
    style: {
      position: "absolute", left: 868, top: 56, width: 276, height: 518, borderRadius: 28, display: "flex", overflow: "hidden",
      backgroundImage: `linear-gradient(155deg, ${C.lime} 0%, ${C.teal} 48%, ${C.sky} 100%)`,
      boxShadow: "0 24px 60px rgba(26,143,227,0.18)",
    },
  },
    ring(196, 0.22), ring(146, 0.32), ring(98, 0.45),
    h("div", {
      style: {
        position: "absolute", left: cx - 54, top: cy - 54, width: 108, height: 108, borderRadius: 30, background: "#ffffff",
        display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 18px 40px rgba(10,40,80,0.18)",
      },
    }, h("img", { src: MARK_URI, width: 64, height: 64 })),
    // Two small "signal" cards, abstracted (no fake data).
    h("div", {
      style: {
        position: "absolute", left: 28, top: 420, width: 220, height: 64, borderRadius: 16, background: "rgba(255,255,255,0.92)",
        display: "flex", alignItems: "center", gap: 12, padding: "0 16px", boxShadow: "0 10px 24px rgba(10,40,80,0.12)",
      },
    },
      h("div", { style: { width: 28, height: 28, borderRadius: 14, background: C.blue, display: "flex" } }),
      h("div", { style: { display: "flex", flexDirection: "column", gap: 7 } },
        h("div", { style: { width: 120, height: 8, borderRadius: 4, background: "rgba(10,10,10,0.55)", display: "flex" } }),
        h("div", { style: { width: 84, height: 8, borderRadius: 4, background: "rgba(10,10,10,0.16)", display: "flex" } }))),
    h("div", {
      style: {
        position: "absolute", left: 60, top: 36, width: 156, height: 44, borderRadius: 22, background: "rgba(255,255,255,0.7)",
        display: "flex", alignItems: "center", gap: 10, padding: "0 14px",
      },
    },
      h("div", { style: { width: 16, height: 16, borderRadius: 8, background: "#34C77B", display: "flex" } }),
      h("div", { style: { width: 96, height: 8, borderRadius: 4, background: "rgba(10,10,10,0.35)", display: "flex" } })),
  );
}

export function coverElement(rawTitle: string, section: string) {
  let title = latin1(rawTitle) || "Intentsly";
  // Hard stop for runaway titles: 5 lines at the 44px floor hold about 110 characters.
  if (title.length > 110) title = title.slice(0, 105).replace(/\s+\S*$/, "") + "...";
  const size = titleSize(title);
  const label = SECTION_LABEL[section] ?? SECTION_LABEL.blog;
  return h("div", { style: { width: W, height: H, display: "flex", position: "relative", background: "#ffffff", fontFamily: "Inter" } },
    h(Grid, null),
    // Soften the grid behind the text block so the title reads cleanly.
    h("div", {
      style: {
        position: "absolute", left: -60, top: 40, width: 900, height: 560, display: "flex",
        backgroundImage: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.6) 40%, rgba(255,255,255,0) 70%)",
      },
    }),
    h(Panel, null),
    h("div", {
      style: { position: "absolute", left: 72, top: 56, width: TITLE_W + 20, height: H - 112, display: "flex", flexDirection: "column", justifyContent: "space-between" },
    },
      h(Logo, null),
      h("div", { style: { display: "flex", flexDirection: "column", gap: 24 } },
        h("div", { style: { display: "flex" } },
          h("div", {
            style: {
              display: "flex", alignItems: "center", gap: 10, padding: "8px 18px 8px 14px", borderRadius: 999,
              border: `1px solid ${C.border}`, background: "#ffffff", fontSize: 20, fontWeight: 600, color: C.ink,
            },
          },
            h("div", { style: { width: 10, height: 10, borderRadius: 5, background: C.blue, display: "flex" } }),
            label)),
        h("div", {
          style: { display: "flex", flexWrap: "wrap", width: TITLE_W, fontSize: size, fontWeight: 600, lineHeight: 1.1, letterSpacing: -size * 0.025, color: C.ink },
        }, ...titleTokens(title).map((t, i, all) =>
          h("div", {
            key: i,
            style: {
              display: "flex", marginRight: i < all.length - 1 ? Math.round(size * 0.26) : 0,
              // Only break between words (never at the hyphen of "Signal-Based"), unless a single
              // token could not fit on a line at all.
              whiteSpace: t.length * size * 0.6 < TITLE_W ? "nowrap" : "normal",
            },
          }, t)))),
      h("div", { style: { display: "flex", fontSize: 20, fontWeight: 500, color: C.muted } }, "intentsly.com")),
  );
}

/** PNG bytes of the cover. */
export async function renderCover(title: string, section: string): Promise<Uint8Array<ArrayBuffer>> {
  const img = new ImageResponse(coverElement(title, section), { width: W, height: H, fonts: await fonts() });
  return new Uint8Array(await img.arrayBuffer());
}

// ---------------------------------------------------------------------------------------------
// HTTP handler

const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json" } });

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,200}$/;

async function handler(req: Request): Promise<Response> {
  const SUPA = Deno.env.get("SUPABASE_URL")!;
  const KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const PUB = `${SUPA}/storage/v1/object/public/superscale`;
  const admin = createClient(SUPA, KEY, { auth: { persistSession: false } });

  const { data: s } = await admin.from("ops_config").select("value").eq("key", "ops_secret").maybeSingle();
  const secret: string = s?.value ?? "";
  if (!secret || !safeEqual(secret, req.headers.get("x-ops-secret") ?? "")) return json({ error: "Unauthorized" }, 401);

  const png = (bytes: Uint8Array<ArrayBuffer>) => new Response(bytes, { headers: { "Content-Type": "image/png", "Cache-Control": "no-store" } });

  try {
    if (req.method === "GET") {
      const u = new URL(req.url);
      const slug = u.searchParams.get("slug");
      if (slug) {
        const { data: row } = await admin.from("blog_posts").select("title, section").eq("slug", slug).maybeSingle();
        if (!row) return json({ error: "not found" }, 404);
        return png(await renderCover(row.title, row.section));
      }
      const title = u.searchParams.get("title");
      if (title) return png(await renderCover(title, u.searchParams.get("section") ?? "blog"));
      return json({ error: "slug or title required" }, 400);
    }
    if (req.method !== "POST") return json({ error: "GET or POST" }, 405);

    // deno-lint-ignore no-explicit-any
    const p: any = await req.json().catch(() => ({}));

    if (p.action === "backfill") {
      const limit = Math.max(1, Math.min(BATCH, Number(p.limit) || BATCH));
      const missing = "cover_image_url.is.null,cover_image_url.not.like.*/covers/*";
      const { data: rows, error } = await admin.from("blog_posts").select("slug")
        .eq("status", "published").or(missing).order("published_at", { ascending: false }).limit(limit);
      if (error) return json({ error: error.message }, 500);
      let done = 0;
      const failed: { slug: string; error: string }[] = [];
      for (const { slug } of rows ?? []) {
        // Own invocation per cover: one render is close to the per-request CPU budget.
        const r = await fetch(`${SUPA}/functions/v1/blog-cover`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-ops-secret": secret },
          body: JSON.stringify({ slug }),
        }).catch((e) => ({ ok: false, status: 0, json: async () => ({ error: String(e) }) }));
        const d = await r.json().catch(() => ({}));
        if (r.ok && d.url) done++;
        else failed.push({ slug, error: String(d.error ?? r.status) });
      }
      const { count } = await admin.from("blog_posts").select("slug", { count: "exact", head: true })
        .eq("status", "published").or(missing);
      return json({ ok: true, processed: rows?.length ?? 0, succeeded: done, failed, remaining: count ?? null });
    }

    const slug = String(p.slug ?? "");
    if (!SLUG_RE.test(slug)) return json({ error: "valid slug required" }, 400);
    const { data: row, error: rowErr } = await admin.from("blog_posts").select("title, section").eq("slug", slug).maybeSingle();
    if (rowErr) return json({ error: rowErr.message }, 500);
    if (!row) return json({ error: "not found" }, 404);

    const bytes = await renderCover(row.title, row.section);
    const path = `covers/${slug}.png`;
    const up = await admin.storage.from("superscale").upload(path, bytes, { contentType: "image/png", upsert: true, cacheControl: "86400" });
    if (up.error) return json({ error: up.error.message }, 500);
    const url = `${PUB}/${path}?v=${Math.floor(Date.now() / 1000)}`;
    const { error: updErr } = await admin.from("blog_posts").update({ cover_image_url: url }).eq("slug", slug);
    if (updErr) return json({ error: updErr.message }, 500);
    return json({ ok: true, url, bytes: bytes.length });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
}

// Local renders import this module without starting a server.
if (!Deno.env.get("BLOG_COVER_NO_SERVE")) Deno.serve(handler);

#!/usr/bin/env node
// Checks every URL in the sitemap: status 200 with no redirect, self-referencing
// canonical, indexable robots tag, one readable H1, and no claim that Intentsly
// monitors Reddit or X. Also checks the redirects and that noindexed pages stay
// out of the sitemap. No dependencies.
//
//   node scripts/verify-seo.mjs                              local dist/ output
//   node scripts/verify-seo.mjs --base https://intentsly.com production
//   node scripts/verify-seo.mjs --base http://localhost:8787 a local server
//
// Exit code 0 = everything passed, 1 = at least one failure.
import fs from "node:fs";
import path from "node:path";

const SITE = "https://intentsly.com";
const args = process.argv.slice(2);
const baseFlag = args.indexOf("--base");
const BASE = baseFlag >= 0 ? args[baseFlag + 1].replace(/\/$/, "") : null;
const DIST = path.resolve("dist");
const policy = JSON.parse(fs.readFileSync(path.resolve("src/data/seoPolicy.json"), "utf8"));

const failures = [];
const fail = (url, why) => failures.push(`${url}: ${why}`);

const decode = (s) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");

// Exactly what `grep ... | strip tags` shows: tags vanish, nothing replaces them.
const stripTags = (html) => decode(html.replace(/<!--.*?-->/g, "").replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();

// Two words with only tags between them read as one word once the tags are stripped.
const isSquashed = (html) => {
  const clean = html.replace(/<!--.*?-->/g, "");
  return /[A-Za-z0-9.!?,:;](?:<[^>]+>)+[A-Za-z0-9]/.test(clean) || /[A-Za-z]{26,}/.test(stripTags(clean));
};

async function load(pathname) {
  if (BASE) {
    const res = await fetch(`${BASE}${pathname}`, { redirect: "manual", headers: { "User-Agent": "intentsly-verify-seo" } });
    return { status: res.status, location: res.headers.get("location"), html: res.status === 200 ? await res.text() : "" };
  }
  const file = pathname === "/" ? "index.html" : `${pathname.slice(1)}.html`;
  const full = path.join(DIST, file);
  if (!fs.existsSync(full)) return { status: 404, location: null, html: "" };
  return { status: 200, location: null, html: fs.readFileSync(full, "utf8") };
}

const canonicalOf = (html) => html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
const robotsOf = (html) => html.match(/<meta name="robots" content="([^"]*)"/)?.[1] ?? "";

// A claim, not a mention: "monitors Reddit", unless the same sentence says it does not.
function claimViolations(html) {
  const body = html.slice(Math.max(html.indexOf('<div id="root">'), 0));
  const head = html.slice(0, Math.max(html.indexOf('<div id="root">'), 0));
  const text = stripTags(
    (head.match(/<meta[^>]+(?:description)"[^>]+>/g) || [])
      .map((m) => (m.match(/content="([^"]*)"/)?.[1] ?? "") + ". ")
      .join("") +
      body
        .replace(/<script[\s\S]*?<\/script>/g, " ")
        .replace(/<style[\s\S]*?<\/style>/g, " ")
        .replace(/<\/(p|div|li|h[1-6]|td|th)>/g, ". "),
  );
  const out = [];
  for (const sentence of text.split(/(?<=[.!?])\s+/)) {
    if (/LinkedIn,? Reddit,? (and|&) X/i.test(sentence)) out.push(sentence);
    else if (
      /\b(Intentsly|we)\b.{0,80}\b(monitor|monitors|monitoring|tracks?|watch|watches|scans?)\b/i.test(sentence) &&
      /\b(Reddit|Twitter)\b|\bX\b(?! profiles)/.test(sentence) &&
      !/\b(not|no|never|only|without|isn't|doesn't)\b/i.test(sentence)
    ) {
      out.push(sentence);
    }
  }
  return out;
}

let sitemap;
if (BASE) {
  const res = await fetch(`${BASE}/sitemap.xml`);
  sitemap = await res.text();
} else {
  sitemap = fs.readFileSync(path.join(DIST, "sitemap.xml"), "utf8");
}
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (urls.length === 0) failures.push("sitemap: no URLs found");
if (new Set(urls).size !== urls.length) failures.push("sitemap: duplicate URLs");

const pages = new Map();
const pool = 8;
let next = 0;
let checked = 0;
await Promise.all(
  Array.from({ length: pool }, async () => {
    while (next < urls.length) {
      const url = urls[next++];
      const pathname = url.slice(SITE.length) || "/";
      const { status, location, html } = await load(pathname);
      checked += 1;
      if (status !== 200) {
        fail(url, `status ${status}${location ? ` -> ${location}` : ""}`);
        continue;
      }
      const canonical = canonicalOf(html);
      if (canonical !== url) fail(url, `canonical is ${canonical}`);
      if ((html.match(/<link rel="canonical"/g) || []).length !== 1) fail(url, "needs exactly one canonical");
      const robots = robotsOf(html);
      if (!/^index/.test(robots)) fail(url, `robots is "${robots}"`);
      if (/\?ref=|\/login|\/register/.test(url)) fail(url, "should not be in the sitemap");
      const h1s = html.match(/<h1[^>]*>[\s\S]*?<\/h1>/g) || [];
      if (h1s.length !== 1) fail(url, `${h1s.length} H1 tags`);
      for (const h of h1s) {
        const text = stripTags(h);
        if (!text || isSquashed(h)) fail(url, `H1 not readable: "${text}"`);
      }
      for (const h of html.match(/<h[23][^>]*>[\s\S]*?<\/h[23]>/g) || []) {
        const text = stripTags(h);
        if (isSquashed(h)) fail(url, `H2/H3 not readable: "${text}"`);
      }
      for (const v of claimViolations(html)) fail(url, `unsupported claim: "${v.slice(0, 160)}"`);
      if (html.includes('href="/features/reddit-x-signals"')) fail(url, "links to the removed Reddit and X page");
      pages.set(pathname, html);
    }
  }),
);

// Redirects: one hop, 301, to a page that is itself 200.
const redirects = { ...policy.redirects, ...policy.merged };
if (BASE) {
  for (const [from, to] of Object.entries(redirects)) {
    const res = await fetch(`${BASE}${from}`, { redirect: "manual" });
    const loc = (res.headers.get("location") || "").replace(BASE, "").replace(SITE, "");
    if (res.status !== 301 || loc !== to) fail(from, `expected 301 to ${to}, got ${res.status} ${loc}`);
    const dest = await load(to);
    if (dest.status !== 200) fail(to, `redirect target returned ${dest.status}`);
  }
} else {
  const file = path.join(DIST, "_redirects");
  const lines = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  for (const [from, to] of Object.entries(redirects)) {
    if (!lines.includes(`${from} ${to} 301`)) fail(from, "missing from dist/_redirects");
    if (fs.existsSync(path.join(DIST, `${from.slice(1)}.html`))) fail(from, "redirected page still has an HTML file");
    if (!fs.existsSync(path.join(DIST, `${to.slice(1)}.html`))) fail(to, "redirect target has no HTML file");
  }
}

// Noindexed pages: reachable, tagged, not in the sitemap.
const noindexed = [...Object.keys(policy.noindex), "/login", "/register"];
for (const p of noindexed) {
  const { status, html } = await load(p);
  if (urls.includes(`${SITE}${p}`)) fail(p, "noindexed but in the sitemap");
  if (status !== 200) {
    // A row can leave the database between builds; only the tag matters when the page exists.
    if (!BASE) fail(p, `status ${status}`);
    continue;
  }
  if (robotsOf(html) !== "noindex,follow") fail(p, `robots is "${robotsOf(html)}"`);
  if (canonicalOf(html) !== `${SITE}${p}`) fail(p, `canonical is ${canonicalOf(html)}`);
}

// Internal linking.
const SECTIONS = ["/blog", "/guides", "/learn", "/solutions", "/compare"];
const live = new Set(urls.map((u) => u.slice(SITE.length) || "/"));
const hrefs = (html) => [...html.matchAll(/href="(\/[^"#?]*)/g)].map((m) => m[1]);
for (const hub of SECTIONS) {
  const html = pages.get(hub);
  if (!html) {
    fail(hub, "hub page missing from the sitemap");
    continue;
  }
  const links = new Set(hrefs(html));
  for (const p of live) if (p.startsWith(`${hub}/`) && !links.has(p)) fail(hub, `does not link to ${p}`);
}
for (const [p, html] of pages) {
  if (!SECTIONS.some((s) => p.startsWith(`${s}/`))) continue;
  const start = html.indexOf('id="related-heading"');
  if (start < 0) {
    fail(p, "no Related block");
    continue;
  }
  const links = hrefs(html.slice(start, html.indexOf("</section>", start)));
  if (links.length < 4 || links.length > 6) fail(p, `Related block has ${links.length} links`);
  if (!links.some((l) => l.startsWith("/solutions"))) fail(p, "Related block has no /solutions link");
  for (const l of links) if (l !== "/solutions" && !live.has(l)) fail(p, `Related block links to non-indexable ${l}`);
}
const pillar = policy.pillars.trigify;
const trigifyPages = [...pages.keys(), ...Object.keys(policy.noindex)].filter((p) => p.includes("trigify") && p !== pillar);
for (const p of new Set(trigifyPages)) {
  const html = pages.get(p) ?? (await load(p)).html;
  if (html && !new RegExp(`href="${pillar}"[^>]*>Trigify alternatives<`).test(html)) fail(p, 'no link to the pillar with the anchor "Trigify alternatives"');
}
const home = pages.get("/") ?? "";
for (const l of [
  "/linkedin-profile-analyzer",
  pillar,
  "/compare",
  "/guides",
  "/signal-playbook",
  "/solutions/find-clients-for-a-marketing-agency",
  "/solutions/get-clients-for-a-recruitment-agency",
  "/solutions/find-clients-for-a-web-design-agency",
  "/solutions/find-customers-for-b2b-saas",
]) {
  if (!home.includes(`href="${l}"`)) fail("/", `homepage does not link to ${l}`);
  if (!live.has(l)) fail(l, "homepage links to a page that is not indexable");
}
if (!/"@type":"Organization"[^}]*"name":"Intentsly"/.test(home) || !home.includes('"@type":"WebSite"')) fail("/", "Organization or WebSite JSON-LD missing");
const analyzer = pages.get("/linkedin-profile-analyzer") ?? "";
if (!analyzer.includes("<title>Free LinkedIn Profile Analyzer &amp; Checker — Instant AI Review | Intentsly</title>")) fail("/linkedin-profile-analyzer", "wrong title");
if (!analyzer.includes('"@type":"FAQPage"')) fail("/linkedin-profile-analyzer", "FAQPage JSON-LD missing");
if (!/<h1[^>]*>[\s\S]*?<\/h1>/.exec(analyzer)?.[0] || !stripTags(/<h1[^>]*>[\s\S]*?<\/h1>/.exec(analyzer)[0]).includes("LinkedIn Profile Analyzer")) fail("/linkedin-profile-analyzer", 'H1 lacks "LinkedIn Profile Analyzer"');

console.log(`Source: ${BASE ?? "local dist/"}`);
console.log(`Sitemap URLs checked: ${checked}`);
console.log(`Redirects checked: ${Object.keys(redirects).length}`);
console.log(`Noindexed pages checked: ${noindexed.length}`);
if (failures.length) {
  console.log(`\nFAILED (${failures.length}):`);
  for (const f of failures) console.log(`- ${f}`);
  process.exit(1);
}
console.log("\nAll checks passed.");

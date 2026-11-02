// Renders the public marketing routes to static HTML after `vite build`, so
// crawlers that don't execute JavaScript (GPTBot, ClaudeBot, PerplexityBot, …)
// get real content and Google gets a unique title/description/canonical per
// URL. Also writes sitemap.xml from the same route list.
//
// Blog articles come from the Supabase table `blog_posts` (published rows,
// public key). They are fetched here at build time, so a newly published
// article is served as static HTML from the next deploy; until then it still
// renders client-side through the SPA fallback. Set BLOG_POSTS_FILE to a JSON
// file to prerender from local data instead (offline builds, tests).
//
// Runs as the last step of `npm run build`; needs dist/ and dist-ssr/.
import { JSDOM } from "jsdom";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

process.env.NODE_ENV = "production";

const SITE = "https://intentsly.com";
const DIST = path.resolve("dist");
const SSR_DIR = path.resolve("dist-ssr");

const ROUTES = [
  {
    path: "/",
    title: "Intentsly — Find buyers already looking for what you sell",
    description:
      "Intentsly monitors LinkedIn, Reddit and X for buying signals, enriches leads with verified emails, and runs AI outreach so you book meetings on autopilot.",
    priority: "1.0",
    changefreq: "weekly",
  },
  {
    path: "/pricing",
    title: "Pricing — Intentsly",
    description: "Intentsly plans and pricing for buying-signal monitoring, lead enrichment and AI-powered LinkedIn and email outreach.",
    priority: "0.8",
  },
  {
    path: "/features/ai-sdr",
    title: "AI SDR Outreach — Your AI sales rep that never sleeps | Intentsly",
    description: "Intentsly's AI SDR finds in-market leads, writes personalised LinkedIn and email outreach, follows up and books meetings for you.",
    priority: "0.8",
  },
  {
    path: "/features/conversational-ai",
    title: "Conversational AI — AI that talks like your best SDR | Intentsly",
    description: "Intentsly's conversational AI replies to prospects in your voice, handles objections and moves conversations towards a booked meeting.",
    priority: "0.8",
  },
  {
    path: "/features/linkedin-signals",
    title: "LinkedIn Buying Signals — Find leads already looking for you | Intentsly",
    description: "Track LinkedIn posts, comments, job changes and competitor engagement to surface people showing real buying intent for what you sell.",
    priority: "0.8",
  },
  {
    path: "/features/reddit-x-signals",
    title: "Reddit & X Monitoring — Capture buying signals across the web | Intentsly",
    description: "Monitor Reddit and X for people asking for recommendations, comparing tools or describing the problem you solve, and turn them into leads.",
    priority: "0.8",
  },
  {
    path: "/linkedin-profile-analyzer",
    title: "Free LinkedIn Profile Analyzer — Intentsly",
    description: "See what's silently killing your inbound leads on LinkedIn. Get a free AI review of your profile with specific fixes.",
    priority: "0.9",
    changefreq: "weekly",
  },
  {
    path: "/case-studies",
    title: "Case Studies — Real teams, real meetings | Intentsly",
    description: "How B2B teams use Intentsly's buying-signal outreach to book qualified meetings in weeks.",
    priority: "0.7",
    changefreq: "weekly",
  },
  {
    path: "/playbook",
    title: "The B2B Playbook: 0 to 100 customers in 90 days — Intentsly",
    description: "A free playbook for getting your first 100 B2B customers in 90 days with signal-based outbound.",
    priority: "0.7",
  },
  {
    path: "/signal-playbook",
    title: "The Buying Signal Playbook — Intentsly",
    description: "A free guide to spotting and acting on buying signals across LinkedIn, Reddit and X.",
    priority: "0.7",
  },
  {
    path: "/partners",
    title: "Partner Program — Grow your agency, earn recurring revenue | Intentsly",
    description: "Join the Intentsly partner program: offer signal-based lead generation to your clients and earn recurring revenue.",
    priority: "0.6",
  },
  {
    path: "/try-ai",
    title: "Try Intentsly AI — Find buyers in seconds",
    description: "Tell Intentsly AI who you sell to and it will find matching buyers in seconds. No signup needed.",
    priority: "0.6",
  },
  {
    path: "/help",
    title: "Help Center — Intentsly",
    description: "Advice and answers for getting the most out of Intentsly.",
    priority: "0.5",
  },
  {
    path: "/privacy",
    title: "Privacy Policy — Intentsly",
    description: "How Intentsly collects, uses and protects your data.",
    priority: "0.3",
    changefreq: "yearly",
  },
  {
    path: "/terms",
    title: "Terms of Service — Intentsly",
    description: "The terms that govern your use of Intentsly.",
    priority: "0.3",
    changefreq: "yearly",
  },
];

// React, framer-motion, lottie and the Supabase client all touch browser
// globals at import time, so give them a DOM before loading the bundle.
function installDomGlobals() {
  const dom = new JSDOM("<!doctype html><html><head></head><body></body></html>", { url: `${SITE}/` });
  const w = dom.window;
  const g = globalThis;
  for (const k of ["window", "document", "location", "history", "localStorage", "sessionStorage", "HTMLElement", "Element", "Node", "getComputedStyle", "MutationObserver", "DOMParser"]) {
    g[k] = w[k];
  }
  g.self = w;
  Object.defineProperty(g, "navigator", { value: w.navigator, configurable: true });
  const mql = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
  g.matchMedia = w.matchMedia = mql;
  const noopCtx = new Proxy({}, { get: (_, k) => (k === "canvas" ? {} : () => noopCtx), set: () => true });
  w.HTMLCanvasElement.prototype.getContext = () => noopCtx;
  g.requestAnimationFrame = (cb) => setTimeout(cb, 0);
  g.cancelAnimationFrame = clearTimeout;
  const Observer = class { observe() {} unobserve() {} disconnect() {} };
  g.IntersectionObserver = w.IntersectionObserver = Observer;
  g.ResizeObserver = w.ResizeObserver = Observer;
}

const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function readDotEnv() {
  const env = {};
  try {
    for (const line of fs.readFileSync(path.resolve(".env"), "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
      if (m) env[m[1]] = m[2];
    }
  } catch {
    // no .env: rely on process.env
  }
  return env;
}

// A blog outage must never fail the deploy: on any error, build without articles.
async function loadBlogPosts() {
  if (process.env.BLOG_POSTS_FILE) {
    return JSON.parse(fs.readFileSync(process.env.BLOG_POSTS_FILE, "utf8"));
  }
  const env = { ...readDotEnv(), ...process.env };
  const url = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    console.warn("blog: Supabase URL/key not found, skipping articles");
    return [];
  }
  const columns =
    "slug,section,title,excerpt,cluster,article_type,reading_minutes,published_at,updated_at,cover_image_url,author_name,meta_title,meta_description,content_md,faq,author_title";
  try {
    const res = await fetch(
      `${url}/rest/v1/blog_posts?status=eq.published&select=${columns}&order=published_at.desc&limit=1000`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(20000) },
    );
    if (!res.ok) {
      console.warn(`blog: could not load articles (HTTP ${res.status}), skipping`);
      return [];
    }
    const rows = await res.json();
    return Array.isArray(rows) ? rows : [];
  } catch (err) {
    console.warn("blog: could not load articles, skipping:", err.message);
    return [];
  }
}

// JSON placed inside a <script> must not be able to close the tag.
const safeJson = (value) => JSON.stringify(value).replace(/</g, "\\u003c").replace(/\u2028|\u2029/g, "");

function setMeta(html, attr, name, content) {
  const re = new RegExp(`<meta\\s+${attr}="${name}"\\s+content="[^"]*"\\s*/?>`);
  const tag = `<meta ${attr}="${name}" content="${esc(content)}">`;
  return re.test(html) ? html.replace(re, tag) : html.replace("</head>", `  ${tag}\n</head>`);
}

function buildPage(template, route, appHtml) {
  const url = `${SITE}${route.path === "/" ? "/" : route.path}`;
  let html = template.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(route.title)}</title>`);
  html = setMeta(html, "name", "description", route.description);
  html = setMeta(html, "property", "og:title", route.title);
  html = setMeta(html, "property", "og:description", route.description);
  html = setMeta(html, "property", "og:url", url);
  html = setMeta(html, "name", "twitter:title", route.title);
  html = setMeta(html, "name", "twitter:description", route.description);
  if (route.image) {
    html = setMeta(html, "property", "og:image", route.image);
    html = setMeta(html, "name", "twitter:image", route.image);
  }
  if (route.ogType) html = setMeta(html, "property", "og:type", route.ogType);
  html = html.replace("</head>", `  <link rel="canonical" href="${url}">\n</head>`);
  if (route.jsonLd) {
    html = html.replace("</head>", `  <script type="application/ld+json" id="page-jsonld">${safeJson(route.jsonLd)}</script>\n</head>`);
  }
  if (route.blogData) {
    html = html.replace("</head>", `  <script>window.__BLOG__=${safeJson(route.blogData)}</script>\n</head>`);
  }
  // index.html doubles as the SPA fallback for app routes (/dashboard, …);
  // drop the prerendered markup there so the homepage never flashes first.
  const guard = `<script>if(location.pathname.replace(/\\/+$/,"")!==${JSON.stringify(route.path === "/" ? "" : route.path)})document.getElementById("root").innerHTML=""</script>`;
  return html.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>${guard}`);
}

installDomGlobals();
const { render, caseStudies, toolRoutes, faqJsonLd, ANALYZER_FAQS, setBlogPrerenderData, buildPostJsonLd, toSummary, SECTIONS, postPath } = await import(
  pathToFileURL(path.join(SSR_DIR, "entry-prerender.js")).href
);

const blogPosts = (await loadBlogPosts()).map((p) => ({ ...p, section: p.section || "blog" }));
setBlogPrerenderData(blogPosts);
const blogSummaries = blogPosts.map(toSummary);
for (const key of Object.keys(SECTIONS)) {
  console.log(`${key}: ${blogPosts.filter((p) => p.section === key).length} published page(s)`);
}
const newestIn = (section) =>
  blogPosts
    .filter((p) => p.section === section)
    .map((post) => (post.updated_at || post.published_at || "").slice(0, 10))
    .sort()
    .pop() || undefined;

const routes = [
  ...ROUTES.map((r) => (r.path === "/linkedin-profile-analyzer" ? { ...r, jsonLd: faqJsonLd(ANALYZER_FAQS) } : r)),
  ...toolRoutes(SITE),
  ...caseStudies.map((s) => ({
    path: `/case-studies/${s.slug}`,
    title: s.metaTitle,
    description: s.metaDescription,
    image: s.ogImage?.startsWith("/") ? `${SITE}${s.ogImage}` : s.ogImage,
    priority: "0.6",
  })),
  ...Object.entries(SECTIONS).map(([key, s]) => ({
    path: s.path,
    title: s.title,
    description: s.description,
    priority: "0.8",
    changefreq: "daily",
    blogData: { posts: blogSummaries },
    lastmod: newestIn(key),
  })),
  ...blogPosts.map((post) => ({
    path: postPath(post),
    title: `${post.meta_title} | Intentsly`,
    description: post.meta_description,
    image: post.cover_image_url || undefined,
    ogType: "article",
    jsonLd: buildPostJsonLd(post),
    blogData: { post, posts: blogSummaries },
    lastmod: (post.updated_at || post.published_at || "").slice(0, 10) || undefined,
    priority: SECTIONS[post.section].priority,
  })),
];

const template = fs.readFileSync(path.join(DIST, "index.html"), "utf8");
const done = [];
for (const route of routes) {
  try {
    const page = buildPage(template, route, render(route.path));
    // "/pricing" -> dist/pricing.html, which Cloudflare serves at /pricing
    // (a pricing/index.html would redirect to a trailing-slash URL instead).
    const file = route.path === "/" ? "index.html" : `${route.path.slice(1)}.html`;
    const out = path.join(DIST, file);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, page);
    done.push(route);
    console.log(`prerendered ${route.path} (${(page.length / 1024).toFixed(1)} kB)`);
  } catch (err) {
    // Leave the route on the SPA shell rather than failing the whole deploy.
    console.error(`prerender FAILED for ${route.path}:`, err);
  }
}

// Only real modification dates go in <lastmod>. Stamping every page with the
// build date on each deploy teaches Google to ignore lastmod entirely —
// including the accurate dates on blog posts, which is what gets new
// articles recrawled quickly.
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (r) =>
      `  <url><loc>${SITE}${r.path}</loc>${r.lastmod ? `<lastmod>${r.lastmod}</lastmod>` : ""}<changefreq>${r.changefreq || "monthly"}</changefreq><priority>${r.priority}</priority></url>`,
  )
  .join("\n")}
</urlset>
`;
fs.writeFileSync(path.join(DIST, "sitemap.xml"), sitemap);
fs.rmSync(SSR_DIR, { recursive: true, force: true });
console.log(`prerendered ${done.length}/${routes.length} routes, wrote sitemap.xml`);

// The Supabase client keeps refresh timers alive; don't wait on them.
process.exit(done.length === 0 ? 1 : 0);

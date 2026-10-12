// Renders the public marketing routes to static HTML after `vite build`, so
// crawlers that don't execute JavaScript (GPTBot, ClaudeBot, PerplexityBot, …)
// get real content and Google gets a unique title/description/canonical per
// URL. Also writes sitemap.xml from the same route list.
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
  for (const k of ["window", "document", "localStorage", "sessionStorage", "HTMLElement", "Element", "Node", "getComputedStyle", "MutationObserver", "DOMParser"]) {
    g[k] = w[k];
  }
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
  html = html.replace("</head>", `  <link rel="canonical" href="${url}">\n</head>`);
  // index.html doubles as the SPA fallback for app routes (/dashboard, …);
  // drop the prerendered markup there so the homepage never flashes first.
  const guard = `<script>if(location.pathname.replace(/\\/+$/,"")!==${JSON.stringify(route.path === "/" ? "" : route.path)})document.getElementById("root").innerHTML=""</script>`;
  return html.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>${guard}`);
}

installDomGlobals();
const { render, caseStudies } = await import(pathToFileURL(path.join(SSR_DIR, "entry-prerender.js")).href);

const routes = [
  ...ROUTES,
  ...caseStudies.map((s) => ({
    path: `/case-studies/${s.slug}`,
    title: s.metaTitle,
    description: s.metaDescription,
    image: s.ogImage?.startsWith("/") ? `${SITE}${s.ogImage}` : s.ogImage,
    priority: "0.6",
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

const lastmod = new Date().toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (r) =>
      `  <url><loc>${SITE}${r.path}</loc><lastmod>${lastmod}</lastmod><changefreq>${r.changefreq || "monthly"}</changefreq><priority>${r.priority}</priority></url>`,
  )
  .join("\n")}
</urlset>
`;
fs.writeFileSync(path.join(DIST, "sitemap.xml"), sitemap);
fs.rmSync(SSR_DIR, { recursive: true, force: true });
console.log(`prerendered ${done.length}/${routes.length} routes, wrote sitemap.xml`);

// The Supabase client keeps refresh timers alive; don't wait on them.
process.exit(done.length === 0 ? 1 : 0);

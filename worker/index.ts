// Cloudflare Worker in front of the static site. It only runs for the paths in
// wrangler.jsonc `assets.run_worker_first`; everything else is served straight
// from the built assets as before.
//
// /free/:slug — guide pages are prerendered for every active `lead_magnets`
// row. Any other slug falls through to the SPA shell, which the assets layer
// serves with status 200; answer those with a real 404 (the app still renders
// its "not found" page from the same HTML).

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const res = await env.ASSETS.fetch(request);
    if (!/^\/free\/[^/]+\/?$/.test(url.pathname) || res.status !== 200) return res;
    if (!(res.headers.get("content-type") || "").includes("text/html")) return res;
    const html = await res.text();
    // Prerendered guide pages embed their row; the SPA shell does not.
    const status = html.includes("window.__LEAD_MAGNET__") ? 200 : 404;
    const headers = new Headers(res.headers);
    if (status === 404) headers.set("Cache-Control", "no-store");
    return new Response(html, { status, headers });
  },
};

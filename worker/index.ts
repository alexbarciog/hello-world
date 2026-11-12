// Cloudflare Worker in front of the static site. It only runs for the paths in
// wrangler.jsonc `assets.run_worker_first`; everything else is served straight
// from the built assets as before.
//
// /mcp — Intentsly's public MCP server address (the Claude connector URL). It
// forwards to the `mcp` Supabase edge function, so the address stays the same
// if the backend ever moves.
//
// /free/:slug — guide pages are prerendered for every active `lead_magnets`
// row. Any other slug falls through to the SPA shell, which the assets layer
// serves with status 200; answer those with a real 404 (the app still renders
// its "not found" page from the same HTML).

const MCP_ORIGIN = "https://uwwajlezgeurnvvrvdvb.supabase.co/functions/v1/mcp";

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
}

function mcpSubPath(pathname: string): string | null {
  if (pathname === "/mcp" || pathname.startsWith("/mcp/")) return pathname.slice("/mcp".length);
  // RFC 9728 fallback location for clients that don't read WWW-Authenticate.
  if (pathname.startsWith("/.well-known/oauth-protected-resource")) return "/.well-known/oauth-protected-resource";
  return null;
}

async function guidePage(request: Request, env: Env): Promise<Response> {
  const res = await env.ASSETS.fetch(request);
  if (res.status !== 200 || !(res.headers.get("content-type") || "").includes("text/html")) return res;
  const html = await res.text();
  // Prerendered guide pages embed their row; the SPA shell does not.
  const status = html.includes("window.__LEAD_MAGNET__") ? 200 : 404;
  const headers = new Headers(res.headers);
  if (status === 404) headers.set("Cache-Control", "no-store");
  return new Response(html, { status, headers });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const sub = mcpSubPath(url.pathname);
    if (sub !== null) return fetch(new Request(MCP_ORIGIN + sub + url.search, request));
    if (/^\/free\/[^/]+\/?$/.test(url.pathname)) return guidePage(request, env);
    return env.ASSETS.fetch(request);
  },
};

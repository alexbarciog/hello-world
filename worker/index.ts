// Cloudflare Worker in front of the static site. It only runs for the paths in
// wrangler.jsonc `assets.run_worker_first`; everything else is served straight
// from the built assets as before.
//
// /mcp is Intentsly's public MCP server address (the Claude connector URL). It
// forwards to the `mcp` Supabase edge function, so the address stays the same
// if the backend ever moves.

const MCP_ORIGIN = "https://uwwajlezgeurnvvrvdvb.supabase.co/functions/v1/mcp";

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    let subPath: string | null = null;
    if (url.pathname === "/mcp" || url.pathname.startsWith("/mcp/")) {
      subPath = url.pathname.slice("/mcp".length);
    } else if (url.pathname.startsWith("/.well-known/oauth-protected-resource")) {
      // RFC 9728 fallback location for clients that don't read WWW-Authenticate.
      subPath = "/.well-known/oauth-protected-resource";
    }
    if (subPath === null) return env.ASSETS.fetch(request);
    return fetch(new Request(MCP_ORIGIN + subPath + url.search, request));
  },
};

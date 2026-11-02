// Stripe client and request helpers shared by the billing edge functions.
import Stripe from "https://esm.sh/stripe@18.5.0";

export const STRIPE_API_VERSION = "2025-08-27.basil";

export function stripeClient(): Stripe {
  const key = Deno.env.get("STRIPE_SECRET_KEY");
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key, { apiVersion: STRIPE_API_VERSION, httpClient: Stripe.createFetchHttpClient() });
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

/** Where Stripe sends people back to: the caller's origin if it's ours, else the site. */
export function siteOrigin(req: Request): string {
  const fallback = Deno.env.get("SITE_URL") || "https://intentsly.com";
  const origin = req.headers.get("origin") || "";
  try {
    const host = new URL(origin).hostname;
    if (host === "intentsly.com" || host.endsWith(".intentsly.com") || host === "localhost" || host.endsWith(".lovable.app") || host.endsWith(".lovableproject.com")) {
      return origin;
    }
  } catch {
    // not a URL
  }
  return fallback;
}

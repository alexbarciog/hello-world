// Lead magnets (free guides at /free/:slug). Rows live in the Supabase table
// `lead_magnets`; RLS lets the public key read active rows only. Signups go
// through the `send-lead-magnet` edge function, which stores the email and
// sends the guide.
//
// Like the blog, initial data comes from two places so the page never flashes
// a loader:
//  - at build time, scripts/prerender.mjs calls setLeadMagnetPrerenderData();
//  - in the browser, the same row is embedded as window.__LEAD_MAGNET__.
import { useQuery } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { SITE_URL } from "@/lib/blog";
import { LEAD_MAGNET_EXTRAS } from "@/data/leadMagnetExtras";

// asset_url is deliberately not read here: the guide's link only comes back
// from send-lead-magnet after someone submits their email, so it never sits in
// the page HTML.
export interface LeadMagnet {
  slug: string;
  title: string;
  subtitle: string | null;
  bullets: string[] | null;
}

export const LEAD_MAGNET_COLUMNS = "slug,title,subtitle,bullets";

export const leadMagnetPath = (slug: string) => `/free/${slug}`;
export const leadMagnetUrl = (slug: string) => `${SITE_URL}${leadMagnetPath(slug)}`;

/** Title, description and share image for a guide page (also used by scripts/prerender.mjs). */
export function leadMagnetSeo(m: Pick<LeadMagnet, "slug" | "title" | "subtitle">) {
  const extras = LEAD_MAGNET_EXTRAS[m.slug];
  return {
    title: `${m.title} (Free ${extras?.format ?? "guide"}) | Intentsly`,
    description: m.subtitle || m.title,
    image: extras?.cover ? `${SITE_URL}${extras.cover}` : undefined,
  };
}

declare global {
  interface Window {
    __LEAD_MAGNET__?: LeadMagnet;
  }
}

let prerenderData: Record<string, LeadMagnet> | null = null;

/** Build-time only (scripts/prerender.mjs). */
export function setLeadMagnetPrerenderData(rows: LeadMagnet[]) {
  prerenderData = Object.fromEntries(rows.map((m) => [m.slug, m]));
}

const embedded = (): LeadMagnet | undefined =>
  typeof window !== "undefined" ? window.__LEAD_MAGNET__ : undefined;

// `lead_magnets` is not in the generated Database types yet.
const table = () => (supabase as unknown as SupabaseClient).from("lead_magnets");

async function fetchLeadMagnet(slug: string): Promise<LeadMagnet | null> {
  const { data, error } = await table()
    .select(LEAD_MAGNET_COLUMNS)
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as LeadMagnet) ?? null;
}

export function useLeadMagnet(slug: string | undefined) {
  const fromEmbed = embedded();
  const initial = slug ? prerenderData?.[slug] ?? (fromEmbed?.slug === slug ? fromEmbed : undefined) : undefined;
  return useQuery({
    queryKey: ["lead-magnet", slug],
    queryFn: () => fetchLeadMagnet(slug as string),
    enabled: Boolean(slug),
    initialData: initial,
    // Embedded data is as old as the last deploy: show it, then refresh.
    initialDataUpdatedAt: 0,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

/** Where the visitor came from: `utm_source`, else the referring site's hostname, else "direct". */
export function signupSource(search: string, referrer: string): string {
  const utm = new URLSearchParams(search).get("utm_source")?.trim();
  if (utm) return utm.slice(0, 60);
  try {
    const host = referrer ? new URL(referrer).hostname : "";
    if (host) return host.slice(0, 60);
  } catch {
    /* not a URL */
  }
  return "direct";
}

export const SIGNUP_ERROR = "Something went wrong. Try again, or email alex@intentsly.com.";

export type SignupResult =
  | { status: "sent"; assetUrl: string }
  // The signup was saved but the email failed: the page still shows the link.
  | { status: "email_failed"; assetUrl: string }
  | { status: "error"; message: string };

export async function requestLeadMagnet(input: {
  slug: string;
  email: string;
  name: string;
  source: string;
}): Promise<SignupResult> {
  const { data, error } = await supabase.functions.invoke("send-lead-magnet", { body: input });
  if (!error) {
    const assetUrl = (data as { asset_url?: string } | null)?.asset_url;
    return assetUrl ? { status: "sent", assetUrl } : { status: "error", message: SIGNUP_ERROR };
  }
  if (error instanceof FunctionsHttpError) {
    const res = error.context as Response;
    const body = (await res.json().catch(() => ({}))) as { asset_url?: string; error?: string };
    if (res.status === 502 && body.asset_url) return { status: "email_failed", assetUrl: body.asset_url };
    if (res.status === 400) return { status: "error", message: "Please enter a valid work email." };
  }
  return { status: "error", message: SIGNUP_ERROR };
}

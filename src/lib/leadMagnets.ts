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

export interface LeadMagnet {
  slug: string;
  title: string;
  subtitle: string | null;
  bullets: string[] | null;
  asset_url: string;
  cta_keyword: string | null;
}

export const LEAD_MAGNET_COLUMNS = "slug,title,subtitle,bullets,asset_url,cta_keyword";

export const leadMagnetPath = (slug: string) => `/free/${slug}`;
export const leadMagnetUrl = (slug: string) => `${SITE_URL}${leadMagnetPath(slug)}`;

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

/** `?src=` from the URL (e.g. "linkedin"), else "direct". */
export function signupSource(search: string): string {
  const src = new URLSearchParams(search).get("src")?.trim();
  return src ? src.slice(0, 60) : "direct";
}

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
    return assetUrl ? { status: "sent", assetUrl } : { status: "error", message: "Something went wrong. Try again." };
  }
  if (error instanceof FunctionsHttpError) {
    const res = error.context as Response;
    const body = (await res.json().catch(() => ({}))) as { asset_url?: string; error?: string };
    if (res.status === 502 && body.asset_url) return { status: "email_failed", assetUrl: body.asset_url };
    if (res.status === 400) return { status: "error", message: "Please enter a valid work email." };
    return { status: "error", message: body.error || "Something went wrong. Try again." };
  }
  return { status: "error", message: "Could not reach the server. Check your connection and try again." };
}

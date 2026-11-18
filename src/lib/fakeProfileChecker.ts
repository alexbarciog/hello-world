// Client side of the Fake LinkedIn Profile Checker: the two edge functions,
// Cloudflare Turnstile (loaded only when the input is focused) and the fpc_*
// events in app_events.
import { supabase } from "@/integrations/supabase/client";
import type { RiskLevel, Signal } from "../../supabase/functions/_shared/fake-profile";

export type { RiskLevel, Signal };

export const PENDING_KEY = "fpc_pending";

export interface CheckTeaser {
  id: string;
  risk_score: number;
  risk_level: RiskLevel;
  top_signal: Signal | null;
  more_count: number;
  low_confidence: boolean;
  low_confidence_note: string | null;
  /** The caller is signed in and owns the check: go straight to the report. */
  owned: boolean;
  cached?: boolean;
}

export interface FullReport {
  id: string;
  created_at: string;
  linkedin_url: string;
  risk_score: number;
  risk_level: RiskLevel;
  low_confidence: boolean;
  signals: Signal[];
  top_signal: Signal | null;
  summary: string | null;
  scrape_ok: boolean;
}

async function invoke<T>(fn: string, body: Record<string, unknown>): Promise<{ data?: T; error?: string; code?: string }> {
  const { data, error } = await supabase.functions.invoke(fn, { body });
  if (error) {
    let detail: { error?: string; code?: string } = {};
    try {
      detail = await (error as { context?: Response }).context?.json();
    } catch {
      // no JSON body
    }
    return { error: detail?.error || "Something went wrong. Please try again.", code: detail?.code };
  }
  return { data: data as T };
}

export const runCheck = (url: string, turnstileToken: string | null, source: string | null) =>
  invoke<CheckTeaser>("check-fake-profile", { url, turnstile_token: turnstileToken, source });

export const getReport = (id: string) => invoke<{ report: FullReport }>("get-fake-profile-report", { id });

// ── Attribution and events ──────────────────────────────────────────────────

function anonId(): string | null {
  try {
    let id = localStorage.getItem("ia_anon_id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("ia_anon_id", id);
    }
    return id;
  } catch {
    return null;
  }
}

/** utm/referrer of the visit, from the first-touch record when the content funnel stored one. */
export function visitSource(): string | null {
  try {
    const raw = localStorage.getItem("ia_first_touch");
    if (raw) {
      const t = JSON.parse(raw) as { utm?: Record<string, string>; referrer?: string; landing_path?: string };
      const utm = t.utm ? Object.entries(t.utm).map(([k, v]) => `${k}=${v}`).join("&") : "";
      return [utm, t.referrer ? `ref=${t.referrer}` : "", t.landing_path ? `landing=${t.landing_path}` : ""].filter(Boolean).join("|").slice(0, 200) || null;
    }
  } catch {
    // ignore
  }
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const utm = ["utm_source", "utm_medium", "utm_campaign"].map((k) => (params.get(k) ? `${k}=${params.get(k)}` : "")).filter(Boolean).join("&");
  let ref = "";
  try {
    ref = document.referrer ? new URL(document.referrer).hostname : "";
  } catch {
    // ignore
  }
  return [utm, ref ? `ref=${ref}` : ""].filter(Boolean).join("|").slice(0, 200) || null;
}

export type FpcEvent = "fpc_view" | "fpc_submit" | "fpc_result" | "fpc_unlock_click" | "fpc_report_view" | "fpc_tryai_click";

/** Fire-and-forget; analytics must never break the tool. */
export function track(event: FpcEvent, props: Record<string, unknown> = {}) {
  try {
    // log_app_event comes from the content-funnel migration; not in the generated types on every branch.
    // Called on the client (not detached) so `this` stays bound.
    const client = supabase as unknown as { rpc: (fn: string, args: Record<string, unknown>) => PromiseLike<unknown> };
    Promise.resolve(client.rpc("log_app_event", { p_event: event, p_props: { path: window.location.pathname, ...props }, p_anon_id: anonId() })).catch(() => {});
  } catch {
    // ignore
  }
}

// ── Cloudflare Turnstile (invisible) ────────────────────────────────────────

interface TurnstileApi {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  execute: (widgetId: string) => void;
  reset: (widgetId: string) => void;
}
declare global {
  interface Window { turnstile?: TurnstileApi }
}

export const TURNSTILE_SITE_KEY: string | undefined = import.meta.env.VITE_TURNSTILE_SITE_KEY || undefined;

let scriptPromise: Promise<void> | null = null;
/** Loads the Turnstile script once. Called when the input is focused. */
export function loadTurnstile(): Promise<void> {
  if (!TURNSTILE_SITE_KEY || typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  scriptPromise ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => {
      scriptPromise = null;
      reject(new Error("turnstile script failed"));
    };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

/** A fresh token, or null when Turnstile isn't configured. Rejects when the check fails. */
export async function getTurnstileToken(container: HTMLElement): Promise<string | null> {
  if (!TURNSTILE_SITE_KEY) return null;
  await loadTurnstile();
  const ts = window.turnstile;
  if (!ts) throw new Error("turnstile unavailable");
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error("turnstile timeout")), 10_000);
    container.innerHTML = "";
    const id = ts.render(container, {
      sitekey: TURNSTILE_SITE_KEY,
      execution: "execute",
      appearance: "interaction-only",
      callback: (token: string) => { window.clearTimeout(timeout); resolve(token); },
      "error-callback": (code: string) => { window.clearTimeout(timeout); reject(new Error(`turnstile error ${code}`)); },
      "expired-callback": () => { window.clearTimeout(timeout); reject(new Error("turnstile expired")); },
    });
    ts.execute(id);
  });
}

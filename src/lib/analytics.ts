// First-party analytics: which page brought each visitor, guide download and
// signup. No cookies, no third parties. Events go to public.app_events through
// the log_app_event RPC; signups are recorded by claim_signup_attribution.
//
// localStorage:
//   ia_anon_id      random id per browser, joins pre-signup events to the user
//   ia_first_touch  {landing_path, referrer_host, utm_*, ts} from the first visit, never overwritten
//
// Every storage access is wrapped: private windows and blocked storage must not
// break the page, they just lose attribution.
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppEvent =
  | "content_view"
  | "guide_cta_view"
  | "guide_cta_submit"
  | "tryai_click"
  | "tryai_run"
  | "paywall_viewed"
  | "trial_cta_clicked"
  | "checkout_started"
  | "trial_started";

export interface FirstTouch {
  landing_path: string;
  referrer_host: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  ts: string;
}

const ANON_KEY = "ia_anon_id";
const FIRST_TOUCH_KEY = "ia_first_touch";
const CLAIMED_PREFIX = "ia_signup_claimed:";

const isBrowser = () => typeof window !== "undefined";

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* storage unavailable */
  }
}

function randomId(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  } catch {
    /* fall through */
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

/** This browser's anonymous id (created on first use). */
export function getAnonId(): string | null {
  if (!isBrowser()) return null;
  const existing = read(ANON_KEY);
  if (existing) return existing;
  const id = randomId();
  write(ANON_KEY, id);
  return read(ANON_KEY) ? id : null;
}

export function getFirstTouch(): FirstTouch | null {
  if (!isBrowser()) return null;
  try {
    const raw = read(FIRST_TOUCH_KEY);
    return raw ? (JSON.parse(raw) as FirstTouch) : null;
  } catch {
    return null;
  }
}

const clip = (v: string | null, n = 120) => (v ? v.slice(0, n) : null);

/** Store where this visitor first landed. Runs on every page load; only the first one writes. */
export function captureFirstTouch() {
  if (!isBrowser() || read(FIRST_TOUCH_KEY)) return;
  try {
    const params = new URLSearchParams(window.location.search);
    let referrer_host: string | null = null;
    try {
      const host = document.referrer ? new URL(document.referrer).hostname : "";
      referrer_host = host && host !== window.location.hostname ? host : null;
    } catch {
      referrer_host = null;
    }
    const touch: FirstTouch = {
      landing_path: window.location.pathname.slice(0, 300),
      referrer_host,
      utm_source: clip(params.get("utm_source")),
      utm_medium: clip(params.get("utm_medium")),
      utm_campaign: clip(params.get("utm_campaign")),
      utm_content: clip(params.get("utm_content")),
      ts: new Date().toISOString(),
    };
    write(FIRST_TOUCH_KEY, JSON.stringify(touch));
  } catch {
    /* ignore */
  }
  getAnonId();
}

// `log_app_event` / `claim_signup_attribution` are not in the generated types.
const rpc = (fn: string, args: Record<string, unknown>) =>
  (supabase as unknown as SupabaseClient).rpc(fn, args);

const whenIdle = (fn: () => void) => {
  if (!isBrowser()) return;
  const ric = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number })
    .requestIdleCallback;
  if (ric) ric(fn, { timeout: 2000 });
  else window.setTimeout(fn, 1);
};

/** Fire-and-forget event. Never throws, never blocks rendering. */
export function track(event: AppEvent, props: Record<string, unknown> = {}) {
  if (!isBrowser()) return;
  whenIdle(() => {
    rpc("log_app_event", { p_event: event, p_props: props, p_anon_id: getAnonId() }).then(
      () => undefined,
      () => undefined,
    );
  });
}

/**
 * After a sign-in: if the account is new (the server checks: created in the
 * last day and not claimed yet), save the first touch on the profile and
 * record the 'signup' event. Runs at most once per user per browser.
 */
const claiming = new Set<string>();

export function claimSignupAttribution(userId: string) {
  if (!isBrowser() || claiming.has(userId) || read(CLAIMED_PREFIX + userId)) return;
  claiming.add(userId);
  whenIdle(() => {
    rpc("claim_signup_attribution", { p_first_touch: getFirstTouch() ?? {}, p_anon_id: getAnonId() }).then(
      ({ error }) => {
        // true = claimed now, false = not a new account or already claimed: either way, done.
        if (!error) write(CLAIMED_PREFIX + userId, "1");
        claiming.delete(userId);
      },
      () => claiming.delete(userId),
    );
  });
}

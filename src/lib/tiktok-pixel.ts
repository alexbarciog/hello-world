// TikTok Pixel — client-side + server-side (S2S) event helper
// Base pixel loaded in index.html; this module provides typed calls for both.

import { supabase } from "@/integrations/supabase/client";

declare global {
  interface Window {
    ttq?: {
      identify: (params: Record<string, string>) => void;
      track: (event: string, params?: Record<string, unknown>) => void;
      page: () => void;
    };
  }
}

function ttq() {
  return window.ttq;
}

// ---- Client-side pixel helpers ----

export function ttqIdentify(params: {
  email?: string;
  phone_number?: string;
  external_id?: string;
}) {
  ttq()?.identify(params);
}

export function ttqTrack(
  event: string,
  params?: {
    contents?: { content_id: string; content_type: string; content_name: string }[];
    value?: number;
    currency?: string;
    search_string?: string;
  }
) {
  // Fire client-side pixel
  ttq()?.track(event, params);

  // Fire server-side event (fire-and-forget)
  sendServerEvent(event, params).catch(() => {});
}

// ---- Server-side S2S helper ----

async function sendServerEvent(
  event: string,
  params?: {
    contents?: { content_id: string; content_type: string; content_name: string }[];
    value?: number;
    currency?: string;
    search_string?: string;
  }
) {
  try {
    const payload: Record<string, unknown> = {
      event,
      event_id: crypto.randomUUID(),
      url: window.location.href,
      user_agent: navigator.userAgent,
    };

    if (params?.contents) payload.contents = params.contents;
    if (params?.value !== undefined) payload.value = params.value;
    if (params?.currency) payload.currency = params.currency;
    if (params?.search_string) payload.search_string = params.search_string;

    // Try to attach user info if logged in
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) payload.external_id = user.id;
    if (user?.email) payload.email = user.email;

    // Read TTP cookie if present
    const ttp = document.cookie
      .split("; ")
      .find((c) => c.startsWith("_ttp="))
      ?.split("=")[1];
    if (ttp) payload.ttp = ttp;

    // Read ttclid from URL if present
    const ttclid = new URLSearchParams(window.location.search).get("ttclid");
    if (ttclid) payload.ttclid = ttclid;

    await supabase.functions.invoke("tiktok-event", { body: payload });
  } catch {
    // Silently fail — don't block UX
  }
}

// ---- Convenience wrappers ----

export function ttqViewContent(name: string, id?: string) {
  ttqTrack("ViewContent", {
    contents: [{ content_id: id ?? name, content_type: "product", content_name: name }],
  });
}

export function ttqCompleteRegistration() {
  ttqTrack("CompleteRegistration", {
    contents: [{ content_id: "signup", content_type: "product", content_name: "Intentsly Signup" }],
  });
}

export function ttqInitiateCheckout(planName: string, value?: number) {
  ttqTrack("InitiateCheckout", {
    contents: [{ content_id: planName, content_type: "product", content_name: planName }],
    value,
    currency: "USD",
  });
}

export function ttqPurchase(planName: string, value?: number) {
  ttqTrack("Purchase", {
    contents: [{ content_id: planName, content_type: "product", content_name: planName }],
    value,
    currency: "USD",
  });
}

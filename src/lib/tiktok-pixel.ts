// TikTok Pixel — client-side + server-side (S2S) event helper
// Base pixel loaded in index.html; this module provides typed calls for both.

import { supabase } from "@/integrations/supabase/client";

const PIXEL_ID = "D780ID3C77UCM5J7I8T0";

declare global {
  interface Window {
    ttq?: {
      identify: (params: Record<string, string>) => void;
      track: (event: string, params?: Record<string, unknown>, options?: Record<string, unknown>) => void;
      page: () => void;
    };
  }
}

function ttq() {
  return window.ttq;
}

// ---- SPA virtual-pageview helper ----
// Must be called on every client-side route change so the SDK
// associates subsequent track() calls with the correct page.
export function ttqPage() {
  ttq()?.page();
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
  // Shared event_id for deduplication between pixel and S2S
  const eventId = crypto.randomUUID();

  // Fire client-side pixel with event_id
  ttq()?.track(event, params, { event_id: eventId });

  // Fire server-side event with same event_id (fire-and-forget)
  sendServerEvent(event, params, eventId).catch(() => {});
}

// ---- Server-side S2S helper ----

async function sendServerEvent(
  event: string,
  params?: {
    contents?: { content_id: string; content_type: string; content_name: string }[];
    value?: number;
    currency?: string;
    search_string?: string;
  },
  eventId?: string
) {
  try {
    const payload: Record<string, unknown> = {
      event,
      event_id: eventId || crypto.randomUUID(),
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

export function ttqAddToCart(planName: string, value?: number) {
  ttqTrack("AddToCart", {
    contents: [{ content_id: planName, content_type: "product", content_name: planName }],
    value,
    currency: "USD",
  });
}

export function ttqAddPaymentInfo(planName: string, value?: number) {
  ttqTrack("AddPaymentInfo", {
    contents: [{ content_id: planName, content_type: "product", content_name: planName }],
    value,
    currency: "USD",
  });
}

export function ttqInitiateCheckout(planName: string, value?: number) {
  ttqTrack("InitiateCheckout", {
    contents: [{ content_id: planName, content_type: "product", content_name: planName }],
    value,
    currency: "USD",
  });
}

export function ttqPlaceAnOrder(planName: string, value?: number) {
  ttqTrack("PlaceAnOrder", {
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

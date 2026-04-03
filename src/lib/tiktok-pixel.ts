// TikTok Pixel event helper
// The base pixel is loaded in index.html; this module provides typed event calls.

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

/** Identify a user (values should already be SHA-256 hashed) */
export function ttqIdentify(params: {
  email?: string;
  phone_number?: string;
  external_id?: string;
}) {
  ttq()?.identify(params);
}

/** Track a standard TikTok pixel event */
export function ttqTrack(
  event: string,
  params?: {
    contents?: { content_id: string; content_type: string; content_name: string }[];
    value?: number;
    currency?: string;
    search_string?: string;
  }
) {
  ttq()?.track(event, params);
}

// ---- Convenience wrappers ----

export function ttqViewContent(name: string, id?: string) {
  ttqTrack("ViewContent", {
    contents: [{ content_id: id ?? name, content_type: "product", content_name: name }],
  });
}

export function ttqCompleteRegistration(email?: string) {
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

import type { MouseEvent } from "react";
import { toast } from "sonner";

/**
 * External-link handling that can never replace the app with a framed
 * LinkedIn error page.
 *
 * Two worlds:
 * 1. App running in a normal top-level tab (production usage): native
 *    <a target="_blank"> is bulletproof — we don't intercept AT ALL.
 * 2. App running inside an embedding iframe (editor previews, in-app
 *    browsers): those shells intercept anchor clicks AND monkey-patch
 *    window.open, rerouting navigation into their frame — where LinkedIn
 *    refuses to render (X-Frame-Options → ERR_BLOCKED_BY_RESPONSE).
 *    There is no reliable way to open a tab from inside; so we don't
 *    navigate at all — we copy the link and tell the user.
 */
const isEmbedded = (() => {
  try {
    return window.self !== window.top;
  } catch {
    // Cross-origin access to window.top throws → definitely embedded.
    return true;
  }
})();

export function openExternal(url: string | null | undefined): void {
  if (!url) return;

  if (!isEmbedded) {
    const w = window.open(url, "_blank");
    if (w) {
      try {
        w.opener = null;
      } catch {
        /* cross-origin handle — already detached */
      }
      return;
    }
    // Popup blocker in a top-level tab — copy instead of navigating away.
  }

  try {
    void navigator.clipboard?.writeText(url);
    toast.info(
      isEmbedded
        ? "Links can't open from this embedded preview — copied to clipboard. Open Intentsly in its own browser tab for one-click links."
        : "Your browser blocked the new tab — link copied to clipboard.",
      { duration: 6000 },
    );
  } catch {
    toast.info("Open Intentsly in its own browser tab to follow LinkedIn links.");
  }
}

/**
 * Spread onto an <a>. In a normal tab the anchor behaves 100% natively
 * (we only stop row-level click handlers); inside an embedded preview we
 * take over and copy the link instead of letting the shell frame LinkedIn.
 */
export function externalLinkProps(url: string | null | undefined) {
  return {
    href: url ?? undefined,
    target: "_blank" as const,
    rel: "noopener noreferrer",
    onClick: (e: MouseEvent) => {
      e.stopPropagation(); // keep row/card click handlers out of it
      if (!isEmbedded) return; // top-level tab → pure native anchor behavior
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      openExternal(url);
    },
  };
}

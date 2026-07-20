import type { MouseEvent } from "react";
import { toast } from "sonner";

/**
 * Open an external URL in a way that survives hostile embedding contexts.
 *
 * Plain <a target="_blank"> fails when the app runs inside an embedding
 * iframe (editor previews, in-app browsers): the navigation gets forced into
 * the frame, LinkedIn refuses to be framed (X-Frame-Options), and the user
 * sees "www.linkedin.com refused to connect · ERR_BLOCKED_BY_RESPONSE".
 *
 * IMPORTANT: never pass "noopener" in the window.open features string —
 * Chrome then returns null even on SUCCESS, which makes any null-check
 * fallback fire on every click (and previously navigated the app itself to
 * LinkedIn). Open plainly, null-check, then detach the opener by hand.
 */
export function openExternal(url: string | null | undefined): void {
  if (!url) return;

  const w = window.open(url, "_blank");
  if (w) {
    try {
      w.opener = null; // detach for security (what "noopener" would have done)
    } catch {
      /* cross-origin handle — already detached */
    }
    return;
  }

  // Genuinely blocked (sandboxed embed without allow-popups, or a popup
  // blocker). NEVER navigate the app itself — that replaces Intentsly with a
  // framed LinkedIn error. Copy the link and tell the user instead.
  try {
    void navigator.clipboard?.writeText(url);
    toast.error("New tab was blocked by this environment — link copied, paste it into a new tab.");
  } catch {
    toast.error("New tab was blocked by this environment. Open Intentsly in its own browser tab and try again.");
  }
}

/**
 * Spread onto an <a> so left-clicks route through openExternal while
 * middle-click / cmd-click / copy-link keep native anchor behavior.
 */
export function externalLinkProps(url: string | null | undefined) {
  return {
    href: url ?? undefined,
    target: "_blank" as const,
    rel: "noopener noreferrer",
    onClick: (e: MouseEvent) => {
      // Deliberately ignore e.defaultPrevented: embedding shells (editor
      // previews) install document-level capture listeners that preventDefault
      // and reroute anchor navigations into their iframe — we still want our
      // own top-level tab in that case.
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      e.stopPropagation();
      openExternal(url);
    },
  };
}

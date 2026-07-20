import type { MouseEvent } from "react";

/**
 * Open an external URL in a way that survives hostile embedding contexts.
 *
 * Plain <a target="_blank"> fails when the app runs inside an embedding
 * iframe (editor previews, in-app browsers): the navigation gets forced into
 * the frame, LinkedIn refuses to be framed (X-Frame-Options), and the user
 * sees "www.linkedin.com refused to connect · ERR_BLOCKED_BY_RESPONSE".
 * window.open() from a user gesture opens a genuine top-level tab instead,
 * and "noopener,noreferrer" also strips the referrer — which LinkedIn uses
 * to block some cross-site profile navigations.
 */
export function openExternal(url: string | null | undefined): void {
  if (!url) return;
  const w = window.open(url, "_blank", "noopener,noreferrer");
  if (!w) {
    // Popup blocked (sandboxed frame) — escape via top-level navigation.
    try {
      if (window.top && window.top !== window) {
        window.top.location.href = url;
        return;
      }
    } catch {
      /* cross-origin top without navigation permission */
    }
    window.location.href = url;
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
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      e.stopPropagation();
      openExternal(url);
    },
  };
}

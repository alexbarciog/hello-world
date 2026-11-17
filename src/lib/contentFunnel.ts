// Rules for the content-page next steps (see src/components/content/ContentFunnel.tsx).
import type { Element, Root } from "hast";

export interface GuideOffer {
  slug: string;
  title: string;
  blurb: string;
  thumb: string;
}

const TWELVE_SIGNALS: GuideOffer = {
  slug: "12-buying-signals",
  title: "The 12 Buying Signals",
  blurb: "Every signal and the first message to send for each.",
  thumb: "/downloads/intentsly-12-buying-signals-cover-thumb.jpg",
};

const INTENT_PLAYBOOK: GuideOffer = {
  slug: "intent-playbook",
  title: "The Intent Playbook",
  blurb: "Spot the people already asking, write the first message and book the demo.",
  thumb: "/downloads/intentsly-intent-playbook-cover-thumb.jpg",
};

const OUTREACH_KEYWORDS = /(outreach|follow[\s-]?up|cold|sequence|demo)/i;

/** Which free guide a content page offers. The one place to change the rule. */
export function guideForContent(path: string, primaryKeyword: string | null | undefined): GuideOffer {
  if (path.startsWith("/guides/") || OUTREACH_KEYWORDS.test(primaryKeyword ?? "")) return INTENT_PLAYBOOK;
  return TWELVE_SIGNALS;
}

export const tryAiHref = (slug: string) =>
  `/try-ai?utm_source=content&utm_content=${encodeURIComponent(slug)}`;

/**
 * rehype plugin: marks the spot for the guide card in the rendered tree,
 * before the second top-level <h2> (before the first if there is only one,
 * at the end if there are none). The `aside` renderer swaps the marker for the card.
 */
export const GUIDE_SLOT = "guide-cta";
export function rehypeGuideSlot() {
  return (tree: Root) => {
    const h2s = tree.children
      .map((node, i) => ({ node, i }))
      .filter(({ node }) => node.type === "element" && (node as Element).tagName === "h2");
    const at = h2s.length >= 2 ? h2s[1].i : h2s.length === 1 ? h2s[0].i : tree.children.length;
    const slot: Element = { type: "element", tagName: "aside", properties: { dataSlot: GUIDE_SLOT }, children: [] };
    tree.children.splice(at, 0, slot);
  };
}

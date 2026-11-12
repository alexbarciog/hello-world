// Per-guide extras for /free/:slug that the `lead_magnets` table has no columns
// for. A new guide needs no entry here: its cover is picked up by naming
// convention (public/downloads/intentsly-<slug>-cover.png) and its title says
// "(Free PDF)". Add an entry only for a "What's inside" list, a closing line,
// a link to another guide, or blog posts that should promote it.

export interface LeadMagnetExtras {
  /** Cover override. Omit to use the naming convention; null when the guide has no cover. */
  cover?: string | null;
  /** Shown in the page title, e.g. "PDF" → "… (Free PDF)". Defaults to PDF. */
  format?: string;
  inside?: { heading: string; items: string[] };
  /** Closing line at the bottom of the page, in the lime highlight style. */
  tagline?: string;
  /** Line under the form pointing to another guide. */
  crossLink?: { slug: string; text: string };
  /** Blog/learn post slugs that end with a card linking to this guide. */
  blogSlugs?: string[];
  /** Text of that card. */
  blogCardText?: string;
}

export const LEAD_MAGNET_EXTRAS: Record<string, LeadMagnetExtras> = {
  "buying-signals-guide": {
    cover: null,
    format: "guide",
  },
  "12-buying-signals": {
    inside: {
      heading: "What's inside",
      items: [
        "Asks a question about the problem you solve",
        "Likes three posts on the topic in one week",
        "Comments on a competitor's post",
        "Follows your profile",
        "Views your profile twice",
        "Changes job title",
        "Company starts hiring for the role you replace",
        "Company raises a round",
        'Posts a "we\'re looking for" request',
        "Complains about a tool in your category",
        "Reddit thread asking for recommendations",
        "X post tagging a competitor",
      ],
    },
    crossLink: { slug: "intent-playbook", text: "Want the full system? Get The Intent Playbook" },
    blogSlugs: ["linkedin-buying-signals", "buying-signals-examples"],
    blogCardText: "Get all 12 signals with a first message for each (free PDF)",
  },
  "intent-playbook": {
    inside: {
      heading: "What's inside",
      items: [
        "The system on one page: Spot → Read → Reply → Book",
        "The 12 signals and what each means",
        "The opener for each signal",
        "The 3-minute homework before you write",
        "The follow-up rules",
        "Booking the demo",
        "The weekly review",
      ],
    },
    tagline: "Spot → Read → Reply → Book",
  },
};

/** Site-relative cover image for a guide, or null when it has none. */
export function coverFor(slug: string): string | null {
  const override = LEAD_MAGNET_EXTRAS[slug]?.cover;
  return override === undefined ? `/downloads/intentsly-${slug}-cover.png` : override;
}

/** The guide a blog post should promote at its end, if any. */
export function guideForPost(postSlug: string): { slug: string; text: string } | null {
  for (const [slug, extras] of Object.entries(LEAD_MAGNET_EXTRAS)) {
    if (extras.blogSlugs?.includes(postSlug) && extras.blogCardText) return { slug, text: extras.blogCardText };
  }
  return null;
}

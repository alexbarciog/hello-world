// Per-guide extras for /free/:slug that the `lead_magnets` table has no columns
// for: the cover image, the file format, a "What's inside" list and the blog
// posts that should link to the guide. Guides without an entry still work;
// they just show no cover or list.

export interface LeadMagnetExtras {
  /** Site-relative path to a cover image of page 1. */
  cover?: string;
  /** Shown in the page title, e.g. "PDF" → "… (Free PDF)". */
  format?: string;
  inside?: { heading: string; items: string[] };
  /** Blog/learn post slugs that end with a card linking to this guide. */
  blogSlugs?: string[];
  /** Text of that card. */
  blogCardText?: string;
}

export const LEAD_MAGNET_EXTRAS: Record<string, LeadMagnetExtras> = {
  "12-buying-signals": {
    cover: "/downloads/intentsly-12-buying-signals-cover.png",
    format: "PDF",
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
    blogSlugs: ["linkedin-buying-signals", "buying-signals-examples"],
    blogCardText: "Get all 12 signals with a first message for each (free PDF)",
  },
};

/** The guide a blog post should promote at its end, if any. */
export function guideForPost(postSlug: string): { slug: string; text: string } | null {
  for (const [slug, extras] of Object.entries(LEAD_MAGNET_EXTRAS)) {
    if (extras.blogSlugs?.includes(postSlug) && extras.blogCardText) return { slug, text: extras.blogCardText };
  }
  return null;
}

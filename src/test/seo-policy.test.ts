import { describe, expect, it } from "vitest";
import type { BlogPostSummary } from "@/lib/blog";
import { matchingSolution, relatedPosts } from "@/lib/relatedLinks";
import { isIndexablePath, mergedTarget, TRIGIFY_PILLAR } from "@/lib/seoPolicy";

const page = (slug: string, section: BlogPostSummary["section"], cluster: string, title = slug.replace(/-/g, " ")): BlogPostSummary => ({
  slug, section, cluster, title, excerpt: "", article_type: null, reading_minutes: null, published_at: null, updated_at: "", cover_image_url: null, author_name: null,
});

const pages = [
  page("trigify-alternatives", "blog", "trigify"),
  page("trigify-shutting-down", "blog", "trigify"),
  page("trigify-api-alternative", "blog", "trigify"),
  page("trigify-vs-valley", "blog", "trigify"),
  page("free-trigify-alternatives", "blog", "trigify"),
  page("what-is-intent-data", "learn", "fundamentals"),
  page("find-customers-for-b2b-saas", "solutions", "find-customers"),
  page("find-customers-on-linkedin", "solutions", "find-customers"),
  page("get-clients-for-a-recruitment-agency", "solutions", "find-customers"),
  page("find-leads-for-a-software-company", "solutions", "find-customers"),
];

describe("seo policy", () => {
  it("keeps merged and noindexed pages out of the index", () => {
    expect(isIndexablePath("/blog/trigify-vs-valley")).toBe(false);
    expect(isIndexablePath("/blog/free-trigify-alternatives")).toBe(false);
    expect(isIndexablePath("/buying-signals/seo")).toBe(false);
    expect(isIndexablePath("/buying-signals")).toBe(true);
    expect(isIndexablePath(TRIGIFY_PILLAR)).toBe(true);
    expect(mergedTarget("/blog/free-trigify-alternatives")).toBe(TRIGIFY_PILLAR);
  });

  it("every redirect goes straight to an indexable page", () => {
    expect(isIndexablePath(mergedTarget("/blog/trigify-alternative-for-social-listening") as string)).toBe(true);
  });
});

describe("related links", () => {
  it("links within the cluster first and only to indexable pages", () => {
    const related = relatedPosts(pages[1], pages);
    expect(related.slice(0, 2).map((p) => p.slug)).toEqual(["trigify-alternatives", "trigify-api-alternative"]);
    expect(related.map((p) => p.slug)).not.toContain("trigify-vs-valley");
    expect(related.map((p) => p.slug)).not.toContain("free-trigify-alternatives");
    expect(related.map((p) => p.slug)).not.toContain("trigify-shutting-down");
  });

  it("picks the /solutions page for the audience, never a noindexed one", () => {
    expect(matchingSolution(page("x", "blog", "outbound", "Outbound for recruitment agencies"), pages)?.slug).toBe("get-clients-for-a-recruitment-agency");
    expect(matchingSolution(page("x", "blog", "outbound", "Software pricing"), pages)?.slug).toBe("find-customers-for-b2b-saas");
    expect(matchingSolution(page("x", "blog", "outbound", "Cold calling"), pages)?.slug).toBe("find-customers-on-linkedin");
    expect(matchingSolution(pages[6], pages)).toBeNull();
  });
});

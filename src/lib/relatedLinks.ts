// The "Related" block on every content page: links within the same topic
// cluster, plus the /solutions page closest to the article's audience.
import { postPath, type BlogPostSummary } from "@/lib/blog";
import { isIndexablePath } from "@/lib/seoPolicy";

export const RELATED_LINK_COUNT = 4;

// Database clusters are finer than the topics a reader thinks in.
const CLUSTER_FAMILY: Record<string, string> = {
  trigify: "trigify",
  competitor: "compare",
  "intentsly-vs": "compare",
  "linkedin-signals": "linkedin",
  "linkedin-prospecting": "linkedin",
  outbound: "outbound",
  templates: "outbound",
  "ai-sdr": "outbound",
  fundamentals: "fundamentals",
  "signal-selling": "fundamentals",
  "intent-tools": "fundamentals",
  "find-customers": "find-customers",
  "reddit-x": "reddit",
};

export const isTrigifyPage = (p: Pick<BlogPostSummary, "slug" | "cluster">) =>
  p.cluster === "trigify" || p.slug.includes("trigify");

const familyOf = (p: BlogPostSummary) =>
  isTrigifyPage(p) ? "trigify" : CLUSTER_FAMILY[p.cluster ?? ""] ?? p.cluster ?? p.section;

const STOP = new Set(
  "a an and are at be by do does for from how in is it of on or that the this to vs what when with your you b2b linkedin".split(" "),
);

const tokens = (text: string) =>
  new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/[\s-]+/)
      .filter((w) => w.length > 2 && !STOP.has(w)),
  );

const SOLUTION_RULES: [RegExp, string][] = [
  [/recruit|hiring|talent/i, "get-clients-for-a-recruitment-agency"],
  [/web design|website/i, "find-clients-for-a-web-design-agency"],
  [/agenc|marketing/i, "find-clients-for-a-marketing-agency"],
  [/saas|software|product-led|\bapi\b/i, "find-customers-for-b2b-saas"],
  [/fractional|\bcfo\b/i, "find-clients-as-a-fractional-cfo"],
  [/consult/i, "lead-generation-for-consultants"],
  [/startup|founder/i, "find-customers-for-a-startup"],
  [/small business/i, "b2b-lead-generation-for-small-business"],
];
const DEFAULT_SOLUTION = "find-customers-on-linkedin";

/** The /solutions page whose audience best fits this article. Null on /solutions pages themselves. */
export function matchingSolution(post: BlogPostSummary, posts: BlogPostSummary[]): BlogPostSummary | null {
  if (post.section === "solutions") return null;
  const solutions = posts.filter((p) => p.section === "solutions" && isIndexablePath(postPath(p)));
  const haystack = `${post.title} ${post.excerpt ?? ""} ${post.slug.replace(/-/g, " ")}`;
  const rule = SOLUTION_RULES.find(([re]) => re.test(haystack));
  const slug = rule ? rule[1] : DEFAULT_SOLUTION;
  return solutions.find((p) => p.slug === slug) ?? solutions.find((p) => p.slug === DEFAULT_SOLUTION) ?? solutions[0] ?? null;
}

/** Indexable pages in the same topic first, then the same section, then shared title words. */
export function relatedPosts(post: BlogPostSummary, posts: BlogPostSummary[], exclude: string[] = []): BlogPostSummary[] {
  const family = familyOf(post);
  const own = tokens(`${post.title} ${post.slug}`);
  const score = (p: BlogPostSummary) => {
    const shared = [...tokens(`${p.title} ${p.slug}`)].filter((w) => own.has(w)).length;
    return (familyOf(p) === family ? 100 : 0) + (p.section === post.section ? 10 : 0) + shared;
  };
  return posts
    .filter((p) => p.slug !== post.slug && !exclude.includes(p.slug) && isIndexablePath(postPath(p)))
    .map((p) => ({ p, s: score(p) }))
    .sort((a, b) => b.s - a.s || a.p.slug.localeCompare(b.p.slug))
    .slice(0, RELATED_LINK_COUNT)
    .map(({ p }) => p);
}

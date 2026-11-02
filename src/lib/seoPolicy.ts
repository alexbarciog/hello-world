// Which public URLs are indexable. The data lives in src/data/seoPolicy.json so
// the prerender, the verify script and the content gate read the same list.
import policy from "@/data/seoPolicy.json";

const noindex = policy.noindex as Record<string, string>;
const merged = policy.merged as Record<string, string>;
const prefixes = Object.keys(policy.noindexPrefixes);

export const TRIGIFY_PILLAR = policy.pillars.trigify;

export const mergedTarget = (path: string): string | undefined => merged[path];

export const isIndexablePath = (path: string): boolean =>
  !noindex[path] && !merged[path] && !prefixes.some((p) => path.startsWith(p));

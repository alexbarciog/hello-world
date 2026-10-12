// Blog data layer. Articles live in the Supabase table `blog_posts`; only rows
// with status = 'published' are readable with the public key (RLS).
//
// Two sources of initial data keep the page from flashing a loader:
//  - at build time, scripts/prerender.mjs calls setBlogPrerenderData() before
//    rendering, so the static HTML contains the article;
//  - in the browser, the same data is embedded as window.__BLOG__.
import { useQuery } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface BlogFaq {
  question: string;
  answer: string;
}

export interface BlogPostSummary {
  slug: string;
  title: string;
  excerpt: string;
  cluster: string | null;
  article_type: string | null;
  reading_minutes: number | null;
  published_at: string | null;
  updated_at: string;
  cover_image_url: string | null;
  author_name: string | null;
}

export interface BlogPost extends BlogPostSummary {
  meta_title: string;
  meta_description: string;
  content_md: string;
  faq: BlogFaq[];
  author_title: string | null;
}

export const SITE_URL = "https://intentsly.com";

const SUMMARY_COLUMNS =
  "slug,title,excerpt,cluster,article_type,reading_minutes,published_at,updated_at,cover_image_url,author_name";
const POST_COLUMNS = `${SUMMARY_COLUMNS},meta_title,meta_description,content_md,faq,author_title`;

export const CLUSTER_LABELS: Record<string, string> = {
  "linkedin-signals": "LinkedIn signals",
  "reddit-x": "Reddit & X",
  "signal-selling": "Signal-based selling",
  competitor: "Comparisons",
  "intent-tools": "Intent tools",
  "ai-sdr": "AI SDR",
  templates: "Templates",
  data: "Data",
};

export const clusterLabel = (cluster: string | null) =>
  cluster ? CLUSTER_LABELS[cluster] ?? cluster.replace(/-/g, " ") : "Guide";

export const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }) : "";

export const toSummary = (p: BlogPost): BlogPostSummary => ({
  slug: p.slug,
  title: p.title,
  excerpt: p.excerpt,
  cluster: p.cluster,
  article_type: p.article_type,
  reading_minutes: p.reading_minutes,
  published_at: p.published_at,
  updated_at: p.updated_at,
  cover_image_url: p.cover_image_url,
  author_name: p.author_name,
});

/** Same id algorithm for the table of contents and the rendered headings. */
export const headingId = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

/** H2 headings of an article, for the table of contents. Skips fenced code. */
export const extractHeadings = (markdown: string) => {
  const out: { id: string; text: string }[] = [];
  let inCode = false;
  for (const line of markdown.split("\n")) {
    if (line.trimStart().startsWith("```")) inCode = !inCode;
    const m = !inCode && line.match(/^##\s+(.+?)\s*$/);
    if (m) {
      const text = m[1].replace(/[*_`]/g, "").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
      out.push({ id: headingId(text), text });
    }
  }
  return out;
};

export function buildPostJsonLd(post: BlogPost) {
  const url = `${SITE_URL}/blog/${post.slug}`;
  const graph: Record<string, unknown>[] = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.meta_description,
      datePublished: post.published_at,
      dateModified: post.updated_at,
      author: post.author_name
        ? { "@type": "Person", name: post.author_name, jobTitle: post.author_title ?? undefined }
        : { "@type": "Organization", name: "Intentsly", url: SITE_URL },
      publisher: {
        "@type": "Organization",
        name: "Intentsly",
        url: SITE_URL,
        logo: { "@type": "ImageObject", url: `${SITE_URL}/favicon.ico` },
      },
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
      ...(post.cover_image_url ? { image: post.cover_image_url } : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
        { "@type": "ListItem", position: 3, name: post.title, item: url },
      ],
    },
  ];
  if (post.faq?.length) {
    graph.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: post.faq.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    });
  }
  return graph;
}

// ---- initial data -----------------------------------------------------------

interface BlogInitialData {
  posts?: BlogPostSummary[];
  post?: BlogPost;
}

declare global {
  interface Window {
    __BLOG__?: BlogInitialData;
  }
}

let prerenderData: { posts: BlogPostSummary[]; bySlug: Record<string, BlogPost> } | null = null;

/** Build-time only (scripts/prerender.mjs). */
export function setBlogPrerenderData(posts: BlogPost[]) {
  prerenderData = {
    posts: posts.map(toSummary),
    bySlug: Object.fromEntries(posts.map((p) => [p.slug, p])),
  };
}

const embedded = (): BlogInitialData | undefined =>
  typeof window !== "undefined" ? window.__BLOG__ : undefined;

// ---- queries ----------------------------------------------------------------

// `blog_posts` is not in the generated Database types yet.
const table = () => (supabase as unknown as SupabaseClient).from("blog_posts");

async function fetchPosts(): Promise<BlogPostSummary[]> {
  const { data, error } = await table()
    .select(SUMMARY_COLUMNS)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as unknown as BlogPostSummary[];
}

async function fetchPost(slug: string): Promise<BlogPost | null> {
  const { data, error } = await table()
    .select(POST_COLUMNS)
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as BlogPost) ?? null;
}

export function useBlogPosts() {
  const initial = prerenderData?.posts ?? embedded()?.posts;
  return useQuery({
    queryKey: ["blog-posts"],
    queryFn: fetchPosts,
    initialData: initial,
    // Embedded data is as old as the last deploy: show it, then refresh.
    initialDataUpdatedAt: 0,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

export function useBlogPost(slug: string | undefined) {
  const fromEmbed = embedded()?.post;
  const initial = slug ? prerenderData?.bySlug[slug] ?? (fromEmbed?.slug === slug ? fromEmbed : undefined) : undefined;
  return useQuery({
    queryKey: ["blog-post", slug],
    queryFn: () => fetchPost(slug as string),
    enabled: Boolean(slug),
    initialData: initial,
    initialDataUpdatedAt: 0,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

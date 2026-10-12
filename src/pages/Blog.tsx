import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import { CTASection, Footer } from "@/components/CTAFooter";
import { applySeo } from "@/lib/seo";
import { SITE_URL, clusterLabel, formatDate, useBlogPosts } from "@/lib/blog";

export const BLOG_TITLE = "Blog — Buying signals, outbound and AI SDR guides | Intentsly";
export const BLOG_DESCRIPTION =
  "Practical guides to finding buyers from signals on LinkedIn, Reddit and X: search queries, comparisons, templates and what we learn running Intentsly on ourselves.";

const Blog = () => {
  const { data: posts, isLoading, isError } = useBlogPosts();
  const [cluster, setCluster] = useState<string | null>(null);

  useEffect(
    () => applySeo({ title: BLOG_TITLE, description: BLOG_DESCRIPTION, url: `${SITE_URL}/blog` }),
    [],
  );

  const clusters = useMemo(
    () => Array.from(new Set((posts ?? []).map((p) => p.cluster).filter((c): c is string => Boolean(c)))),
    [posts],
  );
  const visible = (posts ?? []).filter((p) => !cluster || p.cluster === cluster);

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar />

      <section className="px-2 md:px-4 pt-20">
        <div className="bg-[#f4f4f5] rounded-[32px] px-8 py-14 md:px-16 md:py-20">
          <div className="text-xs uppercase tracking-[0.2em] text-foreground/50 mb-6">The Intentsly blog</div>
          <h1 className="text-4xl md:text-6xl font-medium leading-[1.05] tracking-tight text-foreground max-w-3xl">
            Find the buyers who are <span className="text-foreground/40">already looking.</span>
          </h1>
          <p className="text-base md:text-lg text-foreground/60 max-w-2xl leading-relaxed mt-6">
            Search queries, comparisons and templates for signal-based outbound on LinkedIn, Reddit and X, plus
            what we learn running Intentsly on ourselves.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-14 md:py-20">
        {clusters.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-10" role="group" aria-label="Filter articles by topic">
            {[null, ...clusters].map((c) => (
              <button
                key={c ?? "all"}
                type="button"
                onClick={() => setCluster(c)}
                aria-pressed={cluster === c}
                className={`px-4 py-2 rounded-full text-sm transition-colors ${
                  cluster === c
                    ? "bg-[#1A1A2E] text-white"
                    : "bg-[#f4f4f5] text-foreground/70 hover:text-foreground"
                }`}
              >
                {c ? clusterLabel(c) : "All"}
              </button>
            ))}
          </div>
        )}

        {isLoading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-[#f9f9fa] rounded-[24px] h-56 animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && visible.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {visible.map((post) => (
              <Link
                key={post.slug}
                to={`/blog/${post.slug}`}
                className="group bg-[#f9f9fa] rounded-[24px] p-7 md:p-8 flex flex-col justify-between min-h-[240px] transition-colors hover:bg-[#f4f4f5]"
              >
                <div>
                  <div className="text-xs uppercase tracking-wider text-foreground/50 mb-4">
                    {clusterLabel(post.cluster)}
                  </div>
                  <h2 className="text-xl md:text-2xl font-medium tracking-tight leading-snug text-foreground mb-3">
                    {post.title}
                  </h2>
                  <p className="text-sm text-foreground/60 leading-relaxed line-clamp-3">{post.excerpt}</p>
                </div>
                <div className="flex items-center justify-between mt-6 text-xs text-foreground/50">
                  <span>
                    {formatDate(post.published_at)}
                    {post.reading_minutes ? ` · ${post.reading_minutes} min read` : ""}
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </Link>
            ))}
          </div>
        )}

        {!isLoading && visible.length === 0 && (
          <div className="bg-[#f9f9fa] rounded-[24px] p-10 md:p-14 max-w-2xl">
            <h2 className="text-2xl font-medium tracking-tight text-foreground mb-3">
              {isError ? "Articles could not be loaded." : "The first articles are being written."}
            </h2>
            <p className="text-foreground/60 leading-relaxed mb-6">
              {isError
                ? "Refresh the page to try again."
                : "Until they land, the Buying Signal Playbook covers the signals worth chasing on LinkedIn, Reddit and X."}
            </p>
            {!isError && (
              <a href="/signal-playbook" className="btn-cta">
                Get the playbook
                <ArrowUpRight className="w-4 h-4" />
              </a>
            )}
          </div>
        )}
      </section>

      <CTASection />
      <Footer />
    </div>
  );
};

export default Blog;

import { Children, isValidElement, useEffect, useMemo, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import { CTASection, Footer } from "@/components/CTAFooter";
import { applySeo } from "@/lib/seo";
import {
  SITE_URL,
  buildPostJsonLd,
  clusterLabel,
  extractHeadings,
  formatDate,
  headingId,
  useBlogPost,
  useBlogPosts,
} from "@/lib/blog";

const textOf = (node: ReactNode): string =>
  Children.toArray(node)
    .map((c) => (typeof c === "string" || typeof c === "number" ? String(c) : isValidElement(c) ? textOf(c.props.children) : ""))
    .join("");

const markdownComponents: Components = {
  h2: ({ children }) => (
    <h2
      id={headingId(textOf(children))}
      className="scroll-mt-28 text-2xl md:text-3xl font-medium tracking-tight leading-tight text-foreground mt-14 mb-5"
    >
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3
      id={headingId(textOf(children))}
      className="scroll-mt-28 text-xl font-medium tracking-tight text-foreground mt-9 mb-3"
    >
      {children}
    </h3>
  ),
  p: ({ children }) => <p className="text-[17px] text-foreground/75 leading-[1.75] mb-5">{children}</p>,
  ul: ({ children }) => (
    <ul className="list-disc pl-6 mb-6 space-y-2 text-[17px] text-foreground/75 leading-[1.7] marker:text-foreground/30">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-6 mb-6 space-y-2 text-[17px] text-foreground/75 leading-[1.7] marker:text-foreground/40">
      {children}
    </ol>
  ),
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  a: ({ href = "", children }) => {
    const className = "text-[#4F46E5] underline underline-offset-2 decoration-[#4F46E5]/30 hover:decoration-[#4F46E5]";
    if (href.startsWith("/")) return <Link to={href} className={className}>{children}</Link>;
    if (href.startsWith("#")) return <a href={href} className={className}>{children}</a>;
    return <a href={href} target="_blank" rel="noopener noreferrer" className={className}>{children}</a>;
  },
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-foreground/20 pl-5 my-6 [&>p]:text-foreground/60">{children}</blockquote>
  ),
  pre: ({ children }) => (
    <pre className="bg-[#1A1A2E] text-white/90 rounded-2xl p-5 mb-6 overflow-x-auto text-sm leading-relaxed [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-inherit">
      {children}
    </pre>
  ),
  code: ({ children }) => (
    <code className="bg-[#f4f4f5] text-foreground rounded-md px-1.5 py-0.5 text-[0.9em] font-mono break-words">{children}</code>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto mb-6 rounded-2xl border border-border">
      <table className="w-full text-sm text-left">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-[#f9f9fa] text-foreground">{children}</thead>,
  th: ({ children }) => <th className="px-4 py-3 font-medium align-top">{children}</th>,
  td: ({ children }) => <td className="px-4 py-3 border-t border-border text-foreground/75 align-top">{children}</td>,
  hr: () => <hr className="my-10 border-border" />,
};

const Shell = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen bg-background font-sans">
    <Navbar />
    {children}
    <Footer />
  </div>
);

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading, isError } = useBlogPost(slug);
  const { data: allPosts } = useBlogPosts();

  const headings = useMemo(() => (post ? extractHeadings(post.content_md) : []), [post]);
  const related = useMemo(() => {
    if (!post || !allPosts) return [];
    const others = allPosts.filter((p) => p.slug !== post.slug);
    const same = others.filter((p) => p.cluster === post.cluster);
    return [...same, ...others.filter((p) => p.cluster !== post.cluster)].slice(0, 3);
  }, [post, allPosts]);

  useEffect(() => {
    if (post) {
      return applySeo({
        title: `${post.meta_title} | Intentsly`,
        description: post.meta_description,
        url: `${SITE_URL}/blog/${post.slug}`,
        type: "article",
        image: post.cover_image_url ?? undefined,
        jsonLd: buildPostJsonLd(post),
      });
    }
    if (!isLoading) {
      return applySeo({
        title: "Article not found | Intentsly",
        description: "This article does not exist or is no longer published.",
        url: `${SITE_URL}/blog`,
        noindex: true,
      });
    }
  }, [post, isLoading]);

  if (isLoading) {
    return (
      <Shell>
        <div className="max-w-3xl mx-auto px-6 pt-36 pb-32" aria-busy="true">
          <div className="h-4 w-32 bg-[#f4f4f5] rounded-full animate-pulse mb-8" />
          <div className="h-12 bg-[#f4f4f5] rounded-2xl animate-pulse mb-4" />
          <div className="h-12 w-2/3 bg-[#f4f4f5] rounded-2xl animate-pulse mb-12" />
          <div className="space-y-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-4 bg-[#f4f4f5] rounded-full animate-pulse" />
            ))}
          </div>
        </div>
      </Shell>
    );
  }

  if (!post) {
    return (
      <Shell>
        <div className="max-w-3xl mx-auto px-6 pt-36 pb-32">
          <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-foreground mb-4">
            {isError ? "This article could not be loaded." : "Article not found."}
          </h1>
          <p className="text-lg text-foreground/60 mb-8">
            {isError ? "Refresh the page to try again." : "It may have been moved or unpublished."}
          </p>
          <Link to="/blog" className="btn-cta">
            <ArrowLeft className="w-4 h-4" />
            All articles
          </Link>
        </div>
      </Shell>
    );
  }

  const updated = post.published_at && post.updated_at.slice(0, 10) > post.published_at.slice(0, 10);

  return (
    <Shell>
      <article>
        <header className="px-2 md:px-4 pt-20">
          <div className="bg-[#f4f4f5] rounded-[32px] px-8 py-12 md:px-16 md:py-16">
            <div className="max-w-3xl mx-auto">
              <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-foreground/50 mb-8">
                <Link to="/blog" className="inline-flex items-center gap-1.5 hover:text-foreground">
                  <ArrowLeft className="w-4 h-4" />
                  Blog
                </Link>
                <span aria-hidden="true">/</span>
                <span>{clusterLabel(post.cluster)}</span>
              </nav>
              <h1 className="text-3xl md:text-5xl font-medium leading-[1.1] tracking-tight text-foreground mb-6">
                {post.title}
              </h1>
              <p className="text-base md:text-lg text-foreground/60 leading-relaxed mb-8">{post.excerpt}</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-foreground/50">
                {post.author_name && (
                  <span className="text-foreground/80">
                    {post.author_name}
                    {post.author_title ? `, ${post.author_title}` : ""}
                  </span>
                )}
                {post.published_at && <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>}
                {updated && <span>Updated {formatDate(post.updated_at)}</span>}
                {post.reading_minutes ? <span>{post.reading_minutes} min read</span> : null}
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-3xl mx-auto px-6 py-12 md:py-16">
          {headings.length >= 5 && (
            <nav aria-label="In this article" className="bg-[#f9f9fa] rounded-[24px] p-6 md:p-8 mb-12">
              <div className="text-xs uppercase tracking-wider text-foreground/50 font-medium mb-4">In this article</div>
              <ol className="space-y-2">
                {headings.map((h) => (
                  <li key={h.id}>
                    <a href={`#${h.id}`} className="text-sm text-foreground/70 hover:text-foreground">
                      {h.text}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          )}

          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {post.content_md}
          </ReactMarkdown>
        </div>
      </article>

      {related.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 pb-20" aria-labelledby="related-heading">
          <h2 id="related-heading" className="text-xs uppercase tracking-[0.2em] text-foreground/50 mb-6">
            Keep reading
          </h2>
          <div className="grid md:grid-cols-3 gap-3 md:gap-4">
            {related.map((r) => (
              <Link
                key={r.slug}
                to={`/blog/${r.slug}`}
                className="group bg-[#f9f9fa] rounded-[24px] p-7 flex flex-col justify-between min-h-[180px] transition-colors hover:bg-[#f4f4f5]"
              >
                <div>
                  <div className="text-xs uppercase tracking-wider text-foreground/50 mb-3">{clusterLabel(r.cluster)}</div>
                  <h3 className="text-lg font-medium tracking-tight leading-snug text-foreground">{r.title}</h3>
                </div>
                <ArrowUpRight className="w-4 h-4 text-foreground/40 mt-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            ))}
          </div>
        </section>
      )}

      <CTASection />
    </Shell>
  );
};

export default BlogPost;

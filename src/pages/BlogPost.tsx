import { Children, isValidElement, useEffect, useMemo, useRef, type ReactElement, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/CTAFooter";
import { GuideInlineCard, TryAiEndCta, TryAiStickyBar } from "@/components/content/ContentFunnel";
import {
  ArticleImage,
  AuthorBox,
  Callout,
  CodeBlock,
  FaqAccordion,
  MessageCard,
  ReadingProgress,
  StatsStrip,
  TocCollapsible,
  TocRail,
  type TocItem,
} from "@/components/content/ArticleParts";
import { GUIDE_SLOT, guideForContent, rehypeGuideSlot, tryAiHref } from "@/lib/contentFunnel";
import { CALLOUT_TYPES, parseStats, rehypeArticle, remarkArticle, splitFaq, type CalloutType } from "@/lib/articleMarkdown";
import { applySeo } from "@/lib/seo";
import { track } from "@/lib/analytics";
import {
  SECTIONS,
  SITE_URL,
  buildPostJsonLd,
  clusterLabel,
  extractHeadings,
  formatDate,
  headingId,
  postPath,
  postUrl,
  useBlogPost,
  useBlogPosts,
  type Section,
} from "@/lib/blog";
import "@/styles/article.css";

const FAQ_ID = "faq";

const textOf = (node: ReactNode): string =>
  Children.toArray(node)
    .map((c) => (typeof c === "string" || typeof c === "number" ? String(c) : isValidElement(c) ? textOf(c.props.children) : ""))
    .join("");

const isCallout = (v: unknown): v is CalloutType => typeof v === "string" && (CALLOUT_TYPES as readonly string[]).includes(v);

/** Element renderers shared by the article body and the FAQ answers. Typography lives in src/styles/article.css. */
const baseComponents: Components = {
  h2: ({ children }) => <h2 id={headingId(textOf(children))}>{children}</h2>,
  h3: ({ children }) => <h3 id={headingId(textOf(children))}>{children}</h3>,
  a: ({ href = "", children }) => {
    if (href.startsWith("/")) return <Link to={href}>{children}</Link>;
    if (href.startsWith("#")) return <a href={href}>{children}</a>;
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  },
  img: ({ src, alt, title }) => <ArticleImage src={src} alt={alt} title={title} />,
  pre: ({ children }) => {
    const child = Children.toArray(children)[0] as ReactElement<{ className?: string; children?: ReactNode }> | undefined;
    const className = child && isValidElement(child) ? child.props.className ?? "" : "";
    const code = child && isValidElement(child) ? textOf(child.props.children).replace(/\n$/, "") : "";
    if (/\blanguage-message\b/.test(className)) return <MessageCard text={code} />;
    if (/\blanguage-stats\b/.test(className)) return <StatsStrip stats={parseStats(code)} />;
    return <CodeBlock code={code} className={className || undefined} />;
  },
};

const Shell = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen bg-white font-sans">
    <Navbar />
    {children}
    <Footer />
  </div>
);

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

/** One content page. `section` is the route's section; a slug published in another section 404s here. */
const BlogPost = ({ section = "blog" }: { section?: Section }) => {
  const { slug } = useParams<{ slug: string }>();
  const meta = SECTIONS[section];
  const { data: found, isLoading, isError } = useBlogPost(slug);
  const post = found && (found.section ?? "blog") === section ? found : null;
  const { data: allPosts } = useBlogPosts();

  // "## FAQ" moves out of the body into the accordion at the end.
  const { body, faq } = useMemo(() => (post ? splitFaq(post.content_md) : { body: "", faq: [] }), [post]);
  const toc = useMemo<TocItem[]>(() => {
    const items: TocItem[] = extractHeadings(body);
    if (faq.length) items.push({ id: FAQ_ID, text: "FAQ" });
    return items;
  }, [body, faq.length]);

  const articleRef = useRef<HTMLDivElement>(null);
  const path = post ? postPath(post) : "";
  const guide = useMemo(() => guideForContent(path, post?.primary_keyword), [path, post?.primary_keyword]);

  const components = useMemo<Components>(
    () => ({
      ...baseComponents,
      // The guide card replaces the marker rehypeGuideSlot puts before the second H2;
      // callouts come from remarkArticle.
      aside: ({ node, children, ...props }) => {
        const p = node?.properties ?? {};
        if (p.dataSlot === GUIDE_SLOT) return <GuideInlineCard guide={guide} path={path} className="min-[1200px]:hidden" />;
        if (isCallout(p.dataCallout)) return <Callout type={p.dataCallout}>{children}</Callout>;
        return <aside {...props}>{children}</aside>;
      },
    }),
    [guide, path],
  );

  useEffect(() => {
    if (path) track("content_view", { path });
  }, [path]);

  const related = useMemo(() => {
    if (!post || !allPosts) return [];
    const others = allPosts.filter((p) => p.slug !== post.slug);
    const score = (p: (typeof others)[number]) =>
      (p.section === post.section ? 2 : 0) + (p.cluster === post.cluster ? 1 : 0);
    return [...others].sort((a, b) => score(b) - score(a)).slice(0, 3);
  }, [post, allPosts]);

  useEffect(() => {
    if (post) {
      return applySeo({
        title: `${post.meta_title} | Intentsly`,
        description: post.meta_description,
        url: postUrl(post),
        type: "article",
        image: post.cover_image_url ?? undefined,
        jsonLd: buildPostJsonLd(post),
      });
    }
    if (!isLoading) {
      return applySeo({
        title: `${meta.notFound} | Intentsly`,
        description: "This page does not exist or is no longer published.",
        url: `${SITE_URL}${meta.path}`,
        noindex: true,
      });
    }
  }, [post, isLoading, meta]);

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
          <h1 className="text-4xl md:text-5xl font-semibold tracking-[-0.03em] text-foreground mb-4">
            {isError ? "This page could not be loaded." : meta.notFound}
          </h1>
          <p className="text-lg text-foreground/60 mb-8">
            {isError ? "Refresh the page to try again." : "It may have been moved or unpublished."}
          </p>
          <Link to={meta.path} className="btn-cta">
            <ArrowLeft className="w-4 h-4" />
            All {meta.label.toLowerCase()} pages
          </Link>
        </div>
      </Shell>
    );
  }

  const updated = post.published_at && post.updated_at.slice(0, 10) > post.published_at.slice(0, 10);
  const cover = post.cover_image_url;
  const renderMd = (md: string) => (
    <ReactMarkdown remarkPlugins={[remarkGfm, remarkArticle]} rehypePlugins={[rehypeArticle]} components={baseComponents}>
      {md}
    </ReactMarkdown>
  );

  return (
    <Shell>
      <ReadingProgress />
      <article>
        <header className="px-2 md:px-4 pt-20">
          <div className="bg-[#f4f4f5] rounded-[28px] md:rounded-[32px] px-5 py-10 md:px-14 md:py-14">
            <div className={`mx-auto ${cover ? "max-w-[1180px] lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-center lg:gap-12" : "max-w-4xl"}`}>
              <div>
                <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-sm">
                  <Link
                    to={meta.path}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[12px] font-medium uppercase tracking-wide text-[#0a0a0a] shadow-[0_1px_2px_rgba(16,24,40,0.06)] hover:text-[#1A8FE3]"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    {meta.label}
                  </Link>
                  <span className="text-[13px] text-[#5B6372]">{clusterLabel(post.cluster)}</span>
                </nav>
                <h1 className="mb-5 text-[32px] font-bold leading-[1.1] tracking-[-0.03em] text-[#0a0a0a] [text-wrap:balance] md:text-[48px]">
                  {post.title}
                </h1>
                <p className="mb-7 text-[18px] leading-relaxed text-[#1D212B]/70 md:text-[20px]">{post.excerpt}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[14px] text-[#5B6372]">
                  {post.author_name && (
                    <span className="inline-flex items-center gap-2.5 text-[#1D212B]">
                      <span
                        aria-hidden="true"
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0a0a0a] text-[12px] font-semibold text-[#C8FF00]"
                      >
                        {initialsOf(post.author_name)}
                      </span>
                      <span>
                        <span className="font-medium">{post.author_name}</span>
                        {post.author_title ? <span className="text-[#5B6372]">, {post.author_title}</span> : null}
                      </span>
                    </span>
                  )}
                  {post.published_at && (
                    <>
                      <span aria-hidden="true">·</span>
                      <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>
                    </>
                  )}
                  {updated && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>Updated {formatDate(post.updated_at)}</span>
                    </>
                  )}
                  {post.reading_minutes ? (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>{post.reading_minutes} min read</span>
                    </>
                  ) : null}
                </div>
              </div>
              {cover && (
                <img
                  src={cover}
                  alt=""
                  width={1200}
                  height={630}
                  {...{ fetchpriority: "high" }}
                  decoding="async"
                  className="mt-8 w-full h-auto rounded-2xl border border-white shadow-[0_20px_50px_-25px_rgba(16,24,40,0.35)] lg:mt-0"
                />
              )}
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1240px] px-5 py-10 md:px-8 md:py-14 min-[1200px]:grid min-[1200px]:grid-cols-[220px_minmax(0,1fr)_260px] min-[1200px]:gap-12">
          <div className="hidden min-[1200px]:block">
            <TocRail items={toc} />
          </div>

          <div className="mx-auto w-full min-w-0 max-w-[68ch] text-[17px] md:text-[18px]">
            <div className="min-[1200px]:hidden">
              <TocCollapsible items={toc} />
            </div>

            <div ref={articleRef} className="article-body">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkArticle]}
                rehypePlugins={[rehypeGuideSlot, rehypeArticle]}
                components={components}
              >
                {body}
              </ReactMarkdown>
            </div>

            <FaqAccordion id={FAQ_ID} items={faq} render={renderMd} />
            {post.author_name && <AuthorBox name={post.author_name} title={post.author_title} />}
          </div>

          <div className="hidden min-[1200px]:block">
            <div className="sticky top-28 space-y-3">
              <GuideInlineCard guide={guide} path={path} variant="rail" />
              <Link
                to={tryAiHref(post.slug)}
                onClick={() => track("tryai_click", { path, from: "rail" })}
                className="inline-flex items-center gap-1 px-1 text-[14px] font-medium text-[#1172C0] hover:underline"
              >
                Try Intentsly on your website
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section className="mx-auto max-w-[1240px] px-5 pb-6 md:px-8" aria-labelledby="related-heading">
          <h2 id="related-heading" className="mb-6 text-[22px] font-semibold tracking-[-0.02em] text-[#0a0a0a] md:text-[26px]">
            Keep reading
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {related.map((r) => (
              <Link
                key={r.slug}
                to={postPath(r)}
                className="group flex flex-col overflow-hidden rounded-2xl border border-[#E6E8EC] bg-white transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-20px_rgba(16,24,40,0.25)]"
              >
                {r.cover_image_url ? (
                  <img
                    src={r.cover_image_url}
                    alt=""
                    width={1200}
                    height={630}
                    loading="lazy"
                    decoding="async"
                    className="aspect-[1200/630] w-full object-cover"
                  />
                ) : (
                  <div
                    aria-hidden="true"
                    className="flex aspect-[1200/630] items-end bg-gradient-to-br from-[#EDFFC2] via-[#CFF3EB] to-[#BFDDF7] p-4"
                  >
                    <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-[#0a0a0a]">
                      {SECTIONS[r.section ?? "blog"].label}
                    </span>
                  </div>
                )}
                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-2 text-[12px] font-medium uppercase tracking-wide text-[#5B6372]">{clusterLabel(r.cluster)}</div>
                  <h3 className="text-[17px] font-semibold leading-snug tracking-[-0.01em] text-[#0a0a0a]">{r.title}</h3>
                  <ArrowUpRight className="mt-4 h-4 w-4 text-[#5B6372] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="mx-auto max-w-[1240px] px-5 pb-20 md:px-8">
        <div className="mx-auto max-w-3xl">
          <TryAiEndCta slug={post.slug} path={path} />
        </div>
      </div>

      <TryAiStickyBar slug={post.slug} path={path} articleRef={articleRef} />
    </Shell>
  );
};

export default BlogPost;

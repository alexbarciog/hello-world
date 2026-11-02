import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { clusterLabel, postPath, type BlogPostSummary } from "@/lib/blog";
import { isTrigifyPage, matchingSolution, relatedPosts } from "@/lib/relatedLinks";
import { TRIGIFY_PILLAR } from "@/lib/seoPolicy";

/** Every Trigify post points at the one page that should rank for "trigify alternatives". */
export function TrigifyPillarNote({ post }: { post: BlogPostSummary }) {
  if (!isTrigifyPage(post) || postPath(post) === TRIGIFY_PILLAR) return null;
  return (
    <p className="bg-[#f9f9fa] rounded-[20px] px-6 py-5 mb-10 text-[15px] text-foreground/70 leading-relaxed">
      Comparing every option? Our full guide to{" "}
      <Link to={TRIGIFY_PILLAR} className="text-[#4F46E5] underline underline-offset-2 decoration-[#4F46E5]/30 hover:decoration-[#4F46E5]">
        Trigify alternatives
      </Link>{" "}
      sorts them by the job you need done.
    </p>
  );
}

const Card = ({ to, eyebrow, title }: { to: string; eyebrow: string; title: string }) => (
  <Link
    to={to}
    className="group bg-[#f9f9fa] rounded-[24px] p-7 flex flex-col justify-between min-h-[180px] transition-colors hover:bg-[#f4f4f5]"
  >
    <div>
      <div className="text-xs uppercase tracking-wider text-foreground/50 mb-3">{eyebrow}</div>
      <h3 className="text-lg font-medium tracking-tight leading-snug text-foreground">{title}</h3>
    </div>
    <ArrowUpRight className="w-4 h-4 text-foreground/40 mt-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
  </Link>
);

export function RelatedLinks({ post, posts }: { post: BlogPostSummary; posts: BlogPostSummary[] }) {
  const { related, solution } = useMemo(() => {
    const match = matchingSolution(post, posts);
    return { solution: match, related: relatedPosts(post, posts, match ? [match.slug] : []) };
  }, [post, posts]);
  if (related.length === 0) return null;
  return (
    <section className="max-w-6xl mx-auto px-6 pb-20" aria-labelledby="related-heading">
      <h2 id="related-heading" className="text-xs uppercase tracking-[0.2em] text-foreground/50 mb-6">
        Related
      </h2>
      <div className="grid md:grid-cols-3 gap-3 md:gap-4">
        {related.map((r) => (
          <Card key={r.slug} to={postPath(r)} eyebrow={clusterLabel(r.cluster)} title={r.title} />
        ))}
        {solution ? (
          <Card to={postPath(solution)} eyebrow="For your business" title={solution.title} />
        ) : (
          <Card to="/solutions" eyebrow="Solutions" title="Find customers for every kind of B2B business" />
        )}
      </div>
    </section>
  );
}

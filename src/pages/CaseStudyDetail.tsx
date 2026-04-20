import { useEffect } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowUpRight, ArrowLeft, Calendar, Sparkles, Target, Zap, TrendingUp, Quote, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { CTASection, Footer } from "@/components/CTAFooter";
import heroSkyBg from "@/assets/hero-sky-bg.webp";
import { ttqViewContent } from "@/lib/tiktok-pixel";
import { caseStudies, getCaseStudyBySlug } from "@/data/caseStudies";

const setOrCreateMeta = (selector: string, value: string) => {
  let el = document.head.querySelector(selector) as HTMLElement | null;
  if (!el) {
    if (selector.startsWith("link")) {
      const link = document.createElement("link");
      link.rel = "canonical";
      el = link;
    } else if (selector.includes("script")) {
      const s = document.createElement("script");
      s.type = "application/ld+json";
      s.id = "case-study-jsonld";
      el = s;
    } else {
      const meta = document.createElement("meta");
      const m = selector.match(/\[(name|property)="([^"]+)"\]/);
      if (m) meta.setAttribute(m[1], m[2]);
      el = meta;
    }
    document.head.appendChild(el);
  }
  if (selector.startsWith("link")) (el as HTMLLinkElement).href = value;
  else if (selector.includes("script")) (el as HTMLScriptElement).textContent = value;
  else (el as HTMLMetaElement).content = value;
};

const CaseStudyDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const study = slug ? getCaseStudyBySlug(slug) : undefined;

  useEffect(() => {
    if (!study) return;

    ttqViewContent(`Case Study: ${study.company}`, `case-study-${study.slug}`);

    document.title = study.metaTitle;

    const url = `${window.location.origin}/case-studies/${study.slug}`;

    setOrCreateMeta('meta[name="description"]', study.metaDescription);
    setOrCreateMeta('meta[property="og:title"]', study.metaTitle);
    setOrCreateMeta('meta[property="og:description"]', study.metaDescription);
    setOrCreateMeta('meta[property="og:type"]', "article");
    setOrCreateMeta('meta[property="og:url"]', url);
    setOrCreateMeta('meta[name="twitter:card"]', "summary_large_image");
    setOrCreateMeta('meta[name="twitter:title"]', study.metaTitle);
    setOrCreateMeta('meta[name="twitter:description"]', study.metaDescription);
    setOrCreateMeta('link[rel="canonical"]', url);

    // JSON-LD Article schema
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: study.headline,
      description: study.metaDescription,
      datePublished: study.publishedAt,
      author: { "@type": "Organization", name: "Intentsly", url: "https://intentsly.com" },
      publisher: {
        "@type": "Organization",
        name: "Intentsly",
        logo: { "@type": "ImageObject", url: `${window.location.origin}/favicon.ico` },
      },
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
      about: { "@type": "Organization", name: study.company, url: study.website },
    };
    setOrCreateMeta('script#case-study-jsonld', JSON.stringify(jsonLd));

    return () => {
      const ld = document.getElementById("case-study-jsonld");
      if (ld) ld.remove();
    };
  }, [study]);

  if (!study) {
    return <Navigate to="/case-studies" replace />;
  }

  const isLightHero = study.bgClass === "bg-[#C8FF00]";
  const otherStudies = caseStudies.filter((c) => c.slug !== study.slug);

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar />

      {/* HERO */}
      <section className="px-2 md:px-4 pt-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 md:gap-4 min-h-[calc(100vh-6rem)]">
          {/* Left: copy */}
          <div className="bg-[#f4f4f5] rounded-[32px] p-8 md:p-16 flex flex-col justify-center">
            <Link
              to="/case-studies"
              className="inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground mb-8 w-fit"
            >
              <ArrowLeft className="w-4 h-4" />
              All case studies
            </Link>

            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-white border border-border/60 flex items-center justify-center overflow-hidden">
                {study.logo ? (
                  <img src={study.logo} alt={`${study.company} logo`} className="w-9 h-9 object-contain" />
                ) : (
                  <span className={`text-sm font-semibold ${study.accentText}`}>
                    {study.company.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">{study.company}</div>
                <div className="text-xs text-foreground/50">{study.industry}</div>
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-medium leading-[1.05] tracking-tight text-foreground mb-6">
              {study.headline}
            </h1>

            <p className="text-base md:text-lg text-foreground/60 max-w-xl leading-relaxed mb-10">
              {study.subheadline}
            </p>

            <div className="flex flex-wrap gap-3">
              <a href="/register" className="btn-cta">
                Get Started
                <ArrowUpRight className="w-4 h-4" />
              </a>
              <a
                href={study.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground/70 hover:text-foreground px-4 py-2.5"
              >
                Visit {study.domain}
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Right: result visual */}
          <div className={`relative rounded-[32px] overflow-hidden ${study.bgClass} min-h-[500px] flex items-center justify-center p-10`}>
            <img src={heroSkyBg} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover opacity-20" />
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)",
              backgroundSize: "24px 24px"
            }} />
            <div className="relative text-center">
              <div className={`text-[10rem] md:text-[14rem] leading-none font-medium ${isLightHero ? "text-[#1A1A2E]" : "text-white"}`}>
                {study.result}
              </div>
              <div className={`text-base uppercase tracking-wider mt-3 ${isLightHero ? "text-[#1A1A2E]/70" : "text-white/70"}`}>
                {study.resultLabel}
              </div>
              <div className={`mt-8 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm ${isLightHero ? "bg-[#1A1A2E]/10 text-[#1A1A2E]" : "bg-white/10 text-white border border-white/20"}`}>
                <Calendar className="w-4 h-4" />
                in {study.timeframe}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AT A GLANCE */}
      <section className="max-w-6xl mx-auto px-6 py-24 md:py-28">
        <div className="text-xs uppercase tracking-[0.2em] text-foreground/50 mb-6">At a glance</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-4 border-t border-border pt-10">
          {study.results.map((r) => (
            <div key={r.label}>
              <div className="text-3xl md:text-4xl font-medium tracking-tight text-foreground">{r.value}</div>
              <div className="text-sm text-foreground/50 mt-2">{r.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CONTEXT */}
      <section className="max-w-3xl mx-auto px-6 pb-16">
        <div className="text-xs uppercase tracking-[0.2em] text-foreground/50 mb-6">The context</div>
        <h2 className="text-3xl md:text-5xl font-medium tracking-tight leading-[1.1] text-foreground mb-10">
          Where {study.company} started.
        </h2>
        <div className="space-y-5">
          {study.context.map((p, i) => (
            <p key={i} className="text-lg text-foreground/70 leading-relaxed">
              {p}
            </p>
          ))}
        </div>
      </section>

      {/* APPROACH */}
      <section className="max-w-6xl mx-auto px-6 py-16 md:py-24">
        <div className="text-xs uppercase tracking-[0.2em] text-foreground/50 mb-6">What we did</div>
        <h2 className="text-3xl md:text-5xl font-medium tracking-tight leading-[1.1] text-foreground mb-12 max-w-3xl">
          The play, broken down.
        </h2>
        <div className="grid md:grid-cols-3 gap-3 md:gap-4">
          {study.approach.map((step, i) => (
            <div key={i} className="bg-[#f9f9fa] rounded-[24px] p-6 md:p-8">
              <div className="w-9 h-9 rounded-full bg-white border border-border/60 flex items-center justify-center text-sm font-medium text-foreground/60 mb-5">
                {i + 1}
              </div>
              <h3 className="text-xl font-medium text-foreground mb-3 leading-snug">{step.title}</h3>
              <p className="text-sm text-foreground/60 leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* QUOTE */}
      {study.quote && (
        <section className="px-2 md:px-4 pb-16 md:pb-24">
          <div className={`relative rounded-[32px] overflow-hidden ${study.bgClass} p-10 md:p-20`}>
            <div className="absolute inset-0 opacity-15" style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)",
              backgroundSize: "24px 24px"
            }} />
            <div className="relative max-w-3xl mx-auto text-center">
              <Quote className={`w-10 h-10 mx-auto mb-6 ${isLightHero ? "text-[#1A1A2E]/40" : "text-white/40"}`} />
              <blockquote className={`text-2xl md:text-4xl font-medium leading-[1.2] tracking-tight mb-8 ${isLightHero ? "text-[#1A1A2E]" : "text-white"}`}>
                "{study.quote.text}"
              </blockquote>
              <div className={`text-sm ${isLightHero ? "text-[#1A1A2E]/70" : "text-white/70"}`}>
                <span className="font-medium">{study.quote.author}</span> · {study.quote.role}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* OUTCOME / TAKEAWAYS */}
      <section className="max-w-6xl mx-auto px-6 pb-24 md:pb-32">
        <div className="grid md:grid-cols-2 gap-3 md:gap-4">
          <div className="bg-[#f9f9fa] rounded-[24px] p-8 md:p-10">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="w-4 h-4 text-foreground/50" />
              <span className="text-xs uppercase tracking-wider text-foreground/50 font-medium">Outcome</span>
            </div>
            <p className="text-lg text-foreground/80 leading-relaxed">{study.outcome}</p>
          </div>
          <div className="bg-[#f9f9fa] rounded-[24px] p-8 md:p-10">
            <div className="flex items-center gap-2 mb-5">
              <Sparkles className="w-4 h-4 text-foreground/50" />
              <span className="text-xs uppercase tracking-wider text-foreground/50 font-medium">Key takeaways</span>
            </div>
            <ul className="space-y-3">
              {study.takeaways.map((t, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-foreground/80 leading-relaxed">
                  <CheckCircle2 className="w-4 h-4 text-foreground/40 mt-0.5 flex-shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* RELATED CASE STUDIES */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="text-xs uppercase tracking-[0.2em] text-foreground/50 mb-6">More case studies</div>
        <div className="grid md:grid-cols-2 gap-3 md:gap-4">
          {otherStudies.map((other) => (
            <Link
              key={other.slug}
              to={`/case-studies/${other.slug}`}
              className={`relative rounded-[24px] overflow-hidden ${other.bgClass} p-8 md:p-10 group transition-transform hover:scale-[1.005] min-h-[220px] flex flex-col justify-between`}
            >
              <div className="absolute inset-0 opacity-15" style={{
                backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)",
                backgroundSize: "24px 24px"
              }} />
              <div className="relative">
                <div className={`text-xs uppercase tracking-wider mb-3 ${other.bgClass === "bg-[#C8FF00]" ? "text-[#1A1A2E]/60" : "text-white/60"}`}>
                  {other.company} · {other.industry}
                </div>
                <h3 className={`text-2xl md:text-3xl font-medium tracking-tight leading-[1.15] ${other.bgClass === "bg-[#C8FF00]" ? "text-[#1A1A2E]" : "text-white"}`}>
                  {other.headline}
                </h3>
              </div>
              <div className={`relative inline-flex items-center gap-1.5 text-sm font-medium ${other.bgClass === "bg-[#C8FF00]" ? "text-[#1A1A2E]" : "text-white"}`}>
                Read the story
                <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <CTASection />
      <Footer />
    </div>
  );
};

export default CaseStudyDetail;

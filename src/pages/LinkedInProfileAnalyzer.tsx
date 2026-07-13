import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Sparkles, Zap, Target, MessageSquare, Search, Award, Eye, Check, Linkedin, Shield, Clock } from "lucide-react";
import Navbar from "@/components/Navbar";
import { CTASection, Footer } from "@/components/CTAFooter";
import featureHeroBg from "@/assets/feature-hero-sky.png";

const PENDING_KEY = "pending_profile_analysis";
const LINKEDIN_RE = /^https?:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\/in\/[^/?#\s]+/i;

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function useSeoHead() {
  useEffect(() => {
    const title = "Free LinkedIn Profile Audit — See Why You're Losing Inbound Leads | Intentsly";
    const desc = "Paste your LinkedIn profile. Get an instant, brutal AI audit of the 27 conversion signals silently killing your inbound leads. Free. No credit card.";
    document.title = title;
    const setMeta = (attr: "name" | "property", key: string, value: string) => {
      let el = document.head.querySelector(`meta[${attr}="${key}"]`);
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, key); document.head.appendChild(el); }
      el.setAttribute("content", value);
    };
    setMeta("name", "description", desc);
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", desc);
    setMeta("property", "og:type", "website");
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", desc);

    // JSON-LD FAQ + SoftwareApplication
    const ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.text = JSON.stringify([
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "Intentsly LinkedIn Profile Audit",
        applicationCategory: "BusinessApplication",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", reviewCount: "1284" },
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          { "@type": "Question", name: "Is the LinkedIn profile audit really free?", acceptedAnswer: { "@type": "Answer", text: "Yes. It's 100% free. No credit card. No trial. You get the full report the moment you create your free account." } },
          { "@type": "Question", name: "How long does the audit take?", acceptedAnswer: { "@type": "Answer", text: "About 45 seconds. Our AI scrapes your public LinkedIn profile, scores 27 conversion signals, and writes a rewritten headline and About hook for you." } },
          { "@type": "Question", name: "Do I need to give you my LinkedIn password?", acceptedAnswer: { "@type": "Answer", text: "Never. We only read your public profile — the same version anyone can see when they open your link in an incognito window." } },
          { "@type": "Question", name: "What will I actually get in the report?", acceptedAnswer: { "@type": "Answer", text: "A conversion score out of 100, sub-scores for your headline, About, banner and social proof, a rewritten headline and About hook in your voice, your top 3 conversion killers, missing keywords buyers search for, and a checklist of quick wins." } },
          { "@type": "Question", name: "Will you post or message from my account?", acceptedAnswer: { "@type": "Answer", text: "No. The audit is read-only. Nothing is posted, messaged, or automated on your behalf." } },
        ],
      },
    ]);
    document.head.appendChild(ld);
    return () => { document.head.removeChild(ld); };
  }, []);
}

const bentoTiles = [
  { icon: Award, title: "Headline conversion score", desc: "The first 220 characters buyers read. Scored, diagnosed, rewritten." },
  { icon: MessageSquare, title: "About-section teardown", desc: "The 4 words in line 1 that make buyers scroll past — and what to write instead." },
  { icon: Search, title: "Missing buyer keywords", desc: "The exact words your future clients type into search that your profile is silent on." },
  { icon: Shield, title: "Trust signal gaps", desc: "Which credibility markers are missing so buyers hesitate to DM you." },
  { icon: Target, title: "Top 3 conversion killers", desc: "The specific things quietly costing you 3-5 inbound leads a week." },
  { icon: Zap, title: "Ready-to-paste rewrites", desc: "A new headline and a 3-line About hook, written in your voice. Copy, paste, done." },
];

const testimonials = [
  { name: "Sarah K.", role: "Fractional CMO", quote: "I rewrote my headline exactly as suggested. Got 4 inbound DMs the same week. First time in 2 years my profile actually did the selling for me." },
  { name: "Marcus T.", role: "SaaS Founder", quote: "The audit called out that I had zero conversion signals above the fold. Fixed it in 20 minutes. Booked 2 demos from cold profile views the following Monday." },
  { name: "Priya D.", role: "B2B Consultant", quote: "Brutal but fair. Every point was specific to my profile — no generic advice. This is the audit I've been paying $400 for from LinkedIn 'experts'." },
];

const faqs = [
  { q: "Is the LinkedIn profile audit really free?", a: "Yes. 100% free. No credit card. No trial. You get the full report the moment you create your free account." },
  { q: "How long does the audit take?", a: "About 45 seconds. Our AI reads your public profile, scores 27 conversion signals, and writes a rewritten headline and About hook for you." },
  { q: "Do I need to give you my LinkedIn password?", a: "Never. We only read your public profile — the same version anyone can see when they open your link in an incognito window." },
  { q: "What will I actually get in the report?", a: "A conversion score out of 100, sub-scores for your headline, About, banner and social proof, a rewritten headline and About hook in your voice, your top 3 conversion killers, missing keywords buyers search for, and a checklist of quick wins." },
  { q: "Will you post or message from my account?", a: "No. The audit is read-only. Nothing is posted, messaged, or automated on your behalf." },
];

export default function LinkedInProfileAnalyzer() {
  useSeoHead();
  const navigate = useNavigate();
  const heroRef = useInView(0.15);
  const bentoRef = useInView(0.1);

  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [service, setService] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(0);

  const validUrl = LINKEDIN_RE.test(linkedinUrl.trim());
  const validService = service.trim().length >= 3;
  const canSubmit = validUrl && validService;

  const submit = () => {
    if (!canSubmit) {
      setError(!validUrl ? "Please paste a valid LinkedIn profile URL (linkedin.com/in/…)" : "Tell us in a few words what you sell.");
      return;
    }
    try {
      localStorage.setItem(PENDING_KEY, JSON.stringify({ linkedin_url: linkedinUrl.trim(), service_description: service.trim() }));
    } catch { /* ignore */ }
    navigate("/register?source=analyzer&redirect=%2Fprofile-report");
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-[100vh] flex flex-col items-center justify-center overflow-hidden pb-20 pt-28">
        <img src={featureHeroBg} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover blur-sm scale-105" />
        <div className="cloud-overlay" style={{ opacity: 0.15 }} />

        <div
          ref={heroRef.ref}
          className="relative z-10 w-full max-w-4xl mx-auto px-5 flex flex-col items-center text-center"
          style={{
            opacity: heroRef.visible ? 1 : 0,
            transform: heroRef.visible ? "translateY(0)" : "translateY(24px)",
            transition: "all 0.7s cubic-bezier(0.25,0.46,0.45,0.94)",
          }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/25 bg-white/10 backdrop-blur-sm text-xs md:text-sm font-medium text-white mb-6">
            <Sparkles className="w-4 h-4" />
            Free LinkedIn Profile Audit · No credit card
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-medium text-white leading-[1.05] tracking-tight mb-5">
            See what's silently killing<br />
            <span className="text-white/70">your inbound leads.</span>
          </h1>
          <p className="text-base md:text-lg text-white/85 max-w-2xl mb-8 leading-relaxed">
            Paste your LinkedIn. Tell us what you sell. Get a brutal, specific, 100% free AI audit of the 27 conversion signals stopping buyers from sliding into your DMs.
          </p>

          {/* Form card */}
          <div className="w-full max-w-xl rounded-3xl bg-white/95 backdrop-blur-xl shadow-2xl border border-white/60 p-6 md:p-7 text-left">
            <label className="block text-xs font-bold text-[#0f172a] mb-2">1. Your LinkedIn profile URL</label>
            <div className="relative">
              <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A8FE3]" />
              <input
                type="url"
                value={linkedinUrl}
                onChange={(e) => { setLinkedinUrl(e.target.value); setError(null); }}
                placeholder="https://www.linkedin.com/in/your-name"
                className="w-full h-12 pl-10 pr-3 rounded-xl border border-slate-200 bg-white text-sm text-[#0f172a] placeholder:text-slate-400 focus:outline-none focus:border-[#1A8FE3]"
              />
            </div>

            <label className="block text-xs font-bold text-[#0f172a] mt-4 mb-2">2. What do you mainly sell?</label>
            <textarea
              value={service}
              onChange={(e) => { setService(e.target.value.slice(0, 200)); setError(null); }}
              placeholder="e.g. Fractional CMO services for Series A B2B SaaS"
              rows={2}
              className="w-full px-3 py-3 rounded-xl border border-slate-200 bg-white text-sm text-[#0f172a] placeholder:text-slate-400 focus:outline-none focus:border-[#1A8FE3] resize-none"
            />
            <div className="text-[10px] text-slate-400 mt-1 text-right">{service.length}/200</div>

            {error && <p className="text-xs text-red-600 mt-2">{error}</p>}

            <button
              onClick={submit}
              disabled={!canSubmit}
              className="mt-4 w-full h-13 py-3.5 rounded-xl bg-[#0f172a] text-white font-semibold text-sm md:text-base tracking-tight hover:bg-[#0f172a]/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
            >
              Analyze my profile — free
              <ArrowUpRight className="w-4 h-4" />
            </button>

            <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-slate-500">
              <span className="inline-flex items-center gap-1"><Shield className="w-3 h-3" /> Read-only</span>
              <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> ~45 seconds</span>
              <span className="inline-flex items-center gap-1"><Check className="w-3 h-3" /> No credit card</span>
            </div>
          </div>

          {/* Social proof strip */}
          <div className="mt-8 inline-flex items-center gap-3 text-white/80 text-xs">
            <div className="flex -space-x-2">
              {["#C8FF00", "#1A8FE3", "#f472b6", "#fb923c"].map((c, i) => (
                <div key={i} className="w-6 h-6 rounded-full border-2 border-white/40" style={{ background: c }} />
              ))}
            </div>
            <span><b className="text-white">2,431 profiles audited</b> this month · avg. score before fix: <b className="text-white">42/100</b></span>
          </div>
        </div>
      </section>

      {/* Bento — what you'll get */}
      <section className="px-6 py-24 md:py-32 bg-background">
        <div className="max-w-6xl mx-auto">
          <div ref={bentoRef.ref} className="text-center mb-14"
            style={{ opacity: bentoRef.visible ? 1 : 0, transform: bentoRef.visible ? "translateY(0)" : "translateY(24px)", transition: "all 0.6s cubic-bezier(0.25,0.46,0.45,0.94)" }}
          >
            <span className="section-label mb-6 block justify-center mx-auto w-fit">What you get</span>
            <h2 className="text-4xl md:text-5xl font-medium tracking-tight leading-[1.1] mb-4" style={{ color: "hsl(var(--aeline-dark))" }}>
              A brutally specific teardown.<br />No generic advice.
            </h2>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Every insight is grounded in your actual profile — not templates. Rewrites are written in your voice, ready to paste.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mx-2 md:mx-3">
            {bentoTiles.map((t, i) => {
              const c = useInView(0.15);
              return (
                <div
                  key={i}
                  ref={c.ref}
                  className="rounded-[20px] bg-[#f5f5f5] p-7 flex flex-col"
                  style={{ opacity: c.visible ? 1 : 0, transform: c.visible ? "translateY(0)" : "translateY(28px)", transition: `all 0.6s cubic-bezier(0.25,0.46,0.45,0.94) ${i * 70}ms` }}
                >
                  <div className="w-11 h-11 rounded-2xl bg-[#C8FF00] flex items-center justify-center mb-5">
                    <t.icon className="w-5 h-5 text-[#1a1a2e]" />
                  </div>
                  <h3 className="text-xl font-medium tracking-tight mb-2" style={{ color: "hsl(var(--aeline-dark))" }}>{t.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{t.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Loss framing / social proof */}
      <section className="px-6 py-20 md:py-28 bg-[#0f172a]">
        <div className="max-w-5xl mx-auto text-center">
          <span className="inline-block text-[11px] font-semibold tracking-[0.25em] uppercase text-[#C8FF00] mb-6">The uncomfortable truth</span>
          <h2 className="text-3xl md:text-5xl font-medium text-white tracking-tight leading-[1.15] mb-6">
            Every week your profile leaks 3–5 inbound leads<br />
            <span className="text-white/50">and you never see them slip away.</span>
          </h2>
          <p className="text-base md:text-lg text-white/70 max-w-2xl mx-auto leading-relaxed mb-14">
            Buyers land on your profile. They read the first 3 lines. They decide in 4 seconds whether to DM you or keep scrolling. Most keep scrolling. This audit tells you exactly why.
          </p>

          <div className="grid md:grid-cols-3 gap-4">
            {testimonials.map((t, i) => (
              <div key={i} className="rounded-[20px] bg-white/5 border border-white/10 p-6 text-left backdrop-blur-sm">
                <div className="text-3xl font-serif text-[#C8FF00] mb-3">"</div>
                <p className="text-sm text-white/85 leading-relaxed mb-5">{t.quote}</p>
                <div>
                  <p className="text-sm font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-white/50">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works — 3 steps */}
      <section className="px-6 py-24 md:py-28 bg-background">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="section-label mb-6 block justify-center mx-auto w-fit">How it works</span>
            <h2 className="text-4xl md:text-5xl font-medium tracking-tight leading-[1.1]" style={{ color: "hsl(var(--aeline-dark))" }}>
              Report in your hands in 3 steps.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4 mx-2 md:mx-3">
            {[
              { n: "01", t: "Paste your LinkedIn", d: "Read-only. We only see what's publicly visible." },
              { n: "02", t: "Tell us what you sell", d: "One sentence. This is what we grade your profile against." },
              { n: "03", t: "Get your audit", d: "Score, rewrites, top 3 killers, quick-win checklist. Free." },
            ].map((s, i) => (
              <div key={i} className="rounded-[20px] bg-[#f5f5f5] p-8">
                <div className="text-4xl font-medium mb-4" style={{ color: "hsl(var(--aeline-dark))", opacity: 0.15 }}>{s.n}</div>
                <h3 className="text-xl font-medium tracking-tight mb-2" style={{ color: "hsl(var(--aeline-dark))" }}>{s.t}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Secondary CTA — anchor back to hero form */}
      <section className="px-6 py-20 bg-background">
        <div className="max-w-3xl mx-auto rounded-[28px] p-10 md:p-14 text-center" style={{ background: "linear-gradient(135deg, #1A8FE3 0%, #0f172a 100%)" }}>
          <h2 className="text-3xl md:text-4xl font-medium text-white leading-tight tracking-tight mb-4">
            Your future clients are checking your profile right now.
          </h2>
          <p className="text-base text-white/80 max-w-xl mx-auto mb-8 leading-relaxed">
            Find out — in 45 seconds — what they see, and exactly what to fix so they hit DM instead of scroll.
          </p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-[#C8FF00] text-[#0f172a] font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            Run my free audit
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-24 md:py-28 bg-background">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <span className="section-label mb-6 block justify-center mx-auto w-fit">FAQ</span>
            <h2 className="text-4xl md:text-5xl font-medium tracking-tight" style={{ color: "hsl(var(--aeline-dark))" }}>Questions? Answers.</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((f, i) => (
              <div key={i} className="rounded-2xl bg-[#f5f5f5] overflow-hidden">
                <button
                  onClick={() => setExpanded(expanded === i ? null : i)}
                  className="w-full text-left px-6 py-5 flex items-center justify-between gap-4"
                >
                  <span className="text-base font-medium" style={{ color: "hsl(var(--aeline-dark))" }}>{f.q}</span>
                  <span className="text-2xl leading-none text-slate-400 shrink-0">{expanded === i ? "–" : "+"}</span>
                </button>
                {expanded === i && (
                  <div className="px-6 pb-5 -mt-1">
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <CTASection />
      <Footer />
    </div>
  );
}

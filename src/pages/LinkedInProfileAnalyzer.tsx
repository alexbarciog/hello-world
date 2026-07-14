import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  Check,
  Clock,
  Linkedin,
  MessageSquare,
  Search,
  Shield,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import AnnouncementBar from "@/components/AnnouncementBar";
import { Footer } from "@/components/CTAFooter";
import { CountUp } from "@/lib/motion";

const EASE = [0.22, 1, 0.36, 1] as const;
const PENDING_KEY = "pending_profile_analysis";
const LINKEDIN_RE = /^https?:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\/in\/[^/?#\s]+/i;

function useSeoHead() {
  useEffect(() => {
    const url = "https://intentsly.com/linkedin-profile-analyzer";
    const title = "Free LinkedIn Profile Review & Optimization Audit | Intentsly";
    const desc =
      "Free AI LinkedIn profile review. Get an instant audit, conversion score, rewritten headline & About in 45 seconds. No credit card.";
    const prevTitle = document.title;
    document.title = title;

    const setMeta = (attr: "name" | "property", key: string, value: string) => {
      let el = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", value);
    };
    setMeta("name", "description", desc);
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", desc);
    setMeta("property", "og:type", "website");
    setMeta("property", "og:url", url);
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", desc);

    // Canonical
    let canonical = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    const createdCanonical = !canonical;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    const prevCanonicalHref = canonical.getAttribute("href");
    canonical.setAttribute("href", url);

    const ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.text = JSON.stringify([
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "Intentsly LinkedIn Profile Audit",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", reviewCount: "1284" },
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://intentsly.com/" },
          { "@type": "ListItem", position: 2, name: "LinkedIn Profile Review", item: url },
        ],
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
    return () => {
      document.title = prevTitle;
      if (createdCanonical) {
        canonical?.parentNode?.removeChild(canonical);
      } else if (prevCanonicalHref) {
        canonical?.setAttribute("href", prevCanonicalHref);
      }
      document.head.removeChild(ld);
    };
  }, []);
}


const bentoTiles = [
  { icon: Award, title: "Headline conversion score", desc: "The first 220 characters buyers read. Scored, diagnosed, rewritten." },
  { icon: MessageSquare, title: "About-section teardown", desc: "The 4 words in line 1 that make buyers scroll past — and what to write instead." },
  { icon: Search, title: "Missing buyer keywords", desc: "The exact words your future clients type into search that your profile is silent on." },
  { icon: Shield, title: "Trust signal gaps", desc: "Which credibility markers are missing so buyers hesitate to DM you." },
  { icon: Target, title: "Top 3 conversion killers", desc: "The specific things quietly costing you 3–5 inbound leads a week." },
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

const heroHeadline = "See what's silently killing your inbound leads on";

export default function LinkedInProfileAnalyzer() {
  useSeoHead();
  const navigate = useNavigate();

  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [service, setService] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(0);

  const validUrl = LINKEDIN_RE.test(linkedinUrl.trim());
  const validService = service.trim().length >= 3;
  const canSubmit = validUrl && validService;

  const submit = () => {
    if (!canSubmit) {
      setError(
        !validUrl
          ? "Please paste a valid LinkedIn profile URL (linkedin.com/in/…)"
          : "Tell us in a few words what you sell."
      );
      return;
    }
    try {
      localStorage.setItem(
        PENDING_KEY,
        JSON.stringify({ linkedin_url: linkedinUrl.trim(), service_description: service.trim() })
      );
    } catch {
      /* ignore */
    }
    navigate("/register?source=analyzer&redirect=%2Fprofile-report");
  };

  const words = heroHeadline.split(" ");

  return (
    <div className="min-h-screen bg-white font-sans text-[#0a0a0a]">
      <AnnouncementBar />
      <Navbar variant="light" />

      {/* ─── Hero — matches landing page ─── */}
      <section className="relative w-full bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 md:px-8 pt-10 md:pt-24 pb-12 md:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-10 items-center">
            {/* LEFT — copy */}
            <div className="relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: EASE }}
                className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 md:px-4 md:py-2 mb-5 md:mb-8 shadow-sm"
              >
                <motion.span
                  animate={{ scale: [1, 1.15, 1], rotate: [0, -8, 8, 0] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                  className="text-sm md:text-base leading-none inline-block"
                >
                  🔥
                </motion.span>
                <span className="text-[12px] md:text-[13px] font-semibold text-neutral-900">
                  <CountUp to={2431} /> profiles audited this month
                </span>
              </motion.div>

              <motion.h1
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.15 } },
                }}
                className="font-medium tracking-[-0.03em] leading-[1.05] md:leading-[1.02] text-[#0a0a0a]"
                style={{ fontSize: "clamp(2rem, 5.6vw, 4.75rem)" }}
              >
                {words.map((w, i) => (
                  <span key={i} className="inline-block overflow-hidden pb-[0.05em] mr-[0.25em]">
                    <motion.span
                      className="inline-block"
                      variants={{
                        hidden: { y: "110%", opacity: 0 },
                        visible: { y: 0, opacity: 1, transition: { duration: 0.7, ease: EASE } },
                      }}
                    >
                      {w}
                    </motion.span>
                  </span>
                ))}
                <span className="inline-block overflow-hidden pb-[0.05em]">
                  <motion.span
                    className="inline-block text-[#3B82F6]"
                    variants={{
                      hidden: { y: "110%", opacity: 0 },
                      visible: { y: 0, opacity: 1, transition: { duration: 0.7, ease: EASE } },
                    }}
                  >
                    LinkedIn
                  </motion.span>
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.75, ease: EASE }}
                className="mt-5 md:mt-7 text-base md:text-xl text-neutral-500 leading-relaxed max-w-xl"
              >
                Paste your profile. Tell us what you sell. Get a brutal, specific, 100% free AI audit of the 27 conversion signals stopping buyers from sliding into your DMs.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 1, ease: EASE }}
                className="mt-7 md:mt-9 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] font-medium text-neutral-500"
              >
                <span className="inline-flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-neutral-400" /> Read-only · never posts</span>
                <span className="inline-flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-neutral-400" /> ~45 seconds</span>
                <span className="inline-flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-neutral-400" /> No credit card</span>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 1.2, ease: EASE }}
                className="mt-6 text-xs uppercase tracking-[0.14em] text-neutral-400"
              >
                Avg. score before fix · <span className="text-neutral-700 font-semibold">42/100</span> · avg. after · <span className="text-neutral-700 font-semibold">81/100</span>
              </motion.p>
            </div>

            {/* RIGHT — form card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.35, ease: EASE }}
              className="relative"
            >
              <div className="relative rounded-3xl bg-white border border-neutral-200 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.12)] p-6 md:p-8">
                <div className="flex items-center gap-2 mb-6">
                  <span className="w-8 h-8 rounded-xl bg-[#3B82F6]/10 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-[#3B82F6]" />
                  </span>
                  <span className="text-[13px] font-semibold text-neutral-900">Free profile audit</span>
                </div>

                <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500 mb-2">
                  1 · Your LinkedIn profile URL
                </label>
                <div className="relative mb-5">
                  <Linkedin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3B82F6]" />
                  <input
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => { setLinkedinUrl(e.target.value); setError(null); }}
                    placeholder="https://www.linkedin.com/in/your-name"
                    className="w-full h-12 pl-10 pr-3 rounded-xl border border-neutral-200 bg-white text-sm text-[#0a0a0a] placeholder:text-neutral-400 focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/10 transition"
                  />
                </div>

                <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500 mb-2">
                  2 · What do you mainly sell?
                </label>
                <textarea
                  value={service}
                  onChange={(e) => { setService(e.target.value.slice(0, 200)); setError(null); }}
                  placeholder="e.g. Fractional CMO services for Series A B2B SaaS"
                  rows={2}
                  className="w-full px-3.5 py-3 rounded-xl border border-neutral-200 bg-white text-sm text-[#0a0a0a] placeholder:text-neutral-400 focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/10 resize-none transition"
                />
                <div className="text-[10px] text-neutral-400 mt-1 text-right">{service.length}/200</div>

                {error && <p className="text-xs text-red-600 mt-2">{error}</p>}

                <motion.button
                  whileHover={{ scale: canSubmit ? 1.02 : 1, y: canSubmit ? -1 : 0 }}
                  whileTap={{ scale: canSubmit ? 0.98 : 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  onClick={submit}
                  disabled={!canSubmit}
                  className="mt-5 w-full inline-flex flex-col items-center justify-center gap-1 bg-[#0a0a0a] text-white rounded-xl px-6 py-3.5 md:py-4 hover:bg-neutral-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className="inline-flex items-center justify-center gap-2 text-[15px] font-semibold">
                    Analyze my profile — free
                    <ArrowRight className="w-4 h-4" />
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[hsl(var(--aeline-lime))]">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[hsl(var(--aeline-lime))] opacity-80" />
                      <span className="relative inline-flex h-full w-full rounded-full bg-[hsl(var(--aeline-lime))]" />
                    </span>
                    Report ready in 45 seconds
                  </span>
                </motion.button>

                <div className="mt-5 flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {["#3B82F6", "#C8FF00", "#f472b6", "#fb923c"].map((c, i) => (
                      <div key={i} className="w-6 h-6 rounded-full border-2 border-white" style={{ background: c }} />
                    ))}
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    Joined by <b className="text-neutral-800">2,431 operators</b> this month
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Bento: what you get ─── */}
      <section className="px-5 md:px-8 py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: EASE }}
            className="max-w-2xl mb-12 md:mb-16"
          >
            <span className="inline-block text-[11px] font-semibold tracking-[0.14em] uppercase text-[#3B82F6] mb-4">
              What you get
            </span>
            <h2 className="font-medium tracking-[-0.03em] leading-[1.05] text-[#0a0a0a]" style={{ fontSize: "clamp(1.75rem, 3.6vw, 3rem)" }}>
              A brutally specific teardown.<br />
              <span className="text-neutral-400">No generic advice.</span>
            </h2>
            <p className="mt-5 text-base md:text-lg text-neutral-500 leading-relaxed">
              Every insight is grounded in your actual profile — never templates. Rewrites are written in your voice, ready to paste.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-4">
            {bentoTiles.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.06, ease: EASE }}
                className="rounded-3xl bg-neutral-50 border border-neutral-100 p-7 flex flex-col hover:border-neutral-200 transition-colors"
              >
                <div className="w-11 h-11 rounded-2xl bg-white border border-neutral-200 flex items-center justify-center mb-5">
                  <t.icon className="w-5 h-5 text-[#3B82F6]" />
                </div>
                <h3 className="text-xl font-medium tracking-tight mb-2 text-[#0a0a0a]">{t.title}</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">{t.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Loss framing + testimonials on soft gray ─── */}
      <section className="px-5 md:px-8 py-20 md:py-28 bg-neutral-50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: EASE }}
            className="max-w-3xl mb-12 md:mb-16"
          >
            <span className="inline-block text-[11px] font-semibold tracking-[0.14em] uppercase text-[#3B82F6] mb-4">
              The uncomfortable truth
            </span>
            <h2 className="font-medium tracking-[-0.03em] leading-[1.05] text-[#0a0a0a]" style={{ fontSize: "clamp(1.75rem, 3.6vw, 3rem)" }}>
              Every week your profile leaks 3–5 inbound leads<br />
              <span className="text-neutral-400">and you never see them slip away.</span>
            </h2>
            <p className="mt-5 text-base md:text-lg text-neutral-500 leading-relaxed">
              Buyers land on your profile. They read the first 3 lines. They decide in 4 seconds whether to DM you or keep scrolling. Most keep scrolling. This audit tells you exactly why.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-4">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.08, ease: EASE }}
                className="rounded-3xl bg-white border border-neutral-100 p-7 flex flex-col"
              >
                <div className="text-4xl leading-none font-serif text-[#3B82F6] mb-3">"</div>
                <p className="text-[15px] text-neutral-700 leading-relaxed mb-6">{t.quote}</p>
                <div className="mt-auto">
                  <p className="text-sm font-semibold text-[#0a0a0a]">{t.name}</p>
                  <p className="text-xs text-neutral-500">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section className="px-5 md:px-8 py-20 md:py-28 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: EASE }}
            className="max-w-2xl mb-12 md:mb-16"
          >
            <span className="inline-block text-[11px] font-semibold tracking-[0.14em] uppercase text-[#3B82F6] mb-4">
              How it works
            </span>
            <h2 className="font-medium tracking-[-0.03em] leading-[1.05] text-[#0a0a0a]" style={{ fontSize: "clamp(1.75rem, 3.6vw, 3rem)" }}>
              Report in your hands in 3 steps.
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              { n: "01", t: "Paste your LinkedIn", d: "Read-only. We only see what's publicly visible." },
              { n: "02", t: "Tell us what you sell", d: "One sentence. This is what we grade your profile against." },
              { n: "03", t: "Get your audit", d: "Score, rewrites, top 3 killers, quick-win checklist. Free." },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.08, ease: EASE }}
                className="rounded-3xl bg-neutral-50 border border-neutral-100 p-8"
              >
                <div className="text-4xl font-medium mb-4 text-neutral-300">{s.n}</div>
                <h3 className="text-xl font-medium tracking-tight mb-2 text-[#0a0a0a]">{s.t}</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">{s.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Secondary CTA — dark card like landing ─── */}
      <section className="px-5 md:px-8 pb-20 bg-white">
        <div className="max-w-6xl mx-auto rounded-3xl bg-[#0a0a0a] px-8 md:px-14 py-14 md:py-20 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#3B82F6]/20 blur-3xl" aria-hidden />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-[hsl(var(--aeline-lime))]/10 blur-3xl" aria-hidden />
          <div className="relative max-w-2xl">
            <h2 className="font-medium tracking-[-0.03em] leading-[1.05] text-white" style={{ fontSize: "clamp(1.75rem, 3.6vw, 3rem)" }}>
              Your future clients are checking your profile right now.
            </h2>
            <p className="mt-5 text-base md:text-lg text-neutral-400 leading-relaxed max-w-xl">
              Find out — in 45 seconds — what they see, and exactly what to fix so they hit DM instead of scroll.
            </p>
            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="mt-8 inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-white text-[#0a0a0a] font-semibold text-[15px] hover:bg-neutral-100 transition-colors"
            >
              Run my free audit
              <ArrowUpRight className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="px-5 md:px-8 py-20 md:py-28 bg-white">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: EASE }}
            className="text-center mb-12"
          >
            <span className="inline-block text-[11px] font-semibold tracking-[0.14em] uppercase text-[#3B82F6] mb-4">FAQ</span>
            <h2 className="font-medium tracking-[-0.03em] leading-[1.05] text-[#0a0a0a]" style={{ fontSize: "clamp(1.75rem, 3.6vw, 3rem)" }}>
              Questions? Answers.
            </h2>
          </motion.div>
          <div className="space-y-3">
            {faqs.map((f, i) => (
              <div key={i} className="rounded-2xl bg-neutral-50 border border-neutral-100 overflow-hidden">
                <button
                  onClick={() => setExpanded(expanded === i ? null : i)}
                  className="w-full text-left px-6 py-5 flex items-center justify-between gap-4"
                >
                  <span className="text-[15px] font-medium text-[#0a0a0a]">{f.q}</span>
                  <span className="text-2xl leading-none text-neutral-400 shrink-0">{expanded === i ? "–" : "+"}</span>
                </button>
                {expanded === i && (
                  <div className="px-6 pb-5 -mt-1">
                    <p className="text-sm text-neutral-500 leading-relaxed">{f.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

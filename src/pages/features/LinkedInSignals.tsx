import heroBg from "@/assets/mesh-gradient-3.png";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { ttqViewContent } from "@/lib/tiktok-pixel";
import { ArrowUpRight, ArrowRight, Linkedin, Search, Activity, Users, Crosshair, Filter } from "lucide-react";
import Navbar from "@/components/Navbar";
import { CTASection, Footer } from "@/components/CTAFooter";

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

const signals = [
  { icon: Activity, title: "Post Engagement Signals", desc: "Find people who like, comment on, or share posts from your competitors and industry leaders — they're already thinking about your space." },
  { icon: Search, title: "Keyword Post Signals", desc: "Monitor LinkedIn for posts mentioning specific pain points, tools, or topics relevant to your solution." },
  { icon: Users, title: "Competitor Page Followers", desc: "Target people following your competitors' company pages — they've already shown interest in solutions like yours." },
  { icon: Crosshair, title: "Hashtag Engagement", desc: "Track engagement on industry-specific hashtags to find active participants in your market." },
];

const howItWorks = [
  { step: "01", title: "Set your signals", desc: "Choose competitor pages, keywords, influencers, and hashtags to monitor." },
  { step: "02", title: "AI scans continuously", desc: "Our agents run daily, finding fresh leads who match your ICP and show buying intent." },
  { step: "03", title: "Leads scored & filtered", desc: "Each lead gets an AI relevance score. Cold leads are capped at 20% — only warm signals matter." },
  { step: "04", title: "Auto-enrolled in campaigns", desc: "High-intent leads flow directly into your outreach campaigns for immediate engagement." },
];

export default function LinkedInSignals() {
  const navigate = useNavigate();
  const heroRef = useInView(0.2);
  const signalsHeadingRef = useInView(0.2);
  const flowHeadingRef = useInView(0.2);

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-[80vh] flex flex-col items-center justify-center overflow-hidden pt-20 pb-16">
        <img src={heroBg} aria-hidden="true" className="absolute inset-0 w-full h-full object-cover z-0" />
        <div
          ref={heroRef.ref}
          className="relative z-10 flex flex-col items-center text-center px-4 max-w-4xl mx-auto"
          style={{
            opacity: heroRef.visible ? 1 : 0,
            transform: heroRef.visible ? "translateY(0)" : "translateY(24px)",
            transition: "all 0.7s cubic-bezier(0.25,0.46,0.45,0.94)",
          }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border/40 bg-white/50 backdrop-blur-sm text-sm font-medium text-foreground mb-8">
            <Linkedin className="w-4 h-4" />
            LinkedIn Intent Signals
          </div>
          <h1 className="text-5xl md:text-7xl font-light text-foreground leading-[1.1] tracking-tight mb-6">
            Find leads who are<br />already looking for you
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
            Stop cold outreach. Intentsly monitors LinkedIn engagement to find people actively interested in what you sell — before your competitors do.
          </p>
          <a href="/register" className="btn-cta text-base">
            Launch your AI Agent for free
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* Signal types */}
      <section className="px-8 md:px-16 py-24 md:py-32" style={{ background: "hsl(0 0% 100%)" }}>
        <div className="max-w-6xl mx-auto">
          <div
            ref={signalsHeadingRef.ref}
            className="flex items-center justify-center pb-16 text-center"
            style={{
              opacity: signalsHeadingRef.visible ? 1 : 0,
              transform: signalsHeadingRef.visible ? "translateY(0)" : "translateY(24px)",
              transition: "all 0.6s cubic-bezier(0.25,0.46,0.45,0.94)",
            }}
          >
            <h2 className="text-5xl md:text-6xl font-normal text-foreground leading-tight tracking-tight max-w-2xl">
              Intent signals we track
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {signals.map((s, i) => {
              const card = useInView(0.15);
              return (
                <div
                  key={i}
                  ref={card.ref}
                  className="rounded-[28px] border border-border/60 p-8"
                  style={{
                    background: "hsl(0 0% 98%)",
                    opacity: card.visible ? 1 : 0,
                    transform: card.visible ? "translateY(0)" : "translateY(28px)",
                    transition: `all 0.65s cubic-bezier(0.25,0.46,0.45,0.94) ${i * 80}ms`,
                  }}
                >
                  <div className="w-12 h-12 rounded-2xl border border-border/60 flex items-center justify-center mb-5" style={{ background: "hsl(0 0% 100%)" }}>
                    <s.icon className="w-5 h-5 text-foreground/60" />
                  </div>
                  <h3 className="text-2xl font-normal text-foreground tracking-tight">{s.title}</h3>
                  <p className="text-base text-muted-foreground mt-3 leading-relaxed">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Flow */}
      <section className="px-8 md:px-16 py-24 md:py-32 border-t border-border/40">
        <div className="max-w-6xl mx-auto">
          <div
            ref={flowHeadingRef.ref}
            className="flex items-center justify-center pb-16 text-center"
            style={{
              opacity: flowHeadingRef.visible ? 1 : 0,
              transform: flowHeadingRef.visible ? "translateY(0)" : "translateY(24px)",
              transition: "all 0.6s cubic-bezier(0.25,0.46,0.45,0.94)",
            }}
          >
            <h2 className="text-5xl md:text-6xl font-normal text-foreground leading-tight tracking-tight max-w-2xl">
              From signal to conversation
            </h2>
          </div>

          <div className="space-y-14 max-w-3xl mx-auto">
            {howItWorks.map((h, i) => {
              const row = useInView(0.15);
              return (
                <div
                  key={i}
                  ref={row.ref}
                  className="flex gap-6 items-start"
                  style={{
                    opacity: row.visible ? 1 : 0,
                    transform: row.visible ? "translateY(0)" : "translateY(28px)",
                    transition: `all 0.65s cubic-bezier(0.25,0.46,0.45,0.94) ${i * 60}ms`,
                  }}
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-full border border-border/60 flex items-center justify-center text-sm font-medium text-muted-foreground" style={{ background: "hsl(0 0% 98%)" }}>
                    {h.step}
                  </div>
                  <div>
                    <h3 className="text-2xl font-normal text-foreground tracking-tight">{h.title}</h3>
                    <p className="text-base text-muted-foreground mt-2 leading-relaxed">{h.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <CTASection />
      <Footer />
    </div>
  );
}
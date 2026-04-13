import featureHeroSky from "@/assets/feature-hero-sky.webp";
import { useEffect, useRef, useState } from "react";
import { ttqViewContent } from "@/lib/tiktok-pixel";
import { ArrowUpRight, Linkedin, Search, Activity, Users, Crosshair, Zap, Heart, UserPlus, Eye } from "lucide-react";
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
  { icon: Activity, title: "Post Engagement Signals", desc: "Find people who like, comment on, or share posts from your competitors and industry leaders." },
  { icon: Search, title: "Keyword Post Signals", desc: "Monitor LinkedIn for posts mentioning specific pain points, tools, or topics relevant to your solution." },
  { icon: Users, title: "Competitor Page Followers", desc: "Target people following your competitors' company pages — they've already shown interest in solutions like yours." },
  { icon: Crosshair, title: "Hashtag Engagement", desc: "Track engagement on industry-specific hashtags to find active participants in your market." },
];

const howItWorks = [
  { step: "01", title: "Set your signals", desc: "Choose competitor pages, keywords, influencers, and hashtags to monitor." },
  { step: "02", title: "AI scans continuously", desc: "Our agents run daily, finding fresh leads who match your ICP and show buying intent." },
  { step: "03", title: "Leads scored & filtered", desc: "Each lead gets an AI relevance score. Only warm signals matter." },
  { step: "04", title: "Auto-enrolled in campaigns", desc: "High-intent leads flow directly into your outreach campaigns for immediate engagement." },
];

/* Signal visual */
const SignalVisual = () => (
  <div className="relative w-full h-52 flex items-center justify-center">
    <div className="absolute left-6 top-3 w-[48%] rounded-2xl bg-[#1a1a2e] text-white p-4 shadow-xl -rotate-2 z-10">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-medium opacity-80">Live signals</span>
        <Zap className="w-3.5 h-3.5 text-[#C8FF00]" />
      </div>
      <div className="text-3xl font-bold">127</div>
      <p className="text-[9px] opacity-40">Intent signals today</p>
    </div>
    <div className="absolute right-4 top-14 w-[48%] rounded-2xl bg-white shadow-lg p-3 rotate-1 z-20 border border-border/50">
      <p className="text-[9px] font-medium mb-1.5" style={{ color: "hsl(var(--aeline-dark))" }}>Detected now</p>
      <div className="space-y-1">
        {[
          { icon: Search, name: "Posted about CRM", time: "2m ago", color: "#1A8FE3" },
          { icon: Heart, name: "Liked competitor post", time: "5m ago", color: "#ef4444" },
          { icon: UserPlus, name: "Followed rival page", time: "8m ago", color: "#22c55e" },
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <s.icon className="w-3 h-3 shrink-0" style={{ color: s.color }} />
            <span className="text-[8px] font-medium flex-1 truncate" style={{ color: "hsl(var(--aeline-dark))" }}>{s.name}</span>
            <span className="text-[7px] text-muted-foreground">{s.time}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default function LinkedInSignals() {
  useEffect(() => { ttqViewContent("LinkedIn Intent Signals"); }, []);
  const heroRef = useInView(0.2);
  const signalsHeadingRef = useInView(0.2);
  const flowHeadingRef = useInView(0.2);
  const visualRef = useInView(0.2);

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-[80vh] flex flex-col items-center justify-center overflow-hidden">
        <img src={featureHeroSky} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover" />
        <div className="cloud-overlay" style={{ opacity: 0.15 }} />
        <div
          ref={heroRef.ref}
          className="relative z-10 flex flex-col items-center text-center px-4 max-w-4xl mx-auto"
          style={{
            opacity: heroRef.visible ? 1 : 0,
            transform: heroRef.visible ? "translateY(0)" : "translateY(24px)",
            transition: "all 0.7s cubic-bezier(0.25,0.46,0.45,0.94)",
          }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm text-sm font-medium text-white mb-8">
            <Linkedin className="w-4 h-4" />
            LinkedIn Intent Signals
          </div>
          <h1 className="text-5xl md:text-7xl font-medium text-white leading-[1.05] tracking-tight mb-6">
            Find leads who are<br /><span className="text-white/70">already looking for you</span>
          </h1>
          <p className="text-base md:text-lg text-white/80 max-w-2xl mb-10 leading-relaxed">
            Stop cold outreach. Intentsly monitors LinkedIn engagement to find people actively interested in what you sell — before your competitors do.
          </p>
          <a href="/register" className="btn-cta text-base">
            Launch your AI Agent for free
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* Visual showcase */}
      <section className="px-6 py-20 bg-background">
        <div
          ref={visualRef.ref}
          className="max-w-xl mx-auto rounded-3xl bg-[#f5f5f5] p-8 pb-6"
          style={{
            opacity: visualRef.visible ? 1 : 0,
            transform: visualRef.visible ? "translateY(0)" : "translateY(24px)",
            transition: "all 0.6s cubic-bezier(0.25,0.46,0.45,0.94)",
          }}
        >
          <SignalVisual />
          <h3 className="text-xl font-semibold mb-2 text-center mt-2" style={{ color: "hsl(var(--aeline-dark))" }}>Real-Time Signal Dashboard</h3>
          <p className="text-sm text-muted-foreground leading-relaxed text-center">Signals detected across LinkedIn, Reddit, and X — updated continuously.</p>
        </div>
      </section>

      {/* Signal types */}
      <section className="px-6 py-20 md:py-32 bg-background">
        <div className="max-w-6xl mx-auto">
          <div
            ref={signalsHeadingRef.ref}
            className="mb-12"
            style={{
              opacity: signalsHeadingRef.visible ? 1 : 0,
              transform: signalsHeadingRef.visible ? "translateY(0)" : "translateY(24px)",
              transition: "all 0.6s cubic-bezier(0.25,0.46,0.45,0.94)",
            }}
          >
            <span className="section-label mb-6 block">Signal Types</span>
            <h2 className="text-4xl md:text-5xl font-medium tracking-tight leading-[1.1] max-w-3xl" style={{ color: "hsl(var(--aeline-dark))" }}>
              Intent signals we track
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
            {signals.map((s, i) => {
              const card = useInView(0.15);
              return (
                <div
                  key={i}
                  ref={card.ref}
                  className="rounded-3xl bg-[#f5f5f5] p-8 flex gap-5 items-start"
                  style={{
                    opacity: card.visible ? 1 : 0,
                    transform: card.visible ? "translateY(0)" : "translateY(28px)",
                    transition: `all 0.65s cubic-bezier(0.25,0.46,0.45,0.94) ${i * 80}ms`,
                  }}
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-[#1a1a2e] flex items-center justify-center">
                    <s.icon className="w-5 h-5 text-[#C8FF00]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold tracking-tight" style={{ color: "hsl(var(--aeline-dark))" }}>{s.title}</h3>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Flow */}
      <section className="px-6 py-20 md:py-32 bg-background">
        <div className="max-w-6xl mx-auto">
          <div
            ref={flowHeadingRef.ref}
            className="mb-16"
            style={{
              opacity: flowHeadingRef.visible ? 1 : 0,
              transform: flowHeadingRef.visible ? "translateY(0)" : "translateY(24px)",
              transition: "all 0.6s cubic-bezier(0.25,0.46,0.45,0.94)",
            }}
          >
            <span className="section-label mb-6 block">How It Works</span>
            <h2 className="text-4xl md:text-5xl font-medium tracking-tight leading-[1.1] max-w-3xl" style={{ color: "hsl(var(--aeline-dark))" }}>
              From signal to conversation
            </h2>
          </div>

          <div className="space-y-12 max-w-3xl">
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
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#1a1a2e] flex items-center justify-center text-sm font-semibold text-[#C8FF00]">
                    {h.step}
                  </div>
                  <div>
                    <h3 className="text-2xl font-medium tracking-tight" style={{ color: "hsl(var(--aeline-dark))" }}>{h.title}</h3>
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

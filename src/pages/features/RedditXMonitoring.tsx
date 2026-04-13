import featureHeroSky from "@/assets/feature-hero-sky.webp";
import { useEffect, useRef, useState } from "react";
import { ttqViewContent } from "@/lib/tiktok-pixel";
import { ArrowUpRight, Globe, MessageSquareMore, Twitter, Search, TrendingUp, Bookmark } from "lucide-react";
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

const platforms = [
  {
    icon: MessageSquareMore,
    title: "Reddit Monitoring",
    features: [
      "Track keywords across specific subreddits",
      "Relevance scoring on every mention",
      "Save high-value discussions for outreach",
      "Real-time alerts when your keywords trend",
    ],
  },
  {
    icon: Twitter,
    title: "X (Twitter) Monitoring",
    features: [
      "Monitor keyword mentions in real-time",
      "Track engagement metrics (likes, replies, retweets)",
      "Identify thought leaders in your space",
      "Save and organize relevant conversations",
    ],
  },
];

const useCases = [
  { title: "Competitor mentions", desc: "Know instantly when someone complains about a competitor or asks for alternatives." },
  { title: "Pain point detection", desc: "Find people publicly describing the exact problems your product solves." },
  { title: "Buying intent", desc: "Catch posts like 'looking for a tool that...' or 'anyone recommend...' before your competitors do." },
  { title: "Market intelligence", desc: "Understand what your target audience cares about — in their own words." },
];

/* Reddit visual */
const RedditVisual = () => (
  <div className="relative w-full h-52 flex items-center justify-center">
    <div className="absolute left-6 top-3 w-[48%] rounded-2xl bg-[#1a1a2e] text-white p-4 shadow-xl -rotate-2 z-10">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-medium opacity-80">Reddit signals</span>
        <MessageSquareMore className="w-3.5 h-3.5 text-[#C8FF00]" />
      </div>
      <div className="text-3xl font-bold">43</div>
      <p className="text-[9px] opacity-40">Mentions this week</p>
    </div>
    <div className="absolute right-4 top-14 w-[48%] rounded-2xl bg-white shadow-lg p-3 rotate-1 z-20 border border-border/50">
      <p className="text-[9px] font-medium mb-1.5" style={{ color: "hsl(var(--aeline-dark))" }}>Latest mentions</p>
      <div className="space-y-1">
        {[
          { sub: "r/sales", title: "Best lead gen tools?", score: "92%" },
          { sub: "r/startups", title: "Need outbound help", score: "88%" },
          { sub: "r/SaaS", title: "Alternative to X?", score: "85%" },
        ].map((m, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="text-[7px] text-muted-foreground w-12 shrink-0">{m.sub}</span>
            <span className="text-[8px] font-medium flex-1 truncate" style={{ color: "hsl(var(--aeline-dark))" }}>{m.title}</span>
            <span className="text-[7px] font-semibold text-[#22c55e]">{m.score}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/* X visual */
const XVisual = () => (
  <div className="relative w-full h-52 flex items-center justify-center">
    <div className="absolute left-6 top-3 w-[48%] rounded-2xl bg-[#1a1a2e] text-white p-4 shadow-xl rotate-1 z-10">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-medium opacity-80">X signals</span>
        <Twitter className="w-3.5 h-3.5 text-[#C8FF00]" />
      </div>
      <div className="text-3xl font-bold">67</div>
      <p className="text-[9px] opacity-40">Tweets matched</p>
    </div>
    <div className="absolute right-4 top-14 w-[48%] rounded-2xl bg-white shadow-lg p-3 -rotate-1 z-20 border border-border/50">
      <p className="text-[9px] font-medium mb-1.5" style={{ color: "hsl(var(--aeline-dark))" }}>Trending keywords</p>
      <div className="space-y-1">
        {[
          { keyword: "\"sales automation\"", tweets: 24 },
          { keyword: "\"outbound tool\"", tweets: 18 },
          { keyword: "\"lead generation\"", tweets: 25 },
        ].map((k, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#C8FF00]" />
            <span className="text-[8px] font-medium flex-1 truncate" style={{ color: "hsl(var(--aeline-dark))" }}>{k.keyword}</span>
            <span className="text-[7px] text-muted-foreground">{k.tweets} tweets</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default function RedditXMonitoring() {
  useEffect(() => { ttqViewContent("Reddit & X Monitoring"); }, []);
  const heroRef = useInView(0.2);
  const platformsRef = useInView(0.2);
  const useCasesRef = useInView(0.2);
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
            <Globe className="w-4 h-4" />
            Reddit & X Monitoring
          </div>
          <h1 className="text-5xl md:text-7xl font-medium text-white leading-[1.05] tracking-tight mb-6">
            Capture buying signals<br /><span className="text-white/70">across the web</span>
          </h1>
          <p className="text-base md:text-lg text-white/80 max-w-2xl mb-10 leading-relaxed">
            Monitor Reddit and X for real-time conversations about your industry, competitors, and the problems you solve.
          </p>
          <a href="/register" className="btn-cta text-base">
            Launch your AI Agent for free
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* Visual bento */}
      <section className="px-6 py-20 bg-background">
        <div
          ref={visualRef.ref}
          className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6"
          style={{
            opacity: visualRef.visible ? 1 : 0,
            transform: visualRef.visible ? "translateY(0)" : "translateY(24px)",
            transition: "all 0.6s cubic-bezier(0.25,0.46,0.45,0.94)",
          }}
        >
          <div className="rounded-3xl bg-[#f5f5f5] p-8 pb-6">
            <RedditVisual />
            <h3 className="text-xl font-semibold mb-2 text-center mt-2" style={{ color: "hsl(var(--aeline-dark))" }}>Reddit Monitoring</h3>
            <p className="text-sm text-muted-foreground leading-relaxed text-center">Track keywords across subreddits with AI relevance scoring.</p>
          </div>
          <div className="rounded-3xl bg-[#f5f5f5] p-8 pb-6">
            <XVisual />
            <h3 className="text-xl font-semibold mb-2 text-center mt-2" style={{ color: "hsl(var(--aeline-dark))" }}>X (Twitter) Monitoring</h3>
            <p className="text-sm text-muted-foreground leading-relaxed text-center">Catch real-time tweets and engagement about your niche.</p>
          </div>
        </div>
      </section>

      {/* Platform details */}
      <section className="px-6 py-20 md:py-32 bg-background">
        <div className="max-w-6xl mx-auto">
          <div
            ref={platformsRef.ref}
            className="mb-12"
            style={{
              opacity: platformsRef.visible ? 1 : 0,
              transform: platformsRef.visible ? "translateY(0)" : "translateY(24px)",
              transition: "all 0.6s cubic-bezier(0.25,0.46,0.45,0.94)",
            }}
          >
            <span className="section-label mb-6 block">Platforms</span>
            <h2 className="text-4xl md:text-5xl font-medium tracking-tight leading-[1.1] max-w-3xl" style={{ color: "hsl(var(--aeline-dark))" }}>
              Platforms we monitor
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
            {platforms.map((p, i) => {
              const card = useInView(0.15);
              return (
                <div
                  key={i}
                  ref={card.ref}
                  className="rounded-3xl bg-[#f5f5f5] p-8"
                  style={{
                    opacity: card.visible ? 1 : 0,
                    transform: card.visible ? "translateY(0)" : "translateY(28px)",
                    transition: `all 0.65s cubic-bezier(0.25,0.46,0.45,0.94) ${i * 120}ms`,
                  }}
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#1a1a2e] flex items-center justify-center mb-5">
                    <p.icon className="w-5 h-5 text-[#C8FF00]" />
                  </div>
                  <h3 className="text-2xl font-semibold tracking-tight mb-5" style={{ color: "hsl(var(--aeline-dark))" }}>{p.title}</h3>
                  <ul className="space-y-3">
                    {p.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-3 text-sm text-muted-foreground leading-relaxed">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#C8FF00] mt-1.5 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="px-6 py-20 md:py-32 bg-background">
        <div className="max-w-6xl mx-auto">
          <div
            ref={useCasesRef.ref}
            className="mb-12"
            style={{
              opacity: useCasesRef.visible ? 1 : 0,
              transform: useCasesRef.visible ? "translateY(0)" : "translateY(24px)",
              transition: "all 0.6s cubic-bezier(0.25,0.46,0.45,0.94)",
            }}
          >
            <span className="section-label mb-6 block">Use Cases</span>
            <h2 className="text-4xl md:text-5xl font-medium tracking-tight leading-[1.1] max-w-3xl" style={{ color: "hsl(var(--aeline-dark))" }}>
              What you can catch
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
            {useCases.map((u, i) => {
              const card = useInView(0.15);
              return (
                <div
                  key={i}
                  ref={card.ref}
                  className="rounded-3xl bg-[#f5f5f5] p-8"
                  style={{
                    opacity: card.visible ? 1 : 0,
                    transform: card.visible ? "translateY(0)" : "translateY(28px)",
                    transition: `all 0.65s cubic-bezier(0.25,0.46,0.45,0.94) ${i * 80}ms`,
                  }}
                >
                  <h3 className="text-xl font-semibold tracking-tight" style={{ color: "hsl(var(--aeline-dark))" }}>{u.title}</h3>
                  <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{u.desc}</p>
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

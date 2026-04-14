import featureHeroBg from "@/assets/feature-hero-sky.png";
import { useEffect, useRef, useState } from "react";
import { ttqViewContent } from "@/lib/tiktok-pixel";
import { ArrowUpRight, Globe, MessageSquareMore, Twitter, Search, TrendingUp, Bookmark, Sparkles } from "lucide-react";
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

const benefits = [
  { icon: MessageSquareMore, title: "Reddit Monitoring", desc: "Track keywords across specific subreddits with AI relevance scoring. Get real-time alerts when your keywords trend." },
  { icon: Twitter, title: "X (Twitter) Monitoring", desc: "Monitor keyword mentions in real-time, track engagement metrics, and identify thought leaders in your space." },
  { icon: Search, title: "Pain Point Detection", desc: "Find people publicly describing the exact problems your product solves — in their own words." },
  { icon: TrendingUp, title: "Buying Intent Capture", desc: "Catch posts like 'looking for a tool that...' or 'anyone recommend...' before your competitors do." },
];

/* Reddit/X visual */
const MonitoringVisual = () => (
  <div className="relative w-full h-full min-h-[320px] flex items-center justify-center p-6">
    <div className="absolute left-6 top-8 w-[55%] rounded-2xl bg-[#1a1a2e] text-white p-5 shadow-xl -rotate-2 z-10">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-medium opacity-80">Reddit signals</span>
        <MessageSquareMore className="w-4 h-4 text-[#C8FF00]" />
      </div>
      <div className="text-4xl font-bold">43</div>
      <p className="text-[10px] opacity-40 mt-1">Mentions this week</p>
    </div>
    <div className="absolute right-4 top-[45%] w-[52%] rounded-2xl bg-white shadow-lg p-4 rotate-1 z-20 border border-border/50">
      <p className="text-[10px] font-medium mb-2" style={{ color: "hsl(var(--aeline-dark))" }}>Latest mentions</p>
      <div className="space-y-2">
        {[
          { sub: "r/sales", title: "Best lead gen tools?", score: "92%" },
          { sub: "r/startups", title: "Need outbound help", score: "88%" },
          { sub: "r/SaaS", title: "Alternative to X?", score: "85%" },
        ].map((m, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-[8px] text-muted-foreground w-14 shrink-0">{m.sub}</span>
            <span className="text-[9px] font-medium flex-1 truncate" style={{ color: "hsl(var(--aeline-dark))" }}>{m.title}</span>
            <span className="text-[8px] font-semibold text-[#22c55e]">{m.score}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default function RedditXMonitoring() {
  useEffect(() => { ttqViewContent("Reddit & X Monitoring"); }, []);
  const heroRef = useInView(0.2);
  const benefitsRef = useInView(0.15);

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-[80vh] flex flex-col items-center justify-center overflow-hidden">
        <img src={featureHeroBg} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover" />
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
            <Sparkles className="w-4 h-4" />
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

      {/* Benefits bento */}
      <section className="px-6 py-24 md:py-32 bg-background">
        <div className="max-w-6xl mx-auto">
          <div
            ref={benefitsRef.ref}
            className="text-center mb-16"
            style={{
              opacity: benefitsRef.visible ? 1 : 0,
              transform: benefitsRef.visible ? "translateY(0)" : "translateY(24px)",
              transition: "all 0.6s cubic-bezier(0.25,0.46,0.45,0.94)",
            }}
          >
            <span className="section-label mb-6 block justify-center mx-auto w-fit">Benefits</span>
            <h2 className="text-4xl md:text-5xl font-medium tracking-tight leading-[1.1] mb-4" style={{ color: "hsl(var(--aeline-dark))" }}>
              The benefits of social monitoring
            </h2>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Understand what your target audience cares about — in their own words — and reach them at the perfect moment.
            </p>
          </div>

          {/* Row 1 */}
          <div className="grid md:grid-cols-3 gap-4 mb-4 mx-2 md:mx-3">
            {benefits.slice(0, 2).map((b, i) => {
              const card = useInView(0.15);
              return (
                <div
                  key={i}
                  ref={card.ref}
                  className="rounded-[20px] bg-[#f5f5f5] p-8 flex flex-col"
                  style={{
                    opacity: card.visible ? 1 : 0,
                    transform: card.visible ? "translateY(0)" : "translateY(28px)",
                    transition: `all 0.65s cubic-bezier(0.25,0.46,0.45,0.94) ${i * 100}ms`,
                  }}
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#C8FF00] flex items-center justify-center mb-6">
                    <b.icon className="w-5 h-5 text-[#1a1a2e]" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-medium tracking-tight mb-3" style={{ color: "hsl(var(--aeline-dark))" }}>{b.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
                </div>
              );
            })}
            <div className="rounded-[20px] bg-[#f5f5f5] overflow-hidden md:row-span-2 flex items-center justify-center">
              <div className="relative w-full h-full min-h-[300px] flex items-center justify-center p-4">
                <div className="absolute left-4 top-6 w-[54%] rounded-xl bg-[#1a1a2e] text-white p-4 shadow-xl rotate-1 z-10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-medium opacity-80">X signals</span>
                    <Twitter className="w-3.5 h-3.5 text-[#C8FF00]" />
                  </div>
                  <div className="text-2xl font-bold">67</div>
                  <p className="text-[8px] opacity-40">Tweets matched</p>
                </div>
                <div className="absolute right-3 bottom-8 w-[50%] rounded-xl bg-white shadow-md p-3 -rotate-1 z-20 border border-border/50">
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
                        <span className="text-[7px] text-muted-foreground">{k.tweets}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid md:grid-cols-3 gap-4 mx-2 md:mx-3">
            <div className="rounded-[20px] bg-[#C8FF00] p-8 flex flex-col justify-between">
              <div>
                <div className="text-4xl font-serif mb-4" style={{ color: "hsl(var(--aeline-dark))" }}>"</div>
                <p className="text-base font-medium leading-relaxed mb-6" style={{ color: "hsl(var(--aeline-dark))" }}>
                  "We found 3 enterprise deals by monitoring Reddit posts about our competitor's pricing. Intentsly paid for itself in a week."
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1a1a2e] flex items-center justify-center text-white text-sm font-semibold">AL</div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "hsl(var(--aeline-dark))" }}>Alex Lee</p>
                  <p className="text-xs" style={{ color: "hsl(var(--aeline-dark))", opacity: 0.6 }}>Founder, Pipeline.io</p>
                </div>
              </div>
            </div>
            {benefits.slice(2, 4).map((b, i) => {
              const card = useInView(0.15);
              return (
                <div
                  key={i}
                  ref={card.ref}
                  className="rounded-[20px] bg-[#f5f5f5] p-8 flex flex-col"
                  style={{
                    opacity: card.visible ? 1 : 0,
                    transform: card.visible ? "translateY(0)" : "translateY(28px)",
                    transition: `all 0.65s cubic-bezier(0.25,0.46,0.45,0.94) ${i * 100}ms`,
                  }}
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#C8FF00] flex items-center justify-center mb-6">
                    <b.icon className="w-5 h-5 text-[#1a1a2e]" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-medium tracking-tight mb-3" style={{ color: "hsl(var(--aeline-dark))" }}>{b.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
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

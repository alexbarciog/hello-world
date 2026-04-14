import featureHeroBg from "@/assets/feature-hero-sky.png";
import { useEffect, useRef, useState } from "react";
import { ttqViewContent } from "@/lib/tiktok-pixel";
import { ArrowUpRight, Linkedin, Search, Activity, Users, Crosshair, Zap, Heart, UserPlus, Sparkles } from "lucide-react";
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
  { icon: Activity, title: "Post Engagement Signals", desc: "Find people who like, comment on, or share posts from your competitors and industry leaders." },
  { icon: Search, title: "Keyword Post Signals", desc: "Monitor LinkedIn for posts mentioning specific pain points, tools, or topics relevant to your solution." },
  { icon: Users, title: "Competitor Page Followers", desc: "Target people following your competitors' company pages — they've already shown interest in solutions like yours." },
  { icon: Crosshair, title: "Hashtag Engagement", desc: "Track engagement on industry-specific hashtags to find active participants in your market." },
];

/* Signal visual */
const SignalVisual = () => (
  <div className="relative w-full h-full min-h-[320px] flex items-center justify-center p-6">
    <div className="absolute left-6 top-8 w-[55%] rounded-2xl bg-[#1a1a2e] text-white p-5 shadow-xl -rotate-2 z-10">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-medium opacity-80">Live signals</span>
        <Zap className="w-4 h-4 text-[#C8FF00]" />
      </div>
      <div className="text-4xl font-bold">127</div>
      <p className="text-[10px] opacity-40 mt-1">Intent signals today</p>
    </div>
    <div className="absolute right-4 top-[45%] w-[52%] rounded-2xl bg-white shadow-lg p-4 rotate-1 z-20 border border-border/50">
      <p className="text-[10px] font-medium mb-2" style={{ color: "hsl(var(--aeline-dark))" }}>Detected now</p>
      <div className="space-y-2">
        {[
          { icon: Search, name: "Posted about CRM", time: "2m ago", color: "#1A8FE3" },
          { icon: Heart, name: "Liked competitor post", time: "5m ago", color: "#ef4444" },
          { icon: UserPlus, name: "Followed rival page", time: "8m ago", color: "#22c55e" },
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <s.icon className="w-3 h-3 shrink-0" style={{ color: s.color }} />
            <span className="text-[9px] font-medium flex-1 truncate" style={{ color: "hsl(var(--aeline-dark))" }}>{s.name}</span>
            <span className="text-[8px] text-muted-foreground">{s.time}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default function LinkedInSignals() {
  useEffect(() => { ttqViewContent("LinkedIn Intent Signals"); }, []);
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
              The benefits of intent-based prospecting
            </h2>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Find prospects who are already looking for solutions like yours — and reach them at the perfect moment.
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
                <div className="absolute left-4 top-6 w-[54%] rounded-xl bg-[#1a1a2e] text-white p-4 shadow-xl -rotate-1 z-10">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Linkedin className="w-3.5 h-3.5 text-[#C8FF00]" />
                    <span className="text-[9px] font-medium opacity-80">Signal types</span>
                  </div>
                  <div className="space-y-1">
                    {["Post engagement", "Keyword mentions", "Page followers", "Hashtag activity"].map((s, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#C8FF00]" />
                        <span className="text-[8px]">{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="absolute right-3 bottom-8 w-[50%] rounded-xl bg-white shadow-md p-3 rotate-1 z-20 border border-border/50">
                  <p className="text-[9px] font-medium mb-1.5" style={{ color: "hsl(var(--aeline-dark))" }}>Today's signals</p>
                  <div className="text-2xl font-bold" style={{ color: "hsl(var(--aeline-dark))" }}>127</div>
                  <p className="text-[8px] text-muted-foreground">+23% vs last week</p>
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
                  "We stopped guessing who to reach out to. Intentsly shows us exactly who's interested — our reply rates tripled."
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1a1a2e] flex items-center justify-center text-white text-sm font-semibold">MR</div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "hsl(var(--aeline-dark))" }}>Mike Ruiz</p>
                  <p className="text-xs" style={{ color: "hsl(var(--aeline-dark))", opacity: 0.6 }}>CEO, GrowthLab</p>
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

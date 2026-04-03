import heroBg from "@/assets/mesh-gradient-4.png";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Globe, MessageSquareMore, Twitter, Bell } from "lucide-react";
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

export default function RedditXMonitoring() {
  const navigate = useNavigate();
  const heroRef = useInView(0.2);
  const platformsRef = useInView(0.2);
  const useCasesRef = useInView(0.2);

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-[80vh] flex flex-col items-center justify-center overflow-hidden pt-20 pb-16">
        <video className="absolute inset-0 w-full h-full object-cover z-0" src="/videos/hero-gradient.webm" autoPlay loop muted playsInline />
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
            <Globe className="w-4 h-4" />
            Reddit & X Monitoring
          </div>
          <h1 className="text-5xl md:text-7xl font-light text-foreground leading-[1.1] tracking-tight mb-6">
            Capture buying signals<br />across the web
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
            Monitor Reddit and X for real-time conversations about your industry, competitors, and the problems you solve.
          </p>
          <a href="/register" className="btn-cta text-base">
            Launch your AI Agent for free
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* Platform cards */}
      <section className="px-8 md:px-16 py-24 md:py-32" style={{ background: "hsl(0 0% 100%)" }}>
        <div className="max-w-6xl mx-auto">
          <div
            ref={platformsRef.ref}
            className="flex items-center justify-center pb-16 text-center"
            style={{
              opacity: platformsRef.visible ? 1 : 0,
              transform: platformsRef.visible ? "translateY(0)" : "translateY(24px)",
              transition: "all 0.6s cubic-bezier(0.25,0.46,0.45,0.94)",
            }}
          >
            <h2 className="text-5xl md:text-6xl font-normal text-foreground leading-tight tracking-tight max-w-2xl">
              Platforms we monitor
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {platforms.map((p, i) => {
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
                    transition: `all 0.65s cubic-bezier(0.25,0.46,0.45,0.94) ${i * 120}ms`,
                  }}
                >
                  <div className="w-12 h-12 rounded-2xl border border-border/60 flex items-center justify-center mb-5" style={{ background: "hsl(0 0% 100%)" }}>
                    <p.icon className="w-5 h-5 text-foreground/60" />
                  </div>
                  <h3 className="text-2xl font-normal text-foreground tracking-tight mb-5">{p.title}</h3>
                  <ul className="space-y-3">
                    {p.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-3 text-sm text-muted-foreground leading-relaxed">
                        <div className="w-1.5 h-1.5 rounded-full bg-foreground/30 mt-1.5 flex-shrink-0" />
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
      <section className="px-8 md:px-16 py-24 md:py-32 border-t border-border/40">
        <div className="max-w-6xl mx-auto">
          <div
            ref={useCasesRef.ref}
            className="flex items-center justify-center pb-16 text-center"
            style={{
              opacity: useCasesRef.visible ? 1 : 0,
              transform: useCasesRef.visible ? "translateY(0)" : "translateY(24px)",
              transition: "all 0.6s cubic-bezier(0.25,0.46,0.45,0.94)",
            }}
          >
            <h2 className="text-5xl md:text-6xl font-normal text-foreground leading-tight tracking-tight max-w-2xl">
              What you can catch
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {useCases.map((u, i) => {
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
                  <h3 className="text-xl font-normal text-foreground tracking-tight">{u.title}</h3>
                  <p className="text-base text-muted-foreground mt-3 leading-relaxed">{u.desc}</p>
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
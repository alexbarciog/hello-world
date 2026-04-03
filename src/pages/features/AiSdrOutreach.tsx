import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, ArrowRight, Bot, Target, Send, MessageSquare, TrendingUp } from "lucide-react";
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

const steps = [
  { icon: Target, title: "Define Your ICP", desc: "Tell us who your ideal customers are — job titles, industries, company sizes. Our AI builds a precision-targeted profile." },
  { icon: Bot, title: "AI Crafts Personalized Messages", desc: "Each connection request and follow-up is uniquely written based on the lead's profile, activity, and your value proposition." },
  { icon: Send, title: "Automated Multi-Step Outreach", desc: "Connection requests, follow-up messages, and nurture sequences run on autopilot — respecting LinkedIn's daily limits." },
  { icon: MessageSquare, title: "Smart Conversation Handling", desc: "When leads reply, the AI SDR responds naturally — mirroring their tone, asking discovery questions, and guiding toward a meeting." },
  { icon: TrendingUp, title: "Continuous Optimization", desc: "Message performance is tracked. The AI learns what works for your audience and refines its approach over time." },
];

const stats = [
  { value: "10x", label: "More conversations started" },
  { value: "< 25", label: "Words per AI reply" },
  { value: "24/7", label: "Outreach running nonstop" },
  { value: "0", label: "Manual effort needed" },
];

export default function AiSdrOutreach() {
  const navigate = useNavigate();
  const heroRef = useInView(0.2);
  const statsRef = useInView(0.2);
  const stepsHeadingRef = useInView(0.2);

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
            <Bot className="w-4 h-4" />
            AI SDR & Outreach
          </div>
          <h1 className="text-5xl md:text-7xl font-light text-foreground leading-[1.1] tracking-tight mb-6">
            Your AI sales rep<br />that never sleeps
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
            Intentsly's AI SDR sends personalized LinkedIn messages, manages multi-step campaigns, and handles replies — all on autopilot.
          </p>
          <a href="/register" className="btn-cta text-base">
            Launch your AI Agent for free
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 px-8 md:px-16 border-b border-border/40" style={{ background: "hsl(0 0% 100%)" }}>
        <div
          ref={statsRef.ref}
          className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10"
          style={{
            opacity: statsRef.visible ? 1 : 0,
            transform: statsRef.visible ? "translateY(0)" : "translateY(24px)",
            transition: "all 0.6s cubic-bezier(0.25,0.46,0.45,0.94)",
          }}
        >
          {stats.map((s, i) => (
            <div key={i} className="text-center">
              <div className="text-4xl md:text-5xl font-light text-foreground tracking-tight">{s.value}</div>
              <div className="text-sm text-muted-foreground mt-2">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="px-8 md:px-16 py-24 md:py-32" style={{ background: "hsl(0 0% 100%)" }}>
        <div className="max-w-6xl mx-auto">
          <div
            ref={stepsHeadingRef.ref}
            className="flex items-center justify-center py-8 md:py-16 text-center"
            style={{
              opacity: stepsHeadingRef.visible ? 1 : 0,
              transform: stepsHeadingRef.visible ? "translateY(0)" : "translateY(24px)",
              transition: "all 0.6s cubic-bezier(0.25,0.46,0.45,0.94)",
            }}
          >
            <h2 className="text-5xl md:text-6xl font-normal text-foreground leading-tight tracking-tight max-w-2xl">
              How it works
            </h2>
          </div>

          <div className="space-y-16 max-w-3xl mx-auto">
            {steps.map((step, i) => {
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
                  <div className="flex-shrink-0 w-12 h-12 rounded-2xl border border-border/60 flex items-center justify-center" style={{ background: "hsl(0 0% 98%)" }}>
                    <step.icon className="w-5 h-5 text-foreground/60" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-2xl md:text-3xl font-normal text-foreground tracking-tight">{step.title}</h3>
                    <p className="text-base text-muted-foreground leading-relaxed max-w-md">{step.desc}</p>
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
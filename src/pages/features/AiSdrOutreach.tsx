import featureHeroSky from "@/assets/feature-hero-sky.webp";
import { useEffect, useRef, useState } from "react";
import { ttqViewContent } from "@/lib/tiktok-pixel";
import { ArrowUpRight, Bot, Target, Send, MessageSquare, TrendingUp, Zap, Clock, Calendar } from "lucide-react";
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

/* Mini visual components */
const OutreachVisual = () => (
  <div className="relative w-full h-52 flex items-center justify-center">
    <div className="absolute left-6 top-3 w-[48%] rounded-2xl bg-[#1a1a2e] text-white p-4 shadow-xl -rotate-2 z-10">
      <p className="text-[10px] opacity-50 mb-0.5">Campaign active</p>
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-bold">312</span>
        <span className="text-[10px] font-semibold text-[#C8FF00]">sent</span>
      </div>
      <p className="text-[9px] opacity-40 mt-0.5">DMs this week</p>
    </div>
    <div className="absolute right-4 top-14 w-[48%] rounded-2xl bg-white shadow-lg p-3 rotate-1 z-20 border border-border/50">
      <p className="text-[9px] font-medium mb-1.5" style={{ color: "hsl(var(--aeline-dark))" }}>Sequence steps</p>
      <div className="space-y-1.5">
        {[
          { step: "Connect request", status: "Sent ✓", color: "#22c55e" },
          { step: "Follow-up #1", status: "Replied ✓", color: "#1A8FE3" },
          { step: "Meeting booked", status: "Done", color: "#C8FF00" },
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-[9px] font-medium flex-1" style={{ color: "hsl(var(--aeline-dark))" }}>{s.step}</span>
            <span className="text-[7px] text-muted-foreground">{s.status}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const ConvoVisual = () => (
  <div className="relative w-full h-52 flex items-center justify-center">
    <div className="absolute left-6 top-3 w-[48%] rounded-2xl bg-[#1a1a2e] text-white p-4 shadow-xl rotate-1 z-10">
      <div className="flex items-center gap-1.5 mb-2">
        <Bot className="w-3.5 h-3.5 text-[#C8FF00]" />
        <span className="text-[9px] font-medium opacity-80">AI SDR active</span>
      </div>
      <div className="space-y-1">
        <div className="bg-white/10 rounded-md px-2 py-1">
          <p className="text-[7px] opacity-60">Lead:</p>
          <p className="text-[8px]">"Tell me more about this"</p>
        </div>
        <div className="bg-[#C8FF00]/20 rounded-md px-2 py-1">
          <p className="text-[7px] opacity-60">AI SDR:</p>
          <p className="text-[8px]">"Happy to! Want a quick call?"</p>
        </div>
      </div>
    </div>
    <div className="absolute right-4 top-14 w-[48%] rounded-2xl bg-white shadow-lg p-3 -rotate-1 z-20 border border-border/50">
      <p className="text-[9px] font-medium mb-1.5" style={{ color: "hsl(var(--aeline-dark))" }}>This week</p>
      <div className="space-y-1.5">
        {[
          { icon: MessageSquare, label: "Conversations", value: "48", color: "#1A8FE3" },
          { icon: Calendar, label: "Meetings booked", value: "12", color: "#22c55e" },
          { icon: Clock, label: "Avg. response", value: "< 2 min", color: "#C8FF00" },
        ].map((m, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <m.icon className="w-3 h-3 shrink-0" style={{ color: m.color }} />
            <span className="text-[8px] text-muted-foreground flex-1">{m.label}</span>
            <span className="text-[9px] font-semibold" style={{ color: "hsl(var(--aeline-dark))" }}>{m.value}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default function AiSdrOutreach() {
  useEffect(() => { ttqViewContent("AI SDR & Outreach"); }, []);
  const heroRef = useInView(0.2);
  const statsRef = useInView(0.2);
  const stepsHeadingRef = useInView(0.2);
  const visualRef = useInView(0.2);

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar />

      {/* Hero — sky background like landing page */}
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
            <Bot className="w-4 h-4" />
            AI SDR & Outreach
          </div>
          <h1 className="text-5xl md:text-7xl font-medium text-white leading-[1.05] tracking-tight mb-6">
            Your AI sales rep<br /><span className="text-white/70">that never sleeps</span>
          </h1>
          <p className="text-base md:text-lg text-white/80 max-w-2xl mb-10 leading-relaxed">
            Intentsly's AI SDR sends personalized LinkedIn messages, manages multi-step campaigns, and handles replies — all on autopilot.
          </p>
          <a href="/register" className="btn-cta text-base">
            Launch your AI Agent for free
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 px-6 bg-background">
        <div
          ref={statsRef.ref}
          className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8"
          style={{
            opacity: statsRef.visible ? 1 : 0,
            transform: statsRef.visible ? "translateY(0)" : "translateY(24px)",
            transition: "all 0.6s cubic-bezier(0.25,0.46,0.45,0.94)",
          }}
        >
          {stats.map((s, i) => (
            <div key={i} className="text-center rounded-3xl bg-[#f5f5f5] p-8">
              <div className="text-4xl md:text-5xl font-medium tracking-tight" style={{ color: "hsl(var(--aeline-dark))" }}>{s.value}</div>
              <div className="text-sm text-muted-foreground mt-2">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Visual bento showcase */}
      <section className="px-6 pb-20 bg-background">
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
            <OutreachVisual />
            <h3 className="text-xl font-semibold mb-2 text-center mt-2" style={{ color: "hsl(var(--aeline-dark))" }}>Automated Sequences</h3>
            <p className="text-sm text-muted-foreground leading-relaxed text-center">Multi-step campaigns that connect, follow up, and book meetings.</p>
          </div>
          <div className="rounded-3xl bg-[#f5f5f5] p-8 pb-6">
            <ConvoVisual />
            <h3 className="text-xl font-semibold mb-2 text-center mt-2" style={{ color: "hsl(var(--aeline-dark))" }}>Smart Reply Handling</h3>
            <p className="text-sm text-muted-foreground leading-relaxed text-center">AI responds naturally and guides leads toward meetings.</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-20 md:py-32 bg-background">
        <div className="max-w-6xl mx-auto">
          <div
            ref={stepsHeadingRef.ref}
            className="mb-16"
            style={{
              opacity: stepsHeadingRef.visible ? 1 : 0,
              transform: stepsHeadingRef.visible ? "translateY(0)" : "translateY(24px)",
              transition: "all 0.6s cubic-bezier(0.25,0.46,0.45,0.94)",
            }}
          >
            <span className="section-label mb-6 block">How It Works</span>
            <h2 className="text-4xl md:text-5xl font-medium tracking-tight leading-[1.1] max-w-3xl" style={{ color: "hsl(var(--aeline-dark))" }}>
              From setup to booked meetings in 5 steps
            </h2>
          </div>

          <div className="space-y-12 max-w-3xl">
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
                  <div className="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center bg-[#1a1a2e]">
                    <step.icon className="w-5 h-5 text-[#C8FF00]" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-2xl font-medium tracking-tight" style={{ color: "hsl(var(--aeline-dark))" }}>{step.title}</h3>
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

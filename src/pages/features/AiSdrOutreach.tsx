import { useEffect, useRef, useState } from "react";
import { ttqViewContent } from "@/lib/tiktok-pixel";
import { ArrowUpRight, Bot, Target, Send, MessageSquare, TrendingUp, Sparkles, Calendar, Clock } from "lucide-react";
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
  { icon: Target, title: "Precision-Targeted ICP", desc: "Define your ideal customers by job title, industry, and company size. The AI builds a laser-focused outreach profile." },
  { icon: Send, title: "Multi-Step Sequences", desc: "Connection requests, follow-ups, and nurture messages run on autopilot — respecting LinkedIn's daily limits." },
  { icon: MessageSquare, title: "Smart Reply Handling", desc: "When leads reply, the AI responds naturally — mirroring tone, asking questions, and guiding toward meetings." },
  { icon: TrendingUp, title: "Continuous Optimization", desc: "Message performance is tracked and the AI refines its approach based on what works for your audience." },
];

/* Outreach visual mockup */
const OutreachVisual = () => (
  <div className="relative w-full h-full min-h-[320px] flex items-center justify-center p-6">
    <div className="absolute left-6 top-8 w-[55%] rounded-2xl bg-[#1a1a2e] text-white p-5 shadow-xl -rotate-2 z-10">
      <p className="text-[11px] opacity-50 mb-1">Campaign active</p>
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-bold">312</span>
        <span className="text-[11px] font-semibold text-[#C8FF00]">sent</span>
      </div>
      <p className="text-[10px] opacity-40 mt-1">DMs this week</p>
    </div>
    <div className="absolute right-4 top-[45%] w-[52%] rounded-2xl bg-white shadow-lg p-4 rotate-1 z-20 border border-border/50">
      <p className="text-[10px] font-medium mb-2" style={{ color: "hsl(var(--aeline-dark))" }}>Sequence steps</p>
      <div className="space-y-2">
        {[
          { step: "Connect request", status: "Sent ✓", color: "#22c55e" },
          { step: "Follow-up #1", status: "Replied ✓", color: "#1A8FE3" },
          { step: "Meeting booked", status: "Done", color: "#C8FF00" },
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-[10px] font-medium flex-1" style={{ color: "hsl(var(--aeline-dark))" }}>{s.step}</span>
            <span className="text-[8px] text-muted-foreground">{s.status}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default function AiSdrOutreach() {
  useEffect(() => { ttqViewContent("AI SDR & Outreach"); }, []);
  const heroRef = useInView(0.2);
  const benefitsRef = useInView(0.15);

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar />

      {/* Hero — Split layout */}
      <section className="grid md:grid-cols-2 min-h-[85vh] mx-2 md:mx-3 mt-2 md:mt-3 rounded-[20px] overflow-hidden">
        {/* Left — text */}
        <div
          ref={heroRef.ref}
          className="flex flex-col justify-center px-8 md:px-14 py-16 bg-[#f5f5f5]"
          style={{
            opacity: heroRef.visible ? 1 : 0,
            transform: heroRef.visible ? "translateY(0)" : "translateY(24px)",
            transition: "all 0.7s cubic-bezier(0.25,0.46,0.45,0.94)",
          }}
        >
          <div className="w-12 h-12 rounded-2xl bg-[#1a1a2e] flex items-center justify-center mb-8">
            <Sparkles className="w-5 h-5 text-[#C8FF00]" />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-medium leading-[1.08] tracking-tight mb-6" style={{ color: "hsl(var(--aeline-dark))" }}>
            AI SDR & Outreach
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed mb-4 max-w-md">
            Your AI sales rep that never sleeps. Intentsly's AI SDR sends personalized LinkedIn messages, manages multi-step campaigns, and handles replies — all on autopilot.
          </p>
          <p className="text-base text-muted-foreground leading-relaxed mb-8 max-w-md">
            From connection request to booked meeting, the entire outreach sequence is handled with human-like precision and zero manual effort.
          </p>
          <a href="/register" className="btn-cta text-base">
            Get Started
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>
        {/* Right — visual */}
        <div className="bg-[#e8e8e8] flex items-center justify-center">
          <OutreachVisual />
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
              The benefits of AI-powered outreach
            </h2>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Automated sequences, intelligent replies, and continuous optimization — so you can focus on closing, not prospecting.
            </p>
          </div>

          {/* Bento grid — row 1: 2 cards + visual */}
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
            {/* Large visual card */}
            <div className="rounded-[20px] bg-[#f5f5f5] overflow-hidden md:row-span-2 flex items-center justify-center">
              <div className="relative w-full h-full min-h-[300px] flex items-center justify-center p-4">
                <div className="absolute left-4 top-6 w-[54%] rounded-xl bg-[#1a1a2e] text-white p-4 shadow-xl -rotate-1 z-10">
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
                <div className="absolute right-3 bottom-8 w-[50%] rounded-xl bg-white shadow-md p-3 rotate-1 z-20 border border-border/50">
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
            </div>
          </div>

          {/* Row 2: testimonial + 2 cards */}
          <div className="grid md:grid-cols-3 gap-4 mx-2 md:mx-3">
            {/* Testimonial card */}
            <div className="rounded-[20px] bg-[#C8FF00] p-8 flex flex-col justify-between">
              <div>
                <div className="text-4xl font-serif mb-4" style={{ color: "hsl(var(--aeline-dark))" }}>"</div>
                <p className="text-base font-medium leading-relaxed mb-6" style={{ color: "hsl(var(--aeline-dark))" }}>
                  "We went from 0 to 15 meetings per week using Intentsly's AI SDR. It's like having a full sales team on autopilot."
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1a1a2e] flex items-center justify-center text-white text-sm font-semibold">JD</div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "hsl(var(--aeline-dark))" }}>James Doe</p>
                  <p className="text-xs" style={{ color: "hsl(var(--aeline-dark))", opacity: 0.6 }}>VP of Sales, SaaS Co.</p>
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

import featureHeroSky from "@/assets/feature-hero-sky.webp";
import { useEffect, useRef, useState } from "react";
import { ttqViewContent } from "@/lib/tiktok-pixel";
import { ArrowUpRight, MessageCircle, Brain, Calendar, Shield, Sparkles, Bot, Clock } from "lucide-react";
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

const capabilities = [
  { icon: MessageCircle, title: "Natural Conversations", desc: "Replies under 25 words that mirror the lead's energy. No robotic sales pitches — just human-like responses." },
  { icon: Brain, title: "Context-Aware Intelligence", desc: "The AI reads the full conversation history, understands intent, and calibrates its approach based on the conversation stage." },
  { icon: Calendar, title: "Auto Meeting Booking", desc: "When a lead shows interest, the AI naturally suggests a call and detects when a meeting is agreed upon." },
  { icon: Shield, title: "Smart Escalation", desc: "Complex questions or high-value opportunities are flagged for your attention — the AI knows when to hand off." },
];

const phases = [
  { phase: "Replies 1–2", title: "Build Rapport", desc: "Pure relationship building. Ask about their work, find common ground. Zero selling." },
  { phase: "Replies 3–4", title: "Discovery", desc: "Light exploration of challenges. Mention your solution only if naturally relevant." },
  { phase: "Reply 5+", title: "Soft Close", desc: "If there's mutual interest, suggest a brief call. Never pushy, always natural." },
];

const chatMessages = [
  { from: "lead", name: "Lead", msg: "Hi, thanks for connecting!" },
  { from: "ai", name: "AI SDR", msg: "Hey! Thanks for accepting 🙌 Saw you're scaling growth at Acme — how's that going?" },
  { from: "lead", name: "Lead", msg: "It's been intense, we're trying to find more qualified leads" },
  { from: "ai", name: "AI SDR", msg: "Totally get it. What's been your biggest bottleneck — sourcing or converting?" },
  { from: "lead", name: "Lead", msg: "Mostly sourcing, we spend too much time on it" },
  { from: "ai", name: "AI SDR", msg: "We actually help teams automate lead sourcing using intent signals. Happy to show you in 15 min if useful?" },
];

export default function ConversationalAi() {
  useEffect(() => { ttqViewContent("Conversational AI"); }, []);
  const heroRef = useInView(0.2);
  const chatRef = useInView(0.15);
  const phasesRef = useInView(0.2);
  const capsRef = useInView(0.2);

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
            <Sparkles className="w-4 h-4" />
            Conversational AI
          </div>
          <h1 className="text-5xl md:text-7xl font-medium text-white leading-[1.05] tracking-tight mb-6">
            AI that talks like<br /><span className="text-white/70">your best SDR</span>
          </h1>
          <p className="text-base md:text-lg text-white/80 max-w-2xl mb-10 leading-relaxed">
            When leads reply, our Conversational AI handles the dialogue — building rapport, qualifying interest, and booking meetings automatically.
          </p>
          <a href="/register" className="btn-cta text-base">
            Launch your AI Agent for free
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* Chat example */}
      <section className="px-6 py-20 md:py-32 bg-background">
        <div className="max-w-6xl mx-auto">
          <div ref={chatRef.ref} className="mb-12"
            style={{ opacity: chatRef.visible ? 1 : 0, transform: chatRef.visible ? "translateY(0)" : "translateY(24px)", transition: "all 0.6s cubic-bezier(0.25,0.46,0.45,0.94)" }}
          >
            <span className="section-label mb-6 block">See It In Action</span>
            <h2 className="text-4xl md:text-5xl font-medium tracking-tight leading-[1.1] max-w-3xl" style={{ color: "hsl(var(--aeline-dark))" }}>
              Watch the AI SDR close a meeting
            </h2>
          </div>

          <div className="max-w-2xl mx-auto rounded-3xl bg-[#f5f5f5] p-8 space-y-3">
            {chatMessages.map((m, i) => {
              const row = useInView(0.1);
              return (
                <div
                  key={i}
                  ref={row.ref}
                  className={`flex ${m.from === "ai" ? "justify-start" : "justify-end"}`}
                  style={{
                    opacity: row.visible ? 1 : 0,
                    transform: row.visible ? "translateY(0)" : "translateY(16px)",
                    transition: `all 0.5s cubic-bezier(0.25,0.46,0.45,0.94) ${i * 80}ms`,
                  }}
                >
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${m.from === "ai" ? "bg-[#1a1a2e] text-white" : "bg-white border border-border/50"}`}>
                    <div className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${m.from === "ai" ? "text-[#C8FF00]" : "text-muted-foreground"}`}>{m.name}</div>
                    <div className={`text-sm leading-relaxed ${m.from === "ai" ? "text-white/90" : ""}`} style={m.from !== "ai" ? { color: "hsl(var(--aeline-dark))" } : {}}>{m.msg}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Phases */}
      <section className="px-6 py-20 md:py-32 bg-background">
        <div className="max-w-6xl mx-auto">
          <div ref={phasesRef.ref} className="mb-12"
            style={{ opacity: phasesRef.visible ? 1 : 0, transform: phasesRef.visible ? "translateY(0)" : "translateY(24px)", transition: "all 0.6s cubic-bezier(0.25,0.46,0.45,0.94)" }}
          >
            <span className="section-label mb-6 block">Conversation Phases</span>
            <h2 className="text-4xl md:text-5xl font-medium tracking-tight leading-[1.1] max-w-3xl" style={{ color: "hsl(var(--aeline-dark))" }}>
              Intelligent conversation phases
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl">
            {phases.map((p, i) => {
              const card = useInView(0.15);
              return (
                <div
                  key={i}
                  ref={card.ref}
                  className="rounded-3xl bg-[#f5f5f5] p-8"
                  style={{
                    opacity: card.visible ? 1 : 0,
                    transform: card.visible ? "translateY(0)" : "translateY(28px)",
                    transition: `all 0.65s cubic-bezier(0.25,0.46,0.45,0.94) ${i * 100}ms`,
                  }}
                >
                  <div className="inline-flex px-3 py-1 rounded-full bg-[#1a1a2e] text-[#C8FF00] text-[10px] font-semibold uppercase tracking-wider mb-4">{p.phase}</div>
                  <h3 className="text-xl font-semibold tracking-tight" style={{ color: "hsl(var(--aeline-dark))" }}>{p.title}</h3>
                  <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{p.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="px-6 py-20 md:py-32 bg-background">
        <div className="max-w-6xl mx-auto">
          <div ref={capsRef.ref} className="mb-12"
            style={{ opacity: capsRef.visible ? 1 : 0, transform: capsRef.visible ? "translateY(0)" : "translateY(24px)", transition: "all 0.6s cubic-bezier(0.25,0.46,0.45,0.94)" }}
          >
            <span className="section-label mb-6 block">Capabilities</span>
            <h2 className="text-4xl md:text-5xl font-medium tracking-tight leading-[1.1] max-w-3xl" style={{ color: "hsl(var(--aeline-dark))" }}>
              Key capabilities
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
            {capabilities.map((c, i) => {
              const row = useInView(0.15);
              return (
                <div
                  key={i}
                  ref={row.ref}
                  className="rounded-3xl bg-[#f5f5f5] p-8 flex gap-5 items-start"
                  style={{
                    opacity: row.visible ? 1 : 0,
                    transform: row.visible ? "translateY(0)" : "translateY(28px)",
                    transition: `all 0.65s cubic-bezier(0.25,0.46,0.45,0.94) ${i * 60}ms`,
                  }}
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-[#1a1a2e] flex items-center justify-center">
                    <c.icon className="w-5 h-5 text-[#C8FF00]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold tracking-tight" style={{ color: "hsl(var(--aeline-dark))" }}>{c.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{c.desc}</p>
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

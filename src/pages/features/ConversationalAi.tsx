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

const benefits = [
  { icon: MessageCircle, title: "Natural Conversations", desc: "Replies under 25 words that mirror the lead's energy. No robotic sales pitches — just human-like responses." },
  { icon: Brain, title: "Context-Aware Intelligence", desc: "The AI reads the full conversation history, understands intent, and calibrates its approach based on the conversation stage." },
  { icon: Calendar, title: "Auto Meeting Booking", desc: "When a lead shows interest, the AI naturally suggests a call and detects when a meeting is agreed upon." },
  { icon: Shield, title: "Smart Escalation", desc: "Complex questions or high-value opportunities are flagged for your attention — the AI knows when to hand off." },
];

const chatMessages = [
  { from: "lead", name: "Lead", msg: "Hi, thanks for connecting!" },
  { from: "ai", name: "AI SDR", msg: "Hey! Thanks for accepting 🙌 Saw you're scaling growth at Acme — how's that going?" },
  { from: "lead", name: "Lead", msg: "It's been intense, we're trying to find more qualified leads" },
  { from: "ai", name: "AI SDR", msg: "Totally get it. What's been your biggest bottleneck — sourcing or converting?" },
  { from: "lead", name: "Lead", msg: "Mostly sourcing, we spend too much time on it" },
  { from: "ai", name: "AI SDR", msg: "We help teams automate lead sourcing using intent signals. Happy to show you in 15 min?" },
];

/* Chat visual */
const ChatVisual = () => (
  <div className="relative w-full h-full min-h-[320px] flex items-center justify-center p-6">
    <div className="w-full max-w-xs space-y-2">
      {chatMessages.slice(0, 4).map((m, i) => (
        <div key={i} className={`flex ${m.from === "ai" ? "justify-start" : "justify-end"}`}>
          <div className={`max-w-[85%] rounded-xl px-3 py-2 ${m.from === "ai" ? "bg-[#1a1a2e] text-white" : "bg-white border border-border/50"}`}>
            <div className={`text-[8px] font-semibold uppercase tracking-wider mb-0.5 ${m.from === "ai" ? "text-[#C8FF00]" : "text-muted-foreground"}`}>{m.name}</div>
            <div className={`text-[10px] leading-relaxed ${m.from === "ai" ? "text-white/90" : ""}`} style={m.from !== "ai" ? { color: "hsl(var(--aeline-dark))" } : {}}>{m.msg}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default function ConversationalAi() {
  useEffect(() => { ttqViewContent("Conversational AI"); }, []);
  const heroRef = useInView(0.2);
  const benefitsRef = useInView(0.15);

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar />

      {/* Hero — Split layout */}
      <section className="grid md:grid-cols-2 min-h-[85vh] mx-2 md:mx-3 mt-2 md:mt-3 rounded-[20px] overflow-hidden">
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
            Conversational AI
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed mb-4 max-w-md">
            When leads reply, our Conversational AI handles the dialogue — building rapport, qualifying interest, and booking meetings automatically.
          </p>
          <p className="text-base text-muted-foreground leading-relaxed mb-8 max-w-md">
            Through intelligent conversation phases, the AI mirrors each lead's tone, asks discovery questions, and naturally guides toward a call — without ever sounding robotic.
          </p>
          <a href="/register" className="btn-cta text-base">
            Get Started
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>
        <div className="bg-[#e8e8e8] flex items-center justify-center">
          <ChatVisual />
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
              The benefits of conversational AI
            </h2>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Intelligent replies that build rapport and book meetings — without any manual effort from your team.
            </p>
          </div>

          {/* Row 1: 2 cards + visual */}
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
            {/* Visual card */}
            <div className="rounded-[20px] bg-[#f5f5f5] overflow-hidden md:row-span-2 flex items-center justify-center">
              <div className="relative w-full h-full min-h-[300px] flex items-center justify-center p-4">
                <div className="absolute left-4 top-6 w-[54%] rounded-xl bg-[#1a1a2e] text-white p-4 shadow-xl -rotate-1 z-10">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Bot className="w-3.5 h-3.5 text-[#C8FF00]" />
                    <span className="text-[9px] font-medium opacity-80">Conversation phases</span>
                  </div>
                  <div className="space-y-1">
                    {["Build Rapport", "Discovery", "Soft Close"].map((p, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${i === 0 ? "bg-[#C8FF00]" : i === 1 ? "bg-[#1A8FE3]" : "bg-[#22c55e]"}`} />
                        <span className="text-[8px]">{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="absolute right-3 bottom-8 w-[50%] rounded-xl bg-white shadow-md p-3 rotate-1 z-20 border border-border/50">
                  <p className="text-[9px] font-medium mb-1.5" style={{ color: "hsl(var(--aeline-dark))" }}>Performance</p>
                  <div className="space-y-1.5">
                    {[
                      { label: "Reply rate", value: "34%", color: "#1A8FE3" },
                      { label: "Meeting rate", value: "12%", color: "#22c55e" },
                      { label: "Avg. replies", value: "< 25 words", color: "#C8FF00" },
                    ].map((m, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: m.color }} />
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
            <div className="rounded-[20px] bg-[#C8FF00] p-8 flex flex-col justify-between">
              <div>
                <div className="text-4xl font-serif mb-4" style={{ color: "hsl(var(--aeline-dark))" }}>"</div>
                <p className="text-base font-medium leading-relaxed mb-6" style={{ color: "hsl(var(--aeline-dark))" }}>
                  "The AI handles replies so naturally that prospects think they're talking to a real person. Game changer for our team."
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1a1a2e] flex items-center justify-center text-white text-sm font-semibold">SK</div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "hsl(var(--aeline-dark))" }}>Sarah Kim</p>
                  <p className="text-xs" style={{ color: "hsl(var(--aeline-dark))", opacity: 0.6 }}>Head of Growth, TechStartup</p>
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

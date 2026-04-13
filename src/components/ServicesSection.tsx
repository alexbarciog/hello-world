import { useEffect, useRef } from "react";
import { Radar, Send, Bot, ArrowUpRight, Zap, Search, Heart, UserPlus, Calendar, MessageSquare, Clock } from "lucide-react";

const useReveal = () => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.classList.add("revealed"); obs.disconnect(); }
    }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
};

/* ── Visual 1: Intent Signal Tracking ── */
const SignalTrackingVisual = () => (
  <div className="relative w-full h-44 flex items-center justify-center">
    <div className="absolute left-2 top-1 w-[46%] rounded-xl bg-[#1a1a2e] text-white p-3 shadow-xl -rotate-2 z-10">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] font-medium opacity-80">Live signals</span>
        <Zap className="w-3 h-3 text-[#C8FF00]" />
      </div>
      <div className="text-2xl font-bold">127</div>
      <p className="text-[8px] opacity-40">Intent signals today</p>
    </div>
    <div className="absolute right-1 top-2 w-[50%] rounded-xl bg-white shadow-md p-2.5 rotate-1 z-20 border border-border/50">
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

/* ── Visual 2: LinkedIn DM Automation ── */
const OutreachVisual = () => (
  <div className="relative w-full h-44 flex items-center justify-center">
    <div className="absolute left-2 top-2 w-[46%] rounded-xl bg-[#1a1a2e] text-white p-3 shadow-xl rotate-1 z-10">
      <p className="text-[9px] opacity-50 mb-0.5">Campaign active</p>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold">312</span>
        <span className="text-[9px] font-semibold text-[#C8FF00]">sent</span>
      </div>
      <p className="text-[8px] opacity-40 mt-0.5">DMs this week</p>
    </div>
    <div className="absolute right-1 top-1 w-[50%] rounded-xl bg-white shadow-md p-2.5 -rotate-1 z-20 border border-border/50">
      <p className="text-[9px] font-medium mb-1.5" style={{ color: "hsl(var(--aeline-dark))" }}>Sequence steps</p>
      <div className="space-y-1.5">
        {[
          { step: "Connect request", status: "Sent ✓", color: "#22c55e" },
          { step: "Follow-up #1", status: "Queued", color: "#1A8FE3" },
          { step: "Follow-up #2", status: "Scheduled", color: "#C8FF00" },
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-[8px] font-medium flex-1" style={{ color: "hsl(var(--aeline-dark))" }}>{s.step}</span>
            <span className="text-[7px] text-muted-foreground">{s.status}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/* ── Visual 3: AI SDR Agent ── */
const AiSdrVisual = () => (
  <div className="relative w-full h-44 flex items-center justify-center">
    <div className="absolute left-2 top-1 w-[46%] rounded-xl bg-[#1a1a2e] text-white p-3 shadow-xl -rotate-1 z-10">
      <div className="flex items-center gap-1.5 mb-2">
        <Bot className="w-3.5 h-3.5 text-[#C8FF00]" />
        <span className="text-[9px] font-medium opacity-80">AI SDR active</span>
      </div>
      <div className="space-y-1">
        <div className="bg-white/10 rounded-md px-2 py-1">
          <p className="text-[7px] opacity-60">Lead:</p>
          <p className="text-[8px]">"Sounds interesting, tell me more"</p>
        </div>
        <div className="bg-[#C8FF00]/20 rounded-md px-2 py-1">
          <p className="text-[7px] opacity-60">AI SDR:</p>
          <p className="text-[8px]">"Happy to! Would a quick call work?"</p>
        </div>
      </div>
    </div>
    <div className="absolute right-1 top-2 w-[50%] rounded-xl bg-white shadow-md p-2.5 rotate-1 z-20 border border-border/50">
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

const services = [
  {
    icon: Radar,
    title: "Intent Signal Tracking",
    desc: "Track buying signals across LinkedIn, Reddit, and X in real-time — reach prospects at the exact moment they're ready to buy from you.",
    color: "#1A8FE3",
    Visual: SignalTrackingVisual,
  },
  {
    icon: Send,
    title: "LinkedIn DM Automation",
    desc: "Set up fully automated LinkedIn outreach campaigns — personalized connection requests, follow-ups, and sequences that run on autopilot.",
    color: "#C8FF00",
    Visual: OutreachVisual,
  },
  {
    icon: Bot,
    title: "AI SDR Agent",
    desc: "Instruct your AI SDR to conduct real conversations with leads, handle objections, and guide them to book a meeting in your calendar.",
    color: "#1A8FE3",
    Visual: AiSdrVisual,
  },
];

const ServicesSection = () => {
  const ref = useReveal();

  return (
    <section className="py-20 md:py-32 px-6 bg-background">
      <div ref={ref} className="reveal-up max-w-6xl mx-auto">
        <span className="section-label mb-6 block">Services</span>

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
          <h2 className="text-4xl md:text-5xl font-medium tracking-tight leading-[1.1] max-w-2xl" style={{ color: "hsl(var(--aeline-dark))" }}>
            Comprehensive AI-powered outreach and intelligent automation
          </h2>
          <a href="/register" className="btn-cta shrink-0">
            Get Started
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {services.map((s, i) => (
            <div key={i} className="group rounded-3xl bg-[#f5f5f5] overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer">
              <div className="p-7">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5" style={{ backgroundColor: s.color === "#C8FF00" ? "#C8FF00" : `${s.color}15` }}>
                  <s.icon className="w-5 h-5" style={{ color: s.color === "#C8FF00" ? "#1a1a2e" : s.color }} />
                </div>
                <h3 className="text-xl font-semibold mb-3" style={{ color: "hsl(var(--aeline-dark))" }}>{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
              <div className="px-7 pb-7">
                <div className="w-full rounded-2xl overflow-hidden bg-[#f0f0f0] p-2">
                  <s.Visual />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;

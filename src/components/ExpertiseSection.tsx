import { useEffect, useRef } from "react";
import { TrendingUp, Cpu, Globe, Lightbulb, Zap, ArrowUpRight, Users, MessageSquare, Flame } from "lucide-react";

const useReveal = () => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.classList.add("revealed"); obs.disconnect(); }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
};

const tags1 = ["Signal-Based", "AI Outreach", "Intent-Driven", "Hyper-Personalized"];
const tags2 = ["Warm Leads", "Auto-Pilot", "LinkedIn Native", "Real-Time"];

/* ── Card 1: Signal Detection — Signals dashboard + hot leads ── */
const SignalVisual = () => (
  <div className="relative w-full h-48 flex items-center justify-center">
    {/* Dark signal card */}
    <div className="absolute left-4 top-2 w-44 rounded-2xl bg-[#1a1a2e] text-white p-4 shadow-xl -rotate-3 z-10">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium opacity-80">Signals today</span>
        <Zap className="w-4 h-4 text-[#C8FF00]" />
      </div>
      <p className="text-[10px] opacity-40 mb-2">Across LinkedIn, Reddit, X</p>
      <div className="text-3xl font-bold mb-0.5">127</div>
      <p className="text-[10px] opacity-40">Intent signals detected</p>
    </div>
    {/* White hot leads card */}
    <div className="absolute right-2 top-3 w-48 rounded-2xl bg-white shadow-lg p-3.5 rotate-2 z-20 border border-border/50">
      <p className="text-xs font-medium mb-2" style={{ color: "hsl(var(--aeline-dark))" }}>Hot leads</p>
      <div className="space-y-1.5">
        {[
          { name: "Sarah K.", signal: "Liked competitor post", tier: "🔥" },
          { name: "Mike R.", signal: "Job change detected", tier: "🔥" },
          { name: "James L.", signal: "Visited your profile", tier: "🔥" },
        ].map((l, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-[#f5f5f5] flex items-center justify-center">
                <Flame className="w-3 h-3 text-orange-500" />
              </div>
              <div>
                <p className="text-[10px] font-medium" style={{ color: "hsl(var(--aeline-dark))" }}>{l.name}</p>
                <p className="text-[8px] text-muted-foreground">{l.signal}</p>
              </div>
            </div>
            <span className="text-[10px]">{l.tier}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/* ── Card 2: Outreach — Message sequence + reply rate ── */
const OutreachVisual = () => (
  <div className="relative w-full h-48 flex items-center justify-center">
    {/* Dark reply rate card */}
    <div className="absolute left-4 top-1 w-40 rounded-2xl bg-[#1a1a2e] text-white p-4 shadow-xl -rotate-2 z-10">
      <p className="text-[10px] opacity-50 mb-1">Reply rate</p>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold">38%</span>
        <span className="text-xs font-semibold text-[#C8FF00]">+12%</span>
      </div>
      <p className="text-[10px] opacity-40 mt-1">vs 3% cold outreach</p>
    </div>
    {/* White message sequence card */}
    <div className="absolute right-2 top-2 w-48 rounded-2xl bg-white shadow-lg p-3.5 rotate-2 z-20 border border-border/50">
      <p className="text-xs font-medium mb-2" style={{ color: "hsl(var(--aeline-dark))" }}>Campaign sequence</p>
      <div className="space-y-1.5">
        {[
          { step: "Connect", status: "Sent", color: "#22c55e" },
          { step: "Follow-up 1", status: "Replied ✓", color: "#1A8FE3" },
          { step: "Meeting booked", status: "Done", color: "#C8FF00" },
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="text-[10px] font-medium flex-1" style={{ color: "hsl(var(--aeline-dark))" }}>{s.step}</span>
            <span className="text-[8px] text-muted-foreground">{s.status}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/* ── Card 3: Lead Scoring — AI score + pipeline chart ── */
const ScoringVisual = () => (
  <div className="relative w-full h-48 flex items-center justify-center">
    {/* Dark AI score card */}
    <div className="absolute left-4 top-2 w-44 rounded-2xl bg-[#1a1a2e] text-white p-4 shadow-xl rotate-2 z-10">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium opacity-80">AI lead score</span>
        <TrendingUp className="w-4 h-4 opacity-60" />
      </div>
      <p className="text-[10px] opacity-40 mb-2">This week's pipeline</p>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold">92</span>
        <span className="text-xs font-semibold text-[#C8FF00]">/ 100</span>
      </div>
      <p className="text-[10px] opacity-40 mt-1">Top-tier prospect</p>
    </div>
    {/* Pipeline bar chart */}
    <div className="absolute right-3 bottom-1 w-44 rounded-2xl bg-white shadow-lg p-3.5 -rotate-1 z-20 border border-border/50">
      <p className="text-[9px] font-medium mb-2" style={{ color: "hsl(var(--aeline-dark))" }}>Meetings booked</p>
      <div className="flex items-end gap-1.5 h-14 mb-1.5">
        {[15, 22, 18, 35, 28, 42, 55].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm"
            style={{
              height: `${h}%`,
              backgroundColor: i >= 5 ? "#1A8FE3" : "#e5e7eb",
            }}
          />
        ))}
      </div>
      <div className="flex justify-between text-[7px] text-muted-foreground">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
    </div>
    {/* Floating tags */}
    <div className="absolute right-4 top-4 flex flex-col gap-1.5 z-20">
      {["Signal A ✓", "Signal B ✓"].map((t) => (
        <span key={t} className="px-2.5 py-1 rounded-full border border-border bg-white text-[9px] font-medium shadow-sm" style={{ color: "hsl(var(--aeline-dark))" }}>{t}</span>
      ))}
    </div>
  </div>
);

/* ── Card 4: Conversational AI — Chat + contacts ── */
const ConversationalVisual = () => (
  <div className="relative w-full h-48 flex items-center justify-center">
    {/* Center icon */}
    <div className="w-14 h-14 rounded-2xl bg-[#1a1a2e] flex items-center justify-center shadow-xl z-10">
      <MessageSquare className="w-6 h-6 text-white" />
    </div>
    {/* Orbiting rings */}
    <div className="absolute w-32 h-32 rounded-full border border-border/40" />
    <div className="absolute w-48 h-48 rounded-full border border-border/30" />
    {/* Contact badges */}
    <div className="absolute top-1 right-12 flex items-center gap-1.5 bg-white rounded-full pl-1.5 pr-2.5 py-1 shadow-md border border-border/50 z-20">
      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-[7px] font-bold text-white">SK</div>
      <span className="text-[9px] font-medium" style={{ color: "hsl(var(--aeline-dark))" }}>Replied</span>
      <span className="text-[9px] font-semibold text-[#22c55e]">Hot</span>
    </div>
    <div className="absolute bottom-8 left-4 flex items-center gap-1.5 bg-white rounded-full pl-1.5 pr-2.5 py-1 shadow-md border border-border/50 z-20">
      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-[7px] font-bold text-white">JM</div>
      <span className="text-[9px] font-medium" style={{ color: "hsl(var(--aeline-dark))" }}>Meeting set</span>
      <span className="text-[9px] font-semibold text-[#1A8FE3]">Won</span>
    </div>
    <div className="absolute bottom-2 right-6 flex items-center gap-1.5 bg-white rounded-full pl-1.5 pr-2.5 py-1 shadow-md border border-border/50 z-20">
      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-[7px] font-bold text-white">AR</div>
      <span className="text-[9px] font-medium" style={{ color: "hsl(var(--aeline-dark))" }}>Engaged</span>
      <span className="text-[9px] font-semibold text-[#22c55e]">Warm</span>
    </div>
  </div>
);

const features = [
  {
    title: "AI Signal Detection",
    desc: "Detect buying signals across LinkedIn, Reddit, and X — find prospects already looking for what you offer.",
    Visual: SignalVisual,
  },
  {
    title: "Smart Outreach Sequences",
    desc: "AI writes personalized messages from your LinkedIn. Connect, follow up, and book meetings on autopilot.",
    Visual: OutreachVisual,
  },
  {
    title: "Intelligent Lead Scoring",
    desc: "Every lead is scored by AI based on intent signals, ICP match, and engagement — so you focus on who's ready to buy.",
    Visual: ScoringVisual,
  },
  {
    title: "Conversational AI",
    desc: "AI replies to prospects in real-time with context-aware messages that deepen interest and drive meetings.",
    Visual: ConversationalVisual,
  },
];

const ExpertiseSection = () => {
  const ref = useReveal();

  return (
    <section className="py-20 md:py-32 px-6 bg-background overflow-hidden">
      <div ref={ref} className="reveal-up max-w-6xl mx-auto">
        <span className="section-label mb-6 block">Expertise</span>

        <h2 className="text-4xl md:text-5xl font-medium tracking-tight leading-[1.1] max-w-3xl mb-6" style={{ color: "hsl(var(--aeline-dark))" }}>
          Where human insight meets intelligent technology
        </h2>
        <p className="text-base text-muted-foreground max-w-2xl mb-14 leading-relaxed">
          We help businesses harness technology not to replace human creativity, but to amplify it — enabling smarter decisions and faster growth.
        </p>

        {/* Feature cards - bento grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {features.map((f, i) => (
            <div key={i} className="rounded-3xl bg-[#f5f5f5] p-8 pb-6 flex flex-col group hover:shadow-lg transition-shadow duration-300">
              <f.Visual />
              <h3 className="text-xl font-semibold mb-2 text-center mt-2" style={{ color: "hsl(var(--aeline-dark))" }}>{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed text-center">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Tag marquees */}
        <div className="space-y-3 overflow-hidden">
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none bg-gradient-to-r from-background to-transparent" />
            <div className="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none bg-gradient-to-l from-background to-transparent" />
            <div className="animate-tag-scroll gap-3">
              {[...tags1, ...tags1, ...tags1, ...tags1].map((tag, i) => (
                <span key={i} className="shrink-0 px-5 py-2 rounded-full border border-border text-sm font-medium" style={{ color: "hsl(var(--aeline-dark))" }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none bg-gradient-to-r from-background to-transparent" />
            <div className="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none bg-gradient-to-l from-background to-transparent" />
            <div className="animate-marquee-reverse gap-3">
              {[...tags2, ...tags2, ...tags2, ...tags2].map((tag, i) => (
                <span key={i} className="shrink-0 px-5 py-2 rounded-full border border-border text-sm font-medium" style={{ color: "hsl(var(--aeline-dark))" }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExpertiseSection;

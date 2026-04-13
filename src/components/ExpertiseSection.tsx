import { useEffect, useRef } from "react";
import { TrendingUp, Cpu, Globe, Lightbulb, Zap, ArrowUpRight } from "lucide-react";

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

const tags1 = ["Professional", "Strategic", "AI-Focused", "Startup Feel"];
const tags2 = ["Smarter", "Grow Faster", "Build Smart", "Simple"];

/* ── Card 1: Automation — Performance widget + expense card ── */
const AutomationVisual = () => (
  <div className="relative w-full h-56 flex items-center justify-center">
    {/* Dark performance card */}
    <div className="absolute left-4 top-4 w-44 rounded-2xl bg-[#1a1a2e] text-white p-4 shadow-xl -rotate-3 z-10">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium opacity-80">Performance</span>
        <TrendingUp className="w-4 h-4 opacity-60" />
      </div>
      <p className="text-[10px] opacity-40 mb-2">In the past 7 days</p>
      <div className="text-3xl font-bold mb-0.5">50+</div>
      <p className="text-[10px] opacity-40">Monthly tasks</p>
    </div>
    {/* White expense card */}
    <div className="absolute right-4 top-6 w-48 rounded-2xl bg-white shadow-lg p-4 rotate-2 z-20 border border-border/50">
      <p className="text-xs font-medium mb-1" style={{ color: "hsl(var(--aeline-dark))" }}>Monthly expense</p>
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-xl font-bold" style={{ color: "hsl(var(--aeline-dark))" }}>$4,900</span>
        <span className="text-xs text-muted-foreground">/ $10,000</span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-[#f0f0f0] mb-3">
        <div className="h-full rounded-full bg-[#1A8FE3] w-[49%]" />
      </div>
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-[#f5f5f5] flex items-center justify-center">
                <Zap className="w-3 h-3 text-muted-foreground" />
              </div>
              <div>
                <p className="text-[10px] font-medium" style={{ color: "hsl(var(--aeline-dark))" }}>Automation</p>
                <p className="text-[8px] text-muted-foreground">Nov 14, 2025</p>
              </div>
            </div>
            <span className="text-[10px] font-semibold" style={{ color: "hsl(var(--aeline-dark))" }}>$120</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/* ── Card 2: Analytics — Bar chart + strategy cards ── */
const AnalyticsVisual = () => (
  <div className="relative w-full h-56 flex items-center justify-center">
    {/* Dark strategy card */}
    <div className="absolute left-4 top-2 w-40 rounded-2xl bg-[#1a1a2e] text-white p-4 shadow-xl -rotate-2 z-10">
      <p className="text-[10px] opacity-50 mb-1">Expertise ●</p>
      <p className="text-sm font-semibold leading-tight">
        Strategy, Data, and AI
      </p>
    </div>
    {/* White card with title */}
    <div className="absolute left-28 top-8 w-40 rounded-2xl bg-white shadow-lg p-5 rotate-3 z-20 border border-border/50">
      <p className="text-base font-bold leading-tight" style={{ color: "hsl(var(--aeline-dark))" }}>
        Intelligence in Every Decision
      </p>
    </div>
    {/* Bar chart card */}
    <div className="absolute right-4 bottom-2 w-44 rounded-2xl bg-white shadow-lg p-4 -rotate-1 z-30 border border-border/50">
      <div className="flex items-end gap-1.5 h-16 mb-2">
        {[20, 25, 30, 35, 45, 55, 70].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm"
            style={{
              height: `${h}%`,
              backgroundColor: i === 6 ? "#1A8FE3" : "#e5e7eb",
            }}
          />
        ))}
      </div>
      <div className="flex justify-between text-[7px] text-muted-foreground">
        {["2019", "2020", "2021", "2022", "2023", "2024", "2025"].map((y) => (
          <span key={y}>{y}</span>
        ))}
      </div>
    </div>
  </div>
);

/* ── Card 3: Digital transformation — Tags + stats ── */
const DigitalVisual = () => (
  <div className="relative w-full h-56 flex items-center justify-center">
    {/* Dark card with big number */}
    <div className="absolute left-4 top-6 w-44 rounded-2xl bg-[#1a1a2e] text-white p-5 shadow-xl rotate-2 z-10">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium opacity-80">Performance</span>
        <TrendingUp className="w-4 h-4 opacity-60" />
      </div>
      <p className="text-[10px] opacity-40 mb-2">In the past 7 days</p>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold">49%</span>
        <span className="text-xs font-semibold text-[#C8FF00]">+2.5%</span>
      </div>
      <p className="text-[10px] opacity-40 mt-1">Business growth</p>
    </div>
    {/* Tags floating */}
    <div className="absolute right-4 top-8 flex flex-col gap-2 z-20">
      <div className="flex gap-1.5">
        {["Professional", "Strategic"].map((t) => (
          <span key={t} className="px-3 py-1.5 rounded-full border border-border bg-white text-[10px] font-medium shadow-sm" style={{ color: "hsl(var(--aeline-dark))" }}>{t}</span>
        ))}
      </div>
      <div className="flex gap-1.5">
        {["AI-Focused", "Startup"].map((t) => (
          <span key={t} className="px-3 py-1.5 rounded-full border border-border bg-white text-[10px] font-medium shadow-sm" style={{ color: "hsl(var(--aeline-dark))" }}>{t}</span>
        ))}
      </div>
    </div>
    {/* Data points card */}
    <div className="absolute right-6 bottom-2 w-36 rounded-2xl bg-white shadow-lg p-4 -rotate-2 z-20 border border-border/50">
      <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Data Points</p>
      <p className="text-2xl font-bold" style={{ color: "hsl(var(--aeline-dark))" }}>520k+</p>
    </div>
  </div>
);

/* ── Card 4: Experience intelligence — Users with growth badges ── */
const ExperienceVisual = () => (
  <div className="relative w-full h-56 flex items-center justify-center">
    {/* Center icon */}
    <div className="w-16 h-16 rounded-2xl bg-[#1a1a2e] flex items-center justify-center shadow-xl z-10">
      <ArrowUpRight className="w-7 h-7 text-white" />
    </div>
    {/* Orbiting rings */}
    <div className="absolute w-36 h-36 rounded-full border border-border/40" />
    <div className="absolute w-56 h-56 rounded-full border border-border/30" />
    {/* User badges */}
    <div className="absolute top-3 right-16 flex items-center gap-1.5 bg-white rounded-full pl-1.5 pr-3 py-1 shadow-md border border-border/50 z-20">
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-[8px] font-bold text-white">AS</div>
      <span className="text-[10px] font-medium" style={{ color: "hsl(var(--aeline-dark))" }}>Ann Stanton</span>
      <span className="text-[10px] font-semibold text-[#22c55e]">+2.5%</span>
    </div>
    <div className="absolute bottom-12 left-6 flex items-center gap-1.5 bg-white rounded-full pl-1.5 pr-3 py-1 shadow-md border border-border/50 z-20">
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-[8px] font-bold text-white">LP</div>
      <span className="text-[10px] font-medium" style={{ color: "hsl(var(--aeline-dark))" }}>Lindsey Press</span>
      <span className="text-[10px] font-semibold text-[#22c55e]">+5%</span>
    </div>
    <div className="absolute bottom-4 right-8 flex items-center gap-1.5 bg-white rounded-full pl-1.5 pr-3 py-1 shadow-md border border-border/50 z-20">
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-[8px] font-bold text-white">LC</div>
      <span className="text-[10px] font-medium" style={{ color: "hsl(var(--aeline-dark))" }}>Livia Curtis</span>
      <span className="text-[10px] font-semibold text-[#22c55e]">+6%</span>
    </div>
  </div>
);

const features = [
  {
    title: "Automation & optimization",
    desc: "Streamline your operations through intelligent workflow automation that saves time, reduces errors, and boosts productivity.",
    Visual: AutomationVisual,
  },
  {
    title: "Data analytics & insights",
    desc: "Transform raw data into strategic insight using advanced analytics, dashboards, and predictive modeling.",
    Visual: AnalyticsVisual,
  },
  {
    title: "Digital transformation",
    desc: "We guide organizations through full-scale digital evolution — modernizing systems, processes, and decision-making frameworks.",
    Visual: DigitalVisual,
  },
  {
    title: "Experience intelligence",
    desc: "Combine data and design to deliver smarter, more personalized digital experiences that connect with users.",
    Visual: ExperienceVisual,
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
            <div key={i} className="rounded-3xl bg-[#f5f5f5] p-8 flex flex-col group hover:shadow-lg transition-shadow duration-300">
              <f.Visual />
              <h3 className="text-xl font-semibold mb-3 text-center" style={{ color: "hsl(var(--aeline-dark))" }}>{f.title}</h3>
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

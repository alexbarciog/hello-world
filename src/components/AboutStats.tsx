import { useEffect, useRef, useState } from "react";
import { Zap, Shield } from "lucide-react";

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

const CountUp = ({ end, suffix = "" }: { end: number; suffix?: string }) => {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        let start = 0;
        const duration = 1500;
        const step = (ts: number) => {
          if (!start) start = ts;
          const progress = Math.min((ts - start) / duration, 1);
          setVal(Math.floor(progress * end));
          if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        obs.disconnect();
      }
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [end]);
  return <span ref={ref}>{val}{suffix}</span>;
};

const AboutStats = () => {
  const ref = useReveal();

  return (
    <section className="py-20 md:py-32 px-6 bg-background">
      <div ref={ref} className="reveal-up max-w-6xl mx-auto">
        <span className="section-label mb-6 block">About us</span>

        <h2 className="text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight leading-[1.1] max-w-4xl mb-16" style={{ color: "hsl(var(--aeline-dark))" }}>
          Your next{" "}
          <span className="inline-flex items-center align-middle mx-1">
            <span className="w-9 h-9 rounded-lg bg-[#C8FF00] flex items-center justify-center">
              <Zap className="w-5 h-5 text-[#1a1a2e]" />
            </span>
          </span>{" "}
          best customer is already online — we help you
          <span className="inline-flex items-center align-middle mx-1">
            <span className="w-9 h-9 rounded-lg bg-[#1A8FE3] flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </span>
          </span>{" "}
          reach them first
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Stat card 1 */}
          <div className="rounded-3xl bg-[#f5f5f5] p-8 flex flex-col">
            <div className="text-6xl md:text-7xl font-semibold tracking-tight" style={{ color: "hsl(var(--aeline-dark))" }}>
              <CountUp end={120} suffix="+" />
            </div>
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
              Collaborating with leading AI and cloud technology providers.
            </p>
          </div>

          {/* Stat card 2 */}
          <div className="rounded-3xl bg-[#f5f5f5] p-8 flex flex-col">
            <p className="text-sm text-muted-foreground mb-2">Commitment to measurable</p>
            <div className="text-6xl md:text-7xl font-semibold tracking-tight" style={{ color: "hsl(var(--aeline-dark))" }}>
              <CountUp end={100} suffix="%" />
            </div>
            <div className="mt-6 flex -space-x-2">
              {["MC", "DH", "RB", "AK"].map((initials, i) => (
                <div key={i} className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-[#f5f5f5]">
                  {initials}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3 italic">
              "Their automation strategy completely reshaped how we work. It's efficient, intelligent, and seamless."
            </p>
          </div>

          {/* Stat card 3 */}
          <div className="rounded-3xl bg-[#f5f5f5] p-8 flex flex-col">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-2">Data Points</p>
            <div className="text-6xl md:text-7xl font-semibold tracking-tight" style={{ color: "hsl(var(--aeline-dark))" }}>
              <CountUp end={520} suffix="k+" />
            </div>
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
              Analyzed monthly to power smarter outreach strategies.
            </p>
            <div className="mt-auto pt-6">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-1">Continents</p>
              <div className="text-3xl font-semibold" style={{ color: "hsl(var(--aeline-dark))" }}>20+</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutStats;

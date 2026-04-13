import { useEffect, useRef } from "react";
import { TrendingUp, Cpu, Globe, Lightbulb } from "lucide-react";

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

const features = [
  {
    icon: Cpu,
    title: "Automation & optimization",
    desc: "Streamline your operations through intelligent workflow automation that saves time, reduces errors, and boosts productivity.",
  },
  {
    icon: TrendingUp,
    title: "Data analytics & insights",
    desc: "Transform raw data into strategic insight using advanced analytics, dashboards, and predictive modeling.",
  },
  {
    icon: Globe,
    title: "Digital transformation",
    desc: "We guide organizations through full-scale digital evolution — modernizing systems, processes, and decision-making frameworks.",
  },
  {
    icon: Lightbulb,
    title: "Experience intelligence",
    desc: "Combine data and design to deliver smarter, more personalized digital experiences that connect with users.",
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
              {/* Mini dashboard mockup */}
              <div className="w-full h-40 rounded-2xl bg-white shadow-sm mb-6 p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-medium text-muted-foreground">Performance</div>
                  <div className="w-7 h-7 rounded-lg bg-[#f5f5f5] flex items-center justify-center">
                    <f.icon className="w-4 h-4 text-[#1A8FE3]" />
                  </div>
                </div>
                <div className="flex items-end gap-1">
                  {[40, 65, 45, 80, 55, 90, 70].map((h, j) => (
                    <div key={j} className="flex-1 rounded-sm bg-[#1A8FE3]" style={{ height: `${h}%`, opacity: 0.2 + (h / 100) * 0.8 }} />
                  ))}
                </div>
              </div>

              <h3 className="text-xl font-semibold mb-3" style={{ color: "hsl(var(--aeline-dark))" }}>{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
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

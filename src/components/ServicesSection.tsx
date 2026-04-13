import { useEffect, useRef } from "react";
import { Sparkles, MessageCircle, BarChart3, ArrowUpRight } from "lucide-react";

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

const services = [
  {
    icon: Sparkles,
    title: "AI Signal Detection",
    desc: "We detect high-intent buying signals across LinkedIn, Reddit, and X to find prospects already looking for what you offer.",
    color: "#1A8FE3",
  },
  {
    icon: MessageCircle,
    title: "Smart Outreach",
    desc: "Automated, personalized LinkedIn outreach campaigns that start relevant conversations and book demos on autopilot.",
    color: "#C8FF00",
  },
  {
    icon: BarChart3,
    title: "Data & Insights",
    desc: "Advanced lead scoring, real-time analytics dashboards, and predictive insights to optimize your pipeline.",
    color: "#1A8FE3",
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
                <div className="w-full h-44 rounded-2xl bg-gradient-to-br from-[#1A8FE3]/10 to-[#87CEEB]/20 flex items-center justify-center">
                  <s.icon className="w-16 h-16 text-[#1A8FE3]/20" />
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

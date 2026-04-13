import { useEffect, useRef } from "react";
import { Radar, Send, Bot, ArrowUpRight } from "lucide-react";
import serviceSignals from "@/assets/service-signals.jpg";
import serviceOutreach from "@/assets/service-outreach.jpg";
import serviceData from "@/assets/service-data.jpg";

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
    icon: Radar,
    title: "Intent Signal Tracking",
    desc: "Track buying signals across LinkedIn, Reddit, and X in real-time — reach prospects at the exact moment they're ready to buy from you.",
    color: "#1A8FE3",
    image: serviceSignals,
  },
  {
    icon: Send,
    title: "LinkedIn DM Automation",
    desc: "Set up fully automated LinkedIn outreach campaigns — personalized connection requests, follow-ups, and sequences that run on autopilot.",
    color: "#C8FF00",
    image: serviceOutreach,
  },
  {
    icon: Bot,
    title: "AI SDR Agent",
    desc: "Instruct your AI SDR to conduct real conversations with leads, handle objections, and guide them to book a meeting in your calendar.",
    color: "#1A8FE3",
    image: serviceData,
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
                <div className="w-full h-44 rounded-2xl overflow-hidden bg-[#f0f0f0]">
                  <img src={s.image} alt={s.title} loading="lazy" width={768} height={512} className="w-full h-full object-cover" />
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

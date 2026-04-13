import { useEffect, useRef } from "react";
import { TrendingUp, Cpu, Globe, Lightbulb } from "lucide-react";
import expertiseAutomation from "@/assets/expertise-automation.jpg";
import expertiseAnalytics from "@/assets/expertise-analytics.jpg";
import expertiseDigital from "@/assets/expertise-digital.jpg";
import expertiseExperience from "@/assets/expertise-experience.jpg";

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
    image: expertiseAutomation,
  },
  {
    icon: TrendingUp,
    title: "Data analytics & insights",
    desc: "Transform raw data into strategic insight using advanced analytics, dashboards, and predictive modeling.",
    image: expertiseAnalytics,
  },
  {
    icon: Globe,
    title: "Digital transformation",
    desc: "We guide organizations through full-scale digital evolution — modernizing systems, processes, and decision-making frameworks.",
    image: expertiseDigital,
  },
  {
    icon: Lightbulb,
    title: "Experience intelligence",
    desc: "Combine data and design to deliver smarter, more personalized digital experiences that connect with users.",
    image: expertiseExperience,
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
              {/* Visual */}
              <div className="w-full h-48 rounded-2xl overflow-hidden mb-6 bg-white">
                <img src={f.image} alt={f.title} loading="lazy" width={960} height={640} className="w-full h-full object-cover" />
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

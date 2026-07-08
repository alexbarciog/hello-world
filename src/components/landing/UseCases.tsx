import { motion } from "framer-motion";
import { Command, LayoutGrid, GitBranch, Contrast } from "lucide-react";
import { useLottie } from "lottie-react";
import whyIntentslyIcon from "@/assets/why-intentsly-icon.png.asset.json";
import useCasesAnimation from "@/assets/use-cases-animation.json";
import gradientBg from "@/assets/use-cases-gradient-bg.png.asset.json";

/* ── Benefits (4 cards, matches reference layout) ─────────────────────── */

type Benefit = {
  icon: React.ElementType;
  title: string;
  desc: string;
};

const benefits: Benefit[] = [
  {
    icon: Command,
    title: "Finds Ready Buyers",
    desc: "Spot companies already showing buying signals across LinkedIn, Reddit and X.",
  },
  {
    icon: LayoutGrid,
    title: "Writes Real Messages",
    desc: "AI drafts outreach based on what each lead actually cares about right now.",
  },
  {
    icon: GitBranch,
    title: "Books Meetings 24/7",
    desc: "Follow-ups run automatically so conversations move even while you sleep.",
  },
  {
    icon: Contrast,
    title: "Learns Every Reply",
    desc: "Each response teaches the agent, so your next message performs even better.",
  },
];

/* ── Right-side orbit visual ──────────────────────────────────────────── */

const OrbitVisual = () => {
  const { View } = useLottie(
    { animationData: useCasesAnimation, loop: true, autoplay: true },
    { width: "100%", height: "100%" }
  );

  return (
    <div className="relative w-full aspect-square max-w-[520px] mx-auto">
      {/* Lottie animation */}
      <div className="absolute inset-0 rounded-full overflow-hidden bg-[#F4F5F7]">
        {View}
      </div>
    </div>
  );
};

/* ── Component ────────────────────────────────────────────────────────── */

const UseCases = () => {
  return (
    <section id="use-cases" className="py-20 md:py-32 px-6 bg-background">
      <div className="max-w-6xl mx-auto">
        {/* Header (centered) */}
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
          <div
            className="inline-flex items-center gap-2 text-[13px] font-semibold tracking-[0.02em] text-[#1A8FE3] mb-6 animate-fade-in-up"
            style={{ animationDelay: "40ms" }}
          >
            <img
              src={whyIntentslyIcon.url}
              alt=""
              className="w-5 h-5 object-contain"
            />
            WHY INTENTSLY
          </div>
          <h2
            className="font-medium tracking-[-0.03em] leading-[1.02] text-[#0a0a0a] mb-5 animate-fade-in-up"
            style={{ animationDelay: "80ms", fontSize: "clamp(2.5rem, 5.6vw, 4.75rem)" }}
          >
            Sales agents that book meetings, on autopilot
          </h2>
          <p
            className="text-base md:text-lg text-muted-foreground leading-relaxed animate-fade-in-up"
            style={{ animationDelay: "180ms" }}
          >
            Experience a new era of sales where meetings land in your calendar while you focus on what matters.
          </p>
        </div>

        {/* Two-column bento: 4 cards left, orbit right */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6 lg:gap-8 items-stretch">
          {/* Left: 2x2 grid of benefit cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {benefits.map((b, i) => {
              const Icon = b.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  className="relative bg-white rounded-[24px] p-6 min-h-[260px] flex flex-col overflow-hidden"
                >

                  {/* Icon */}
                  <div className="relative w-11 h-11 rounded-xl bg-[hsl(var(--aeline-dark))] flex items-center justify-center mb-auto">
                    <Icon className="w-5 h-5 text-white" strokeWidth={2} />
                  </div>

                  {/* Text */}
                  <div className="relative mt-16">
                    <h3
                      className="text-lg font-semibold tracking-tight mb-2"
                      style={{ color: "hsl(var(--aeline-dark))" }}
                    >
                      {b.title}
                    </h3>
                    <p className="text-[13.5px] text-muted-foreground leading-relaxed">{b.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Right: orbit visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center justify-center"
          >
            <OrbitVisual />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default UseCases;

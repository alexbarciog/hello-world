import { motion } from "framer-motion";
import { Command, LayoutGrid, GitBranch, Contrast } from "lucide-react";

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

const OrbitVisual = () => (
  <div className="relative w-full aspect-square max-w-[520px] mx-auto">
    {/* Outer circle with vertical line pattern */}
    <div className="absolute inset-0 rounded-full overflow-hidden bg-[#F4F5F7]">
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, rgba(15,23,42,0.06) 0 1px, transparent 1px 6px)",
        }}
      />
    </div>

    {/* Inner white circle */}
    <div className="absolute inset-[18%] rounded-full bg-white shadow-[inset_0_0_0_1px_rgba(15,23,42,0.04)]" />

    {/* Innermost accent ring */}
    <div className="absolute inset-[38%] rounded-full border border-[#1A8FE3]/10" />

    {/* Floating pills */}
    <div className="absolute top-[22%] right-[8%] bg-white rounded-full pl-3 pr-3 py-1.5 shadow-[0_6px_20px_-8px_rgba(15,23,42,0.18)] flex items-center gap-2 text-[12px] font-medium text-foreground">
      LinkedIn <span className="text-base leading-none">💼</span>
    </div>
    <div className="absolute top-[42%] left-[6%] bg-white rounded-full pl-3 pr-3 py-1.5 shadow-[0_6px_20px_-8px_rgba(15,23,42,0.18)] flex items-center gap-2 text-[12px] font-medium text-foreground">
      Reddit <span className="text-base leading-none">👽</span>
    </div>
    <div className="absolute top-[58%] right-[2%] bg-white rounded-full pl-3 pr-3 py-1.5 shadow-[0_6px_20px_-8px_rgba(15,23,42,0.18)] flex items-center gap-2 text-[12px] font-medium text-foreground">
      Global Signals <span className="w-2 h-2 rounded-full bg-[#1A8FE3]" />
    </div>
    <div className="absolute bottom-[14%] left-[28%] bg-white rounded-full pl-3 pr-3 py-1.5 shadow-[0_6px_20px_-8px_rgba(15,23,42,0.18)] flex items-center gap-2 text-[12px] font-medium text-foreground">
      X / Twitter <span className="text-base leading-none">🐦</span>
    </div>
  </div>
);

/* ── Component ────────────────────────────────────────────────────────── */

const UseCases = () => {
  return (
    <section id="use-cases" className="py-20 md:py-32 px-6 bg-background">
      <div className="max-w-6xl mx-auto">
        {/* Header (centered) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-center max-w-3xl mx-auto mb-16 md:mb-20"
        >
          <div className="inline-flex items-center gap-2 text-[13px] font-semibold tracking-[0.02em] text-[#1A8FE3] mb-6">
            <span className="text-[#C8FF00] text-lg leading-none">✱</span>
            WHY INTENTSLY
          </div>
          <h2
            className="text-4xl md:text-6xl font-semibold tracking-[-0.02em] leading-[1.05] mb-5"
            style={{ color: "hsl(var(--aeline-dark))" }}
          >
            Sales agents that book meetings, on autopilot
          </h2>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
            Experience a new era of sales where meetings land in your calendar while you focus on what matters.
          </p>
        </motion.div>

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
                  className="relative bg-white rounded-[24px] border border-black/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.03),0_10px_28px_-16px_rgba(0,0,0,0.10)] p-6 min-h-[260px] flex flex-col overflow-hidden"
                >
                  {/* Faint grid backdrop in the icon zone */}
                  <div
                    className="absolute top-0 left-0 right-0 h-[120px] opacity-[0.05] pointer-events-none"
                    style={{
                      backgroundImage:
                        "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)",
                      backgroundSize: "22px 22px",
                    }}
                  />

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

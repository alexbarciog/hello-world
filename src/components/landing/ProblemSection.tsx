import { motion } from "framer-motion";
import { Target, MessageSquareOff, Clock, X, ArrowRight } from "lucide-react";
import { CountUp } from "@/lib/motion";

const pains = [
  {
    icon: Target,
    title: "Guesswork targeting",
    desc: "Lists aren't buyers.",
  },
  {
    icon: MessageSquareOff,
    title: "Low-response outreach",
    desc: "2% reply rates, burned domains.",
  },
  {
    icon: Clock,
    title: "Missed buying windows",
    desc: "Deals close before you call.",
  },
];

const fakeLeads = [
  { initials: "JD", name: "J. Doe", role: "Marketing Manager" },
  { initials: "MS", name: "M. Smith", role: "Operations Lead" },
  { initials: "AP", name: "A. Patel", role: "Sales Director" },
  { initials: "RK", name: "R. Kim", role: "Growth" },
  { initials: "LB", name: "L. Brown", role: "VP Revenue" },
];

const ColdListMock = () => (
  <div className="bg-[#f0f0f0] p-2 rounded-2xl">
    <div className="bg-white shadow-md rounded-xl p-5 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-muted">
          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
          <span className="text-[11px] font-medium text-muted-foreground">Cold list — 2,418 leads</span>
        </div>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground/70">No signal</span>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[1fr_auto] gap-3 px-1 pb-2 border-b border-border/50">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">Lead</span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">Intent</span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-border/40">
        {fakeLeads.map((l, i) => (
          <div key={i} className="grid grid-cols-[1fr_auto] gap-3 items-center py-2.5 px-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                <span className="text-[10px] font-semibold text-muted-foreground/70">{l.initials}</span>
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-muted-foreground truncate">{l.name}</div>
                <div className="text-[10px] text-muted-foreground/60 truncate">{l.role}</div>
              </div>
            </div>
            <span className="text-xs text-muted-foreground/50 font-mono">—</span>
          </div>
        ))}
      </div>

      {/* Footer stats */}
      <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-destructive" />
          <div className="min-w-0">
            <div className="text-base font-semibold leading-none" style={{ color: "hsl(var(--aeline-dark))" }}>0</div>
            <div className="text-[10px] text-muted-foreground mt-1">in-market right now</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <div className="min-w-0">
            <div className="text-base font-semibold leading-none" style={{ color: "hsl(var(--aeline-dark))" }}>
              <CountUp to={3} duration={1.4} />
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">competitors already reached out</div>
          </div>
        </div>
      </div>

      {/* No-signal watermark */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <motion.span
          initial={{ opacity: 0, rotate: -8, scale: 1.1 }}
          whileInView={{ opacity: 1, rotate: -18, scale: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="text-[64px] font-bold text-destructive/[0.06] tracking-widest select-none"
        >
          NO SIGNAL
        </motion.span>
      </div>
    </div>
  </div>
);

const ProblemSection = () => {
  return (
    <section id="problem" className="py-20 md:py-32 px-6 bg-background">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="max-w-3xl mb-14"
        >
          <span className="section-label mb-6 block">The problem</span>
          <h2 className="text-4xl md:text-5xl font-medium tracking-tight leading-[1.1] mb-4" style={{ color: "hsl(var(--aeline-dark))" }}>
            Cold prospecting is broken
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            You're chasing names. Your competitors are catching timing.
          </p>
        </motion.div>

        <div className="grid grid-cols-12 gap-6 md:gap-8 items-start">
          {/* Left visual */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="col-span-12 lg:col-span-7"
          >
            <ColdListMock />
          </motion.div>

          {/* Right pain stack */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            className="col-span-12 lg:col-span-5"
          >
            <div className="rounded-3xl bg-[#f5f5f5] p-3 md:p-4">
              <div className="divide-y divide-border/50">
                {pains.map((p, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 md:p-5">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-destructive/10 relative">
                      <p.icon className="w-4 h-4 text-destructive" />
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive flex items-center justify-center">
                        <X className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                      </span>
                    </div>
                    <div className="min-w-0 pt-0.5">
                      <h3 className="text-base font-semibold mb-1" style={{ color: "hsl(var(--aeline-dark))" }}>
                        {p.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-snug">{p.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center mt-12 flex flex-col items-center gap-5"
        >
          <p className="text-sm text-muted-foreground">
            Intent fixes all three. ↓
          </p>
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-black/10 bg-white text-sm font-medium hover:border-black/30 hover:shadow-[0_8px_24px_-12px_rgba(15,23,42,0.25)] transition-all group"
            style={{ color: "hsl(var(--aeline-dark))" }}
          >
            See how Intentsly fixes this
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default ProblemSection;

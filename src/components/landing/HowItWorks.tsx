import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Target,
  Radar,
  ListChecks,
  Zap,
  Search,
  Heart,
  Building2,
  Briefcase,
  Check,
  ArrowRight,
  Calendar,
  TrendingUp,
  Sparkles,
} from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;

/* ─────────────── Step 1: ICP mock (large, floating) ─────────────── */
const ICPVisual = () => (
  <div className="relative w-full h-full flex items-center justify-center px-6 py-8">
    {/* Background floating chip — implies scale */}
    <motion.div
      initial={{ opacity: 0, x: 20, y: -10 }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.5, ease: EASE }}
      className="absolute top-8 right-8 bg-white/95 backdrop-blur rounded-xl px-3 py-2 shadow-[0_8px_24px_-8px_rgba(15,23,42,0.18)] border border-black/5 z-0"
    >
      <div className="flex items-center gap-1.5">
        <Sparkles className="w-3 h-3 text-[#1A8FE3]" />
        <span className="text-[10px] font-semibold" style={{ color: "hsl(var(--aeline-dark))" }}>
          12,400 matches
        </span>
      </div>
    </motion.div>

    {/* Main card */}
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.3, ease: EASE }}
      className="relative w-full max-w-[340px] rounded-2xl bg-white shadow-[0_20px_40px_-16px_rgba(15,23,42,0.25)] p-5 border border-black/5 z-10"
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold" style={{ color: "hsl(var(--aeline-dark))" }}>
          Define your ICP
        </p>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.9, ease: EASE }}
          className="flex items-center gap-1 bg-emerald-50 text-emerald-700 rounded-full px-2 py-0.5"
        >
          <Check className="w-3 h-3" strokeWidth={3} />
          <span className="text-[10px] font-semibold">Saved</span>
        </motion.div>
      </div>
      <div className="space-y-2">
        {[
          { label: "Industry", value: "B2B SaaS", icon: Building2 },
          { label: "Role", value: "Head of Sales", icon: Briefcase },
          { label: "Company size", value: "11–200", icon: Target },
        ].map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.4 + i * 0.08, ease: EASE }}
            className="flex items-center gap-2.5 bg-[#f5f5f5] rounded-lg px-3 py-2.5"
          >
            <f.icon className="w-3.5 h-3.5 shrink-0 text-[#1A8FE3]" />
            <span className="text-[11px] text-muted-foreground flex-1">{f.label}</span>
            <span className="text-[11px] font-semibold" style={{ color: "hsl(var(--aeline-dark))" }}>
              {f.value}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  </div>
);

/* ─────────────── Step 2: Signals mock with animated counter ─────────────── */
const AnimatedCounter = ({ from, to }: { from: number; to: number }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const count = useMotionValue(from);
  const rounded = useTransform(count, (v) => Math.round(v).toString());

  useEffect(() => {
    if (!inView) return;
    const controls = animate(count, to, { duration: 1.6, ease: "easeOut" });
    return () => controls.stop();
  }, [inView, count, to]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
};

const SignalsVisual = () => (
  <div className="relative w-full h-full flex items-center justify-center px-6 py-8">
    {/* Main dark counter card */}
    <motion.div
      initial={{ opacity: 0, y: 16, rotate: -3 }}
      whileInView={{ opacity: 1, y: 0, rotate: -2 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.3, ease: EASE }}
      className="relative w-[55%] max-w-[220px] rounded-2xl bg-[#1a1a2e] text-white p-5 shadow-[0_20px_40px_-16px_rgba(15,23,42,0.45)] z-10"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <span className="text-[10px] font-medium opacity-80">Live signals</span>
        </div>
        <Zap className="w-3.5 h-3.5 text-[#C8FF00]" />
      </div>
      <div className="text-5xl font-bold tracking-tight">
        <AnimatedCounter from={100} to={127} />
      </div>
      <p className="text-[10px] opacity-50 mt-1">Detected today</p>
    </motion.div>

    {/* LinkedIn signals card */}
    <motion.div
      initial={{ opacity: 0, x: 20, y: 10 }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.5, ease: EASE }}
      className="absolute right-6 top-1/2 -translate-y-1/2 w-[52%] max-w-[210px] rounded-2xl bg-white shadow-[0_20px_40px_-16px_rgba(15,23,42,0.25)] p-3.5 rotate-1 z-20 border border-black/5"
    >
      <p className="text-[10px] font-semibold mb-2" style={{ color: "hsl(var(--aeline-dark))" }}>
        On LinkedIn
      </p>
      <div className="space-y-1.5">
        {[
          { icon: Search, name: "Posted about CRM", color: "#1A8FE3" },
          { icon: Heart, name: "Liked competitor post", color: "#ef4444" },
          { icon: Radar, name: "New hiring activity", color: "#22c55e" },
          { icon: TrendingUp, name: "Funding round", color: "#8b5cf6" },
        ].map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.7 + i * 0.1, ease: EASE }}
            className="flex items-center gap-1.5"
          >
            <s.icon className="w-3 h-3 shrink-0" style={{ color: s.color }} />
            <span className="text-[10px] font-medium flex-1 truncate" style={{ color: "hsl(var(--aeline-dark))" }}>
              {s.name}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  </div>
);

/* ─────────────── Step 3: Prioritized leads mock ─────────────── */
const PrioritizedVisual = () => (
  <div className="relative w-full h-full flex items-center justify-center px-6 py-8">
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.3, ease: EASE }}
      className="relative w-full max-w-[360px] rounded-2xl bg-white shadow-[0_20px_40px_-16px_rgba(15,23,42,0.25)] p-5 border border-black/5 z-10"
    >
      <div className="flex items-center justify-between mb-3.5">
        <p className="text-xs font-semibold" style={{ color: "hsl(var(--aeline-dark))" }}>
          Today's shortlist
        </p>
        <span className="text-[10px] text-muted-foreground bg-[#f5f5f5] rounded-full px-2 py-0.5 font-medium">
          12 hot
        </span>
      </div>
      <div className="space-y-2">
        {[
          { name: "Sarah K.", co: "Loop AI", role: "VP Sales", tier: "Hot", score: 92, gradient: "from-red-500 to-orange-500", featured: true },
          { name: "Mark D.", co: "Northwind", role: "Head of Growth", tier: "Hot", score: 88, gradient: "from-red-500 to-orange-500", featured: false },
          { name: "Priya S.", co: "Plexa", role: "RevOps Lead", tier: "Warm", score: 71, gradient: "from-amber-400 to-yellow-500", featured: false },
        ].map((l, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.5 + i * 0.1, ease: EASE }}
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 ${
              l.featured ? "bg-gradient-to-r from-[#1A8FE3]/[0.04] to-transparent ring-1 ring-[#1A8FE3]/15" : "bg-[#f5f5f5]"
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-[#1A8FE3]/15 flex items-center justify-center text-[10px] font-bold text-[#1A8FE3]">
              {l.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold truncate" style={{ color: "hsl(var(--aeline-dark))" }}>
                {l.name}
              </p>
              <p className="text-[9px] text-muted-foreground truncate">
                {l.role} · {l.co}
              </p>
            </div>
            {l.featured ? (
              <button className="text-[9px] font-semibold bg-[#1A8FE3] text-white px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                <Calendar className="w-2.5 h-2.5" />
                Book
              </button>
            ) : (
              <span
                className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full text-white bg-gradient-to-r ${l.gradient} shadow-sm`}
              >
                {l.tier} · {l.score}
              </span>
            )}
          </motion.div>
        ))}
      </div>
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.9, ease: EASE }}
        className="text-[10px] text-muted-foreground text-center mt-3"
      >
        + 9 more in your queue
      </motion.p>
    </motion.div>
  </div>
);

/* ─────────────── Step config ─────────────── */
const steps = [
  {
    num: "01",
    title: "You define who matters.",
    subtitle: "Industry, role, company shape — in 60 seconds. We do the rest.",
    proofs: [
      { icon: Check, text: "No CSV uploads" },
      { icon: Check, text: "Edit anytime" },
    ],
    Visual: ICPVisual,
    bgClass: "bg-gradient-to-br from-sky-50 via-sky-50/40 to-white",
    radialClass: "bg-[radial-gradient(circle_at_30%_20%,rgba(26,143,227,0.18),transparent_60%)]",
    visualLeft: false,
  },
  {
    num: "02",
    title: "We catch people asking for what you sell.",
    subtitle: "Every day, your buyers post and comment looking for your exact services. We surface them the moment it happens — before your competitors do.",
    proofs: [
      { icon: Search, text: "Posts & comments scanned in real-time" },
      { icon: Zap, text: "Buying-intent language flagged instantly" },
      { icon: Radar, text: "Updated every hour, 24/7" },
    ],
    Visual: SignalsVisual,
    bgClass: "bg-gradient-to-br from-indigo-50 via-indigo-50/40 to-white",
    radialClass: "bg-[radial-gradient(circle_at_70%_30%,rgba(99,102,241,0.18),transparent_60%)]",
    visualLeft: true,
  },
  {
    num: "03",
    title: "You get a daily shortlist.",
    subtitle: "People showing intent right now — ranked, scored, ready to reach out.",
    proofs: [
      { icon: ArrowRight, text: "12 hot leads/day" },
      { icon: ArrowRight, text: "~8 min to first outreach" },
    ],
    Visual: PrioritizedVisual,
    bgClass: "bg-gradient-to-br from-lime-50 via-lime-50/40 to-white",
    radialClass: "bg-[radial-gradient(circle_at_30%_70%,rgba(200,255,0,0.22),transparent_60%)]",
    visualLeft: false,
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20 md:py-32 px-6 bg-background">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="flex items-end justify-between gap-8 mb-14">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="max-w-2xl"
          >
            <span className="section-label mb-6 block">How it works</span>
            <h2
              className="text-4xl md:text-5xl font-medium tracking-[-0.02em] leading-[1.05] mb-4"
              style={{ color: "hsl(var(--aeline-dark))" }}
            >
              From cold list to qualified pipeline — in 3 moves.
            </h2>
          </motion.div>
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
            className="hidden md:block text-[11px] uppercase tracking-[0.18em] text-muted-foreground pb-2 shrink-0"
          >
            3 steps · ~5 min setup
          </motion.span>
        </div>

        {/* Stacked steps */}
        <div className="space-y-6">
          {steps.map((s, i) => (
            <div key={i}>
              <motion.article
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: EASE }}
                className="rounded-[32px] border border-black/5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_24px_48px_-24px_rgba(0,0,0,0.10)] overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 min-h-[420px]">
                  {/* Copy zone */}
                  <div
                    className={`md:col-span-5 p-8 md:p-12 flex flex-col justify-center relative ${
                      s.visualLeft ? "md:order-2" : ""
                    }`}
                  >
                    <span
                      className="absolute top-6 right-8 md:top-10 md:right-12 text-[88px] font-light leading-none text-[#1A8FE3]/[0.10] select-none pointer-events-none"
                      aria-hidden
                    >
                      {s.num}
                    </span>
                    <span className="text-[11px] uppercase tracking-[0.18em] text-[#1A8FE3] font-semibold mb-4 relative">
                      Step {s.num}
                    </span>
                    <h3
                      className="text-3xl md:text-4xl font-medium tracking-[-0.02em] leading-[1.1] mb-3 relative"
                      style={{ color: "hsl(var(--aeline-dark))" }}
                    >
                      {s.title}
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed mb-6 relative">{s.subtitle}</p>
                    <ul className="space-y-2 relative">
                      {s.proofs.map((p, pi) => (
                        <li key={pi} className="flex items-center gap-2.5 text-sm" style={{ color: "hsl(var(--aeline-dark))" }}>
                          <span className="w-5 h-5 rounded-full bg-[#1A8FE3]/10 flex items-center justify-center shrink-0">
                            <p.icon className="w-3 h-3 text-[#1A8FE3]" strokeWidth={2.5} />
                          </span>
                          <span className="font-medium">{p.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Visual zone */}
                  <div
                    className={`md:col-span-7 relative min-h-[320px] md:min-h-[420px] ${s.bgClass} ${
                      s.visualLeft ? "md:order-1" : ""
                    }`}
                  >
                    <div className={`absolute inset-0 ${s.radialClass}`} />
                    <div
                      className="absolute inset-0 opacity-[0.25]"
                      style={{
                        backgroundImage:
                          "radial-gradient(circle, rgba(15,23,42,0.18) 1px, transparent 1px)",
                        backgroundSize: "18px 18px",
                      }}
                    />
                    <div className="relative h-full">
                      <s.Visual />
                    </div>
                  </div>
                </div>
              </motion.article>

              {/* Mid-section conversion nudge between Step 02 and Step 03 */}
              {i === 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.5, ease: EASE }}
                  className="my-6 mx-2 md:mx-8 rounded-2xl bg-gradient-to-r from-[#1A8FE3]/[0.06] via-[#C8FF00]/[0.10] to-[#1A8FE3]/[0.06] border border-[#1A8FE3]/15 px-5 py-4 flex flex-wrap items-center justify-between gap-3"
                >
                  <p className="text-sm font-medium" style={{ color: "hsl(var(--aeline-dark))" }}>
                    This is what your competitors don't have yet.
                  </p>
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1A8FE3] hover:gap-2.5 transition-all"
                  >
                    Start free
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </motion.div>
              )}
            </div>
          ))}
        </div>

        {/* Closing CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mt-16 md:mt-20 text-center"
        >
          <p
            className="text-2xl md:text-3xl font-medium tracking-[-0.01em] mb-6"
            style={{ color: "hsl(var(--aeline-dark))" }}
          >
            Stop hunting. Start replying.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-[hsl(var(--aeline-dark))] text-white px-7 py-3.5 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity shadow-[0_8px_24px_-8px_rgba(15,23,42,0.4)]"
          >
            Start for $97
            <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-xs text-muted-foreground mt-4">No contract · Cancel anytime · Setup in 5 min</p>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;

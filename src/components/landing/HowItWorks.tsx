import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Sparkles,
  Target,
  Building2,
  Briefcase,
  Check,
  ArrowRight,
  Zap,
  Heart,
  TrendingUp,
  Search,
  Mail,
  Linkedin,
  Calendar,
  BarChart3,
  ArrowUpRight,
} from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;

/* ─────────────── 1/4  Finds & scores best leads ─────────────── */
const FindsVisual = () => {
  const avatars = [
    { top: "8%", left: "12%", size: 44, delay: 0.15, label: "Follows your company" },
    { top: "4%", left: "38%", size: 52, delay: 0.25 },
    { top: "18%", left: "62%", size: 48, delay: 0.35, label: "Active in your space" },
    { top: "2%", left: "82%", size: 42, delay: 0.45 },
    { top: "34%", left: "6%", size: 40, delay: 0.55 },
    { top: "42%", left: "28%", size: 56, delay: 0.2, highlight: true },
    { top: "38%", left: "74%", size: 46, delay: 0.4, label: "Competitor engagement" },
    { top: "58%", left: "50%", size: 44, delay: 0.6 },
  ];
  return (
    <div className="relative w-full h-full min-h-[320px]">
      {avatars.map((a, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.6, y: 12 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, delay: a.delay, ease: EASE }}
          style={{ top: a.top, left: a.left, width: a.size, height: a.size }}
          className={`absolute rounded-2xl bg-white shadow-[0_8px_24px_-8px_rgba(15,23,42,0.18)] border ${
            a.highlight ? "border-[#1A8FE3]/40 ring-2 ring-[#1A8FE3]/20" : "border-black/5"
          } overflow-hidden`}
        >
          <div
            className="w-full h-full"
            style={{
              background: `linear-gradient(135deg, hsl(${(i * 47) % 360} 60% 78%), hsl(${
                (i * 47 + 40) % 360
              } 55% 65%))`,
            }}
          />
        </motion.div>
      ))}

      {/* Signal chips */}
      {[
        { top: "14%", left: "20%", text: "Follows your company", delay: 0.7 },
        { top: "10%", left: "58%", text: "Active in your space", delay: 0.85 },
        { top: "48%", left: "62%", text: "Competitor engagement", delay: 1.0 },
      ].map((c, i) => (
        <motion.div
          key={`c${i}`}
          initial={{ opacity: 0, y: 6 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: c.delay, ease: EASE }}
          style={{ top: c.top, left: c.left }}
          className="absolute bg-[#1A8FE3]/10 border border-[#1A8FE3]/25 rounded-full px-2.5 py-1 flex items-center gap-1.5 backdrop-blur-sm"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#1A8FE3]" />
          <span className="text-[10px] font-semibold text-[#1A8FE3] whitespace-nowrap">
            {c.text}
          </span>
        </motion.div>
      ))}

      {/* Score chip on highlighted lead */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 1.15, ease: EASE }}
        className="absolute top-[70%] left-[30%] bg-[hsl(var(--aeline-dark))] text-[#C8FF00] rounded-xl px-3 py-1.5 shadow-[0_10px_24px_-8px_rgba(15,23,42,0.4)] flex items-center gap-1.5"
      >
        <Sparkles className="w-3 h-3" />
        <span className="text-[11px] font-bold tracking-tight">Score 94 · Hot</span>
      </motion.div>
    </div>
  );
};

/* ─────────────── 2/4  Only best prospects ─────────────── */
const PreFilteredVisual = () => {
  const leads = [
    { name: "Emma Thompson", role: "Marketing Director", intent: null, score: null, dim: true },
    { name: "Noah Patel", role: "Product Manager", intent: null, score: null, dim: true },
    { name: "Olivia Garcia", role: "Customer Success Manager", intent: "low intent", score: 42, dim: true },
    { name: "Ava Martinez", role: "UX Designer", intent: "high intent", score: 93, dim: false },
    { name: "Liam Chen", role: "Head of Sales", intent: "high intent", score: 82, dim: false },
  ];
  return (
    <div className="relative w-full h-full min-h-[340px] flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-[380px] space-y-2.5">
        {leads.map((l, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 12 }}
            whileInView={{ opacity: l.dim ? 0.45 : 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 + i * 0.08, ease: EASE }}
            className={`flex items-center gap-3 bg-white rounded-2xl px-3.5 py-2.5 border ${
              l.dim ? "border-black/5" : "border-[#1A8FE3]/25 shadow-[0_10px_28px_-14px_rgba(26,143,227,0.4)]"
            }`}
          >
            <div
              className="w-9 h-9 rounded-full shrink-0"
              style={{
                background: `linear-gradient(135deg, hsl(${(i * 63) % 360} 55% 75%), hsl(${
                  (i * 63 + 30) % 360
                } 50% 60%))`,
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold truncate" style={{ color: "hsl(var(--aeline-dark))" }}>
                {l.name}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">{l.role}</p>
            </div>
            {l.intent && (
              <span
                className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  l.intent === "high intent"
                    ? "bg-[#C8FF00] text-[hsl(var(--aeline-dark))]"
                    : "bg-black/[0.06] text-muted-foreground"
                }`}
              >
                {l.intent}
              </span>
            )}
            {l.score != null && (
              <span
                className={`text-[11px] font-bold ${
                  l.dim ? "text-muted-foreground" : "text-[#1A8FE3]"
                }`}
              >
                {l.score}%
              </span>
            )}
          </motion.div>
        ))}
      </div>

      {/* Filter beam */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.9, ease: EASE }}
        className="absolute top-1/2 -translate-y-1/2 right-4 bg-white/90 backdrop-blur border border-[#1A8FE3]/20 rounded-full px-3 py-1.5 shadow-[0_10px_24px_-8px_rgba(15,23,42,0.15)] flex items-center gap-1.5"
      >
        <Search className="w-3 h-3 text-[#1A8FE3]" />
        <span className="text-[10px] font-semibold" style={{ color: "hsl(var(--aeline-dark))" }}>
          Filtered · 2 kept
        </span>
      </motion.div>
    </div>
  );
};

/* ─────────────── 3/4  Multichannel outreach ─────────────── */
const OutreachVisual = () => {
  const events = [
    { day: "MON", time: "9:00", label: "LinkedIn invite → Emma", color: "bg-[#1A8FE3]/15 text-[#1A8FE3] border-[#1A8FE3]/25", icon: Linkedin },
    { day: "TUE", time: "11:00", label: "Email · Liam", color: "bg-[#C8FF00]/40 text-[hsl(var(--aeline-dark))] border-[#C8FF00]/60", icon: Mail },
    { day: "WED", time: "10:30", label: "Follow-up · Ava", color: "bg-[#1A8FE3]/15 text-[#1A8FE3] border-[#1A8FE3]/25", icon: Linkedin },
    { day: "THU", time: "14:00", label: "Demo booked", color: "bg-emerald-100 text-emerald-700 border-emerald-300", icon: Calendar },
    { day: "FRI", time: "9:30", label: "Reply → Noah", color: "bg-[#C8FF00]/40 text-[hsl(var(--aeline-dark))] border-[#C8FF00]/60", icon: Mail },
  ];
  return (
    <div className="relative w-full h-full min-h-[340px] flex items-center justify-center p-5">
      <div className="w-full max-w-[420px] rounded-2xl bg-white border border-black/5 shadow-[0_20px_40px_-16px_rgba(15,23,42,0.2)] overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-5 border-b border-black/5 bg-[#f9f9fa]">
          {["MON", "TUE", "WED", "THU", "FRI"].map((d) => (
            <div key={d} className="px-2 py-2 text-center text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
              {d}
            </div>
          ))}
        </div>
        {/* Grid rows */}
        <div className="relative grid grid-cols-5 min-h-[240px]">
          {[0, 1, 2, 3, 4].map((c) => (
            <div key={c} className="border-r last:border-r-0 border-black/5">
              {[0, 1, 2].map((r) => (
                <div key={r} className="h-[80px] border-b last:border-b-0 border-black/5" />
              ))}
            </div>
          ))}
          {/* Events overlaid */}
          {events.map((e, i) => {
            const col = ["MON", "TUE", "WED", "THU", "FRI"].indexOf(e.day);
            const top = 8 + i * 18;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.2 + i * 0.12, ease: EASE }}
                style={{ left: `${col * 20 + 1}%`, width: "18%", top: `${top}%` }}
                className={`absolute rounded-lg px-2 py-1.5 border ${e.color} shadow-sm`}
              >
                <div className="flex items-center gap-1 mb-0.5">
                  <e.icon className="w-2.5 h-2.5" />
                  <span className="text-[8px] font-bold opacity-70">{e.time}</span>
                </div>
                <p className="text-[9px] font-semibold leading-tight truncate">{e.label}</p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Floating "coordinated" badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 1.0, ease: EASE }}
        className="absolute bottom-4 right-4 bg-[hsl(var(--aeline-dark))] text-white rounded-full px-3 py-1.5 shadow-[0_10px_24px_-8px_rgba(15,23,42,0.4)] flex items-center gap-1.5"
      >
        <Zap className="w-3 h-3 text-[#C8FF00]" fill="#C8FF00" />
        <span className="text-[10px] font-bold">Coordinated automatically</span>
      </motion.div>
    </div>
  );
};

/* ─────────────── 4/4  Gets better every week ─────────────── */
const LearnsVisual = () => {
  const bars = [32, 44, 40, 58, 52, 68, 74, 82, 78, 90];
  return (
    <div className="relative w-full h-full min-h-[320px] flex items-center justify-center p-6">
      <div className="w-full max-w-[400px] rounded-2xl bg-white border border-black/5 shadow-[0_20px_40px_-16px_rgba(15,23,42,0.2)] p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Reply rate · last 10 weeks
            </p>
            <p className="text-2xl font-bold" style={{ color: "hsl(var(--aeline-dark))" }}>
              +38% <span className="text-[11px] text-emerald-600 font-semibold">▲ vs start</span>
            </p>
          </div>
          <div className="bg-[#C8FF00] rounded-full px-2.5 py-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" style={{ color: "hsl(var(--aeline-dark))" }} />
            <span className="text-[10px] font-bold" style={{ color: "hsl(var(--aeline-dark))" }}>
              Learning
            </span>
          </div>
        </div>

        {/* Bars */}
        <div className="flex items-end justify-between gap-1.5 h-28 mb-3">
          {bars.map((h, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              whileInView={{ height: `${h}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 + i * 0.06, ease: EASE }}
              className={`flex-1 rounded-t-md ${
                i >= bars.length - 3
                  ? "bg-gradient-to-t from-[#1A8FE3] to-[#C8FF00]"
                  : "bg-[#1A8FE3]/25"
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between text-[9px] text-muted-foreground font-medium">
          <span>W1</span>
          <span>W10</span>
        </div>

        {/* Benchmark row */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.9, ease: EASE }}
          className="mt-4 pt-4 border-t border-black/5 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <BarChart3 className="w-3.5 h-3.5 text-[#1A8FE3]" />
            <span className="text-[11px] font-medium" style={{ color: "hsl(var(--aeline-dark))" }}>
              vs. top performers in SaaS
            </span>
          </div>
          <span className="text-[11px] font-bold text-emerald-600">Top 12%</span>
        </motion.div>
      </div>
    </div>
  );
};

/* ─────────────── Blocks ─────────────── */
const blocks = [
  {
    n: "1/4",
    title: "Finds & scores your best leads first",
    body:
      "Your agent detects buying & social signals, scores every prospect against your ideal customer, and prioritizes the ones most likely to convert, before reaching out.",
    Visual: FindsVisual,
    visualLeft: false,
    bg: "bg-gradient-to-br from-[#1A8FE3]/[0.06] via-white to-[#C8FF00]/[0.08]",
    radial: "bg-[radial-gradient(circle_at_70%_30%,rgba(26,143,227,0.18),transparent_60%)]",
  },
  {
    n: "2/4",
    title: "Only your best prospects. Nothing else.",
    body:
      "Every lead is pre-filtered to match your ideal buyer profile. Your agent never wastes a message on someone who was never going to buy.",
    Visual: PreFilteredVisual,
    visualLeft: true,
    bg: "bg-gradient-to-br from-[#C8FF00]/[0.12] via-white to-[#1A8FE3]/[0.06]",
    radial: "bg-[radial-gradient(circle_at_30%_60%,rgba(200,255,0,0.20),transparent_60%)]",
  },
  {
    n: "3/4",
    title: "Multichannel outreach that books demos",
    body:
      "Your agent reaches out via email and socials with AI personalized messages, coordinated automatically, no sequences to build.",
    Visual: OutreachVisual,
    visualLeft: false,
    bg: "bg-gradient-to-br from-[#1A8FE3]/[0.08] via-white to-[#C8FF00]/[0.06]",
    radial: "bg-[radial-gradient(circle_at_70%_60%,rgba(26,143,227,0.16),transparent_60%)]",
  },
  {
    n: "4/4",
    title: "Gets better every week",
    body:
      "Your agent tracks what converts, adjusts automatically, and benchmarks your campaigns against top performers in your industry.",
    Visual: LearnsVisual,
    visualLeft: true,
    bg: "bg-gradient-to-br from-[#C8FF00]/[0.14] via-white to-[#1A8FE3]/[0.08]",
    radial: "bg-[radial-gradient(circle_at_30%_30%,rgba(200,255,0,0.22),transparent_60%)]",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20 md:py-32 px-6 bg-background">
      <div className="max-w-6xl mx-auto">
        {/* Section header — mirrors the Gojiberry hero copy */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mb-16 md:mb-20 max-w-4xl"
        >
          <div className="flex items-center gap-2 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1A8FE3]" />
            <span className="section-label">How it works</span>
          </div>
          <h2
            className="text-4xl md:text-6xl font-medium tracking-[-0.025em] leading-[1.02] mb-5"
            style={{ color: "hsl(var(--aeline-dark))" }}
          >
            Your sales agent runs{" "}
            <span className="text-[#1A8FE3]">24/7.</span> And gets{" "}
            <span className="relative inline-block">
              <span className="relative z-10">better every week.</span>
              <span
                className="absolute left-0 right-0 bottom-1 h-3 bg-[#C8FF00] -z-0 rounded-sm"
                aria-hidden
              />
            </span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
            From finding the right leads to sending the right message, your agent handles it all,
            automatically.
          </p>
        </motion.div>

        {/* Blocks */}
        <div className="space-y-6 md:space-y-8">
          {blocks.map((b, i) => (
            <motion.article
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: EASE }}
              className="rounded-[28px] md:rounded-[36px] border border-black/5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_28px_56px_-28px_rgba(15,23,42,0.14)] overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-12 min-h-0 md:min-h-[440px]">
                {/* Copy zone */}
                <div
                  className={`md:col-span-5 p-7 md:p-12 flex flex-col justify-center ${
                    b.visualLeft ? "md:order-2" : ""
                  }`}
                >
                  <div className="inline-flex items-center gap-1.5 bg-[#1A8FE3]/10 border border-[#1A8FE3]/20 rounded-lg px-2.5 py-1 self-start mb-6">
                    <span className="w-3.5 h-3.5 rounded-[3px] bg-[#1A8FE3] flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                    </span>
                    <span className="text-[11px] font-bold text-[#1A8FE3] tabular-nums">
                      {b.n}
                    </span>
                  </div>
                  <h3
                    className="text-3xl md:text-[40px] font-medium tracking-[-0.025em] leading-[1.05] mb-5"
                    style={{ color: "hsl(var(--aeline-dark))" }}
                  >
                    {b.title}
                  </h3>
                  <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                    {b.body}
                  </p>
                </div>

                {/* Visual zone */}
                <div
                  className={`md:col-span-7 relative min-h-[300px] md:min-h-[440px] ${b.bg} ${
                    b.visualLeft ? "md:order-1" : ""
                  }`}
                >
                  <div className={`absolute inset-0 ${b.radial}`} />
                  <div
                    className="absolute inset-0 opacity-[0.22]"
                    style={{
                      backgroundImage:
                        "radial-gradient(circle, rgba(15,23,42,0.18) 1px, transparent 1px)",
                      backgroundSize: "18px 18px",
                    }}
                  />
                  <div className="relative h-full">
                    <b.Visual />
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        {/* Closing CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mt-16 md:mt-24 text-center"
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
            <ArrowUpRight className="w-4 h-4" />
          </Link>
          <p className="text-xs text-muted-foreground mt-4">
            No contract · Cancel anytime · Setup in 5 min
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;

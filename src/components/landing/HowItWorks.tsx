import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Sparkles,
  Target,
  Building2,
  Briefcase,
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
import findsImage from "@/assets/how-it-works-finds.png.asset.json";
const FindsVisual = () => (
  <img
    src={findsImage.url}
    alt="Leads scored by intent"
    className="w-full h-auto object-contain rounded-[24px] md:rounded-[32px]"
  />
);


/* ─────────────── 2/4  Only best prospects ─────────────── */
import filterImage from "@/assets/how-it-works-filter.png.asset.json";
const PreFilteredImage = () => (
  <img
    src={filterImage.url}
    alt="Only best prospects filtered"
    className="w-full h-auto object-contain rounded-[24px] md:rounded-[32px]"
  />
);
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
import autopilotImage from "@/assets/how-it-works-autopilot.png.asset.json";
const OutreachVisual = () => (
  <img
    src={autopilotImage.url}
    alt="Sales agent books meetings on autopilot"
    className="w-full h-auto object-contain rounded-[24px] md:rounded-[32px]"
  />
);


/* ─────────────── 4/4  Gets better every week ─────────────── */
import learnsImage from "@/assets/how-it-works-learns.png.asset.json";
const LearnsVisual = () => (
  <img
    src={learnsImage.url}
    alt="Agent gets better every week"
    className="w-full h-auto object-contain rounded-[24px] md:rounded-[32px]"
  />
);
const LearnsVisualOld = () => {

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
    stat: "12,400+",
    statLabel: "Buyers detected weekly",
    isImage: true,
    // Vertical gradient bleeds on left/right sides of the visual card (like reference)
    sideGradient:
      "linear-gradient(180deg, rgba(200,255,0,0.55) 0%, rgba(200,255,0,0.15) 40%, rgba(26,143,227,0.35) 100%)",
  },
  {
    n: "2/4",
    title: "Only your best prospects. Nothing else.",
    body:
      "Every lead is pre-filtered to match your ideal buyer profile. Your agent never wastes a message on someone who was never going to buy.",
    Visual: PreFilteredImage,
    isImage: true,
    visualLeft: true,
    stat: "93%",
    statLabel: "Match precision",
    sideGradient:
      "linear-gradient(180deg, rgba(26,143,227,0.45) 0%, rgba(200,255,0,0.25) 60%, rgba(200,255,0,0.55) 100%)",
  },
  {
    n: "3/4",
    title: "Sales Agent that books meetings on AUTOPILOT",
    body:
      "Your AI sales agent runs outreach end-to-end without you lifting a finger. It researches every lead, writes hyper-personalized messages that match their tone and psychology, chooses the best channel and moment, follows up automatically, and books meetings straight into your calendar — while you focus on closing.",
    Visual: OutreachVisual,
    isImage: true,

    visualLeft: false,
    stat: "5×",
    statLabel: "More demos booked",
    sideGradient:
      "linear-gradient(180deg, rgba(200,255,0,0.45) 0%, rgba(26,143,227,0.30) 50%, rgba(26,143,227,0.55) 100%)",
  },
  {
    n: "4/4",
    title: "Gets better every week",
    body:
      "Your agent tracks what converts, adjusts automatically, and benchmarks your campaigns against top performers in your industry.",
    Visual: LearnsVisual,
    visualLeft: true,
    stat: "+38%",
    statLabel: "Reply rate lift in 10 weeks",
    sideGradient:
      "linear-gradient(180deg, rgba(26,143,227,0.35) 0%, rgba(200,255,0,0.45) 55%, rgba(200,255,0,0.60) 100%)",
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
          <h2
            className="font-medium tracking-[-0.03em] leading-[1.02] mb-6"
            style={{ color: "hsl(var(--aeline-dark))", fontSize: "clamp(2.5rem, 5.6vw, 4.75rem)" }}
          >
            Your sales agent runs{" "}
            <span className="text-[#1A8FE3]">24/7.</span> And gets{" "}
            <span className="relative inline-block">
              <span className="relative z-10">better every week.</span>
              <span
                className="absolute left-0 right-0 bottom-1 md:bottom-2 h-3 md:h-4 bg-[#C8FF00] -z-0 rounded-sm"
                aria-hidden
              />
            </span>
          </h2>
          <p className="mt-7 text-lg md:text-xl text-neutral-500 leading-relaxed max-w-xl">
            From finding the right leads to sending the right message, your agent handles it all,
            automatically.
          </p>
        </motion.div>

        {/* Blocks */}
        <div className="space-y-8 md:space-y-10">
          {blocks.map((b, i) => (
            <motion.article
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: EASE }}
              className="overflow-hidden"
            >
              <div className={`grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center ${b.isImage ? '' : 'min-h-0 md:min-h-[480px]'}`}>
                {/* Copy zone — sits outside the visual container */}
                <div
                  className={`md:col-span-5 py-8 md:py-14 flex flex-col justify-center ${
                    b.visualLeft ? "md:order-2" : ""
                  }`}
                >
                  <h3
                    className="text-4xl md:text-5xl font-medium tracking-[-0.035em] leading-[1.02] mb-6"
                    style={{ color: "hsl(var(--aeline-dark))" }}
                  >
                    {b.title}
                  </h3>
                  <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-8">
                    {b.body}
                  </p>

                  {/* Lime CTA pill */}
                  <Link
                    to="/register"
                    className="group inline-flex items-center gap-2 self-start bg-[#C8FF00] text-[hsl(var(--aeline-dark))] px-5 py-3 rounded-full text-sm font-bold hover:bg-[#d4ff33] transition-all shadow-[0_10px_24px_-10px_rgba(200,255,0,0.7)] mb-8"
                  >
                    Start for free
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>

                  {/* Big stat */}
                  <div className="mt-auto pt-4">
                    <p
                      className="text-5xl md:text-6xl font-semibold tracking-[-0.035em] leading-none mb-2"
                      style={{ color: "hsl(var(--aeline-dark))" }}
                    >
                      {b.stat}
                    </p>
                    <p className="text-sm text-muted-foreground">{b.statLabel}</p>
                  </div>
                </div>

                {/* Visual zone — the only rounded container */}
                <div
                  className={`md:col-span-7 relative overflow-hidden rounded-[24px] md:rounded-[32px] ${
                    b.visualLeft ? "md:order-1" : ""
                  } ${
                    b.isImage
                      ? "h-auto"
                      : "h-full min-h-[340px] md:min-h-[480px] bg-[#f5f5f7] border border-black/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_28px_56px_-28px_rgba(15,23,42,0.12)]"
                  }`}
                >
                  {!b.isImage && (
                    <>
                      {/* Left gradient bleed */}
                      <div
                        className="absolute inset-y-0 left-0 w-[14%] blur-2xl opacity-90"
                        style={{ background: b.sideGradient }}
                        aria-hidden
                      />
                      {/* Right gradient bleed */}
                      <div
                        className="absolute inset-y-0 right-0 w-[14%] blur-2xl opacity-90"
                        style={{ background: b.sideGradient }}
                        aria-hidden
                      />
                    </>
                  )}

                  {b.isImage ? (
                    <b.Visual />
                  ) : (
                    /* Inner white card holding the mock */
                    <div className="relative h-full flex items-center justify-center p-6 md:p-10">
                      <div className="relative w-full h-full rounded-2xl md:rounded-3xl bg-white border border-black/[0.05] shadow-[0_20px_50px_-24px_rgba(15,23,42,0.18)] overflow-hidden">
                        <b.Visual />
                      </div>
                    </div>
                  )}
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
          className="mt-20 md:mt-28 text-center"
        >
          <p
            className="text-3xl md:text-5xl font-bold tracking-[-0.03em] mb-8"
            style={{ color: "hsl(var(--aeline-dark))" }}
          >
            Stop hunting. Start replying.
          </p>
          <Link
            to="/register"
            className="group inline-flex items-center gap-2 bg-[#C8FF00] text-[hsl(var(--aeline-dark))] px-7 py-4 rounded-full text-base font-bold hover:bg-[#d4ff33] transition-all shadow-[0_16px_36px_-12px_rgba(200,255,0,0.6)]"
          >
            Start for free
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
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

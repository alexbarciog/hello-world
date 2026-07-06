import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ArrowRight,
  Rocket,
  Sparkles,
  Zap,
  Radar,
  Command,
  LayoutGrid,
  ShieldCheck,
  Timer,
  Target,
  CreditCard,
  Globe2,
  Lock,
  Smartphone,
  Play,
  Linkedin,
  MessageSquare,
  TrendingUp,
  Users,
  Building2,
  Briefcase,
  Search,
  Star,
  Check,
  Send,
  Instagram,
  Facebook,
  Twitter,
  ShoppingCart,
} from "lucide-react";
import intentslyIcon from "@/assets/intentsly-icon.png";

/* ─── Utility: section eyebrow (blue star + uppercase label) ─── */
const Eyebrow = ({ children, color = "#1A5CFF" }: { children: React.ReactNode; color?: string }) => (
  <div className="flex items-center justify-center gap-2 mb-5">
    <span className="inline-block" style={{ color }}>
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden>
        <path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" />
      </svg>
    </span>
    <span className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color }}>
      {children}
    </span>
  </div>
);

const EASE = [0.22, 1, 0.36, 1] as const;

/* ═══════════════════════════════════════════════════════════════
   1. TOP ANNOUNCEMENT BAR
   ═══════════════════════════════════════════════════════════════ */
export const AnnouncementBar = () => (
  <div className="w-full bg-black text-white text-center text-[13px] py-2.5 px-4 font-medium">
    🔥 🚀 127 buyers showed intent on LinkedIn in the last hour — spot them first
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   2. HERO
   ═══════════════════════════════════════════════════════════════ */
export const MonteraHero = () => (
  <section className="relative bg-white overflow-hidden">
    <div className="max-w-[1440px] mx-auto px-6 md:px-10 pt-16 md:pt-24 pb-16 md:pb-20 grid lg:grid-cols-2 gap-12 items-center">
      {/* LEFT: copy */}
      <div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3.5 py-1.5 mb-8"
        >
          <Rocket className="w-3.5 h-3.5 text-[#1A5CFF]" />
          <span className="text-[12px] font-medium text-[#111]">Automated, connected, and effortless</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05, ease: EASE }}
          className="text-[44px] sm:text-[56px] lg:text-[76px] leading-[1.02] tracking-[-0.03em] font-medium text-[#0a0a0a]"
          style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif" }}
        >
          Find people looking to buy your services.{" "}
          <span className="text-[#3B7BFF]">RIGHT NOW!</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: EASE }}
          className="mt-6 max-w-md text-[15px] md:text-[17px] leading-relaxed text-[#6b7280]"
        >
          Power your outbound with real-time buying signals and AI-personalized outreach — before your competitors move.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25, ease: EASE }}
          className="mt-10 flex flex-wrap items-center gap-3"
        >
          <a
            href="/register"
            className="inline-flex items-center gap-2 bg-[#0a0a0a] text-white rounded-full px-6 py-3.5 text-[14px] font-medium hover:bg-[#1a1a1a] transition-colors group"
          >
            Start for $97
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </a>
          <a
            href="https://www.loom.com/share/3dc9408fe0da4b979cb5642333f4b500"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white border border-black/15 text-[#0a0a0a] rounded-full px-6 py-3.5 text-[14px] font-medium hover:bg-black/5 transition-colors group"
          >
            Watch Demo
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </a>
        </motion.div>
      </div>

      {/* RIGHT: gradient panel with floating LinkedIn intent cards */}
      <div className="relative h-[540px] lg:h-[620px]">
        <div
          className="absolute inset-0 rounded-[32px] overflow-hidden"
          style={{
            background:
              "linear-gradient(115deg, #E5FF7A 0%, #7FE8A8 35%, #2ED0C5 65%, #2A7BF0 100%)",
          }}
        >
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.35) 1px, transparent 1px)",
              backgroundSize: "80px 80px",
            }}
          />
        </div>

        {/* TOP: Live intent signal captured from a LinkedIn post */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: EASE }}
          className="absolute top-8 right-4 md:right-8 bg-white rounded-2xl p-4 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.2)] w-[290px]"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-[#0A66C2] flex items-center justify-center">
              <Linkedin className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-[#0a0a0a] leading-tight">Intent captured · LinkedIn post</p>
              <p className="text-[10px] text-[#9ca3af]">2 min ago</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#FEE2E2] px-2 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] animate-pulse" />
              <span className="text-[10px] font-semibold text-[#B91C1C]">HOT</span>
            </span>
          </div>
          <p className="text-[12px] text-[#374151] leading-snug italic">
            "Anyone know a solid outbound agency? Our SDR just quit and pipeline is drying up…"
          </p>
          <div className="mt-3 flex items-center justify-between pt-3 border-t border-black/[0.06]">
            <p className="text-[10px] text-[#6b7280]">Intent score</p>
            <p className="text-[13px] font-semibold text-[#0a0a0a]">96 / 100</p>
          </div>
        </motion.div>

        {/* MAIN: Buyer profile card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: EASE }}
          className="absolute top-[240px] md:top-[260px] left-4 md:left-12 bg-white rounded-[28px] p-6 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.25)] w-[calc(100%-3rem)] md:w-[340px]"
        >
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#3B7BFF] to-[#7C3AED] flex items-center justify-center text-white font-semibold text-[15px]">
              SM
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-[14px] font-semibold text-[#0a0a0a] truncate">Sarah Mitchell</p>
                <span className="inline-flex items-center gap-0.5 rounded-md bg-[#0A66C2]/10 px-1.5 py-0.5">
                  <Linkedin className="w-2.5 h-2.5 text-[#0A66C2]" />
                </span>
              </div>
              <p className="text-[11px] text-[#6b7280] leading-tight">Head of Growth · Northwind SaaS</p>
              <p className="text-[10px] text-[#9ca3af] mt-0.5">Series B · 120 employees</p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <span className="text-[10px] font-medium text-[#6b7280]">Buying signal</span>
            <div className="flex-1 h-1.5 rounded-full bg-black/[0.06] overflow-hidden">
              <div className="h-full w-[92%] rounded-full bg-gradient-to-r from-[#22C55E] to-[#3B7BFF]" />
            </div>
            <span className="text-[11px] font-semibold text-[#0a0a0a]">92%</span>
          </div>

          <div className="mt-4 rounded-xl bg-[#F5F7FB] p-3 flex items-start gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#3B7BFF] mt-0.5 shrink-0" />
            <p className="text-[11px] text-[#374151] leading-snug">
              AI drafted a peer-to-peer LinkedIn invite based on her last 3 posts.
            </p>
          </div>

          <button className="mt-4 w-full rounded-full bg-[#0a0a0a] text-white text-[12px] font-medium py-2.5 inline-flex items-center justify-center gap-1.5">
            Send connection <ArrowRight className="w-3 h-3" />
          </button>
        </motion.div>

        {/* Lime accent: live counter */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.5, ease: EASE }}
          className="absolute top-[270px] right-4 md:right-4 rounded-2xl px-4 py-3 flex items-center gap-3 w-[190px] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.25)]"
          style={{ background: "#C8FF3B" }}
        >
          <div className="w-9 h-9 rounded-lg bg-black flex items-center justify-center">
            <Radar className="w-4 h-4 text-[#C8FF3B]" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-black/60 font-medium">Buyers spotted today</p>
            <p className="text-[17px] font-semibold text-black tracking-tight leading-none mt-0.5">1,284</p>
          </div>
        </motion.div>

        {/* BOTTOM: Reply-received card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.55, ease: EASE }}
          className="absolute bottom-6 right-4 md:right-6 bg-white rounded-2xl px-4 py-3 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.2)] flex items-center gap-3 w-[260px]"
        >
          <div className="w-9 h-9 rounded-lg bg-[#22C55E] flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-[#0a0a0a] leading-tight">Reply received</p>
            <p className="text-[10px] text-[#6b7280] truncate">"Yes — free Thursday for a quick call?"</p>
          </div>
          <span className="text-[10px] font-semibold text-[#22C55E]">+1</span>
        </motion.div>
      </div>
    </div>

    {/* Logo row */}
    <div className="max-w-[1440px] mx-auto px-6 md:px-10 pb-14 grid grid-cols-2 md:grid-cols-6 items-center gap-8">
      <p className="text-[13px] text-[#6b7280] leading-snug col-span-2 md:col-span-1">
        Trusted by hundreds of<br />leading teams —
      </p>
      {["Stripe", "Notion", "Linear", "Vercel", "Framer"].map((name) => (
        <div key={name} className="flex items-center justify-center opacity-40 hover:opacity-70 transition-opacity">
          <span className="text-[22px] font-bold tracking-tight text-[#9ca3af]">{name}</span>
        </div>
      ))}
    </div>
  </section>
);

/* ═══════════════════════════════════════════════════════════════
   3. LIMITLESS ACCESS — feature grid + globe
   ═══════════════════════════════════════════════════════════════ */
import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";

const CountUpNumber = ({
  to,
  suffix = "",
  prefix = "",
  duration = 1.2,
  format = (n: number) => Math.round(n).toString(),
}: {
  to: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  format?: (n: number) => string;
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const [val, setVal] = useState(reduce ? to : 0);

  useEffect(() => {
    if (!inView || reduce) {
      if (reduce) setVal(to);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min((t - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(eased * to);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration, reduce]);

  return (
    <span ref={ref}>
      {prefix}
      {format(val)}
      {suffix}
    </span>
  );
};

const FeatureCell = ({
  Icon,
  title,
  body,
  index = 0,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  title: React.ReactNode;
  body: string;
  index?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-60px" }}
    transition={{ duration: 0.55, delay: index * 0.08, ease: EASE }}
    whileHover={{ y: -3 }}
    className="group rounded-[24px] p-6 md:p-8 border border-black/[0.06] hover:border-black/[0.12] bg-white relative overflow-hidden min-h-[220px] flex flex-col justify-between transition-colors"
    style={{
      backgroundImage:
        "linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)",
      backgroundSize: "40px 40px",
    }}
  >
    <motion.div
      whileHover={{ scale: 1.08, rotate: 3 }}
      transition={{ type: "spring", stiffness: 300, damping: 18 }}
      className="w-11 h-11 rounded-xl bg-[#0a0a0a] flex items-center justify-center relative z-10 group-hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.35)]"
    >
      <Icon className="w-5 h-5 text-white" />
    </motion.div>
    <div className="relative z-10">
      <h3 className="text-[19px] font-semibold text-[#0a0a0a] tracking-tight mb-2">{title}</h3>
      <p className="text-[13px] text-[#6b7280] leading-relaxed">{body}</p>
    </div>
  </motion.div>
);

export const LimitlessAccess = () => {
  const reduce = useReducedMotion();
  const loopProps = reduce ? {} : undefined;

  return (
    <section className="bg-white py-24 md:py-32 px-6 md:px-10">
      <div className="max-w-[1240px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: EASE }}
          className="text-center max-w-3xl mx-auto mb-14"
        >
          <Eyebrow>Live Buyer Intent</Eyebrow>
          <h2
            className="text-[36px] md:text-[54px] leading-[1.05] tracking-[-0.02em] font-medium text-[#0a0a0a]"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Buyers are posting about their pain right now.<br />We put them in front of you first.
          </h2>
          <p className="mt-5 text-[15px] md:text-[16px] text-[#6b7280]">
            Scanning 12M+ LinkedIn posts, comments, and job changes every day — surfacing only the people ready to buy what you sell.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="relative md:col-span-2">
            {/* Soft gradient bleed behind the 4 cards */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 -m-8 z-0"
              style={{
                background:
                  "radial-gradient(60% 55% at 50% 50%, rgba(200,255,0,0.35) 0%, rgba(200,255,0,0.15) 25%, rgba(26,143,227,0.18) 55%, rgba(26,143,227,0) 80%)",
                filter: "blur(28px)",
              }}
            />
            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FeatureCell
                index={0}
                Icon={Radar}
                title="Catch buyers first"
                body="See who's asking for what you sell — minutes after they post it on LinkedIn."
              />
              <FeatureCell
                index={1}
                Icon={Target}
                title="Only real buyers"
                body="We read every post so you don't. You only see leads with real budget and intent."
              />
              <FeatureCell
                index={2}
                Icon={MessageSquare}
                title="Message ready to send"
                body="Each lead comes with an AI-drafted opener based on what they just said."
              />
              <FeatureCell
                index={3}
                Icon={Globe2}
                title="Anywhere your buyers are"
                body="Works across 80+ countries and every industry — wherever your ICP is posting."
              />
            </div>
          </div>

          {/* Globe/tracker column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
            className="rounded-[24px] border border-black/[0.06] bg-white p-8 relative overflow-hidden min-h-[460px] md:min-h-full flex items-center justify-center"
          >
            {/* Live pill */}
            <div className="absolute top-5 left-1/2 -translate-x-1/2 z-20 inline-flex items-center gap-1.5 rounded-full bg-black text-white px-3 py-1.5 shadow-md">
              <span className="relative flex w-1.5 h-1.5">
                {!reduce && (
                  <span className="absolute inline-flex h-full w-full rounded-full bg-[#22C55E] opacity-75 animate-ping" />
                )}
                <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-[#22C55E]" />
              </span>
              <span className="text-[10px] font-semibold tracking-wide">Live signals · updated every 60s</span>
            </div>

            <div className="relative w-full h-full flex items-center justify-center">
              {/* Concentric rings */}
              {[300, 220, 140].map((size, i) => (
                <motion.div
                  key={size}
                  className="absolute rounded-full border border-black/[0.06]"
                  style={{
                    width: size,
                    height: size,
                    background:
                      i === 0
                        ? "repeating-linear-gradient(90deg, rgba(0,0,0,0.04) 0 1px, transparent 1px 6px)"
                        : "transparent",
                  }}
                  animate={reduce ? {} : { rotate: i === 1 ? -360 : 360 }}
                  transition={{ duration: i === 0 ? 60 : i === 1 ? 40 : 80, repeat: Infinity, ease: "linear" }}
                />
              ))}

              {/* Country pills — gently floating */}
              {[
                { cls: "top-6 right-8", label: "USA", flag: "🇺🇸", delay: 0 },
                { cls: "top-1/2 left-4 -translate-y-4", label: "Germany", flag: "🇩🇪", delay: 0.8 },
                { cls: "bottom-16 left-8", label: "UK", flag: "🇬🇧", delay: 1.4 },
              ].map((p) => (
                <motion.div
                  key={p.label}
                  className={`absolute ${p.cls} bg-white rounded-full px-3 py-1.5 shadow-md border border-black/5 flex items-center gap-1.5`}
                  animate={reduce ? {} : { y: [0, -5, 0] }}
                  transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut", delay: p.delay }}
                >
                  <span className="text-[11px] font-semibold text-[#0a0a0a]">{p.label}</span>
                  <span>{p.flag}</span>
                </motion.div>
              ))}
              <motion.div
                className="absolute bottom-8 right-4 bg-white rounded-full px-3 py-1.5 shadow-md border border-black/5 flex items-center gap-1.5"
                animate={reduce ? {} : { y: [0, -5, 0] }}
                transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              >
                <span className="text-[11px] font-semibold text-[#0a0a0a]">+76 more</span>
                <span className="w-2 h-2 rounded-full bg-[#3B7BFF]" />
              </motion.div>

              {/* Center dot with broadcast ring */}
              <div className="relative z-10 flex items-center justify-center">
                {!reduce && (
                  <motion.span
                    className="absolute w-3 h-3 rounded-full bg-[#3B7BFF]"
                    animate={{ scale: [1, 2.6], opacity: [0.55, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                  />
                )}
                <motion.div
                  className="w-3 h-3 rounded-full bg-[#3B7BFF] relative z-10"
                  animate={reduce ? {} : { boxShadow: ["0 0 18px rgba(59,123,255,0.45)", "0 0 34px rgba(59,123,255,0.75)", "0 0 18px rgba(59,123,255,0.45)"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};



/* ═══════════════════════════════════════════════════════════════
   4. FUTURE — bento grid (light gray bg)
   ═══════════════════════════════════════════════════════════════ */
const BentoCard = ({
  title,
  body,
  children,
  className = "",
}: {
  title: string;
  body: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`rounded-[28px] bg-white border border-black/[0.05] p-7 md:p-9 flex flex-col ${className}`}
  >
    <h3
      className="text-[24px] md:text-[28px] font-medium text-[#0a0a0a] tracking-[-0.01em] mb-3"
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
    >
      {title}
    </h3>
    <p className="text-[14px] text-[#6b7280] leading-relaxed max-w-md">{body}</p>
    <a href="#" className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#0a0a0a] hover:gap-2 transition-all">
      Learn More <ArrowRight className="w-3.5 h-3.5" />
    </a>
    <div className="mt-6 flex-1 min-h-[180px] relative">{children}</div>
  </div>
);

export const FutureBento = () => (
  <section className="bg-[#f4f4f2] py-24 md:py-32 px-6 md:px-10">
    <div className="max-w-[1240px] mx-auto">
      <div className="text-center max-w-3xl mx-auto mb-14">
        <Eyebrow>Future We're Building</Eyebrow>
        <h2
          className="text-[36px] md:text-[54px] leading-[1.05] tracking-[-0.02em] font-medium text-[#0a0a0a]"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Powering the next generation<br />of founder-led outbound
        </h2>
        <p className="mt-5 text-[15px] text-[#6b7280]">
          Empowering operators with the tools, speed, and precision to win
        </p>
      </div>

      {/* Row 1: 2 wide cards */}
      <div className="grid md:grid-cols-2 gap-5 mb-5">
        <BentoCard
          title="ICP Discovery"
          body="Define your ideal buyer once — industry, role, company shape. Our engine finds them across every platform, every hour."
        >
          <svg viewBox="0 0 300 160" className="w-full h-full">
            <defs>
              <linearGradient id="line1" x1="0" x2="1">
                <stop offset="0%" stopColor="#3B7BFF" stopOpacity="0" />
                <stop offset="50%" stopColor="#3B7BFF" stopOpacity="1" />
                <stop offset="100%" stopColor="#3B7BFF" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[20, 60, 100, 140].map((y) => (
              <line key={y} x1="30" x2="290" y1={y} y2={y} stroke="rgba(0,0,0,0.05)" />
            ))}
            <path d="M30 130 Q 80 120 130 90 T 230 45 T 290 30" fill="none" stroke="url(#line1)" strokeWidth="2.5" />
            <text x="220" y="60" className="text-[10px]" fill="#0a0a0a" fontSize="10">Founders</text>
            <text x="180" y="95" className="text-[10px]" fill="#6b7280" fontSize="10">VP Sales</text>
            <text x="120" y="120" className="text-[10px]" fill="#6b7280" fontSize="10">Head of Growth</text>
          </svg>
        </BentoCard>

        <BentoCard
          title="Signals That Convert"
          body="AI scores every buying signal by intent — you focus only on people ready to talk, not names on a list."
        >
          <div className="relative w-full h-full flex items-center justify-center">
            <svg viewBox="0 0 200 120" className="w-56 h-32">
              <path d="M20 90 A 80 80 0 0 1 180 90" fill="none" stroke="#f3f4f6" strokeWidth="14" />
              <path d="M20 90 A 80 80 0 0 1 180 90" fill="none" stroke="url(#g1)" strokeWidth="14" strokeLinecap="round" strokeDasharray="200 300" />
              <defs>
                <linearGradient id="g1" x1="0" x2="1">
                  <stop offset="0%" stopColor="#F59E0B" />
                  <stop offset="50%" stopColor="#EF4444" />
                  <stop offset="100%" stopColor="#3B7BFF" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pt-4">
              <p className="text-[38px] font-medium tracking-tight text-[#0a0a0a]">92<span className="text-[20px] text-[#6b7280]">/100</span></p>
              <p className="text-[11px] text-[#6b7280]">Intent score</p>
            </div>
          </div>
        </BentoCard>
      </div>

      {/* Row 2: 3 cards */}
      <div className="grid md:grid-cols-3 gap-5">
        <BentoCard
          title="Calendar Connected"
          body="Book meetings straight from signals. One-click scheduling through Calendly, Cal.com, Google Calendar and Teams."
        >
          <div className="flex flex-wrap gap-2">
            {[
              {
                name: "Calendly",
                bg: "#006BFF",
                svg: (
                  <svg viewBox="0 0 16 16" className="w-3.5 h-3.5">
                    <path d="M2 5c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2v5c0 1.1-.9 2-2 2H9.5l-1.5 1.5-1.5-1.5H4c-1.1 0-2-.9-2-2V5z" fill="white" />
                    <circle cx="8" cy="7.5" r="2" fill="#006BFF" />
                  </svg>
                ),
              },
              {
                name: "Cal.com",
                bg: "#111827",
                svg: (
                  <svg viewBox="0 0 16 16" className="w-3.5 h-3.5">
                    <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="6" fontWeight="700" fontFamily="sans-serif">cal</text>
                  </svg>
                ),
              },
              {
                name: "Google Calendar",
                bg: "#fff",
                svg: (
                  <svg viewBox="0 0 16 16" className="w-3.5 h-3.5">
                    <rect x="1" y="1" width="6.5" height="6.5" rx="1.5" fill="#4285F4" />
                    <rect x="8.5" y="1" width="6.5" height="6.5" rx="1.5" fill="#34A853" />
                    <rect x="1" y="8.5" width="6.5" height="6.5" rx="1.5" fill="#EA4335" />
                    <rect x="8.5" y="8.5" width="6.5" height="6.5" rx="1.5" fill="#FBBC05" />
                  </svg>
                ),
              },
              {
                name: "Microsoft Teams",
                bg: "#6264A7",
                svg: (
                  <svg viewBox="0 0 16 16" className="w-3.5 h-3.5">
                    <circle cx="10" cy="6" r="2.5" fill="white" />
                    <path d="M6 9c1.5 0 2.5 1 2.5 2.5V13h-5v-1.5c0-1.5 1-2.5 2.5-2.5z" fill="white" />
                    <circle cx="12" cy="12" r="2" fill="white" />
                  </svg>
                ),
              },
            ].map((item) => (
              <div
                key={item.name}
                className="flex items-center gap-1.5 rounded-lg bg-white border border-black/5 shadow-sm px-2.5 py-1.5"
              >
                <div
                  className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                  style={{ backgroundColor: item.bg, border: item.bg === "#fff" ? "1px solid #e5e7eb" : "none" }}
                >
                  {item.svg}
                </div>
                <span className="text-[10px] font-medium text-[#0a0a0a] whitespace-nowrap">{item.name}</span>
              </div>
            ))}
          </div>
        </BentoCard>

        <BentoCard
          title="Pipeline Insight"
          body="Real-time visibility into signals, replies and booked meetings — no more guessing what's working."
        >
          <div className="rounded-xl bg-[#f8f9fb] p-3">
            <div className="flex justify-between text-[10px] text-[#6b7280] mb-2">
              <span>Signals</span><span>Meetings</span>
            </div>
            <div className="flex justify-between text-[13px] font-semibold text-[#0a0a0a] mb-3">
              <span>+523</span><span>+18</span>
            </div>
            <svg viewBox="0 0 200 60" className="w-full h-14">
              <path d="M0 40 L 30 30 L 60 45 L 90 20 L 120 25 L 150 12 L 200 18" fill="none" stroke="#3B7BFF" strokeWidth="2" />
              <path d="M0 45 L 30 42 L 60 48 L 90 35 L 120 40 L 150 30 L 200 32" fill="none" stroke="#C8FF3B" strokeWidth="2" />
            </svg>
          </div>
        </BentoCard>

        <BentoCard
          title="Reply Automation"
          body="AI SDR handles conversations in your voice — books meetings while you focus on closing."
        >
          <div className="space-y-2">
            {[
              { label: "Auto-reply", val: "ON" },
              { label: "Follow-ups", val: "3 steps" },
            ].map((r) => (
              <div key={r.label} className="flex items-center justify-between rounded-lg bg-[#f8f9fb] px-3 py-2.5">
                <span className="text-[12px] text-[#6b7280]">{r.label}</span>
                <span className="text-[12px] font-semibold text-[#0a0a0a]">{r.val}</span>
              </div>
            ))}
            <button className="w-full rounded-lg bg-[#3B7BFF] text-white text-[12px] font-medium py-2.5 mt-1">Activate</button>
          </div>
        </BentoCard>
      </div>
    </div>
  </section>
);

/* ═══════════════════════════════════════════════════════════════
   5. DARK — INSTANT AD-READY (with vertical accent bars)
   ═══════════════════════════════════════════════════════════════ */
const AccentRow = ({
  Icon,
  title,
  body,
  color,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  color: string;
}) => (
  <div className="flex gap-5 py-6 border-t border-white/10 first:border-t-0">
    <div
      className="w-[3px] shrink-0 rounded-full"
      style={{
        background: `linear-gradient(180deg, ${color} 0%, transparent 100%)`,
      }}
    />
    <div className="flex-1">
      <Icon className="w-5 h-5 text-white/80 mb-4" />
      <h4 className="text-[19px] font-semibold text-white mb-2">{title}</h4>
      <p className="text-[13px] text-white/60 mb-3 leading-relaxed">{body}</p>
      <a href="#" className="text-[12px] font-medium text-white/80 hover:text-white inline-flex items-center gap-1.5">
        Learn More <ArrowRight className="w-3 h-3" />
      </a>
    </div>
  </div>
);

export const AdReady = () => (
  <section className="relative bg-black text-white py-24 md:py-32 px-6 md:px-10 overflow-hidden">
    <div
      className="absolute inset-x-0 top-0 h-[400px] pointer-events-none"
      style={{
        background:
          "radial-gradient(ellipse 800px 300px at 20% 0%, rgba(200,255,59,0.25), transparent 70%)",
      }}
    />
    <div className="max-w-[1240px] mx-auto grid lg:grid-cols-2 gap-16 relative">
      <div>
        <Eyebrow color="#C8FF3B">Instant Outreach-Ready</Eyebrow>
        <h2
          className="text-[36px] md:text-[54px] leading-[1.05] tracking-[-0.02em] font-medium"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Professional AI SDR for<br />impactful outreach
        </h2>
        <p className="mt-6 max-w-md text-[15px] text-white/60 leading-relaxed">
          Personalized, human-sounding messages crafted from live signals — designed to grab attention and drive real replies from real buyers.
        </p>
        <a
          href="/register"
          className="mt-8 inline-flex items-center gap-2 bg-[#C8FF3B] text-black rounded-full px-6 py-3.5 text-[14px] font-medium hover:bg-[#d4ff5c] transition-colors"
        >
          Request Demo <ArrowRight className="w-4 h-4" />
        </a>
      </div>

      <div>
        <AccentRow
          Icon={Command}
          color="#22C55E"
          title="Personalized in Seconds"
          body="Every message references the exact post, comment, or signal that flagged the buyer — no generic templates."
        />
        <AccentRow
          Icon={Globe2}
          color="#F97316"
          title="Multi-Channel Reach"
          body="LinkedIn DMs, connection requests and comments — orchestrated as one flowing conversation."
        />
        <AccentRow
          Icon={Lock}
          color="#EC4899"
          title="Safe & Compliant"
          body="Human-sending speeds, warm-up sequences and reply guards protect your sender reputation."
        />
        <AccentRow
          Icon={Smartphone}
          color="#C8FF3B"
          title="Reply Anywhere"
          body="Unibox brings every reply into one thread — approve, edit or let AI take over."
        />
      </div>
    </div>
  </section>
);

/* ═══════════════════════════════════════════════════════════════
   6. ALL-IN-ONE — integration icon grid
   ═══════════════════════════════════════════════════════════════ */
export const AllInOne = () => {
  const icons = [
    { c: "#22C55E", label: "L" }, { c: "#C8FF3B", label: "R" }, { c: "#1E3A8A", label: "X" },
    { c: "#EAB308", label: "H" }, { c: "#EF4444", label: "S" }, { c: "#3B7BFF", label: "N" },
    { c: "#8B5CF6", label: "G" }, { c: "#06B6D4", label: "C" },
  ];
  return (
    <section className="bg-white py-24 md:py-32 px-6 md:px-10">
      <div className="max-w-[1240px] mx-auto">
        <h2
          className="text-center text-[36px] md:text-[64px] leading-[1.02] tracking-[-0.02em] font-medium mb-16"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          <span className="text-black/25">All-in-One Outbound</span><br />
          <span className="text-[#3B7BFF]">and Simplified</span>
        </h2>

        <div className="relative max-w-4xl mx-auto">
          <div
            className="grid grid-cols-7 md:grid-cols-13 gap-3"
            style={{ gridTemplateColumns: "repeat(13, minmax(0, 1fr))" }}
          >
            {Array.from({ length: 91 }).map((_, i) => {
              const iconIdx = [16, 32, 44, 58, 62, 74, 82].indexOf(i);
              if (iconIdx >= 0 && icons[iconIdx]) {
                const ic = icons[iconIdx];
                return (
                  <div
                    key={i}
                    className="aspect-square rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg"
                    style={{ background: ic.c }}
                  >
                    {ic.label}
                  </div>
                );
              }
              return (
                <div
                  key={i}
                  className="aspect-square rounded-xl bg-black/[0.02] border border-black/[0.03]"
                />
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════
   7. DARK SPACE — Powering next-gen (with sphere)
   ═══════════════════════════════════════════════════════════════ */

/* Animated dotted 3D globe with pulsing intent pings */
const IntentGlobe = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * DPR;
      canvas.height = rect.height * DPR;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // Build dot grid on sphere (uniform-ish distribution)
    const dots: { lat: number; lon: number }[] = [];
    for (let lat = -80; lat <= 80; lat += 5) {
      const circumference = Math.cos((lat * Math.PI) / 180);
      const count = Math.max(6, Math.round(90 * circumference));
      for (let i = 0; i < count; i++) {
        const lon = (i / count) * 360 - 180;
        dots.push({ lat, lon });
      }
    }

    // Fixed intent pings (real-ish city coords)
    const pings = [
      { lat: 40.71, lon: -74.0, delay: 0.0, label: "NYC" },     // New York
      { lat: 37.77, lon: -122.4, delay: 0.6, label: "SF" },     // San Francisco
      { lat: 51.5, lon: -0.12, delay: 1.1, label: "LDN" },      // London
      { lat: 48.85, lon: 2.35, delay: 1.6, label: "PAR" },      // Paris
      { lat: 52.52, lon: 13.4, delay: 2.1, label: "BER" },      // Berlin
      { lat: 1.35, lon: 103.8, delay: 2.6, label: "SGP" },      // Singapore
      { lat: 35.68, lon: 139.69, delay: 3.1, label: "TYO" },    // Tokyo
      { lat: -33.86, lon: 151.2, delay: 3.6, label: "SYD" },    // Sydney
      { lat: -23.55, lon: -46.63, delay: 4.1, label: "SAO" },   // Sao Paulo
      { lat: 19.43, lon: -99.13, delay: 4.6, label: "MEX" },    // Mexico City
      { lat: 28.61, lon: 77.2, delay: 5.1, label: "DEL" },      // Delhi
      { lat: 25.2, lon: 55.27, delay: 5.6, label: "DXB" },      // Dubai
    ];

    let raf = 0;
    const start = performance.now();

    const project = (lat: number, lon: number, rot: number, R: number) => {
      const la = (lat * Math.PI) / 180;
      const lo = (lon * Math.PI) / 180 + rot;
      const x = Math.cos(la) * Math.sin(lo);
      const y = Math.sin(la);
      const z = Math.cos(la) * Math.cos(lo);
      // slight tilt
      const tilt = -0.35;
      const y2 = y * Math.cos(tilt) - z * Math.sin(tilt);
      const z2 = y * Math.sin(tilt) + z * Math.cos(tilt);
      return { x: x * R, y: y2 * R, z: z2 };
    };

    const draw = (t: number) => {
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const R = Math.min(w, h) * 0.36;
      const elapsed = (t - start) / 1000;
      const rot = reduce ? 0 : elapsed * 0.15;

      ctx.clearRect(0, 0, w, h);

      // outer atmospheric glow
      const glow = ctx.createRadialGradient(cx, cy, R * 0.85, cx, cy, R * 1.35);
      glow.addColorStop(0, "rgba(200,255,59,0.10)");
      glow.addColorStop(1, "rgba(200,255,59,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.35, 0, Math.PI * 2);
      ctx.fill();

      // sphere base fill (very subtle)
      const base = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.1, cx, cy, R);
      base.addColorStop(0, "rgba(255,255,255,0.05)");
      base.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = base;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();

      // dots
      for (const d of dots) {
        const p = project(d.lat, d.lon, rot, R);
        if (p.z < -0.05) continue;
        const alpha = Math.max(0, Math.min(1, (p.z + 0.2) / 1.2)) * 0.55;
        const size = 1.2 * DPR + p.z * 0.8 * DPR;
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.beginPath();
        ctx.arc(cx + p.x, cy + p.y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // intent pings
      for (const ping of pings) {
        const p = project(ping.lat, ping.lon, rot, R);
        if (p.z < 0) continue;
        const phase = ((elapsed - ping.delay) % 3.2) / 3.2;
        const cycle = phase < 0 ? phase + 1 : phase;
        const px = cx + p.x;
        const py = cy + p.y;

        // expanding ring
        const ringR = 4 * DPR + cycle * 22 * DPR;
        const ringA = (1 - cycle) * 0.7;
        ctx.strokeStyle = `rgba(200,255,59,${ringA})`;
        ctx.lineWidth = 1.5 * DPR;
        ctx.beginPath();
        ctx.arc(px, py, ringR, 0, Math.PI * 2);
        ctx.stroke();

        // second ring
        const r2 = 2 * DPR + ((cycle + 0.4) % 1) * 18 * DPR;
        const a2 = (1 - ((cycle + 0.4) % 1)) * 0.35;
        ctx.strokeStyle = `rgba(200,255,59,${a2})`;
        ctx.lineWidth = 1 * DPR;
        ctx.beginPath();
        ctx.arc(px, py, r2, 0, Math.PI * 2);
        ctx.stroke();

        // glow dot
        const dotGlow = ctx.createRadialGradient(px, py, 0, px, py, 8 * DPR);
        dotGlow.addColorStop(0, "rgba(200,255,59,0.9)");
        dotGlow.addColorStop(1, "rgba(200,255,59,0)");
        ctx.fillStyle = dotGlow;
        ctx.beginPath();
        ctx.arc(px, py, 8 * DPR, 0, Math.PI * 2);
        ctx.fill();

        // solid core
        ctx.fillStyle = "#C8FF3B";
        ctx.beginPath();
        ctx.arc(px, py, 2.2 * DPR, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [reduce]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden
    />
  );
};

export const DarkSpace = () => (
  <section className="relative bg-black text-white py-24 md:py-32 px-6 md:px-10 overflow-hidden">
    <div
      className="absolute inset-x-0 bottom-0 h-[300px] pointer-events-none"
      style={{
        background:
          "radial-gradient(ellipse 900px 300px at 50% 100%, rgba(200,255,59,0.30), transparent 70%)",
      }}
    />
    {/* stars */}
    <div className="absolute inset-0">
      {Array.from({ length: 60 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            width: Math.random() * 2 + 1,
            height: Math.random() * 2 + 1,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            opacity: Math.random() * 0.8 + 0.2,
            animation: `star-twinkle ${Math.random() * 2 + 2}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 3}s`,
          }}
        />
      ))}
    </div>

    <div className="max-w-[1240px] mx-auto relative text-center">
      <Eyebrow color="#C8FF3B">Future We're Building</Eyebrow>
      <h2
        className="text-[36px] md:text-[54px] leading-[1.05] tracking-[-0.02em] font-medium"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        Powering the next generation<br />of revenue teams
      </h2>
      <p className="mt-5 text-[15px] text-white/60">
        Empowering operators with the tools, speed, and precision to win
      </p>
      <a
        href="/register"
        className="mt-8 inline-flex items-center gap-2 bg-[#C8FF3B] text-black rounded-full px-6 py-3.5 text-[14px] font-medium hover:bg-[#d4ff5c] transition-colors"
      >
        Get Started <ArrowRight className="w-4 h-4" />
      </a>

      {/* 3D Globe with intent pings */}
      <div
        className="relative mt-20 mx-auto max-w-3xl aspect-square"
        style={{ animation: "globe-float 6s ease-in-out infinite" }}
      >
        <IntentGlobe />

        {/* tooltip left */}
        <div className="absolute left-0 top-8 md:left-10 md:top-16 max-w-[240px] text-left bg-white/[0.08] backdrop-blur-md rounded-xl p-4 border border-white/10 z-10">
          <h4 className="text-[14px] font-semibold mb-1">Go Global, Grow Faster</h4>
          <p className="text-[12px] text-white/60 leading-relaxed">
            Scale outreach across every geography — we help you turn local wins into global pipeline.
          </p>
        </div>

        {/* tooltip right */}
        <div className="absolute right-0 top-1/2 md:right-8 max-w-[260px] text-left bg-white/[0.08] backdrop-blur-md rounded-xl p-4 border border-white/10 z-10">
          <h4 className="text-[14px] font-semibold mb-1">Scale Without Limits</h4>
          <p className="text-[12px] text-white/60 leading-relaxed">
            Whether you're expanding markets or building a stronger outbound engine, Intentsly grows with you.
          </p>
        </div>
      </div>
    </div>
  </section>
);

/* ═══════════════════════════════════════════════════════════════
   8. BUSINESS ENGINE — big dashboard mock
   ═══════════════════════════════════════════════════════════════ */
export const BusinessEngine = () => (
  <section className="bg-white py-24 md:py-32 px-6 md:px-10">
    <div className="max-w-[1240px] mx-auto text-center">
      <Eyebrow>Business Engine</Eyebrow>
      <h2
        className="text-[36px] md:text-[54px] leading-[1.05] tracking-[-0.02em] font-medium text-[#0a0a0a]"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        The master dashboard for<br />informed pipeline building
      </h2>
      <p className="mt-5 text-[15px] text-[#6b7280] max-w-xl mx-auto">
        Your central intelligence hub, delivering real-time signal performance across every channel
      </p>
      <a
        href="/register"
        className="mt-8 inline-flex items-center gap-2 bg-[#C8FF3B] text-black rounded-full px-6 py-3.5 text-[14px] font-medium hover:bg-[#d4ff5c] transition-colors"
      >
        Request Demo <ArrowRight className="w-4 h-4" />
      </a>

      {/* Dashboard mock with tilt */}
      <div className="mt-16 relative mx-auto max-w-5xl" style={{ perspective: "2000px" }}>
        <div
          className="rounded-[24px] bg-white border border-black/10 shadow-[0_40px_100px_-30px_rgba(0,0,0,0.3)] overflow-hidden text-left"
          style={{ transform: "rotateX(8deg)", transformOrigin: "50% 100%" }}
        >
          {/* Fake dashboard */}
          <div className="grid grid-cols-12 min-h-[500px]">
            {/* Sidebar */}
            <div className="col-span-2 bg-[#fafbfc] p-5 border-r border-black/5">
              <div className="flex items-center gap-2 mb-8">
                <img src={intentslyIcon} alt="" className="w-6 h-6" />
                <span className="text-[13px] font-semibold text-[#0a0a0a]">Intentsly</span>
              </div>
              <div className="space-y-2">
                {["Dashboard", "Signals", "Contacts", "Campaigns", "Unibox", "Settings"].map((l, i) => (
                  <div key={l} className={`text-[11px] px-2.5 py-2 rounded ${i === 0 ? "bg-black text-white" : "text-[#6b7280]"}`}>
                    {l}
                  </div>
                ))}
              </div>
            </div>
            {/* Main */}
            <div className="col-span-10 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-[10px] text-[#6b7280] uppercase tracking-wider">Overview</p>
                  <p className="text-[20px] font-semibold text-[#0a0a0a]">Pipeline health</p>
                </div>
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-lg bg-black/5" />
                  <div className="w-8 h-8 rounded-lg bg-[#C8FF3B]" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { l: "Hot signals", v: "$15,456", d: "+12%" },
                  { l: "Meetings booked", v: "$7,126", d: "-3%" },
                  { l: "Reply rate", v: "42%", d: "+5%" },
                ].map((s) => (
                  <div key={s.l} className="rounded-xl border border-black/5 p-4">
                    <p className="text-[10px] text-[#6b7280]">{s.l}</p>
                    <p className="text-[22px] font-semibold text-[#0a0a0a] mt-1">{s.v}</p>
                    <p className="text-[10px] text-emerald-600">{s.d}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-black/5 p-5">
                <p className="text-[11px] text-[#6b7280] mb-3">Signal velocity — last 14 days</p>
                <svg viewBox="0 0 500 120" className="w-full h-24">
                  <path d="M0 90 L 40 70 L 80 82 L 120 55 L 160 68 L 200 40 L 240 50 L 280 30 L 320 45 L 360 25 L 400 35 L 440 20 L 500 28" fill="none" stroke="#8B5CF6" strokeWidth="2.5" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Play button */}
        <button
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white shadow-2xl flex items-center justify-center hover:scale-105 transition-transform"
          aria-label="Play demo"
        >
          <Play className="w-6 h-6 text-[#0a0a0a] fill-current ml-1" />
        </button>
      </div>
    </div>
  </section>
);

/* ═══════════════════════════════════════════════════════════════
   9. TESTIMONIALS — marquee rows
   ═══════════════════════════════════════════════════════════════ */
const testimonials = [
  { name: "Anya L", role: "Founder, B2B SaaS", quote: "The automated signal detection is a lifesaver. I used to spend days researching prospects. Now hot leads land in my inbox every morning." },
  { name: "Marco P", role: "Growth Lead", quote: "Switching from cold lists to Intentsly changed everything. The intent scores are spot-on and I book meetings the same week I see the signal." },
  { name: "Samantha R", role: "CEO, SaaS", quote: "The reply rates are unreal. Because every message references a real buying signal, my prospects actually respond like humans." },
  { name: "David H", role: "Head of Sales", quote: "The ability to consolidate signals from LinkedIn, Reddit and X into one prioritized shortlist is revolutionary for my team." },
  { name: "Chen M", role: "RevOps", quote: "The drill-down on every lead — company, role, signal source — gives us granular insight into what's actually driving pipeline." },
  { name: "Isabella K", role: "Startup Founder", quote: "Customer support is top-notch. They walked me through setup step-by-step. Fast, knowledgeable, genuinely helpful." },
];

const TestimonialCard = ({ t }: { t: typeof testimonials[0] }) => (
  <div className="shrink-0 w-[380px] rounded-2xl bg-white border border-black/[0.06] p-5 mr-4">
    <div className="flex items-center gap-3 mb-3">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3B7BFF] to-[#C8FF3B] flex items-center justify-center text-white font-bold text-sm">
        {t.name[0]}
      </div>
      <div>
        <p className="text-[13px] font-semibold text-[#0a0a0a]">{t.name}</p>
        <p className="text-[11px] text-[#6b7280]">{t.role}</p>
      </div>
    </div>
    <p className="text-[13px] text-[#374151] leading-relaxed">"{t.quote}"</p>
  </div>
);

export const TestimonialsRows = () => (
  <section className="bg-white py-24 md:py-32 overflow-hidden">
    <div className="max-w-[1240px] mx-auto px-6 md:px-10 text-center mb-12">
      <Eyebrow>Client Instant Clarity</Eyebrow>
      <h2
        className="text-[36px] md:text-[54px] leading-[1.05] tracking-[-0.02em] font-medium text-[#0a0a0a]"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        Unifying outbound with<br />real-time intelligence
      </h2>
      <p className="mt-5 text-[15px] text-[#6b7280]">
        Your unified platform for intelligent, real-time buyer detection
      </p>
    </div>

    {[0, 1, 2].map((row) => (
      <div key={row} className={`flex mb-4 ${row === 1 ? "animate-marquee-reverse" : "animate-marquee"}`}>
        {[...testimonials, ...testimonials].map((t, i) => (
          <TestimonialCard key={`${row}-${i}`} t={{ ...t, name: t.name + (row ? "" : "") }} />
        ))}
      </div>
    ))}
  </section>
);

/* ═══════════════════════════════════════════════════════════════
   10. FINAL CTA — floating cards + big heading
   ═══════════════════════════════════════════════════════════════ */
export const FinalMonteraCTA = () => (
  <section className="relative overflow-hidden py-24 md:py-32 px-6"
    style={{
      background:
        "linear-gradient(180deg, #fff 0%, #E5FF7A 45%, #C8FF3B 100%)",
    }}
  >
    <div className="max-w-4xl mx-auto text-center relative z-10">
      <h2
        className="text-[36px] md:text-[64px] leading-[1.02] tracking-[-0.02em] font-medium text-[#0a0a0a]"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        Next-Gen Signal Platform<br />for Modern Founders
      </h2>
      <p className="mt-6 text-[16px] text-[#0a0a0a]/70 max-w-xl mx-auto">
        Fuel your outbound with real-time buyer intent, AI SDR outreach and total pipeline visibility.
      </p>
      <a
        href="/register"
        className="mt-8 inline-flex items-center gap-2 bg-[#0a0a0a] text-white rounded-full px-7 py-4 text-[14px] font-medium hover:bg-[#1a1a1a] transition-colors group"
      >
        Request Demo <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
      </a>
    </div>

    {/* Floating credit-card style tiles (Intentsly cards) */}
    <div
      className="absolute left-4 md:left-16 top-1/2 -translate-y-1/2 w-[260px] md:w-[340px] aspect-[1.6/1] rounded-2xl shadow-2xl p-5 flex flex-col justify-between hidden md:flex"
      style={{
        background: "linear-gradient(135deg, #7A7570 0%, #4A4540 100%)",
        transform: "rotate(-12deg)",
      }}
    >
      <div className="flex items-center gap-2 text-white/90">
        <img src={intentslyIcon} alt="" className="w-6 h-6" />
        <span className="text-[13px] font-semibold">Intentsly</span>
      </div>
      <p className="text-[11px] uppercase tracking-widest text-white/60">Signal Card</p>
    </div>

    <div
      className="absolute right-4 md:right-16 top-1/2 -translate-y-1/2 w-[260px] md:w-[340px] aspect-[1.6/1] rounded-2xl shadow-2xl p-5 flex flex-col justify-between hidden md:flex"
      style={{
        background: "linear-gradient(135deg, #8FA6C7 0%, #5678A8 100%)",
        transform: "rotate(12deg)",
      }}
    >
      <div className="flex items-center gap-2 text-white/90">
        <img src={intentslyIcon} alt="" className="w-6 h-6" />
        <span className="text-[13px] font-semibold">Intentsly</span>
      </div>
      <p className="text-[11px] uppercase tracking-widest text-white/60">AI SDR</p>
    </div>
  </section>
);

/* ═══════════════════════════════════════════════════════════════
   11. FOOTER (dark, newsletter + link columns)
   ═══════════════════════════════════════════════════════════════ */
export const MonteraFooter = () => (
  <footer className="bg-[#0a0a0a] text-white px-6 md:px-10 pt-16 pb-10">
    <div className="max-w-[1240px] mx-auto">
      {/* Newsletter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-12 border-b border-white/10">
        <h3
          className="text-[22px] md:text-[32px] font-medium max-w-md leading-tight tracking-tight"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Stay close to what's next — join the intent community
        </h3>
        <div className="flex items-center gap-3">
          <input
            type="email"
            placeholder="Enter your email"
            className="bg-transparent border-b border-white/30 text-white placeholder-white/40 py-2 px-1 focus:outline-none focus:border-white text-[14px] min-w-[240px]"
          />
          <button className="bg-[#C8FF3B] text-black rounded-full px-6 py-3 text-[13px] font-semibold hover:bg-[#d4ff5c] transition-colors">
            Send Now
          </button>
        </div>
      </div>

      {/* Link columns */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-8 py-12">
        <div className="col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <img src={intentslyIcon} alt="" className="w-8 h-8" />
            <span className="text-[18px] font-semibold">Intentsly.</span>
          </div>
          <p className="text-[13px] text-white/50 mb-6">Social</p>
          <div className="flex gap-3">
            {[Instagram, Twitter, Facebook, Linkedin].map((Ic, i) => (
              <a key={i} href="#" className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <Ic className="w-4 h-4" />
              </a>
            ))}
          </div>
          <a href="mailto:hello@intentsly.com" className="mt-6 block text-[14px] underline text-white/80 hover:text-white">
            hello@intentsly.com
          </a>
        </div>

        {[
          { title: "Pages", items: ["Home", "How it works", "Use Cases", "Pricing", "FAQ"] },
          { title: "Features", items: ["Signals", "AI SDR", "Unibox", "Integrations"] },
          { title: "Company", items: ["Partners", "Help Center", "Support"] },
          { title: "Legal", items: ["Privacy", "Terms", "Sign up", "Login"] },
        ].map((col) => (
          <div key={col.title}>
            <p className="text-[12px] text-white/40 mb-4 uppercase tracking-wider">{col.title}</p>
            <ul className="space-y-3">
              {col.items.map((i) => (
                <li key={i}>
                  <a href="#" className="text-[13px] text-white/80 hover:text-white transition-colors">
                    {i}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between gap-4 text-[12px] text-white/40">
        <p>© {new Date().getFullYear()} Intentsly. All rights reserved.</p>
        <div className="flex gap-6">
          <a href="/privacy" className="hover:text-white/70">Privacy Policy</a>
          <a href="/terms" className="hover:text-white/70">Terms of Service</a>
        </div>
      </div>
    </div>
  </footer>
);

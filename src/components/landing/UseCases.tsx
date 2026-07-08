import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowUpRight, ArrowRight, Check, Radar, MessageSquare, Calendar, Thermometer, Workflow, TrendingUp } from "lucide-react";

/* ── Mini-mocks (benefit-led) ─────────────────────────────────────────── */

const FindMock = () => (
  <div className="relative w-full max-w-[280px] h-[120px] flex items-center justify-center">
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-24 h-24 rounded-full border border-[#1A8FE3]/20 animate-pulse" />
      <div className="absolute w-16 h-16 rounded-full border border-[#1A8FE3]/30" />
      <div className="absolute w-8 h-8 rounded-full bg-[#1A8FE3] flex items-center justify-center">
        <Radar className="w-4 h-4 text-white" />
      </div>
    </div>
    <div className="absolute top-2 left-4 bg-white rounded-full px-2 py-1 shadow-sm text-[10px] font-medium text-foreground flex items-center gap-1">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Hiring signal
    </div>
    <div className="absolute bottom-4 right-4 bg-white rounded-full px-2 py-1 shadow-sm text-[10px] font-medium text-foreground flex items-center gap-1">
      <span className="w-1.5 h-1.5 rounded-full bg-[#C8FF00]" /> Mention spike
    </div>
  </div>
);

const MessageMock = () => (
  <div className="w-full max-w-[260px] space-y-2">
    <div className="bg-white rounded-2xl rounded-tl-sm p-3 shadow-[0_4px_12px_-4px_rgba(15,23,42,0.1)]">
      <p className="text-[11px] text-foreground leading-snug">
        Saw you just opened a Berlin office — congrats. Most teams there need help with outbound before they scale sales.
      </p>
    </div>
    <div className="flex items-center gap-2 pl-2">
      <MessageSquare className="w-3.5 h-3.5 text-[#1A8FE3]" />
      <span className="text-[10px] text-muted-foreground">Written for their actual situation</span>
    </div>
  </div>
);

const CalendarMock = () => (
  <div className="w-full max-w-[240px] bg-white rounded-2xl shadow-[0_8px_24px_-8px_rgba(15,23,42,0.12)] p-4">
    <div className="flex items-center gap-2 mb-3">
      <Calendar className="w-4 h-4 text-[#1A8FE3]" />
      <span className="text-[11px] font-semibold text-foreground">This week</span>
    </div>
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-[10px]">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span className="text-muted-foreground">Tue</span>
        <span className="font-medium text-foreground">Meeting booked · Acme Inc.</span>
      </div>
      <div className="flex items-center gap-2 text-[10px]">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span className="text-muted-foreground">Thu</span>
        <span className="font-medium text-foreground">Meeting booked · Globex</span>
      </div>
      <div className="flex items-center gap-2 text-[10px]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#1A8FE3]" />
        <span className="text-muted-foreground">Fri</span>
        <span className="font-medium text-foreground">Follow-up sent · 3 leads</span>
      </div>
    </div>
  </div>
);

const WarmthMock = () => (
  <div className="w-full max-w-[240px] bg-white rounded-2xl shadow-[0_8px_24px_-8px_rgba(15,23,42,0.12)] p-4">
    <div className="flex items-center justify-between mb-3">
      <span className="text-[11px] font-semibold text-foreground">Lead temperature</span>
      <Thermometer className="w-4 h-4 text-red-500" />
    </div>
    <div className="space-y-2.5">
      <div>
        <div className="flex items-center justify-between text-[10px] mb-1">
          <span className="text-muted-foreground">Hot leads</span>
          <span className="font-semibold text-foreground">18</span>
        </div>
        <div className="h-2 rounded-full bg-red-100 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full" style={{ width: "78%" }} />
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between text-[10px] mb-1">
          <span className="text-muted-foreground">Cold leads</span>
          <span className="font-semibold text-foreground">3</span>
        </div>
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full bg-slate-300 rounded-full" style={{ width: "12%" }} />
        </div>
      </div>
    </div>
  </div>
);

const AllInOneMock = () => (
  <div className="w-full max-w-[260px]">
    <div className="flex items-center justify-between">
      {["Find", "Write", "Send", "Book"].map((step, i) => (
        <div key={step} className="flex items-center">
          <div className="w-12 h-12 rounded-xl bg-white shadow-[0_4px_12px_-4px_rgba(15,23,42,0.1)] flex items-center justify-center">
            <span className="text-[10px] font-semibold text-foreground">{step}</span>
          </div>
          {i < 3 && <div className="w-4 h-0.5 bg-[#1A8FE3]/20" />}
        </div>
      ))}
    </div>
    <div className="flex items-center justify-center mt-3">
      <Workflow className="w-4 h-4 text-[#1A8FE3] mr-1.5" />
      <span className="text-[10px] text-muted-foreground">One workflow, zero handoffs</span>
    </div>
  </div>
);

const LearnMock = () => (
  <div className="w-full max-w-[260px] bg-white rounded-2xl shadow-[0_8px_24px_-8px_rgba(15,23,42,0.12)] p-4">
    <div className="flex items-center justify-between mb-4">
      <span className="text-[11px] font-semibold text-foreground">Reply rate over time</span>
      <TrendingUp className="w-4 h-4 text-emerald-500" />
    </div>
    <svg viewBox="0 0 100 40" className="w-full h-14" preserveAspectRatio="none">
      <defs>
        <linearGradient id="learn-grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#1A8FE3" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#1A8FE3" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline fill="url(#learn-grad)" stroke="none" points="0,38 14,32 28,30 42,24 56,18 70,14 84,8 100,4 100,40 0,40" />
      <polyline fill="none" stroke="#1A8FE3" strokeWidth="2" points="0,38 14,32 28,30 42,24 56,18 70,14 84,8 100,4" />
    </svg>
    <div className="flex items-center gap-2 mt-2">
      <span className="text-[10px] font-bold text-emerald-600">+34%</span>
      <span className="text-[10px] text-muted-foreground">this month</span>
    </div>
  </div>
);

/* ── Cards config ─────────────────────────────────────────────────────── */

type Benefit = {
  title: string;
  desc: string;
  meta: string;
  slug: string;
  Mock: React.FC;
  bg: string;
  wide?: boolean;
};

const benefits: Benefit[] = [
  {
    title: "Find ready-to-buy companies",
    desc: "Spot the companies already showing buying signals — before they show up in any database.",
    meta: "Discovery",
    slug: "find",
    Mock: FindMock,
    bg: "bg-[radial-gradient(ellipse_at_top_left,rgba(26,143,227,0.12),transparent_60%),linear-gradient(180deg,#F4F9FE_0%,#FFFFFF_100%)]",
    wide: true,
  },
  {
    title: "Write messages people reply to",
    desc: "AI drafts outreach based on what each lead actually cares about, not generic templates.",
    meta: "Personalization",
    slug: "messages",
    Mock: MessageMock,
    bg: "bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.10),transparent_60%),linear-gradient(180deg,#F6F7FB_0%,#FFFFFF_100%)]",
  },
  {
    title: "Book meetings while you sleep",
    desc: "Follow-ups happen automatically, so conversations keep moving even when you're offline.",
    meta: "Automation",
    slug: "book",
    Mock: CalendarMock,
    bg: "bg-[radial-gradient(ellipse_at_top,rgba(200,255,0,0.18),transparent_60%),linear-gradient(180deg,#FAFCEF_0%,#FFFFFF_100%)]",
  },
  {
    title: "Stop chasing cold leads",
    desc: "Focus on people who have recently signaled interest, instead of spraying everyone.",
    meta: "Prioritization",
    slug: "warm",
    Mock: WarmthMock,
    bg: "bg-[radial-gradient(ellipse_at_center,rgba(26,143,227,0.08),transparent_60%),linear-gradient(180deg,#FBF9F5_0%,#FFFFFF_100%)]",
  },
  {
    title: "One tool, no sales team needed",
    desc: "Everything from finding leads to booking meetings happens in one simple workflow.",
    meta: "All-in-one",
    slug: "workflow",
    Mock: AllInOneMock,
    bg: "bg-[radial-gradient(ellipse_at_top_left,rgba(200,255,0,0.20),transparent_60%),linear-gradient(180deg,#F9FCEC_0%,#FFFFFF_100%)]",
  },
  {
    title: "Gets smarter over time",
    desc: "Learns from replies and keeps improving your next messages, so results compound.",
    meta: "Learning",
    slug: "learn",
    Mock: LearnMock,
    bg: "bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.12),transparent_60%),linear-gradient(180deg,#F5F6FB_0%,#FFFFFF_100%)]",
  },
];

/* ── Component ────────────────────────────────────────────────────────── */

const UseCases = () => {
  return (
    <section id="use-cases" className="py-20 md:py-32 px-6 bg-background">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between mb-14 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl"
          >
            <span className="section-label mb-6 block">What Intentsly does for you</span>
            <h2
              className="text-4xl md:text-6xl font-medium tracking-[-0.02em] leading-[1.05] mb-4"
              style={{ color: "hsl(var(--aeline-dark))" }}
            >
              Turn signals into meetings — without hiring a sales team
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              Everything you need to find interested leads, start real conversations, and book meetings on autopilot.
            </p>
          </motion.div>
          <div className="hidden md:block text-[11px] uppercase tracking-[0.18em] text-muted-foreground pb-2 shrink-0">
            6 benefits
          </div>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {benefits.map((b, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className={b.wide ? "lg:col-span-2" : ""}
            >
              <Link
                to={`/register?ref=benefit-${b.slug}`}
                className="group relative block overflow-hidden rounded-[28px] bg-white border border-black/5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.08)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.04),0_20px_44px_-16px_rgba(0,0,0,0.14)] hover:-translate-y-[2px] hover:scale-[1.01] transition-all duration-300"
              >
                {/* Visual zone */}
                <div
                  className={`relative ${b.bg} h-[170px] md:h-[200px] flex items-center justify-center px-6 overflow-hidden`}
                >
                  {/* Faint grid pattern overlay */}
                  <div
                    className="absolute inset-0 opacity-[0.04]"
                    style={{
                      backgroundImage:
                        "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)",
                      backgroundSize: "24px 24px",
                    }}
                  />
                  <div className="relative z-10 w-full flex justify-center">
                    <b.Mock />
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-black/[0.06]" />

                {/* Copy zone */}
                <div className="p-6">
                  <h3
                    className="text-lg font-semibold tracking-tight mb-1.5"
                    style={{ color: "hsl(var(--aeline-dark))" }}
                  >
                    {b.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-5">{b.desc}</p>
                  <div className="flex items-center justify-between pt-3 border-t border-black/[0.04]">
                    <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground font-medium">
                      {b.meta}
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-[#1A8FE3] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* CTA footer band */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mt-12 rounded-[28px] bg-gradient-to-r from-[#1A8FE3]/[0.06] via-[#C8FF00]/[0.10] to-[#1A8FE3]/[0.06] border border-black/5 px-6 md:px-10 py-7 md:py-8 flex flex-col md:flex-row md:flex-wrap md:items-center md:justify-between gap-5 md:gap-4"
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#C8FF00] flex items-center justify-center shrink-0">
              <Check className="w-4 h-4" style={{ color: "hsl(var(--aeline-dark))" }} strokeWidth={3} />
            </div>
            <div>
              <p className="text-base md:text-lg font-medium" style={{ color: "hsl(var(--aeline-dark))" }}>
                Start booking meetings in your first week — no sales experience required.
              </p>
              <p className="text-xs text-muted-foreground mt-1">No contract · Cancel anytime · 5-min setup</p>
            </div>
          </div>
          <Link
            to="/register"
            className="inline-flex items-center justify-center gap-2 bg-[hsl(var(--aeline-dark))] text-white px-6 py-3 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity shadow-[0_8px_24px_-8px_rgba(15,23,42,0.4)] w-full md:w-auto md:shrink-0"
          >
            Start for $97
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default UseCases;

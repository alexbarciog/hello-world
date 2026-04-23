import { motion } from "framer-motion";
import { ArrowUpRight, Check } from "lucide-react";

/* ── Mini-mocks (premium, full-bleed) ─────────────────────────────────── */

const SaasMock = () => (
  <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-[0_8px_24px_-8px_rgba(15,23,42,0.18)] p-4">
    <div className="flex items-center gap-3 mb-3">
      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#1A8FE3] to-[#0E5A99] flex items-center justify-center text-white text-xs font-bold shrink-0">
        Ac
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-foreground truncate">Acme Inc.</div>
        <div className="text-[11px] text-muted-foreground truncate">acme.com · 120 employees</div>
      </div>
      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
    </div>
    <div className="text-[12px] text-foreground mb-3 leading-snug">
      Hiring <span className="font-semibold">3 Account Executives</span> · last week
    </div>
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#C8FF00]/40 text-[#1A1A2E]">
        +42 intent
      </span>
      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Hot
      </span>
      <span className="ml-auto text-[10px] text-muted-foreground">2h ago</span>
    </div>
  </div>
);

const AgencyMock = () => {
  const clients = [
    { name: "Acme", initials: "Ac", count: 12, points: "0,8 10,6 20,7 30,4 40,5 50,2" },
    { name: "Globex", initials: "Gl", count: 8, points: "0,6 10,7 20,5 30,6 40,3 50,4" },
    { name: "Initech", initials: "In", count: 15, points: "0,9 10,7 20,8 30,5 40,3 50,1" },
  ];
  return (
    <div className="w-full max-w-[280px] bg-white rounded-2xl shadow-[0_8px_24px_-8px_rgba(15,23,42,0.18)] p-3 space-y-2">
      {clients.map((c) => (
        <div key={c.name} className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#1A8FE3]/10 flex items-center justify-center text-[10px] font-semibold text-[#1A8FE3] shrink-0">
            {c.initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-medium text-foreground truncate">{c.name}</div>
            <div className="text-[10px] text-muted-foreground">{c.count} leads</div>
          </div>
          <svg viewBox="0 0 50 10" className="w-12 h-4 shrink-0" preserveAspectRatio="none">
            <polyline fill="none" stroke="#1A8FE3" strokeWidth="1" points={c.points} />
          </svg>
        </div>
      ))}
    </div>
  );
};

const SalesMock = () => (
  <div className="w-full max-w-[280px] bg-white rounded-2xl shadow-[0_8px_24px_-8px_rgba(15,23,42,0.18)] p-3.5">
    <div className="flex items-center gap-2.5 mb-2">
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1A8FE3] to-[#0E5A99] flex items-center justify-center text-[11px] font-semibold text-white shrink-0">
        JD
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-semibold text-foreground truncate">Jamie Doe</div>
        <div className="text-[10px] text-muted-foreground truncate">VP Sales · Acme</div>
      </div>
      <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-red-500 text-white flex items-center gap-1 shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-white" /> Hot · 92
      </span>
    </div>
    <div className="text-[10px] text-muted-foreground pl-[46px]">Replied 2h ago</div>
  </div>
);

const FounderMock = () => (
  <div className="w-full max-w-[240px] bg-white rounded-2xl shadow-[0_8px_24px_-8px_rgba(15,23,42,0.18)] p-4 text-center">
    <div className="text-[44px] font-bold leading-none tracking-tight text-[#1A8FE3] mb-1">12</div>
    <div className="text-[11px] font-medium text-foreground mb-0.5">meetings booked</div>
    <div className="text-[10px] text-muted-foreground">1 founder · last 30 days</div>
  </div>
);

const ServicesMock = () => (
  <div className="w-full max-w-[280px] bg-white rounded-2xl shadow-[0_8px_24px_-8px_rgba(15,23,42,0.18)] p-3.5">
    <svg viewBox="0 0 100 32" className="w-full h-12 mb-2" preserveAspectRatio="none">
      <defs>
        <linearGradient id="svc-grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#1A8FE3" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#1A8FE3" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        fill="url(#svc-grad)"
        stroke="none"
        points="0,26 14,23 28,19 42,21 56,12 70,8 84,5 100,2 100,32 0,32"
      />
      <polyline
        fill="none"
        stroke="#1A8FE3"
        strokeWidth="1.5"
        points="0,26 14,23 28,19 42,21 56,12 70,8 84,5 100,2"
      />
    </svg>
    <div className="grid grid-cols-3 gap-1.5">
      <div className="bg-emerald-50 rounded-md px-1.5 py-1 text-center">
        <div className="text-[10px] font-bold text-emerald-600">+28%</div>
        <div className="text-[8px] text-muted-foreground">Hiring</div>
      </div>
      <div className="bg-[#1A8FE3]/10 rounded-md px-1.5 py-1 text-center">
        <div className="text-[10px] font-bold text-[#1A8FE3]">↑</div>
        <div className="text-[8px] text-muted-foreground">Mentions</div>
      </div>
      <div className="bg-[#C8FF00]/30 rounded-md px-1.5 py-1 text-center">
        <div className="text-[10px] font-bold text-[#1A1A2E]">4</div>
        <div className="text-[8px] text-muted-foreground">Roles</div>
      </div>
    </div>
  </div>
);

const RevOpsMock = () => (
  <div className="w-full max-w-[280px] bg-white rounded-2xl shadow-[0_8px_24px_-8px_rgba(15,23,42,0.18)] p-3.5 space-y-2.5">
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-medium text-muted-foreground">Fit score</span>
        <span className="text-[11px] font-bold text-foreground">8.4</span>
      </div>
      <div className="h-1.5 rounded-full bg-[#1A8FE3]/15 overflow-hidden">
        <div className="h-full bg-[#1A8FE3] rounded-full" style={{ width: "84%" }} />
      </div>
    </div>
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-medium text-muted-foreground">Intent score</span>
        <span className="text-[11px] font-bold text-foreground">9.1</span>
      </div>
      <div className="h-1.5 rounded-full bg-[#C8FF00]/30 overflow-hidden">
        <div className="h-full bg-[#C8FF00] rounded-full" style={{ width: "91%" }} />
      </div>
    </div>
    <div className="flex items-center gap-1.5 pt-1 border-t border-black/5">
      <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
        <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
      </div>
      <span className="text-[10px] font-medium text-foreground">Add to outreach</span>
    </div>
  </div>
);

/* ── Cards config ─────────────────────────────────────────────────────── */

type UseCase = {
  title: string;
  desc: string;
  meta: string;
  Mock: React.FC;
  bg: string;
  wide?: boolean;
};

const cases: UseCase[] = [
  {
    title: "B2B SaaS teams",
    desc: "Find companies entering your category before they hit any database.",
    meta: "Use case · SaaS",
    Mock: SaasMock,
    bg: "bg-[radial-gradient(ellipse_at_top_left,rgba(26,143,227,0.12),transparent_60%),linear-gradient(180deg,#F4F9FE_0%,#FFFFFF_100%)]",
    wide: true,
  },
  {
    title: "Sales teams",
    desc: "Prioritize by timing, not just ICP fit.",
    meta: "Use case · Sales",
    Mock: SalesMock,
    bg: "bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.10),transparent_60%),linear-gradient(180deg,#F6F7FB_0%,#FFFFFF_100%)]",
  },
  {
    title: "Lead-gen agencies",
    desc: "Stronger angles for client outreach.",
    meta: "Use case · Agency",
    Mock: AgencyMock,
    bg: "bg-[radial-gradient(ellipse_at_top,rgba(200,255,0,0.18),transparent_60%),linear-gradient(180deg,#FAFCEF_0%,#FFFFFF_100%)]",
  },
  {
    title: "Founders",
    desc: "Lean outbound, no full SDR stack.",
    meta: "Use case · Founder",
    Mock: FounderMock,
    bg: "bg-[radial-gradient(ellipse_at_center,rgba(26,143,227,0.08),transparent_60%),linear-gradient(180deg,#FBF9F5_0%,#FFFFFF_100%)]",
  },
  {
    title: "B2B service businesses",
    desc: "Spot demand triggers as they happen.",
    meta: "Use case · Services",
    Mock: ServicesMock,
    bg: "bg-[radial-gradient(ellipse_at_top_left,rgba(200,255,0,0.20),transparent_60%),linear-gradient(180deg,#F9FCEC_0%,#FFFFFF_100%)]",
  },
  {
    title: "RevOps / GTM operators",
    desc: "Better inputs for account selection.",
    meta: "Use case · RevOps",
    Mock: RevOpsMock,
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
            <span className="section-label mb-6 block">Who Intentsly is for</span>
            <h2
              className="text-5xl md:text-6xl font-medium tracking-[-0.02em] leading-[1.05] mb-4"
              style={{ color: "hsl(var(--aeline-dark))" }}
            >
              Built for B2B teams that care about timing
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              One product. Six teams. Same edge: timing.
            </p>
          </motion.div>
          <div className="hidden md:block text-[11px] uppercase tracking-[0.18em] text-muted-foreground pb-2 shrink-0">
            6 use cases
          </div>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {cases.map((c, i) => (
            <motion.article
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className={`group relative overflow-hidden rounded-[28px] bg-white border border-black/5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.08)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.04),0_16px_40px_-16px_rgba(0,0,0,0.12)] hover:-translate-y-[2px] transition-all duration-300 ${
                c.wide ? "lg:col-span-2" : ""
              }`}
            >
              {/* Visual zone */}
              <div
                className={`relative ${c.bg} h-[200px] flex items-center justify-center px-6 overflow-hidden`}
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
                  <c.Mock />
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
                  {c.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">{c.desc}</p>
                <div className="flex items-center justify-between pt-3 border-t border-black/[0.04]">
                  <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground font-medium">
                    {c.meta}
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-[#1A8FE3] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UseCases;

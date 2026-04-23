import { motion } from "framer-motion";
import { Rocket, Building2, Users, User, Wrench, Settings2 } from "lucide-react";

/* ── Mini-mocks ───────────────────────────────────────────────────────── */

const SaasMock = () => (
  <div className="flex items-center gap-2">
    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
    <div className="flex-1 min-w-0">
      <div className="text-[11px] font-medium text-foreground truncate">Hiring 3 AEs · last week</div>
      <div className="text-[10px] text-muted-foreground">acme.com</div>
    </div>
    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#C8FF00]/30 text-[#1A1A2E]">+42</span>
  </div>
);

const AgencyMock = () => (
  <div className="space-y-1.5">
    {[
      { name: "Acme", count: 12 },
      { name: "Globex", count: 8 },
      { name: "Initech", count: 15 },
    ].map((c) => (
      <div key={c.name} className="flex items-center justify-between text-[11px]">
        <span className="font-medium text-foreground">{c.name}</span>
        <span className="text-[10px] text-muted-foreground">{c.count} leads</span>
      </div>
    ))}
  </div>
);

const SalesMock = () => (
  <div className="flex items-center gap-2">
    <div className="w-7 h-7 rounded-full bg-[#1A8FE3]/15 flex items-center justify-center text-[10px] font-semibold text-[#1A8FE3] shrink-0">
      JD
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-[11px] font-medium text-foreground truncate">Jamie Doe</div>
      <div className="text-[10px] text-muted-foreground truncate">VP Sales · Acme</div>
    </div>
    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-red-100 text-red-600 flex items-center gap-1">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
      Hot · 92
    </span>
  </div>
);

const FounderMock = () => (
  <div className="flex flex-col items-center justify-center gap-1">
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1A8FE3] to-[#0E5A99] flex items-center justify-center text-[10px] font-semibold text-white">
      F
    </div>
    <div className="text-[10px] font-medium text-foreground">1 founder · 12 meetings</div>
  </div>
);

const ServicesMock = () => (
  <div className="flex items-end justify-between gap-2 h-full">
    <svg viewBox="0 0 80 30" className="flex-1 h-8" preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke="#1A8FE3"
        strokeWidth="1.5"
        points="0,25 12,22 24,18 36,20 48,12 60,8 72,5 80,2"
      />
      <polyline
        fill="url(#grad)"
        stroke="none"
        points="0,25 12,22 24,18 36,20 48,12 60,8 72,5 80,2 80,30 0,30"
        opacity="0.15"
      />
      <defs>
        <linearGradient id="grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#1A8FE3" />
          <stop offset="100%" stopColor="#1A8FE3" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 shrink-0">
      +28%
    </span>
  </div>
);

const RevOpsMock = () => (
  <div className="space-y-2">
    <div>
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[10px] text-muted-foreground">Fit</span>
        <span className="text-[10px] font-semibold text-foreground">8.4</span>
      </div>
      <div className="h-1.5 rounded-full bg-[#1A8FE3]/15 overflow-hidden">
        <div className="h-full bg-[#1A8FE3] rounded-full" style={{ width: "84%" }} />
      </div>
    </div>
    <div>
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[10px] text-muted-foreground">Intent</span>
        <span className="text-[10px] font-semibold text-foreground">9.1</span>
      </div>
      <div className="h-1.5 rounded-full bg-[#C8FF00]/30 overflow-hidden">
        <div className="h-full bg-[#C8FF00] rounded-full" style={{ width: "91%" }} />
      </div>
    </div>
  </div>
);

/* ── Cards ────────────────────────────────────────────────────────────── */

const cases = [
  {
    icon: Rocket,
    title: "B2B SaaS teams",
    desc: "Find companies entering your category.",
    Mock: SaasMock,
    accent: true,
  },
  {
    icon: Building2,
    title: "Lead-gen agencies",
    desc: "Stronger angles for client outreach.",
    Mock: AgencyMock,
    accent: false,
  },
  {
    icon: Users,
    title: "Sales teams",
    desc: "Prioritize by timing, not just ICP.",
    Mock: SalesMock,
    accent: false,
  },
  {
    icon: User,
    title: "Founders",
    desc: "Lean outbound, no full SDR stack.",
    Mock: FounderMock,
    accent: false,
  },
  {
    icon: Wrench,
    title: "B2B service businesses",
    desc: "Spot demand triggers as they happen.",
    Mock: ServicesMock,
    accent: true,
  },
  {
    icon: Settings2,
    title: "RevOps / GTM operators",
    desc: "Better inputs for account selection.",
    Mock: RevOpsMock,
    accent: false,
  },
];

const UseCases = () => {
  return (
    <section id="use-cases" className="py-20 md:py-32 px-6 bg-background">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="max-w-2xl mb-14"
        >
          <span className="section-label mb-6 block">Who Intentsly is for</span>
          <h2
            className="text-4xl md:text-5xl font-medium tracking-tight leading-[1.1] mb-4"
            style={{ color: "hsl(var(--aeline-dark))" }}
          >
            Built for B2B teams that care about timing
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            Different teams. Same goal: buyers worth your attention now.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cases.map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.4, delay: (i % 3) * 0.06, ease: "easeOut" }}
              className={`rounded-3xl bg-[#f5f5f5] p-5 hover:-translate-y-0.5 transition-transform ${
                c.accent ? "border-t-2 border-[#C8FF00]/40" : ""
              }`}
            >
              {/* Visual zone */}
              <div className="bg-white rounded-xl shadow-sm p-3 mb-4 h-[88px] flex items-center">
                <div className="w-full">
                  <c.Mock />
                </div>
              </div>

              {/* Copy zone */}
              <div className="flex items-center gap-3 mb-1.5">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#1A8FE3]/10 shrink-0">
                  <c.icon className="w-4 h-4 text-[#1A8FE3]" />
                </div>
                <h3 className="text-base font-semibold" style={{ color: "hsl(var(--aeline-dark))" }}>
                  {c.title}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed pl-12">{c.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UseCases;

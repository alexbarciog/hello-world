import { motion } from "framer-motion";
import { Target, Radar, ListChecks, Zap, Search, Heart, Building2, Briefcase } from "lucide-react";

/* ── Step 1: ICP form mock ── */
const ICPVisual = () => (
  <div className="relative w-full h-44 flex items-center justify-center">
    <div className="absolute left-2 top-1 w-[88%] rounded-xl bg-white shadow-md p-3 border border-border/50 z-10">
      <p className="text-[9px] font-medium mb-2" style={{ color: "hsl(var(--aeline-dark))" }}>Define your ICP</p>
      <div className="space-y-1.5">
        {[
          { label: "Industry", value: "B2B SaaS", icon: Building2 },
          { label: "Role", value: "Head of Sales", icon: Briefcase },
          { label: "Company size", value: "11–200", icon: Target },
        ].map((f, i) => (
          <div key={i} className="flex items-center gap-2 bg-[#f5f5f5] rounded-md px-2 py-1.5">
            <f.icon className="w-3 h-3 shrink-0 text-[#1A8FE3]" />
            <span className="text-[8px] text-muted-foreground flex-1">{f.label}</span>
            <span className="text-[9px] font-semibold" style={{ color: "hsl(var(--aeline-dark))" }}>{f.value}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/* ── Step 2: Live signals mock ── */
const SignalsVisual = () => (
  <div className="relative w-full h-44 flex items-center justify-center">
    <div className="absolute left-2 top-1 w-[52%] rounded-xl bg-[#1a1a2e] text-white p-4 shadow-xl -rotate-2 z-10">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-medium opacity-80">Live signals</span>
        <Zap className="w-3.5 h-3.5 text-[#C8FF00]" />
      </div>
      <div className="text-3xl font-bold">127</div>
      <p className="text-[9px] opacity-40 mt-0.5">Detected today</p>
    </div>
    <div className="absolute right-1 top-14 w-[50%] rounded-xl bg-white shadow-md p-2.5 rotate-1 z-20 border border-border/50">
      <p className="text-[9px] font-medium mb-1.5" style={{ color: "hsl(var(--aeline-dark))" }}>On LinkedIn</p>
      <div className="space-y-1">
        {[
          { icon: Search, name: "Posted about CRM", color: "#1A8FE3" },
          { icon: Heart, name: "Liked competitor post", color: "#ef4444" },
          { icon: Radar, name: "New hiring activity", color: "#22c55e" },
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <s.icon className="w-3 h-3 shrink-0" style={{ color: s.color }} />
            <span className="text-[8px] font-medium flex-1 truncate" style={{ color: "hsl(var(--aeline-dark))" }}>{s.name}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/* ── Step 3: Prioritized leads ── */
const PrioritizedVisual = () => (
  <div className="relative w-full h-44 flex items-center justify-center">
    <div className="absolute left-2 top-1 w-[88%] rounded-xl bg-white shadow-md p-3 border border-border/50 z-10">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[9px] font-medium" style={{ color: "hsl(var(--aeline-dark))" }}>Top opportunities</p>
        <span className="text-[8px] text-muted-foreground">12</span>
      </div>
      <div className="space-y-1.5">
        {[
          { name: "Sarah K.", co: "Loop AI", tier: "Hot", color: "#ef4444" },
          { name: "Mark D.", co: "Northwind", tier: "Hot", color: "#ef4444" },
          { name: "Priya S.", co: "Plexa", tier: "Warm", color: "#f59e0b" },
        ].map((l, i) => (
          <div key={i} className="flex items-center gap-2 bg-[#f5f5f5] rounded-md px-2 py-1.5">
            <div className="w-5 h-5 rounded-full bg-[#1A8FE3]/15 flex items-center justify-center text-[7px] font-bold text-[#1A8FE3]">
              {l.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[8px] font-semibold truncate" style={{ color: "hsl(var(--aeline-dark))" }}>{l.name}</p>
              <p className="text-[7px] text-muted-foreground truncate">{l.co}</p>
            </div>
            <span className="text-[7px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: l.color }}>
              {l.tier}
            </span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const steps = [
  {
    num: "01",
    icon: Target,
    title: "Define who you want to find",
    desc: "Set the buyers you care about: industry, role, company type, use case, and target account profile.",
    Visual: ICPVisual,
  },
  {
    num: "02",
    icon: Radar,
    title: "Track intent signals on LinkedIn",
    desc: "Surface signals that suggest movement, need, or buying potential — hiring activity, growth signals, problem-aware posting, and more.",
    Visual: SignalsVisual,
  },
  {
    num: "03",
    icon: ListChecks,
    title: "Focus on the best opportunities",
    desc: "Get a relevant set of people and companies to prioritize — instead of working from generic prospect lists.",
    Visual: PrioritizedVisual,
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20 md:py-32 px-6 bg-background">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="max-w-2xl mb-14"
        >
          <span className="section-label mb-6 block">How it works</span>
          <h2 className="text-4xl md:text-5xl font-medium tracking-tight leading-[1.1] mb-4" style={{ color: "hsl(var(--aeline-dark))" }}>
            How Intentsly works
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            Spot likely buyers on LinkedIn by surfacing intent signals you can actually act on.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.4, delay: i * 0.08, ease: "easeOut" }}
              className="rounded-3xl bg-[#f5f5f5] overflow-hidden"
            >
              <div className="p-7">
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-xs font-bold tracking-widest text-[#1A8FE3]">{s.num}</span>
                  <div className="w-9 h-9 rounded-xl bg-[#1A8FE3]/10 flex items-center justify-center">
                    <s.icon className="w-4.5 h-4.5 text-[#1A8FE3]" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-3" style={{ color: "hsl(var(--aeline-dark))" }}>{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
              <div className="px-7 pb-7">
                <div className="w-full rounded-2xl overflow-hidden bg-[#f0f0f0] p-2">
                  <s.Visual />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <p className="text-sm text-muted-foreground text-center mt-10 max-w-xl mx-auto">
          The result: less list building, better timing, and a cleaner path to qualified conversations.
        </p>
      </div>
    </section>
  );
};

export default HowItWorks;

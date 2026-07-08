import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Check, X, ArrowRight, Sparkles } from "lucide-react";

const rows = [
  { feature: "Intent-based targeting", intentsly: true, apollo: false, clay: false, salesnav: false, agency: "Manual" },
  { feature: "LinkedIn signal detection", intentsly: true, apollo: false, clay: "Limited", salesnav: false, agency: "Manual" },
  { feature: "AI agents (auto-discovery)", intentsly: true, apollo: false, clay: "Workflow", salesnav: false, agency: false },
  { feature: "No data subscription needed", intentsly: true, apollo: false, clay: false, salesnav: false, agency: true },
  { feature: "Setup in minutes", intentsly: true, apollo: "Hours", clay: "Days", salesnav: "Hours", agency: "Weeks" },
  { feature: "Monthly cost", intentsly: "$97", apollo: "$99+", clay: "$149+", salesnav: "$99", agency: "$2k+" },
];

const EASE = [0.22, 1, 0.36, 1] as const;

const Cell = ({
  value,
  highlight = false,
  delay = 0,
}: {
  value: boolean | string;
  highlight?: boolean;
  delay?: number;
}) => {
  if (value === true) {
    return (
      <div className="flex justify-center">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.4, delay, ease: EASE }}
          className={`w-7 h-7 rounded-full flex items-center justify-center ${highlight ? "bg-[#C8FF00] shadow-[0_2px_8px_-2px_rgba(200,255,0,0.6)]" : "bg-muted"}`}
        >
          <Check className="w-4 h-4" style={{ color: "hsl(var(--aeline-dark))" }} strokeWidth={highlight ? 3 : 2} />
        </motion.div>
      </div>
    );
  }
  if (value === false) {
    return (
      <div className="flex justify-center">
        <div className="w-7 h-7 rounded-full flex items-center justify-center bg-muted/60">
          <X className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>
    );
  }
  return (
    <div className="text-center text-sm font-medium" style={{ color: highlight ? "hsl(var(--aeline-dark))" : "hsl(var(--muted-foreground))" }}>
      {value}
    </div>
  );
};

const Comparison = () => {
  return (
    <section id="comparison" className="py-14 md:py-32 px-5 md:px-6 bg-background">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="max-w-2xl mb-8 md:mb-14"
        >
          <span className="section-label mb-4 md:mb-6 block">Comparison</span>
          <h2 className="text-[28px] md:text-5xl font-medium tracking-tight leading-[1.1] mb-3 md:mb-4" style={{ color: "hsl(var(--aeline-dark))" }}>
            Why Intentsly wins on intent
          </h2>
          <p className="text-[15px] md:text-base text-muted-foreground leading-relaxed">
            Other tools give you data. Intentsly gives you timing.
          </p>
        </motion.div>

        {/* Desktop: full table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="hidden md:block relative rounded-3xl bg-[#f5f5f5] p-4 md:p-6 overflow-x-auto"
        >
          <table className="w-full min-w-[720px] relative" style={{ tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: "26%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "14.5%" }} />
              <col style={{ width: "14.5%" }} />
              <col style={{ width: "14.5%" }} />
              <col style={{ width: "14.5%" }} />
            </colgroup>
            <thead>
              <tr className="border-b border-border/60">
                <th className="text-left px-4 py-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground"> </th>
                <th className="px-4 py-4 relative align-top">
                  {/* Lime column glow — anchored directly to the Intentsly header */}
                  <div
                    className="hidden md:block pointer-events-none absolute left-1/2 -translate-x-1/2 top-2 w-[88%] rounded-2xl"
                    style={{
                      height: "calc(100% + 1000px)",
                      maxHeight: "640px",
                      boxShadow: "inset 0 0 0 1.5px rgba(200,255,0,0.55), 0 12px 36px -10px rgba(200,255,0,0.45)",
                      background: "linear-gradient(180deg, rgba(200,255,0,0.06) 0%, rgba(200,255,0,0) 100%)",
                      zIndex: 0,
                    }}
                    aria-hidden
                  />
                  <div className="relative z-10 flex flex-col items-center gap-2 pt-1">
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.3 }}
                      transition={{ duration: 0.5, delay: 0.2, ease: EASE }}
                      className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[hsl(var(--aeline-dark))] text-white text-[10px] font-bold uppercase tracking-wider shadow-lg z-20 motion-safe:animate-float whitespace-nowrap"
                    >
                      <Sparkles className="w-3 h-3 text-[#C8FF00]" />
                      Best value
                    </motion.div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#C8FF00]">
                      <span className="text-sm font-bold" style={{ color: "hsl(var(--aeline-dark))" }}>Intentsly</span>
                    </div>
                  </div>
                </th>
                {[
                  { name: "Apollo", domain: "apollo.io" },
                  { name: "Clay", domain: "clay.com" },
                  { name: "Sales Nav", domain: "linkedin.com" },
                  { name: "Agencies", domain: null },
                ].map((c) => (
                  <th key={c.name} className="px-4 py-4">
                    <div className="inline-flex items-center gap-2">
                      {c.domain ? (
                        <img
                          src={`https://www.google.com/s2/favicons?domain=${c.domain}&sz=64`}
                          alt={`${c.name} logo`}
                          loading="lazy"
                          className="w-5 h-5 rounded-md object-contain"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-md bg-muted-foreground/15 flex items-center justify-center">
                          <span className="text-[9px] font-bold text-muted-foreground">A</span>
                        </div>
                      )}
                      <span className="text-sm font-semibold text-muted-foreground">{c.name}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <motion.tr
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.4, delay: i * 0.06, ease: EASE }}
                  whileHover={{ backgroundColor: "rgba(200,255,0,0.06)", transition: { duration: 0.25 } }}
                  className={i < rows.length - 1 ? "border-b border-border/40" : ""}
                >
                  <td className="px-4 py-4 text-sm font-medium" style={{ color: "hsl(var(--aeline-dark))" }}>
                    {row.feature}
                  </td>
                  <td className="px-4 py-4"><Cell value={row.intentsly} highlight delay={i * 0.06 + 0.15} /></td>
                  <td className="px-4 py-4"><Cell value={row.apollo} delay={i * 0.06} /></td>
                  <td className="px-4 py-4"><Cell value={row.clay} delay={i * 0.06} /></td>
                  <td className="px-4 py-4"><Cell value={row.salesnav} delay={i * 0.06} /></td>
                  <td className="px-4 py-4"><Cell value={row.agency} delay={i * 0.06} /></td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        {/* Mobile: compact table (mirrors desktop structure, sized for 375px+) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="md:hidden relative rounded-2xl bg-[#f5f5f5] p-2.5 overflow-hidden"
        >
          <table className="w-full" style={{ tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: "36%" }} />
              <col style={{ width: "17%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "12%" }} />
            </colgroup>
            <thead>
              <tr className="border-b border-border/60">
                <th className="text-left px-1.5 py-2.5"> </th>
                {/* Intentsly — highlighted */}
                <th className="px-1 py-2.5 relative align-bottom">
                  <div
                    className="pointer-events-none absolute inset-x-0 top-1 bottom-[-9999px] rounded-t-xl"
                    style={{
                      boxShadow: "inset 0 0 0 1.5px rgba(200,255,0,0.55)",
                      background: "linear-gradient(180deg, rgba(200,255,0,0.10) 0%, rgba(200,255,0,0) 100%)",
                      clipPath: "inset(0 0 0 0)",
                    }}
                    aria-hidden
                  />
                  <div className="relative z-10 flex justify-center">
                    <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#C8FF00]">
                      <span className="text-[10px] font-bold leading-none" style={{ color: "hsl(var(--aeline-dark))" }}>Intentsly</span>
                    </div>
                  </div>
                </th>
                {[
                  { name: "Apollo", domain: "apollo.io" },
                  { name: "Clay", domain: "clay.com" },
                  { name: "Sales Nav", domain: "linkedin.com" },
                  { name: "Agencies", domain: null },
                ].map((c) => (
                  <th key={c.name} className="px-1 py-2.5">
                    <div className="flex justify-center" title={c.name}>
                      {c.domain ? (
                        <img
                          src={`https://www.google.com/s2/favicons?domain=${c.domain}&sz=64`}
                          alt={c.name}
                          loading="lazy"
                          className="w-4 h-4 rounded object-contain"
                        />
                      ) : (
                        <div className="w-4 h-4 rounded bg-muted-foreground/15 flex items-center justify-center">
                          <span className="text-[8px] font-bold text-muted-foreground">A</span>
                        </div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const renderCompact = (v: boolean | string, highlight = false) => {
                  if (v === true) {
                    return (
                      <div className="flex justify-center">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${highlight ? "bg-[#C8FF00]" : "bg-muted"}`}>
                          <Check className="w-3 h-3" style={{ color: "hsl(var(--aeline-dark))" }} strokeWidth={3} />
                        </div>
                      </div>
                    );
                  }
                  if (v === false) {
                    return (
                      <div className="flex justify-center">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center bg-muted/60">
                          <X className="w-3 h-3 text-muted-foreground" />
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div className="text-center text-[10px] font-semibold leading-tight" style={{ color: highlight ? "hsl(var(--aeline-dark))" : "hsl(var(--muted-foreground))" }}>
                      {v}
                    </div>
                  );
                };
                return (
                  <motion.tr
                    key={i}
                    initial={{ opacity: 0, y: 4 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.35, delay: i * 0.04, ease: EASE }}
                    className={i < rows.length - 1 ? "border-b border-border/40" : ""}
                  >
                    <td className="px-1.5 py-3 text-[11px] font-medium leading-snug" style={{ color: "hsl(var(--aeline-dark))" }}>
                      {row.feature}
                    </td>
                    <td className="px-1 py-3 relative">
                      <div
                        className="pointer-events-none absolute inset-x-0 top-0 bottom-0"
                        style={{ boxShadow: "inset 1.5px 0 0 rgba(200,255,0,0.55), inset -1.5px 0 0 rgba(200,255,0,0.55)" }}
                        aria-hidden
                      />
                      <div className="relative z-10">{renderCompact(row.intentsly, true)}</div>
                    </td>
                    <td className="px-1 py-3">{renderCompact(row.apollo)}</td>
                    <td className="px-1 py-3">{renderCompact(row.clay)}</td>
                    <td className="px-1 py-3">{renderCompact(row.salesnav)}</td>
                    <td className="px-1 py-3">{renderCompact(row.agency)}</td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </motion.div>


        {/* CTA below table */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="mt-10 flex flex-col md:flex-row items-center justify-center gap-5 text-center"
        >
          <p className="text-lg md:text-xl font-medium" style={{ color: "hsl(var(--aeline-dark))" }}>
            Save thousands. Get better leads.
          </p>
          <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.96 }} transition={{ type: "spring", stiffness: 400, damping: 18 }}>
            <Link
              to="/register"
              className="relative inline-flex items-center gap-2 bg-[hsl(var(--aeline-dark))] text-white px-6 py-3 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity shadow-[0_8px_24px_-8px_rgba(15,23,42,0.4)] overflow-hidden group"
            >
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" aria-hidden />
              <span className="relative">Start for $97</span>
              <ArrowRight className="w-4 h-4 relative transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Comparison;

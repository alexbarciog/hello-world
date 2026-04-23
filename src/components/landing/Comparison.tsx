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
    <section id="comparison" className="py-20 md:py-32 px-6 bg-background">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="max-w-2xl mb-14"
        >
          <span className="section-label mb-6 block">Comparison</span>
          <h2 className="text-4xl md:text-5xl font-medium tracking-tight leading-[1.1] mb-4" style={{ color: "hsl(var(--aeline-dark))" }}>
            Why Intentsly wins on intent
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
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

        {/* Mobile: stacked card per row */}
        <div className="md:hidden space-y-3">
          {rows.map((row, i) => {
            const competitors = [
              { name: "Apollo", domain: "apollo.io", value: row.apollo },
              { name: "Clay", domain: "clay.com", value: row.clay },
              { name: "Sales Nav", domain: "linkedin.com", value: row.salesnav },
              { name: "Agencies", domain: null, value: row.agency },
            ];
            const renderValue = (v: boolean | string) => {
              if (v === true) return <Check className="w-3.5 h-3.5 text-emerald-600" strokeWidth={3} />;
              if (v === false) return <X className="w-3.5 h-3.5 text-muted-foreground/60" />;
              return <span className="text-[11px] font-semibold" style={{ color: "hsl(var(--aeline-dark))" }}>{v}</span>;
            };
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.4, delay: i * 0.05, ease: EASE }}
                className="rounded-2xl bg-[#f5f5f5] p-4"
              >
                <p className="text-sm font-semibold mb-3" style={{ color: "hsl(var(--aeline-dark))" }}>
                  {row.feature}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {/* Intentsly pill — highlighted */}
                  <div className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-white ring-1.5 ring-[#C8FF00] shadow-[0_0_0_2px_rgba(200,255,0,0.25)]" style={{ boxShadow: "inset 0 0 0 1.5px rgba(200,255,0,0.7), 0 4px 12px -4px rgba(200,255,0,0.4)" }}>
                    <span className="text-[11px] font-bold" style={{ color: "hsl(var(--aeline-dark))" }}>Intentsly</span>
                    <span className="flex items-center justify-center min-w-[20px]">
                      {row.intentsly === true ? (
                        <span className="w-5 h-5 rounded-full bg-[#C8FF00] flex items-center justify-center">
                          <Check className="w-3 h-3" style={{ color: "hsl(var(--aeline-dark))" }} strokeWidth={3} />
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold" style={{ color: "hsl(var(--aeline-dark))" }}>{String(row.intentsly)}</span>
                      )}
                    </span>
                  </div>
                  {competitors.map((c) => (
                    <div key={c.name} className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-white border border-border/40">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {c.domain ? (
                          <img
                            src={`https://www.google.com/s2/favicons?domain=${c.domain}&sz=64`}
                            alt=""
                            loading="lazy"
                            className="w-3.5 h-3.5 rounded object-contain shrink-0"
                          />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded bg-muted-foreground/15 flex items-center justify-center shrink-0">
                            <span className="text-[7px] font-bold text-muted-foreground">A</span>
                          </div>
                        )}
                        <span className="text-[11px] font-medium text-muted-foreground truncate">{c.name}</span>
                      </div>
                      <span className="flex items-center justify-center min-w-[20px] shrink-0">
                        {renderValue(c.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

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
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-[hsl(var(--aeline-dark))] text-white px-6 py-3 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity shadow-[0_8px_24px_-8px_rgba(15,23,42,0.4)]"
          >
            Start for $97
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default Comparison;

import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

const rows = [
  { feature: "Intent-based targeting", intentsly: true, apollo: false, clay: false, salesnav: false, agency: "Manual" },
  { feature: "LinkedIn signal detection", intentsly: true, apollo: false, clay: "Limited", salesnav: false, agency: "Manual" },
  { feature: "AI agents (auto-discovery)", intentsly: true, apollo: false, clay: "Workflow", salesnav: false, agency: false },
  { feature: "No data subscription needed", intentsly: true, apollo: false, clay: false, salesnav: false, agency: true },
  { feature: "Setup in minutes", intentsly: true, apollo: "Hours", clay: "Days", salesnav: "Hours", agency: "Weeks" },
  { feature: "Monthly cost", intentsly: "$97", apollo: "$99+", clay: "$149+", salesnav: "$99", agency: "$2k+" },
];

const Cell = ({ value, highlight = false }: { value: boolean | string; highlight?: boolean }) => {
  if (value === true) {
    return (
      <div className="flex justify-center">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center ${highlight ? "bg-[#C8FF00]" : "bg-muted"}`}>
          <Check className="w-4 h-4" style={{ color: "hsl(var(--aeline-dark))" }} />
        </div>
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
          transition={{ duration: 0.5, ease: "easeOut" }}
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="rounded-3xl bg-[#f5f5f5] p-4 md:p-6 overflow-x-auto"
        >
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-border/60">
                <th className="text-left px-4 py-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground"> </th>
                <th className="px-4 py-4">
                  <div className="inline-flex flex-col items-center gap-1 px-3 py-1.5 rounded-full bg-[#C8FF00]">
                    <span className="text-sm font-bold" style={{ color: "hsl(var(--aeline-dark))" }}>Intentsly</span>
                  </div>
                </th>
                <th className="px-4 py-4 text-sm font-semibold text-muted-foreground">Apollo</th>
                <th className="px-4 py-4 text-sm font-semibold text-muted-foreground">Clay</th>
                <th className="px-4 py-4 text-sm font-semibold text-muted-foreground">Sales Nav</th>
                <th className="px-4 py-4 text-sm font-semibold text-muted-foreground">Agencies</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className={i < rows.length - 1 ? "border-b border-border/40" : ""}>
                  <td className="px-4 py-4 text-sm font-medium" style={{ color: "hsl(var(--aeline-dark))" }}>
                    {row.feature}
                  </td>
                  <td className="px-4 py-4"><Cell value={row.intentsly} highlight /></td>
                  <td className="px-4 py-4"><Cell value={row.apollo} /></td>
                  <td className="px-4 py-4"><Cell value={row.clay} /></td>
                  <td className="px-4 py-4"><Cell value={row.salesnav} /></td>
                  <td className="px-4 py-4"><Cell value={row.agency} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </section>
  );
};

export default Comparison;

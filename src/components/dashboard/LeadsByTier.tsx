import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import { CountUp } from "@/lib/motion";

interface TierData {
  name: string;
  value: number;
  color: string;
}

interface LeadsByTierProps {
  data: TierData[];
  loading: boolean;
}

const EASE = [0.22, 1, 0.36, 1] as const;

const LeadsByTier = ({ data, loading }: LeadsByTierProps) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  const hasData = total > 0;

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="rounded-[20px] p-5 bg-white border border-neutral-200/70 shadow-[0_1px_2px_rgba(10,10,10,0.03)] hover:shadow-[0_10px_30px_-12px_rgba(10,10,10,0.15)] transition-shadow"
    >
      <h3 className="text-[11px] uppercase tracking-[0.14em] font-medium text-neutral-500 mb-3">Leads by Tier</h3>
      {loading ? (
        <div className="h-[160px] flex items-center justify-center">
          <div className="h-6 w-32 bg-white/60 rounded-lg animate-pulse" />
        </div>
      ) : !hasData ? (
        <div className="h-[160px] flex items-center justify-center">
          <p className="text-sm text-neutral-400">No leads yet</p>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <div className="relative">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  dataKey="value"
                  stroke="none"
                  isAnimationActive
                  animationDuration={1100}
                  animationEasing="ease-out"
                >
                  {data.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <CountUp to={total} duration={1.4} className="text-xl font-bold text-neutral-900" />
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider">Total</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 flex-1">
            {data.map((entry, i) => {
              const pct = total > 0 ? Math.round((entry.value / total) * 100) : 0;
              return (
                <motion.div
                  key={entry.name}
                  initial={{ opacity: 0, x: 8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.2 + i * 0.08, ease: EASE }}
                  className="flex items-center gap-2.5"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-neutral-500 whitespace-nowrap">{entry.name}</span>
                  <span className="text-sm font-semibold text-neutral-900 ml-auto">
                    {pct}%
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default LeadsByTier;

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import { CountUp } from "@/lib/motion";
import { MoreHorizontal } from "lucide-react";

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

// Semantic tier palette: hot = goji brand orange, warm = amber, cold = light blue
const PALETTE = ["#FA7534", "#FBBF24", "#93C5FD"];

const LeadsByTier = ({ data, loading }: LeadsByTierProps) => {
  const themed = data.map((d, i) => ({ ...d, color: PALETTE[i] ?? d.color }));
  const total = themed.reduce((s, d) => s + d.value, 0);
  const hot = themed.find((d) => d.name.toLowerCase() === "hot")?.value ?? 0;
  const pctHot = total > 0 ? Math.round((hot / total) * 100) : 0;
  const hasData = total > 0;

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="rounded-2xl p-6 bg-white border border-[#F0F0F2] hover:shadow-[0_12px_32px_-16px_rgba(10,10,10,0.12)] transition-shadow flex flex-col"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-[15px] font-semibold text-neutral-900 tracking-tight">Leads by Tier</h3>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-[34px] leading-none font-semibold tracking-[-0.03em] text-neutral-900">
              <CountUp to={total} duration={1.4} />
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
              ↑ {pctHot}% hot
            </span>
          </div>
        </div>
        <button className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:bg-neutral-50 hover:text-neutral-700 transition-colors">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="h-[180px] flex items-center justify-center">
          <div className="h-6 w-32 bg-neutral-100 rounded-lg animate-pulse" />
        </div>
      ) : !hasData ? (
        <div className="h-[180px] flex items-center justify-center">
          <p className="text-sm text-neutral-400">No leads yet</p>
        </div>
      ) : (
        <>
          <div className="relative mx-auto mt-4">
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie
                  data={themed}
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={82}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                  isAnimationActive
                  animationDuration={1100}
                  animationEasing="ease-out"
                >
                  {themed.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[26px] font-semibold text-neutral-900 tracking-tight">{pctHot}%</span>
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider mt-0.5">Hot rate</span>
            </div>
          </div>

          <div className="flex items-center justify-center flex-wrap gap-x-5 gap-y-2 mt-5">
            {themed.map((entry, i) => (
              <motion.div
                key={entry.name}
                initial={{ opacity: 0, y: 6 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.15 + i * 0.06, ease: EASE }}
                className="flex items-center gap-1.5"
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-[12px] text-neutral-500">{entry.name}</span>
                <span className="text-[12px] text-neutral-900 font-semibold ml-1">{entry.value}</span>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
};

export default LeadsByTier;

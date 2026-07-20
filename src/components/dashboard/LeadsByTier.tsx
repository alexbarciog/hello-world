import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import { CountUp } from "@/lib/motion";
import { PieChart as PieIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { WidgetCard, WidgetHeader } from "./WidgetCard";

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

  const navigate = useNavigate();

  return (
    <WidgetCard className="p-5 flex flex-col">
      <WidgetHeader
        icon={PieIcon}
        title="Leads by tier"
        onExpand={() => navigate("/contacts")}
        menuItems={[{ label: "View contacts", onSelect: () => navigate("/contacts") }]}
      />
      <div className="flex items-baseline gap-2.5 mt-3">
        <span className="text-[13px] text-neutral-500">
          <span className="font-semibold text-neutral-900"><CountUp to={total} duration={1.4} /></span> total leads
        </span>
        <span className="text-[12.5px] font-semibold text-goji-orange">{pctHot}% hot</span>
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
    </WidgetCard>
  );
};

export default LeadsByTier;

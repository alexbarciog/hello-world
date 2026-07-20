import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
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

// Semantic tier palette: hot = goji brand orange, warm = amber, cold = light blue
const PALETTE = ["#FA7534", "#FBBF24", "#93C5FD"];

/**
 * Compact horizontal tier card: small donut on the left, tier rows on the
 * right — sized to sit beside the mini stat cards without towering over them.
 */
const LeadsByTier = ({ data, loading }: LeadsByTierProps) => {
  const navigate = useNavigate();
  const themed = data.map((d, i) => ({ ...d, color: PALETTE[i] ?? d.color }));
  const total = themed.reduce((s, d) => s + d.value, 0);
  const hot = themed.find((d) => d.name.toLowerCase() === "hot")?.value ?? 0;
  const pctHot = total > 0 ? Math.round((hot / total) * 100) : 0;
  const hasData = total > 0;

  return (
    <WidgetCard className="p-5">
      <WidgetHeader
        icon={PieIcon}
        title="Leads by tier"
        onExpand={() => navigate("/contacts")}
        menuItems={[{ label: "View contacts", onSelect: () => navigate("/contacts") }]}
      />

      {loading ? (
        <div className="h-[132px] mt-3.5 flex items-center justify-center">
          <div className="h-6 w-32 bg-neutral-100 rounded-lg animate-pulse" />
        </div>
      ) : !hasData ? (
        <div className="h-[132px] mt-3.5 flex items-center justify-center">
          <p className="text-sm text-neutral-400">No leads yet</p>
        </div>
      ) : (
        <div className="flex items-center gap-6 mt-3.5">
          {/* Small donut */}
          <div className="relative shrink-0" style={{ width: 124, height: 124 }}>
            <ResponsiveContainer width={124} height={124}>
              <PieChart>
                <Pie
                  data={themed}
                  cx="50%"
                  cy="50%"
                  innerRadius={41}
                  outerRadius={58}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                  isAnimationActive
                  animationDuration={1000}
                  animationEasing="ease-out"
                >
                  {themed.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[19px] font-semibold text-neutral-900 tracking-tight">{pctHot}%</span>
              <span className="text-[9px] text-neutral-400 uppercase tracking-wider">hot</span>
            </div>
          </div>

          {/* Tier rows */}
          <div className="flex-1 min-w-0 space-y-2.5">
            <div className="text-[12.5px] text-neutral-400">
              <span className="font-semibold text-neutral-900 text-[13.5px]">
                <CountUp to={total} duration={1.2} />
              </span>{" "}
              total leads
            </div>
            {themed.map((entry) => {
              const pct = total > 0 ? Math.round((entry.value / total) * 100) : 0;
              return (
                <div key={entry.name} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                  <span className="text-[12.5px] text-neutral-500 w-12">{entry.name}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-[#F4F4F5] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-[width] duration-700"
                      style={{ width: `${pct}%`, backgroundColor: entry.color }}
                    />
                  </div>
                  <span className="text-[12.5px] font-semibold text-neutral-900 w-12 text-right tabular-nums">
                    {entry.value}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </WidgetCard>
  );
};

export default LeadsByTier;

import { motion } from "framer-motion";
import { CountUp } from "@/lib/motion";
import type { LucideIcon } from "lucide-react";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface MiniStatCardProps {
  title: string;
  icon: LucideIcon;
  value: number | string;
  /** % change vs the previous window; null hides the chip */
  delta?: number | null;
  deltaLabel?: string;
  sublabel?: string;
  data: { d: string; v: number }[];
  color: string;
  kind: "bars" | "line";
  loading?: boolean;
}

const EASE = [0.22, 1, 0.36, 1] as const;

function MiniTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { d: string; v: number } }> }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="bg-white rounded-lg border border-[#F0F0F2] shadow-[0_8px_24px_-8px_rgba(10,10,10,0.15)] px-2.5 py-1.5 text-[11px]">
      <span className="text-neutral-400">{p.d}</span>
      <span className="text-neutral-900 font-semibold ml-2">{p.v}</span>
    </div>
  );
}

/**
 * Reference-style compact stat card: title row, big value + delta chip on the
 * left, a small live chart (bars or line) on the right.
 */
export function MiniStatCard({
  title,
  icon: Icon,
  value,
  delta,
  deltaLabel,
  sublabel,
  data,
  color,
  kind,
  loading,
}: MiniStatCardProps) {
  const numeric = typeof value === "number" ? value : null;
  const deltaPositive = (delta ?? 0) >= 0;
  const hasSeries = data.some((p) => p.v > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.55, ease: EASE }}
      whileHover={{ y: -3 }}
      className="rounded-2xl bg-white border border-[#F0F0F2] p-5 min-w-0 hover:shadow-[0_12px_32px_-16px_rgba(10,10,10,0.12)] transition-shadow"
    >
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-neutral-500" strokeWidth={1.9} />
        <h3 className="text-[13.5px] font-semibold text-neutral-900 tracking-tight truncate">{title}</h3>
      </div>

      <div className="flex items-end justify-between gap-3 mt-3">
        <div className="min-w-0">
          {loading ? (
            <div className="h-8 w-20 bg-neutral-100 rounded animate-pulse" />
          ) : (
            <div className="text-[28px] leading-none font-semibold tracking-[-0.03em] text-[#0a0a0a]">
              {numeric !== null ? <CountUp to={numeric} duration={1.2} /> : value}
            </div>
          )}
          {delta != null ? (
            <div className={`mt-1.5 text-[11.5px] font-semibold ${deltaPositive ? "text-emerald-600" : "text-rose-500"}`}>
              {deltaPositive ? "↗" : "↘"} {deltaPositive ? "+" : ""}{delta}%{" "}
              {deltaLabel && <span className="text-neutral-400 font-medium">{deltaLabel}</span>}
            </div>
          ) : sublabel ? (
            <div className="mt-1.5 text-[11.5px] text-neutral-400 font-medium truncate">{sublabel}</div>
          ) : null}
        </div>

        <div className="w-[110px] h-[48px] shrink-0">
          {loading ? (
            <div className="w-full h-full bg-neutral-50 rounded animate-pulse" />
          ) : !hasSeries ? (
            <div className="w-full h-full flex items-end gap-[3px] opacity-40" aria-hidden>
              {data.map((_, i) => (
                <div key={i} className="flex-1 rounded-t-[2px] bg-[#F0F0F2]" style={{ height: `${18 + (i % 3) * 10}%` }} />
              ))}
            </div>
          ) : kind === "bars" ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                <Tooltip cursor={{ fill: "rgba(10,10,10,0.03)" }} content={<MiniTooltip />} />
                <Bar dataKey="v" fill={color} radius={[2, 2, 0, 0]} barSize={7} isAnimationActive animationDuration={900} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 2 }}>
                <Tooltip cursor={{ stroke: "#E5E5E5", strokeWidth: 1 }} content={<MiniTooltip />} />
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke={color}
                  strokeWidth={2}
                  dot={{ r: 2, fill: color, strokeWidth: 0 }}
                  isAnimationActive
                  animationDuration={900}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </motion.div>
  );
}

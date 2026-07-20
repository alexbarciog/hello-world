import { CountUp } from "@/lib/motion";
import type { LucideIcon } from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { WidgetCard, WidgetHeader, DeltaBadge } from "./WidgetCard";

interface MiniStatCardProps {
  title: string;
  icon: LucideIcon;
  value: number | string;
  /** % change vs the previous window; null hides the badge */
  delta?: number | null;
  deltaLabel?: string;
  sublabel?: string;
  data: { d: string; v: number }[];
  /** Accent for the emphasized marks (rest of the series stays grey) */
  color: string;
  kind: "bars" | "line";
  loading?: boolean;
  onExpand?: () => void;
}

const GREY_MARK = "#E7E7EA";
const GREY_LINE = "#D6D6DA";

function MiniTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { d: string; v: number } }> }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="bg-white rounded-lg border border-[#F0F0F1] shadow-[0_8px_24px_-8px_rgba(10,10,10,0.15)] px-2.5 py-1.5 text-[11px]">
      <span className="text-neutral-400">{p.d}</span>
      <span className="text-neutral-900 font-semibold ml-2">{p.v}</span>
    </div>
  );
}

/**
 * Reference-style compact stat card (the "Comments"/"Commits" pattern):
 * header row with actions cluster, big value + diagonal-arrow delta on the
 * left, a small grey-base chart with accent-highlighted marks on the right.
 */
export function MiniStatCard({
  title,
  icon,
  value,
  delta,
  deltaLabel = "(7d)",
  sublabel,
  data,
  color,
  kind,
  loading,
  onExpand,
}: MiniStatCardProps) {
  const numeric = typeof value === "number" ? value : null;
  const hasSeries = data.some((p) => p.v > 0);
  const maxV = Math.max(...data.map((p) => p.v), 0);
  const lastIdx = data.length - 1;

  return (
    <WidgetCard className="p-5">
      <WidgetHeader icon={icon} title={title} onExpand={onExpand} />

      <div className="flex items-end justify-between gap-3 mt-3.5">
        <div className="min-w-0">
          {loading ? (
            <div className="h-8 w-20 bg-neutral-100 rounded animate-pulse" />
          ) : (
            <div className="text-[28px] leading-none font-semibold tracking-[-0.03em] text-[#0a0a0a]">
              {numeric !== null ? <CountUp to={numeric} duration={1.2} /> : value}
            </div>
          )}
          <div className="mt-2 min-h-[18px]">
            {delta != null ? (
              <DeltaBadge delta={delta} windowLabel={deltaLabel} />
            ) : sublabel ? (
              <span className="text-[11.5px] text-neutral-400 font-medium truncate block">{sublabel}</span>
            ) : null}
          </div>
        </div>

        <div className={`w-[116px] h-[52px] shrink-0 ${!loading && !hasSeries ? "hidden" : ""}`}>
          {loading ? (
            <div className="w-full h-full bg-neutral-50 rounded animate-pulse" />
          ) : !hasSeries ? null : kind === "bars" ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                <Tooltip cursor={{ fill: "rgba(10,10,10,0.03)" }} content={<MiniTooltip />} />
                <Bar dataKey="v" radius={[2, 2, 2, 2]} barSize={7} isAnimationActive animationDuration={900}>
                  {/* Grey base series; accent only on the emphasized marks (today / peak) */}
                  {data.map((p, i) => (
                    <Cell key={i} fill={i === lastIdx || (p.v === maxV && p.v > 0) ? color : GREY_MARK} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 6, right: 6, left: 6, bottom: 4 }}>
                <Tooltip cursor={{ stroke: GREY_LINE, strokeWidth: 1 }} content={<MiniTooltip />} />
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke={GREY_LINE}
                  strokeWidth={1.5}
                  isAnimationActive
                  animationDuration={900}
                  dot={(props: { cx?: number; cy?: number; index?: number; payload?: { v: number } }) => {
                    const { cx, cy, index, payload } = props;
                    if (cx == null || cy == null) return <g key={`d-${index}`} />;
                    const emphasized = index === lastIdx || (payload && payload.v === maxV && payload.v > 0);
                    return (
                      <circle
                        key={`d-${index}`}
                        cx={cx}
                        cy={cy}
                        r={emphasized ? 3 : 2.25}
                        fill={emphasized ? color : "#C9C9CF"}
                        stroke="#fff"
                        strokeWidth={1}
                      />
                    );
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </WidgetCard>
  );
}

import {
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";
import { motion } from "framer-motion";
import { ChevronDown, Check, TrendingUp, AlertCircle } from "lucide-react";
import { CountUp } from "@/lib/motion";
import { useState, useMemo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PerformanceChartProps {
  chartData: Array<{ date: string; leadsFound: number; contacted: number }>;
  loading?: boolean;
  error?: boolean;
}

// Validated series palette (CVD ΔE 33+): leads = indigo, contacted = goji orange.
const LEADS_COLOR = "#4F46E5";
const CONTACTED_COLOR = "#FA7534";

const RANGE_OPTIONS = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
  { label: "All time", days: 0 },
] as const;

export function PerformanceChart({ chartData, loading, error }: PerformanceChartProps) {
  const [range, setRange] = useState<(typeof RANGE_OPTIONS)[number]>(RANGE_OPTIONS[1]);

  const visibleData = useMemo(() => {
    if (!range.days || chartData.length <= range.days) return chartData;
    return chartData.slice(-range.days);
  }, [chartData, range]);

  const hasData = visibleData.some((d) => d.leadsFound > 0 || d.contacted > 0);
  const total = visibleData.reduce((s, d) => s + d.leadsFound, 0);
  const half = Math.floor(visibleData.length / 2);
  const firstHalf = visibleData.slice(0, half).reduce((s, d) => s + d.leadsFound, 0);
  const secondHalf = visibleData.slice(half).reduce((s, d) => s + d.leadsFound, 0);
  const delta = firstHalf > 0 ? Math.round(((secondHalf - firstHalf) / firstHalf) * 100) : 0;
  const deltaPositive = delta >= 0;

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="rounded-2xl p-6 bg-white border border-[#F0F0F2] hover:shadow-[0_12px_32px_-16px_rgba(10,10,10,0.12)] transition-shadow"
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-neutral-500" strokeWidth={1.9} />
            <h2 className="text-[15px] font-semibold text-neutral-900 tracking-tight">Leads found</h2>
          </div>
          <div className="flex items-baseline gap-2 mt-2.5">
            <span className="text-[32px] leading-none font-semibold tracking-[-0.03em] text-[#0a0a0a]">
              {loading ? "—" : <CountUp to={total} duration={1.4} />}
            </span>
            {!loading && hasData && (
              <span className={`text-[11.5px] font-semibold ${deltaPositive ? "text-emerald-600" : "text-rose-500"}`}>
                {deltaPositive ? "↗" : "↘"} {deltaPositive ? "+" : ""}{delta}%{" "}
                <span className="text-neutral-400 font-medium">({range.label.toLowerCase().replace("last ", "")})</span>
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Legend — identity never color-alone; labels sit beside the marks */}
          <div className="hidden sm:flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: LEADS_COLOR }} />
              <span className="text-[11.5px] text-neutral-500">Leads found</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: CONTACTED_COLOR }} />
              <span className="text-[11.5px] text-neutral-500">Contacted</span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center gap-1.5 text-[12px] font-medium text-neutral-700 bg-white border border-[#F0F0F2] rounded-full px-3.5 py-2 hover:bg-neutral-50 transition-colors">
                {range.label}
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[160px]">
              {RANGE_OPTIONS.map((opt) => (
                <DropdownMenuItem
                  key={opt.label}
                  onSelect={() => setRange(opt)}
                  className="text-[12px] flex items-center justify-between"
                >
                  {opt.label}
                  {opt.label === range.label && <Check className="w-3.5 h-3.5 text-neutral-500" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div style={{ height: 240 }}>
        {loading ? (
          <div className="h-full flex flex-col justify-end gap-0 animate-pulse">
            <div className="flex-1 rounded-xl bg-neutral-50" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <AlertCircle className="w-5 h-5 text-neutral-300" />
            <p className="text-sm text-neutral-400">Couldn't load chart data — refresh to retry</p>
          </div>
        ) : !hasData ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-neutral-400">No leads yet — start a campaign to see data here</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={visibleData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="leadsFillIndigo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={LEADS_COLOR} stopOpacity={0.14} />
                  <stop offset="100%" stopColor={LEADS_COLOR} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#F4F4F5" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#a3a3a3" }}
                tickLine={false}
                axisLine={false}
                minTickGap={28}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#a3a3a3" }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                width={44}
                tickFormatter={(v) => (v >= 1000 ? `${v / 1000}K` : v)}
              />
              <Tooltip
                cursor={{ stroke: "#E5E5E5", strokeWidth: 1, strokeDasharray: "3 3" }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const leads = payload.find((p) => p.dataKey === "leadsFound")?.value;
                  const contacted = payload.find((p) => p.dataKey === "contacted")?.value;
                  return (
                    <div className="bg-white rounded-xl border border-[#F0F0F2] shadow-[0_8px_24px_-8px_rgba(10,10,10,0.15)] px-3.5 py-2.5 text-xs min-w-[150px]">
                      <p className="text-neutral-400 mb-1.5 text-[10.5px] uppercase tracking-wider">{label}</p>
                      <div className="flex items-center justify-between gap-4">
                        <span className="flex items-center gap-1.5 text-neutral-500">
                          <span className="w-2 h-2 rounded-full" style={{ background: LEADS_COLOR }} />
                          Leads found
                        </span>
                        <span className="text-neutral-900 font-semibold">{leads}</span>
                      </div>
                      {contacted != null && (
                        <div className="flex items-center justify-between gap-4 mt-1">
                          <span className="flex items-center gap-1.5 text-neutral-500">
                            <span className="w-2 h-2 rounded-full" style={{ background: CONTACTED_COLOR }} />
                            Contacted
                          </span>
                          <span className="text-neutral-900 font-semibold">{contacted}</span>
                        </div>
                      )}
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="leadsFound"
                stroke={LEADS_COLOR}
                strokeWidth={2}
                fill="url(#leadsFillIndigo)"
                dot={false}
                isAnimationActive
                animationDuration={1200}
                animationEasing="ease-out"
                activeDot={{ r: 4.5, fill: LEADS_COLOR, stroke: "#fff", strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="contacted"
                stroke={CONTACTED_COLOR}
                strokeWidth={2}
                fill="transparent"
                dot={false}
                isAnimationActive
                animationDuration={1100}
                animationBegin={150}
                animationEasing="ease-out"
                activeDot={{ r: 4, fill: CONTACTED_COLOR, stroke: "#fff", strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}

import {
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";
import { motion } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
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
}

const RANGE_OPTIONS = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
  { label: "All time", days: 0 },
] as const;

export function PerformanceChart({ chartData }: PerformanceChartProps) {
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
      className="rounded-2xl p-6 bg-white border border-[#EBEBED] hover:shadow-[0_12px_32px_-16px_rgba(10,10,10,0.12)] transition-shadow"
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-[15px] font-semibold text-neutral-900 tracking-tight">Performance Overview</h2>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-[34px] leading-none font-semibold tracking-[-0.03em] text-neutral-900">
              <CountUp to={total} duration={1.4} />
            </span>
            <span className="text-[13px] text-neutral-400 font-medium">leads</span>
            <span className={`ml-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${deltaPositive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"}`}>
              {deltaPositive ? "+" : ""}{delta}%
            </span>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="inline-flex items-center gap-1.5 text-[12px] font-medium text-neutral-700 bg-white border border-[#EBEBED] rounded-full px-3.5 py-2 hover:bg-neutral-50 transition-colors">
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

      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
          <span className="text-[11px] text-neutral-500">Leads found</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-neutral-900" />
          <span className="text-[11px] text-neutral-500">Contacted</span>
        </div>
      </div>

      <div style={{ height: 240 }}>
        {!hasData ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-neutral-400">No leads yet — start a campaign to see data here</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={visibleData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="leadsFillBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#a3a3a3" }} tickLine={false} axisLine={false} interval={4} />
              <YAxis tick={{ fontSize: 11, fill: "#a3a3a3" }} tickLine={false} axisLine={false} allowDecimals={false} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}K` : v)} />
              <Tooltip
                cursor={{ stroke: "#e5e5e5", strokeWidth: 1, strokeDasharray: "3 3" }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const leads = payload.find((p) => p.dataKey === "leadsFound")?.value;
                  const contacted = payload.find((p) => p.dataKey === "contacted")?.value;
                  return (
                    <div className="bg-white rounded-xl border border-neutral-200 shadow-[0_8px_24px_-8px_rgba(10,10,10,0.15)] px-3.5 py-2.5 text-xs min-w-[140px]">
                      <p className="text-neutral-400 mb-1.5 text-[10.5px] uppercase tracking-wider">{label}</p>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-neutral-500">Leads found</span>
                        <span className="text-neutral-900 font-semibold">{leads}</span>
                      </div>
                      {contacted != null && (
                        <div className="flex items-center justify-between gap-4 mt-0.5">
                          <span className="text-neutral-500">Contacted</span>
                          <span className="text-[#3B82F6] font-semibold">{contacted}</span>
                        </div>
                      )}
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="leadsFound"
                stroke="#3B82F6"
                strokeWidth={2.4}
                fill="url(#leadsFillBlue)"
                dot={false}
                isAnimationActive
                animationDuration={1400}
                animationEasing="ease-out"
                activeDot={{ r: 5, fill: "#3B82F6", stroke: "#fff", strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="contacted"
                stroke="#0a0a0a"
                strokeWidth={1.6}
                fill="transparent"
                strokeDasharray="4 4"
                dot={false}
                isAnimationActive
                animationDuration={1200}
                animationBegin={200}
                animationEasing="ease-out"
                activeDot={{ r: 3, fill: "#0a0a0a", stroke: "#fff", strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}

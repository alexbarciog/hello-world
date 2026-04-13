import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChevronDown } from "lucide-react";

interface PerformanceChartProps {
  chartData: Array<{ date: string; leads: number }>;
}

export function PerformanceChart({ chartData }: PerformanceChartProps) {
  const hasData = chartData.some((d) => d.leads > 0);

  return (
    <div className="glass-card rounded-[2rem] overflow-hidden flex flex-col relative">
      <div className="p-6 md:p-8 pb-0">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <h2 className="text-2xl font-bold text-md-on-surface tracking-tight">Performance Velocity</h2>
            <p className="text-sm text-md-on-surface-variant font-medium mt-1">
              Real-time aggregate data across all channels
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-md-secondary" />
              <span className="text-[11px] text-md-on-surface-variant font-medium">Leads created</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-md-on-surface-variant bg-white/50 px-3 py-1.5 rounded-full border border-white/40">
              <span className="w-2 h-2 rounded-full bg-md-secondary animate-pulse" />
              Live Updates
            </div>
            <div className="flex items-center gap-1 border border-md-outline-variant rounded-full px-3 py-1.5 text-[11px] text-md-on-surface-variant bg-white/80 backdrop-blur-sm shadow-sm font-medium cursor-pointer hover:border-md-outline transition-colors">
              Last 30 days
              <ChevronDown className="w-3 h-3" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-grow relative mt-2" style={{ minHeight: 220 }}>
        {!hasData ? (
          <div className="flex flex-col items-center justify-center h-full py-12 gap-2">
            <p className="text-sm text-md-on-surface-variant italic">
              No leads yet — start a campaign to see performance data here
            </p>
          </div>
        ) : (
          <div className="px-3 md:px-6 pb-4" style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 12, left: -28, bottom: 0 }}>
                <defs>
                  <linearGradient id="mdGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#005d8f" stopOpacity={0.15} />
                    <stop offset="50%" stopColor="#5b3cdd" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#ffe170" stopOpacity={0.08} />
                  </linearGradient>
                  <linearGradient id="mdStroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#005d8f" />
                    <stop offset="50%" stopColor="#5b3cdd" />
                    <stop offset="100%" stopColor="#ffe170" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--md-outline-variant))" vertical={false} strokeOpacity={0.5} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--md-on-surface-variant))", fontWeight: 400 }} tickLine={false} axisLine={false} interval={3} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--md-on-surface-variant))", fontWeight: 400 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  cursor={{ stroke: "hsl(var(--md-secondary) / 0.2)", strokeWidth: 1, strokeDasharray: "4 3" }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="glass-card rounded-2xl px-4 py-3 shadow-2xl text-xs min-w-[120px]">
                        <p className="text-md-on-surface-variant mb-1 font-medium">{label}</p>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-md-secondary shadow-[0_0_6px_hsl(var(--md-secondary))]" />
                          <span className="text-md-on-surface font-bold text-sm">{payload[0].value}</span>
                          <span className="text-md-on-surface-variant">leads</span>
                        </div>
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="leads"
                  stroke="url(#mdStroke)"
                  strokeWidth={3}
                  fill="url(#mdGradient)"
                  dot={false}
                  activeDot={{ r: 6, fill: "#5b3cdd", stroke: "white", strokeWidth: 2.5 }}
                  style={{ filter: "drop-shadow(0px 4px 8px rgba(91, 60, 221, 0.2))" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

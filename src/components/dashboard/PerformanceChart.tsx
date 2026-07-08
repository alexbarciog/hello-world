import {
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from "recharts";
import { motion } from "framer-motion";

interface PerformanceChartProps {
  chartData: Array<{ date: string; leadsFound: number; contacted: number }>;
}

export function PerformanceChart({ chartData }: PerformanceChartProps) {
  const hasData = chartData.some((d) => d.leadsFound > 0 || d.contacted > 0);

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="rounded-[20px] p-5 bg-white border border-neutral-200/70 shadow-[0_1px_2px_rgba(10,10,10,0.03)] hover:shadow-[0_10px_30px_-12px_rgba(10,10,10,0.15)] transition-shadow"
    >
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-4">
        <h2 className="text-[11px] uppercase tracking-[0.14em] font-medium text-neutral-500">Lead Velocity</h2>
        <div className="w-px h-3 bg-neutral-200" />
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-neutral-900" />
          <span className="text-[11px] text-neutral-500">Leads Found</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
          <span className="text-[11px] text-neutral-500">Contacted</span>
        </div>
      </div>


      <div style={{ height: 200 }}>
        {!hasData ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-snow-black-20">
              No leads yet — start a campaign to see data here
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="leadsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#a3a3a3" }}
                tickLine={false}
                axisLine={false}
                interval={4}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#a3a3a3" }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                tickFormatter={(v) => (v >= 1000 ? `${v / 1000}K` : v)}
              />
              <Tooltip
                cursor={{ stroke: "#e5e5e5", strokeWidth: 1 }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="bg-white rounded-xl border border-neutral-200 shadow-lg px-3 py-2 text-xs">
                      <p className="text-neutral-400 mb-1">{label}</p>
                      <p className="text-neutral-900 font-semibold">
                        {payload[0]?.value} leads found
                      </p>
                      {payload[1] && (
                        <p className="text-[#3B82F6]">
                          {payload[1]?.value} contacted
                        </p>
                      )}
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="leadsFound"
                stroke="#0a0a0a"
                strokeWidth={2}
                fill="url(#leadsFill)"
                dot={false}
                isAnimationActive
                animationDuration={1400}
                animationEasing="ease-out"
                activeDot={{
                  r: 4,
                  fill: "#0a0a0a",
                  stroke: "#fff",
                  strokeWidth: 2,
                }}
              />
              <Line
                type="monotone"
                dataKey="contacted"
                stroke="#3B82F6"
                strokeWidth={2}
                strokeDasharray="5 4"
                dot={false}
                activeDot={{ r: 3, fill: "#3B82F6", stroke: "#fff", strokeWidth: 2 }}
                isAnimationActive
                animationDuration={1200}
                animationBegin={200}
                animationEasing="ease-out"
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}

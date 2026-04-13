import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface PerformanceChartProps {
  chartData: Array<{ date: string; leads: number }>;
}

export function PerformanceChart({ chartData }: PerformanceChartProps) {
  const hasData = chartData.some((d) => d.leads > 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-6 h-full">
      {/* Header with tabs */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-6">
          <h2 className="text-sm font-semibold text-gray-900">Lead Velocity</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-gray-900" />
            <span className="text-[11px] text-gray-500">This month</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-gray-300" />
            <span className="text-[11px] text-gray-500">Last month</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: 260 }}>
        {!hasData ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-400">No leads yet — start a campaign to see data here</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="leadsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
                interval={4}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ stroke: "#e5e7eb", strokeWidth: 1 }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="bg-white rounded-lg border border-gray-200 shadow-lg px-3 py-2 text-xs">
                      <p className="text-gray-500 mb-1">{label}</p>
                      <p className="text-gray-900 font-semibold">{payload[0].value} leads</p>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="leads"
                stroke="#a78bfa"
                strokeWidth={2}
                fill="url(#leadsFill)"
                dot={false}
                activeDot={{ r: 4, fill: "#a78bfa", stroke: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

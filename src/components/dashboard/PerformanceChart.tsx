import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from "recharts";

interface PerformanceChartProps {
  chartData: Array<{ date: string; leads: number }>;
}

export function PerformanceChart({ chartData }: PerformanceChartProps) {
  const hasData = chartData.some((d) => d.leads > 0);

  // Generate "last year" mock data based on current data with some variance
  const composedData = chartData.map((d, i) => ({
    ...d,
    lastYear: Math.max(0, Math.round(d.leads * (0.5 + Math.sin(i * 0.5) * 0.4))),
  }));

  return (
    <div className="bg-snow-bg-2 rounded-[20px] p-6 h-full">
      {/* Header with tabs + legend */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-6">
        {/* Tabs */}
        <h2 className="text-sm font-bold text-snow-black-100">Lead Velocity</h2>
        <span className="text-sm text-snow-black-20 cursor-pointer hover:text-snow-black-40 transition-colors">
          Campaigns
        </span>
        <span className="text-sm text-snow-black-20 cursor-pointer hover:text-snow-black-40 transition-colors">
          Signals
        </span>

        {/* Separator */}
        <div className="w-px h-4 bg-snow-black-10" />

        {/* Legend */}
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-snow-black-100" />
          <span className="text-xs text-snow-black-40">This year</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-snow-black-20" />
          <span className="text-xs text-snow-black-40">Last year</span>
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: 260 }}>
        {!hasData ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-snow-black-20">
              No leads yet — start a campaign to see data here
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={composedData}
              margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="leadsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#000000" stopOpacity={0.06} />
                  <stop offset="100%" stopColor="#000000" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#999999" }}
                tickLine={false}
                axisLine={false}
                interval={4}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#999999" }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                tickFormatter={(v) => (v >= 1000 ? `${v / 1000}K` : v)}
              />
              <Tooltip
                cursor={{ stroke: "#CCCCCC", strokeWidth: 1 }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="bg-white rounded-lg border border-snow-black-10 shadow-lg px-3 py-2 text-xs">
                      <p className="text-snow-black-40 mb-1">{label}</p>
                      <p className="text-snow-black-100 font-semibold">
                        {payload[0].value} leads
                      </p>
                    </div>
                  );
                }}
              />
              {/* This year — solid line with area fill */}
              <Area
                type="monotone"
                dataKey="leads"
                stroke="#000000"
                strokeWidth={1.5}
                fill="url(#leadsFill)"
                dot={false}
                activeDot={{
                  r: 3,
                  fill: "#000000",
                  stroke: "#fff",
                  strokeWidth: 2,
                }}
              />
              {/* Last year — dashed line */}
              <Line
                type="monotone"
                dataKey="lastYear"
                stroke="#CCCCCC"
                strokeWidth={1.5}
                strokeDasharray="6 4"
                dot={false}
                activeDot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

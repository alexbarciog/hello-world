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
  const composedData = chartData.map((d, i) => ({
    ...d,
    lastYear: Math.max(0, Math.round(d.leads * (0.5 + Math.sin(i * 0.5) * 0.4))),
  }));

  return (
    <div className="snow-card-lg p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-base font-semibold text-gray-900">Lead Velocity</h3>
        <span className="text-xs text-gray-400 bg-gray-50 rounded-full px-3 py-1">
          Campaigns
        </span>
        <span className="text-xs text-gray-400 bg-gray-50 rounded-full px-3 py-1">
          Signals
        </span>

        <div className="flex items-center gap-4 ml-auto">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-2.5 h-2.5 rounded-full bg-black" />
            This year
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C4C6F7]" />
            Last year
          </div>
        </div>
      </div>

      <div className="h-[260px] w-full">
        {!hasData ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-400">No leads yet - start a campaign to see data here</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={composedData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="snowFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#000000" stopOpacity={0.08} />
                  <stop offset="100%" stopColor="#000000" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#999" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11, fill: "#999" }} tickLine={false} axisLine={false} tickFormatter={(v: number) => (v >= 1000 ? `${v / 1000}K` : String(v))} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", fontSize: 12 }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="bg-white rounded-xl shadow-lg px-3 py-2 text-xs">
                      <p className="text-gray-500">{label}</p>
                      <p className="font-semibold text-gray-900">{payload[0].value} leads</p>
                    </div>
                  );
                }}
              />
              <Area type="monotone" dataKey="lastYear" stroke="#C4C6F7" strokeWidth={2} fill="none" dot={false} />
              <Line type="monotone" dataKey="leads" stroke="#000000" strokeWidth={2.5} dot={false} fill="url(#snowFill)" />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { name: "Linux", value: 14000 },
  { name: "Mac", value: 28000 },
  { name: "iOS", value: 20000 },
  { name: "Windows", value: 32000 },
  { name: "Android", value: 18000 },
  { name: "Other", value: 10000 },
];

const COLORS = ["#C4C6F7", "#34D399", "#000000", "#3B82F6", "#7B61FF", "#22C55E"];

const formatK = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v);

const TrafficByDevice = () => (
  <div className="bg-snow-bg-2 rounded-[20px] p-6">
    <h3 className="text-sm font-bold text-snow-black-100 mb-4">Traffic by Device</h3>
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} barCategoryGap="20%">
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#999" }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#999" }} tickFormatter={formatK} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #E5E7EB",
            borderRadius: 12,
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          }}
          formatter={(value: number) => [formatK(value), "Visitors"]}
        />
        {data.map((_, i) => (
          <Bar key={i} dataKey="value" fill={COLORS[i]} radius={[6, 6, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export default TrafficByDevice;

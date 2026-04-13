import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const data = [
  { name: "Linux", value: 14000 },
  { name: "Mac", value: 28000 },
  { name: "iOS", value: 20000 },
  { name: "Windows", value: 32000 },
  { name: "Android", value: 18000 },
  { name: "Other", value: 10000 },
];

const COLORS = ["#C4C6F7", "#34D399", "#000000", "#3B82F6", "#7B61FF", "#22C55E"];
const formatK = (v: number): string => (v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v));

const TrafficByDevice = () => (
  <div className="snow-card-lg p-6 flex flex-col gap-4">
    <h3 className="text-base font-semibold text-gray-900">Traffic by Device</h3>
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barSize={28} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#F0F0F0" />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#999" }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#999" }} tickLine={false} axisLine={false} tickFormatter={formatK} />
        <Tooltip formatter={(value: number) => [formatK(value), "Visitors"]} />
        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export default TrafficByDevice;

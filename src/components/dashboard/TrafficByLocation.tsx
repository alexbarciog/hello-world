import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const data = [
  { name: "United States", value: 52, color: "#333333" },
  { name: "Canada", value: 22, color: "#3B82F6" },
  { name: "Mexico", value: 15, color: "#34D399" },
  { name: "Other", value: 11, color: "#C4C6F7" },
];

const TrafficByLocation = () => (
  <div className="snow-card-lg p-6 flex flex-col gap-4">
    <h3 className="text-base font-semibold text-gray-900">Traffic by Location</h3>
    <div className="flex items-center gap-6">
      <ResponsiveContainer width={140} height={140}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" strokeWidth={0}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-col gap-2 text-xs">
        {data.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: entry.color }} />
            <span className="text-gray-500">{entry.name}</span>
            <span className="font-semibold text-gray-900 ml-auto">{entry.value}%</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default TrafficByLocation;

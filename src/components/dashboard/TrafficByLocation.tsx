import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const data = [
  { name: "United States", value: 52, color: "#333333" },
  { name: "Canada", value: 22, color: "#3B82F6" },
  { name: "Mexico", value: 15, color: "#34D399" },
  { name: "Other", value: 11, color: "#C4C6F7" },
];

const TrafficByLocation = () => (
  <div className="bg-snow-bg-2 rounded-[20px] p-6">
    <h3 className="text-sm font-bold text-snow-black-100 mb-4">Traffic by Location</h3>
    <div className="flex items-center gap-6">
      <ResponsiveContainer width={200} height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-col gap-3">
        {data.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2.5">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-snow-black-40 whitespace-nowrap">{entry.name}</span>
            <span className="text-sm font-semibold text-snow-black-100 ml-auto">{entry.value}%</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default TrafficByLocation;

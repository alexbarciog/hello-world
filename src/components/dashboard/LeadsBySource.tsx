import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface SourceData {
  name: string;
  value: number;
}

interface LeadsBySourceProps {
  data: SourceData[];
  loading: boolean;
}

const COLORS = ["#333333", "#3B82F6", "#34D399", "#8B5CF6", "#F59E0B", "#C4C6F7"];

const LeadsBySource = ({ data, loading }: LeadsBySourceProps) => {
  const hasData = data.length > 0 && data.some((d) => d.value > 0);

  return (
    <div className="bg-snow-bg-2 rounded-[20px] p-6">
      <h3 className="text-sm font-bold text-snow-black-100 mb-4">Leads by Source</h3>
      {loading ? (
        <div className="h-[240px] flex items-center justify-center">
          <div className="h-6 w-32 bg-white/60 rounded-lg animate-pulse" />
        </div>
      ) : !hasData ? (
        <div className="h-[240px] flex items-center justify-center">
          <p className="text-sm text-snow-black-20">No campaign data yet</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} barCategoryGap="20%">
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#999" }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#999" }}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #E5E7EB",
                borderRadius: 12,
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
              formatter={(value: number) => [value, "Contacts"]}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default LeadsBySource;

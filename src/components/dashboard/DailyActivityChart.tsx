import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface WeeklyActivityData {
  date: string;
  contacts: number;
  responses: number;
  meetings: number;
}

interface WeeklyActivityChartProps {
  data: WeeklyActivityData[];
  loading: boolean;
}

const DailyActivityChart = ({ data, loading }: WeeklyActivityChartProps) => {
  const hasData = data.some((d) => d.contacts > 0 || d.responses > 0 || d.meetings > 0);

  return (
    <div className="bg-snow-bg-2 rounded-[20px] p-4">
      <h3 className="text-sm font-bold text-snow-black-100 mb-3">Daily Activity per Week</h3>
      {loading ? (
        <div className="h-[180px] flex items-center justify-center">
          <div className="h-6 w-32 bg-white/60 rounded-lg animate-pulse" />
        </div>
      ) : !hasData ? (
        <div className="h-[240px] flex items-center justify-center">
          <p className="text-sm text-snow-black-20">No activity data yet</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} barCategoryGap="25%" barGap={2}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#999" }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#999" }}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #E5E7EB",
                borderRadius: 12,
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
            />
            <Bar dataKey="contacts" name="Contacts" fill="#C4C6F7" radius={[6, 6, 0, 0]} maxBarSize={32} />
            <Bar dataKey="responses" name="Responses" fill="#34D399" radius={[6, 6, 0, 0]} maxBarSize={32} />
            <Bar dataKey="meetings" name="Meetings" fill="#000000" radius={[6, 6, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default DailyActivityChart;

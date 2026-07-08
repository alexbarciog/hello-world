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
import { motion } from "framer-motion";

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
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="rounded-[20px] p-5 bg-white border border-neutral-200/70 shadow-[0_1px_2px_rgba(10,10,10,0.03)] hover:shadow-[0_10px_30px_-12px_rgba(10,10,10,0.15)] transition-shadow"
    >
      <h3 className="text-[11px] uppercase tracking-[0.14em] font-medium text-neutral-500 mb-3">Daily Activity per Week</h3>
      {loading ? (
        <div className="h-[180px] flex items-center justify-center">
          <div className="h-6 w-32 bg-white/60 rounded-lg animate-pulse" />
        </div>
      ) : !hasData ? (
        <div className="h-[180px] flex items-center justify-center">
          <p className="text-sm text-neutral-400">No activity data yet</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
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
            <Bar dataKey="contacts" name="Contacts" fill="#C4C6F7" radius={[6, 6, 0, 0]} maxBarSize={32} isAnimationActive animationDuration={900} animationBegin={0} animationEasing="ease-out" />
            <Bar dataKey="responses" name="Responses" fill="#34D399" radius={[6, 6, 0, 0]} maxBarSize={32} isAnimationActive animationDuration={900} animationBegin={150} animationEasing="ease-out" />
            <Bar dataKey="meetings" name="Meetings" fill="#000000" radius={[6, 6, 0, 0]} maxBarSize={32} isAnimationActive animationDuration={900} animationBegin={300} animationEasing="ease-out" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  );
};

export default DailyActivityChart;

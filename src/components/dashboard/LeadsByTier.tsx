import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface TierData {
  name: string;
  value: number;
  color: string;
}

interface LeadsByTierProps {
  data: TierData[];
  loading: boolean;
}

const LeadsByTier = ({ data, loading }: LeadsByTierProps) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  const hasData = total > 0;

  return (
    <div className="bg-snow-bg-2 rounded-[20px] p-6">
      <h3 className="text-sm font-bold text-snow-black-100 mb-4">Leads by Tier</h3>
      {loading ? (
        <div className="h-[200px] flex items-center justify-center">
          <div className="h-6 w-32 bg-white/60 rounded-lg animate-pulse" />
        </div>
      ) : !hasData ? (
        <div className="h-[200px] flex items-center justify-center">
          <p className="text-sm text-snow-black-20">No leads yet</p>
        </div>
      ) : (
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
            {data.map((entry) => {
              const pct = total > 0 ? Math.round((entry.value / total) * 100) : 0;
              return (
                <div key={entry.name} className="flex items-center gap-2.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-snow-black-40 whitespace-nowrap">{entry.name}</span>
                  <span className="text-sm font-semibold text-snow-black-100 ml-auto">
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadsByTier;

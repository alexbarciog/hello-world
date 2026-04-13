interface MetricCardProps {
  title: string;
  value: number | string;
  loading?: boolean;
  bgColor?: string;
}

export function MetricCard({ title, value, loading, bgColor = "bg-[#e8f0fb]" }: MetricCardProps) {
  const isEmpty = !loading && (value === 0 || value === "0");

  return (
    <div className={`${bgColor} rounded-[20px] p-5 flex flex-col gap-3`}>
      <p className="text-sm text-snow-black-100 tracking-wide font-normal">{title}</p>
      {loading ? (
        <div className="h-9 w-20 bg-white/50 rounded-lg animate-pulse" />
      ) : isEmpty ? (
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-semibold text-gray-900 tabular-nums">0</span>
          <span className="text-xs text-gray-400 italic">No data yet</span>
        </div>
      ) : (
        <span className="text-3xl font-semibold text-gray-900 tabular-nums">{value}</span>
      )}
    </div>
  );
}

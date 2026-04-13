interface MetricCardProps {
  title: string;
  value: number | string;
  loading?: boolean;
  bgColor?: string;
}

export function MetricCard({ title, value, loading, bgColor = "bg-[#e8f0fb]" }: MetricCardProps) {
  const isEmpty = !loading && (value === 0 || value === "0");

  return (
    <div className={`${bgColor} rounded-[24px] px-6 py-7 flex flex-col gap-2 min-w-0`}>
      <span className="text-sm text-snow-black-100 tracking-wide font-normal">{title}</span>
      {loading ? (
        <div className="h-8 w-20 bg-white/60 rounded-lg animate-pulse" />
      ) : isEmpty ? (
        <div className="flex flex-col">
          <span className="text-3xl font-bold text-snow-black">0</span>
          <span className="text-xs text-snow-black-100 mt-0.5">No data yet</span>
        </div>
      ) : (
        <span className="text-3xl font-bold text-snow-black">{value}</span>
      )}
    </div>
  );
}

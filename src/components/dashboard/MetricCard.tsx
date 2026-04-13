import { Flame, Users, MessagesSquare } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: number | string;
  loading?: boolean;
  icon: React.ReactNode;
  iconBg: string;
  progress?: number;
}

export function MetricCard({ title, value, loading, icon, iconBg, progress = 0 }: MetricCardProps) {
  const isEmpty = !loading && (value === 0 || value === "0");

  return (
    <div className="glass-card p-6 rounded-[1.5rem] flex flex-col justify-between group hover:-translate-y-1 transition-transform duration-300">
      <div className="flex justify-between items-start">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: iconBg }}>
          {icon}
        </div>
      </div>
      <div className="mt-6">
        <p className="text-sm font-semibold text-md-on-surface-variant">{title}</p>
        {loading ? (
          <div className="h-9 w-16 bg-md-surface-container rounded animate-pulse mt-1" />
        ) : isEmpty ? (
          <p className="text-sm text-md-on-surface-variant mt-1 italic">No data yet</p>
        ) : (
          <h3 className="text-3xl font-extrabold text-md-on-surface mt-1 tracking-tight">{value}</h3>
        )}
      </div>
      <div className="mt-4 h-1.5 w-full bg-md-surface-container rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${Math.min(100, Math.max(5, progress))}%`,
            background: "var(--gradient-md-brand)",
          }}
        />
      </div>
    </div>
  );
}

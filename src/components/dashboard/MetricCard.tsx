import { motion } from "framer-motion";
import { CountUp } from "@/lib/motion";
import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: number | string;
  loading?: boolean;
  bgColor?: string;
  accent?: "blue" | "indigo" | "lime" | "black";
  icon?: LucideIcon;
  trend?: { value: number; label?: string };
}

const EASE = [0.22, 1, 0.36, 1] as const;

const ACCENTS: Record<
  NonNullable<MetricCardProps["accent"]>,
  { chip: string; chipText: string; dot: string; underline: string }
> = {
  lime: { chip: "bg-[#C8FF00]", chipText: "text-[#0a0a0a]", dot: "bg-[#0a0a0a]", underline: "bg-[#C8FF00]" },
  blue: { chip: "bg-[#3B82F6]", chipText: "text-white", dot: "bg-[#3B82F6]", underline: "bg-[#3B82F6]" },
  indigo: { chip: "bg-[#4647d3]", chipText: "text-white", dot: "bg-[#4647d3]", underline: "bg-[#4647d3]" },
  black: { chip: "bg-[#0a0a0a]", chipText: "text-white", dot: "bg-[#0a0a0a]", underline: "bg-[#0a0a0a]" },
};

export function MetricCard({
  title,
  value,
  loading,
  accent = "blue",
  icon: Icon,
  trend,
}: MetricCardProps) {
  const isEmpty = !loading && (value === 0 || value === "0");
  const numeric = typeof value === "number" ? value : Number.isFinite(Number(value)) ? Number(value) : null;
  const a = ACCENTS[accent];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, ease: EASE }}
      whileHover={{ y: -4 }}
      className="group relative overflow-hidden rounded-[24px] bg-white border border-neutral-200/80 px-6 py-6 flex flex-col gap-6 min-w-0 shadow-[0_1px_2px_rgba(10,10,10,0.03)] hover:shadow-[0_20px_40px_-16px_rgba(10,10,10,0.18)] transition-shadow"
    >
      {/* top row: chip icon + label */}
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          {Icon && (
            <span className={`w-8 h-8 rounded-full ${a.chip} ${a.chipText} flex items-center justify-center shrink-0`}>
              <Icon className="w-4 h-4" strokeWidth={2.2} />
            </span>
          )}
          <span className="text-[11px] uppercase tracking-[0.14em] font-semibold text-neutral-500 truncate">
            {title}
          </span>
        </div>
        <motion.span
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className={`w-1.5 h-1.5 rounded-full ${a.dot}`}
        />
      </div>

      {/* big number */}
      {loading ? (
        <div className="h-12 w-24 bg-neutral-100 rounded-lg animate-pulse" />
      ) : isEmpty ? (
        <div className="flex flex-col">
          <span className="text-[52px] leading-[0.95] font-medium tracking-[-0.04em] text-neutral-900">0</span>
          <span className="text-[11px] text-neutral-400 mt-2 uppercase tracking-wider">No data yet</span>
        </div>
      ) : numeric !== null ? (
        <div className="flex items-baseline gap-2 relative">
          <span className="relative inline-block">
            <motion.span
              aria-hidden
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4, ease: EASE }}
              className={`absolute left-0 right-0 bottom-[0.06em] h-[0.22em] ${a.underline} opacity-90 origin-left -z-0`}
            />
            <CountUp
              to={numeric}
              duration={1.6}
              className="relative z-10 text-[52px] leading-[0.95] font-medium tracking-[-0.04em] text-[#0a0a0a]"
            />
          </span>
          {trend && (
            <span className={`text-xs font-semibold ${trend.value >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
              {trend.value >= 0 ? "+" : ""}{trend.value}%
            </span>
          )}
        </div>
      ) : (
        <span className="text-[52px] leading-[0.95] font-medium tracking-[-0.04em] text-[#0a0a0a]">{value}</span>
      )}
    </motion.div>
  );
}

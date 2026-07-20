import { motion } from "framer-motion";
import { CountUp } from "@/lib/motion";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: number | string;
  loading?: boolean;
  bgColor?: string;
  accent?: "blue" | "indigo" | "lime" | "black";
  icon?: LucideIcon;
  trend?: { value: number; label?: string };
  onDetails?: () => void;
}

const EASE = [0.22, 1, 0.36, 1] as const;

const ACCENTS: Record<
  NonNullable<MetricCardProps["accent"]>,
  { chipBg: string; chipText: string; ring: string }
> = {
  blue:   { chipBg: "bg-blue-50",    chipText: "text-[#3B82F6]", ring: "ring-blue-100" },
  indigo: { chipBg: "bg-indigo-50",  chipText: "text-indigo-600", ring: "ring-indigo-100" },
  lime:   { chipBg: "bg-[#F4FFC7]",  chipText: "text-[#0a0a0a]", ring: "ring-lime-100" },
  black:  { chipBg: "bg-neutral-900", chipText: "text-white",     ring: "ring-neutral-200" },
};

export function MetricCard({
  title,
  value,
  loading,
  accent = "blue",
  icon: Icon,
  trend,
  onDetails,
}: MetricCardProps) {
  const numeric = typeof value === "number" ? value : Number.isFinite(Number(value)) ? Number(value) : null;
  const a = ACCENTS[accent];
  const trendPositive = (trend?.value ?? 0) >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.55, ease: EASE }}
      whileHover={{ y: -3 }}
      className="group relative rounded-2xl bg-white border border-[#F0F0F2] px-5 pt-5 pb-4 flex flex-col gap-5 min-w-0 hover:shadow-[0_12px_32px_-16px_rgba(10,10,10,0.14)] transition-shadow"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {Icon && (
            <span className="w-10 h-10 rounded-xl bg-[#F9F9FA] text-[#0a0a0a] flex items-center justify-center shrink-0 ring-1 ring-[#F0F0F2]">
              <Icon className="w-[18px] h-[18px]" strokeWidth={2.1} />
            </span>
          )}
          <div className="min-w-0 flex flex-col">
            {loading ? (
              <div className="h-8 w-24 bg-neutral-100 rounded animate-pulse" />
            ) : numeric !== null ? (
              <div className="flex items-baseline gap-2">
                <CountUp
                  to={numeric}
                  duration={1.4}
                  className="text-[30px] leading-none font-semibold tracking-[-0.03em] text-[#0a0a0a]"
                />
                {trend && (
                  <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${trendPositive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"}`}>
                    {trendPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
                  </span>
                )}
              </div>
            ) : (
              <span className="text-[30px] leading-none font-semibold tracking-[-0.03em] text-[#0a0a0a]">{value}</span>
            )}
            <span className="text-[12.5px] text-neutral-500 mt-1.5 truncate">{title}</span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onDetails}
        className="mt-auto -mb-1 flex items-center justify-between text-[13px] text-neutral-500 hover:text-[#0a0a0a] transition-colors border-t border-[#F4F4F5] pt-3"
      >
        <span className="tracking-[-0.02em]">View details</span>
        <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
      </button>
    </motion.div>
  );
}

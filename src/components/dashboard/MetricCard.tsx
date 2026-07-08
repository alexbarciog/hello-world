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
      className="group relative rounded-[22px] bg-white/25 backdrop-blur-xl border border-white/55 px-5 pt-5 pb-4 flex flex-col gap-5 min-w-0 shadow-[0_1px_2px_rgba(10,10,10,0.03)] hover:shadow-[0_16px_36px_-18px_rgba(10,10,10,0.18)] transition-shadow"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {Icon && (
            <span className={`w-11 h-11 rounded-2xl ${a.chipBg} ${a.chipText} flex items-center justify-center shrink-0 ring-1 ${a.ring}`}>
              <Icon className="w-5 h-5" strokeWidth={2.1} />
            </span>
          )}
          <div className="min-w-0 flex flex-col">
            {loading ? (
              <div className="h-8 w-24 bg-white/45 rounded animate-pulse" />
            ) : numeric !== null ? (
              <div className="flex items-baseline gap-2">
                <CountUp
                  to={numeric}
                  duration={1.4}
                  className="text-[30px] leading-none font-semibold tracking-[-0.03em] text-neutral-900"
                />
                {trend && (
                  <span className={`text-[11px] font-semibold ${trendPositive ? "text-emerald-600" : "text-rose-500"}`}>
                    {trendPositive ? "+" : ""}{trend.value}%
                  </span>
                )}
              </div>
            ) : (
              <span className="text-[30px] leading-none font-semibold tracking-[-0.03em] text-neutral-900">{value}</span>
            )}
            <span className="text-[12.5px] text-neutral-500 mt-1.5 truncate">{title}</span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onDetails}
        className="mt-auto -mb-1 flex items-center justify-between text-[12px] text-neutral-500 hover:text-neutral-900 transition-colors border-t border-white/45 pt-3"
      >
        <span>View details</span>
        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
      </button>
    </motion.div>
  );
}

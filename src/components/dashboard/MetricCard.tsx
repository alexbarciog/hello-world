import { motion } from "framer-motion";
import { CountUp } from "@/lib/motion";
import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: number | string;
  loading?: boolean;
  /** Legacy prop, ignored — kept for backward compat */
  bgColor?: string;
  accent?: "blue" | "indigo" | "emerald" | "black";
  icon?: LucideIcon;
  trend?: { value: number; label?: string };
}

const EASE = [0.22, 1, 0.36, 1] as const;

const ACCENTS: Record<
  NonNullable<MetricCardProps["accent"]>,
  { blob: string; dot: string; ring: string; text: string }
> = {
  blue: { blob: "#3B82F6", dot: "bg-[#3B82F6]", ring: "ring-[#3B82F6]/10", text: "text-[#3B82F6]" },
  indigo: { blob: "#4647d3", dot: "bg-[#4647d3]", ring: "ring-[#4647d3]/10", text: "text-[#4647d3]" },
  emerald: { blob: "#10b981", dot: "bg-emerald-500", ring: "ring-emerald-500/10", text: "text-emerald-600" },
  black: { blob: "#0a0a0a", dot: "bg-neutral-900", ring: "ring-neutral-900/10", text: "text-neutral-900" },
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
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.55, ease: EASE }}
      whileHover={{ y: -4 }}
      className="group relative overflow-hidden rounded-[20px] bg-white border border-neutral-200/70 px-5 py-5 flex flex-col gap-3 min-w-0 shadow-[0_1px_2px_rgba(10,10,10,0.03)] hover:shadow-[0_10px_30px_-12px_rgba(10,10,10,0.15)] transition-shadow"
    >
      {/* soft color blob */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl opacity-40 group-hover:opacity-70 transition-opacity duration-500"
        style={{ background: `radial-gradient(closest-side, ${a.blob}, transparent 70%)` }}
      />

      <div className="relative flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-[0.14em] font-medium text-neutral-500">
          {title}
        </span>
        {Icon ? (
          <span className={`w-7 h-7 rounded-full bg-neutral-50 ring-1 ${a.ring} flex items-center justify-center`}>
            <Icon className={`w-3.5 h-3.5 ${a.text}`} />
          </span>
        ) : (
          <span className={`w-1.5 h-1.5 rounded-full ${a.dot}`} />
        )}
      </div>

      {loading ? (
        <div className="relative h-9 w-24 bg-neutral-100 rounded-lg animate-pulse" />
      ) : isEmpty ? (
        <div className="relative flex flex-col">
          <span className="text-[34px] leading-none font-medium tracking-[-0.03em] text-neutral-900">0</span>
          <span className="text-[11px] text-neutral-400 mt-1.5">No data yet</span>
        </div>
      ) : numeric !== null ? (
        <div className="relative flex items-baseline gap-2">
          <CountUp
            to={numeric}
            duration={1.4}
            className="text-[34px] leading-none font-medium tracking-[-0.03em] text-neutral-900"
          />
          {trend && (
            <span className={`text-[11px] font-semibold ${trend.value >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
              {trend.value >= 0 ? "+" : ""}{trend.value}%
            </span>
          )}
        </div>
      ) : (
        <span className="relative text-[34px] leading-none font-medium tracking-[-0.03em] text-neutral-900">{value}</span>
      )}
    </motion.div>
  );
}

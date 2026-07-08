import { motion } from "framer-motion";
import { CountUp } from "@/lib/motion";

interface MetricCardProps {
  title: string;
  value: number | string;
  loading?: boolean;
  bgColor?: string;
}

const EASE = [0.22, 1, 0.36, 1] as const;

export function MetricCard({ title, value, loading, bgColor = "bg-[#e8f0fb]" }: MetricCardProps) {
  const isEmpty = !loading && (value === 0 || value === "0");
  const numeric = typeof value === "number" ? value : Number.isFinite(Number(value)) ? Number(value) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.55, ease: EASE }}
      whileHover={{ y: -4 }}
      className={`group relative overflow-hidden ${bgColor} rounded-[24px] px-6 py-7 flex flex-col gap-2 min-w-0 cursor-default`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background:
            "radial-gradient(600px circle at var(--x, 50%) var(--y, 0%), rgba(255,255,255,0.55), transparent 40%)",
        }}
      />
      <span className="relative text-sm text-snow-black-100 tracking-wide font-normal">{title}</span>
      {loading ? (
        <div className="relative h-8 w-20 bg-white/60 rounded-lg animate-pulse" />
      ) : isEmpty ? (
        <div className="relative flex flex-col">
          <span className="text-3xl font-bold text-snow-black">0</span>
          <span className="text-xs text-snow-black-100 mt-0.5">No data yet</span>
        </div>
      ) : numeric !== null ? (
        <CountUp to={numeric} duration={1.4} className="relative text-3xl font-bold text-snow-black" />
      ) : (
        <span className="relative text-3xl font-bold text-snow-black">{value}</span>
      )}
    </motion.div>
  );
}

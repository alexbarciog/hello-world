import type { LucideIcon } from "lucide-react";
import { GitBranch } from "lucide-react";
import { CountUp } from "@/lib/motion";
import { WidgetCard, WidgetHeader } from "./WidgetCard";

interface PipelineStat {
  label: string;
  value: number;
  icon: LucideIcon;
  onClick?: () => void;
  loading?: boolean;
}

interface PipelineStatusCardProps {
  stats: PipelineStat[];
  /** Daily lead-discovery counts, oldest → newest (drives the gradient strip) */
  stripData: number[];
  onExpand?: () => void;
}

// Interpolate between indigo and light violet across the strip (reference look).
function sliceColor(t: number): string {
  const from = [99, 91, 235]; // #635BEB
  const to = [196, 181, 253]; // #C4B5FD
  const c = from.map((f, i) => Math.round(f + (to[i] - f) * t));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

/**
 * Reference "Task status" clone: inline big stats + a barcode-style gradient
 * strip. The strip is data-driven — each day of lead discovery becomes a group
 * of slices whose opacity scales with that day's volume.
 */
export function PipelineStatusCard({ stats, stripData, onExpand }: PipelineStatusCardProps) {
  const max = Math.max(1, ...stripData);
  const SLICES_PER_DAY = 5;
  const slices: { color: string; opacity: number }[] = [];
  const totalSlices = stripData.length * SLICES_PER_DAY;
  stripData.forEach((count, day) => {
    const intensity = 0.22 + 0.78 * (count / max);
    for (let s = 0; s < SLICES_PER_DAY; s++) {
      const idx = day * SLICES_PER_DAY + s;
      // Small deterministic jitter gives the barcode texture without randomness.
      const jitter = ((idx * 7) % 5) * 0.045;
      slices.push({
        color: sliceColor(totalSlices <= 1 ? 0 : idx / (totalSlices - 1)),
        opacity: Math.min(1, Math.max(0.14, intensity - jitter)),
      });
    }
  });

  return (
    <WidgetCard className="p-5 flex flex-col">
      <WidgetHeader icon={GitBranch} title="Pipeline status" onExpand={onExpand} />

      <div className="flex items-start gap-8 mt-5 flex-wrap">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.label}
              type="button"
              onClick={s.onClick}
              className="text-left group"
            >
              {s.loading ? (
                <div className="h-8 w-14 bg-neutral-100 rounded animate-pulse" />
              ) : (
                <div className="text-[30px] leading-none font-semibold tracking-[-0.03em] text-[#0a0a0a]">
                  <CountUp to={s.value} duration={1.2} />
                </div>
              )}
              <div className="flex items-center gap-1.5 mt-2 text-[13px] text-neutral-500 group-hover:text-neutral-800 transition-colors">
                {s.label}
                <Icon className="w-3.5 h-3.5 text-[#635BEB]" strokeWidth={1.9} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Gradient barcode strip — daily discovery intensity */}
      <div className="mt-auto pt-6">
        <div className="flex h-[64px] rounded-lg overflow-hidden gap-px bg-white">
          {slices.map((sl, i) => (
            <div
              key={i}
              className="flex-1"
              style={{ background: sl.color, opacity: sl.opacity }}
            />
          ))}
        </div>
        <div className="flex items-center justify-between mt-2 text-[11px] text-neutral-400">
          <span>7d ago</span>
          <span>Today</span>
        </div>
      </div>
    </WidgetCard>
  );
}

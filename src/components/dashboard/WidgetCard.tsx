import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Maximize2, MoreVertical, ArrowUpRight, ArrowDownRight } from "lucide-react";
import type { ReactNode } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Reference-style widget primitives shared by every dashboard card:
 * - WidgetCard: white surface, 16px radius, whisper border + soft diffuse shadow
 * - WidgetHeader: icon + title (+ muted suffix) left, ghost-icon actions cluster right
 * - DeltaBadge: diagonal arrow + colored % + grey window label
 */

export function WidgetCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`rounded-2xl bg-white border border-[#F0F0F1] shadow-[0_1px_2px_rgba(16,24,40,0.04),0_10px_28px_-14px_rgba(16,24,40,0.08)] ${className}`}
    >
      {children}
    </motion.div>
  );
}

export function WidgetHeader({
  icon: Icon,
  title,
  suffix,
  onExpand,
  menuItems,
}: {
  icon: LucideIcon;
  title: string;
  suffix?: string;
  onExpand?: () => void;
  menuItems?: { label: string; onSelect: () => void }[];
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <Icon className="w-4 h-4 text-neutral-700 shrink-0" strokeWidth={1.9} />
        <h3 className="text-[14.5px] font-semibold text-neutral-900 tracking-tight truncate">
          {title}
          {suffix && <span className="ml-1.5 font-normal text-neutral-400">{suffix}</span>}
        </h3>
      </div>
      {(onExpand || menuItems?.length) && (
        <div className="flex items-center rounded-lg border border-[#F0F0F1] overflow-hidden shrink-0">
          {onExpand && (
            <button
              type="button"
              onClick={onExpand}
              className="w-7 h-7 flex items-center justify-center text-neutral-400 hover:text-neutral-800 hover:bg-neutral-50 transition-colors"
              aria-label="Open"
            >
              <Maximize2 className="w-3.5 h-3.5" strokeWidth={1.9} />
            </button>
          )}
          {menuItems?.length ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="w-7 h-7 flex items-center justify-center text-neutral-400 hover:text-neutral-800 hover:bg-neutral-50 transition-colors border-l border-[#F0F0F1]"
                  aria-label="More"
                >
                  <MoreVertical className="w-3.5 h-3.5" strokeWidth={1.9} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[150px]">
                {menuItems.map((m) => (
                  <DropdownMenuItem key={m.label} onSelect={m.onSelect} className="text-[12px]">
                    {m.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      )}
    </div>
  );
}

export function DeltaBadge({
  delta,
  windowLabel = "(7d)",
}: {
  delta: number | null | undefined;
  windowLabel?: string;
}) {
  if (delta == null) return null;
  const positive = delta >= 0;
  const Arrow = positive ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[12.5px] font-semibold ${positive ? "text-emerald-600" : "text-rose-500"}`}>
      <Arrow className="w-3.5 h-3.5" strokeWidth={2.2} />
      {Math.abs(delta)}% <span className="text-neutral-400 font-medium ml-0.5">{windowLabel}</span>
    </span>
  );
}

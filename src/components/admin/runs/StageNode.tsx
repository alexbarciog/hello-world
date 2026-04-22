import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import type { StageData } from "./FunnelTemplates";

const TONE_STYLES: Record<NonNullable<StageData["tone"]>, string> = {
  neutral: "bg-white border-border text-foreground",
  pass: "bg-emerald-50 border-emerald-200 text-emerald-900",
  reject: "bg-red-50 border-red-200 text-red-900",
  skip: "bg-muted border-border text-muted-foreground",
  success: "bg-emerald-500 border-emerald-600 text-white",
};

function StageNodeComponent({ data, selected }: NodeProps) {
  const stageData = data as StageData;
  const tone = stageData.tone ?? "neutral";
  return (
    <div
      className={cn(
        "rounded-xl border-2 px-3 py-2 min-w-[160px] shadow-sm transition-all cursor-pointer",
        TONE_STYLES[tone],
        selected && "ring-2 ring-primary ring-offset-2",
      )}
    >
      <Handle type="target" position={Position.Left} className="!bg-transparent !border-0" />
      <div className="text-[10px] uppercase tracking-wider opacity-70 font-medium">
        {stageData.label}
      </div>
      <div className="text-2xl font-semibold leading-tight tabular-nums">
        {stageData.count}
      </div>
      {stageData.sublabel && (
        <div className="text-[10px] opacity-70 mt-0.5 truncate">{stageData.sublabel}</div>
      )}
      <Handle type="source" position={Position.Right} className="!bg-transparent !border-0" />
    </div>
  );
}

export const StageNode = memo(StageNodeComponent);

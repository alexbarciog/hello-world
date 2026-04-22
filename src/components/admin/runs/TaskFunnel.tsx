import { useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  type NodeTypes,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { StageNode } from "./StageNode";
import { NodeDetailPanel } from "./NodeDetailPanel";
import { buildFunnel, type StageData } from "./FunnelTemplates";

interface Task {
  id: string;
  signal_type: string;
  task_key: string;
  status: string;
  leads_found: number;
  diagnostics: Record<string, unknown> | null;
  rejected_profiles_sample: unknown[];
  error: string | null;
  payload: Record<string, unknown> | null;
  started_at: string | null;
  completed_at: string | null;
}

const nodeTypes: NodeTypes = { stage: StageNode };

function statusBadge(status: string) {
  const map: Record<string, string> = {
    completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
    failed: "bg-red-100 text-red-700 border-red-200",
    running: "bg-blue-100 text-blue-700 border-blue-200",
    pending: "bg-muted text-muted-foreground border-border",
  };
  return map[status] ?? "bg-muted text-muted-foreground border-border";
}

export function TaskFunnel({ task }: { task: Task }) {
  const [selectedStage, setSelectedStage] = useState<StageData | null>(null);

  const { nodes, edges } = useMemo(
    () => buildFunnel(task.signal_type, task.diagnostics),
    [task.signal_type, task.diagnostics],
  );

  const onNodeClick: NodeMouseHandler = (_e, node) => {
    setSelectedStage(node.data as StageData);
  };

  const headerLabel =
    (task.payload && typeof task.payload === "object"
      ? (task.payload.keyword as string) ||
        (task.payload.hashtag as string) ||
        (task.payload.profile_url as string) ||
        (task.payload.competitor_url as string)
      : null) || task.task_key;

  return (
    <div className="rounded-xl border border-border bg-muted/30 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background">
        <div className="flex items-center gap-3 min-w-0">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium shrink-0">
            {task.signal_type}
          </div>
          <div className="text-sm font-medium text-foreground truncate">
            {headerLabel}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-muted-foreground">
            {task.leads_found} {task.leads_found === 1 ? "lead" : "leads"}
          </span>
          <span
            className={`text-[10px] uppercase px-2 py-0.5 rounded-full border ${statusBadge(task.status)}`}
          >
            {task.status}
          </span>
        </div>
      </div>
      {task.error && (
        <div className="px-4 py-2 text-xs text-red-700 bg-red-50 border-b border-red-200">
          {task.error}
        </div>
      )}
      <div className="relative h-[280px]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable
          panOnDrag
          zoomOnScroll={false}
          zoomOnPinch
          proOptions={{ hideAttribution: true }}
          onNodeClick={onNodeClick}
        >
          <Background gap={16} size={1} color="hsl(var(--border))" />
          <Controls showInteractive={false} className="!shadow-none" />
        </ReactFlow>
        <NodeDetailPanel
          stage={selectedStage}
          diagnostics={task.diagnostics}
          rejectedSample={task.rejected_profiles_sample}
          onClose={() => setSelectedStage(null)}
        />
      </div>
    </div>
  );
}

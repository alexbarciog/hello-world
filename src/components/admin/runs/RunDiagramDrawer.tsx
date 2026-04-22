import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { TaskFunnel } from "./TaskFunnel";

interface Run {
  id: string;
  status: string;
  total_tasks: number;
  completed_tasks: number;
  total_leads: number;
  started_at: string;
  completed_at: string | null;
  error: string | null;
  agent_name?: string;
  agent_type?: string;
  org_name?: string;
}

interface Props {
  run: Run | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatDuration(start: string, end: string | null) {
  if (!end) return "running…";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 1000) return `${ms}ms`;
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s`;
}

export function RunDiagramDrawer({ run, open, onOpenChange }: Props) {
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["admin-run-tasks", run?.id],
    queryFn: async () => {
      if (!run?.id) return [];
      const { data, error } = await supabase
        .from("signal_agent_tasks")
        .select("*")
        .eq("run_id", run.id)
        .order("started_at", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!run?.id && open,
    refetchInterval: run?.status === "running" ? 5000 : false,
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[1100px] sm:w-[95vw] p-0 flex flex-col"
      >
        <SheetHeader className="px-6 py-4 border-b border-border">
          <SheetTitle className="flex items-center gap-3 text-lg font-semibold">
            <span>{run?.agent_name ?? "Run"}</span>
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-normal">
              {run?.agent_type}
            </span>
          </SheetTitle>
          <SheetDescription className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <span>
              <span className="text-muted-foreground">Run:</span>{" "}
              <code className="font-mono">{run?.id?.slice(0, 8)}</code>
            </span>
            {run?.org_name && (
              <span>
                <span className="text-muted-foreground">Org:</span> {run.org_name}
              </span>
            )}
            <span>
              <span className="text-muted-foreground">Tasks:</span>{" "}
              {run?.completed_tasks}/{run?.total_tasks}
            </span>
            <span>
              <span className="text-muted-foreground">Leads:</span> {run?.total_leads}
            </span>
            <span>
              <span className="text-muted-foreground">Duration:</span>{" "}
              {run ? formatDuration(run.started_at, run.completed_at) : "—"}
            </span>
            <span>
              <span className="text-muted-foreground">Status:</span> {run?.status}
            </span>
          </SheetDescription>
          {run?.error && (
            <div className="mt-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {run.error}
            </div>
          )}
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="px-6 py-5 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-20 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading tasks…
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-20">
                No tasks recorded for this run.
              </div>
            ) : (
              tasks.map((t: any) => <TaskFunnel key={t.id} task={t} />)
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

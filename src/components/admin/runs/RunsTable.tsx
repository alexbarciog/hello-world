import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Search } from "lucide-react";
import { RunDiagramDrawer } from "./RunDiagramDrawer";
import { formatDistanceToNow } from "date-fns";

const SIGNAL_TYPES = [
  "all",
  "keyword_posts",
  "hashtag_engagement",
  "post_engagers",
  "competitor",
  "reddit",
  "x",
];

const STATUSES = ["all", "running", "completed", "failed"];

function formatDuration(start: string, end: string | null) {
  if (!end) return "—";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 1000) return `${ms}ms`;
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s`;
}

function statusPill(status: string) {
  const map: Record<string, string> = {
    completed: "bg-emerald-100 text-emerald-700",
    failed: "bg-red-100 text-red-700",
    running: "bg-blue-100 text-blue-700",
  };
  return (
    <span
      className={`text-[10px] uppercase px-2 py-0.5 rounded-full font-medium ${
        map[status] ?? "bg-muted text-muted-foreground"
      }`}
    >
      {status}
    </span>
  );
}

export function RunsTable() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedRun, setSelectedRun] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data: runs = [], isLoading } = useQuery({
    queryKey: ["admin-signal-runs"],
    queryFn: async () => {
      // Fetch runs
      const { data: runRows, error } = await supabase
        .from("signal_agent_runs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(200);
      if (error) throw error;

      const agentIds = Array.from(new Set((runRows ?? []).map((r) => r.agent_id)));
      const orgIds = Array.from(
        new Set((runRows ?? []).map((r) => r.organization_id).filter(Boolean) as string[]),
      );

      const [{ data: agents }, { data: orgs }] = await Promise.all([
        agentIds.length
          ? supabase.from("signal_agents").select("id, name, agent_type").in("id", agentIds)
          : Promise.resolve({ data: [] as any[] }),
        orgIds.length
          ? supabase.from("organizations").select("id, name").in("id", orgIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);

      const agentMap = new Map((agents ?? []).map((a: any) => [a.id, a]));
      const orgMap = new Map((orgs ?? []).map((o: any) => [o.id, o]));

      return (runRows ?? []).map((r: any) => {
        const agent = agentMap.get(r.agent_id);
        const org = r.organization_id ? orgMap.get(r.organization_id) : null;
        return {
          ...r,
          agent_name: agent?.name ?? "—",
          agent_type: agent?.agent_type ?? "—",
          org_name: org?.name ?? "—",
        };
      });
    },
    refetchInterval: 30000,
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return runs.filter((r: any) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (typeFilter !== "all" && r.agent_type !== typeFilter) return false;
      if (q) {
        const hay = `${r.agent_name} ${r.org_name} ${r.id}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [runs, statusFilter, typeFilter, search]);

  return (
    <div className="bg-white">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 p-4 border-b border-border">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agent or org…"
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s === "all" ? "All statuses" : s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SIGNAL_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t === "all" ? "All agent types" : t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="text-xs text-muted-foreground ml-auto">
          {filtered.length} of {runs.length} runs
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading runs…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-sm text-muted-foreground">
          No runs match your filters.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Started</TableHead>
              <TableHead>Org</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Tasks</TableHead>
              <TableHead className="text-right">Leads</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Error</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r: any) => (
              <TableRow
                key={r.id}
                className="cursor-pointer"
                onClick={() => {
                  setSelectedRun(r);
                  setDrawerOpen(true);
                }}
              >
                <TableCell className="text-xs whitespace-nowrap">
                  {formatDistanceToNow(new Date(r.started_at), { addSuffix: true })}
                </TableCell>
                <TableCell className="text-xs max-w-[160px] truncate">{r.org_name}</TableCell>
                <TableCell className="text-sm font-medium max-w-[220px] truncate">
                  {r.agent_name}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{r.agent_type}</TableCell>
                <TableCell>{statusPill(r.status)}</TableCell>
                <TableCell className="text-right text-xs tabular-nums">
                  {r.completed_tasks}/{r.total_tasks}
                </TableCell>
                <TableCell className="text-right text-sm font-semibold tabular-nums">
                  {r.total_leads}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatDuration(r.started_at, r.completed_at)}
                </TableCell>
                <TableCell className="text-xs text-red-600 max-w-[200px] truncate">
                  {r.error ?? ""}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <RunDiagramDrawer run={selectedRun} open={drawerOpen} onOpenChange={setDrawerOpen} />
    </div>
  );
}

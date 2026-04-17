import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { toast } from "sonner";
import { Radio, Settings, HelpCircle, Plus, ChevronDown, ChevronRight, Calendar, Pencil, MoreHorizontal, X, Trash2, Play, Pause, Clock, CheckCircle2, AlertTriangle, Zap, Activity, Loader2, XCircle } from "lucide-react";
import CreateAgentWizard from "@/components/CreateAgentWizard";
import { AddCardDialog } from "@/components/AddCardDialog";
import HowItWorksModal from "@/components/HowItWorksModal";
import AgentSuggestionsPanel from "@/components/signals/AgentSuggestionsPanel";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SignalAgent {
  id: string;
  name: string;
  status: string;
  agent_type: string;
  keywords: string[];
  results_count: number;
  last_launched_at: string | null;
  next_launch_at: string | null;
  created_at: string;
}

interface AgentRun {
  id: string;
  agent_id: string;
  status: string;
  total_tasks: number;
  completed_tasks: number;
  total_leads: number;
  error: string | null;
  started_at: string;
  completed_at: string | null;
}

interface AgentTask {
  id: string;
  run_id: string;
  signal_type: string;
  task_key: string;
  status: string;
  leads_found: number;
  started_at: string | null;
  completed_at: string | null;
  error: string | null;
  diagnostics: any | null;
}

const AGENT_TYPE_LABELS: Record<string, string> = {
  recently_changed_jobs: "Recently changed jobs",
  signals: "Signals",
  engagement: "Engagement",
  funding: "Funding",
};

// ── Scheduled launch times (UTC) mapped to local ─────────────────────────────
const DAILY_LAUNCH_HOURS_UTC = [7, 9, 12, 15, 18]; // process-signal-agents at 07:00, then connection batches

function NextLaunchesPopover() {
  const now = new Date();
  const launches = DAILY_LAUNCH_HOURS_UTC.map((hour) => {
    const d = new Date();
    d.setUTCHours(hour, 0, 0, 0);
    return d;
  });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground border border-border rounded-md px-3 py-1.5 hover:bg-muted transition-colors">
          <Calendar className="w-3.5 h-3.5" />Next launches
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-0">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-sm font-semibold text-foreground">Today's Launches</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {now.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
          </p>
        </div>
        <div className="p-2 space-y-0.5">
          {launches.map((launch, i) => {
            const isPast = now > launch;
            const isNext = !isPast && (i === 0 || now > launches[i - 1]);
            return (
              <div
                key={i}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs ${
                  isNext ? "bg-primary/10 text-primary font-semibold" : isPast ? "text-muted-foreground" : "text-foreground"
                }`}
              >
                {isPast ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                ) : (
                  <Clock className={`w-3.5 h-3.5 shrink-0 ${isNext ? "text-primary" : "text-muted-foreground"}`} />
                )}
                <span>
                  {launch.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                </span>
                {isPast && <span className="ml-auto text-[10px] text-muted-foreground">Done</span>}
                {isNext && <span className="ml-auto text-[10px] font-semibold text-primary">Next</span>}
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
// ── Admin-only Pipeline Diagnostics Panel ────────────────────────────────────
function TaskDiagnosticsPanel({ diagnostics }: { diagnostics: any }) {
  const [expanded, setExpanded] = useState(false);
  if (!diagnostics) return null;

  const d = diagnostics;

  // Build funnel rows based on available keys (keyword vs competitor format)
  const isKeyword = 'total_posts_fetched' in d;
  const funnelRows: { label: string; value: number }[] = isKeyword
    ? [
        { label: 'Posts fetched', value: d.total_posts_fetched ?? 0 },
        { label: 'After dedup', value: d.posts_after_dedup ?? 0 },
        { label: 'Passed pre-filter', value: d.passed_prefilter ?? 0 },
        { label: 'Sent to AI', value: d.sent_to_ai ?? 0 },
        { label: 'Passed AI', value: d.passed_ai ?? 0 },
        { label: 'Inserted', value: d.inserted ?? 0 },
      ]
    : [
        { label: 'Engagers raw', value: d.total_engagers_raw ?? 0 },
        { label: 'After dedup', value: d.engagers_after_dedup ?? 0 },
        { label: 'Profiles fetched', value: d.profiles_fetched ?? 0 },
        { label: 'Inserted', value: d.inserted ?? 0 },
      ];

  const rejections = [
    ...(d.sample_prefilter_rejections || []).map((r: any) => ({ ...r, stage: 'Pre-filter' })),
    ...(d.sample_ai_rejections || []).map((r: any) => ({ ...r, stage: 'AI Classifier' })),
  ];

  // Competitor rejection summary
  const compRejections: { label: string; count: number }[] = !isKeyword ? [
    { label: 'Own company', count: d.excluded_own_company ?? 0 },
    { label: 'Competitor employee', count: d.excluded_competitor_employee ?? 0 },
    { label: 'Irrelevant title', count: d.excluded_irrelevant_title ?? 0 },
    { label: 'Wrong country', count: d.excluded_wrong_country ?? 0 },
    { label: 'No ICP match', count: d.excluded_no_icp_match ?? 0 },
    { label: 'Duplicates', count: d.duplicates ?? 0 },
    { label: 'Quick ICP fail', count: d.failed_quick_icp ?? 0 },
  ].filter(r => r.count > 0) : [];

  return (
    <div className="ml-5 mt-1">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-[10px] font-semibold text-blue-600 hover:text-blue-800 transition-colors"
      >
        <ChevronRight className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        Pipeline Diagnostics
      </button>
      {expanded && (
        <div className="mt-2 space-y-3 text-[11px]">
          {/* Funnel */}
          <div className="flex flex-wrap gap-1 items-center">
            {funnelRows.map((row, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <span className="text-muted-foreground">→</span>}
                <span className="font-medium text-foreground">{row.value}</span>
                <span className="text-muted-foreground">{row.label}</span>
              </span>
            ))}
          </div>

          {/* Keyword rejection stats */}
          {isKeyword && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
              {d.rejected_no_phrase_match > 0 && <span>No phrase match: <strong className="text-foreground">{d.rejected_no_phrase_match}</strong></span>}
              {d.rejected_wrong_country > 0 && <span>Wrong country: <strong className="text-foreground">{d.rejected_wrong_country}</strong></span>}
              {d.rejected_wrong_industry > 0 && <span>Wrong industry: <strong className="text-foreground">{d.rejected_wrong_industry}</strong></span>}
              {d.rejected_ai_not_buyer > 0 && <span>AI: not buyer: <strong className="text-foreground">{d.rejected_ai_not_buyer}</strong></span>}
              {d.rejected_ai_low_score > 0 && <span>AI: low score: <strong className="text-foreground">{d.rejected_ai_low_score}</strong></span>}
              {d.rejected_own_company > 0 && <span>Own company: <strong className="text-foreground">{d.rejected_own_company}</strong></span>}
              {d.rejected_competitor > 0 && <span>Competitor: <strong className="text-foreground">{d.rejected_competitor}</strong></span>}
              {d.rejected_irrelevant_title > 0 && <span>Irrelevant title: <strong className="text-foreground">{d.rejected_irrelevant_title}</strong></span>}
              {d.rejected_private_profile > 0 && <span>Private profile: <strong className="text-foreground">{d.rejected_private_profile}</strong></span>}
            </div>
          )}

          {/* Competitor rejection stats */}
          {!isKeyword && compRejections.length > 0 && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
              {compRejections.map((r, i) => (
                <span key={i}>{r.label}: <strong className="text-foreground">{r.count}</strong></span>
              ))}
            </div>
          )}

          {/* Rejected posts table */}
          {rejections.length > 0 && (
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="px-2 py-1.5 bg-muted/50 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">
                Rejected Posts ({rejections.length})
              </div>
              <div className="max-h-[300px] overflow-y-auto divide-y divide-border">
                {rejections.map((r: any, i: number) => (
                  <div key={i} className="px-2 py-1.5 hover:bg-muted/30">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-[9px] font-bold uppercase px-1 py-0.5 rounded ${r.stage === 'AI Classifier' ? 'bg-purple-50 text-purple-600 border border-purple-200' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}>
                        {r.stage}
                      </span>
                      <span className="text-muted-foreground">{r.reason}</span>
                      {r.intent_score !== undefined && <span className="text-muted-foreground">Score: {r.intent_score}</span>}
                    </div>
                    <p className="text-foreground leading-snug line-clamp-2">{r.postSample}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Mobile agent card ────────────────────────────────────────────────────────
function AgentCard({
  agent,
  onToggle,
  onDelete,
  onEdit,
  onRun,
  isAdmin,
}: {
  agent: SignalAgent;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onRun?: () => void;
  isAdmin?: boolean;
}) {
  const isActive = agent.status === "active";

  return (
    <div className={`rounded-xl border p-4 space-y-3 ${isActive ? "border-green-200 bg-green-50/40" : "border-border bg-background"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
            <Radio className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{agent.name}</p>
            <span className={`inline-block text-[10px] font-semibold rounded px-1.5 py-0.5 mt-0.5 ${isActive ? "text-green-600 bg-green-50 border border-green-200" : "text-muted-foreground bg-muted border border-border"}`}>
              {isActive ? "Active" : "Paused"}
            </span>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={onEdit} className="gap-2 text-sm">
              <Pencil className="w-3.5 h-3.5" />Edit agent
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onToggle} className="gap-2 text-sm">
              {isActive ? <><Pause className="w-3.5 h-3.5" />Pause agent</> : <><Play className="w-3.5 h-3.5 text-green-600" />Activate agent</>}
            </DropdownMenuItem>
            {isAdmin && onRun && (
              <DropdownMenuItem onClick={onRun} className="gap-2 text-sm text-primary">
                <Zap className="w-3.5 h-3.5" />Run now
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="gap-2 text-sm text-destructive focus:text-destructive">
              <Trash2 className="w-3.5 h-3.5" />Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-muted/40 px-3 py-2">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Type</p>
          <p className="text-xs font-medium text-foreground mt-0.5 truncate">{AGENT_TYPE_LABELS[agent.agent_type] || "Signals"}</p>
        </div>
        <div className="rounded-lg bg-muted/40 px-3 py-2">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Results</p>
          <p className="text-sm font-bold text-green-600 mt-0.5">{agent.results_count}</p>
        </div>
      </div>

      {isActive && (
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" style={{ animationDelay: "150ms" }} />
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" style={{ animationDelay: "300ms" }} />
          <span className="text-xs text-muted-foreground ml-1">Hunting for leads...</span>
        </div>
      )}
    </div>
  );
}

export default function Signals() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const sub = useSubscription();
  const { data: isAdmin } = useAdminCheck();
  const [agents, setAgents] = useState<SignalAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editAgentId, setEditAgentId] = useState<string | null>(null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showPreviousLaunches, setShowPreviousLaunches] = useState(false);
  const [activeAgent, setActiveAgent] = useState<SignalAgent | null>(null);
  const [toastAgent, setToastAgent] = useState<SignalAgent | null>(null);
  const [runningAgentIds, setRunningAgentIds] = useState<string[]>([]);
  const [showAddCard, setShowAddCard] = useState(false);
  const [addCardLoading, setAddCardLoading] = useState(false);

  const [newName, setNewName] = useState("My Agent");
  const [newType, setNewType] = useState("recently_changed_jobs");
  const [newKeywords, setNewKeywords] = useState("");

  const [agentRuns, setAgentRuns] = useState<AgentRun[]>([]);
  const [runTasks, setRunTasks] = useState<Record<string, AgentTask[]>>({});
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);

  const maxAgents = 2;

  useEffect(() => {
    fetchAgents();
    fetchRuns();
  }, []);

  // Bandwidth-friendly polling: only when a run is in flight, every 15s, and
  // also refresh the run list so the History view stays current without
  // hammering Supabase when nothing is happening.
  useEffect(() => {
    if (runningAgentIds.length === 0) return;
    const interval = window.setInterval(() => {
      fetchAgents();
      fetchRuns();
    }, 15000);
    return () => window.clearInterval(interval);
  }, [runningAgentIds.length]);

  // Auto-refresh subscription state when returning from Stripe card setup
  useEffect(() => {
    if (searchParams.get("card_added") === "true") {
      sub.refresh();
      searchParams.delete("card_added");
      setSearchParams(searchParams, { replace: true });
      toast.success("Card added successfully! You can now activate your agents.");
    }
  }, [searchParams]);

  async function fetchAgents() {
    setLoading(true);
    const { data, error } = await supabase
      .from("signal_agents")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) {
      // Enrich each agent with live contact count from its associated list
      const agentIds = data.map((a: any) => a.id);
      const { data: lists } = await supabase
        .from("lists")
        .select("source_agent_id, id")
        .in("source_agent_id", agentIds);

      let countsMap: Record<string, number> = {};
      if (lists && lists.length > 0) {
        const listIds = lists.map((l: any) => l.id);
        const { count } = await supabase
          .from("contact_lists")
          .select("list_id", { count: "exact", head: false })
          .in("list_id", listIds);

        // Get per-list counts
        const { data: clData } = await supabase
          .from("contact_lists")
          .select("list_id")
          .in("list_id", listIds);

        if (clData) {
          const listToAgent: Record<string, string> = {};
          for (const l of lists) {
            if (l.source_agent_id) listToAgent[l.id] = l.source_agent_id;
          }
          for (const cl of clData) {
            const agentId = listToAgent[cl.list_id];
            if (agentId) countsMap[agentId] = (countsMap[agentId] || 0) + 1;
          }
        }
      }

      const enriched = data.map((a: any) => ({
        ...a,
        results_count: countsMap[a.id] ?? a.results_count,
      }));

      setAgents(enriched as SignalAgent[]);
      const active = enriched.find((a: any) => a.status === "active");
      if (active) setActiveAgent(active as SignalAgent);
    }
    setLoading(false);
  }

  async function fetchRuns() {
    const { data: runs } = await supabase
      .from("signal_agent_runs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(50);
    if (runs) setAgentRuns(runs as AgentRun[]);
  }

  async function fetchTasksForRun(runId: string) {
    const { data: tasks } = await supabase
      .from("signal_agent_tasks")
      .select("*")
      .eq("run_id", runId)
      .order("started_at", { ascending: true });
    if (tasks) setRunTasks(prev => ({ ...prev, [runId]: tasks as AgentTask[] }));
  }

  async function createAgent() {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;
    const keywords = newKeywords.split(",").map((k) => k.trim()).filter(Boolean);
    const { data, error } = await supabase
      .from("signal_agents")
      .insert({ user_id: user.id, name: newName, agent_type: newType, keywords, status: "active", last_launched_at: new Date().toISOString() })
      .select()
      .single();
    if (!error && data) {
      setShowCreate(false);
      setNewName("My Agent");
      setNewKeywords("");
      setToastAgent(data as SignalAgent);
      setTimeout(() => setToastAgent(null), 6000);
      fetchAgents();
    }
  }

  async function handleSetupCard() {
    setAddCardLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("setup-card");
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
        setShowAddCard(false);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to start card setup");
    } finally {
      setAddCardLoading(false);
    }
  }

  async function toggleAgentStatus(agent: SignalAgent) {
    const newStatus = agent.status === "active" ? "paused" : "active";
    if (newStatus === "active") {
      // Had a subscription that's now canceled → must resubscribe (unless on active trial)
      if (sub.hadSubscription && !sub.subscribed && !(sub.freeTrialEnabled && sub.hasCard)) {
        toast.error("Your subscription has been canceled. Please upgrade your plan to reactivate agents.", {
          action: { label: "Upgrade", onClick: () => navigate("/billing") },
        });
        return;
      }

      // If no active subscription
      if (!sub.subscribed) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { count } = await supabase
            .from("meetings")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id);
          if ((count ?? 0) > 1) {
            toast.error("You have outstanding meetings without an active subscription. Please subscribe to continue.", {
              action: { label: "Subscribe", onClick: () => navigate("/billing") },
            });
            return;
          }
        }

        // Free trial mode: require card only
        if (sub.freeTrialEnabled) {
          if (!sub.hasCard) {
            setShowAddCard(true);
            return;
          }
        } else {
          // Direct payment mode: must subscribe first
          toast.error("You need an active subscription to activate agents.", {
            action: { label: "Subscribe", onClick: () => navigate("/billing") },
          });
          return;
        }
      }
    }
    await supabase
      .from("signal_agents")
      .update({ status: newStatus, ...(newStatus === "active" ? { last_launched_at: new Date().toISOString() } : {}) })
      .eq("id", agent.id);
    if (newStatus === "active") {
      setToastAgent({ ...agent, status: "active" });
      setTimeout(() => setToastAgent(null), 6000);
    }
    fetchAgents();
  }

  async function deleteAgent(id: string) {
    await supabase.from("signal_agents").delete().eq("id", id);
    fetchAgents();
  }

  function markAgentRunning(agent: SignalAgent) {
    const startedAt = new Date().toISOString();
    setRunningAgentIds((prev) => (prev.includes(agent.id) ? prev : [...prev, agent.id]));
    setToastAgent({ ...agent, status: "running", last_launched_at: startedAt });
    setAgents((prev) => prev.map((item) => item.id === agent.id ? { ...item, last_launched_at: startedAt } : item));
    setActiveAgent((prev) => prev?.id === agent.id ? { ...prev, last_launched_at: startedAt } : prev);
  }

  function clearAgentRunning(agentId: string) {
    setRunningAgentIds((prev) => prev.filter((id) => id !== agentId));
    setToastAgent((prev) => prev?.id === agentId ? null : prev);
  }

  function schedulePreviewDisconnectFallback(agent: SignalAgent) {
    window.setTimeout(() => {
      clearAgentRunning(agent.id);
      fetchAgents();
    }, 300000);
  }

  async function runAgentNow(agent: SignalAgent) {
    if (runningAgentIds.includes(agent.id)) {
      toast.info(`"${agent.name}" is already running`);
      return;
    }

    markAgentRunning(agent);
    toast.info(`Started "${agent.name}" — refreshing results while it runs...`);

    try {
      const { data, error } = await supabase.functions.invoke("process-signal-agents", {
        body: { agent_id: agent.id },
      });

      if (error) {
        console.error("Run agent error:", error);
        const isPreviewDisconnect = /Failed to fetch|Failed to send a request to the Edge Function/i.test(error.message || "");

        // Surface daily-budget rejection clearly
        const rawMsg = (error as any)?.context?.error || error.message || "";
        if (/DAILY_BUDGET_EXCEEDED|Daily run budget/i.test(rawMsg)) {
          clearAgentRunning(agent.id);
          toast.error("Daily run budget reached for this agent (3/day). This protects your bandwidth — please try again tomorrow.");
          fetchAgents();
          return;
        }

        if (isPreviewDisconnect) {
          toast.info(`"${agent.name}" started, but preview lost the live connection. I’ll keep refreshing results here.`);
          schedulePreviewDisconnectFallback(agent);
          return;
        }

        clearAgentRunning(agent.id);
        toast.error(`Failed to run agent: ${error.message}`);
        fetchAgents();
        return;
      }

      // Fire-and-forget: orchestrator returns job_ids (array) immediately
      const jobId = data?.job_id ?? data?.job_ids?.[0];
      if (jobId) {
        toast.info(`"${agent.name}" is processing in the background...`);
        // Poll less aggressively (15s) — large runs can take 10+ min and the
        // run record only changes a handful of times.
        const pollInterval = setInterval(async () => {
          const { data: runData } = await supabase
            .from("signal_agent_runs")
            .select("status, total_leads, completed_tasks, total_tasks")
            .eq("id", jobId)
            .single();
          if (!runData) return;
          if (runData.status === "done" || runData.status === "partial" || runData.status === "failed") {
            clearInterval(pollInterval);
            clearAgentRunning(agent.id);
            if (runData.status === "failed") {
              toast.error(`"${agent.name}" failed`);
            } else {
              toast.success(`"${agent.name}" finished — ${runData.total_leads ?? 0} new leads found`);
            }
            fetchAgents();
          }
        }, 15000);
        // Hard stop after 25 min (enough for the largest StaffiX-style runs).
        setTimeout(() => { clearInterval(pollInterval); clearAgentRunning(agent.id); fetchAgents(); }, 25 * 60_000);
      } else {
        clearAgentRunning(agent.id);
        toast.success(`"${agent.name}" finished — ${data?.leads_inserted ?? 0} new leads found`);
        fetchAgents();
      }
    } catch (error) {
      console.error("Run agent error:", error);
      clearAgentRunning(agent.id);
      toast.error("Failed to run agent");
      fetchAgents();
    }
  }

  function timeAgo(dateStr: string | null) {
    if (!dateStr) return "";
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return `Started ${diff} seconds ago`;
    if (diff < 3600) return `Started ${Math.floor(diff / 60)} minutes ago`;
    return `Started ${Math.floor(diff / 3600)} hours ago`;
  }

  const activeCount = agents.filter((a) => a.status === "active").length;

  if (showCreate) {
    return (
      <div className="relative min-h-full bg-card rounded-2xl m-3 md:m-4 overflow-hidden">
        <CreateAgentWizard onClose={() => { setShowCreate(false); setEditAgentId(null); }} onCreated={fetchAgents} editAgentId={editAgentId} />
      </div>
    );
  }

  return (
    <div className="relative min-h-full bg-card rounded-2xl m-3 md:m-4 p-4 md:p-8">
      {/* Plan banner */}
      {!sub.loading && !sub.subscribed && (
        sub.hasAccess ? (
          <div className="flex items-center gap-3 px-4 py-3 mb-5 rounded-xl border border-emerald-200 bg-emerald-50/60">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <p className="text-sm text-emerald-900 font-medium">
              AI Agents are running for free until you book your first meeting.
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-4 py-3 mb-5 rounded-xl border border-amber-200 bg-amber-50/60">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-900 font-medium">
              Your AI agents are paused because you're on the Free plan.{" "}
              <button onClick={() => navigate("/billing")} className="underline font-semibold hover:text-amber-700 transition-colors">
                Upgrade now
              </button>
            </p>
          </div>
        )
      )}

      {/* Toast notification */}
      {toastAgent && (
        <div className="fixed top-4 right-4 z-50 bg-white border border-gray-200 rounded-xl shadow-lg p-4 w-[min(320px,calc(100vw-2rem))] animate-in slide-in-from-right">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
              <Radio className="w-4 h-4 text-gray-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm text-gray-900 truncate">{toastAgent.name}</span>
                <span className="text-[11px] font-semibold text-green-600 bg-green-50 border border-green-200 rounded px-1.5 py-0.5">Active</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{timeAgo(toastAgent.last_launched_at || toastAgent.created_at)}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse delay-150" />
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse delay-300" />
                <span className="text-xs text-gray-500 ml-1">Hunting for high-intent leads...</span>
              </div>
            </div>
            <button onClick={() => setToastAgent(null)} className="text-gray-400 hover:text-gray-600 shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-1">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-green-500" />
            <h1 className="text-xl font-bold text-gray-900">Signals Agents</h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
              {activeCount}
            </span>
            <span className="text-gray-400">|</span>
            <span>{maxAgents} max</span>
            
          </div>
        </div>
        <button
          onClick={() => setShowHowItWorks(!showHowItWorks)}
          className="self-start sm:self-auto flex items-center gap-1.5 text-xs font-semibold text-white rounded-full px-3.5 py-1.5 transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #5F93FF, #9CBCFB)" }}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          HOW IT WORKS?
        </button>
      </div>
      <p className="text-sm text-gray-500 mb-5">Manage your automated lead generation agents & signals</p>

      <HowItWorksModal open={showHowItWorks} onClose={() => setShowHowItWorks(false)} />
      <AddCardDialog open={showAddCard} onOpenChange={setShowAddCard} onConfirm={handleSetupCard} loading={addCardLoading} freeTrialMode={sub.freeTrialEnabled} freeTrialLimit={sub.freeTrialLimit} />

      {/* Active Agent Card */}
      {activeAgent && (
        <div className="rounded-2xl border border-border bg-card shadow-sm p-5 md:p-6 mb-5 max-w-lg">
          {/* Header row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 shadow-md">
                <Radio className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-sm leading-tight">{activeAgent.name}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Started {timeAgo(activeAgent.last_launched_at || activeAgent.created_at)}</p>
              </div>
            </div>
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active
            </span>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-lg bg-muted/50 px-3 py-2.5">
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Type</p>
              <p className="text-xs font-semibold text-foreground">{AGENT_TYPE_LABELS[activeAgent.agent_type] || activeAgent.agent_type}</p>
            </div>
            <div className="rounded-lg bg-muted/50 px-3 py-2.5">
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Results</p>
              <p className="text-xs font-semibold text-foreground">{activeAgent.results_count} leads found</p>
            </div>
          </div>

          {/* Keywords */}
          <div className="rounded-lg bg-muted/50 px-3 py-2.5 mb-4">
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1.5">Keywords</p>
            <div className="flex flex-wrap gap-1.5">
              {activeAgent.keywords?.length ? activeAgent.keywords.map((k, idx) => (
                <span key={idx} className="text-[11px] font-medium text-foreground bg-background border border-border rounded-full px-2 py-0.5">
                  {k}
                </span>
              )) : (
                <span className="text-[11px] text-muted-foreground italic">No keywords set</span>
              )}
            </div>
          </div>

          {/* Status bar */}
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/50 px-3 py-2">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse [animation-delay:0.4s]" />
            </div>
            <span className="text-xs font-medium text-emerald-700">Hunting for high-quality leads...</span>
          </div>
        </div>
      )}

      {/* Mobile: cards */}
      <div className="md:hidden space-y-3 mb-4">
        {loading ? (
          <p className="text-center py-10 text-sm text-muted-foreground">Loading agents...</p>
        ) : agents.length === 0 ? (
          <p className="text-center py-10 text-sm text-muted-foreground">No agents yet. Create your first one below.</p>
        ) : (
          agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onToggle={() => toggleAgentStatus(agent)}
              onDelete={() => deleteAgent(agent.id)}
              onEdit={() => { setEditAgentId(agent.id); setShowCreate(true); }}
              onRun={() => runAgentNow(agent)}
              isAdmin={!!isAdmin}
            />
          ))
        )}
        <button
          onClick={() => { setEditAgentId(null); setShowCreate(true); }}
          disabled={agents.length >= maxAgents}
          className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-medium text-blue-500 bg-blue-50/50 border border-dashed border-blue-200 rounded-xl hover:bg-blue-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          Create Agent
        </button>
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block border border-gray-200 rounded-xl overflow-hidden mb-4">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Agent Name</th>
              <th className="text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Type</th>
              <th className="text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Results</th>
              <th className="text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="text-center py-10 text-sm text-gray-400">Loading agents...</td></tr>
            ) : agents.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-10 text-sm text-gray-400">No agents yet. Create your first one below.</td></tr>
            ) : (
              agents.map((agent) => (
                <tr key={agent.id} className={`border-b border-gray-50 ${agent.status === "active" ? "bg-green-50/40" : ""}`}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <Radio className="w-3.5 h-3.5 text-gray-400" />
                      </div>
                      <span className="font-medium text-sm text-gray-900">{agent.name}</span>
                      <span className={`text-[11px] font-semibold rounded px-1.5 py-0.5 ${agent.status === "active" ? "text-green-600 bg-green-50 border border-green-200" : "text-gray-500 bg-gray-100 border border-gray-200"}`}>
                        {agent.status === "active" ? "Active" : "Paused"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 border border-green-200 rounded-full px-2.5 py-1">
                      <Radio className="w-3 h-3" />
                      {AGENT_TYPE_LABELS[agent.agent_type] || "Signals"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="text-xs font-medium text-green-600 bg-green-50 border border-green-200 rounded-full px-2.5 py-1">
                      {agent.results_count} results
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      {runningAgentIds.includes(agent.id) && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1 animate-pulse">
                          <Zap className="w-3 h-3" />Running
                        </span>
                      )}
                      <NextLaunchesPopover />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="text-gray-400 hover:text-gray-600 p-1">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" side="top" className="w-44">
                          <DropdownMenuItem onClick={() => { setEditAgentId(agent.id); setShowCreate(true); }} className="gap-2 text-sm">
                            <Pencil className="w-3.5 h-3.5" />Edit agent
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleAgentStatus(agent)} className="gap-2 text-sm">
                            {agent.status === "active" ? <><Pause className="w-3.5 h-3.5" />Pause agent</> : <><Play className="w-3.5 h-3.5 text-green-600" />Activate agent</>}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => runAgentNow(agent)} className="gap-2 text-sm text-primary">
                            <Zap className="w-3.5 h-3.5" />Run now
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => deleteAgent(agent.id)} className="gap-2 text-sm text-destructive focus:text-destructive">
                            <Trash2 className="w-3.5 h-3.5" />Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="bg-blue-50/50 border-t border-dashed border-blue-200">
          <button
            onClick={() => { setEditAgentId(null); setShowCreate(true); }}
            disabled={agents.length >= maxAgents}
            className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-medium text-blue-500 hover:text-blue-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />Create Agent<ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Run History */}
      <button
        onClick={() => { setShowPreviousLaunches(!showPreviousLaunches); if (!showPreviousLaunches) fetchRuns(); }}
        className="flex items-center gap-1.5 mx-auto text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <Activity className="w-3.5 h-3.5" />
        Run History
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showPreviousLaunches ? "rotate-180" : ""}`} />
      </button>

      {showPreviousLaunches && (
        <div className="mt-4 border border-border rounded-xl overflow-hidden">
          {agentRuns.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No runs yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {agents.map((agent) => {
                const runs = agentRuns.filter(r => r.agent_id === agent.id);
                if (runs.length === 0) return null;
                return (
                  <div key={agent.id} className="px-4 py-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Radio className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="font-semibold text-sm text-foreground">{agent.name}</span>
                      <span className="text-xs text-muted-foreground">({runs.length} runs)</span>
                    </div>
                    <div className="space-y-1.5 pl-5">
                      {runs.map((run) => {
                        const isExpanded = expandedRunId === run.id;
                        const tasks = runTasks[run.id];
                        const statusIcon = run.status === 'done' ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> :
                          run.status === 'running' || run.status === 'queued' ? <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin" /> :
                          run.status === 'partial' ? <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> :
                          <XCircle className="w-3.5 h-3.5 text-destructive" />;
                        const statusColor = run.status === 'done' ? 'text-green-600 bg-green-50 border-green-200' :
                          run.status === 'running' || run.status === 'queued' ? 'text-amber-600 bg-amber-50 border-amber-200' :
                          run.status === 'partial' ? 'text-amber-600 bg-amber-50 border-amber-200' :
                          'text-red-600 bg-red-50 border-red-200';

                        return (
                          <div key={run.id} className="rounded-lg border border-border bg-background">
                            <button
                              className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted/50 transition-colors rounded-lg"
                              onClick={() => {
                                if (isExpanded) { setExpandedRunId(null); } else { setExpandedRunId(run.id); fetchTasksForRun(run.id); }
                              }}
                            >
                              <ChevronRight className={`w-3 h-3 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                              {statusIcon}
                              <span className="text-xs text-muted-foreground">{new Date(run.started_at).toLocaleString()}</span>
                              <span className={`text-[10px] font-semibold rounded px-1.5 py-0.5 border ${statusColor}`}>
                                {run.status}
                              </span>
                              <span className="text-xs text-muted-foreground ml-auto">{run.completed_tasks}/{run.total_tasks} tasks</span>
                              <span className="text-xs font-semibold text-green-600">{run.total_leads} leads</span>
                            </button>

                            {isExpanded && (
                              <div className="px-3 pb-3 pt-1 border-t border-border">
                                {!tasks ? (
                                  <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
                                    <Loader2 className="w-3 h-3 animate-spin" /> Loading tasks...
                                  </div>
                                ) : tasks.length === 0 ? (
                                  <p className="text-xs text-muted-foreground py-2">No tasks recorded for this run.</p>
                                ) : (
                                  <div className="space-y-1.5 mt-1">
                                    {tasks.map((task) => {
                                      const tIcon = task.status === 'done' ? <CheckCircle2 className="w-3 h-3 text-green-500" /> :
                                        task.status === 'running' ? <Loader2 className="w-3 h-3 text-amber-500 animate-spin" /> :
                                        task.status === 'pending' ? <Clock className="w-3 h-3 text-muted-foreground" /> :
                                        <XCircle className="w-3 h-3 text-destructive" />;
                                      const tColor = task.status === 'done' ? 'text-green-600' :
                                        task.status === 'running' ? 'text-amber-600' :
                                        task.status === 'pending' ? 'text-muted-foreground' : 'text-destructive';
                                      const duration = task.started_at && task.completed_at
                                        ? `${Math.round((new Date(task.completed_at).getTime() - new Date(task.started_at).getTime()) / 1000)}s`
                                        : task.started_at && task.status === 'running'
                                        ? `${Math.round((Date.now() - new Date(task.started_at).getTime()) / 1000)}s...`
                                        : '—';

                                      return (
                                        <div key={task.id}>
                                          <div className="flex items-center gap-2 text-xs">
                                            {tIcon}
                                            <span className="font-medium text-foreground min-w-[140px]">{task.task_key}</span>
                                            <span className={`text-[10px] font-semibold ${tColor}`}>{task.status}</span>
                                            <span className="text-muted-foreground">{duration}</span>
                                            <span className="text-green-600 font-semibold ml-auto">{task.leads_found} leads</span>
                                            {task.error && <span className="text-destructive text-[10px] truncate max-w-[200px]" title={task.error}>⚠ {task.error}</span>}
                                          </div>
                                          {isAdmin && task.diagnostics && (
                                            <TaskDiagnosticsPanel diagnostics={task.diagnostics} />
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                                {run.error && (
                                  <div className="mt-2 text-xs text-destructive bg-red-50 border border-red-200 rounded px-2 py-1.5">
                                    <strong>Error:</strong> {run.error}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

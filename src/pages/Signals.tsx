import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";
import { Radio, Settings, HelpCircle, Plus, ChevronDown, Calendar, Pencil, MoreHorizontal, X, Trash2, Play, Pause, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import CreateAgentWizard from "@/components/CreateAgentWizard";
import HowItWorksModal from "@/components/HowItWorksModal";
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

// ── Mobile agent card ────────────────────────────────────────────────────────
function AgentCard({
  agent,
  onToggle,
  onDelete,
  onEdit,
}: {
  agent: SignalAgent;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
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
  const sub = useSubscription();
  const [agents, setAgents] = useState<SignalAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editAgentId, setEditAgentId] = useState<string | null>(null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showPreviousLaunches, setShowPreviousLaunches] = useState(false);
  const [activeAgent, setActiveAgent] = useState<SignalAgent | null>(null);
  const [toastAgent, setToastAgent] = useState<SignalAgent | null>(null);

  const [newName, setNewName] = useState("My Agent");
  const [newType, setNewType] = useState("recently_changed_jobs");
  const [newKeywords, setNewKeywords] = useState("");

  const maxAgents = 2;

  useEffect(() => {
    fetchAgents();
  }, []);

  async function fetchAgents() {
    setLoading(true);
    const { data, error } = await supabase
      .from("signal_agents")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) {
      setAgents(data as SignalAgent[]);
      const active = data.find((a: any) => a.status === "active");
      if (active) setActiveAgent(active as SignalAgent);
    }
    setLoading(false);
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

  async function toggleAgentStatus(agent: SignalAgent) {
    const newStatus = agent.status === "active" ? "paused" : "active";
    // Block activation on free plan
    if (newStatus === "active" && !sub.subscribed) {
      toast.error("Upgrade to a paid plan to activate agents", {
        action: { label: "Upgrade", onClick: () => navigate("/billing") },
      });
      return;
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
      {/* Free plan banner */}
      {!sub.loading && !sub.subscribed && (
        <div className="flex items-center gap-3 px-4 py-3 mb-5 rounded-xl border border-amber-200 bg-amber-50/60">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-900 font-medium">
            Your AI agents are paused because you're on the Free plan.{" "}
            <button onClick={() => navigate("/billing")} className="underline font-semibold hover:text-amber-700 transition-colors">
              Upgrade now
            </button>
          </p>
        </div>
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
            <Settings className="w-4 h-4 text-gray-400" />
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

      {/* Previous launches */}
      <button
        onClick={() => setShowPreviousLaunches(!showPreviousLaunches)}
        className="flex items-center gap-1.5 mx-auto text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        See previous launches
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showPreviousLaunches ? "rotate-180" : ""}`} />
      </button>

      {showPreviousLaunches && (
        <div className="mt-4 border border-gray-200 rounded-xl p-4 md:p-5">
          {agents.filter((a) => a.last_launched_at).length === 0 ? (
            <p className="text-sm text-gray-400 text-center">No previous launches yet.</p>
          ) : (
            <div className="space-y-3">
              {agents
                .filter((a) => a.last_launched_at)
                .map((a) => (
                  <div key={a.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-sm border-b border-gray-100 last:border-0 pb-2 last:pb-0">
                    <div className="flex items-center gap-2">
                      <Radio className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="font-medium text-gray-700">{a.name}</span>
                    </div>
                    <div className="flex items-center gap-3 pl-5 sm:pl-0">
                      <span className="text-xs text-gray-400">{a.last_launched_at ? new Date(a.last_launched_at).toLocaleString() : "—"}</span>
                      <span className="text-xs text-green-600">{a.results_count} results</span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

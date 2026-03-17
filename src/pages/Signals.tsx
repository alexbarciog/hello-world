import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Radio, Settings, HelpCircle, Plus, ChevronDown, Calendar, Pencil, MoreHorizontal, X } from "lucide-react";
import CreateAgentWizard from "@/components/CreateAgentWizard";

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

export default function Signals() {
  const [agents, setAgents] = useState<SignalAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showPreviousLaunches, setShowPreviousLaunches] = useState(false);
  const [activeAgent, setActiveAgent] = useState<SignalAgent | null>(null);
  const [toastAgent, setToastAgent] = useState<SignalAgent | null>(null);

  // Create agent form
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
      // Set first active agent as the "running" one
      const active = data.find((a: any) => a.status === "active");
      if (active) setActiveAgent(active as SignalAgent);
    }
    setLoading(false);
  }

  async function createAgent() {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;
    const keywords = newKeywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    const { data, error } = await supabase
      .from("signal_agents")
      .insert({
        user_id: user.id,
        name: newName,
        agent_type: newType,
        keywords,
        status: "active",
        last_launched_at: new Date().toISOString(),
      })
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
    await supabase
      .from("signal_agents")
      .update({
        status: newStatus,
        ...(newStatus === "active" ? { last_launched_at: new Date().toISOString() } : {}),
      })
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
    return <CreateAgentWizard onClose={() => setShowCreate(false)} onCreated={fetchAgents} />;
  }

  return (
    <div className="relative min-h-full p-6 md:p-8">
      {/* Toast notification */}
      {toastAgent && (
        <div className="fixed top-6 right-6 z-50 bg-white border border-gray-200 rounded-xl shadow-lg p-4 w-[320px] animate-in slide-in-from-right">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
              <Radio className="w-4 h-4 text-gray-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-gray-900">{toastAgent.name}</span>
                <span className="text-[11px] font-semibold text-green-600 bg-green-50 border border-green-200 rounded px-1.5 py-0.5">
                  Active
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{timeAgo(toastAgent.last_launched_at || toastAgent.created_at)}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse delay-150" />
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse delay-300" />
                <span className="text-xs text-gray-500 ml-1">Hunting for high-intent leads...</span>
              </div>
            </div>
            <button onClick={() => setToastAgent(null)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
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
        <button
          onClick={() => setShowHowItWorks(!showHowItWorks)}
          className="flex items-center gap-1.5 text-xs font-semibold text-red-500 border border-red-200 rounded-full px-3 py-1 hover:bg-red-50 transition-colors"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          HOW IT WORKS?
        </button>
      </div>
      <p className="text-sm text-gray-500 mb-6">Manage your automated lead generation agents & signals</p>

      {/* How it works panel */}
      {showHowItWorks && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 text-sm text-gray-700">
          <p className="font-semibold mb-2">How Signal Agents Work</p>
          <ol className="list-decimal list-inside space-y-1 text-gray-600">
            <li>Create an agent with specific keywords and signal type</li>
            <li>The agent monitors LinkedIn and other sources for matching signals</li>
            <li>High-intent leads are automatically captured and scored</li>
            <li>Review results and add leads directly to your campaigns</li>
          </ol>
          <button onClick={() => setShowHowItWorks(false)} className="mt-2 text-xs text-orange-600 font-medium hover:underline">
            Close
          </button>
        </div>
      )}

      {/* Active Agent Card */}
      {activeAgent && (
        <div className="border border-gray-200 rounded-xl p-5 mb-6 max-w-md">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
              <Radio className="w-4 h-4 text-gray-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                <span className="font-semibold text-sm text-gray-900">{activeAgent.name}</span>
                <span className="text-[11px] font-semibold text-green-600 bg-green-50 border border-green-200 rounded px-1.5 py-0.5">
                  Active
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{timeAgo(activeAgent.last_launched_at || activeAgent.created_at)}</p>
            </div>
          </div>
          <div className="space-y-1 text-sm text-gray-700 mb-3">
            <p>
              <span className="font-medium">Type:</span> {AGENT_TYPE_LABELS[activeAgent.agent_type] || activeAgent.agent_type}
            </p>
            <p>
              <span className="font-medium">Keyword:</span>{" "}
              {activeAgent.keywords?.length
                ? activeAgent.keywords.map((k) => `"${k}"`).join(" OR ")
                : "No keywords set"}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
            <span className="text-xs text-gray-500 ml-1">Hunting for high-quality leads...</span>
          </div>
        </div>
      )}

      {/* Agents Table */}
      <div className="border border-gray-200 rounded-xl overflow-hidden mb-4">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">
                Agent Name
              </th>
              <th className="text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">
                Type
              </th>
              <th className="text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">
                Results
              </th>
              <th className="text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="text-center py-10 text-sm text-gray-400">
                  Loading agents...
                </td>
              </tr>
            ) : agents.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-10 text-sm text-gray-400">
                  No agents yet. Create your first one below.
                </td>
              </tr>
            ) : (
              agents.map((agent) => (
                <tr
                  key={agent.id}
                  className={`border-b border-gray-50 ${
                    agent.status === "active" ? "bg-green-50/40" : ""
                  }`}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <Radio className="w-3.5 h-3.5 text-gray-400" />
                      </div>
                      <span className="font-medium text-sm text-gray-900">{agent.name}</span>
                      <span
                        className={`text-[11px] font-semibold rounded px-1.5 py-0.5 ${
                          agent.status === "active"
                            ? "text-green-600 bg-green-50 border border-green-200"
                            : "text-gray-500 bg-gray-100 border border-gray-200"
                        }`}
                      >
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
                      <button className="flex items-center gap-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-md px-3 py-1.5 hover:bg-gray-50 transition-colors">
                        <Calendar className="w-3.5 h-3.5" />
                        Next launches
                      </button>
                      <button
                        onClick={() => toggleAgentStatus(agent)}
                        className="flex items-center gap-1.5 text-xs font-medium text-red-500 border border-red-200 rounded-md px-3 py-1.5 hover:bg-red-50 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => deleteAgent(agent.id)}
                        className="text-gray-400 hover:text-gray-600 p-1"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Create Agent row */}
        <div className="bg-orange-50/50 border-t border-dashed border-orange-200">
          <button
            onClick={() => setShowCreate(true)}
            disabled={agents.length >= maxAgents}
            className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-medium text-orange-500 hover:text-orange-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Create Agent
            <ChevronDown className="w-3.5 h-3.5" />
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
        <div className="mt-4 border border-gray-200 rounded-xl p-5">
          {agents.filter((a) => a.last_launched_at).length === 0 ? (
            <p className="text-sm text-gray-400 text-center">No previous launches yet.</p>
          ) : (
            <div className="space-y-3">
              {agents
                .filter((a) => a.last_launched_at)
                .map((a) => (
                  <div key={a.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Radio className="w-3.5 h-3.5 text-gray-400" />
                      <span className="font-medium text-gray-700">{a.name}</span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {a.last_launched_at ? new Date(a.last_launched_at).toLocaleString() : "—"}
                    </span>
                    <span className="text-xs text-green-600">{a.results_count} results</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

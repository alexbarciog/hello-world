import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ChevronLeft, Play, Pause, Pencil, Settings as SettingsIcon,
  Users, BarChart3, Clock, GitBranch, Search, Flame, AtSign,
  UserPlus, Send, MessageSquare, ArrowRight, Save, Bot, Sparkles,
  AlertCircle,
} from "lucide-react";
import { Contact, avatarColor, getInitials, timeAgo, DOT_COLORS } from "@/components/contacts/types";
import { LinkedInIcon } from "@/components/contacts/LinkedInIcon";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

type CampaignFull = {
  id: string;
  company_name: string | null;
  status: string;
  created_at: string;
  website: string | null;
  description: string | null;
  value_proposition: string | null;
  pain_points: string[];
  campaign_goal: string | null;
  message_tone: string | null;
  source_type: string | null;
  source_agent_id: string | null;
  source_list_id: string | null;
  workflow_steps: any[];
  invitations_sent: number;
  invitations_accepted: number;
  messages_sent: number;
  messages_replied: number;
};

type Tab = "workflow" | "scheduled" | "contacts" | "launches" | "insights" | "settings";

const TABS: { key: Tab; label: string; icon: any }[] = [
  { key: "workflow", label: "Workflow", icon: GitBranch },
  { key: "scheduled", label: "Scheduled", icon: Clock },
  { key: "contacts", label: "Contacts", icon: Users },
  { key: "launches", label: "Last Launches", icon: Clock },
  { key: "insights", label: "Insights", icon: BarChart3 },
  { key: "settings", label: "Settings", icon: SettingsIcon },
];

const CAMPAIGN_GOALS = [
  { value: "conversations", label: "Start conversations with warm prospects", desc: "Build relationships and nurture leads through personalized conversations" },
  { value: "demos", label: "Book qualified sales calls/demos", desc: "Direct approach to schedule meetings and product demonstrations" },
];

const MESSAGE_TONES = [
  { value: "professional", label: "Professional", desc: "Formal, polished" },
  { value: "conversational", label: "Conversational", desc: "Friendly, casual" },
  { value: "direct", label: "Direct", desc: "Bold, confident" },
];

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<CampaignFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("workflow");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactSearch, setContactSearch] = useState("");
  const [agentName, setAgentName] = useState("My Agent");
  const [agentStatus, setAgentStatus] = useState("paused");
  const [contactsCount, setContactsCount] = useState(0);
  const [listsCount, setListsCount] = useState(0);
  const [showAgentRunning, setShowAgentRunning] = useState(false);

  // Settings state
  const [settingsGoal, setSettingsGoal] = useState("");
  const [settingsTone, setSettingsTone] = useState("");
  const [settingsExcludeFirst, setSettingsExcludeFirst] = useState(true);
  const [settingsReviewMode, setSettingsReviewMode] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    if (id) loadCampaign(id);
  }, [id]);

  async function loadCampaign(campaignId: string) {
    setLoading(true);
    const { data } = await supabase.from("campaigns").select("*").eq("id", campaignId).single();
    if (!data) { setLoading(false); navigate("/campaigns"); return; }

    const c = data as any as CampaignFull;
    setCampaign(c);
    setSettingsGoal(c.campaign_goal || "conversations");
    setSettingsTone(c.message_tone || "professional");

    // Load agent info
    if (c.source_agent_id) {
      const { data: agent } = await supabase.from("signal_agents").select("name, status, results_count").eq("id", c.source_agent_id).single();
      if (agent) {
        setAgentName(agent.name);
        setAgentStatus(agent.status);
      }
    }

    // Load contacts count
    if (c.source_agent_id) {
      const { data: agentData } = await supabase.from("signal_agents").select("leads_list_name").eq("id", c.source_agent_id).single();
      if (agentData?.leads_list_name) {
        const { data: contactData } = await supabase.from("contacts").select("*").eq("list_name", agentData.leads_list_name).order("imported_at", { ascending: false });
        if (contactData) {
          setContacts(contactData as Contact[]);
          setContactsCount(contactData.length);
        }
        // Count lists
        const { count } = await (supabase.from("lists") as any).select("id", { count: "exact", head: true }).eq("name", agentData.leads_list_name);
        setListsCount(count || 1);
      }
    }

    setLoading(false);
  }

  async function toggleCampaignStatus() {
    if (!campaign) return;
    const newStatus = campaign.status === "active" ? "paused" : "active";
    const { error } = await supabase.from("campaigns").update({ status: newStatus }).eq("id", campaign.id);
    if (error) { toast.error("Failed to update status"); return; }
    setCampaign({ ...campaign, status: newStatus });
    toast.success(newStatus === "active" ? "Campaign started!" : "Campaign paused");
  }

  async function runAgent() {
    setShowAgentRunning(true);
    try {
      await supabase.functions.invoke("process-signal-agents", { body: {} });
    } catch { /* runs async */ }
  }

  async function saveSettings() {
    if (!campaign) return;
    setSavingSettings(true);
    const { error } = await supabase.from("campaigns").update({
      campaign_goal: settingsGoal,
      message_tone: settingsTone,
    } as any).eq("id", campaign.id);
    if (error) toast.error("Failed to save");
    else { toast.success("Settings saved!"); setCampaign({ ...campaign, campaign_goal: settingsGoal, message_tone: settingsTone }); }
    setSavingSettings(false);
  }

  const filteredContacts = useMemo(() => {
    if (!contactSearch.trim()) return contacts;
    const q = contactSearch.toLowerCase();
    return contacts.filter(c =>
      c.first_name.toLowerCase().includes(q) || (c.last_name || "").toLowerCase().includes(q) ||
      (c.company || "").toLowerCase().includes(q) || (c.title || "").toLowerCase().includes(q)
    );
  }, [contacts, contactSearch]);

  const workflowSteps = campaign?.workflow_steps || [
    { type: "invitation", message: "", delay_days: 0 },
    { type: "message", message: "", delay_days: 1, ai_icebreaker: true },
    { type: "message", message: "", delay_days: 2 },
    { type: "message", message: "", delay_days: 3 },
  ];

  // Chart data
  const chartData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({ date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), invitations: 0, messages: 0 });
    }
    return days;
  }, []);

  if (loading) {
    return (
      <div className="min-h-full bg-card rounded-2xl m-3 md:m-4 p-6 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  if (!campaign) return null;

  const acceptanceRate = campaign.invitations_sent > 0 ? Math.round((campaign.invitations_accepted / campaign.invitations_sent) * 100) : 0;
  const replyRate = campaign.messages_sent > 0 ? Math.round((campaign.messages_replied / campaign.messages_sent) * 100) : 0;

  return (
    <div className="min-h-full bg-card rounded-2xl m-3 md:m-4 overflow-hidden">
      {/* Header */}
      <div className="px-4 md:px-6 pt-5 pb-0">
        <button onClick={() => navigate("/campaigns")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to campaigns
        </button>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              Campaign Details – {campaign.company_name || "My Campaign"}
              <button className="text-muted-foreground hover:text-foreground"><Pencil className="w-4 h-4" /></button>
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage your campaign workflow and contacts</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-sm">
              <span className={`w-2 h-2 rounded-full ${campaign.status === "active" ? "bg-green-500" : "bg-red-500"}`} />
              <span className="text-muted-foreground">Campaign is {campaign.status}</span>
            </span>
            <button
              onClick={toggleCampaignStatus}
              className="flex items-center gap-1.5 text-sm font-semibold text-white rounded-lg px-4 py-2 transition-colors"
              style={{ background: campaign.status === "active" ? "hsl(0 70% 50%)" : "hsl(var(--goji-coral))" }}
            >
              {campaign.status === "active" ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> Start campaign</>}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 md:px-6 mt-4">
        <div className="flex items-center gap-1 border border-border rounded-xl p-1 bg-muted/30 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                tab === t.key
                  ? "bg-background text-[hsl(var(--goji-coral))] shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
              {t.key === "scheduled" && <span className="text-xs text-muted-foreground">(0)</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 md:px-6 py-5">
        {/* ── Workflow Tab ── */}
        {tab === "workflow" && (
          <div className="space-y-5">
            <div className="rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-foreground">Campaign Workflow</h2>
                <span className="text-xs text-muted-foreground">Design and manage your campaign automation steps</span>
              </div>

              {/* Sender info */}
              <div className="rounded-lg border border-border p-3 flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">Sender:</span>
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs">👤</div>
                  <span className="text-sm font-medium text-foreground">Alexandru Barciog</span>
                  <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Connected</span>
                  <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">🔥 14/day</span>
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">✉️ 20/day</span>
                </div>
                <button className="text-muted-foreground hover:text-foreground"><SettingsIcon className="w-4 h-4" /></button>
              </div>

              {/* Edit button */}
              <div className="flex justify-end mb-3">
                <button className="flex items-center gap-1 text-sm font-medium text-primary">
                  Edit <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Workflow steps canvas */}
              <div className="flex items-start gap-3 overflow-x-auto pb-4">
                {/* Input Source */}
                <div className="min-w-[220px] shrink-0">
                  <div className="rounded-xl bg-foreground/90 text-background p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Bot className="w-4 h-4" />
                      <span className="text-sm font-bold">Input source</span>
                    </div>
                    <p className="text-xs opacity-70">1 agent(s)</p>
                  </div>
                  <div className="mt-2 rounded-lg border border-border bg-background p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{agentName}</span>
                      <span className={`text-xs font-medium ${agentStatus === "active" ? "text-green-500" : "text-muted-foreground"}`}>
                        {agentStatus === "active" ? "Running 🟢" : "Paused"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{listsCount} list(s) • {contactsCount} contact(s)</p>
                  </div>

                  {/* Agent running popup */}
                  {showAgentRunning && (
                    <div className="mt-3 rounded-lg border border-border bg-background p-4 shadow-lg relative">
                      <button onClick={() => setShowAgentRunning(false)} className="absolute top-2 right-2 text-muted-foreground hover:text-foreground">
                        <span className="text-lg">×</span>
                      </button>
                      <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-500" /> Your agent is running…
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Your agent is searching for leads that match your ideal customer profile. Once found, they will be automatically added to the campaign workflow.
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        You can check your <button onClick={() => navigate("/contacts")} className="text-primary underline">leads</button> in a few minutes.
                      </p>
                    </div>
                  )}

                  <div className="flex justify-center mt-3">
                    <ArrowRight className="w-5 h-5 text-primary rotate-90" />
                  </div>
                </div>

                {/* Workflow Steps */}
                {workflowSteps.map((ws: any, i: number) => {
                  const isInvitation = ws.type === "invitation";
                  const stepColors = [
                    "bg-purple-500", "bg-cyan-500", "bg-orange-500", "bg-cyan-600",
                  ];
                  const bgColor = stepColors[i] || "bg-primary";

                  return (
                    <div key={i} className="min-w-[200px] shrink-0 flex flex-col items-center">
                      {i > 0 && (
                        <div className="flex items-center gap-1 mb-2 text-xs text-muted-foreground">
                          <ArrowRight className="w-4 h-4 text-primary" />
                          <span className="bg-muted px-2 py-0.5 rounded-full">+ {ws.delay_days} days</span>
                        </div>
                      )}
                      <div className={`rounded-xl ${bgColor} text-white p-4 w-full`}>
                        <div className="flex items-center gap-2 mb-1">
                          {isInvitation ? <UserPlus className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                          <span className="text-sm font-bold">{isInvitation ? "Send Invitation" : "Send Message"}</span>
                        </div>
                        <p className="text-xs opacity-80">Step {i + 1}</p>
                      </div>
                      <div className="mt-2 rounded-lg border border-border bg-background p-3 w-full">
                        {isInvitation ? (
                          <p className="text-xs text-muted-foreground">Invitation without message</p>
                        ) : ws.ai_icebreaker ? (
                          <div className="flex items-center gap-1.5 text-xs">
                            <AlertCircle className="w-3 h-3 text-[hsl(var(--goji-coral))]" />
                            <span className="text-foreground font-medium">AI Icebreaker</span>
                          </div>
                        ) : (
                          <div>
                            <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-1">MESSAGE:</p>
                            <p className="text-xs text-foreground">{ws.message || "No message configured..."}</p>
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <span>0 contact(s)</span>
                          <span className="text-green-600">0 {isInvitation ? "accepted" : "answer(s)"}</span>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <button className="text-xs text-foreground border border-border rounded px-2.5 py-1 hover:bg-muted/50">View Contacts</button>
                          <button className="text-xs text-foreground border border-border rounded px-2.5 py-1 hover:bg-muted/50">Edit</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Contacts Tab ── */}
        {tab === "contacts" && (
          <div className="rounded-xl border border-border p-5">
            <h2 className="text-base font-bold text-foreground">Campaign Contacts</h2>
            <p className="text-sm text-muted-foreground mb-4">View and manage contacts for this campaign</p>

            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  placeholder="Search contacts by name, email, or phone..."
                  className="w-full pl-10 pr-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <select className="border border-border rounded-lg px-3 py-2.5 text-sm bg-background text-foreground">
                <option>All Steps</option>
              </select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {["CONTACT", "SIGNAL", "SCORE", "CAMPAIGN STATUS", "IMPORT DATE", "REVIEW"].map((h) => (
                      <th key={h} className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredContacts.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-12 text-sm text-muted-foreground">No contacts yet</td></tr>
                  ) : (
                    filteredContacts.map((c) => (
                      <tr key={c.id} className="border-b border-border/50 hover:bg-muted/20">
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${avatarColor(c.first_name + (c.last_name || ""))}`}>
                              {getInitials(c)}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                {c.linkedin_url ? (
                                  <a href={c.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-primary hover:underline">{c.first_name} {c.last_name || ""}</a>
                                ) : (
                                  <span className="text-sm font-semibold text-foreground">{c.first_name} {c.last_name || ""}</span>
                                )}
                                {c.linkedin_url && <LinkedInIcon />}
                              </div>
                              <p className="text-xs text-muted-foreground">{c.title}</p>
                              {c.company && (
                                <div className="flex items-center gap-1 mt-0.5">
                                  <span className={`w-1.5 h-1.5 rounded-full ${DOT_COLORS[c.company_icon_color || ""] || "bg-muted-foreground"}`} />
                                  <span className="text-xs text-muted-foreground">{c.company}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          {c.signal_post_url ? (
                            <a href={c.signal_post_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline underline-offset-2">{c.signal}</a>
                          ) : (
                            <span className="text-xs text-muted-foreground">{c.signal}</span>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex gap-0.5">
                            {[c.signal_a_hit, c.signal_b_hit, c.signal_c_hit].map((hit, i) => (
                              <Flame key={i} className={`w-4 h-4 ${hit ? "text-orange-500" : "text-muted-foreground/20"}`} fill={hit ? "currentColor" : "none"} />
                            ))}
                          </div>
                        </td>
                        <td className="px-3 py-3"><span className="text-xs text-muted-foreground">—</span></td>
                        <td className="px-3 py-3">
                          <span className="text-xs text-muted-foreground">
                            {new Date(c.imported_at).toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "2-digit" })},{" "}
                            {new Date(c.imported_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <button className="text-xs font-medium text-foreground border border-border rounded px-3 py-1 hover:bg-muted/50">Reject</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Insights Tab ── */}
        {tab === "insights" && (
          <div className="space-y-5">
            <div className="rounded-xl border border-border p-5">
              <h2 className="text-base font-bold text-foreground">Campaign Insights</h2>
              <p className="text-sm text-muted-foreground">Analytics and performance metrics for your campaign</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-border p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-foreground">Number of Invitations</h3>
                  <UserPlus className="w-5 h-5 text-primary" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between"><span className="text-sm text-foreground">Invitations Sent</span><span className="text-lg font-bold text-foreground">{campaign.invitations_sent}</span></div>
                  <div className="flex justify-between"><span className="text-sm text-foreground">Invitations Accepted</span><span className="text-lg font-bold text-green-600">{campaign.invitations_accepted}</span></div>
                  <div className="flex justify-between"><span className="text-sm text-foreground">Acceptance Rate</span><span className="text-lg font-bold text-foreground">{acceptanceRate}%</span></div>
                </div>
              </div>

              <div className="rounded-xl border border-border p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-foreground">Number of Messages</h3>
                  <MessageSquare className="w-5 h-5 text-primary" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between"><span className="text-sm text-foreground">Leads contacted</span><span className="text-lg font-bold text-foreground">{campaign.messages_sent}</span></div>
                  <div className="flex justify-between"><span className="text-sm text-foreground">Leads replies</span><span className="text-lg font-bold text-green-600">{campaign.messages_replied}</span></div>
                  <div className="flex justify-between"><span className="text-sm text-foreground">Reply Rate</span><span className="text-lg font-bold text-foreground">{replyRate}%</span></div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-foreground">Daily Campaign Activity</h3>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" /> Invitations</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-500" /> Messages</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="invitations" stroke="hsl(217 91% 60%)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="messages" stroke="hsl(25 95% 53%)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-xs text-muted-foreground text-center mt-2">Chart shows daily activity based on campaign step dates</p>
            </div>
          </div>
        )}

        {/* ── Settings Tab ── */}
        {tab === "settings" && (
          <div className="rounded-xl border border-border p-5 space-y-6">
            <div>
              <h2 className="text-base font-bold text-foreground">Campaign Settings</h2>
              <p className="text-sm text-muted-foreground">Configure campaign-specific settings and preferences</p>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-foreground">Connection Settings</h3>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={settingsExcludeFirst} onChange={(e) => setSettingsExcludeFirst(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-ring" />
                <div>
                  <p className="text-sm font-medium text-foreground">Automatically exclude first degree connections from your campaign</p>
                  <p className="text-xs text-muted-foreground">Contacts who are already in your 1st network on LinkedIn will be automatically excluded from your outreach campaign</p>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={settingsReviewMode} onChange={(e) => setSettingsReviewMode(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-ring" />
                <div>
                  <p className="text-sm font-medium text-foreground flex items-center gap-2">
                    Enable Review Mode
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">BETA</span>
                  </p>
                  <p className="text-xs text-muted-foreground">When enabled, you can manually approve or reject each contact before they are added to the campaign. If not enabled, the AI will automatically prioritize and send the best leads to outreach.</p>
                </div>
              </label>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-foreground">AI Generation Settings</h3>
                <p className="text-xs text-muted-foreground">These settings will only apply to newly generated messages, not to messages that have already been generated.</p>
              </div>

              <div>
                <p className="text-sm font-semibold text-foreground mb-2">Campaign Goal</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {CAMPAIGN_GOALS.map((g) => (
                    <button
                      key={g.value}
                      onClick={() => setSettingsGoal(g.value)}
                      className={`text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                        settingsGoal === g.value
                          ? "border-[hsl(var(--goji-coral))] bg-[hsl(var(--goji-coral))]/5"
                          : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${settingsGoal === g.value ? "border-[hsl(var(--goji-coral))]" : "border-muted-foreground/40"}`}>
                          {settingsGoal === g.value && <div className="w-2 h-2 rounded-full bg-[hsl(var(--goji-coral))]" />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{g.label}</p>
                          <p className="text-xs text-muted-foreground">{g.desc}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-foreground mb-2">Message Tone</p>
                <div className="grid grid-cols-3 gap-2">
                  {MESSAGE_TONES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setSettingsTone(t.value)}
                      className={`text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                        settingsTone === t.value
                          ? "border-[hsl(var(--goji-coral))] bg-[hsl(var(--goji-coral))]/5"
                          : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${settingsTone === t.value ? "border-[hsl(var(--goji-coral))]" : "border-muted-foreground/40"}`}>
                          {settingsTone === t.value && <div className="w-2 h-2 rounded-full bg-[hsl(var(--goji-coral))]" />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{t.label}</p>
                          <p className="text-xs text-muted-foreground">{t.desc}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={saveSettings}
                disabled={savingSettings}
                className="flex items-center gap-1.5 text-sm font-semibold text-white rounded-lg px-5 py-2.5 transition-colors"
                style={{ background: "hsl(var(--goji-coral))" }}
              >
                <Save className="w-4 h-4" />
                {savingSettings ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </div>
        )}

        {/* ── Scheduled Tab ── */}
        {tab === "scheduled" && (
          <div className="rounded-xl border border-border p-12 text-center">
            <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-semibold text-foreground">No scheduled messages</p>
            <p className="text-xs text-muted-foreground mt-1">Scheduled outreach messages will appear here once the campaign is active.</p>
          </div>
        )}

        {/* ── Last Launches Tab ── */}
        {tab === "launches" && (
          <div className="rounded-xl border border-border p-12 text-center">
            <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-semibold text-foreground">No launches yet</p>
            <p className="text-xs text-muted-foreground mt-1">Campaign launch history will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}

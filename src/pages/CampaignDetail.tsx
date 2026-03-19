import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import {
  ChevronLeft, Play, Pause, Pencil, Settings as SettingsIcon,
  Users, BarChart3, Clock, GitBranch, Search, Flame, AtSign,
  UserPlus, Send, MessageSquare, ArrowRight, ArrowDown, Save, Bot, Sparkles,
  AlertCircle, Plus, Shield, Eye, Target, Mic, Check, TrendingUp,
} from "lucide-react";
import { Contact, avatarColor, getInitials, timeAgo, DOT_COLORS } from "@/components/contacts/types";
import { LinkedInIcon } from "@/components/contacts/LinkedInIcon";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";

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
  { value: "conversations", label: "Start conversations with warm prospects", desc: "Build relationships and nurture leads" },
  { value: "demos", label: "Book qualified sales calls/demos", desc: "Direct approach to schedule meetings" },
];

const MESSAGE_TONES = [
  { value: "professional", label: "Professional", desc: "Formal, polished", icon: Shield },
  { value: "conversational", label: "Conversational", desc: "Friendly, casual", icon: Mic },
  { value: "direct", label: "Direct", desc: "Bold, confident", icon: Target },
];

const STEP_COLORS = [
  { bg: "hsl(270 70% 55%)", light: "hsl(270 70% 95%)" },
  { bg: "hsl(190 80% 45%)", light: "hsl(190 80% 95%)" },
  { bg: "hsl(25 90% 55%)", light: "hsl(25 90% 95%)" },
  { bg: "hsl(200 80% 50%)", light: "hsl(200 80% 95%)" },
];

const tabVariant = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

function MetricChip({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
      <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0" style={{ background: `${color}15` }}>
        <Icon className="w-3.5 h-3.5" style={{ color }} />
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-sm font-bold text-foreground">{value}</p>
      </div>
    </div>
  );
}

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<CampaignFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("workflow");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactSearch, setContactSearch] = useState("");
  const [contactFilter, setContactFilter] = useState<string>("all");
  const [agentName, setAgentName] = useState("My Agent");
  const [agentStatus, setAgentStatus] = useState("paused");
  const [contactsCount, setContactsCount] = useState(0);
  const [listsCount, setListsCount] = useState(0);
  const [showAgentRunning, setShowAgentRunning] = useState(false);
  const [editingStep, setEditingStep] = useState<number | null>(null);

  // Settings state
  const [settingsGoal, setSettingsGoal] = useState("");
  const [settingsTone, setSettingsTone] = useState("");
  const [settingsExcludeFirst, setSettingsExcludeFirst] = useState(true);
  const [settingsReviewMode, setSettingsReviewMode] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savedAnimation, setSavedAnimation] = useState(false);

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

    if (c.source_agent_id) {
      const { data: agent } = await supabase.from("signal_agents").select("name, status, results_count").eq("id", c.source_agent_id).single();
      if (agent) { setAgentName(agent.name); setAgentStatus(agent.status); }
    }

    if (c.source_agent_id) {
      const { data: agentData } = await supabase.from("signal_agents").select("leads_list_name").eq("id", c.source_agent_id).single();
      if (agentData?.leads_list_name) {
        const { data: contactData } = await supabase.from("contacts").select("*").eq("list_name", agentData.leads_list_name).order("imported_at", { ascending: false });
        if (contactData) { setContacts(contactData as Contact[]); setContactsCount(contactData.length); }
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

  async function saveSettings() {
    if (!campaign) return;
    setSavingSettings(true);
    const { error } = await supabase.from("campaigns").update({
      campaign_goal: settingsGoal,
      message_tone: settingsTone,
    } as any).eq("id", campaign.id);
    if (error) toast.error("Failed to save");
    else {
      setCampaign({ ...campaign, campaign_goal: settingsGoal, message_tone: settingsTone });
      setSavedAnimation(true);
      setTimeout(() => setSavedAnimation(false), 2000);
      toast.success("Settings saved!");
    }
    setSavingSettings(false);
  }

  const filteredContacts = useMemo(() => {
    let list = contacts;
    if (contactFilter !== "all") {
      list = list.filter(c => c.relevance_tier === contactFilter);
    }
    if (contactSearch.trim()) {
      const q = contactSearch.toLowerCase();
      list = list.filter(c =>
        c.first_name.toLowerCase().includes(q) || (c.last_name || "").toLowerCase().includes(q) ||
        (c.company || "").toLowerCase().includes(q) || (c.title || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [contacts, contactSearch, contactFilter]);

  const workflowSteps = campaign?.workflow_steps || [
    { type: "invitation", message: "", delay_days: 0 },
    { type: "message", message: "", delay_days: 1, ai_icebreaker: true },
    { type: "message", message: "", delay_days: 2 },
    { type: "message", message: "", delay_days: 3 },
  ];

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

  const tierCounts = {
    all: contacts.length,
    hot: contacts.filter(c => c.relevance_tier === "hot").length,
    warm: contacts.filter(c => c.relevance_tier === "warm").length,
    cold: contacts.filter(c => c.relevance_tier === "cold").length,
  };

  return (
    <div className="min-h-full bg-card rounded-2xl m-3 md:m-4 overflow-hidden">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="px-4 md:px-6 pt-5 pb-0"
      >
        <button onClick={() => navigate("/campaigns")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to campaigns
        </button>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-xl font-bold text-foreground flex items-center gap-3">
                {campaign.company_name || "My Campaign"}
                {/* Status pill */}
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full"
                  style={{
                    color: campaign.status === "active" ? "hsl(142 70% 35%)" : "hsl(0 70% 45%)",
                    background: campaign.status === "active" ? "hsl(142 70% 95%)" : "hsl(0 70% 95%)",
                  }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ background: campaign.status === "active" ? "hsl(142 70% 45%)" : "hsl(0 70% 50%)" }} />
                  {campaign.status === "active" ? "Active" : campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                </span>
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">Manage your campaign workflow and contacts</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Inline metrics */}
            <div className="hidden md:flex items-center gap-2">
              <MetricChip label="Leads" value={contactsCount} icon={Users} color="hsl(var(--foreground))" />
              <MetricChip label="Sent" value={campaign.invitations_sent} icon={Send} color="hsl(217 91% 60%)" />
              <MetricChip label="Reply" value={`${replyRate}%`} icon={MessageSquare} color="hsl(142 70% 45%)" />
            </div>
            <button
              onClick={toggleCampaignStatus}
              className={`btn-cta text-sm ${campaign.status === "active" ? "!bg-destructive" : ""}`}
            >
              {campaign.status === "active" ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> Start Campaign</>}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="px-4 md:px-6 mt-4">
        <div className="relative flex items-center gap-1 border border-border rounded-xl p-1 bg-muted/30 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap z-10 ${
                tab === t.key
                  ? "text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === t.key && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-background border border-border rounded-lg"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <t.icon className="w-3.5 h-3.5" />
                {t.label}
                {t.key === "contacts" && contactsCount > 0 && (
                  <span className="text-[10px] font-bold bg-muted rounded-full px-1.5 py-0.5 text-muted-foreground">{contactsCount}</span>
                )}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 md:px-6 py-5">
        <AnimatePresence mode="wait">
          {/* ── Workflow Tab ── */}
          {tab === "workflow" && (
            <motion.div key="workflow" variants={tabVariant} initial="hidden" animate="visible" exit="exit" className="space-y-5">
              <div className="rounded-xl border border-border p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold text-foreground">Campaign Workflow</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Design and manage your campaign automation steps</p>
                  </div>
                  <button className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                    Edit <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Sender */}
                <div className="rounded-xl border border-border p-3.5 flex items-center justify-between mb-6 bg-muted/20">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground font-medium">Sender:</span>
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm">👤</div>
                    <span className="text-sm font-bold text-foreground">Alexandru Barciog</span>
                    <span className="text-xs font-bold text-green-600 bg-green-50 px-2.5 py-0.5 rounded-full">Connected</span>
                    <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full">🔥 14/day</span>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">✉️ 20/day</span>
                  </div>
                  <button className="text-muted-foreground hover:text-foreground"><SettingsIcon className="w-4 h-4" /></button>
                </div>

                {/* Workflow canvas */}
                <div className="flex items-start gap-0 overflow-x-auto pb-4">
                  {/* Input Source */}
                  <div className="min-w-[220px] shrink-0">
                    <div className="rounded-xl bg-foreground text-background p-4 shadow-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Bot className="w-4 h-4" />
                        <span className="text-sm font-bold">Input source</span>
                      </div>
                      <p className="text-xs opacity-70">1 agent(s)</p>
                    </div>
                    <div className="mt-2 rounded-xl border border-border bg-card p-3.5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-foreground">{agentName}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${agentStatus === "active" ? "text-green-600 bg-green-50" : "text-muted-foreground bg-muted"}`}>
                          {agentStatus === "active" ? "Running" : "Paused"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{listsCount} list(s) • {contactsCount} contact(s)</p>
                    </div>

                    {showAgentRunning && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3 rounded-xl border border-border bg-card p-4 shadow-lg relative"
                      >
                        <button onClick={() => setShowAgentRunning(false)} className="absolute top-2 right-2 text-muted-foreground hover:text-foreground text-lg">×</button>
                        <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-amber-500" /> Your agent is running…
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Your agent is searching for leads. Check your <button onClick={() => navigate("/contacts")} className="text-primary underline">leads</button> in a few minutes.
                        </p>
                      </motion.div>
                    )}
                  </div>

                  {/* Connector from source */}
                  <div className="flex items-center self-center mt-8 px-1">
                    <div className="w-8 border-t-2 border-dashed border-primary/30" />
                    <ArrowRight className="w-4 h-4 text-primary/50 -ml-1" />
                  </div>

                  {/* Workflow Steps */}
                  {workflowSteps.map((ws: any, i: number) => {
                    const isInvitation = ws.type === "invitation";
                    const colors = STEP_COLORS[i % STEP_COLORS.length];
                    const isEditing = editingStep === i;

                    return (
                      <div key={i} className="flex items-start">
                        {i > 0 && (
                          <div className="flex flex-col items-center self-center mt-8 px-1">
                            <div className="w-6 border-t-2 border-dashed border-muted-foreground/30" />
                            <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full mt-1 whitespace-nowrap">+ {ws.delay_days}d</span>
                          </div>
                        )}
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.1 }}
                          className="min-w-[200px] shrink-0"
                        >
                          <div className="rounded-xl text-white p-4 shadow-md" style={{ background: colors.bg }}>
                            <div className="flex items-center gap-2 mb-1">
                              {isInvitation ? <UserPlus className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                              <span className="text-sm font-bold">{isInvitation ? "Send Invitation" : "Send Message"}</span>
                            </div>
                            <p className="text-xs opacity-80">Step {i + 1}</p>
                          </div>
                          <div className="mt-2 rounded-xl border border-border bg-card p-3.5 shadow-sm">
                            {isEditing ? (
                              <div className="space-y-2">
                                <textarea
                                  defaultValue={ws.message || ""}
                                  className="w-full text-xs border border-border rounded-lg p-2 bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                                  rows={3}
                                  placeholder="Type your message..."
                                />
                                <div className="flex gap-1.5">
                                  <button onClick={() => setEditingStep(null)} className="text-xs font-bold text-white bg-primary rounded px-3 py-1">Save</button>
                                  <button onClick={() => setEditingStep(null)} className="text-xs font-medium text-muted-foreground border border-border rounded px-3 py-1">Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <>
                                {isInvitation ? (
                                  <p className="text-xs text-muted-foreground">Invitation without message</p>
                                ) : ws.ai_icebreaker ? (
                                  <div className="flex items-center gap-1.5 text-xs">
                                    <Sparkles className="w-3 h-3 text-[hsl(var(--goji-coral))]" />
                                    <span className="text-foreground font-bold">AI Icebreaker</span>
                                  </div>
                                ) : (
                                  <div>
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">MESSAGE:</p>
                                    <p className="text-xs text-foreground">{ws.message || "No message configured..."}</p>
                                  </div>
                                )}
                                <div className="flex items-center gap-2 mt-2.5 text-xs text-muted-foreground">
                                  <span>0 contact(s)</span>
                                  <span className="text-green-600 font-medium">0 {isInvitation ? "accepted" : "answer(s)"}</span>
                                </div>
                                <div className="flex gap-2 mt-2.5">
                                  <button className="text-xs font-medium text-foreground border border-border rounded-lg px-2.5 py-1 hover:bg-muted/50 transition-colors">View</button>
                                  <button onClick={() => setEditingStep(i)} className="text-xs font-medium text-foreground border border-border rounded-lg px-2.5 py-1 hover:bg-muted/50 transition-colors">Edit</button>
                                </div>
                              </>
                            )}
                          </div>
                        </motion.div>
                      </div>
                    );
                  })}

                  {/* Add Step */}
                  <div className="flex items-center self-center mt-8 px-2">
                    <div className="w-4 border-t-2 border-dashed border-muted-foreground/20" />
                    <button className="w-9 h-9 rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Contacts Tab ── */}
          {tab === "contacts" && (
            <motion.div key="contacts" variants={tabVariant} initial="hidden" animate="visible" exit="exit">
              <div className="rounded-xl border border-border p-5">
                <h2 className="text-base font-bold text-foreground">Campaign Contacts</h2>
                <p className="text-sm text-muted-foreground mb-4">View and manage contacts for this campaign</p>

                {/* Tier filter tabs */}
                <div className="flex items-center gap-1 mb-4 bg-muted/30 rounded-lg p-1 w-fit">
                  {[
                    { key: "all", label: "All", color: "text-foreground" },
                    { key: "hot", label: "🔥 Hot", color: "text-red-600" },
                    { key: "warm", label: "🟡 Warm", color: "text-amber-600" },
                    { key: "cold", label: "🔵 Cold", color: "text-blue-600" },
                  ].map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setContactFilter(f.key)}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                        contactFilter === f.key
                          ? `bg-background shadow-sm border border-border ${f.color}`
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {f.label} ({tierCounts[f.key as keyof typeof tierCounts]})
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      value={contactSearch}
                      onChange={(e) => setContactSearch(e.target.value)}
                      placeholder="Search contacts..."
                      className="w-full pl-10 pr-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        {["CONTACT", "SIGNAL", "SCORE", "STATUS", "IMPORTED", "REVIEW"].map((h) => (
                          <th key={h} className="text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-3 py-3">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredContacts.length === 0 ? (
                        <tr><td colSpan={6} className="text-center py-12 text-sm text-muted-foreground">No contacts yet</td></tr>
                      ) : (
                        filteredContacts.map((c) => {
                          const tierColor = c.relevance_tier === "hot" ? "bg-red-500" : c.relevance_tier === "warm" ? "bg-amber-500" : "bg-blue-500";
                          return (
                            <tr key={c.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="relative">
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${avatarColor(c.first_name + (c.last_name || ""))}`}>
                                      {getInitials(c)}
                                    </div>
                                    <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${tierColor}`} />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      {c.linkedin_url ? (
                                        <a href={c.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-primary hover:underline">{c.first_name} {c.last_name || ""}</a>
                                      ) : (
                                        <span className="text-sm font-bold text-foreground">{c.first_name} {c.last_name || ""}</span>
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
                                  {new Date(c.imported_at).toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "2-digit" })}
                                </span>
                              </td>
                              <td className="px-3 py-3">
                                <button className="text-xs font-medium text-red-600 border border-red-200 bg-red-50 rounded-lg px-3 py-1 hover:bg-red-100 transition-colors">Reject</button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Insights Tab ── */}
          {tab === "insights" && (
            <motion.div key="insights" variants={tabVariant} initial="hidden" animate="visible" exit="exit" className="space-y-5">
              <div className="rounded-xl border border-border p-5">
                <h2 className="text-base font-bold text-foreground">Campaign Insights</h2>
                <p className="text-sm text-muted-foreground">Analytics and performance metrics</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Invitations card */}
                <div className="rounded-xl border border-border p-5 bg-gradient-to-br from-card to-muted/20">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-sm font-bold text-foreground">Invitations</h3>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "hsl(217 91% 95%)" }}>
                      <UserPlus className="w-4 h-4" style={{ color: "hsl(217 91% 60%)" }} />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-3xl font-black text-foreground">{campaign.invitations_sent}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Total sent</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-xl font-bold text-green-600">{campaign.invitations_accepted}</p>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase">Accepted</p>
                      </div>
                      <div className="h-8 w-px bg-border" />
                      <div>
                        <div className="flex items-center gap-1">
                          <p className="text-xl font-bold text-foreground">{acceptanceRate}%</p>
                          <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                        </div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase">Accept Rate</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Messages card */}
                <div className="rounded-xl border border-border p-5 bg-gradient-to-br from-card to-muted/20">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-sm font-bold text-foreground">Messages</h3>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "hsl(142 70% 95%)" }}>
                      <MessageSquare className="w-4 h-4" style={{ color: "hsl(142 70% 45%)" }} />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-3xl font-black text-foreground">{campaign.messages_sent}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Leads contacted</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-xl font-bold text-green-600">{campaign.messages_replied}</p>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase">Replied</p>
                      </div>
                      <div className="h-8 w-px bg-border" />
                      <div>
                        <div className="flex items-center gap-1">
                          <p className="text-xl font-bold text-foreground">{replyRate}%</p>
                          <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                        </div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase">Reply Rate</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chart with area fill */}
              <div className="rounded-xl border border-border p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-foreground">Daily Activity</h3>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1.5 font-medium"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: "hsl(217 91% 60%)" }} /> Invitations</span>
                    <span className="flex items-center gap-1.5 font-medium"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: "hsl(25 95% 53%)" }} /> Messages</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(217 91% 60%)" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="hsl(217 91% 60%)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="orangeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(25 95% 53%)" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="hsl(25 95% 53%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ borderRadius: "0.75rem", border: "1px solid hsl(var(--border))", fontSize: "12px" }} />
                    <Area type="monotone" dataKey="invitations" stroke="hsl(217 91% 60%)" strokeWidth={2} fill="url(#blueGrad)" />
                    <Area type="monotone" dataKey="messages" stroke="hsl(25 95% 53%)" strokeWidth={2} fill="url(#orangeGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {/* ── Settings Tab ── */}
          {tab === "settings" && (
            <motion.div key="settings" variants={tabVariant} initial="hidden" animate="visible" exit="exit" className="space-y-5">
              {/* Connection Settings */}
              <Collapsible defaultOpen>
                <div className="rounded-xl border border-border overflow-hidden">
                  <CollapsibleTrigger className="w-full px-5 py-4 flex items-center justify-between hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                        <Shield className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-sm font-bold text-foreground">Connection Settings</h3>
                        <p className="text-xs text-muted-foreground">Manage how contacts enter your campaign</p>
                      </div>
                    </div>
                    <ChevronLeft className="w-4 h-4 text-muted-foreground transition-transform -rotate-90" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-5 pb-5 space-y-4">
                      <div className="flex items-center justify-between gap-4 rounded-xl bg-muted/20 p-4">
                        <div>
                          <p className="text-sm font-bold text-foreground">Exclude 1st degree connections</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Contacts already in your LinkedIn network will be excluded</p>
                        </div>
                        <Switch checked={settingsExcludeFirst} onCheckedChange={setSettingsExcludeFirst} />
                      </div>
                      <div className="flex items-center justify-between gap-4 rounded-xl bg-muted/20 p-4">
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="text-sm font-bold text-foreground flex items-center gap-2">
                              Review Mode
                              <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">BETA</span>
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">Manually approve contacts before they enter the campaign</p>
                          </div>
                        </div>
                        <Switch checked={settingsReviewMode} onCheckedChange={setSettingsReviewMode} />
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>

              {/* AI Settings */}
              <Collapsible defaultOpen>
                <div className="rounded-xl border border-border overflow-hidden">
                  <CollapsibleTrigger className="w-full px-5 py-4 flex items-center justify-between hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-sm font-bold text-foreground">AI Generation Settings</h3>
                        <p className="text-xs text-muted-foreground">Applied only to newly generated messages</p>
                      </div>
                    </div>
                    <ChevronLeft className="w-4 h-4 text-muted-foreground transition-transform -rotate-90" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-5 pb-5 space-y-5">
                      <div>
                        <p className="text-sm font-bold text-foreground mb-2.5">Campaign Goal</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {CAMPAIGN_GOALS.map((g) => (
                            <button
                              key={g.value}
                              onClick={() => setSettingsGoal(g.value)}
                              className={`text-left px-4 py-3.5 rounded-xl border-2 transition-all hover:scale-[1.01] ${
                                settingsGoal === g.value
                                  ? "border-[hsl(var(--goji-coral))] bg-[hsl(var(--goji-coral))]/5 shadow-sm"
                                  : "border-border hover:bg-muted/50"
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${settingsGoal === g.value ? "border-[hsl(var(--goji-coral))]" : "border-muted-foreground/40"}`}>
                                  {settingsGoal === g.value && <div className="w-2 h-2 rounded-full bg-[hsl(var(--goji-coral))]" />}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-foreground">{g.label}</p>
                                  <p className="text-xs text-muted-foreground">{g.desc}</p>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-bold text-foreground mb-2.5">Message Tone</p>
                        <div className="grid grid-cols-3 gap-2">
                          {MESSAGE_TONES.map((t) => (
                            <button
                              key={t.value}
                              onClick={() => setSettingsTone(t.value)}
                              className={`text-left px-4 py-3.5 rounded-xl border-2 transition-all hover:scale-[1.01] ${
                                settingsTone === t.value
                                  ? "border-[hsl(var(--goji-coral))] bg-[hsl(var(--goji-coral))]/5 shadow-sm"
                                  : "border-border hover:bg-muted/50"
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${settingsTone === t.value ? "border-[hsl(var(--goji-coral))]" : "border-muted-foreground/40"}`}>
                                  {settingsTone === t.value && <div className="w-2 h-2 rounded-full bg-[hsl(var(--goji-coral))]" />}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-foreground">{t.label}</p>
                                  <p className="text-xs text-muted-foreground">{t.desc}</p>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>

              {/* Save button */}
              <div className="flex justify-end">
                <button
                  onClick={saveSettings}
                  disabled={savingSettings}
                  className={`btn-cta text-sm disabled:opacity-50 ${savedAnimation ? "!bg-[hsl(142,70%,45%)]" : ""}`}
                >
                  {savedAnimation ? (
                    <><Check className="w-4 h-4" /> Saved!</>
                  ) : (
                    <><Save className="w-4 h-4" /> {savingSettings ? "Saving..." : "Save Settings"}</>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Scheduled Tab ── */}
          {tab === "scheduled" && (
            <motion.div key="scheduled" variants={tabVariant} initial="hidden" animate="visible" exit="exit">
              <div className="rounded-xl border border-border p-12 text-center">
                <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-bold text-foreground">No scheduled messages</p>
                <p className="text-xs text-muted-foreground mt-1">Scheduled outreach messages will appear here once the campaign is active.</p>
              </div>
            </motion.div>
          )}

          {/* ── Last Launches Tab ── */}
          {tab === "launches" && (
            <motion.div key="launches" variants={tabVariant} initial="hidden" animate="visible" exit="exit">
              <div className="rounded-xl border border-border p-12 text-center">
                <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-bold text-foreground">No launches yet</p>
                <p className="text-xs text-muted-foreground mt-1">Campaign launch history will appear here.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

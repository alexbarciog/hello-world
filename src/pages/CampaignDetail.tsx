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
  AlertCircle, Plus, Shield, Eye, Target, Mic, Check, TrendingUp, X, User,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
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
  daily_connect_limit: number;
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
  const [availableLists, setAvailableLists] = useState<{ id: string; name: string; contact_count: number }[]>([]);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [assigningList, setAssigningList] = useState(false);
  const [showAgentRunning, setShowAgentRunning] = useState(false);
  const [editingStep, setEditingStep] = useState<number | null>(null);
  const [step1Sent, setStep1Sent] = useState(0);
  const [step1Accepted, setStep1Accepted] = useState(0);
  const [settingsDailyLimit, setSettingsDailyLimit] = useState(25);

  // Add step dialog state
  const [addStepOpen, setAddStepOpen] = useState(false);
  const [addStepPhase, setAddStepPhase] = useState<"choose" | "edit">("choose");
  const [newStepType, setNewStepType] = useState<"message" | "visit_profile">("message");
  const [newStepMessage, setNewStepMessage] = useState("");
  const [newStepDelay, setNewStepDelay] = useState(1);
  const [newStepMessageMode, setNewStepMessageMode] = useState<"manual" | "ai">("manual");

  
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
    setSettingsDailyLimit((c as any).daily_connect_limit || 25);

    if (c.source_agent_id) {
      const { data: agent } = await supabase.from("signal_agents").select("name, status, results_count").eq("id", c.source_agent_id).single();
      if (agent) { setAgentName(agent.name); setAgentStatus(agent.status); }
    }

    // Load contacts from source_list_id if set
    if (c.source_list_id) {
      setSelectedListId(c.source_list_id);
      setListsCount(1);
      await loadContactsForList(c.source_list_id);
    } else if (c.source_agent_id) {
      const { data: agentData } = await supabase.from("signal_agents").select("leads_list_name").eq("id", c.source_agent_id).single();
      if (agentData?.leads_list_name) {
        const { data: contactData } = await supabase.from("contacts").select("*").eq("list_name", agentData.leads_list_name).order("imported_at", { ascending: false });
        if (contactData) { setContacts(contactData as Contact[]); setContactsCount(contactData.length); }
        const { count } = await (supabase.from("lists") as any).select("id", { count: "exact", head: true }).eq("name", agentData.leads_list_name);
        setListsCount(count || 1);
      }
    }

    // Load all available lists for the user
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: lists } = await supabase.from("lists").select("id, name").eq("user_id", user.id).order("created_at", { ascending: false });
      if (lists) {
        const listsWithCounts = await Promise.all(
          lists.map(async (l) => {
            const { count } = await supabase.from("contact_lists").select("id", { count: "exact", head: true }).eq("list_id", l.id);
            return { id: l.id, name: l.name, contact_count: count || 0 };
          })
        );
        setAvailableLists(listsWithCounts);
      }
    }

    // Load step 1 connection request counters
    const { count: sentCount } = await supabase
      .from("campaign_connection_requests" as any)
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", campaignId)
      .in("status", ["sent", "accepted"]);
    setStep1Sent(sentCount || 0);

    const { count: acceptedCount } = await supabase
      .from("campaign_connection_requests" as any)
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", campaignId)
      .eq("status", "accepted");
    setStep1Accepted(acceptedCount || 0);

    setLoading(false);
  }

  async function loadContactsForList(listId: string) {
    const { data: contactLinks } = await supabase.from("contact_lists").select("contact_id").eq("list_id", listId);
    if (contactLinks && contactLinks.length > 0) {
      const contactIds = contactLinks.map(cl => cl.contact_id);
      const { data: contactData } = await supabase.from("contacts").select("*").in("id", contactIds).order("imported_at", { ascending: false });
      if (contactData) { setContacts(contactData as Contact[]); setContactsCount(contactData.length); }
    } else {
      // Fallback: try by list name
      const { data: listData } = await supabase.from("lists").select("name").eq("id", listId).single();
      if (listData?.name) {
        const { data: contactData } = await supabase.from("contacts").select("*").eq("list_name", listData.name).order("imported_at", { ascending: false });
        if (contactData) { setContacts(contactData as Contact[]); setContactsCount(contactData.length); }
      } else {
        setContacts([]); setContactsCount(0);
      }
    }
  }

  async function assignListToCampaign(listId: string) {
    if (!campaign) return;
    setAssigningList(true);
    const { error } = await supabase.from("campaigns").update({ source_list_id: listId } as any).eq("id", campaign.id);
    if (error) { toast.error("Failed to assign list"); setAssigningList(false); return; }
    setSelectedListId(listId);
    setListsCount(1);
    setCampaign({ ...campaign, source_list_id: listId });
    await loadContactsForList(listId);
    setAssigningList(false);
    toast.success("List assigned! Contacts will go through the campaign workflow.");
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
  function openAddStep() {
    setNewStepType("message");
    setNewStepMessage("");
    setNewStepDelay(1);
    setNewStepMessageMode("manual");
    setAddStepPhase("choose");
    setAddStepOpen(true);
  }

  function insertVariable(v: string) {
    setNewStepMessage(prev => prev + `{{${v}}}`);
  }

  async function saveNewStep() {
    if (!campaign) return;
    const newStep: any = {
      type: newStepType === "visit_profile" ? "visit_profile" : "message",
      message: newStepMessageMode === "ai" ? "" : newStepMessage,
      delay_days: newStepDelay,
      ...(newStepMessageMode === "ai" ? { ai_icebreaker: true } : {}),
    };
    const updated = [...workflowSteps, newStep];
    const { error } = await supabase.from("campaigns").update({ workflow_steps: updated as any } as any).eq("id", campaign.id);
    if (error) { toast.error("Failed to add step"); return; }
    setCampaign({ ...campaign, workflow_steps: updated });
    setAddStepOpen(false);
    toast.success("Step added!");
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
                  <button onClick={() => navigate("/settings?tab=linkedin")} className="text-muted-foreground hover:text-foreground"><SettingsIcon className="w-4 h-4" /></button>
                </div>

                {/* Workflow Canvas */}
                <div
                  className="relative rounded-xl border border-border overflow-x-auto p-6"
                  style={{
                    backgroundImage: "radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)",
                    backgroundSize: "20px 20px",
                  }}
                >
                  {/* Input Source - top left */}
                  <div className="flex flex-col items-start mb-0">
                    <div className="min-w-[240px]">
                      <div className="rounded-xl overflow-hidden shadow-lg">
                        <div className="bg-gradient-to-r from-muted-foreground/80 to-muted-foreground/60 text-background p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <Bot className="w-4 h-4" />
                            <span className="text-sm font-bold">Input source</span>
                          </div>
                          <p className="text-xs opacity-70">1 agent(s)</p>
                        </div>
                        <div className="bg-card border-t border-border p-3.5">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-foreground">{agentName}</span>
                            <span className="flex items-center gap-1.5">
                              <span className={`text-xs font-bold ${(campaign?.source_agent_id ? agentStatus : campaign?.status) === "active" ? "text-green-600" : "text-muted-foreground"}`}>
                                {(campaign?.source_agent_id ? agentStatus : campaign?.status) === "active" ? "Running" : "Paused"}
                              </span>
                              <span className={`w-2 h-2 rounded-full ${(campaign?.source_agent_id ? agentStatus : campaign?.status) === "active" ? "bg-green-500" : "bg-muted-foreground/40"}`} />
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2 bg-muted/50 rounded-full px-2.5 py-0.5 w-fit">{listsCount} list(s) • {contactsCount} contact(s)</p>
                        </div>
                      </div>
                    </div>

                    {/* Vertical connector arrow */}
                    <div className="flex flex-col items-center ml-[120px] -my-1">
                      <svg width="2" height="32" className="text-primary">
                        <line x1="1" y1="0" x2="1" y2="32" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" />
                      </svg>
                      <ArrowDown className="w-5 h-5 text-primary -mt-1" />
                    </div>
                  </div>

                  {/* Workflow Steps - horizontal row */}
                  <div className="flex items-start gap-0 mt-0">
                    {/* Fixed Step 1: Send Connect Request (cannot be deleted) */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="min-w-[220px] max-w-[240px] shrink-0"
                    >
                      <div className="rounded-xl text-white p-4 shadow-md" style={{ background: "linear-gradient(135deg, hsl(270 70% 55%), hsl(300 60% 55%))" }}>
                        <div className="flex items-center gap-2 mb-1">
                          <UserPlus className="w-4 h-4" />
                          <span className="text-sm font-bold">Send Invitation</span>
                        </div>
                        <p className="text-xs opacity-80">Step 1</p>
                      </div>
                      <div className="mt-2 rounded-xl border border-border bg-card p-3.5 shadow-sm">
                        <p className="text-xs text-muted-foreground italic">Invitation without message</p>
                        <div className="flex items-center gap-3 mt-3 text-xs">
                          <span className="font-medium text-muted-foreground border border-border rounded-full px-2 py-0.5">{step1Sent} contact(s)</span>
                          <span className="font-medium text-green-600 border border-green-200 rounded-full px-2 py-0.5">{step1Accepted} accepted</span>
                        </div>
                        <div className="flex gap-2 mt-3 pt-2 border-t border-border">
                          <button className="text-xs font-medium text-foreground border border-border rounded-lg px-3 py-1.5 hover:bg-muted/50 transition-colors flex-1">View Contacts</button>
                          <button className="text-xs font-medium text-foreground border border-border rounded-lg px-3 py-1.5 hover:bg-muted/50 transition-colors flex-1">Edit</button>
                        </div>
                      </div>
                    </motion.div>

                    {/* Dynamic message steps (skip the first invitation step from data) */}
                    {workflowSteps.filter((ws: any) => ws.type !== "invitation").map((ws: any, i: number) => {
                      const isEditing = editingStep === i;
                      const stepNum = i + 2; // Step 1 is always the invitation

                      return (
                        <div key={i} className="flex items-start">
                          {/* Connector + delay badge */}
                          <div className="flex flex-col items-center self-start pt-10 px-1 min-w-[80px]">
                            <span className="text-[10px] font-bold text-muted-foreground border border-border bg-card px-2.5 py-0.5 rounded-full mb-2 whitespace-nowrap shadow-sm">
                              + {ws.delay_days} days
                            </span>
                            <svg width="60" height="2" className="text-primary">
                              <line x1="0" y1="1" x2="60" y2="1" stroke="currentColor" strokeWidth="2" strokeDasharray="6 4" />
                            </svg>
                            <ArrowRight className="w-4 h-4 text-primary -mt-[11px] ml-[52px]" />
                          </div>

                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.08 }}
                            className="min-w-[220px] max-w-[240px] shrink-0"
                          >
                            <div className="rounded-xl text-white p-4 shadow-md" style={{ background: "linear-gradient(135deg, hsl(190 80% 45%), hsl(210 80% 50%))" }}>
                              <div className="flex items-center gap-2 mb-1">
                                <Send className="w-4 h-4" />
                                <span className="text-sm font-bold">Send Message</span>
                              </div>
                              <p className="text-xs opacity-80">Step {stepNum}</p>
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
                                  {ws.ai_icebreaker ? (
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-1.5 text-xs">
                                        <Sparkles className="w-3.5 h-3.5 text-red-500" />
                                        <span className="text-foreground font-bold">AI Icebreaker</span>
                                      </div>
                                      <AlertCircle className="w-3.5 h-3.5 text-muted-foreground/50" />
                                    </div>
                                  ) : ws.message ? (
                                    <div>
                                      <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5 tracking-wider">MESSAGE:</p>
                                      <p className="text-xs text-foreground leading-relaxed line-clamp-3">{ws.message}</p>
                                    </div>
                                  ) : (
                                    <p className="text-xs text-muted-foreground italic">No message configured...</p>
                                  )}

                                  <div className="flex items-center gap-3 mt-3 text-xs">
                                    <span className="font-medium text-muted-foreground border border-border rounded-full px-2 py-0.5">0 contact(s)</span>
                                    <span className="font-medium text-green-600 border border-green-200 rounded-full px-2 py-0.5">0 answer(s)</span>
                                  </div>

                                  <div className="flex gap-2 mt-3 pt-2 border-t border-border">
                                    <button className="text-xs font-medium text-foreground border border-border rounded-lg px-3 py-1.5 hover:bg-muted/50 transition-colors flex-1">View Contacts</button>
                                    <button onClick={() => setEditingStep(i)} className="text-xs font-medium text-foreground border border-border rounded-lg px-3 py-1.5 hover:bg-muted/50 transition-colors flex-1">Edit</button>
                                  </div>
                                </>
                              )}
                            </div>
                          </motion.div>
                        </div>
                      );
                    })}

                    {/* Add Step */}
                    <div className="flex flex-col items-center self-start pt-10 px-2">
                      <div className="w-6 border-t-2 border-dashed border-muted-foreground/20" />
                      <button
                        onClick={openAddStep}
                        className="w-9 h-9 rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors mt-2"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Add Step Dialog */}
              <Dialog open={addStepOpen} onOpenChange={setAddStepOpen}>
                <DialogContent className="sm:max-w-[560px] p-0 gap-0">
                  <AnimatePresence mode="wait">
                    {addStepPhase === "choose" ? (
                      <motion.div key="choose" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6">
                        <DialogHeader className="mb-5">
                          <DialogTitle className="text-lg font-bold">Choose step</DialogTitle>
                          <p className="text-sm text-muted-foreground">Select the type of step to add</p>
                        </DialogHeader>
                        <div className="space-y-3">
                          {[
                            { type: "message" as const, icon: Send, label: "Send Message", desc: "Send messages, PDF and GIFs to connected leads", color: "hsl(210 80% 50%)" },
                            { type: "message" as const, icon: Mic, label: "Send Voice Message", desc: "Record and send a voice message to connected leads", color: "hsl(142 70% 45%)", badge: "Coming soon" },
                            { type: "visit_profile" as const, icon: User, label: "Visit Profile", desc: "Visit the LinkedIn profile of your leads", color: "hsl(0 60% 50%)" },
                          ].map((opt) => (
                            <button
                              key={opt.label}
                              disabled={!!opt.badge}
                              onClick={() => { setNewStepType(opt.type); setAddStepPhase("edit"); }}
                              className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/30 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed group"
                            >
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${opt.color}15` }}>
                                <opt.icon className="w-5 h-5" style={{ color: opt.color }} />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-bold text-foreground flex items-center gap-2">
                                  {opt.label}
                                  {opt.badge && <span className="text-[10px] font-medium text-muted-foreground bg-muted rounded-full px-2 py-0.5">{opt.badge}</span>}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6">
                        <DialogHeader className="mb-5">
                          <DialogTitle className="text-lg font-bold">Edit Campaign Step</DialogTitle>
                        </DialogHeader>

                        {/* Message mode toggle */}
                        <div className="grid grid-cols-2 gap-3 mb-5">
                          <button
                            onClick={() => setNewStepMessageMode("manual")}
                            className={`p-3.5 rounded-xl border-2 text-left transition-all ${newStepMessageMode === "manual" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/40"}`}
                          >
                            <p className="text-sm font-bold text-foreground">Same message for everyone</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Use variables to craft your message</p>
                          </button>
                          <button
                            onClick={() => setNewStepMessageMode("ai")}
                            className={`p-3.5 rounded-xl border-2 text-left transition-all relative ${newStepMessageMode === "ai" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/40"}`}
                          >
                            <p className="text-sm font-bold text-foreground flex items-center gap-1.5">AI Follow-up <Sparkles className="w-3.5 h-3.5 text-amber-500" /></p>
                            <p className="text-xs text-muted-foreground mt-0.5">Personalized follow-up, generated by AI for each lead</p>
                          </button>
                        </div>

                        {/* Message content */}
                        {newStepMessageMode === "manual" && (
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-bold text-foreground">Message Content</label>
                              <button className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                                <Sparkles className="w-3 h-3" /> Generate with AI
                              </button>
                            </div>
                            <textarea
                              value={newStepMessage}
                              onChange={(e) => setNewStepMessage(e.target.value)}
                              className="w-full min-h-[140px] text-sm border border-border rounded-xl p-3 bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                              placeholder="Type your message..."
                              maxLength={1900}
                            />
                            <div className="flex items-center justify-between mt-2 px-1">
                              <div className="flex items-center gap-1.5 bg-muted/50 rounded-lg px-3 py-1.5">
                                <span className="text-xs text-muted-foreground">Insert:</span>
                                {["FirstName", "LastName", "Company"].map((v) => (
                                  <button
                                    key={v}
                                    onClick={() => insertVariable(v)}
                                    className="text-xs font-medium text-primary bg-primary/10 rounded px-2 py-0.5 hover:bg-primary/20 transition-colors"
                                  >
                                    {v}
                                  </button>
                                ))}
                              </div>
                              <span className="text-xs text-muted-foreground">{newStepMessage.length}/1900</span>
                            </div>
                          </div>
                        )}

                        {newStepMessageMode === "ai" && (
                          <div className="mb-4 rounded-xl border border-border bg-muted/20 p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Sparkles className="w-4 h-4 text-amber-500" />
                              <span className="text-sm font-bold text-foreground">AI-Personalized Message</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Each lead will receive a unique, personalized message generated by AI based on their profile, company, and signal data.</p>
                          </div>
                        )}

                        {/* Delay */}
                        <div className="flex items-center gap-3 mb-6 pt-3 border-t border-border">
                          <span className="text-sm text-foreground font-medium">Wait</span>
                          <input
                            type="number"
                            value={newStepDelay}
                            onChange={(e) => setNewStepDelay(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-16 text-sm text-center border border-border rounded-lg px-2 py-1.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            min={1}
                          />
                          <span className="text-sm text-muted-foreground">days after previous step</span>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-2 pt-3 border-t border-border">
                          <button
                            onClick={() => setAddStepPhase("choose")}
                            className="text-sm font-medium text-foreground border border-border rounded-lg px-4 py-2 hover:bg-muted/50 transition-colors"
                          >
                            Back
                          </button>
                          <button
                            onClick={saveNewStep}
                            className="text-sm font-bold text-white bg-primary rounded-lg px-5 py-2 hover:bg-primary/90 transition-colors"
                          >
                            Save Step
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </DialogContent>
              </Dialog>
            </motion.div>
          )}

          {/* ── Contacts Tab ── */}
          {tab === "contacts" && (
            <motion.div key="contacts" variants={tabVariant} initial="hidden" animate="visible" exit="exit">
              <div className="rounded-xl border border-border p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold text-foreground">Campaign Contacts</h2>
                    <p className="text-sm text-muted-foreground">Select a list to enroll contacts into this campaign's workflow</p>
                  </div>
                </div>

                {/* List selector */}
                <div className="mb-5 rounded-xl border border-border bg-muted/10 p-4">
                  <label className="text-sm font-bold text-foreground mb-2 block">Select a contact list</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {availableLists.length === 0 ? (
                      <p className="text-xs text-muted-foreground col-span-full">No lists available. Create a list from the Contacts page or run a Signal Agent first.</p>
                    ) : (
                      availableLists.map((list) => {
                        const isSelected = selectedListId === list.id;
                        return (
                          <button
                            key={list.id}
                            disabled={assigningList}
                            onClick={() => !isSelected && assignListToCampaign(list.id)}
                            className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all text-left ${
                              isSelected
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/40 hover:bg-muted/30"
                            } ${assigningList ? "opacity-50 cursor-wait" : ""}`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                                <Users className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-foreground">{list.name}</p>
                                <p className="text-xs text-muted-foreground">{list.contact_count} contact(s)</p>
                              </div>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

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
                                  ? "border-foreground bg-foreground/5 shadow-sm"
                                  : "border-border hover:bg-muted/50"
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${settingsGoal === g.value ? "border-foreground" : "border-muted-foreground/40"}`}>
                                  {settingsGoal === g.value && <div className="w-2 h-2 rounded-full bg-foreground" />}
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
                                  ? "border-foreground bg-foreground/5 shadow-sm"
                                  : "border-border hover:bg-muted/50"
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${settingsTone === t.value ? "border-foreground" : "border-muted-foreground/40"}`}>
                                  {settingsTone === t.value && <div className="w-2 h-2 rounded-full bg-foreground" />}
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

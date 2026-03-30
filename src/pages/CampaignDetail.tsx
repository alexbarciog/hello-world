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
  AlertCircle, Plus, Shield, Eye, Target, Mic, Check, TrendingUp, X, User, Trash2,
  RefreshCw, Loader2,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
  custom_training: string | null;
  language: string | null;
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

// Convert a UTC hour to the user's local time, respecting locale format (12h/24h)
function utcHourToLocal(utcHour: number): string {
  const d = new Date();
  d.setUTCHours(utcHour, 0, 0, 0);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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
  const [stepFilter, setStepFilter] = useState<string>("all");
  const [agentName, setAgentName] = useState("My Agent");
  const [agentStatus, setAgentStatus] = useState("paused");
  const [contactsCount, setContactsCount] = useState(0);
  const [listsCount, setListsCount] = useState(0);
  const [availableLists, setAvailableLists] = useState<{ id: string; name: string; contact_count: number }[]>([]);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [assigningList, setAssigningList] = useState(false);
  const [showAgentRunning, setShowAgentRunning] = useState(false);
  const [editingStep, setEditingStep] = useState<number | null>(null);
  const [editingDelayStep, setEditingDelayStep] = useState<number | null>(null);
  const [step1Sent, setStep1Sent] = useState(0);
  const [step1Accepted, setStep1Accepted] = useState(0);
  const [settingsDailyLimit, setSettingsDailyLimit] = useState(25);
  const [todaySentCount, setTodaySentCount] = useState(0);
  const [remainingContacts, setRemainingContacts] = useState(0);
  const [contactStatuses, setContactStatuses] = useState<Record<string, { status: string; step: number; updatedAt?: string }>>({});

  // Scheduled messages state
  type ScheduledMessage = {
    contactId: string;
    contactName: string;
    contactTitle: string;
    contactCompany: string;
    contactSignal: string;
    currentStep: number;
    nextStepNum: number;
    message: string;
    isAi: boolean;
    scheduledDate: string;
    status: string;
    scheduledMsgId?: string; // ID from scheduled_messages table
    editedByUser?: boolean;
  };
  const [scheduledMessages, setScheduledMessages] = useState<ScheduledMessage[]>([]);
  const [editingScheduledIdx, setEditingScheduledIdx] = useState<number | null>(null);
  const [editingScheduledMsg, setEditingScheduledMsg] = useState("");
  const [regeneratingIdx, setRegeneratingIdx] = useState<number | null>(null);

  async function handleRegenerateMessage(idx: number) {
    const sm = scheduledMessages[idx];
    if (!sm || !campaign) return;
    setRegeneratingIdx(idx);
    try {
      const { data, error } = await supabase.functions.invoke('generate-step-message', {
        body: {
          stepNumber: sm.nextStepNum,
          previousStepMessage: "",
          previousMessages: [],
          companyName: campaign.company_name || "",
          valueProposition: campaign.value_proposition || "",
          painPoints: campaign.pain_points || [],
          campaignGoal: campaign.campaign_goal || "",
          messageTone: campaign.message_tone || "conversational",
          industry: campaign.industry || "",
          language: campaign.language || "English",
          customTraining: campaign.custom_training || "",
          firstName: sm.contactName.split(" ")[0] || "",
          lastName: sm.contactName.split(" ").slice(1).join(" ") || "",
          leadCompany: sm.contactCompany || "",
          leadTitle: sm.contactTitle || "",
          buyingSignal: sm.contactSignal || "",
        },
      });
      if (error) throw error;
      const newMessage = data?.message || "";
      if (!newMessage) { toast.error("AI returned an empty message"); return; }

      const updated = [...scheduledMessages];
      updated[idx] = { ...updated[idx], message: newMessage, editedByUser: false };
      setScheduledMessages(updated);

      if (sm.scheduledMsgId) {
        await supabase
          .from("scheduled_messages" as any)
          .update({ message: newMessage, edited_by_user: false, generated_at: new Date().toISOString(), status: "generated" } as any)
          .eq("id", sm.scheduledMsgId);
      }
      toast.success("Message regenerated!");
    } catch (e: any) {
      console.error("Regenerate error:", e);
      toast.error(e?.message || "Failed to regenerate message");
    } finally {
      setRegeneratingIdx(null);
    }
  }

  const [addStepOpen, setAddStepOpen] = useState(false);
  const [addStepPhase, setAddStepPhase] = useState<"choose" | "edit">("choose");
  const [newStepType, setNewStepType] = useState<"message" | "visit_profile">("message");
  const [newStepMessage, setNewStepMessage] = useState("");
  const [newStepDelay, setNewStepDelay] = useState(1);
  const [newStepMessageMode, setNewStepMessageMode] = useState<"manual" | "ai">("manual");
  const [newStepInstructions, setNewStepInstructions] = useState("");
  const [editStepInstructionsIdx, setEditStepInstructionsIdx] = useState<number | null>(null);
  const [editStepInstructionsText, setEditStepInstructionsText] = useState("");

  
  const [settingsGoal, setSettingsGoal] = useState("");
  const [settingsTone, setSettingsTone] = useState("");
  const [settingsCustomTraining, setSettingsCustomTraining] = useState("");
  const [settingsLanguage, setSettingsLanguage] = useState("English");
  const [settingsExcludeFirst, setSettingsExcludeFirst] = useState(true);
  const [settingsReviewMode, setSettingsReviewMode] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savedAnimation, setSavedAnimation] = useState(false);

  // Edit step mode popup state
  const [editModePickerStep, setEditModePickerStep] = useState<number | null>(null);

  // Step 1 (invitation) edit dialog state
  const [editInvitationOpen, setEditInvitationOpen] = useState(false);
  const [invitationNoteMode, setInvitationNoteMode] = useState<"without" | "with">("without");
  const [invitationNote, setInvitationNote] = useState("");
  

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
    setSettingsLanguage(c.language || "English");
    setSettingsCustomTraining((c as any).custom_training || "");
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

    // Load today's sent count for scheduled view
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const { count: todaySent } = await supabase
      .from("campaign_connection_requests" as any)
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", campaignId)
      .gte("sent_at", todayStart.toISOString());
    setTodaySentCount(todaySent || 0);

    // Load per-contact statuses from connection requests
    const { data: connRequests } = await supabase
      .from("campaign_connection_requests" as any)
      .select("contact_id, status, step_completed_at, sent_at")
      .eq("campaign_id", campaignId);
    if (connRequests) {
      const statusMap: Record<string, { status: string; step: number; updatedAt?: string }> = {};
      for (const cr of connRequests as any[]) {
        const isAccepted = cr.status === "accepted";
        statusMap[cr.contact_id] = {
          status: cr.status,
          step: isAccepted ? 1 : 0,
          updatedAt: cr.step_completed_at || cr.sent_at || undefined,
        };
      }
      setContactStatuses(statusMap);
    }

    // Remaining unsent contacts — count only sent requests for contacts currently in the list
    if (c.source_list_id) {
      const { data: currentContactLinks } = await supabase
        .from("contact_lists")
        .select("contact_id")
        .eq("list_id", c.source_list_id);
      const currentContactIds = (currentContactLinks || []).map((cl: any) => cl.contact_id);
      const { count: sentForCurrentList } = await supabase
        .from("campaign_connection_requests" as any)
        .select("id", { count: "exact", head: true })
        .eq("campaign_id", campaignId)
        .in("contact_id", currentContactIds)
        .in("status", ["sent", "accepted"]);
      setRemainingContacts(Math.max(0, currentContactIds.length - (sentForCurrentList || 0)));
    } else {
      const totalContacts = contactsCount || 0;
      const totalSent = sentCount || 0;
      setRemainingContacts(Math.max(0, totalContacts - totalSent));
    }

    // Load scheduled messages - contacts with their next pending step
    await loadScheduledMessages(campaignId, c.workflow_steps || []);

    setLoading(false);
  }

  async function loadScheduledMessages(campaignId: string, steps: any[]) {
    const { data: connReqs } = await supabase
      .from("campaign_connection_requests" as any)
      .select("id, contact_id, status, current_step, accepted_at, step_completed_at")
      .eq("campaign_id", campaignId);
    if (!connReqs || connReqs.length === 0) { setScheduledMessages([]); return; }

    // Get contact details for all contacts in campaign
    const contactIds = (connReqs as any[]).map((cr: any) => cr.contact_id);
    const { data: contactsData } = await supabase
      .from("contacts")
      .select("id, first_name, last_name, title, company, signal")
      .in("id", contactIds);
    const contactMap: Record<string, any> = {};
    (contactsData || []).forEach((c: any) => { contactMap[c.id] = c; });

    // Fetch pre-generated messages from scheduled_messages table
    const connReqIds = (connReqs as any[]).map((cr: any) => cr.id);
    const { data: preGenMsgs } = await supabase
      .from("scheduled_messages" as any)
      .select("id, connection_request_id, step_index, message, status, edited_by_user")
      .in("connection_request_id", connReqIds)
      .in("status", ["generated", "edited"]);
    
    const preGenMap: Record<string, any> = {};
    (preGenMsgs || []).forEach((m: any) => {
      preGenMap[`${m.connection_request_id}_${m.step_index}`] = m;
    });

    const nonInvSteps = (steps || []).filter((s: any) => s.type !== "invitation");
    const scheduled: ScheduledMessage[] = [];

    for (const cr of connReqs as any[]) {
      const contact = contactMap[cr.contact_id];
      if (!contact) continue;

      const currentStep = cr.current_step || 1;
      const nextStepIdx = currentStep - 1;
      
      if (nextStepIdx >= nonInvSteps.length) continue;
      if (cr.status === "pending") continue;
      
      if (currentStep === 1 && cr.status !== "accepted") {
        const nextStep = nonInvSteps[0];
        scheduled.push({
          contactId: cr.contact_id,
          contactName: `${contact.first_name} ${contact.last_name || ""}`.trim(),
          contactTitle: contact.title || "",
          contactCompany: contact.company || "",
          contactSignal: contact.signal || "",
          currentStep: 1,
          nextStepNum: 2,
          message: nextStep?.ai_icebreaker ? "" : (nextStep?.message || ""),
          isAi: !!nextStep?.ai_icebreaker,
          scheduledDate: "After acceptance",
          status: "waiting_acceptance",
        });
        continue;
      }

      if (cr.status === "accepted" && nextStepIdx < nonInvSteps.length) {
        const nextStep = nonInvSteps[nextStepIdx];
        const stepIndexInWorkflow = nextStepIdx; // matches step_index stored by edge function
        const acceptedDate = cr.accepted_at ? new Date(cr.accepted_at) : new Date();
        const scheduledDate = new Date(acceptedDate);
        
        let totalDelay = 0;
        for (let j = 0; j <= nextStepIdx; j++) {
          totalDelay += nonInvSteps[j]?.delay_days || 1;
        }
        scheduledDate.setDate(acceptedDate.getDate() + totalDelay);

        // Check for pre-generated message
        const preGen = preGenMap[`${cr.id}_${stepIndexInWorkflow}`];
        let msgPreview = "";
        let scheduledMsgId: string | undefined;
        let editedByUser = false;

        if (preGen) {
          // Use pre-generated message
          msgPreview = preGen.message;
          scheduledMsgId = preGen.id;
          editedByUser = preGen.edited_by_user;
        } else if (nextStep?.ai_icebreaker) {
          // AI SDR mode but not yet generated
          msgPreview = "";
        } else {
          // Template message — personalize
          msgPreview = nextStep?.message || "";
          msgPreview = msgPreview
            .replace(/\{\{first_name\}\}/g, contact.first_name)
            .replace(/\{\{company\}\}/g, contact.company || "their company")
            .replace(/\{\{title\}\}/g, contact.title || "their role")
            .replace(/\{\{signal\}\}/g, contact.signal || "their recent activity");
        }

        scheduled.push({
          contactId: cr.contact_id,
          contactName: `${contact.first_name} ${contact.last_name || ""}`.trim(),
          contactTitle: contact.title || "",
          contactCompany: contact.company || "",
          contactSignal: contact.signal || "",
          currentStep,
          nextStepNum: currentStep + 1,
          message: msgPreview,
          isAi: !!nextStep?.ai_icebreaker,
          scheduledDate: scheduledDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          status: scheduledDate <= new Date() ? "ready" : "scheduled",
          scheduledMsgId,
          editedByUser,
        });
      }
    }

    scheduled.sort((a, b) => {
      // Priority: ready first, then scheduled (soonest first), then waiting_acceptance last
      const statusOrder: Record<string, number> = { ready: 0, scheduled: 1, waiting_acceptance: 2 };
      const aOrder = statusOrder[a.status] ?? 1;
      const bOrder = statusOrder[b.status] ?? 1;
      if (aOrder !== bOrder) return aOrder - bOrder;
      // Within same status, sort by scheduledDate (nearest first)
      const aDate = new Date(a.scheduledDate).getTime();
      const bDate = new Date(b.scheduledDate).getTime();
      if (!isNaN(aDate) && !isNaN(bDate)) return aDate - bDate;
      return 0;
    });

    setScheduledMessages(scheduled);
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

    // Trigger immediate processing so new list contacts get queued for Step 1
    if (campaign.status === "active") {
      try {
        await supabase.functions.invoke("send-connection-requests");
      } catch (e) {
        console.warn("Could not trigger immediate connection requests:", e);
      }
    }

    // Reload connection request statuses for updated contact list
    const { data: connRequests } = await supabase
      .from("campaign_connection_requests" as any)
      .select("contact_id, status, current_step, step_completed_at, sent_at")
      .eq("campaign_id", campaign.id);
    if (connRequests) {
      const statusMap: Record<string, { status: string; step: number; updatedAt?: string }> = {};
      for (const cr of connRequests as any[]) {
        const isAccepted = cr.status === "accepted";
        statusMap[cr.contact_id] = {
          status: cr.status,
          step: isAccepted ? (cr.current_step || 1) : 0,
          updatedAt: cr.step_completed_at || cr.sent_at || undefined,
        };
      }
      setContactStatuses(statusMap);
    }

    setAssigningList(false);
    toast.success("List assigned! New contacts are being queued for outreach.");
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
      language: settingsLanguage,
      custom_training: settingsCustomTraining || null,
      daily_connect_limit: settingsDailyLimit,
    } as any).eq("id", campaign.id);
    if (error) toast.error("Failed to save");
    else {
      setCampaign({ ...campaign, campaign_goal: settingsGoal, message_tone: settingsTone, language: settingsLanguage, custom_training: settingsCustomTraining || null, daily_connect_limit: settingsDailyLimit });
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
    setNewStepInstructions("");
    setAddStepPhase("choose");
    setAddStepOpen(true);
  }

  function insertVariable(v: string) {
    setNewStepMessage(prev => prev + `{{${v}}}`);
  }

  async function saveDelayDays(stepIndex: number, newDelay: number) {
    if (!campaign) return;
    const updated = [...workflowSteps];
    // stepIndex is the index in the filtered (non-invitation) steps, 
    // but we need the actual index in workflowSteps
    const nonInvitationSteps = workflowSteps.map((ws: any, idx: number) => ({ ws, idx })).filter((item: any) => item.ws.type !== "invitation");
    const actualIdx = nonInvitationSteps[stepIndex]?.idx;
    if (actualIdx === undefined) return;
    updated[actualIdx] = { ...updated[actualIdx], delay_days: Math.max(1, newDelay) };
    const { error } = await supabase.from("campaigns").update({ workflow_steps: updated as any } as any).eq("id", campaign.id);
    if (error) { toast.error("Failed to update delay"); return; }
    setCampaign({ ...campaign, workflow_steps: updated });
    setEditingDelayStep(null);
  }

  async function deleteWorkflowStep(stepIndex: number) {
    if (!campaign) return;
    const nonInvitationSteps = workflowSteps.map((ws: any, idx: number) => ({ ws, idx })).filter((item: any) => item.ws.type !== "invitation");
    const actualIdx = nonInvitationSteps[stepIndex]?.idx;
    if (actualIdx === undefined) return;
    const updated = workflowSteps.filter((_: any, idx: number) => idx !== actualIdx);
    const { error } = await supabase.from("campaigns").update({ workflow_steps: updated as any } as any).eq("id", campaign.id);
    if (error) { toast.error("Failed to delete step"); return; }
    setCampaign({ ...campaign, workflow_steps: updated });
    setEditingStep(null);
    toast.success("Step deleted");
  }

  async function saveNewStep() {
    if (!campaign) return;
    const newStep: any = {
      type: newStepType === "visit_profile" ? "visit_profile" : "message",
      message: newStepMessageMode === "ai" ? "" : newStepMessage,
      delay_days: newStepDelay,
      ...(newStepMessageMode === "ai" ? { ai_icebreaker: true } : {}),
      ...(newStepMessageMode === "ai" && newStepInstructions.trim() ? { step_instructions: newStepInstructions.trim() } : {}),
    };
    const updated = [...workflowSteps, newStep];
    const { error } = await supabase.from("campaigns").update({ workflow_steps: updated as any } as any).eq("id", campaign.id);
    if (error) { toast.error("Failed to add step"); return; }
    setCampaign({ ...campaign, workflow_steps: updated });
    setAddStepOpen(false);
    toast.success("Step added!");
  }

  async function enableAiSdrForStep(stepIndex: number) {
    if (!campaign) return;
    setEditModePickerStep(null);

    try {
      const allSteps = [...workflowSteps];
      const nonInvMap = workflowSteps.map((ws: any, idx: number) => ({ ws, idx })).filter((item: any) => item.ws.type !== "invitation");
      const actualIdx = nonInvMap[stepIndex]?.idx;
      if (actualIdx !== undefined) {
        allSteps[actualIdx] = { ...allSteps[actualIdx], message: "", ai_icebreaker: true };
        const { error: updateErr } = await supabase.from("campaigns").update({ workflow_steps: allSteps as any } as any).eq("id", campaign.id);
        if (updateErr) { toast.error("Failed to save AI SDR mode"); } else {
          setCampaign({ ...campaign, workflow_steps: allSteps });
          toast.success("AI SDR enabled — each lead will receive a unique, personalized message at send time");
        }
      }
    } catch (e: any) {
      console.error("AI SDR enable error:", e);
      toast.error("Failed to enable AI SDR");
    }
  }

  function openEditStepInstructions(stepIndex: number) {
    const nonInvSteps = workflowSteps.filter((ws: any) => ws.type !== "invitation");
    const step = nonInvSteps[stepIndex];
    setEditStepInstructionsText(step?.step_instructions || "");
    setEditStepInstructionsIdx(stepIndex);
  }

  async function saveStepInstructions() {
    if (!campaign || editStepInstructionsIdx === null) return;
    const allSteps = [...workflowSteps];
    const nonInvMap = workflowSteps.map((ws: any, idx: number) => ({ ws, idx })).filter((item: any) => item.ws.type !== "invitation");
    const actualIdx = nonInvMap[editStepInstructionsIdx]?.idx;
    if (actualIdx === undefined) return;
    allSteps[actualIdx] = { ...allSteps[actualIdx], step_instructions: editStepInstructionsText.trim() || undefined };
    const { error } = await supabase.from("campaigns").update({ workflow_steps: allSteps as any } as any).eq("id", campaign.id);
    if (error) { toast.error("Failed to save instructions"); return; }
    setCampaign({ ...campaign, workflow_steps: allSteps });
    setEditStepInstructionsIdx(null);
    toast.success("Step instructions saved!");
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
    if (stepFilter !== "all") {
      const stepNum = parseInt(stepFilter);
      list = list.filter(c => {
        const cs = contactStatuses[c.id];
        if (!cs) return stepNum === 0; // "Queued" = not yet in any step
        return (cs.step || 1) === stepNum;
      });
    }
    // Sort by last updated (most recent first), contacts without status go last
    list.sort((a, b) => {
      const aTime = contactStatuses[a.id]?.updatedAt ? new Date(contactStatuses[a.id].updatedAt!).getTime() : 0;
      const bTime = contactStatuses[b.id]?.updatedAt ? new Date(contactStatuses[b.id].updatedAt!).getTime() : 0;
      return bTime - aTime;
    });
    return list;
  }, [contacts, contactSearch, contactFilter, stepFilter, contactStatuses]);

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
                        {(() => { const invStep = workflowSteps.find((ws: any) => ws.type === "invitation"); return invStep?.connect_note ? (
                          <div>
                            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5 tracking-wider">NOTE:</p>
                            <p className="text-xs text-foreground leading-relaxed line-clamp-3">{invStep.connect_note}</p>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">Invitation without note</p>
                        ); })()}
                        <div className="flex items-center gap-3 mt-3 text-xs">
                          <span className="font-medium text-muted-foreground border border-border rounded-full px-2 py-0.5">{step1Sent} contact(s)</span>
                          <span className="font-medium text-green-600 border border-green-200 rounded-full px-2 py-0.5">{step1Accepted} accepted</span>
                        </div>
                        <div className="flex flex-col gap-1.5 mt-3 pt-2 border-t border-border">
                          <button onClick={() => { setStepFilter("1"); setTab("contacts"); }} className="text-xs font-medium text-foreground border border-border rounded-lg px-3 py-1.5 hover:bg-muted/50 transition-colors w-full">View Contacts</button>
                          <button onClick={() => { const invStep = workflowSteps.find((ws: any) => ws.type === "invitation"); setInvitationNoteMode(invStep?.connect_note ? "with" : "without"); setInvitationNote(invStep?.connect_note || ""); setEditInvitationOpen(true); }} className="text-xs font-bold text-white bg-foreground rounded-lg px-3 py-1.5 hover:opacity-90 transition-opacity w-full">Edit</button>
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
                            {editingDelayStep === i ? (
                              <div className="flex items-center gap-1 mb-2">
                                <input
                                  type="number"
                                  min={1}
                                  max={30}
                                  defaultValue={ws.delay_days}
                                  autoFocus
                                  className="w-12 text-center text-[10px] font-bold border border-primary rounded-full px-1 py-0.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") saveDelayDays(i, parseInt((e.target as HTMLInputElement).value) || 1);
                                    if (e.key === "Escape") setEditingDelayStep(null);
                                  }}
                                  onBlur={(e) => saveDelayDays(i, parseInt(e.target.value) || 1)}
                                />
                                <span className="text-[10px] text-muted-foreground">days</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => setEditingDelayStep(i)}
                                className="text-[10px] font-bold text-muted-foreground border border-border bg-card px-2.5 py-0.5 rounded-full mb-2 whitespace-nowrap shadow-sm hover:border-primary hover:text-primary transition-colors cursor-pointer"
                              >
                                + {ws.delay_days} days
                              </button>
                            )}
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
                            <div className="rounded-xl text-white p-4 shadow-md relative group" style={{ background: "linear-gradient(135deg, hsl(190 80% 45%), hsl(210 80% 50%))" }}>
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <Send className="w-4 h-4" />
                                  <span className="text-sm font-bold">Send Message</span>
                                </div>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <button className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-white/20 transition-colors opacity-70 hover:opacity-100">
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Step {stepNum}?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will permanently remove this step. All following steps will be renumbered automatically.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => deleteWorkflowStep(i)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                              <p className="text-xs opacity-80">Step {stepNum}</p>
                            </div>

                            <div className="mt-2 rounded-xl border border-border bg-card p-3.5 shadow-sm">
                              {isEditing ? (
                                <div className="space-y-2">
                                  <textarea
                                    id={`step-edit-textarea-${i}`}
                                    defaultValue={ws.message || ""}
                                    className="w-full text-xs border border-border rounded-lg p-2 bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                                    rows={3}
                                    placeholder="Type your message..."
                                  />
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[10px] text-muted-foreground font-medium">Insert:</span>
                                    {["first_name", "last_name", "company", "title", "signal"].map((v) => (
                                      <button
                                        key={v}
                                        onClick={() => {
                                          const ta = document.getElementById(`step-edit-textarea-${i}`) as HTMLTextAreaElement;
                                          if (ta) {
                                            const start = ta.selectionStart;
                                            const end = ta.selectionEnd;
                                            const val = ta.value;
                                            const tag = `{{${v}}}`;
                                            ta.value = val.substring(0, start) + tag + val.substring(end);
                                            ta.focus();
                                            ta.selectionStart = ta.selectionEnd = start + tag.length;
                                          }
                                        }}
                                        className="text-[10px] font-semibold text-primary bg-primary/15 rounded px-2 py-0.5 hover:bg-primary/25 transition-colors"
                                      >
                                        {`{{${v}}}`}
                                      </button>
                                    ))}
                                  </div>
                                  <div className="flex gap-1.5">
                                    <button onClick={() => setEditingStep(null)} className="text-xs font-bold text-white bg-primary rounded px-3 py-1">Save</button>
                                    <button onClick={() => setEditingStep(null)} className="text-xs font-medium text-muted-foreground border border-border rounded px-3 py-1">Cancel</button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  {ws.ai_icebreaker ? (
                                    <div className="space-y-1.5">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 text-xs">
                                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                          <span className="text-foreground font-bold">AI SDR Mode</span>
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-full">Active</span>
                                      </div>
                                      <p className="text-[11px] text-muted-foreground leading-relaxed">Each lead will receive a unique AI-generated message based on their role, company, signal & your business context.</p>
                                      {ws.step_instructions && (
                                        <div className="mt-2 p-2 bg-muted/40 rounded-lg border border-border">
                                          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">Custom Instructions:</p>
                                          <p className="text-[11px] text-foreground leading-relaxed line-clamp-2">{ws.step_instructions}</p>
                                        </div>
                                      )}
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

                                  <div className="flex flex-col gap-1.5 mt-3 pt-2 border-t border-border">
                                    <button onClick={() => { setStepFilter(String(stepNum)); setTab("contacts"); }} className="text-xs font-medium text-foreground border border-border rounded-lg px-3 py-1.5 hover:bg-muted/50 transition-colors w-full">View Contacts</button>
                                    {ws.ai_icebreaker && (
                                      <button onClick={() => openEditStepInstructions(i)} className="text-xs font-medium text-amber-600 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-1.5 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors w-full">
                                        <span className="flex items-center justify-center gap-1"><Sparkles className="w-3 h-3" /> Instructions</span>
                                      </button>
                                    )}
                                    <button onClick={() => setEditModePickerStep(i)} className="text-xs font-bold text-primary-foreground bg-foreground rounded-lg px-3 py-1.5 hover:bg-foreground/90 transition-colors w-full">Edit</button>
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
                            <p className="text-xs text-muted-foreground mb-3">Each lead will receive a unique, personalized message generated by AI based on their profile, company, and signal data.</p>
                            <div className="mt-2">
                              <label className="text-xs font-semibold text-foreground mb-1.5 block">Custom Instructions (optional)</label>
                              <textarea
                                value={newStepInstructions}
                                onChange={(e) => setNewStepInstructions(e.target.value)}
                                className="w-full min-h-[80px] text-xs border border-border rounded-lg p-2.5 bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                                placeholder="e.g. Mention our free trial, avoid talking about pricing, ask about their current workflow..."
                                maxLength={500}
                              />
                              <p className="text-[10px] text-muted-foreground mt-1">{newStepInstructions.length}/500 — These instructions will guide the AI for this specific step only.</p>
                            </div>
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

              {/* Edit Mode Picker Dialog (AI SDR vs Manual) */}
              <Dialog open={editModePickerStep !== null} onOpenChange={(open) => { if (!open) setEditModePickerStep(null); }}>
                <DialogContent className="sm:max-w-[420px] p-6 gap-0">
                  <DialogHeader className="mb-5">
                    <DialogTitle className="text-lg font-bold">How do you want to edit?</DialogTitle>
                    <p className="text-sm text-muted-foreground">Choose how to create the message for Step {(editModePickerStep ?? 0) + 2}</p>
                  </DialogHeader>
                  {(() => {
                    const nonInvSteps = workflowSteps.filter((ws: any) => ws.type !== "invitation");
                    const currentStep = editModePickerStep !== null ? nonInvSteps[editModePickerStep] : null;
                    const isCurrentlyAi = currentStep?.ai_icebreaker === true;
                    return (
                      <div className="space-y-3">
                        <button
                          onClick={() => {
                            if (editModePickerStep !== null) enableAiSdrForStep(editModePickerStep);
                          }}
                          className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left group ${isCurrentlyAi ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-primary/5"}`}
                        >
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-primary/10">
                            <Bot className="w-6 h-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-foreground flex items-center gap-2">
                              AI SDR
                              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                              {isCurrentlyAi && <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">Active</span>}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Generate a hyper-personalized message using AI based on lead context, signals, and your business
                            </p>
                          </div>
                        </button>
                        <button
                          onClick={() => {
                            const idx = editModePickerStep;
                            setEditModePickerStep(null);
                            if (idx !== null) setEditingStep(idx);
                          }}
                          className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left group ${!isCurrentlyAi ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/40 hover:bg-muted/30"}`}
                        >
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-muted">
                            <Pencil className="w-5 h-5 text-foreground" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-foreground flex items-center gap-2">
                              Manual
                              {!isCurrentlyAi && <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">Active</span>}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Write or edit the message yourself using variables like {"{{first_name}}"}, {"{{company}}"}
                            </p>
                          </div>
                        </button>
                      </div>
                    );
                  })()}
                </DialogContent>
              </Dialog>

              {/* Edit Invitation (Step 1) Dialog */}
              <Dialog open={editInvitationOpen} onOpenChange={setEditInvitationOpen}>
                <DialogContent className="sm:max-w-[480px] p-6 gap-0">
                  <DialogHeader className="mb-5">
                    <DialogTitle className="text-lg font-bold">Edit Invitation</DialogTitle>
                    <p className="text-sm text-muted-foreground">Choose how to send connection requests</p>
                  </DialogHeader>
                  <div className="space-y-3">
                    <button
                      onClick={() => setInvitationNoteMode("without")}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${invitationNoteMode === "without" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-primary/5"}`}
                    >
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-muted">
                        <UserPlus className="w-5 h-5 text-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-foreground flex items-center gap-2">
                          Without Note
                          {invitationNoteMode === "without" && <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">Active</span>}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">Send a blank connection request without any message</p>
                      </div>
                    </button>
                    <button
                      onClick={() => setInvitationNoteMode("with")}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${invitationNoteMode === "with" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-primary/5"}`}
                    >
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-primary/10">
                        <MessageSquare className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-foreground flex items-center gap-2">
                          With Note
                          {invitationNoteMode === "with" && <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">Active</span>}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">Include a personalized note with your connection request</p>
                      </div>
                    </button>
                  </div>

                  <AnimatePresence>
                    {invitationNoteMode === "with" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 space-y-2">
                          <label className="text-xs font-bold text-foreground">Connection Note</label>
                          <textarea
                            id="invitation-note-textarea"
                            value={invitationNote}
                            onChange={(e) => setInvitationNote(e.target.value)}
                            className="w-full text-xs border border-border rounded-lg p-3 bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                            rows={3}
                            placeholder="Hi {{first_name}}, I'd love to connect..."
                            maxLength={300}
                          />
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] text-muted-foreground font-medium">Insert:</span>
                              {["first_name", "last_name", "company", "title"].map((v) => (
                                <button
                                  key={v}
                                  onClick={() => {
                                    const ta = document.getElementById("invitation-note-textarea") as HTMLTextAreaElement;
                                    if (ta) {
                                      const start = ta.selectionStart;
                                      const end = ta.selectionEnd;
                                      const val = ta.value;
                                      const tag = `{{${v}}}`;
                                      const newVal = val.substring(0, start) + tag + val.substring(end);
                                      setInvitationNote(newVal);
                                      setTimeout(() => { ta.focus(); ta.selectionStart = ta.selectionEnd = start + tag.length; }, 0);
                                    }
                                  }}
                                  className="text-[10px] font-semibold text-primary bg-primary/15 rounded px-2 py-0.5 hover:bg-primary/25 transition-colors"
                                >
                                  {`{{${v}}}`}
                                </button>
                              ))}
                            </div>
                            <span className="text-[10px] text-muted-foreground">{invitationNote.length}/300</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex gap-2 mt-5">
                    <button
                      onClick={async () => {
                        if (!campaign) return;
                        const updated = workflowSteps.map((ws: any) =>
                          ws.type === "invitation"
                            ? { ...ws, connect_note: invitationNoteMode === "with" ? invitationNote.trim() : null }
                            : ws
                        );
                        const { error } = await supabase.from("campaigns").update({ workflow_steps: updated as any } as any).eq("id", campaign.id);
                        if (error) { toast.error("Failed to save"); return; }
                        setCampaign({ ...campaign, workflow_steps: updated });
                        setEditInvitationOpen(false);
                        toast.success("Invitation step updated");
                      }}
                      className="text-xs font-bold text-white bg-primary rounded-lg px-4 py-2 hover:bg-primary/90 transition-colors"
                    >
                      Save
                    </button>
                    <button onClick={() => setEditInvitationOpen(false)} className="text-xs font-medium text-muted-foreground border border-border rounded-lg px-4 py-2 hover:bg-muted/50 transition-colors">
                      Cancel
                    </button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={editStepInstructionsIdx !== null} onOpenChange={(open) => { if (!open) setEditStepInstructionsIdx(null); }}>
                <DialogContent className="sm:max-w-[480px] p-6 gap-0">
                  <DialogHeader className="mb-4">
                    <DialogTitle className="text-lg font-bold flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" /> AI Step Instructions
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground">Add custom instructions for Step {(editStepInstructionsIdx ?? 0) + 2}. These will guide the AI when generating messages for this specific step.</p>
                  </DialogHeader>
                  <textarea
                    value={editStepInstructionsText}
                    onChange={(e) => setEditStepInstructionsText(e.target.value)}
                    className="w-full min-h-[100px] text-sm border border-border rounded-xl p-3 bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                    placeholder="e.g. Mention our free trial, avoid talking about pricing, ask about their current workflow..."
                    maxLength={500}
                  />
                  <p className="text-[10px] text-muted-foreground mt-1 mb-4">{editStepInstructionsText.length}/500</p>
                  <div className="flex justify-end gap-2 pt-3 border-t border-border">
                    <button onClick={() => setEditStepInstructionsIdx(null)} className="text-sm font-medium text-foreground border border-border rounded-lg px-4 py-2 hover:bg-muted/50 transition-colors">Cancel</button>
                    <button onClick={saveStepInstructions} className="text-sm font-bold text-white bg-primary rounded-lg px-5 py-2 hover:bg-primary/90 transition-colors">Save</button>
                  </div>
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
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-1 w-fit">
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

                  <select
                    value={stepFilter}
                    onChange={(e) => setStepFilter(e.target.value)}
                    className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="all">All Steps</option>
                    <option value="0">Queued</option>
                    {(workflowSteps as any[]).map((_: any, i: number) => (
                      <option key={i} value={i + 1}>
                        {i === 0 ? "Step 1 — Invitation" : `Step ${i + 1} — Message`}
                      </option>
                    ))}
                  </select>
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
                  <table className="w-full min-w-[900px]">
                    <thead>
                      <tr className="border-b border-border">
                        {["CONTACT", "SIGNAL", "SCORE", "STATUS", "IMPORTED", "LAST ACTION", "NEXT STEP"].map((h) => (
                          <th key={h} className="text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-3 py-3">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredContacts.length === 0 ? (
                        <tr><td colSpan={7} className="text-center py-12 text-sm text-muted-foreground">No contacts yet</td></tr>
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
                                      {c.linkedin_url && <a href={c.linkedin_url} target="_blank" rel="noopener noreferrer"><LinkedInIcon /></a>}
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
                              <td className="px-3 py-3">
                                {(() => {
                                  const cs = contactStatuses[c.id];
                                  if (!cs) return <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted/50 rounded-full px-2.5 py-0.5">Queued</span>;
                                  if (cs.status === "pending") return <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 dark:bg-amber-950/30 rounded-full px-2.5 py-0.5">Pending</span>;
                                  if (cs.status === "accepted") {
                                    const stepNum = cs.step;
                                    return <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 rounded-full px-2.5 py-0.5">Step {stepNum}</span>;
                                  }
                                  if (cs.status === "sent") return <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 dark:bg-blue-950/30 rounded-full px-2.5 py-0.5">Invite Sent</span>;
                                  return <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted/50 rounded-full px-2.5 py-0.5">{cs.status === "failed" ? "Skipped" : cs.status}</span>;
                                })()}
                              </td>
                              <td className="px-3 py-3">
                                <span className="text-xs text-muted-foreground">
                                  {new Date(c.imported_at).toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "2-digit" })}
                                </span>
                              </td>
                              <td className="px-3 py-3">
                                {(() => {
                                  const cs = contactStatuses[c.id];
                                  if (!cs) return <span className="inline-flex items-center text-[11px] font-bold whitespace-nowrap rounded-full px-2.5 py-0.5 bg-muted text-muted-foreground ring-1 ring-border">Added to campaign</span>;
                                  const chipColors = [
                                    "bg-blue-500/10 text-blue-600 ring-1 ring-blue-500/20",
                                    "bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20",
                                    "bg-violet-500/10 text-violet-600 ring-1 ring-violet-500/20",
                                    "bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20",
                                  ];
                                  if (cs.status === "skipped" || cs.status === "failed") {
                                    return <span className="inline-flex items-center text-[11px] font-bold whitespace-nowrap rounded-full px-2.5 py-0.5 bg-red-500/10 text-red-600 ring-1 ring-red-500/20">Invite skipped</span>;
                                  }
                                  if (cs.status === "pending") {
                                    return <span className={`inline-flex items-center text-[11px] font-bold whitespace-nowrap rounded-full px-2.5 py-0.5 ${chipColors[0]}`}>Invitation sent</span>;
                                  }
                                  if (cs.status === "accepted") {
                                    const stepNum = cs.step || 1;
                                    const label = stepNum === 1 ? "Invite accepted" : `Step ${stepNum} sent`;
                                    const colorClass = chipColors[(stepNum) % chipColors.length];
                                    return <span className={`inline-flex items-center text-[11px] font-bold whitespace-nowrap rounded-full px-2.5 py-0.5 ${colorClass}`}>{label}</span>;
                                  }
                                  if (cs.status === "sent") {
                                    return <span className={`inline-flex items-center text-[11px] font-bold whitespace-nowrap rounded-full px-2.5 py-0.5 ${chipColors[0]}`}>Invitation sent</span>;
                                  }
                                  return <span className="inline-flex items-center text-[11px] font-bold whitespace-nowrap rounded-full px-2.5 py-0.5 bg-muted text-muted-foreground ring-1 ring-border">{cs.status}</span>;
                                })()}
                              </td>
                              <td className="px-3 py-3">
                                {(() => {
                                  const cs = contactStatuses[c.id];
                                  const steps = workflowSteps as any[];
                                  const currentStep = cs?.step || 0;
                                  const nextStepIdx = currentStep; // next step index in workflow array
                                  if (nextStepIdx >= steps.length) {
                                    return <span className="inline-flex items-center text-[11px] font-bold whitespace-nowrap rounded-full px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20">✓ Completed</span>;
                                  }
                                  const nextLabel = nextStepIdx === 0 ? "Step 1 — Invitation" : `Step ${nextStepIdx + 1} — Message`;
                                  return <span className="inline-flex items-center text-[11px] font-bold whitespace-nowrap rounded-full px-2.5 py-0.5 bg-primary/10 text-primary ring-1 ring-primary/20">{nextLabel}</span>;
                                })()}
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
                      <div className="rounded-xl bg-muted/20 p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-bold text-foreground">Daily connection request limit</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Max invitations sent per day (split across 5 daily runs)</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={1}
                              max={100}
                              value={settingsDailyLimit}
                              onChange={(e) => setSettingsDailyLimit(Math.max(1, Math.min(100, parseInt(e.target.value) || 25)))}
                              className="w-20 text-center px-2 py-1.5 border border-border rounded-lg text-sm font-bold bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                            <span className="text-xs text-muted-foreground">/day</span>
                          </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-2">≈ {Math.max(1, Math.floor(settingsDailyLimit / 5))} invitations per run × 5 runs (08:00, 10:00, 12:00, 14:00, 16:00 UTC)</p>
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

                      {/* Language */}
                      <div>
                        <p className="text-sm font-bold text-foreground mb-2.5">Language</p>
                        <select
                          value={settingsLanguage}
                          onChange={(e) => setSettingsLanguage(e.target.value)}
                          className="w-full max-w-xs rounded-xl border-2 border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-foreground transition-colors appearance-none cursor-pointer"
                          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                        >
                          {["English", "Spanish", "French", "German", "Portuguese", "Italian", "Dutch", "Polish", "Swedish", "Romanian"].map((lang) => (
                            <option key={lang} value={lang}>{lang}</option>
                          ))}
                        </select>
                      </div>

                      {/* Custom AI Training */}
                      <div>
                        <p className="text-sm font-bold text-foreground mb-1">Custom AI Training <span className="text-xs font-normal text-muted-foreground">(optional)</span></p>
                        <p className="text-xs text-muted-foreground mb-2.5">Give your AI SDR extra guidance — tone nuances, things to mention or avoid, specific instructions.</p>
                        <textarea
                          value={settingsCustomTraining}
                          onChange={(e) => setSettingsCustomTraining(e.target.value)}
                          placeholder="e.g. Always mention our free trial. Don't use emojis. Reference their recent LinkedIn posts when possible..."
                          rows={4}
                          className="flex w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                        />
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
            <motion.div key="scheduled" variants={tabVariant} initial="hidden" animate="visible" exit="exit" className="space-y-5">
              {/* ✨ Today's overview — iOS glassmorphic card */}
              <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-background via-background to-primary/[0.03] p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">📅</div>
                    <div>
                      <h2 className="text-base font-extrabold text-foreground tracking-tight">Today's Schedule</h2>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[11px] font-bold px-3 py-1 rounded-full backdrop-blur-sm ${
                    campaign.status === "active"
                      ? "bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20"
                      : "bg-muted text-muted-foreground ring-1 ring-border"
                  }`}>
                    {campaign.status === "active" ? "🟢 Active" : "⏸️ Paused"}
                  </span>
                </div>

                {/* Progress pill */}
                <div className="mb-6 rounded-xl bg-muted/40 p-3.5">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-medium text-muted-foreground flex items-center gap-1.5">⚡ Daily progress</span>
                    <span className="font-extrabold text-foreground">{todaySentCount} / {campaign.daily_connect_limit || 25}</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (todaySentCount / (campaign.daily_connect_limit || 25)) * 100)}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
                    👥 {remainingContacts} contacts remaining in queue
                  </p>
                </div>

                {/* Sequence runs */}
                <div className="space-y-2">
                  {(() => {
                    const runs = [
                      { time: "08:00", label: "Run 1", emoji: "🌅" },
                      { time: "10:00", label: "Run 2", emoji: "☀️" },
                      { time: "12:00", label: "Run 3", emoji: "🔆" },
                      { time: "14:00", label: "Run 4", emoji: "🌤️" },
                      { time: "16:00", label: "Run 5", emoji: "🌇" },
                    ];
                    const dailyLimit = campaign.daily_connect_limit || 25;
                    const perRun = Math.max(1, Math.floor(dailyLimit / 5));
                    const nowUTC = new Date().getUTCHours();

                    const visibleRuns = runs.filter((run) => {
                      const runHour = parseInt(run.time);
                      return nowUTC < runHour + 1;
                    });

                    if (visibleRuns.length === 0) {
                      return (
                        <div className="text-center py-8">
                          <div className="text-3xl mb-2">✅</div>
                          <p className="text-sm font-bold text-foreground">All done for today!</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Next runs start tomorrow at {utcHourToLocal(8)} 🌅
                          </p>
                        </div>
                      );
                    }

                    return visibleRuns.map((run, idx) => {
                      const runHour = parseInt(run.time);
                      const isPast = nowUTC >= runHour + 1;
                      const isActive = nowUTC >= runHour && nowUTC < runHour + 1;

                      const sentBefore = Math.min(idx * perRun, todaySentCount);
                      const thisBatchSent = isPast ? Math.min(perRun, Math.max(0, todaySentCount - sentBefore)) : 0;
                      const thisBatchPlanned = Math.min(perRun, remainingContacts > 0 ? perRun : 0);

                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.08, type: "spring", stiffness: 300, damping: 24 }}
                          whileHover={{ scale: 1.01, y: -1 }}
                          className={`relative overflow-hidden rounded-2xl p-4 transition-all duration-300 cursor-default ${
                            isActive
                              ? "bg-gradient-to-br from-foreground/[0.04] via-foreground/[0.02] to-transparent ring-1 ring-foreground/10 shadow-lg shadow-foreground/5"
                              : isPast
                              ? "bg-muted/25 opacity-60"
                              : "bg-gradient-to-br from-background to-muted/30 ring-1 ring-border/40 shadow-md shadow-black/[0.03] hover:shadow-lg hover:ring-border/60"
                          }`}
                        >
                          {/* Glossy shine overlay */}
                          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent pointer-events-none rounded-2xl" />
                          
                          {/* Subtle top highlight for glass effect */}
                          <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

                          <div className="relative flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {/* Fire icon container */}
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${
                                isActive
                                  ? "bg-gradient-to-br from-amber-400/20 to-orange-500/10 ring-1 ring-amber-400/30"
                                  : "bg-gradient-to-br from-muted/60 to-muted/30 ring-1 ring-border/30"
                              }`}>
                                <span className={`text-lg ${isActive ? "animate-pulse" : ""}`}>🔥</span>
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[13px] font-extrabold text-foreground tracking-tight">{run.label}</span>
                                  <span className="text-[10px] text-muted-foreground font-bold bg-foreground/[0.04] backdrop-blur-sm px-2 py-0.5 rounded-lg ring-1 ring-foreground/[0.06]">
                                    {utcHourToLocal(runHour)}
                                  </span>
                                  {isActive && (
                                    <motion.span
                                      animate={{ opacity: [1, 0.6, 1] }}
                                      transition={{ duration: 1.5, repeat: Infinity }}
                                      className="text-[10px] font-black tracking-wide text-foreground bg-foreground/[0.07] px-2.5 py-0.5 rounded-full ring-1 ring-foreground/10"
                                    >
                                      ⚡ LIVE
                                    </motion.span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 mt-1.5">
                                  <span className="text-[10px] text-[hsl(220,80%,55%)] flex items-center gap-1 font-medium">
                                    <UserPlus className="w-3 h-3" /> Send invitations
                                  </span>
                                  {workflowSteps.filter((ws: any) => ws.type !== "invitation").length > 0 && (
                                    <span className="text-[10px] text-[hsl(220,80%,55%)] flex items-center gap-1 font-medium">
                                      <MessageSquare className="w-3 h-3" /> +{workflowSteps.filter((ws: any) => ws.type !== "invitation").length} follow-up
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div>
                              {isPast ? (
                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 backdrop-blur-sm px-3 py-1.5 rounded-xl ring-1 ring-emerald-500/20 shadow-sm">
                                  ✓ {thisBatchSent} sent
                                </span>
                              ) : campaign.status !== "active" ? (
                                <span className="text-[10px] font-semibold text-muted-foreground bg-muted/60 backdrop-blur-sm px-3 py-1.5 rounded-xl">⏸️ Paused</span>
                              ) : remainingContacts === 0 ? (
                                <span className="text-[10px] font-semibold text-muted-foreground bg-muted/60 backdrop-blur-sm px-3 py-1.5 rounded-xl">No contacts</span>
                              ) : (
                                <span className="text-[10px] font-bold text-foreground/70 bg-foreground/[0.04] backdrop-blur-sm px-3 py-1.5 rounded-xl ring-1 ring-foreground/[0.06] shadow-sm">
                                  ~{thisBatchPlanned} planned
                                </span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Upcoming Messages Preview */}
              {scheduledMessages.length > 0 && (
                <div className="rounded-2xl border border-border/60 bg-card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-extrabold text-foreground tracking-tight flex items-center gap-2">
                        <Eye className="w-4 h-4 text-primary" />
                        Upcoming Messages
                      </h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Preview and edit messages before they're sent</p>
                    </div>
                    <span className="text-[11px] font-bold bg-primary/10 text-primary px-3 py-1 rounded-full">
                      {scheduledMessages.length} contact(s)
                    </span>
                  </div>

                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {scheduledMessages.map((sm, idx) => {
                      const isEditing = editingScheduledIdx === idx;
                      const initials = sm.contactName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

                      return (
                        <motion.div
                          key={sm.contactId + sm.nextStepNum}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.04 }}
                          className="rounded-xl border border-border bg-background p-4 hover:shadow-sm transition-shadow"
                        >
                          {/* Contact header */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                                {initials}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-foreground">{sm.contactName}</p>
                                <p className="text-[10px] text-muted-foreground line-clamp-1">
                                  {sm.contactTitle}{sm.contactCompany ? ` at ${sm.contactCompany}` : ""}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                                sm.status === "ready" 
                                  ? "bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20"
                                  : sm.status === "waiting_acceptance"
                                  ? "bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20"
                                  : "bg-muted text-muted-foreground ring-1 ring-border"
                              }`}>
                                {sm.status === "ready" ? "Ready to send" 
                                  : sm.status === "waiting_acceptance" ? "⏳ Awaiting accept" 
                                  : `📅 ${sm.scheduledDate}`}
                              </span>
                              <span className="text-[10px] font-bold text-muted-foreground bg-muted/60 px-2 py-1 rounded-lg">
                                Step {sm.nextStepNum}
                              </span>
                            </div>
                          </div>

                          {/* Signal context */}
                          {sm.contactSignal && (
                            <div className="mb-3 p-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
                              <p className="text-[10px] text-amber-700 font-medium flex items-center gap-1">
                                <Flame className="w-3 h-3" /> 
                                <span className="font-bold">Signal:</span> {sm.contactSignal.length > 120 ? sm.contactSignal.slice(0, 120) + "..." : sm.contactSignal}
                              </p>
                            </div>
                          )}

                          {/* Message preview / edit */}
                          <div className="rounded-lg border border-border bg-muted/20 p-3">
                            {sm.isAi && !sm.message && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                <span className="italic">AI SDR will generate a unique message for this lead before sending</span>
                              </div>
                            )}
                            {sm.isAi && sm.message && (
                              <div className="flex items-center gap-1.5 mb-2">
                                <Sparkles className="w-3 h-3 text-amber-500" />
                                <span className="text-[10px] font-bold text-amber-600">
                                  {sm.editedByUser ? "AI Generated · Edited by you" : "AI Generated"}
                                </span>
                              </div>
                            )}
                            {isEditing ? (
                              <div className="space-y-2">
                                <textarea
                                  value={editingScheduledMsg}
                                  onChange={(e) => setEditingScheduledMsg(e.target.value)}
                                  className="w-full text-xs border border-border rounded-lg p-2.5 bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                                  rows={4}
                                />
                                <div className="flex gap-1.5">
                                  <button
                                    onClick={async () => {
                                      const updated = [...scheduledMessages];
                                      updated[idx] = { ...updated[idx], message: editingScheduledMsg, editedByUser: true };
                                      setScheduledMessages(updated);
                                      setEditingScheduledIdx(null);

                                      // Persist to scheduled_messages table if exists
                                      if (sm.scheduledMsgId) {
                                        await supabase
                                          .from("scheduled_messages" as any)
                                          .update({ message: editingScheduledMsg, edited_by_user: true, status: "edited" } as any)
                                          .eq("id", sm.scheduledMsgId);
                                      }
                                      toast.success("Message updated");
                                    }}
                                    className="text-xs font-bold text-white bg-primary rounded-lg px-3 py-1.5"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingScheduledIdx(null)}
                                    className="text-xs font-medium text-muted-foreground border border-border rounded-lg px-3 py-1.5"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : sm.message ? (
                              <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">{sm.message}</p>
                            ) : null}
                          </div>

                          {/* Actions */}
                          {(sm.message || (sm.isAi && sm.scheduledMsgId)) && !isEditing && (
                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={() => {
                                  setEditingScheduledIdx(idx);
                                  setEditingScheduledMsg(sm.message);
                                }}
                                className="text-[10px] font-medium text-foreground border border-border rounded-lg px-3 py-1.5 hover:bg-muted/50 transition-colors flex items-center gap-1"
                              >
                                <Pencil className="w-3 h-3" /> Edit message
                              </button>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Workflow sequence summary */}
              <div className="rounded-xl border border-border p-5">
                <h3 className="text-sm font-bold text-foreground mb-3">Full Sequence Overview</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-xs">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: "hsl(270 70% 92%)" }}>
                      <UserPlus className="w-3 h-3" style={{ color: "hsl(270 70% 55%)" }} />
                    </div>
                    <div className="flex-1">
                      <span className="font-bold text-foreground">Step 1:</span>
                      <span className="text-muted-foreground ml-1">Send connection invitation</span>
                    </div>
                    <span className="text-muted-foreground">Day 0</span>
                  </div>
                  {workflowSteps.filter((ws: any) => ws.type !== "invitation").map((ws: any, idx: number) => {
                    const cumulativeDays = workflowSteps
                      .filter((s: any) => s.type !== "invitation")
                      .slice(0, idx + 1)
                      .reduce((sum: number, s: any) => sum + (s.delay_days || 0), 0);
                    return (
                      <div key={idx} className="flex items-center gap-3 text-xs">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: "hsl(200 80% 92%)" }}>
                          <Send className="w-3 h-3" style={{ color: "hsl(200 80% 45%)" }} />
                        </div>
                        <div className="flex-1">
                          <span className="font-bold text-foreground">Step {idx + 2}:</span>
                          <span className="text-muted-foreground ml-1">
                            {ws.ai_icebreaker ? "AI-generated message" : ws.message ? `"${ws.message.slice(0, 40)}${ws.message.length > 40 ? "..." : ""}"` : "Custom message"}
                          </span>
                        </div>
                        <span className="text-muted-foreground">+{ws.delay_days}d (Day {cumulativeDays})</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Last Launches Tab ── */}
          {tab === "launches" && (
            <motion.div key="launches" variants={tabVariant} initial="hidden" animate="visible" exit="exit" className="space-y-3">
              {(() => {
                const runSlots = [
                  { time: "08:00", hour: 8, emoji: "🌅" },
                  { time: "10:00", hour: 10, emoji: "☀️" },
                  { time: "12:00", hour: 12, emoji: "🔆" },
                  { time: "14:00", hour: 14, emoji: "🌤️" },
                  { time: "16:00", hour: 16, emoji: "🌇" },
                ];
                const nowUTC = new Date().getUTCHours();
                const dailyLimit = campaign.daily_connect_limit || 25;
                const perRun = Math.max(1, Math.floor(dailyLimit / 5));
                const pastRuns: { date: string; time: string; label: string; sent: number; status: string; emoji: string }[] = [];

                runSlots.forEach((slot, idx) => {
                  if (nowUTC >= slot.hour + 1) {
                    const sentBefore = Math.min(idx * perRun, todaySentCount);
                    const thisBatchSent = Math.min(perRun, Math.max(0, todaySentCount - sentBefore));
                    pastRuns.push({
                      date: new Date().toISOString().slice(0, 10),
                      time: slot.time,
                      label: `Run ${idx + 1}`,
                      sent: thisBatchSent,
                      status: thisBatchSent > 0 ? "completed" : "no_contacts",
                      emoji: slot.emoji,
                    });
                  }
                });
                pastRuns.reverse();

                if (pastRuns.length === 0) {
                  return (
                    <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-background to-muted/20 p-12 text-center">
                      <div className="text-4xl mb-3">🕐</div>
                      <p className="text-sm font-bold text-foreground">No launches yet</p>
                      <p className="text-xs text-muted-foreground mt-1">Completed runs will appear here ✨</p>
                    </div>
                  );
                }

                return (
                  <>
                    <div className="flex items-center gap-2.5 mb-2">
                      <span className="text-lg">📋</span>
                      <h3 className="text-sm font-extrabold text-foreground tracking-tight">Today's Completed Runs</h3>
                      <span className="text-[10px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md font-medium">
                        {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                    {pastRuns.map((run, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.08, type: "spring", stiffness: 300, damping: 24 }}
                        whileHover={{ scale: 1.01, y: -1 }}
                        className="relative overflow-hidden rounded-2xl p-4 cursor-default bg-gradient-to-br from-background to-muted/30 ring-1 ring-border/40 shadow-md shadow-black/[0.03] hover:shadow-lg hover:ring-border/60 transition-all duration-300"
                      >
                        {/* Glossy shine overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent pointer-events-none rounded-2xl" />
                        <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

                        <div className="relative flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${
                              run.sent > 0
                                ? "bg-gradient-to-br from-emerald-400/20 to-emerald-500/10 ring-1 ring-emerald-400/30"
                                : "bg-gradient-to-br from-muted/60 to-muted/30 ring-1 ring-border/30"
                            }`}>
                              <span className="text-lg">🔥</span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[13px] font-extrabold text-foreground tracking-tight">{run.label}</span>
                                <span className="text-[10px] text-muted-foreground font-bold bg-foreground/[0.04] backdrop-blur-sm px-2 py-0.5 rounded-lg ring-1 ring-foreground/[0.06]">
                                  {utcHourToLocal(parseInt(run.time))}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 mt-1.5">
                                <span className="text-[10px] text-[hsl(220,80%,55%)] flex items-center gap-1 font-medium">
                                  {run.sent > 0 ? (
                                    <><UserPlus className="w-3 h-3" /> {run.sent} invitation{run.sent !== 1 ? "s" : ""} sent</>
                                  ) : (
                                    "No contacts to process"
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                          <span className={`text-[10px] font-bold backdrop-blur-sm px-3 py-1.5 rounded-xl ring-1 shadow-sm ${
                            run.sent > 0
                              ? "text-emerald-600 bg-emerald-500/10 ring-emerald-500/20"
                              : "text-muted-foreground bg-muted/60 ring-border/30"
                          }`}>
                            {run.sent > 0 ? "✓ Completed" : "⏭️ Skipped"}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

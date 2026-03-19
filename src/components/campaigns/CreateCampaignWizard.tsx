import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  X, ChevronRight, ChevronLeft, Bot, List, ChevronDown,
  Globe, Sparkles, Briefcase, MapPin, Building2, Users, Check, Loader2,
  Target, Shield, Mic,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface CreateCampaignWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (campaignId: string) => void;
  editCampaignId?: string | null;
}

interface AgentData {
  id: string;
  name: string;
  icp_job_titles: string[];
  icp_industries: string[];
  icp_locations: string[];
  icp_company_sizes: string[];
  icp_company_types: string[];
  leads_list_name: string | null;
}

interface ListData {
  id: string;
  name: string;
}

const CAMPAIGN_GOALS = [
  { value: "conversations", label: "Start conversations", desc: "Build relationships and nurture leads", icon: "💬" },
  { value: "demos", label: "Book sales calls/demos", desc: "Schedule meetings and demos", icon: "📅" },
];

const MESSAGE_TONES = [
  { value: "professional", label: "Professional", desc: "Formal, polished", icon: Shield },
  { value: "conversational", label: "Conversational", desc: "Friendly, casual", icon: Mic },
  { value: "direct", label: "Direct", desc: "Bold, confident", icon: Target },
];

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];
const contentVariant = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.15 } },
};

const DEFAULT_WORKFLOW = [
  { type: "invitation", message: "", delay_days: 0 },
  { type: "message", message: "", delay_days: 1, ai_icebreaker: true },
  { type: "message", message: "", delay_days: 2 },
  { type: "message", message: "", delay_days: 3 },
];

const STEP_LABELS = [
  { num: 1, label: "Lead Source" },
  { num: 2, label: "Campaign Details" },
  { num: 3, label: "LinkedIn Sender" },
];

export function CreateCampaignWizard({ open, onOpenChange, onCreated, editCampaignId }: CreateCampaignWizardProps) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [analyzingWebsite, setAnalyzingWebsite] = useState(false);

  // Step 1
  const [sourceType, setSourceType] = useState<"agent" | "list">("agent");
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [lists, setLists] = useState<ListData[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [selectedListId, setSelectedListId] = useState<string>("");

  // Step 2
  const [website, setWebsite] = useState("");
  const [valueProposition, setValueProposition] = useState("");
  const [painPoints, setPainPoints] = useState("");
  const [campaignGoal, setCampaignGoal] = useState("conversations");
  const [messageTone, setMessageTone] = useState("professional");

  useEffect(() => {
    if (!open) return;
    loadData();
    if (editCampaignId) loadCampaign(editCampaignId);
    else resetForm();
  }, [open, editCampaignId]);

  async function loadData() {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;
    const [agentsRes, listsRes] = await Promise.all([
      supabase.from("signal_agents").select("id, name, icp_job_titles, icp_industries, icp_locations, icp_company_sizes, icp_company_types, leads_list_name").eq("user_id", user.id),
      (supabase.from("lists") as any).select("id, name").eq("user_id", user.id),
    ]);
    if (agentsRes.data) setAgents(agentsRes.data as AgentData[]);
    if (listsRes.data) setLists(listsRes.data as ListData[]);
    if (agentsRes.data?.length && !selectedAgentId && !editCampaignId) {
      setSelectedAgentId(agentsRes.data[0].id);
    }
  }

  async function loadCampaign(id: string) {
    const { data } = await supabase.from("campaigns").select("*").eq("id", id).single();
    if (!data) return;
    setSourceType((data as any).source_type || "agent");
    setSelectedAgentId((data as any).source_agent_id || "");
    setSelectedListId((data as any).source_list_id || "");
    setWebsite(data.website || "");
    setValueProposition((data as any).value_proposition || data.description || "");
    setPainPoints((data.pain_points || []).join("\n"));
    setCampaignGoal(data.campaign_goal || "conversations");
    setMessageTone(data.message_tone || "professional");
  }

  function resetForm() {
    setStep(1);
    setSourceType("agent");
    setSelectedAgentId("");
    setSelectedListId("");
    setWebsite("");
    setValueProposition("");
    setPainPoints("");
    setCampaignGoal("conversations");
    setMessageTone("professional");
  }

  async function handleAnalyzeWebsite() {
    if (!website.trim()) return;
    setAnalyzingWebsite(true);
    try {
      const { data, error } = await supabase.functions.invoke("firecrawl-scrape", { body: { url: website.trim() } });
      if (error) throw error;
      if (data?.description) setValueProposition(data.description);
      if (data?.painPoints?.length) setPainPoints(data.painPoints.join("\n"));
      toast.success("Website analyzed!");
    } catch { toast.error("Failed to analyze website"); }
    setAnalyzingWebsite(false);
  }

  async function handleCreate() {
    setSaving(true);
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) { setSaving(false); return; }

    const selectedAgent = agents.find(a => a.id === selectedAgentId);
    const painPointsArr = painPoints.split("\n").map(s => s.replace(/^-\s*/, "").trim()).filter(Boolean);

    const campaignData = {
      user_id: user.id,
      company_name: selectedAgent?.name || "My Campaign",
      website: website.trim() || null,
      description: valueProposition.trim() || null,
      value_proposition: valueProposition.trim() || null,
      pain_points: painPointsArr,
      campaign_goal: campaignGoal,
      message_tone: messageTone,
      source_type: sourceType,
      source_agent_id: sourceType === "agent" ? selectedAgentId || null : null,
      source_list_id: sourceType === "list" ? selectedListId || null : null,
      status: "paused",
      icp_job_titles: selectedAgent?.icp_job_titles || [],
      icp_industries: selectedAgent?.icp_industries || [],
      icp_locations: selectedAgent?.icp_locations || [],
      icp_company_sizes: selectedAgent?.icp_company_sizes || [],
      icp_company_types: selectedAgent?.icp_company_types || [],
      workflow_steps: DEFAULT_WORKFLOW,
    };

    if (editCampaignId) {
      const { error } = await supabase.from("campaigns").update(campaignData as any).eq("id", editCampaignId);
      if (error) { toast.error("Failed to update campaign"); setSaving(false); return; }
      toast.success("Campaign updated!");
      onCreated(editCampaignId);
    } else {
      const { data, error } = await supabase.from("campaigns").insert(campaignData as any).select("id").single();
      if (error) {
        if (error.message.includes("LIMIT_REACHED")) toast.error("You've reached the campaign limit.");
        else toast.error("Failed to create campaign");
        setSaving(false); return;
      }
      toast.success("Campaign created!");
      onCreated(data.id);
    }

    setSaving(false);
    onOpenChange(false);
  }

  const selectedAgent = agents.find(a => a.id === selectedAgentId);
  const canNext1 = sourceType === "agent" ? !!selectedAgentId : !!selectedListId;
  const totalSteps = 3;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header with stepper */}
        <div className="px-6 pt-6 pb-5 border-b border-border">
          <h2 className="text-lg font-black text-foreground">
            {editCampaignId ? "Edit Campaign" : "Create AI Campaign"}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">Step {step} of {totalSteps}</p>

          {/* Stepper */}
          <div className="flex items-center justify-between mt-5">
            {STEP_LABELS.map((s, i) => (
              <div key={s.num} className="flex items-center flex-1">
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{
                      background: step > s.num ? "hsl(var(--goji-coral))" : step === s.num ? "hsl(var(--goji-coral))" : "hsl(var(--muted))",
                      scale: step === s.num ? 1.1 : 1,
                    }}
                    transition={{ duration: 0.2 }}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ color: step >= s.num ? "white" : "hsl(var(--muted-foreground))" }}
                  >
                    {step > s.num ? <Check className="w-4 h-4" /> : s.num}
                  </motion.div>
                  <span className={`text-xs font-bold whitespace-nowrap ${step >= s.num ? "text-foreground" : "text-muted-foreground"}`}>
                    {s.label}
                  </span>
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div className="flex-1 mx-3 h-0.5 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: "hsl(var(--goji-coral))" }}
                      animate={{ width: step > s.num ? "100%" : "0%" }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" variants={contentVariant} initial="hidden" animate="visible" exit="exit" className="space-y-5">
                <div>
                  <h3 className="text-base font-black text-foreground">Select Your Lead Source</h3>
                  <p className="text-sm text-muted-foreground mt-1">Choose an agent with predefined ICP or a list</p>
                </div>

                <div>
                  <p className="text-sm font-bold text-foreground mb-2">Lead Source Type</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { type: "agent" as const, icon: Bot, label: "AI Agent", desc: "Auto-discover leads" },
                      { type: "list" as const, icon: List, label: "List", desc: "From existing contacts" },
                    ].map((opt) => (
                      <motion.button
                        key={opt.type}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSourceType(opt.type)}
                        className={`flex items-center gap-3 py-4 px-4 rounded-xl border-2 text-left transition-all ${
                          sourceType === opt.type
                            ? "border-[hsl(var(--goji-coral))] bg-[hsl(var(--goji-coral))]/5 shadow-sm"
                            : "border-border hover:bg-muted/50"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                          sourceType === opt.type ? "bg-[hsl(var(--goji-coral))]/15" : "bg-muted"
                        }`}>
                          <opt.icon className={`w-5 h-5 transition-colors ${sourceType === opt.type ? "text-[hsl(var(--goji-coral))]" : "text-muted-foreground"}`} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">{opt.label}</p>
                          <p className="text-xs text-muted-foreground">{opt.desc}</p>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {sourceType === "agent" && (
                  <div>
                    <p className="text-sm font-bold text-foreground mb-2">AI Agent</p>
                    <div className="relative">
                      <select
                        value={selectedAgentId}
                        onChange={(e) => setSelectedAgentId(e.target.value)}
                        className="w-full border-2 border-[hsl(var(--goji-coral))]/30 rounded-xl px-4 py-3 text-sm bg-background focus:outline-none focus:border-[hsl(var(--goji-coral))] appearance-none text-foreground"
                      >
                        <option value="">Select an agent...</option>
                        {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>

                    {selectedAgent && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-4 rounded-xl border border-[hsl(var(--goji-coral))]/20 bg-[hsl(var(--goji-coral))]/5 p-4 space-y-3 overflow-hidden"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-[hsl(var(--goji-coral))]/20 flex items-center justify-center">
                            <Users className="w-4 h-4 text-[hsl(var(--goji-coral))]" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-foreground">Ideal Customer Profile</p>
                            <p className="text-xs text-muted-foreground">This agent targets the following profiles</p>
                          </div>
                        </div>
                        {[
                          { items: selectedAgent.icp_job_titles, icon: Briefcase, label: "Job Titles" },
                          { items: selectedAgent.icp_industries, icon: Building2, label: "Industries" },
                          { items: selectedAgent.icp_locations, icon: MapPin, label: "Locations" },
                          { items: selectedAgent.icp_company_sizes, icon: Users, label: "Company Sizes" },
                        ].filter(g => g.items?.length > 0).map((group) => (
                          <div key={group.label}>
                            <p className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-1"><group.icon className="w-3 h-3" /> {group.label}</p>
                            <div className="flex flex-wrap gap-1.5">
                              {group.items.map((t) => (
                                <span key={t} className="text-xs px-2.5 py-1 rounded-full border border-[hsl(var(--goji-coral))]/30 text-[hsl(var(--goji-coral))] bg-background font-medium">{t}</span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </div>
                )}

                {sourceType === "list" && (
                  <div>
                    <p className="text-sm font-bold text-foreground mb-2">Select List</p>
                    <div className="relative">
                      <select
                        value={selectedListId}
                        onChange={(e) => setSelectedListId(e.target.value)}
                        className="w-full border-2 border-[hsl(var(--goji-coral))]/30 rounded-xl px-4 py-3 text-sm bg-background focus:outline-none focus:border-[hsl(var(--goji-coral))] appearance-none text-foreground"
                      >
                        <option value="">Select a list...</option>
                        {lists.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" variants={contentVariant} initial="hidden" animate="visible" exit="exit" className="space-y-5">
                <div>
                  <h3 className="text-base font-black text-foreground">Campaign Details</h3>
                  <p className="text-sm text-muted-foreground mt-1">Tell us about your company and objectives</p>
                </div>

                <div>
                  <p className="text-sm font-bold text-foreground mb-2">Company Website</p>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yourcompany.com" className="pl-9 rounded-xl" />
                    </div>
                    <button
                      onClick={handleAnalyzeWebsite}
                      disabled={!website.trim() || analyzingWebsite}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-white rounded-full px-5 py-2.5 disabled:opacity-40 transition-all hover:scale-[1.03] active:scale-[0.97]"
                      style={{
                        background: "linear-gradient(135deg, hsl(var(--goji-coral)), hsl(var(--goji-orange)), #FDC94B, #C8D9FF)",
                        boxShadow: "0 4px 20px hsla(var(--goji-coral), 0.4)",
                      }}
                    >
                      {analyzingWebsite ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
                      ) : (
                        <><Sparkles className="w-4 h-4" /> AI Analyze</>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-bold text-foreground mb-2">Value Proposition</p>
                  <Textarea value={valueProposition} onChange={(e) => setValueProposition(e.target.value)} placeholder="Describe what your company does..." rows={3} className="rounded-xl" />
                  <p className="text-xs text-muted-foreground mt-1">Helps AI craft better personalized messages</p>
                </div>

                <div>
                  <p className="text-sm font-bold text-foreground mb-2">Pain Points</p>
                  <Textarea value={painPoints} onChange={(e) => setPainPoints(e.target.value)} placeholder="- Pain point 1&#10;- Pain point 2&#10;- Pain point 3" rows={3} className="rounded-xl" />
                </div>

                <div>
                  <p className="text-sm font-bold text-foreground mb-2">Campaign Goal</p>
                  <div className="space-y-2">
                    {CAMPAIGN_GOALS.map((g) => (
                      <motion.button
                        key={g.value}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setCampaignGoal(g.value)}
                        className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all ${
                          campaignGoal === g.value
                            ? "border-[hsl(var(--goji-coral))] bg-[hsl(var(--goji-coral))]/5 shadow-sm"
                            : "border-border hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{g.icon}</span>
                          <div>
                            <p className="text-sm font-bold text-foreground">{g.label}</p>
                            <p className="text-xs text-muted-foreground">{g.desc}</p>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-bold text-foreground mb-2">Message Tone</p>
                  <div className="grid grid-cols-3 gap-2">
                    {MESSAGE_TONES.map((t) => (
                      <motion.button
                        key={t.value}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setMessageTone(t.value)}
                        className={`text-center px-3 py-3.5 rounded-xl border-2 transition-all ${
                          messageTone === t.value
                            ? "border-[hsl(var(--goji-coral))] bg-[hsl(var(--goji-coral))]/5 shadow-sm"
                            : "border-border hover:bg-muted/50"
                        }`}
                      >
                        <t.icon className={`w-5 h-5 mx-auto mb-1.5 ${messageTone === t.value ? "text-[hsl(var(--goji-coral))]" : "text-muted-foreground"}`} />
                        <p className="text-sm font-bold text-foreground">{t.label}</p>
                        <p className="text-[10px] text-muted-foreground">{t.desc}</p>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" variants={contentVariant} initial="hidden" animate="visible" exit="exit" className="space-y-5">
                <div>
                  <h3 className="text-base font-black text-foreground">Select Your LinkedIn Sender</h3>
                  <p className="text-sm text-muted-foreground mt-1">Choose which LinkedIn account will send messages.</p>
                </div>

                <div className="rounded-xl border border-border p-5">
                  <p className="text-sm font-bold text-foreground mb-3">LinkedIn Accounts</p>
                  <div className="rounded-xl border-2 border-[hsl(var(--goji-coral))]/30 p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm">👤</div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-foreground">First account</p>
                      <p className="text-xs text-green-600 font-medium">Connected</p>
                    </div>
                    <div className="w-5 h-5 rounded-full border-2 border-[hsl(var(--goji-coral))] flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-[hsl(var(--goji-coral))]" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Cannot be modified after campaign creation</p>
                </div>

                {/* Review Summary */}
                <div className="rounded-xl border border-border bg-muted/20 p-5">
                  <h4 className="text-sm font-black text-foreground mb-3 flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" /> Review Summary
                  </h4>
                  <div className="space-y-2.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Source</span>
                      <span className="font-bold text-foreground">
                        {sourceType === "agent" ? (selectedAgent?.name || "Agent") : "List"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Goal</span>
                      <span className="font-bold text-foreground">{CAMPAIGN_GOALS.find(g => g.value === campaignGoal)?.label || campaignGoal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tone</span>
                      <span className="font-bold text-foreground capitalize">{messageTone}</span>
                    </div>
                    {website && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Website</span>
                        <span className="font-bold text-foreground truncate max-w-[200px]">{website}</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1.5 text-sm font-bold text-foreground border border-border rounded-xl px-4 py-2 hover:bg-muted/50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
          ) : (
            <button
              onClick={() => onOpenChange(false)}
              className="flex items-center gap-1.5 text-sm font-bold text-foreground border border-border rounded-xl px-4 py-2 hover:bg-muted/50 transition-colors"
            >
              Cancel
            </button>
          )}

          {step < totalSteps ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={step === 1 && !canNext1}
              className="btn-cta text-sm disabled:opacity-40"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={saving}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-white rounded-full px-5 py-2.5 disabled:opacity-50 transition-all hover:scale-[1.03] active:scale-[0.97]"
              style={{
                background: "linear-gradient(135deg, hsl(var(--goji-coral)), hsl(var(--goji-orange)), #FDC94B, #C8D9FF)",
                boxShadow: "0 4px 20px hsla(var(--goji-coral), 0.4)",
              }}
            >
              <Sparkles className="w-4 h-4" />
              {saving ? "Creating..." : editCampaignId ? "Save Changes" : "Generate My Campaign"}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

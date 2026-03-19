import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  X, ChevronRight, ChevronLeft, Bot, List, ChevronDown,
  Globe, Sparkles, Briefcase, MapPin, Building2, Users,
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
  { value: "conversations", label: "Start conversations with warm prospects", desc: "Build relationships and nurture leads through personalized conversations" },
  { value: "demos", label: "Book qualified sales calls/demos", desc: "Direct approach to schedule meetings and product demonstrations" },
];

const MESSAGE_TONES = [
  { value: "professional", label: "Professional", desc: "Formal, polished" },
  { value: "conversational", label: "Conversational", desc: "Friendly, casual" },
  { value: "direct", label: "Direct", desc: "Bold, confident" },
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

  // Step 3 (LinkedIn sender is always the connected account for now)

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
      const { data, error } = await supabase.functions.invoke("firecrawl-scrape", {
        body: { url: website.trim() },
      });
      if (error) throw error;
      if (data?.description) setValueProposition(data.description);
      if (data?.painPoints?.length) setPainPoints(data.painPoints.join("\n"));
      toast.success("Website analyzed!");
    } catch {
      toast.error("Failed to analyze website");
    }
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
  const canNext2 = true; // all fields optional
  const totalSteps = 3;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">
            {editCampaignId ? "Edit Campaign" : "Create AI Campaign"}
          </h2>
          <p className="text-sm text-muted-foreground">Step {step} of {totalSteps}</p>
          {/* Progress bar */}
          <div className="flex gap-1.5 mt-4">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} className="flex-1 h-1 rounded-full overflow-hidden bg-muted">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: i < step ? "100%" : "0%",
                    background: "hsl(var(--goji-coral))",
                  }}
                />
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
                  <h3 className="text-base font-bold text-foreground">Select Your Lead Source</h3>
                  <p className="text-sm text-muted-foreground mt-1">Choose an agent with predefined ICP or a list with custom ICP</p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-foreground mb-2">Lead Source Type</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setSourceType("agent")}
                      className={`flex items-center justify-center gap-2 py-3 rounded-lg border-2 text-sm font-semibold transition-colors ${
                        sourceType === "agent"
                          ? "border-[hsl(var(--goji-coral))] text-[hsl(var(--goji-coral))] bg-[hsl(var(--goji-coral))]/5"
                          : "border-border text-foreground hover:bg-muted/50"
                      }`}
                    >
                      <Bot className="w-4 h-4" /> AI Agent
                    </button>
                    <button
                      onClick={() => setSourceType("list")}
                      className={`flex items-center justify-center gap-2 py-3 rounded-lg border-2 text-sm font-semibold transition-colors ${
                        sourceType === "list"
                          ? "border-[hsl(var(--goji-coral))] text-[hsl(var(--goji-coral))] bg-[hsl(var(--goji-coral))]/5"
                          : "border-border text-foreground hover:bg-muted/50"
                      }`}
                    >
                      <List className="w-4 h-4" /> List
                    </button>
                  </div>
                </div>

                {sourceType === "agent" && (
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-2">AI Agent</p>
                    <div className="relative">
                      <select
                        value={selectedAgentId}
                        onChange={(e) => setSelectedAgentId(e.target.value)}
                        className="w-full border-2 border-[hsl(var(--goji-coral))]/30 rounded-lg px-4 py-3 text-sm bg-background focus:outline-none focus:border-[hsl(var(--goji-coral))] appearance-none text-foreground"
                      >
                        <option value="">Select an agent...</option>
                        {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>

                    {/* ICP Preview */}
                    {selectedAgent && (
                      <div className="mt-4 rounded-xl border border-[hsl(var(--goji-coral))]/20 bg-[hsl(var(--goji-coral))]/5 p-4 space-y-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-[hsl(var(--goji-coral))]/20 flex items-center justify-center">
                            <Users className="w-4 h-4 text-[hsl(var(--goji-coral))]" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-foreground">Ideal Customer Profile</p>
                            <p className="text-xs text-muted-foreground">This agent targets the following profiles</p>
                          </div>
                        </div>
                        {selectedAgent.icp_job_titles?.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1"><Briefcase className="w-3 h-3" /> Job Titles</p>
                            <div className="flex flex-wrap gap-1.5">
                              {selectedAgent.icp_job_titles.map((t) => (
                                <span key={t} className="text-xs px-2.5 py-1 rounded-full border border-[hsl(var(--goji-coral))]/30 text-[hsl(var(--goji-coral))] bg-background">{t}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {selectedAgent.icp_industries?.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1"><Building2 className="w-3 h-3" /> Industries</p>
                            <div className="flex flex-wrap gap-1.5">
                              {selectedAgent.icp_industries.map((t) => (
                                <span key={t} className="text-xs px-2.5 py-1 rounded-full border border-[hsl(var(--goji-coral))]/30 text-[hsl(var(--goji-coral))] bg-background">{t}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {selectedAgent.icp_locations?.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1"><MapPin className="w-3 h-3" /> Locations</p>
                            <div className="flex flex-wrap gap-1.5">
                              {selectedAgent.icp_locations.map((t) => (
                                <span key={t} className="text-xs px-2.5 py-1 rounded-full border border-[hsl(var(--goji-coral))]/30 text-[hsl(var(--goji-coral))] bg-background">{t}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {selectedAgent.icp_company_sizes?.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1"><Users className="w-3 h-3" /> Company Sizes</p>
                            <div className="flex flex-wrap gap-1.5">
                              {selectedAgent.icp_company_sizes.map((t) => (
                                <span key={t} className="text-xs px-2.5 py-1 rounded-full border border-[hsl(var(--goji-coral))]/30 text-[hsl(var(--goji-coral))] bg-background">{t}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {sourceType === "list" && (
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-2">Select List</p>
                    <div className="relative">
                      <select
                        value={selectedListId}
                        onChange={(e) => setSelectedListId(e.target.value)}
                        className="w-full border-2 border-[hsl(var(--goji-coral))]/30 rounded-lg px-4 py-3 text-sm bg-background focus:outline-none focus:border-[hsl(var(--goji-coral))] appearance-none text-foreground"
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
                  <h3 className="text-base font-bold text-foreground">Campaign Details</h3>
                  <p className="text-sm text-muted-foreground mt-1">Tell us about your company and campaign objectives</p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-foreground mb-2">Company Website</p>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://yourcompany.com"
                        className="pl-9"
                      />
                    </div>
                    <button
                      onClick={handleAnalyzeWebsite}
                      disabled={!website.trim() || analyzingWebsite}
                      className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40"
                      style={{ background: "hsl(var(--goji-coral))", color: "white" }}
                    >
                      {analyzingWebsite ? "..." : "AI Analyze"}
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-foreground mb-2">Value Proposition</p>
                  <Textarea
                    value={valueProposition}
                    onChange={(e) => setValueProposition(e.target.value)}
                    placeholder="Describe what your company does and the value you provide..."
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground mt-1">This helps AI craft better personalized messages</p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-foreground mb-2">Pain Points</p>
                  <Textarea
                    value={painPoints}
                    onChange={(e) => setPainPoints(e.target.value)}
                    placeholder="- Pain point 1&#10;- Pain point 2&#10;- Pain point 3"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Understanding pain points helps AI create more contextual and compelling messages</p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-foreground mb-2">Campaign Goal</p>
                  <div className="space-y-2">
                    {CAMPAIGN_GOALS.map((g) => (
                      <button
                        key={g.value}
                        onClick={() => setCampaignGoal(g.value)}
                        className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                          campaignGoal === g.value
                            ? "border-[hsl(var(--goji-coral))] bg-[hsl(var(--goji-coral))]/5"
                            : "border-border hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            campaignGoal === g.value ? "border-[hsl(var(--goji-coral))]" : "border-muted-foreground/40"
                          }`}>
                            {campaignGoal === g.value && <div className="w-2 h-2 rounded-full bg-[hsl(var(--goji-coral))]" />}
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
                        onClick={() => setMessageTone(t.value)}
                        className={`text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                          messageTone === t.value
                            ? "border-[hsl(var(--goji-coral))] bg-[hsl(var(--goji-coral))]/5"
                            : "border-border hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            messageTone === t.value ? "border-[hsl(var(--goji-coral))]" : "border-muted-foreground/40"
                          }`}>
                            {messageTone === t.value && <div className="w-2 h-2 rounded-full bg-[hsl(var(--goji-coral))]" />}
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
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" variants={contentVariant} initial="hidden" animate="visible" exit="exit" className="space-y-5">
                <div>
                  <h3 className="text-base font-bold text-foreground">Select Your LinkedIn Sender</h3>
                  <p className="text-sm text-muted-foreground mt-1">Choose which LinkedIn account will send messages for this campaign.</p>
                </div>

                <div className="rounded-xl border border-border p-5">
                  <p className="text-sm font-semibold text-foreground mb-3">LinkedIn Accounts</p>
                  <div className="relative">
                    <select className="w-full border-2 border-[hsl(var(--goji-coral))]/30 rounded-lg px-4 py-3 text-sm bg-background focus:outline-none focus:border-[hsl(var(--goji-coral))] appearance-none text-foreground">
                      <option>First account</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">The LinkedIn account cannot be modified once the campaign has been created</p>
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
              className="flex items-center gap-1.5 text-sm font-medium text-foreground border border-border rounded-lg px-4 py-2 hover:bg-muted/50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
          ) : (
            <button
              onClick={() => onOpenChange(false)}
              className="flex items-center gap-1.5 text-sm font-medium text-foreground border border-border rounded-lg px-4 py-2 hover:bg-muted/50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Cancel
            </button>
          )}

          {step < totalSteps ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={step === 1 && !canNext1}
              className="flex items-center gap-1.5 text-sm font-semibold text-white rounded-lg px-5 py-2 transition-colors disabled:opacity-40"
              style={{ background: "hsl(var(--goji-coral))" }}
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={saving}
              className="flex items-center gap-1.5 text-sm font-semibold text-white rounded-lg px-5 py-2 transition-colors disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, hsl(var(--goji-coral)), hsl(340 70% 60%))" }}
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

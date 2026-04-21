import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ChevronRight, ChevronLeft, Bot, List, ChevronDown,
  Globe, Sparkles, Briefcase, MapPin, Building2, Users, Check, Loader2,
  Target, Shield, Mic,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { scrapeWebsite } from "@/lib/api/firecrawl";

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
  { value: "conversations", label: "Start conversations", desc: "Build relationships and nurture leads" },
  { value: "demos", label: "Book sales calls/demos", desc: "Schedule meetings and demos" },
];

const MESSAGE_TONES = [
  { value: "professional", label: "Professional", desc: "Formal, polished", icon: Shield },
  { value: "conversational", label: "Conversational", desc: "Friendly, casual", icon: Mic },
  { value: "direct", label: "Direct", desc: "Bold, confident", icon: Target },
];

const DEFAULT_WORKFLOW = [
  { type: "invitation", message: "", delay_days: 0 },
  { type: "message", message: "", delay_days: 1, ai_icebreaker: true },
  { type: "message", message: "", delay_days: 2, ai_icebreaker: true },
  { type: "message", message: "", delay_days: 3, ai_icebreaker: true },
];

const STEP_LABELS = [
  { num: 1, label: "Lead Source" },
  { num: 2, label: "Campaign Details" },
  { num: 3, label: "LinkedIn Sender" },
];

export default function CreateCampaign() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editCampaignId = searchParams.get("edit");

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [analyzingWebsite, setAnalyzingWebsite] = useState(false);
  const [onboardingWebsiteLoaded, setOnboardingWebsiteLoaded] = useState(false);
  const [autoAnalyzed, setAutoAnalyzed] = useState(false);

  const { currentOrg } = useOrganization();
  const [sourceType, setSourceType] = useState<"agent" | "list">("agent");
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [lists, setLists] = useState<ListData[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [selectedListId, setSelectedListId] = useState("");

  const [website, setWebsite] = useState("");
  const [valueProposition, setValueProposition] = useState("");
  const [painPoints, setPainPoints] = useState("");
  const [campaignGoal, setCampaignGoal] = useState("conversations");
  const [messageTone, setMessageTone] = useState("professional");

  useEffect(() => {
    if (editCampaignId) {
      loadData().then(() => loadCampaign(editCampaignId));
    } else {
      loadData();
    }
  }, [editCampaignId]);

  useEffect(() => {
    if (step === 2 && onboardingWebsiteLoaded && !autoAnalyzed && website.trim() && !editCampaignId) {
      setAutoAnalyzed(true);
      handleAnalyzeWebsite();
    }
  }, [step, onboardingWebsiteLoaded, autoAnalyzed]);

  async function loadData() {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    const [agentsRes, listsRes, campaignsRes] = await Promise.all([
      supabase.from("signal_agents").select("id, name, icp_job_titles, icp_industries, icp_locations, icp_company_sizes, icp_company_types, leads_list_name").eq("user_id", user.id),
      (supabase.from("lists") as any).select("id, name").eq("user_id", user.id),
      supabase.from("campaigns").select("website, description").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1),
    ]);
    if (agentsRes.data) setAgents(agentsRes.data as AgentData[]);
    if (listsRes.data) setLists(listsRes.data as ListData[]);
    if (agentsRes.data?.length && !selectedAgentId && !editCampaignId) {
      setSelectedAgentId(agentsRes.data[0].id);
    }
    if (!editCampaignId && campaignsRes.data?.[0]?.website) {
      setWebsite(campaignsRes.data[0].website);
      setOnboardingWebsiteLoaded(true);
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

  async function handleAnalyzeWebsite() {
    if (!website.trim()) return;
    setAnalyzingWebsite(true);
    try {
      const scraped = await scrapeWebsite(website.trim());
      if (scraped.description) setValueProposition(scraped.description);
      const { data: painData, error: painErr } = await supabase.functions.invoke("generate-pain-points", {
        body: {
          companyName: scraped.companyName,
          industry: scraped.industry,
          description: scraped.description,
          jobTitles: [],
          targetIndustries: [],
        },
      });
      if (!painErr && painData?.painPoints?.length) {
        setPainPoints(painData.painPoints.join("\n"));
      }
      toast.success("Website analyzed!");
    } catch (err) {
      console.error("Analyze website error:", err);
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

    let workflowSteps = DEFAULT_WORKFLOW;
    try {
      toast.info("Generating AI outreach messages...");
      const { data: msgData, error: msgErr } = await supabase.functions.invoke("generate-outreach-messages", {
        body: {
          companyName: selectedAgent?.name || "My Company",
          valueProposition: valueProposition.trim(),
          painPoints: painPointsArr,
          campaignGoal,
          messageTone,
          industry: "",
          language: "",
        },
      });
      if (!msgErr && msgData?.steps?.length) {
        workflowSteps = msgData.steps;
      }
    } catch (err) {
      console.warn("AI message generation error:", err);
    }

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
      workflow_steps: workflowSteps,
    };

    if (editCampaignId) {
      const { error } = await supabase.from("campaigns").update(campaignData as any).eq("id", editCampaignId);
      if (error) { toast.error("Failed to update campaign"); setSaving(false); return; }
      toast.success("Campaign updated!");
      navigate(`/campaigns/${editCampaignId}`);
    } else {
      const { data, error } = await supabase.from("campaigns").insert(campaignData as any).select("id").single();
      if (error) {
        if (error.message.includes("LIMIT_REACHED")) toast.error("You've reached the campaign limit.");
        else toast.error("Failed to create campaign");
        setSaving(false); return;
      }
      toast.success("Campaign created with AI-generated messages!");
      navigate(`/campaigns/${data.id}`);
    }
    setSaving(false);
  }

  const selectedAgent = agents.find(a => a.id === selectedAgentId);
  const canNext1 = sourceType === "agent" ? !!selectedAgentId : !!selectedListId;
  const totalSteps = 3;

  return (
    <div className="min-h-screen bg-white rounded-2xl">
      {/* Page Header */}
      <div className="max-w-3xl mx-auto px-4 md:px-6 pt-8 pb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {editCampaignId ? "Edit Campaign" : "Create AI Campaign"}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">Step {step} of {totalSteps}</p>
          </div>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-0 mb-8">
          {STEP_LABELS.map((s, i) => (
            <div key={s.num} className="flex items-center flex-1">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    step > s.num
                      ? "bg-gray-900 text-white"
                      : step === s.num
                      ? "bg-gray-900 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {step > s.num ? <Check className="w-3.5 h-3.5" /> : s.num}
                </div>
                <span className={`text-xs whitespace-nowrap ${step >= s.num ? "text-gray-900 font-medium" : "text-gray-400"}`}>
                  {s.label}
                </span>
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div className="flex-1 mx-3 h-[2px] bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gray-900 rounded-full transition-all duration-300"
                    style={{ width: step > s.num ? "100%" : "0%" }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Content Card */}
        <div className="rounded-2xl border border-gray-200 shadow-sm overflow-hidden bg-[#f9f9fa]">
          <div className="p-6 md:p-8 max-h-[60vh] overflow-y-auto">
            {/* Step 1 */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Select Your Lead Source</h2>
                  <p className="text-sm text-gray-500 mt-1">Choose an agent with predefined ICP or a list</p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-3">Lead Source Type</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { type: "agent" as const, icon: Bot, label: "AI Agent", desc: "Auto-discover leads" },
                      { type: "list" as const, icon: List, label: "List", desc: "From existing contacts" },
                    ].map((opt) => (
                      <button
                        key={opt.type}
                        onClick={() => setSourceType(opt.type)}
                        className={`flex items-center gap-3 py-4 px-4 rounded-xl border text-left transition-all ${
                          sourceType === opt.type
                            ? "border-gray-900 bg-gray-50"
                            : "border-gray-200 bg-white"
                        }`}
                      >
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                          <opt.icon className="w-5 h-5 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{opt.label}</p>
                          <p className="text-xs text-gray-500">{opt.desc}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${sourceType === opt.type ? "border-gray-900" : "border-gray-300"}`}>
                          {sourceType === opt.type && <div className="w-2.5 h-2.5 rounded-full bg-gray-900" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {sourceType === "agent" && (
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-2">AI Agent</p>
                    <div className="relative">
                      <select
                        value={selectedAgentId}
                        onChange={(e) => setSelectedAgentId(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none appearance-none text-gray-900"
                      >
                        <option value="">Select an agent...</option>
                        {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>

                    {selectedAgent && (
                      <div className="mt-4 rounded-xl border border-gray-200 p-5 space-y-4 bg-white">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-gray-500" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">Ideal Customer Profile</p>
                            <p className="text-xs text-gray-500">This agent targets the following profiles</p>
                          </div>
                        </div>
                        {[
                          { items: selectedAgent.icp_job_titles, icon: Briefcase, label: "Job Titles" },
                          { items: selectedAgent.icp_industries, icon: Building2, label: "Industries" },
                          { items: selectedAgent.icp_locations, icon: MapPin, label: "Locations" },
                          { items: selectedAgent.icp_company_sizes, icon: Users, label: "Company Sizes" },
                        ].filter(g => g.items?.length > 0).map((group) => (
                          <div key={group.label}>
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <group.icon className="w-3.5 h-3.5 text-gray-400" /> <span className="text-xs font-medium text-gray-500">{group.label}</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {group.items.map((t) => (
                                <span key={t} className="bg-white border border-gray-200 text-xs text-gray-700 px-2.5 py-1 rounded-full">{t}</span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {sourceType === "list" && (
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-2">Select List</p>
                    <div className="relative">
                      <select
                        value={selectedListId}
                        onChange={(e) => setSelectedListId(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none appearance-none text-gray-900"
                      >
                        <option value="">Select a list...</option>
                        {lists.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Campaign Details</h2>
                  <p className="text-sm text-gray-500 mt-1">Tell us about your company and objectives</p>
                </div>

                {/* Website */}
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-2">Company Website</p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yourcompany.com" className="pl-9 border-gray-200 rounded-lg bg-white" />
                    </div>
                    <button onClick={handleAnalyzeWebsite} disabled={analyzingWebsite || !website.trim()} className="flex items-center gap-1.5 text-xs font-medium border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 disabled:opacity-40 transition-colors text-gray-700">
                      {analyzingWebsite ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing...</>
                      ) : (
                        <><Sparkles className="w-3.5 h-3.5" /> AI Analyze</>
                      )}
                    </button>
                  </div>
                </div>

                {/* Value Proposition */}
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-2">Value Proposition</p>
                  <Textarea value={valueProposition} onChange={(e) => setValueProposition(e.target.value)} placeholder="Describe what your company does..." rows={3} className="border-gray-200 rounded-lg bg-white" />
                </div>

                {/* Pain Points */}
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-2">Pain Points</p>
                  <Textarea value={painPoints} onChange={(e) => setPainPoints(e.target.value)} placeholder={"- Pain point 1\n- Pain point 2\n- Pain point 3"} rows={3} className="border-gray-200 rounded-lg bg-white" />
                </div>

                {/* Campaign Goal */}
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-3">Campaign Goal</p>
                  <div className="grid grid-cols-2 gap-3">
                    {CAMPAIGN_GOALS.map((g) => (
                      <button
                        key={g.value}
                        onClick={() => setCampaignGoal(g.value)}
                        className={`text-left px-4 py-4 rounded-xl border transition-all ${
                          campaignGoal === g.value
                            ? "border-gray-200 bg-white"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <p className="text-sm font-medium text-gray-900">{g.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{g.desc}</p>
                        <div className="mt-3 flex justify-end">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            campaignGoal === g.value ? "border-gray-900" : "border-gray-300"
                          }`}>
                            {campaignGoal === g.value && <div className="w-2.5 h-2.5 rounded-full bg-gray-900" />}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message Tone */}
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-3">Message Tone</p>
                  <div className="grid grid-cols-3 gap-3">
                    {MESSAGE_TONES.map((t) => (
                      <button
                        key={t.value}
                        onClick={() => setMessageTone(t.value)}
                        className={`text-center px-3 py-4 rounded-xl border transition-all ${
                          messageTone === t.value
                            ? "border-gray-200 bg-white"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <t.icon className={`w-5 h-5 mx-auto mb-2 ${messageTone === t.value ? "text-gray-900" : "text-gray-400"}`} />
                        <p className="text-sm font-medium text-gray-900">{t.label}</p>
                        <p className="text-[11px] text-gray-500">{t.desc}</p>
                        <div className="mt-2 flex justify-center">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            messageTone === t.value ? "border-gray-900" : "border-gray-300"
                          }`}>
                            {messageTone === t.value && <div className="w-2.5 h-2.5 rounded-full bg-gray-900" />}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Select Your LinkedIn Sender</h2>
                  <p className="text-sm text-gray-500 mt-1">Choose which LinkedIn account will send messages.</p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                  <p className="text-xs font-medium text-gray-500 mb-3">LinkedIn Accounts</p>
                  <div className="rounded-xl border border-gray-900 bg-white p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <Users className="w-5 h-5 text-gray-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">LinkedIn Account 1</p>
                      <p className="text-xs text-emerald-600 font-medium">Connected</p>
                    </div>
                    <div className="w-5 h-5 rounded-full border-2 border-gray-900 flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-gray-900" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Cannot be modified after campaign creation</p>
                </div>

                {/* Review Summary */}
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" /> Review Summary
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-500">Source</span>
                      <span className="font-medium text-gray-900">
                        {sourceType === "agent" ? (selectedAgent?.name || "Agent") : "List"}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-500">Goal</span>
                      <span className="font-medium text-gray-900">{CAMPAIGN_GOALS.find(g => g.value === campaignGoal)?.label || campaignGoal}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-500">Tone</span>
                      <span className="font-medium text-gray-900 capitalize">{messageTone}</span>
                    </div>
                    {website && (
                      <div className="flex justify-between py-2">
                        <span className="text-gray-500">Website</span>
                        <span className="font-medium text-gray-900 truncate max-w-[200px]">{website}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 md:px-8 py-4 border-t border-gray-200 flex items-center justify-between">
            {step > 1 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-1.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg px-4 py-2.5 hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
            ) : (
              <button
                onClick={() => navigate("/campaigns")}
                className="text-sm font-medium text-gray-700 border border-gray-200 rounded-lg px-4 py-2.5 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            )}

            {step < totalSteps ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={(step === 1 && !canNext1) || (step === 2 && (!website.trim() || !valueProposition.trim() || !painPoints.trim()))}
                className="flex items-center gap-1.5 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg px-5 py-2.5 disabled:opacity-40 transition-colors"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleCreate}
                disabled={saving}
                className="flex items-center gap-1.5 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg px-5 py-2.5 disabled:opacity-50 transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                {saving ? "Generating messages..." : editCampaignId ? "Save Changes" : "Generate My Campaign"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

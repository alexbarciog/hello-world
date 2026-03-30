import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  HelpCircle, Sparkles, ChevronDown, ChevronRight, X, Check, Search, Target,
  Info, Plus, ArrowLeft, Users, MessageSquare, ThumbsUp, UserPlus, Briefcase,
  TrendingUp, Building2, Eye,
} from "lucide-react";

interface CreateAgentWizardProps {
  onClose: () => void;
  onCreated: () => void;
  editAgentId?: string | null;
}

const INDUSTRIES = ["Technology", "Healthcare", "Finance", "Retail", "Manufacturing", "Education", "Real Estate", "Marketing", "Consulting", "SaaS"];
const COMPANY_TYPES = ["Startup", "SMB", "Mid-Market", "Enterprise", "Agency", "Non-Profit"];
const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"];
const LOCATIONS = ["United States", "United Kingdom", "Germany", "France", "Canada", "Australia", "Netherlands", "Spain", "Italy", "India"];

// ── Animation variants ──────────────────────────────────────────────────────
const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.38, ease, delay: i * 0.06 } }),
};

const contentVariant = {
  hidden: { opacity: 0, x: 12 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.32, ease } },
  exit: { opacity: 0, x: -12, transition: { duration: 0.18 } },
};

// ── Signal categories with sub-signals ─────────────────────────────────────
const SIGNAL_CATEGORIES = [
  {
    id: "you_company",
    title: "You & Your company",
    desc: "Detect people engaging with your company or your team",
    icon: <Building2 className="w-5 h-5" />,
    subSignals: [
      { id: "profile_viewers", label: "People who viewed your profile", icon: <Eye className="w-3.5 h-3.5" /> },
      { id: "company_followers", label: "New company page followers", icon: <UserPlus className="w-3.5 h-3.5" /> },
      { id: "post_engagers", label: "People who liked/commented your posts", icon: <ThumbsUp className="w-3.5 h-3.5" /> },
    ],
  },
  {
    id: "engagement",
    title: "Engagement & Interest",
    desc: "Find people who recently engaged with relevant content on LinkedIn",
    icon: <MessageSquare className="w-5 h-5" />,
    subSignals: [
      { id: "keyword_posts", label: "People posting about specific keywords", icon: <Search className="w-3.5 h-3.5" />, hasKeywords: true },
      { id: "hashtag_engagement", label: "People engaging with relevant hashtags", icon: <TrendingUp className="w-3.5 h-3.5" />, hasKeywords: true },
    ],
  },
  {
    id: "linkedin_profiles",
    title: "LinkedIn Profiles",
    desc: "Spot people engaging with relevant LinkedIn profiles in your niche",
    icon: <Users className="w-5 h-5" />,
    subSignals: [
      { id: "profile_engagers", label: "People engaging with specific profiles", icon: <ThumbsUp className="w-3.5 h-3.5" />, hasKeywords: true, keywordPlaceholder: "LinkedIn profile URL..." },
    ],
  },
  {
    id: "change_trigger",
    title: "Change & Trigger Events",
    desc: "Job changes, new hires, or funding announcements that suggest buying intent",
    icon: <Briefcase className="w-5 h-5" />,
    subSignals: [
      { id: "job_changes", label: "Recently changed jobs", icon: <Briefcase className="w-3.5 h-3.5" /> },
      { id: "new_hires", label: "Companies with new hires", icon: <UserPlus className="w-3.5 h-3.5" /> },
      { id: "funding_events", label: "Recently funded companies", icon: <TrendingUp className="w-3.5 h-3.5" /> },
    ],
  },
  {
    id: "competitors",
    title: "Companies & Competitors",
    desc: "Track leads following or interacting with competitors",
    icon: <Building2 className="w-5 h-5" />,
    subSignals: [
      { id: "competitor_followers", label: "People following competitor pages", icon: <Eye className="w-3.5 h-3.5" />, hasKeywords: true, keywordPlaceholder: "Competitor company page URL..." },
      { id: "competitor_engagers", label: "People engaging with competitor posts", icon: <ThumbsUp className="w-3.5 h-3.5" />, hasKeywords: true, keywordPlaceholder: "Competitor company page URL..." },
    ],
  },
];

// ── Shared input class ──────────────────────────────────────────────────────
const inputCls = "w-full border border-border rounded-xl px-3.5 py-2.5 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring/30 transition-shadow placeholder:text-muted-foreground/50";

export default function CreateAgentWizard({ onClose, onCreated, editAgentId }: CreateAgentWizardProps) {
  const [step, setStep] = useState(1);
  const [agentName, setAgentName] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [validationError, setValidationError] = useState("");

  // Step 1: ICP
  const [jobTitles, setJobTitles] = useState<string[]>([]);
  const [jobTitleInput, setJobTitleInput] = useState("");
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedCompanyTypes, setSelectedCompanyTypes] = useState<string[]>([]);
  const [selectedCompanySizes, setSelectedCompanySizes] = useState<string[]>([]);
  const [excludeKeywords, setExcludeKeywords] = useState<string[]>([]);
  const [excludeInput, setExcludeInput] = useState("");
  const [precisionMode, setPrecisionMode] = useState<"discovery" | "high_precision">("discovery");

  // Step 2: Signals
  const [enabledSignals, setEnabledSignals] = useState<Record<string, boolean>>({
    job_changes: true,
    keyword_posts: true,
  });
  const [signalKeywords, setSignalKeywords] = useState<Record<string, string[]>>({});
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [signalKeywordInputs, setSignalKeywordInputs] = useState<Record<string, string>>({});

  // Step 3: Leads
  const [leadsListName, setLeadsListName] = useState("");
  const [newListInput, setNewListInput] = useState("");
  const [showNewList, setShowNewList] = useState(false);
  const [existingLists, setExistingLists] = useState<string[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);

  // Dropdowns
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Load existing agent data when editing
  useEffect(() => {
    if (!editAgentId) return;
    async function loadAgent() {
      const { data } = await supabase.from("signal_agents").select("*").eq("id", editAgentId!).single();
      if (data) {
        setAgentName(data.name || "");
        setJobTitles(data.icp_job_titles || []);
        setSelectedLocations(data.icp_locations || []);
        setSelectedIndustries(data.icp_industries || []);
        setSelectedCompanyTypes(data.icp_company_types || []);
        setSelectedCompanySizes(data.icp_company_sizes || []);
        setExcludeKeywords(data.icp_exclude_keywords || []);
        setPrecisionMode((data.precision_mode as "discovery" | "high_precision") || "discovery");
        setLeadsListName(data.leads_list_name || "");
        const config = data.signals_config as { enabled?: string[]; keywords?: Record<string, string[]> } | null;
        if (config?.enabled) {
          const map: Record<string, boolean> = {};
          config.enabled.forEach((s: string) => { map[s] = true; });
          setEnabledSignals(map);
        }
        if (config?.keywords) setSignalKeywords(config.keywords);
      }
    }
    loadAgent();
  }, [editAgentId]);

  // Load existing lists from contacts
  useEffect(() => {
    async function loadLists() {
      setLoadingLists(true);
      const { data } = await supabase.from("contacts").select("list_name");
      if (data) {
        const unique = [...new Set(data.map((c) => c.list_name).filter(Boolean))] as string[];
        setExistingLists(unique);
      }
      setLoadingLists(false);
    }
    loadLists();
  }, []);

  function addJobTitle() {
    const v = jobTitleInput.trim();
    if (v && !jobTitles.includes(v)) { setJobTitles([...jobTitles, v]); setJobTitleInput(""); }
  }

  function addExclude() {
    const v = excludeInput.trim();
    if (v && !excludeKeywords.includes(v)) { setExcludeKeywords([...excludeKeywords, v]); setExcludeInput(""); }
  }

  function toggleInArray(arr: string[], val: string, setter: (a: string[]) => void) {
    setter(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  }

  function toggleSubSignal(id: string) {
    setEnabledSignals((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function addSignalKeyword(signalId: string) {
    const input = signalKeywordInputs[signalId]?.trim();
    if (!input) return;
    const current = signalKeywords[signalId] || [];
    if (!current.includes(input)) {
      setSignalKeywords({ ...signalKeywords, [signalId]: [...current, input] });
    }
    setSignalKeywordInputs({ ...signalKeywordInputs, [signalId]: "" });
  }

  // ── ICP Validation ────────────────────────────────────────────────────────
  function validateICP(): boolean {
    if (jobTitles.length === 0) { setValidationError("Add at least one target job title"); return false; }
    if (selectedLocations.length === 0) { setValidationError("Select at least one target location"); return false; }
    if (selectedIndustries.length === 0) { setValidationError("Select at least one target industry"); return false; }
    setValidationError("");
    return true;
  }

  function handleNext() {
    if (step === 1 && !validateICP()) return;
    if (step < 3) setStep(step + 1);
    else handleCreate();
  }

  async function generateWithAI() {
    setAiLoading(true);
    try {
      const sessionId = localStorage.getItem("goji_session_id");
      let businessContext: any = {};
      if (sessionId) {
        const { data: campaign } = await supabase.from("campaigns").select("*").eq("session_id", sessionId).order("updated_at", { ascending: false }).limit(1).single();
        if (campaign) {
          businessContext = {
            website: campaign.website, companyName: campaign.company_name, industry: campaign.industry,
            country: campaign.country, language: campaign.language, description: campaign.description,
            painPoints: campaign.pain_points, campaignGoal: campaign.campaign_goal,
            icpJobTitles: campaign.icp_job_titles, icpIndustries: campaign.icp_industries,
            icpCompanyTypes: campaign.icp_company_types, icpCompanySizes: campaign.icp_company_sizes,
            icpLocations: campaign.icp_locations, icpExcludeKeywords: campaign.icp_exclude_keywords,
          };
        }
      }
      const { data, error } = await supabase.functions.invoke("generate-agent-icp", { body: { agentName, ...businessContext } });
      if (error) throw error;
      if (data.job_titles) setJobTitles(data.job_titles);
      if (data.locations) setSelectedLocations(data.locations);
      if (data.industries) setSelectedIndustries(data.industries);
      if (data.company_types) setSelectedCompanyTypes(data.company_types);
      if (data.company_sizes) setSelectedCompanySizes(data.company_sizes);
      if (data.exclude_keywords) setExcludeKeywords(data.exclude_keywords);
      setValidationError("");
      toast.success("ICP generated with AI!");
    } catch (e) {
      console.error("AI generation failed:", e);
      toast.error("Failed to generate ICP");
    }
    setAiLoading(false);
  }

  // ── Create list in DB ─────────────────────────────────────────────────────
  async function createNewList() {
    const name = newListInput.trim();
    if (!name) return;
    setLeadsListName(name);
    if (!existingLists.includes(name)) {
      setExistingLists([...existingLists, name]);
    }
    setNewListInput("");
    setShowNewList(false);
    toast.success(`List "${name}" ready`);
  }

  // ── Final agent creation ──────────────────────────────────────────────────
  async function handleCreate() {
    setSaving(true);
    if (!agentName.trim()) { setSaving(false); toast.error("Please enter an agent name"); return; }
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) { setSaving(false); toast.error("Not authenticated"); return; }

    const activeSubSignals = Object.entries(enabledSignals).filter(([, v]) => v).map(([k]) => k);

    const agentData = {
      name: agentName || "My Agent",
      agent_type: "signals",
      keywords: jobTitles,
      icp_job_titles: jobTitles,
      icp_locations: selectedLocations,
      icp_industries: selectedIndustries,
      icp_company_types: selectedCompanyTypes,
      icp_company_sizes: selectedCompanySizes,
      icp_exclude_keywords: excludeKeywords,
      precision_mode: precisionMode,
      signals_config: {
        enabled: activeSubSignals,
        keywords: signalKeywords,
      },
      leads_list_name: leadsListName || null,
    };

    let error;
    let newAgentId: string | null = null;
    if (editAgentId) {
      ({ error } = await supabase.from("signal_agents").update(agentData).eq("id", editAgentId));
    } else {
      const { data: inserted, error: insertErr } = await supabase.from("signal_agents").insert({
        ...agentData,
        user_id: user.id,
        status: "active",
        last_launched_at: new Date().toISOString(),
      }).select("id").single();
      error = insertErr;
      newAgentId = inserted?.id || null;
    }

    setSaving(false);
    if (error) {
      if (error.message?.includes("LIMIT_REACHED")) {
        toast.error("You've reached the maximum of 2 signal agents");
      } else {
        toast.error(editAgentId ? "Failed to update agent" : "Failed to create agent");
      }
      return;
    }
    toast.success(editAgentId ? "Agent updated successfully!" : "Agent created — hunting for leads now! 🚀");
    onCreated();
    onClose();

    // Trigger immediate processing for new agents (fire-and-forget)
    if (newAgentId) {
      supabase.functions.invoke("process-signal-agents", {
        body: { agent_id: newAgentId },
      }).then(({ error: fnErr }) => {
        if (fnErr) console.error("Immediate agent processing failed:", fnErr);
        else {
          toast.success("Your agent just finished its first run — check your leads!");
          onCreated(); // refresh to show results
        }
      });
    }
  }

  const totalEnabledSignals = Object.values(enabledSignals).filter(Boolean).length;

  // ── Dropdown multi-select ─────────────────────────────────────────────────
  function DropdownMulti({
    id, label, placeholder, options, selected, setSelected, required,
  }: {
    id: string; label: string; placeholder: string; options: string[];
    selected: string[]; setSelected: (v: string[]) => void; required?: boolean;
  }) {
    const isOpen = openDropdown === id;
    return (
      <div>
        <label className="block text-xs font-semibold text-foreground mb-1.5">
          {label} {required && <span className="text-destructive">*</span>}
        </label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenDropdown(isOpen ? null : id)}
            className={`${inputCls} flex items-center justify-between text-left`}
          >
            <span className={selected.length ? "text-foreground" : "text-muted-foreground/50"}>
              {selected.length ? selected.join(", ") : placeholder}
            </span>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </button>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute z-20 mt-1 w-full bg-card border border-border rounded-xl shadow-lg max-h-48 overflow-y-auto"
            >
              {options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggleInArray(selected, opt, setSelected)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/50 text-left transition-colors"
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                    selected.includes(opt) ? "bg-foreground border-foreground" : "border-border"
                  }`}>
                    {selected.includes(opt) && <Check className="w-3 h-3 text-background" />}
                  </div>
                  <span className="text-foreground">{opt}</span>
                </button>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  // ── Step indicators ───────────────────────────────────────────────────────
  const steps = [
    { num: 1, label: "ICP", sub: "Ideal Customer Profile" },
    { num: 2, label: "Signals", sub: "Intent Signals" },
    { num: 3, label: "Leads", sub: "Leads Management" },
  ];

  return (
    <div className="min-h-full p-4 md:p-8" onClick={() => openDropdown && setOpenDropdown(null)}>
      {/* Header */}
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible" className="flex items-center gap-3 mb-1">
        <h1 className="text-lg md:text-2xl font-bold text-foreground whitespace-nowrap">Create AI Agent</h1>
        <input
          value={agentName}
          onChange={(e) => setAgentName(e.target.value)}
          placeholder="Agent Name"
          className="text-base md:text-2xl font-light text-muted-foreground bg-transparent border-b border-border focus:border-foreground outline-none px-1 py-0.5 min-w-0 flex-1 placeholder:text-muted-foreground/40 transition-colors"
        />
        <button onClick={onClose} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-5 h-5" />
        </button>
      </motion.div>
      <motion.p custom={1} variants={fadeUp} initial="hidden" animate="visible" className="text-xs md:text-sm text-muted-foreground mb-5 md:mb-8">
        The agent will browse the internet looking for leads
      </motion.p>

      {/* ── Progress bar (mobile) ────────────────────────────────────────── */}
      <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible" className="md:hidden mb-5">
        <div className="flex items-center gap-0 bg-muted/40 rounded-2xl p-1">
          {steps.map((s, i) => {
            const isActive = step === s.num;
            const isDone = step > s.num;
            return (
              <button
                key={s.num}
                onClick={() => isDone && setStep(s.num)}
                disabled={!isDone && !isActive}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-foreground text-background shadow-sm"
                    : isDone
                    ? "text-foreground/60 cursor-pointer hover:bg-muted/60"
                    : "text-muted-foreground/50 cursor-default"
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                  isDone ? "bg-foreground/20" : isActive ? "bg-background/20" : "bg-muted"
                }`}>
                  {isDone ? <Check className="w-3 h-3" /> : s.num}
                </span>
                {s.label}
              </button>
            );
          })}
        </div>
      </motion.div>

      <div className="flex gap-6 md:gap-8">
        {/* Left sidebar - Steps (desktop only) */}
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible" className="hidden md:block w-[220px] shrink-0">
          <div className="border border-border rounded-2xl p-3 space-y-1.5">
            {steps.map((s) => {
              const isActive = step === s.num;
              const isDone = step > s.num;
              return (
                <button
                  key={s.num}
                  onClick={() => isDone && setStep(s.num)}
                  className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all ${
                    isActive ? "shadow-sm" : isDone ? "hover:bg-muted/50 cursor-pointer" : "opacity-50"
                  }`}
                  style={isActive ? { background: "hsl(220 20% 96%)", border: "1px solid hsl(220 20% 90%)" } : undefined}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${
                    isDone ? "bg-foreground text-background" : isActive ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
                  }`}>
                    {isDone ? <Check className="w-4 h-4" /> : s.num}
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${isActive || isDone ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</p>
                    <p className="text-xs text-muted-foreground">{s.sub}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Right content */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {/* ── Step 1: ICP ──────────────────────────────────────────── */}
            {step === 1 && (
              <motion.div key="step1" variants={contentVariant} initial="hidden" animate="visible" exit="exit">
                <div className="border border-border rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-foreground mb-1">Define Your Ideal Customer Profile</h2>
                      <p className="text-sm text-muted-foreground">Configure who your AI agent should target. <span className="text-destructive">*</span> = required</p>
                    </div>
                    <button
                      onClick={generateWithAI}
                      disabled={aiLoading}
                      className="inline-flex items-center gap-2 text-sm font-medium text-white rounded-full px-5 py-2.5 disabled:opacity-60 transition-all hover:scale-[1.03] active:scale-[0.97]"
                      style={{
                        background: "linear-gradient(135deg, hsl(var(--goji-coral)), hsl(var(--goji-orange)), #FDC94B, #C8D9FF)",
                        boxShadow: "0 4px 20px hsla(var(--goji-coral), 0.4)",
                      }}
                    >
                      {aiLoading ? (
                        <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      Generate with AI
                    </button>
                  </div>

                  {/* Validation error */}
                  <AnimatePresence>
                    {validationError && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-4 px-4 py-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-sm font-medium text-destructive"
                      >
                        {validationError}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    {/* Job titles */}
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">
                        Target Job Titles <span className="text-destructive">*</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          value={jobTitleInput}
                          onChange={(e) => setJobTitleInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addJobTitle())}
                          placeholder="e.g., Sales Manager"
                          className={`flex-1 ${inputCls}`}
                        />
                        <button onClick={addJobTitle} className="text-sm font-medium text-foreground hover:text-foreground/70 px-3 transition-colors">
                          Add
                        </button>
                      </div>
                      {jobTitles.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {jobTitles.map((t) => (
                            <motion.span
                              key={t}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="inline-flex items-center gap-1 text-xs font-medium bg-muted text-foreground border border-border rounded-full px-2.5 py-1"
                            >
                              {t}
                              <button onClick={() => setJobTitles(jobTitles.filter((x) => x !== t))} className="hover:text-destructive">
                                <X className="w-3 h-3" />
                              </button>
                            </motion.span>
                          ))}
                        </div>
                      )}
                    </div>

                    <DropdownMulti id="locations" label="Target Locations" placeholder="Select locations..." options={LOCATIONS} selected={selectedLocations} setSelected={setSelectedLocations} required />
                    <DropdownMulti id="industries" label="Target Industries" placeholder="Select industries..." options={INDUSTRIES} selected={selectedIndustries} setSelected={setSelectedIndustries} required />
                    <DropdownMulti id="company_types" label="Company Types" placeholder="Select company types..." options={COMPANY_TYPES} selected={selectedCompanyTypes} setSelected={setSelectedCompanyTypes} />
                    <DropdownMulti id="company_sizes" label="Company Sizes" placeholder="Select company sizes..." options={COMPANY_SIZES} selected={selectedCompanySizes} setSelected={setSelectedCompanySizes} />

                    {/* Exclude */}
                    <div>
                      <label className="flex items-center gap-1 text-xs font-semibold text-foreground mb-1.5">
                        Exclude keywords
                        <Info className="w-3.5 h-3.5 text-muted-foreground" />
                      </label>
                      <div className="flex gap-2">
                        <input
                          value={excludeInput}
                          onChange={(e) => setExcludeInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addExclude())}
                          placeholder="e.g., Google"
                          className={`flex-1 ${inputCls}`}
                        />
                        <button onClick={addExclude} className="text-sm font-medium text-foreground hover:text-foreground/70 px-3 transition-colors">
                          Add
                        </button>
                      </div>
                      {excludeKeywords.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {excludeKeywords.map((k) => (
                            <span key={k} className="inline-flex items-center gap-1 text-xs font-medium bg-muted text-foreground border border-border rounded-full px-2.5 py-1">
                              {k}
                              <button onClick={() => setExcludeKeywords(excludeKeywords.filter((x) => x !== k))} className="hover:text-destructive">
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Lead Matching Mode */}
                  <div className="mt-6">
                    <label className="flex items-center gap-1 text-xs font-semibold text-foreground mb-3">
                      Lead Matching Mode
                      <Info className="w-3.5 h-3.5 text-muted-foreground" />
                    </label>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setPrecisionMode("discovery")} className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${precisionMode === "discovery" ? "text-blue-600" : "text-muted-foreground"}`}>
                        <Search className="w-4 h-4" /> Discovery
                      </button>
                      <div
                        onClick={() => setPrecisionMode(precisionMode === "discovery" ? "high_precision" : "discovery")}
                        className="w-10 h-5 rounded-full cursor-pointer transition-colors relative"
                        style={{ background: precisionMode === "high_precision" ? "hsl(var(--goji-orange))" : "#3B82F6" }}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${precisionMode === "high_precision" ? "translate-x-5" : "translate-x-0.5"}`} />
                      </div>
                      <button onClick={() => setPrecisionMode("high_precision")} className="flex items-center gap-1.5 text-sm font-medium transition-colors" style={{ color: precisionMode === "high_precision" ? "hsl(var(--goji-orange))" : "hsl(var(--muted-foreground))" }}>
                        High Precision <Target className="w-4 h-4" />
                      </button>
                    </div>
                    <div
                      className="mt-2 border rounded-xl px-3 py-2 transition-colors"
                      style={{
                        background: precisionMode === "discovery" ? "rgba(59,130,246,0.08)" : "hsla(var(--goji-orange), 0.08)",
                        borderColor: precisionMode === "discovery" ? "rgba(59,130,246,0.2)" : "hsla(var(--goji-orange), 0.2)",
                      }}
                    >
                      <p className="text-xs font-semibold transition-colors" style={{ color: precisionMode === "discovery" ? "#3B82F6" : "hsl(var(--goji-orange))" }}>
                        {precisionMode === "discovery" ? "Broader ICP – More leads" : "Narrow ICP – Fewer, better leads"}
                      </p>
                      <p className="text-xs transition-colors" style={{ color: precisionMode === "discovery" ? "rgba(59,130,246,0.7)" : "hsla(var(--goji-orange), 0.7)" }}>
                        {precisionMode === "discovery"
                          ? "Finds opportunities you wouldn't normally target"
                          : "Only matches leads that closely fit your exact criteria"}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Step 2: Signals ──────────────────────────────────────── */}
            {step === 2 && (
              <motion.div key="step2" variants={contentVariant} initial="hidden" animate="visible" exit="exit">
                <div className="border border-border rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-xl font-bold text-foreground">Configure Intent Signals</h2>
                    <span className="text-xs font-medium text-muted-foreground bg-muted border border-border rounded-full px-2.5 py-1">
                      {totalEnabledSignals} signals active
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">Enable the signals your agent should monitor. Expand each category to configure.</p>

                  <div className="space-y-3">
                    {SIGNAL_CATEGORIES.map((cat, catIdx) => {
                      const isExpanded = expandedCategory === cat.id;
                      const activeSubs = cat.subSignals.filter((s) => enabledSignals[s.id]).length;

                      return (
                        <motion.div
                          key={cat.id}
                          custom={catIdx}
                          variants={fadeUp}
                          initial="hidden"
                          animate="visible"
                          className="border border-border rounded-xl overflow-hidden transition-colors"
                        >
                          {/* Category header */}
                          <button
                            onClick={() => setExpandedCategory(isExpanded ? null : cat.id)}
                            className={`w-full flex items-center gap-4 p-4 text-left transition-colors ${isExpanded ? "bg-muted/50" : "hover:bg-muted/30"}`}
                          >
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground shrink-0">
                              {cat.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm text-foreground">{cat.title}</span>
                                {activeSubs > 0 && (
                                  <span className="text-[10px] font-bold bg-foreground text-background rounded-full w-5 h-5 flex items-center justify-center">
                                    {activeSubs}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">{cat.desc}</p>
                            </div>
                            <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                          </button>

                          {/* Expanded sub-signals */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25, ease }}
                                className="overflow-hidden"
                              >
                                <div className="px-4 pb-4 space-y-2 border-t border-border pt-3">
                                  {cat.subSignals.map((sub, subIdx) => (
                                    <motion.div
                                      key={sub.id}
                                      initial={{ opacity: 0, y: 6 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ delay: subIdx * 0.05, duration: 0.2 }}
                                      className={`rounded-xl p-3 border transition-colors ${enabledSignals[sub.id] ? "border-foreground/20 bg-muted/40" : "border-border"}`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                          <span className="text-muted-foreground">{sub.icon}</span>
                                          <span className="text-sm font-medium text-foreground">{sub.label}</span>
                                        </div>
                                        <div
                                          onClick={() => toggleSubSignal(sub.id)}
                                          className={`w-9 h-5 rounded-full cursor-pointer transition-colors relative ${enabledSignals[sub.id] ? "bg-foreground" : "bg-border"}`}
                                        >
                                          <div className={`absolute top-0.5 w-4 h-4 bg-background rounded-full shadow transition-transform ${enabledSignals[sub.id] ? "translate-x-4" : "translate-x-0.5"}`} />
                                        </div>
                                      </div>

                                      {/* Keyword input for signals that need it */}
                                      {sub.hasKeywords && enabledSignals[sub.id] && (
                                        <motion.div
                                          initial={{ opacity: 0, height: 0 }}
                                          animate={{ opacity: 1, height: "auto" }}
                                          className="mt-2.5"
                                        >
                                          <div className="flex gap-2">
                                            <input
                                              value={signalKeywordInputs[sub.id] || ""}
                                              onChange={(e) => setSignalKeywordInputs({ ...signalKeywordInputs, [sub.id]: e.target.value })}
                                              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSignalKeyword(sub.id))}
                                              placeholder={sub.keywordPlaceholder || "Add keyword..."}
                                              className={`flex-1 ${inputCls} !py-1.5 !text-xs`}
                                            />
                                            <button onClick={() => addSignalKeyword(sub.id)} className="text-xs font-medium text-foreground px-2">Add</button>
                                          </div>
                                          {(signalKeywords[sub.id] || []).length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-1.5">
                                              {signalKeywords[sub.id].map((kw) => (
                                                <span key={kw} className="inline-flex items-center gap-1 text-[11px] font-medium bg-muted text-foreground rounded-full px-2 py-0.5">
                                                  {kw}
                                                  <button onClick={() => setSignalKeywords({ ...signalKeywords, [sub.id]: signalKeywords[sub.id].filter((x) => x !== kw) })}>
                                                    <X className="w-2.5 h-2.5" />
                                                  </button>
                                                </span>
                                              ))}
                                            </div>
                                          )}
                                        </motion.div>
                                      )}
                                    </motion.div>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Step 3: Leads ────────────────────────────────────────── */}
            {step === 3 && (
              <motion.div key="step3" variants={contentVariant} initial="hidden" animate="visible" exit="exit">
                <div className="border border-border rounded-2xl p-6">
                  <h2 className="text-xl font-bold text-foreground mb-1">Leads Management</h2>
                  <p className="text-sm text-muted-foreground mb-6">Configure how leads will be organized when found by the AI agent.</p>

                  <div className="border border-border rounded-xl p-5">
                    <p className="font-semibold text-sm text-foreground mb-1">Automatically add found leads to list</p>
                    <p className="text-xs text-muted-foreground mb-4">Lists help you organize contacts and launch outreach campaigns more easily.</p>

                    <label className="block text-xs font-semibold text-foreground mb-2">Select list</label>
                    <div className="flex gap-3">
                      <select
                        value={leadsListName}
                        onChange={(e) => setLeadsListName(e.target.value)}
                        className={`flex-1 ${inputCls}`}
                      >
                        <option value="">Select a list...</option>
                        {existingLists.map((name) => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => setShowNewList(true)}
                        className="flex items-center gap-1.5 text-sm font-medium text-foreground border border-border rounded-xl px-4 py-2.5 hover:bg-muted transition-colors whitespace-nowrap"
                      >
                        <Plus className="w-4 h-4" />
                        Create new list
                      </button>
                    </div>

                    <AnimatePresence>
                      {showNewList && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 flex gap-2"
                        >
                          <input
                            value={newListInput}
                            onChange={(e) => setNewListInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), createNewList())}
                            placeholder="Enter list name..."
                            className={`flex-1 ${inputCls}`}
                          />
                          <button onClick={createNewList} className="btn-cta text-sm !py-2">
                            Create
                          </button>
                          <button onClick={() => setShowNewList(false)} className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                            Cancel
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {leadsListName && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-3 flex items-center gap-2 text-sm text-foreground"
                      >
                        <Check className="w-4 h-4" />
                        <span>Leads will be added to: <strong>{leadsListName}</strong></span>
                      </motion.div>
                    )}

                    <p className="text-xs text-muted-foreground mt-4">
                      After creating the agent, you can launch an outreach campaign for this list.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer navigation */}
      <motion.div
        custom={3}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="flex items-center justify-between mt-6 md:mt-8 pt-4 border-t border-border gap-3"
      >
        <div>
          {step > 1 && (
            <button
              onClick={() => { setStep(step - 1); setValidationError(""); }}
              className="flex items-center gap-1.5 px-3 md:px-4 py-2.5 text-sm font-medium text-muted-foreground border border-border rounded-xl hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Previous</span>
            </button>
          )}
        </div>
        <button
          onClick={handleNext}
          disabled={saving}
          className="btn-cta text-sm disabled:opacity-60 flex-1 sm:flex-none justify-center"
        >
          {saving ? (
            <span className="animate-spin w-4 h-4 border-2 border-background border-t-transparent rounded-full" />
          ) : step === 1 ? (
            <>Configure Signals <ChevronRight className="w-4 h-4" /></>
          ) : step === 2 ? (
            <>Leads Management <ChevronRight className="w-4 h-4" /></>
          ) : (
            <>{editAgentId ? "Update Agent" : "Create Agent"} <ChevronRight className="w-4 h-4" /></>
          )}
        </button>
      </motion.div>
    </div>
  );
}

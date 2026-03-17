import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  HelpCircle, Sparkles, ChevronDown, ChevronRight, X, Check, Search, Target,
  Info, Plus, ArrowLeft,
} from "lucide-react";

interface CreateAgentWizardProps {
  onClose: () => void;
  onCreated: () => void;
}

const INDUSTRIES = ["Technology", "Healthcare", "Finance", "Retail", "Manufacturing", "Education", "Real Estate", "Marketing", "Consulting", "SaaS"];
const COMPANY_TYPES = ["Startup", "SMB", "Mid-Market", "Enterprise", "Agency", "Non-Profit"];
const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"];
const LOCATIONS = ["United States", "United Kingdom", "Germany", "France", "Canada", "Australia", "Netherlands", "Spain", "Italy", "India"];

const SIGNAL_CATEGORIES = [
  {
    id: "you_company",
    title: "You & Your company",
    desc: "Detect people engaging with your company or your team",
    emoji: "🍊",
  },
  {
    id: "engagement",
    title: "Engagement & Interest",
    desc: "Find people who recently engaged with relevant content on LinkedIn",
    emoji: "🍊",
  },
  {
    id: "linkedin_profiles",
    title: "LinkedIn Profiles",
    desc: "Spot people engaging with relevant LinkedIn profiles in your niche — in real time",
    emoji: "🍊",
  },
  {
    id: "change_trigger",
    title: "Change & Trigger Events",
    desc: "Job changes, new hires, or funding announcements that suggest buying intent",
    emoji: "🍊",
    count: 2,
  },
  {
    id: "competitors",
    title: "Companies & Competitors Engagement",
    desc: "Track Leads following or interacting with competitors or other companies",
    emoji: "🍊",
  },
];

export default function CreateAgentWizard({ onClose, onCreated }: CreateAgentWizardProps) {
  const [step, setStep] = useState(1);
  const [agentName, setAgentName] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

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
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Step 2: Signals
  const [enabledSignals, setEnabledSignals] = useState<string[]>(["change_trigger", "engagement"]);

  // Step 3: Leads
  const [leadsListName, setLeadsListName] = useState("");
  const [newListInput, setNewListInput] = useState("");
  const [showNewList, setShowNewList] = useState(false);

  // Dropdowns
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);

  function addJobTitle() {
    const v = jobTitleInput.trim();
    if (v && !jobTitles.includes(v)) {
      setJobTitles([...jobTitles, v]);
      setJobTitleInput("");
    }
  }

  function addExclude() {
    const v = excludeInput.trim();
    if (v && !excludeKeywords.includes(v)) {
      setExcludeKeywords([...excludeKeywords, v]);
      setExcludeInput("");
    }
  }

  function toggleInArray(arr: string[], val: string, setter: (a: string[]) => void) {
    setter(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  }

  async function generateWithAI() {
    setAiLoading(true);
    try {
      // Fetch onboarding business data from the user's campaign
      const sessionId = localStorage.getItem("goji_session_id");
      let businessContext: any = {};
      if (sessionId) {
        const { data: campaign } = await supabase
          .from("campaigns")
          .select("*")
          .eq("session_id", sessionId)
          .order("updated_at", { ascending: false })
          .limit(1)
          .single();
        if (campaign) {
          businessContext = {
            website: campaign.website,
            companyName: campaign.company_name,
            industry: campaign.industry,
            country: campaign.country,
            language: campaign.language,
            description: campaign.description,
            painPoints: campaign.pain_points,
            campaignGoal: campaign.campaign_goal,
            icpJobTitles: campaign.icp_job_titles,
            icpIndustries: campaign.icp_industries,
            icpCompanyTypes: campaign.icp_company_types,
            icpCompanySizes: campaign.icp_company_sizes,
            icpLocations: campaign.icp_locations,
            icpExcludeKeywords: campaign.icp_exclude_keywords,
            precisionMode: campaign.precision_mode,
            engagementKeywords: campaign.engagement_keywords,
          };
        }
      }

      const { data, error } = await supabase.functions.invoke("generate-agent-icp", {
        body: { agentName, ...businessContext },
      });
      if (error) throw error;
      if (data.job_titles) setJobTitles(data.job_titles);
      if (data.locations) setSelectedLocations(data.locations);
      if (data.industries) setSelectedIndustries(data.industries);
      if (data.company_types) setSelectedCompanyTypes(data.company_types);
      if (data.company_sizes) setSelectedCompanySizes(data.company_sizes);
      if (data.exclude_keywords) setExcludeKeywords(data.exclude_keywords);
    } catch (e) {
      console.error("AI generation failed:", e);
    }
    setAiLoading(false);
  }

  async function handleCreate() {
    setSaving(true);
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) { setSaving(false); return; }

    const { error } = await supabase.from("signal_agents").insert({
      user_id: user.id,
      name: agentName || "My Agent",
      agent_type: "signals",
      keywords: jobTitles,
      status: "active",
      last_launched_at: new Date().toISOString(),
      icp_job_titles: jobTitles,
      icp_locations: selectedLocations,
      icp_industries: selectedIndustries,
      icp_company_types: selectedCompanyTypes,
      icp_company_sizes: selectedCompanySizes,
      icp_exclude_keywords: excludeKeywords,
      precision_mode: precisionMode,
      signals_config: { enabled: enabledSignals },
      leads_list_name: leadsListName || null,
    });

    setSaving(false);
    if (!error) {
      onCreated();
      onClose();
    }
  }

  const totalSignals = enabledSignals.length;

  function DropdownMulti({
    id, label, placeholder, options, selected, setSelected,
  }: {
    id: string; label: string; placeholder: string; options: string[];
    selected: string[]; setSelected: (v: string[]) => void;
  }) {
    const isOpen = openDropdown === id;
    return (
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">{label}</label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenDropdown(isOpen ? null : id)}
            className="w-full flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-left hover:border-gray-300 transition-colors bg-white"
          >
            <span className={selected.length ? "text-gray-900" : "text-gray-400"}>
              {selected.length ? selected.join(", ") : placeholder}
            </span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </button>
          {isOpen && (
            <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggleInArray(selected, opt, setSelected)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 text-left"
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                    selected.includes(opt) ? "bg-green-500 border-green-500" : "border-gray-300"
                  }`}>
                    {selected.includes(opt) && <Check className="w-3 h-3 text-white" />}
                  </div>
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full p-6 md:p-8" onClick={() => openDropdown && setOpenDropdown(null)}>
      {/* Header */}
      <div className="flex items-center gap-4 mb-1">
        <h1 className="text-2xl font-bold text-gray-900">Create an AI Agent</h1>
        <input
          value={agentName}
          onChange={(e) => setAgentName(e.target.value)}
          placeholder="Agent Name"
          className="text-2xl font-light text-gray-400 bg-transparent border-b border-orange-300 focus:border-orange-500 outline-none px-1 py-0.5 w-[200px] placeholder:text-gray-300"
        />
        <button
          className="flex items-center gap-1.5 text-xs font-semibold text-red-500 border border-red-200 rounded-full px-3 py-1 hover:bg-red-50 transition-colors"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          HOW IT WORKS?
        </button>
        <button onClick={onClose} className="ml-auto text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
      </div>
      <p className="text-sm text-gray-500 mb-8">The agent will browse the internet looking for leads</p>

      <div className="flex gap-8">
        {/* Left sidebar - Steps */}
        <div className="w-[280px] shrink-0">
          <div className="border border-gray-100 rounded-xl p-4 space-y-2">
            {[
              { num: 1, label: "ICP", sub: "Ideal Customer Profile" },
              { num: 2, label: "Signals", sub: "Intent Signals" },
              { num: 3, label: "Leads", sub: "Leads Management" },
            ].map((s) => {
              const isActive = step === s.num;
              const isDone = step > s.num;
              return (
                <button
                  key={s.num}
                  onClick={() => isDone && setStep(s.num)}
                  className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors ${
                    isActive ? "bg-orange-50" : isDone ? "hover:bg-gray-50 cursor-pointer" : ""
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                    isDone
                      ? "bg-green-500 text-white"
                      : isActive
                        ? "bg-orange-500 text-white"
                        : "bg-gray-200 text-gray-500"
                  }`}>
                    {isDone ? <Check className="w-4 h-4" /> : s.num}
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${isActive ? "text-orange-600" : isDone ? "text-green-600" : "text-gray-900"}`}>
                      {s.label}
                    </p>
                    <p className="text-xs text-gray-500">{s.sub}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right content */}
        <div className="flex-1 min-w-0">
          {step === 1 && (
            <div className="border border-gray-100 rounded-xl p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Define Your Ideal Customer Profile</h2>
                  <p className="text-sm text-gray-500">Configure who your AI agent should target when searching for leads.</p>
                </div>
                <button
                  onClick={generateWithAI}
                  disabled={aiLoading}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, hsl(25 95% 53%), hsl(330 85% 55%))" }}
                >
                  {aiLoading ? (
                    <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  Generate ICP with AI
                </button>
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                {/* Job titles */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Target Job Titles</label>
                  <div className="flex gap-2">
                    <input
                      value={jobTitleInput}
                      onChange={(e) => setJobTitleInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addJobTitle())}
                      placeholder="e.g., Sales Manager"
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
                    />
                    <button onClick={addJobTitle} className="text-sm font-medium text-orange-500 hover:text-orange-600 px-3">
                      Add
                    </button>
                  </div>
                  {jobTitles.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {jobTitles.map((t) => (
                        <span key={t} className="inline-flex items-center gap-1 text-xs font-medium bg-orange-50 text-orange-600 border border-orange-200 rounded-full px-2.5 py-1">
                          {t}
                          <button onClick={() => setJobTitles(jobTitles.filter((x) => x !== t))} className="hover:text-orange-800">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Locations */}
                <DropdownMulti
                  id="locations" label="Target Locations" placeholder="Select locations..."
                  options={LOCATIONS} selected={selectedLocations} setSelected={setSelectedLocations}
                />

                {/* Industries */}
                <DropdownMulti
                  id="industries" label="Target Industries" placeholder="Select industries..."
                  options={INDUSTRIES} selected={selectedIndustries} setSelected={setSelectedIndustries}
                />

                {/* Company types */}
                <DropdownMulti
                  id="company_types" label="Company Types" placeholder="Select company types..."
                  options={COMPANY_TYPES} selected={selectedCompanyTypes} setSelected={setSelectedCompanyTypes}
                />

                {/* Company sizes */}
                <DropdownMulti
                  id="company_sizes" label="Company Sizes" placeholder="Select company sizes..."
                  options={COMPANY_SIZES} selected={selectedCompanySizes} setSelected={setSelectedCompanySizes}
                />

                {/* Exclude */}
                <div>
                  <label className="flex items-center gap-1 text-sm font-semibold text-gray-900 mb-2">
                    Companies & Keywords to exclude
                    <Info className="w-3.5 h-3.5 text-gray-400" />
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={excludeInput}
                      onChange={(e) => setExcludeInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addExclude())}
                      placeholder="e.g., Google"
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
                    />
                    <button onClick={addExclude} className="text-sm font-medium text-orange-500 hover:text-orange-600 px-3">
                      Add
                    </button>
                  </div>
                  {excludeKeywords.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {excludeKeywords.map((k) => (
                        <span key={k} className="inline-flex items-center gap-1 text-xs font-medium bg-orange-50 text-orange-600 border border-orange-200 rounded-full px-2.5 py-1">
                          {k}
                          <button onClick={() => setExcludeKeywords(excludeKeywords.filter((x) => x !== k))} className="hover:text-orange-800">
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
                <label className="flex items-center gap-1 text-sm font-semibold text-gray-900 mb-3">
                  Lead Matching Mode
                  <Info className="w-3.5 h-3.5 text-gray-400" />
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setPrecisionMode("discovery")}
                    className={`flex items-center gap-1.5 text-sm font-medium ${precisionMode === "discovery" ? "text-gray-900" : "text-gray-400"}`}
                  >
                    <Search className="w-4 h-4" />
                    Discovery
                  </button>
                  <div
                    onClick={() => setPrecisionMode(precisionMode === "discovery" ? "high_precision" : "discovery")}
                    className={`w-10 h-5 rounded-full cursor-pointer transition-colors relative ${
                      precisionMode === "high_precision" ? "bg-green-500" : "bg-gray-300"
                    }`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      precisionMode === "high_precision" ? "translate-x-5" : "translate-x-0.5"
                    }`} />
                  </div>
                  <button
                    onClick={() => setPrecisionMode("high_precision")}
                    className={`flex items-center gap-1.5 text-sm font-medium ${precisionMode === "high_precision" ? "text-gray-900" : "text-gray-400"}`}
                  >
                    High Precision
                    <Target className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                  <p className="text-xs font-semibold text-blue-700">
                    {precisionMode === "discovery" ? "Broader ICP – More leads" : "Narrow ICP – Fewer, better leads"}
                  </p>
                  <p className="text-xs text-blue-600">
                    {precisionMode === "discovery"
                      ? "Finds opportunities you wouldn't normally target"
                      : "Only matches leads that closely fit your exact criteria"}
                  </p>
                </div>
              </div>

              {/* Advanced filters */}
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="mt-5 flex items-center gap-1 text-sm text-orange-500 hover:text-orange-600 font-medium"
              >
                Advanced filters
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
              </button>
              {showAdvanced && (
                <div className="mt-3 p-4 border border-gray-100 rounded-lg text-sm text-gray-500">
                  Advanced filtering options coming soon.
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="border border-gray-100 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl font-bold text-gray-900">Configure Intent Signals</h2>
                <span className="text-xs font-medium text-gray-600 bg-gray-100 border border-gray-200 rounded-full px-2.5 py-1">
                  {totalSignals} / 15 signals
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-6">Define what signals the AI agent should look for to identify potential leads</p>

              <div className="space-y-3">
                {SIGNAL_CATEGORIES.map((cat) => {
                  const enabled = enabledSignals.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      onClick={() => toggleInArray(enabledSignals, cat.id, setEnabledSignals)}
                      className={`w-full flex items-center gap-4 border rounded-xl p-4 text-left transition-colors ${
                        enabled ? "border-green-200 bg-green-50/30" : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-2xl shrink-0">
                        {cat.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-gray-900">{cat.title}</span>
                          {cat.count && (
                            <span className="text-[10px] font-bold bg-orange-100 text-orange-600 rounded-full w-5 h-5 flex items-center justify-center">
                              {cat.count}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{cat.desc}</p>
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="border border-gray-100 rounded-xl p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Leads Management</h2>
              <p className="text-sm text-gray-500 mb-6">Configure how leads will be organized and managed when found by the AI agent.</p>

              <div className="border border-gray-200 rounded-xl p-5">
                <p className="font-semibold text-sm text-gray-900 mb-1">Automatically add found leads to list</p>
                <p className="text-xs text-gray-500 mb-4">Lists help you organize contacts and launch outreach campaigns more easily.</p>

                <label className="block text-sm font-semibold text-gray-900 mb-2">Select list</label>
                <div className="flex gap-3">
                  <select
                    value={leadsListName}
                    onChange={(e) => setLeadsListName(e.target.value)}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
                  >
                    <option value="">Select a list...</option>
                    {leadsListName && ![""].includes(leadsListName) && (
                      <option value={leadsListName}>{leadsListName}</option>
                    )}
                  </select>
                  <button
                    onClick={() => setShowNewList(true)}
                    className="flex items-center gap-1.5 text-sm font-medium text-orange-500 border border-orange-200 rounded-lg px-4 py-2.5 hover:bg-orange-50 transition-colors whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    Create new list
                  </button>
                </div>

                {showNewList && (
                  <div className="mt-3 flex gap-2">
                    <input
                      value={newListInput}
                      onChange={(e) => setNewListInput(e.target.value)}
                      placeholder="Enter list name..."
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
                    />
                    <button
                      onClick={() => {
                        if (newListInput.trim()) {
                          setLeadsListName(newListInput.trim());
                          setNewListInput("");
                          setShowNewList(false);
                        }
                      }}
                      className="px-3 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setShowNewList(false)}
                      className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                <p className="text-xs text-gray-400 mt-3">
                  This list is not associated with a campaign. After creating the agent, you will be redirected to the creation of an outreach campaign.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer navigation */}
      <div className="flex items-center justify-between mt-8 pt-4 border-t border-gray-100">
        <div>
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>
          )}
        </div>
        <button
          onClick={() => {
            if (step < 3) setStep(step + 1);
            else handleCreate();
          }}
          disabled={saving}
          className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white rounded-lg transition-colors disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, hsl(25 95% 53%), hsl(330 85% 55%))" }}
        >
          {saving ? (
            <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
          ) : step === 1 ? (
            <>Configure Signals <ChevronRight className="w-4 h-4" /></>
          ) : step === 2 ? (
            <>Leads Management <ChevronRight className="w-4 h-4" /></>
          ) : (
            <>Create Agent <ChevronRight className="w-4 h-4" /></>
          )}
        </button>
      </div>
    </div>
  );
}

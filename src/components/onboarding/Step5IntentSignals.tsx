import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft, ArrowRight, MapPin, Sparkles, X, Loader2,
  ChevronDown, Building2, MessageSquare, Users, Briefcase,
  Eye, UserPlus, ThumbsUp, Search, TrendingUp,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import intentslyIcon from "@/assets/intentsly-icon.png";
import { CardShell } from "./CardShell";
import { OnboardingNav } from "./OnboardingNav";
import type { OnboardingData } from "./types";
import type { ICPData } from "./Step3ICP";

// ─── Types ────────────────────────────────────────────────────────────────────

export type IntentSignalsData = {
  enabledSignals: Record<string, boolean>;
  signalKeywords: Record<string, string[]>;
};

export const INITIAL_INTENT_SIGNALS: IntentSignalsData = {
  enabledSignals: { keyword_posts: true, job_changes: true },
  signalKeywords: {},
};

// ─── Signal categories (same as CreateAgentWizard) ────────────────────────────

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

// ─── Sub-components ───────────────────────────────────────────────────────────

const Tag = ({ label, onRemove }: { label: string; onRemove: () => void }) => (
  <span
    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200"
    style={{
      background: "hsl(0 0% 96%)",
      color: "hsl(var(--foreground))",
      border: "1px solid hsl(var(--border))",
    }}
  >
    "{label}"
    <button
      type="button"
      onClick={onRemove}
      className="ml-0.5 rounded-full w-3.5 h-3.5 flex items-center justify-center hover:opacity-70"
    >
      <X className="w-2.5 h-2.5" />
    </button>
  </span>
);

const CardSkeleton = () => (
  <div
    className="rounded-3xl border-2 border-background p-5 animate-pulse"
    style={{ background: "hsl(0 0% 96%)" }}
  >
    <div className="flex items-start gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-muted shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-32 rounded bg-muted" />
        <div className="h-3 w-48 rounded bg-muted" />
      </div>
    </div>
    <div className="h-9 w-full rounded-xl bg-muted mb-2" />
    <div className="flex flex-wrap gap-1.5">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-6 w-24 rounded-full bg-muted" />
      ))}
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

type Props = {
  data: OnboardingData;
  icp: ICPData;
  signals: IntentSignalsData;
  onSignalsChange: (patch: Partial<IntentSignalsData>) => void;
  onNext: () => void;
  onPrev: () => void;
};

export const Step5IntentSignals = ({
  data,
  icp,
  signals,
  onSignalsChange,
  onNext,
  onPrev,
}: Props) => {
  const [loading, setLoading] = useState(false);
  const [aiGenerated, setAiGenerated] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [keywordInputs, setKeywordInputs] = useState<Record<string, string>>({});
  const [generatingKeywords, setGeneratingKeywords] = useState<Record<string, boolean>>({});
  const hasFetched = useRef(false);

  // Auto-generate keywords for keyword_posts on mount
  useEffect(() => {
    if (hasFetched.current) return;
    if (!data.description && !data.industry) return;
    // Only generate if no keywords exist yet
    const existing = signals.signalKeywords?.keyword_posts;
    if (existing && existing.length > 0) {
      setAiGenerated(true);
      return;
    }
    hasFetched.current = true;
    generateInitialKeywords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function generateInitialKeywords() {
    setLoading(true);
    try {
      const { data: fnData, error } = await supabase.functions.invoke("generate-intent-signals", {
        body: {
          companyName: data.companyName,
          industry: data.industry,
          description: data.description,
          jobTitles: icp.jobTitles,
          targetIndustries: icp.targetIndustries,
        },
      });
      if (error) throw error;
      const result = fnData as { keywords?: string[] };
      if (result.keywords?.length) {
        onSignalsChange({
          signalKeywords: {
            ...signals.signalKeywords,
            keyword_posts: result.keywords,
          },
        });
      }
      setAiGenerated(true);
    } catch (err) {
      console.error("Intent signals generation failed:", err);
      if (data.industry) {
        onSignalsChange({
          signalKeywords: {
            ...signals.signalKeywords,
            keyword_posts: [data.industry],
          },
        });
      }
      setAiGenerated(true);
    } finally {
      setLoading(false);
    }
  }

  function toggleSubSignal(id: string) {
    onSignalsChange({
      enabledSignals: { ...signals.enabledSignals, [id]: !signals.enabledSignals[id] },
    });
  }

  function addSignalKeyword(signalId: string) {
    const input = keywordInputs[signalId]?.trim();
    if (!input) return;
    const current = signals.signalKeywords[signalId] || [];
    if (!current.includes(input)) {
      onSignalsChange({
        signalKeywords: { ...signals.signalKeywords, [signalId]: [...current, input] },
      });
    }
    setKeywordInputs({ ...keywordInputs, [signalId]: "" });
  }

  function removeSignalKeyword(signalId: string, kw: string) {
    const current = signals.signalKeywords[signalId] || [];
    onSignalsChange({
      signalKeywords: { ...signals.signalKeywords, [signalId]: current.filter((x) => x !== kw) },
    });
  }

  async function generateSignalKeywords(signalId: string) {
    setGeneratingKeywords((prev) => ({ ...prev, [signalId]: true }));
    try {
      const { data: fnData, error } = await supabase.functions.invoke("generate-signal-keywords", {
        body: {
          signalType: signalId,
          jobTitles: icp.jobTitles,
          industries: icp.targetIndustries,
          companyTypes: icp.companyTypes,
          locations: icp.targetLocations,
        },
      });
      if (error) throw error;
      if (fnData?.keywords?.length) {
        const current = signals.signalKeywords[signalId] || [];
        const merged = [...new Set([...current, ...fnData.keywords])];
        onSignalsChange({
          signalKeywords: { ...signals.signalKeywords, [signalId]: merged },
        });
      }
    } catch (e) {
      console.error("Failed to generate keywords:", e);
    }
    setGeneratingKeywords((prev) => ({ ...prev, [signalId]: false }));
  }

  const totalEnabled = Object.values(signals.enabledSignals).filter(Boolean).length;

  return (
    <div>
      {/* Header */}
      <div className="relative mb-5 text-center">
        <h1
          className="text-2xl font-normal tracking-tight mb-1.5"
          style={{ color: "hsl(var(--foreground))" }}
        >
          Configure Intent Signals
        </h1>
        <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
          Enable the signals your agent should monitor. Expand each category to configure.
        </p>

        {totalEnabled > 0 && (
          <div
            className="absolute -top-1 right-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{
              background: "hsl(0 0% 0%)",
              color: "hsl(0 0% 100%)",
              boxShadow: "0 2px 12px hsl(0 0% 0% / 0.2)",
            }}
          >
            {totalEnabled} signals active
          </div>
        )}
      </div>

      {/* Signal categories */}
      {loading ? (
        <div className="space-y-3 mb-5">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <div className="space-y-2.5 mb-5">
          {SIGNAL_CATEGORIES.map((cat) => {
            const isExpanded = expandedCategory === cat.id;
            const activeSubs = cat.subSignals.filter((s) => signals.enabledSignals[s.id]).length;

            return (
              <div
                key={cat.id}
                className="rounded-2xl overflow-hidden transition-all duration-200"
                style={{
                  background: "hsl(0 0% 100%)",
                  border: isExpanded ? "1.5px solid hsl(var(--border))" : "1.5px solid hsl(0 0% 94%)",
                }}
              >
                {/* Category header */}
                <button
                  onClick={() => setExpandedCategory(isExpanded ? null : cat.id)}
                  className="w-full flex items-center gap-3 p-3.5 text-left transition-colors hover:bg-muted/30"
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: "hsl(0 0% 96%)", color: "hsl(var(--foreground))" }}
                  >
                    {cat.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm" style={{ color: "hsl(var(--foreground))" }}>
                        {cat.title}
                      </span>
                      {activeSubs > 0 && (
                        <span
                          className="text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center"
                          style={{ background: "hsl(var(--foreground))", color: "hsl(var(--background))" }}
                        >
                          {activeSubs}
                        </span>
                      )}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                      {cat.desc}
                    </p>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    style={{ color: "hsl(var(--muted-foreground))" }}
                  />
                </button>

                {/* Expanded sub-signals */}
                {isExpanded && (
                  <div className="px-3.5 pb-3.5 space-y-2 border-t pt-3" style={{ borderColor: "hsl(0 0% 94%)" }}>
                    {cat.subSignals.map((sub) => (
                      <div
                        key={sub.id}
                        className="rounded-xl p-3 transition-colors"
                        style={{
                          border: signals.enabledSignals[sub.id]
                            ? "1px solid hsl(var(--foreground) / 0.2)"
                            : "1px solid hsl(var(--border))",
                          background: signals.enabledSignals[sub.id] ? "hsl(0 0% 98%)" : "transparent",
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span style={{ color: "hsl(var(--muted-foreground))" }}>{sub.icon}</span>
                            <span className="text-xs font-medium" style={{ color: "hsl(var(--foreground))" }}>
                              {sub.label}
                            </span>
                          </div>
                          <div
                            onClick={() => toggleSubSignal(sub.id)}
                            className="w-9 h-5 rounded-full cursor-pointer transition-colors relative"
                            style={{
                              background: signals.enabledSignals[sub.id] ? "hsl(var(--foreground))" : "hsl(var(--border))",
                            }}
                          >
                            <div
                              className="absolute top-0.5 w-4 h-4 rounded-full shadow transition-transform"
                              style={{
                                background: "hsl(var(--background))",
                                transform: signals.enabledSignals[sub.id] ? "translateX(16px)" : "translateX(2px)",
                              }}
                            />
                          </div>
                        </div>

                        {/* Keyword input for signals that need it */}
                        {sub.hasKeywords && signals.enabledSignals[sub.id] && (
                          <div className="mt-2.5">
                            <div className="flex gap-2">
                              <Input
                                value={keywordInputs[sub.id] || ""}
                                onChange={(e) => setKeywordInputs({ ...keywordInputs, [sub.id]: e.target.value })}
                                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSignalKeyword(sub.id))}
                                placeholder={sub.keywordPlaceholder || "Add keyword..."}
                                className="rounded-xl h-8 text-xs border-border flex-1"
                              />
                              <button
                                type="button"
                                onClick={() => addSignalKeyword(sub.id)}
                                className="text-xs font-medium px-2"
                                style={{ color: "hsl(var(--foreground))" }}
                              >
                                Add
                              </button>
                              {!["competitor_followers", "competitor_engagers"].includes(sub.id) && (
                                <button
                                  type="button"
                                  onClick={() => generateSignalKeywords(sub.id)}
                                  disabled={generatingKeywords[sub.id]}
                                  className="btn-cta h-8 px-2.5 text-xs disabled:opacity-50 flex items-center gap-1"
                                >
                                  <Sparkles className="w-3 h-3" />
                                  {generatingKeywords[sub.id] ? "..." : "AI"}
                                </button>
                              )}
                            </div>
                            {(signals.signalKeywords[sub.id] || []).length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {signals.signalKeywords[sub.id].map((kw) => (
                                  <Tag key={kw} label={kw} onRemove={() => removeSignalKeyword(sub.id, kw)} />
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Footer note */}
      <div className="flex items-center gap-2 text-xs mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>
        <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: "hsl(var(--goji-orange))" }} />
        You can always add more intent signals later, so no pressure to pick everything now.
      </div>

      <OnboardingNav onPrev={onPrev} onNext={onNext} nextDisabled={loading} loading={loading} />
    </div>
  );
};

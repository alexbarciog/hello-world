import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight, MapPin, Sparkles, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import gojiIcon from "@/assets/gojiberry-icon.png";
import { CardShell } from "./CardShell";
import { OnboardingNav } from "./OnboardingNav";
import type { OnboardingData } from "./types";
import type { ICPData } from "./Step3ICP";

// ─── Types ────────────────────────────────────────────────────────────────────

export type IntentSignalsData = {
  engagementKeywords: string[];
  triggerTopActive: boolean;
  triggerJobChanges: boolean;
  triggerFundedCompanies: boolean;
  influencerProfiles: string[];
  competitorPages: string[];
};

export const INITIAL_INTENT_SIGNALS: IntentSignalsData = {
  engagementKeywords: [],
  triggerTopActive: true,
  triggerJobChanges: true,
  triggerFundedCompanies: false,
  influencerProfiles: [],
  competitorPages: [],
};

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

const TagInput = ({ placeholder, onAdd }: { placeholder: string; onAdd: (val: string) => void }) => {
  const [val, setVal] = useState("");
  function submit() {
    const t = val.trim();
    if (t) { onAdd(t); setVal(""); }
  }
  return (
    <div className="flex gap-2">
      <Input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), submit())}
        placeholder={placeholder}
        className="rounded-xl h-9 text-xs border-border flex-1"
      />
      <button
        type="button"
        onClick={submit}
        disabled={!val.trim()}
        className="btn-cta h-9 px-3.5 text-xs disabled:opacity-40 disabled:pointer-events-none"
      >
        Add
      </button>
    </div>
  );
};

const SignalCardShell = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) => (
  <CardShell>
    <div className="flex items-start gap-3 mb-3">
      <img src={gojiIcon} alt="" className="w-8 h-8 object-contain shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>
          {title}
        </p>
        <p className="text-xs leading-relaxed mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
          {description}
        </p>
      </div>
    </div>
    {children}
  </CardShell>
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
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    if (!data.description && !data.industry) return;
    hasFetched.current = true;
    generateKeywords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function generateKeywords() {
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
      onSignalsChange({ engagementKeywords: result.keywords ?? [] });
      setAiGenerated(true);
    } catch (err) {
      console.error("Intent signals generation failed:", err);
      onSignalsChange({ engagementKeywords: data.industry ? [data.industry] : [] });
      setAiGenerated(true);
    } finally {
      setLoading(false);
    }
  }

  function addKeyword(kw: string) {
    if (!signals.engagementKeywords.includes(kw))
      onSignalsChange({ engagementKeywords: [...signals.engagementKeywords, kw] });
  }
  function removeKeyword(kw: string) {
    onSignalsChange({ engagementKeywords: signals.engagementKeywords.filter((k) => k !== kw) });
  }
  function addInfluencer(url: string) {
    if (!signals.influencerProfiles.includes(url))
      onSignalsChange({ influencerProfiles: [...signals.influencerProfiles, url] });
  }
  function removeInfluencer(url: string) {
    onSignalsChange({ influencerProfiles: signals.influencerProfiles.filter((u) => u !== url) });
  }
  function addCompetitor(url: string) {
    if (!signals.competitorPages.includes(url))
      onSignalsChange({ competitorPages: [...signals.competitorPages, url] });
  }
  function removeCompetitor(url: string) {
    onSignalsChange({ competitorPages: signals.competitorPages.filter((u) => u !== url) });
  }

  return (
    <div>
      {/* Header */}
      <div className="relative mb-7 text-center">
        <h1
          className="text-2xl font-normal tracking-tight mb-1.5"
          style={{ color: "hsl(var(--foreground))" }}
        >
          What GojiberryAI will detect for you
        </h1>
        <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
          We've pre-selected the most relevant buying-intent signals for your business and ideal customer.
        </p>

        {aiGenerated && !loading && (
          <div
            className="absolute -top-1 right-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{
              background: "hsl(0 0% 0%)",
              color: "hsl(0 0% 100%)",
              boxShadow: "0 2px 12px hsl(0 0% 0% / 0.2)",
            }}
          >
            <Sparkles className="w-3 h-3" />
            AI-generated
          </div>
        )}
      </div>

      {/* 2×2 Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div className="animate-fade-in-up" style={{ animationDelay: "0s" }}>
            <SignalCardShell title="Engagement & Interest" description="Find people who recently engaged with relevant content on LinkedIn">
              <div>
                <p className="text-xs font-medium mb-1.5" style={{ color: "hsl(var(--foreground))" }}>Track Keywords</p>
                <TagInput placeholder="e.g., AI, sales automation" onAdd={addKeyword} />
                {signals.engagementKeywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {signals.engagementKeywords.map((kw) => (
                      <Tag key={kw} label={kw} onRemove={() => removeKeyword(kw)} />
                    ))}
                  </div>
                )}
              </div>
            </SignalCardShell>
          </div>

          <div className="animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
            <SignalCardShell title="Change & Trigger Events" description="Job changes, funding, and other signals that suggest buying intent">
              <div className="space-y-2.5">
                {[
                  { key: "triggerTopActive" as const, label: "Top 5% active profiles" },
                  { key: "triggerJobChanges" as const, label: "Recent job changes (< 90 days)" },
                  { key: "triggerFundedCompanies" as const, label: "Companies that raised funds" },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2.5 cursor-pointer">
                    <div
                      className="relative w-4 h-4 rounded flex items-center justify-center shrink-0 transition-all duration-150"
                      style={{
                        background: signals[key] ? "hsl(0 0% 0%)" : "hsl(0 0% 100%)",
                        border: signals[key] ? "1.5px solid hsl(0 0% 0%)" : "1.5px solid hsl(var(--border))",
                      }}
                      onClick={() => onSignalsChange({ [key]: !signals[key] })}
                    >
                      {signals[key] && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span
                      className="text-xs font-medium"
                      style={{ color: "hsl(var(--foreground))" }}
                      onClick={() => onSignalsChange({ [key]: !signals[key] })}
                    >
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </SignalCardShell>
          </div>

          <div className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <SignalCardShell title="LinkedIn Profiles" description="Track people engaging with influencers and thought leaders in your niche">
              <div>
                <p className="text-xs font-medium mb-1.5" style={{ color: "hsl(var(--foreground))" }}>Track Influencer Profiles</p>
                <TagInput placeholder="https://linkedin.com/in/influencer-profile" onAdd={addInfluencer} />
                {signals.influencerProfiles.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {signals.influencerProfiles.map((url) => (
                      <Tag key={url} label={url} onRemove={() => removeInfluencer(url)} />
                    ))}
                  </div>
                )}
              </div>
            </SignalCardShell>
          </div>

          <div className="animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
            <SignalCardShell title="Competitor Engagement" description="Track people following or interacting with competitors">
              <div>
                <p className="text-xs font-medium mb-1.5" style={{ color: "hsl(var(--foreground))" }}>Monitor Competitor LinkedIn Pages</p>
                <TagInput placeholder="https://linkedin.com/company/competitor" onAdd={addCompetitor} />
                {signals.competitorPages.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {signals.competitorPages.map((url) => (
                      <Tag key={url} label={url} onRemove={() => removeCompetitor(url)} />
                    ))}
                  </div>
                )}
              </div>
            </SignalCardShell>
          </div>
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

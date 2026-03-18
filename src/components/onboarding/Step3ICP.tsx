import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDown, ChevronUp, Loader2, MapPin, Sparkles, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CardShell } from "./CardShell";
import { OnboardingNav } from "./OnboardingNav";
import type { OnboardingData } from "./types";

// ─── Constants ──────────────────────────────────────────────────────────────

const TARGET_LOCATIONS = [
  "Global", "Europe", "North America", "South America", "Asia Pacific",
  "Middle East & Africa", "Western Europe", "Eastern Europe",
  "United States", "United Kingdom", "Germany", "France", "Romania",
  "Netherlands", "Spain", "Italy", "Poland", "Sweden", "Denmark",
  "Norway", "Finland", "Switzerland", "Austria", "Belgium", "Portugal",
  "Canada", "Australia", "India", "Singapore", "Brazil",
];

const COMPANY_TYPES = [
  "Private Company", "Public Company", "Startup", "SME",
  "Enterprise", "Non-Profit", "Government", "Partnership", "Sole Proprietorship",
];

const COMPANY_SIZES = [
  "1-10", "11-50", "51-200", "201-500", "501-1000", "1001-5000", "5000+",
];

const INDUSTRIES_LIST = [
  "Technology & Software", "E-commerce & Retail", "Food & Beverages",
  "Healthcare & Medical", "Finance & Banking", "Real Estate",
  "Education & Training", "Marketing & Advertising",
  "Consulting & Professional Services", "Manufacturing & Industrial",
  "Travel & Hospitality", "Media & Entertainment", "Non-Profit & NGO",
  "Legal Services", "Restaurants", "Logistics & Supply Chain", "Other",
];

// ─── Types ───────────────────────────────────────────────────────────────────

export type ICPData = {
  jobTitles: string[];
  targetLocations: string[];
  targetIndustries: string[];
  companyTypes: string[];
  companySizes: string[];
  excludeKeywords: string[];
};

export const INITIAL_ICP: ICPData = {
  jobTitles: [],
  targetLocations: [],
  targetIndustries: [],
  companyTypes: [],
  companySizes: [],
  excludeKeywords: [],
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const Tag = ({ label, onRemove }: { label: string; onRemove: () => void }) => (
  <span
    className="group/tag inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 relative"
    style={{
      background: "hsl(0 0% 96%)",
      color: "hsl(var(--foreground))",
      border: "1px solid hsl(var(--border))",
    }}
  >
    {label}
    <button
      type="button"
      onClick={onRemove}
      className="ml-0.5 rounded-full w-3.5 h-3.5 flex items-center justify-center hover:opacity-70"
      aria-label={`Remove ${label}`}
    >
      <X className="w-2.5 h-2.5" />
    </button>
  </span>
);

const TagInput = ({ placeholder, onAdd }: { placeholder: string; onAdd: (val: string) => void }) => {
  const [val, setVal] = useState("");
  function submit() {
    const trimmed = val.trim();
    if (trimmed) { onAdd(trimmed); setVal(""); }
  }
  return (
    <div className="flex gap-2 mt-2">
      <Input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), submit())}
        placeholder={placeholder}
        className="rounded-xl h-10 text-sm border-border flex-1"
      />
      <button
        type="button"
        onClick={submit}
        disabled={!val.trim()}
        className="btn-cta h-10 px-4 text-xs disabled:opacity-40 disabled:pointer-events-none"
      >
        Add
      </button>
    </div>
  );
};

const MultiSelectDropdown = ({
  label,
  options,
  selected,
  onAdd,
  onRemove,
}: {
  label: string;
  options: string[];
  selected: string[];
  onAdd: (v: string) => void;
  onRemove: (v: string) => void;
}) => {
  const available = options.filter((o) => !selected.includes(o));
  return (
    <div>
      <Select onValueChange={onAdd}>
        <SelectTrigger className="rounded-xl h-10 text-sm border-border w-full">
          <SelectValue placeholder={selected.length > 0 ? `${selected.length} selected` : label} />
        </SelectTrigger>
        <SelectContent className="max-h-56">
          {available.map((opt) => (
            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selected.map((item) => (
            <Tag key={item} label={item} onRemove={() => onRemove(item)} />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Loading skeleton ─────────────────────────────────────────────────────────

const ICPSkeleton = () => (
  <div className="space-y-5 animate-pulse">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="space-y-2">
        <div className="h-3.5 w-32 rounded bg-muted" />
        <div className="h-10 w-full rounded-xl bg-muted" />
        <div className="flex gap-2">
          <div className="h-6 w-24 rounded-full bg-muted" />
          <div className="h-6 w-20 rounded-full bg-muted" />
          <div className="h-6 w-28 rounded-full bg-muted" />
        </div>
      </div>
    ))}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

type Props = {
  data: OnboardingData;
  icp: ICPData;
  onICPChange: (patch: Partial<ICPData>) => void;
  onNext: () => void;
  onPrev: () => void;
};

export const Step3ICP = ({ data, icp, onICPChange, onNext, onPrev }: Props) => {
  const [loading, setLoading] = useState(false);
  const [aiGenerated, setAiGenerated] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const hasFetched = useRef(false);

  function addTag(field: keyof ICPData, val: string) {
    const current = icp[field] as string[];
    if (!current.includes(val)) {
      onICPChange({ [field]: [...current, val] });
    }
  }

  function removeTag(field: keyof ICPData, val: string) {
    onICPChange({ [field]: (icp[field] as string[]).filter((v) => v !== val) });
  }

  useEffect(() => {
    if (hasFetched.current) return;
    if (!data.description && !data.industry) return;
    hasFetched.current = true;
    generateICP();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function generateICP() {
    setLoading(true);
    try {
      const { data: fnData, error } = await supabase.functions.invoke("generate-icp", {
        body: {
          companyName: data.companyName,
          industry: data.industry,
          description: data.description,
          language: data.language,
        },
      });
      if (error) throw error;
      const result = fnData as {
        jobTitles?: string[];
        targetLocations?: string[];
        targetIndustries?: string[];
        companyTypes?: string[];
        companySizes?: string[];
      };
      onICPChange({
        jobTitles: result.jobTitles ?? [],
        targetLocations: result.targetLocations ?? ["Europe"],
        targetIndustries: result.targetIndustries ?? [],
        companyTypes: result.companyTypes ?? ["Private Company"],
        companySizes: result.companySizes ?? [],
      });
      setAiGenerated(true);
    } catch (err) {
      console.error("ICP generation failed:", err);
      onICPChange({
        targetLocations: ["Europe"],
        targetIndustries: data.industry ? [data.industry] : [],
        companyTypes: ["Private Company"],
      });
      setAiGenerated(true);
    } finally {
      setLoading(false);
    }
  }

  const canProceed = icp.jobTitles.length > 0 || icp.targetIndustries.length > 0;

  return (
    <div>
      {/* Header */}
      <div className="relative mb-7">
        <div>
          <h1
            className="text-2xl font-normal tracking-tight mb-1.5"
            style={{ color: "hsl(var(--foreground))" }}
          >
            Define your Ideal Customer
          </h1>
          <p className="text-sm leading-relaxed max-w-md" style={{ color: "hsl(var(--muted-foreground))" }}>
            Your AI Agents will use this Profile to detect and surface high-intent leads. Fine-tune it to control lead quality.
          </p>
        </div>

        {aiGenerated && !loading && (
          <div
            className="absolute top-0 right-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
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

      {/* Body */}
      {loading ? (
        <ICPSkeleton />
      ) : (
        <div className="space-y-4">
          {/* Two-column grid wrapped in CardShell */}
          <CardShell className="animate-fade-in-up">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>
                  Target Job Titles
                </Label>
                <TagInput placeholder="e.g., Sales Manager" onAdd={(v) => addTag("jobTitles", v)} />
                {icp.jobTitles.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {icp.jobTitles.map((t) => (
                      <Tag key={t} label={t} onRemove={() => removeTag("jobTitles", t)} />
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>
                  Target Locations
                </Label>
                <MultiSelectDropdown
                  label="Select location"
                  options={TARGET_LOCATIONS}
                  selected={icp.targetLocations}
                  onAdd={(v) => addTag("targetLocations", v)}
                  onRemove={(v) => removeTag("targetLocations", v)}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>
                  Target Industries
                </Label>
                <MultiSelectDropdown
                  label="Select industry"
                  options={INDUSTRIES_LIST}
                  selected={icp.targetIndustries}
                  onAdd={(v) => addTag("targetIndustries", v)}
                  onRemove={(v) => removeTag("targetIndustries", v)}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>
                  Company Types
                </Label>
                <MultiSelectDropdown
                  label="Select type"
                  options={COMPANY_TYPES}
                  selected={icp.companyTypes}
                  onAdd={(v) => addTag("companyTypes", v)}
                  onRemove={(v) => removeTag("companyTypes", v)}
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>
                  Company Sizes
                </Label>
                <MultiSelectDropdown
                  label="Select size"
                  options={COMPANY_SIZES}
                  selected={icp.companySizes}
                  onAdd={(v) => addTag("companySizes", v)}
                  onRemove={(v) => removeTag("companySizes", v)}
                />
              </div>
            </div>
          </CardShell>

          {/* Advanced filters */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced((p) => !p)}
              className="flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-70"
              style={{ color: "hsl(var(--foreground))" }}
            >
              Advanced filters
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showAdvanced && (
              <CardShell className="mt-3 animate-fade-in-up">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium flex items-center gap-1" style={{ color: "hsl(var(--foreground))" }}>
                    Companies &amp; Keywords to exclude
                    <span
                      className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold ml-0.5 cursor-default"
                      style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}
                      title="Leads matching these keywords will be filtered out"
                    >
                      i
                    </span>
                  </Label>
                  <TagInput placeholder="e.g., Google" onAdd={(v) => addTag("excludeKeywords", v)} />
                  {icp.excludeKeywords.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {icp.excludeKeywords.map((t) => (
                        <Tag key={t} label={t} onRemove={() => removeTag("excludeKeywords", t)} />
                      ))}
                    </div>
                  )}
                </div>
              </CardShell>
            )}
          </div>

          {/* Footer note */}
          <div
            className="flex items-start gap-2 rounded-xl px-4 py-3 text-xs"
            style={{ background: "hsl(0 0% 96%)", color: "hsl(var(--muted-foreground))" }}
          >
            <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "hsl(var(--goji-orange))" }} />
            Think of this ICP as your starting point. You'll be able to fine-tune it and stack extra filters later.
          </div>
        </div>
      )}

      <OnboardingNav onPrev={onPrev} onNext={onNext} nextDisabled={loading || !canProceed} loading={loading} />
    </div>
  );
};

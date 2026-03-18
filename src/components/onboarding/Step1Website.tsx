import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { scrapeWebsite, INDUSTRY_LIST } from "@/lib/api/firecrawl";
import { AlertCircle, ArrowRight, Globe, Loader2 } from "lucide-react";
import { CardShell } from "./CardShell";
import type { OnboardingData } from "./types";

type ScrapeStep = "idle" | "loading" | "success" | "error";

const LANGUAGE_OPTIONS = [
  "English (US)",
  "English (UK)",
  "Romanian",
  "French",
  "German",
  "Spanish",
  "Italian",
  "Portuguese",
  "Dutch",
  "Polish",
];

const FieldSkeleton = () => (
  <div className="space-y-2 animate-pulse">
    <div className="h-3.5 w-28 rounded-md bg-muted" />
    <div className="h-10 w-full rounded-xl bg-muted" />
  </div>
);

const TextareaSkeleton = () => (
  <div className="space-y-2 animate-pulse">
    <div className="h-3.5 w-52 rounded-md bg-muted" />
    <div className="h-24 w-full rounded-xl bg-muted" />
  </div>
);

type Props = {
  data: OnboardingData;
  onChange: (patch: Partial<OnboardingData>) => void;
  onNext: () => void;
};

export const Step1Website = ({ data, onChange, onNext }: Props) => {
  const [scrapeStep, setScrapeStep] = useState<ScrapeStep>(
    data.companyName ? "success" : "idle"
  );
  const [fieldsVisible, setFieldsVisible] = useState(!!data.companyName);
  const [errorMsg, setErrorMsg] = useState("");
  const companyNameRef = useRef<HTMLInputElement>(null);

  const isExpanded = scrapeStep === "success" || scrapeStep === "error" || scrapeStep === "loading";

  useEffect(() => {
    if (fieldsVisible && companyNameRef.current) {
      const t = setTimeout(() => companyNameRef.current?.focus(), 550);
      return () => clearTimeout(t);
    }
  }, [fieldsVisible]);

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    if (!data.website.trim()) return;
    setScrapeStep("loading");
    setErrorMsg("");
    setFieldsVisible(false);

    try {
      const scraped = await scrapeWebsite(data.website.trim());
      onChange({
        companyName: scraped.companyName,
        industry: scraped.industry,
        description: scraped.description,
        language: scraped.language,
      });
      setScrapeStep("success");
      requestAnimationFrame(() => setTimeout(() => setFieldsVisible(true), 80));
    } catch (err) {
      console.error(err);
      setErrorMsg("We couldn't fully analyze your website. Please fill in the details manually.");
      onChange({ companyName: "", industry: "", description: "", language: "" });
      setScrapeStep("error");
      requestAnimationFrame(() => setTimeout(() => setFieldsVisible(true), 80));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onNext();
  }

  return (
    <form onSubmit={isExpanded && scrapeStep !== "loading" ? handleSubmit : handleAnalyze}>
      {/* Website URL */}
      <div className="space-y-1.5 mb-6">
        <Label htmlFor="website" className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>
          Website
        </Label>
        <div className="relative flex flex-col sm:flex-row items-stretch gap-2">
          <div className="relative flex-1">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "hsl(var(--muted-foreground))" }} />
            <Input
              id="website"
              type="url"
              value={data.website}
              onChange={(e) => onChange({ website: e.target.value })}
              placeholder="https://yourwebsite.com"
              disabled={scrapeStep === "loading"}
              required
              className="pl-9 rounded-xl h-11 text-sm border-border w-full"
            />
          </div>
          <button
            type={isExpanded && scrapeStep !== "loading" ? "button" : "submit"}
            onClick={
              isExpanded && scrapeStep !== "loading"
                ? () => { setScrapeStep("idle"); setFieldsVisible(false); }
                : undefined
            }
            disabled={scrapeStep === "loading" || !data.website.trim()}
            className="h-11 sm:h-auto px-5 rounded-xl sm:rounded-full text-sm font-normal transition-all duration-200 disabled:opacity-50 shrink-0"
            style={{
              background: "hsl(0 0% 0%)",
              color: "hsl(0 0% 100%)",
              boxShadow: "0 2px 8px hsl(0 0% 0% / 0.15)",
            }}
          >
            {scrapeStep === "loading" ? (
              <span className="flex items-center justify-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Analyzing…
              </span>
            ) : isExpanded ? "Re-analyze" : "Analyze"}
          </button>
        </div>
      </div>

      {/* Loading skeletons */}
      {scrapeStep === "loading" && (
        <CardShell className="mt-4">
          <div className="space-y-5">
            <p className="text-xs text-center" style={{ color: "hsl(var(--muted-foreground))" }}>
              <span className="inline-flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: "hsl(var(--goji-orange))" }} />
                Analyzing your website…
              </span>
            </p>
            <div className="grid grid-cols-2 gap-4">
              <FieldSkeleton />
              <FieldSkeleton />
            </div>
            <TextareaSkeleton />
            <FieldSkeleton />
          </div>
        </CardShell>
      )}

      {/* Expanded fields */}
      {(scrapeStep === "success" || scrapeStep === "error") && (
        <CardShell className="mt-4">
          <div className="space-y-5">
            {scrapeStep === "error" && (
              <div
                className="flex items-start gap-3 rounded-xl px-4 py-3 text-sm animate-fade-in-up"
                style={{
                  background: "hsl(0 84% 60% / 0.07)",
                  border: "1px solid hsl(0 84% 60% / 0.2)",
                  color: "hsl(0 72% 42%)",
                }}
              >
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
                <Label htmlFor="companyName" className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>
                  Company Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  ref={companyNameRef}
                  id="companyName"
                  value={data.companyName}
                  onChange={(e) => onChange({ companyName: e.target.value })}
                  placeholder="Your company name"
                  required
                  className="rounded-xl h-11 text-sm border-border"
                />
              </div>

              <div className="space-y-1.5 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
                <Label htmlFor="industry" className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>
                  Industry <span className="text-destructive">*</span>
                </Label>
                <Select value={data.industry} onValueChange={(v) => onChange({ industry: v })}>
                  <SelectTrigger id="industry" className="rounded-xl h-11 text-sm border-border">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRY_LIST.map((ind) => (
                      <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5 animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
              <Label htmlFor="description" className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>
                Company Description &amp; Value Proposition{" "}
                <span className="text-destructive">*</span>
              </Label>
              <textarea
                id="description"
                value={data.description}
                onChange={(e) => onChange({ description: e.target.value })}
                placeholder="Describe what your company does and its unique value…"
                required
                rows={4}
                className="flex w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none transition-all duration-200"
              />
            </div>

            <div className="space-y-1.5 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              <Label htmlFor="language" className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>
                Preferred Language <span className="text-destructive">*</span>
              </Label>
              <Select value={data.language} onValueChange={(v) => onChange({ language: v })}>
                <SelectTrigger id="language" className="rounded-xl h-11 text-sm border-border">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGE_OPTIONS.map((lang) => (
                    <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                This language preference will be used for AI message generation
              </p>
            </div>

            <div className="pt-2 flex justify-end animate-fade-in-up" style={{ animationDelay: "0.25s" }}>
              <button
                type="submit"
                disabled={!data.companyName || !data.industry || !data.description || !data.language}
                className="btn-cta h-11 px-8 text-sm disabled:opacity-40 disabled:pointer-events-none"
              >
                Next Step
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </CardShell>
      )}
    </form>
  );
};

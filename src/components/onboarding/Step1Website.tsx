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

const AnimatedField = ({
  children,
  delay = 0,
  visible,
}: {
  children: React.ReactNode;
  delay?: number;
  visible: boolean;
}) => (
  <div
    className="transition-all duration-500 ease-out"
    style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(16px)",
      transitionDelay: `${delay}ms`,
    }}
  >
    {children}
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
        <Label htmlFor="website" className="text-sm font-medium" style={{ color: "hsl(var(--goji-dark))" }}>
          Website
        </Label>
        <div className="relative flex items-center">
          <Globe className="absolute left-3 w-4 h-4 pointer-events-none" style={{ color: "hsl(var(--goji-text-muted))" }} />
          <Input
            id="website"
            type="url"
            value={data.website}
            onChange={(e) => onChange({ website: e.target.value })}
            placeholder="https://yourwebsite.com"
            disabled={scrapeStep === "loading"}
            required
            className="pl-9 pr-28 rounded-xl h-11 text-sm border-border"
          />
          <Button
            type={isExpanded && scrapeStep !== "loading" ? "button" : "submit"}
            onClick={
              isExpanded && scrapeStep !== "loading"
                ? () => { setScrapeStep("idle"); setFieldsVisible(false); }
                : undefined
            }
            disabled={scrapeStep === "loading" || !data.website.trim()}
            size="sm"
            className="absolute right-1.5 h-8 px-4 rounded-lg text-xs font-semibold transition-all duration-200 hover:opacity-90 active:scale-95 disabled:opacity-50"
            style={{
              background: "hsl(var(--goji-berry))",
              color: "hsl(0 0% 100%)",
              boxShadow: "0 2px 8px 0 hsl(var(--goji-coral) / 0.25)",
            }}
          >
            {scrapeStep === "loading" ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Analyzing…
              </span>
            ) : isExpanded ? "Re-analyze" : "Analyze"}
          </Button>
        </div>
      </div>

      {/* Loading skeletons */}
      {scrapeStep === "loading" && (
        <div className="space-y-5 pt-2 border-t border-border mt-2">
          <p className="text-xs text-center pt-4 pb-1" style={{ color: "hsl(var(--goji-text-muted))" }}>
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
      )}

      {/* Expanded fields */}
      {(scrapeStep === "success" || scrapeStep === "error") && (
        <div className="space-y-5 pt-2 border-t border-border mt-2">
          {scrapeStep === "error" && (
            <AnimatedField visible={fieldsVisible} delay={0}>
              <div
                className="flex items-start gap-3 rounded-xl px-4 py-3 text-sm"
                style={{
                  background: "hsl(0 84% 60% / 0.07)",
                  border: "1px solid hsl(0 84% 60% / 0.2)",
                  color: "hsl(0 72% 42%)",
                }}
              >
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            </AnimatedField>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AnimatedField visible={fieldsVisible} delay={100}>
              <div className="space-y-1.5">
                <Label htmlFor="companyName" className="text-sm font-medium" style={{ color: "hsl(var(--goji-dark))" }}>
                  Company Name <span style={{ color: "hsl(var(--goji-coral))" }}>*</span>
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
            </AnimatedField>

            <AnimatedField visible={fieldsVisible} delay={180}>
              <div className="space-y-1.5">
                <Label htmlFor="industry" className="text-sm font-medium" style={{ color: "hsl(var(--goji-dark))" }}>
                  Industry <span style={{ color: "hsl(var(--goji-coral))" }}>*</span>
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
            </AnimatedField>
          </div>

          <AnimatedField visible={fieldsVisible} delay={260}>
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-sm font-medium" style={{ color: "hsl(var(--goji-dark))" }}>
                Company Description &amp; Value Proposition{" "}
                <span style={{ color: "hsl(var(--goji-coral))" }}>*</span>
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
          </AnimatedField>

          <AnimatedField visible={fieldsVisible} delay={340}>
            <div className="space-y-1.5">
              <Label htmlFor="language" className="text-sm font-medium" style={{ color: "hsl(var(--goji-dark))" }}>
                Preferred Language <span style={{ color: "hsl(var(--goji-coral))" }}>*</span>
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
              <p className="text-xs" style={{ color: "hsl(var(--goji-text-muted))" }}>
                This language preference will be used for AI message generation
              </p>
            </div>
          </AnimatedField>

          <AnimatedField visible={fieldsVisible} delay={420}>
            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                disabled={!data.companyName || !data.industry || !data.description || !data.language}
                className="h-11 px-8 rounded-xl font-semibold text-sm transition-all duration-200 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                style={{
                  background: "hsl(var(--goji-berry))",
                  color: "hsl(0 0% 100%)",
                  boxShadow: "0 4px 20px 0 hsl(var(--goji-coral) / 0.3)",
                }}
              >
                Next Step
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </AnimatedField>
        </div>
      )}
    </form>
  );
};

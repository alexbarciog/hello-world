import { useState } from "react";
import { useNavigate } from "react-router-dom";
import intentslyIcon from "@/assets/intentsly-icon.png";
import { supabase } from "@/integrations/supabase/client";
import { scrapeWebsite } from "@/lib/api/firecrawl";
import { markOnboardingComplete, OnboardingEntryGuard } from "@/components/OnboardingGuard";
import { Step1Scan } from "@/components/onboarding/Step1Scan";
import { Step2Preview } from "@/components/onboarding/Step2Preview";
import { toast } from "sonner";

type Phase = "scan" | "preview";

function OnboardingInner() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("scan");

  const [website, setWebsite] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [description, setDescription] = useState("");
  const [industry, setIndustry] = useState("");
  const [language, setLanguage] = useState("English (US)");
  const [services, setServices] = useState<string[]>([]);
  const [painPoints, setPainPoints] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  async function handleAnalyze() {
    setLoading(true);
    setErrorMsg("");
    setLoadingStep(0);

    try {
      // Step 1: Scrape
      const scraped = await scrapeWebsite(website.trim());
      setCompanyName(scraped.companyName);
      setDescription(scraped.description);
      setIndustry(scraped.industry);
      setLanguage(scraped.language);

      // Step 2 & 3: AI extraction in parallel
      setLoadingStep(1);

      const [servicesRes, painsRes] = await Promise.allSettled([
        supabase.functions.invoke("generate-services", {
          body: {
            companyName: scraped.companyName,
            industry: scraped.industry,
            description: scraped.description,
            markdown: scraped.markdown,
          },
        }),
        supabase.functions.invoke("generate-pain-points", {
          body: {
            companyName: scraped.companyName,
            industry: scraped.industry,
            description: scraped.description,
            jobTitles: [],
            targetIndustries: [],
          },
        }),
      ]);

      // Show pain-points step briefly mid-flight for animation feel
      setLoadingStep(2);

      if (servicesRes.status === "fulfilled" && !servicesRes.value.error) {
        const list = (servicesRes.value.data as { services?: string[] })?.services ?? [];
        setServices(Array.isArray(list) ? list.slice(0, 5) : []);
      }
      if (painsRes.status === "fulfilled" && !painsRes.value.error) {
        const list = (painsRes.value.data as { painPoints?: string[] })?.painPoints ?? [];
        setPainPoints(Array.isArray(list) ? list.slice(0, 3) : []);
      }

      // small reveal delay
      await new Promise((r) => setTimeout(r, 300));
      setPhase("preview");
    } catch (err) {
      console.error(err);
      setErrorMsg(
        "We couldn't analyze your website. Double-check the URL and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleContinue() {
    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        toast.error("You must be logged in to continue.");
        setSubmitting(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("current_organization_id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      // Find any existing draft for this user
      const { data: existing } = await supabase
        .from("campaigns")
        .select("id")
        .eq("user_id", session.user.id)
        .eq("status", "draft")
        .order("updated_at", { ascending: false })
        .limit(1);

      const payload = {
        user_id: session.user.id,
        organization_id: profile?.current_organization_id ?? null,
        website: website.trim(),
        company_name: companyName,
        description,
        industry,
        language,
        services,
        pain_points: painPoints,
        status: "paused" as const,
        current_step: 6,
      };

      if (existing && existing.length > 0) {
        const { error } = await supabase
          .from("campaigns")
          .update(payload as any)
          .eq("id", existing[0].id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("campaigns")
          .insert(payload as any);
        if (error) throw error;
      }

      // Mark onboarding complete on profile
      const { error: profErr } = await supabase
        .from("profiles")
        .update({ onboarding_complete: true } as any)
        .eq("user_id", session.user.id);
      if (profErr) console.warn("Failed to set onboarding_complete:", profErr);

      markOnboardingComplete();
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error(err);
      toast.error("Couldn't save your setup. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center px-3 py-6 md:py-12 md:px-4"
      style={{ background: "hsl(195 14% 95%)" }}
    >
      <a href="/" className="flex items-center gap-2 mb-6 md:mb-10 shrink-0">
        <img src={intentslyIcon} alt="Intentsly" className="h-7 md:h-8 object-contain" />
        <span className="text-lg md:text-xl font-bold tracking-tight text-foreground">Intentsly</span>
      </a>

      <div
        className="w-full rounded-2xl md:rounded-3xl bg-card border-2 border-background overflow-hidden flex flex-col"
        style={{
          maxWidth: "640px",
          boxShadow: "0 8px 40px hsl(220 14% 10% / 0.08)",
        }}
      >
        <div className="flex-1 px-5 pt-8 pb-8 md:px-10 md:pt-10 md:pb-10">
          {phase === "scan" && (
            <Step1Scan
              website={website}
              onWebsiteChange={setWebsite}
              onAnalyze={handleAnalyze}
              loading={loading}
              loadingStep={loadingStep}
              errorMsg={errorMsg}
            />
          )}
          {phase === "preview" && (
            <Step2Preview
              companyName={companyName}
              description={description}
              services={services}
              painPoints={painPoints}
              onCompanyNameChange={setCompanyName}
              onDescriptionChange={setDescription}
              onContinue={handleContinue}
              submitting={submitting}
            />
          )}
        </div>
      </div>

      <div className="h-4 md:hidden shrink-0" />
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <OnboardingEntryGuard>
      <OnboardingInner />
    </OnboardingEntryGuard>
  );
}

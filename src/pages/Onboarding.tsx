import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarCheck, Radar } from "lucide-react";
import intentslyIcon from "@/assets/intentsly-icon.png";
import heroGradient from "@/assets/hero-gradient-right.png";
import { supabase } from "@/integrations/supabase/client";
import { scrapeWebsite } from "@/lib/api/firecrawl";
import { markOnboardingComplete, OnboardingEntryGuard } from "@/components/OnboardingGuard";
import { Step1Scan } from "@/components/onboarding/Step1Scan";
import { Step2Preview } from "@/components/onboarding/Step2Preview";
import { StepAccountType, type AccountType } from "@/components/onboarding/StepAccountType";
import { ONBOARDING_EASE } from "@/components/onboarding/ui";
import { Float } from "@/lib/motion";
import { toast } from "sonner";

type Phase = "account_type" | "scan" | "preview";

const PHASE_INDEX: Record<Phase, number> = { account_type: 0, scan: 1, preview: 2 };
const TOTAL_STEPS = 3;

/** Right-hand brand panel: landing hero gradient + dashboard-style preview cards. */
function BrandPanel() {
  return (
    <div className="hidden lg:block relative w-[44%] max-w-[720px] shrink-0 overflow-hidden">
      <img
        src={heroGradient}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 p-10">
        {/* Lead preview card — dashboard lead style */}
        <Float duration={5.5} y={7}>
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4, ease: ONBOARDING_EASE }}
            className="w-[320px] rounded-2xl bg-white/95 backdrop-blur-sm p-4 shadow-[0_12px_40px_rgba(10,10,10,0.12)]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#EDEEFC] text-[#4F46E5] flex items-center justify-center text-sm font-bold">
                SK
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-[#0a0a0a] truncate">Sarah Kim</div>
                <div className="text-xs text-neutral-500 truncate">Founder @ Finlo · 2nd</div>
              </div>
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#0a0a0a] shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                High intent
              </span>
            </div>
            <p className="mt-3 text-xs text-neutral-500 leading-relaxed border-l-2 border-[#EDEEFC] pl-2.5">
              “Can anyone recommend a dev agency to build our MVP? Budget approved…”
            </p>
          </motion.div>
        </Float>

        {/* Signal card */}
        <Float duration={6.2} y={6} delay={0.6}>
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.55, ease: ONBOARDING_EASE }}
            className="w-[320px] -ml-16 rounded-2xl bg-white/95 backdrop-blur-sm p-4 shadow-[0_12px_40px_rgba(10,10,10,0.12)] flex items-center gap-3"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white"
              style={{ background: "var(--gradient-brand)" }}
            >
              <Radar className="w-[18px] h-[18px]" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-[#0a0a0a]">New buying signals</div>
              <div className="text-xs text-neutral-500">23 people posted about your keywords today</div>
            </div>
          </motion.div>
        </Float>

        {/* Meeting card */}
        <Float duration={5} y={8} delay={1.1}>
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.7, ease: ONBOARDING_EASE }}
            className="w-[300px] ml-20 rounded-2xl bg-white/95 backdrop-blur-sm p-4 shadow-[0_12px_40px_rgba(10,10,10,0.12)] flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-[#E9F9EF] flex items-center justify-center shrink-0">
              <CalendarCheck className="w-[18px] h-[18px] text-[#16A34A]" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-[#0a0a0a]">Meeting booked</div>
              <div className="text-xs text-neutral-500">Tomorrow, 10:30 AM — booked by your AI SDR</div>
            </div>
          </motion.div>
        </Float>
      </div>
    </div>
  );
}

function OnboardingInner() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("account_type");
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [savingAccountType, setSavingAccountType] = useState(false);

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

  async function handleAccountTypeContinue() {
    if (!accountType) return;
    setSavingAccountType(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        toast.error("You must be logged in to continue.");
        setSavingAccountType(false);
        return;
      }
      const { error } = await supabase
        .from("profiles")
        .update({ account_type: accountType } as any)
        .eq("user_id", session.user.id);
      if (error) {
        console.warn("Failed to save account_type:", error);
        toast.error("Couldn't save your selection. Please try again.");
        setSavingAccountType(false);
        return;
      }
      setPhase("scan");
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSavingAccountType(false);
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
      const dest = accountType === "agency" ? "/dashboard?welcome=agency" : "/dashboard";
      navigate(dest, { replace: true });
    } catch (err) {
      console.error(err);
      toast.error("Couldn't save your setup. Please try again.");
      setSubmitting(false);
    }
  }

  const stepIndex = PHASE_INDEX[phase];

  return (
    <div className="min-h-screen bg-white flex">
      {/* LEFT — content column */}
      <div className="flex-1 flex flex-col min-h-screen px-5 md:px-12 xl:px-20 py-6 md:py-8">
        {/* Header: logo + step counter */}
        <div className="flex items-center justify-between w-full max-w-xl mx-auto shrink-0">
          <a href="/" className="flex items-center gap-2">
            <img src={intentslyIcon} alt="Intentsly" className="h-7 object-contain" />
            <span className="text-lg font-bold tracking-tight text-[#0a0a0a]">Intentsly</span>
          </a>
          <span className="text-xs font-semibold text-neutral-400 tabular-nums">
            Step {stepIndex + 1} of {TOTAL_STEPS}
          </span>
        </div>

        {/* Progress segments — goji brand gradient fill */}
        <div className="flex gap-1.5 w-full max-w-xl mx-auto mt-5 shrink-0">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div key={i} className="h-1 flex-1 rounded-full bg-[#F4F4F5] overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: "var(--gradient-brand)" }}
                initial={false}
                animate={{ width: i <= stepIndex ? "100%" : "0%" }}
                transition={{ duration: 0.6, ease: ONBOARDING_EASE }}
              />
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="flex-1 flex items-center w-full max-w-xl mx-auto py-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={phase}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.45, ease: ONBOARDING_EASE }}
              className="w-full"
            >
              {phase === "account_type" && (
                <StepAccountType
                  value={accountType}
                  onChange={setAccountType}
                  onContinue={handleAccountTypeContinue}
                  submitting={savingAccountType}
                />
              )}
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
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer micro-copy — landing style */}
        <p className="w-full max-w-xl mx-auto text-[11px] uppercase tracking-[0.14em] text-neutral-400 shrink-0 text-center lg:text-left">
          No contract · Cancel anytime · 5-min setup
        </p>
      </div>

      {/* RIGHT — brand gradient panel */}
      <BrandPanel />
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

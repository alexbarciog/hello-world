import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AuthOnlyGuard } from "@/components/AuthGuard";
import { Loader2, Copy, Check, Sparkles, Target, Award, MessageSquare, Search, Shield, ArrowRight, RefreshCw, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import intentslyIcon from "@/assets/intentsly-icon.png";

const PENDING_KEY = "pending_profile_analysis";

interface Report {
  detected_services: string[];
  overall_score: number;
  headline_score: number;
  about_score: number;
  banner_score: number;
  social_proof_score: number;
  headline_diagnosis: string;
  rewritten_headline: string;
  about_diagnosis: string;
  rewritten_about_hook: string;
  top_3_issues: { title: string; why_it_costs_you: string; exact_fix: string }[];
  missing_keywords: string[];
  conversion_signals_missing: string[];
  quick_wins: string[];
}

type Phase = "idle" | "fetching" | "scoring" | "writing" | "ready" | "error";

const PHASE_STEPS = [
  { key: "fetching", label: "Reading your public profile" },
  { key: "scoring", label: "Scoring 27 conversion signals" },
  { key: "writing", label: "Writing your rewrites" },
];

function ScoreRing({ score, size = 160, stroke = 12 }: { score: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (score / 100) * c;
  const color = score >= 75 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative inline-block">
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#eef2f7" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={color} strokeWidth={stroke} fill="none"
          strokeDasharray={c} strokeDashoffset={off}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-4xl font-bold text-[#0f172a]">{score}</div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">/ 100</div>
      </div>
    </div>
  );
}

function SubScore({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  const color = value >= 75 ? "text-green-600 bg-green-50" : value >= 50 ? "text-amber-600 bg-amber-50" : "text-red-600 bg-red-50";
  return (
    <div className="rounded-2xl bg-white border border-slate-200/70 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}><Icon className="w-4 h-4" /></div>
        <div className="text-2xl font-bold text-[#0f172a]">{value}</div>
      </div>
      <div className="text-xs font-medium text-slate-600">{label}</div>
      <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: value >= 75 ? "#22c55e" : value >= 50 ? "#f59e0b" : "#ef4444" }} />
      </div>
    </div>
  );
}

function CopyCard({ title, diagnosis, text }: { title: string; diagnosis: string; text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-2xl bg-white border border-slate-200/70 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-base font-semibold text-[#0f172a]">{title}</h3>
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(text);
              setCopied(true);
              toast.success("Copied to clipboard");
              setTimeout(() => setCopied(false), 2000);
            }}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#0f172a] text-white text-xs font-semibold hover:opacity-90"
          >
            {copied ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">{diagnosis}</p>
      </div>
      <div className="px-6 py-5 bg-slate-50/60 whitespace-pre-wrap text-sm text-[#0f172a] leading-relaxed font-medium">{text}</div>
    </div>
  );
}

function ReportInner() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("idle");
  const [report, setReport] = useState<Report | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pending, setPending] = useState<{ linkedin_url: string; service_description: string } | null>(null);
  const [analyzedAt, setAnalyzedAt] = useState<string | null>(null);

  useEffect(() => {
    // Load pending input OR the last report
    let stored: { linkedin_url: string; service_description: string } | null = null;
    try {
      const raw = localStorage.getItem(PENDING_KEY);
      if (raw) stored = JSON.parse(raw);
    } catch { /* ignore */ }

    if (stored) {
      setPending(stored);
      runAnalysis(stored);
    } else {
      // Look for the latest ready report on this account
      supabase
        .from("linkedin_profile_analyses")
        .select("linkedin_url, service_description, report, created_at, status")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.status === "ready" && data.report) {
            setReport(data.report as unknown as Report);
            setPending({ linkedin_url: data.linkedin_url, service_description: data.service_description });
            setAnalyzedAt(data.created_at);
            setPhase("ready");
          } else {
            navigate("/linkedin-profile-analyzer");
          }
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runAnalysis(input: { linkedin_url: string; service_description: string }) {
    setPhase("fetching");
    setErrorMsg(null);
    // Fake step animation
    setTimeout(() => setPhase((p) => (p === "fetching" ? "scoring" : p)), 4000);
    setTimeout(() => setPhase((p) => (p === "scoring" ? "writing" : p)), 9000);

    try {
      const { data, error } = await supabase.functions.invoke("analyze-linkedin-profile", {
        body: input,
      });
      if (error) {
        const msg = (error as any)?.context ? await (error as any).context.text?.() : (error as any)?.message;
        throw new Error(typeof msg === "string" ? msg : "Analysis failed");
      }
      if (!data?.report) throw new Error("No report returned");
      setReport(data.report as Report);
      setAnalyzedAt(new Date().toISOString());
      setPhase("ready");
      try { localStorage.removeItem(PENDING_KEY); } catch { /* ignore */ }
    } catch (e: any) {
      console.error("[profile-report] analysis failed", e);
      setErrorMsg(e?.message || "Something went wrong");
      setPhase("error");
    }
  }

  function rerun() {
    if (!pending) { navigate("/linkedin-profile-analyzer"); return; }
    setReport(null);
    runAnalysis(pending);
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      {/* Header */}
      <header className="bg-white border-b border-slate-200/70">
        <div className="max-w-5xl mx-auto px-5 md:px-8 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={intentslyIcon} alt="Intentsly" className="w-6 h-6" />
            <span className="font-semibold text-[#0f172a]">Intentsly</span>
          </Link>
          <Link to="/dashboard" className="text-xs font-semibold text-[#1A8FE3] inline-flex items-center gap-1 hover:underline">
            Go to dashboard <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-5 md:px-8 py-10 md:py-14">
        {/* Loading state */}
        {(phase === "idle" || phase === "fetching" || phase === "scoring" || phase === "writing") && (
          <div className="rounded-3xl bg-white border border-slate-200/70 p-10 md:p-14 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 text-sky-700 text-[11px] font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5" /> Generating your audit
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold text-[#0f172a] mb-2 tracking-tight">Reading your profile like a buyer would…</h1>
            <p className="text-sm text-slate-500 mb-10">This usually takes about 45 seconds. Don't refresh.</p>

            <div className="max-w-md mx-auto space-y-3">
              {PHASE_STEPS.map((s) => {
                const done = phase === "ready" || PHASE_STEPS.findIndex(p => p.key === phase) > PHASE_STEPS.findIndex(p => p.key === s.key);
                const active = s.key === phase;
                return (
                  <div key={s.key} className={`flex items-center gap-3 rounded-xl px-4 py-3 border ${active ? "border-sky-200 bg-sky-50/60" : done ? "border-green-200 bg-green-50/50" : "border-slate-200 bg-white"}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${done ? "bg-green-500 text-white" : active ? "bg-sky-500 text-white" : "bg-slate-200 text-slate-500"}`}>
                      {done ? <Check className="w-3.5 h-3.5" /> : active ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span className="text-[10px] font-bold">·</span>}
                    </div>
                    <span className={`text-sm font-medium ${active ? "text-sky-800" : done ? "text-green-800" : "text-slate-600"}`}>{s.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Error state */}
        {phase === "error" && (
          <div className="rounded-3xl bg-white border border-slate-200/70 p-10 text-center">
            <h1 className="text-2xl font-semibold text-[#0f172a] mb-2">We couldn't finish your audit</h1>
            <p className="text-sm text-slate-500 mb-6">{errorMsg}</p>
            <button onClick={rerun} className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-[#0f172a] text-white text-sm font-semibold">
              <RefreshCw className="w-4 h-4" /> Try again
            </button>
          </div>
        )}

        {/* Ready */}
        {phase === "ready" && report && (
          <div className="space-y-6">
            {/* Overall score card */}
            <div className="rounded-3xl bg-white border border-slate-200/70 p-6 md:p-10">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                <ScoreRing score={report.overall_score} />
                <div className="flex-1 text-center md:text-left">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Your LinkedIn conversion score</div>
                  <h1 className="text-2xl md:text-3xl font-semibold text-[#0f172a] tracking-tight mb-3">
                    {report.overall_score >= 75 ? "You're most of the way there." : report.overall_score >= 50 ? "Solid foundation. Big leaks." : "Your profile is leaking most of its inbound."}
                  </h1>
                  <p className="text-sm text-slate-600 leading-relaxed mb-4">
                    Based on {report.detected_services.length} services we detected, benchmarked against high-converting profiles selling similar offers.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    {report.detected_services.map((s, i) => (
                      <span key={i} className="text-[11px] font-semibold text-[#0f172a] bg-slate-100 px-2.5 py-1 rounded-full">{s}</span>
                    ))}
                  </div>
                  <div className="mt-5 flex flex-wrap gap-3 justify-center md:justify-start">
                    <button onClick={rerun} className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-[#0f172a] hover:bg-slate-50">
                      <RefreshCw className="w-3.5 h-3.5" /> Re-run analysis
                    </button>
                    <Link to="/dashboard" className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[#0f172a] text-white text-xs font-semibold hover:opacity-90">
                      Get real inbound leads <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Sub-scores */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <SubScore icon={Award} label="Headline" value={report.headline_score} />
              <SubScore icon={MessageSquare} label="About section" value={report.about_score} />
              <SubScore icon={Sparkles} label="Banner & photo" value={report.banner_score} />
              <SubScore icon={Shield} label="Social proof" value={report.social_proof_score} />
            </div>

            {/* Rewrites */}
            <div className="grid md:grid-cols-2 gap-4">
              <CopyCard title="Rewritten headline" diagnosis={report.headline_diagnosis} text={report.rewritten_headline} />
              <CopyCard title="Rewritten About hook (first 3 lines)" diagnosis={report.about_diagnosis} text={report.rewritten_about_hook} />
            </div>

            {/* Top 3 issues */}
            <div className="rounded-3xl bg-white border border-slate-200/70 p-6 md:p-8">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center"><Target className="w-4 h-4" /></div>
                <h2 className="text-lg font-semibold text-[#0f172a]">Top 3 leaks silently killing your inbound</h2>
              </div>
              <div className="space-y-4">
                {report.top_3_issues.map((iss, i) => (
                  <div key={i} className="rounded-2xl border border-slate-200/80 p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <span className="w-6 h-6 rounded-full bg-[#0f172a] text-white text-[11px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                      <h3 className="text-base font-semibold text-[#0f172a] leading-snug">{iss.title}</h3>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 ml-9">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-red-600 mb-1.5">Why it costs you</div>
                        <p className="text-sm text-slate-600 leading-relaxed">{iss.why_it_costs_you}</p>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-green-600 mb-1.5">Exact fix</div>
                        <p className="text-sm text-slate-800 leading-relaxed font-medium">{iss.exact_fix}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Keywords + signals */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-3xl bg-white border border-slate-200/70 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center"><Search className="w-4 h-4" /></div>
                  <h2 className="text-base font-semibold text-[#0f172a]">Missing buyer keywords</h2>
                </div>
                <p className="text-xs text-slate-500 mb-4">These are the exact words your buyers search — add them naturally to your headline, About, and Experience.</p>
                <div className="flex flex-wrap gap-2">
                  {report.missing_keywords.map((k, i) => (
                    <span key={i} className="text-xs font-medium text-sky-800 bg-sky-50 px-3 py-1.5 rounded-lg">{k}</span>
                  ))}
                </div>
              </div>
              <div className="rounded-3xl bg-white border border-slate-200/70 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><Shield className="w-4 h-4" /></div>
                  <h2 className="text-base font-semibold text-[#0f172a]">Missing trust signals</h2>
                </div>
                <p className="text-xs text-slate-500 mb-4">Credibility markers your profile is missing that buyers scan for before they DM.</p>
                <ul className="space-y-2">
                  {report.conversion_signals_missing.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700 leading-relaxed">
                      <span className="w-1.5 h-1.5 mt-2 rounded-full bg-amber-500 shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Quick wins */}
            <div className="rounded-3xl bg-[#0f172a] text-white p-6 md:p-8">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-xl bg-[#C8FF00]/20 text-[#C8FF00] flex items-center justify-center"><Sparkles className="w-4 h-4" /></div>
                <h2 className="text-lg font-semibold">Quick-win checklist</h2>
              </div>
              <p className="text-sm text-white/60 mb-5">Do these today. Each takes under 10 minutes.</p>
              <ul className="space-y-3">
                {report.quick_wins.map((w, i) => (
                  <li key={i} className="flex items-start gap-3 rounded-xl bg-white/[0.04] px-4 py-3 border border-white/10">
                    <div className="w-5 h-5 rounded-md border border-[#C8FF00]/50 shrink-0 mt-0.5" />
                    <span className="text-sm leading-relaxed">{w}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold">Fix the profile. Then let Intentsly bring the leads.</div>
                  <div className="text-xs text-white/60 mt-1">We'll surface real people showing intent for what you sell — every day, on autopilot.</div>
                </div>
                <Link to="/dashboard" className="inline-flex items-center gap-1.5 h-10 px-5 rounded-xl bg-[#C8FF00] text-[#0f172a] text-sm font-bold hover:opacity-90 shrink-0">
                  Open my dashboard <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {analyzedAt && (
              <p className="text-center text-[11px] text-slate-400 pt-2">Audit generated {new Date(analyzedAt).toLocaleString()}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProfileReport() {
  return (
    <AuthOnlyGuard>
      <ReportInner />
    </AuthOnlyGuard>
  );
}

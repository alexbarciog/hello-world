// /fake-profile-report/:id: the full Fake LinkedIn Profile Checker report.
// Needs a signed-in user but no plan: it sits outside AuthGuard so free
// accounts never hit the paywall. Opening it claims a check made before
// sign-up (get-fake-profile-report). Not indexed.
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowRight, ExternalLink, Loader2, RotateCcw } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/CTAFooter";
import { DISCLAIMER, RiskGauge, SignalRow } from "@/components/fake-profile/RiskParts";
import { supabase } from "@/integrations/supabase/client";
import { FAKE_PROFILE_CHECKER, FAKE_PROFILE_REPORT_PATH } from "@/data/fakeProfileChecker";
import { type FullReport, getReport, PENDING_KEY, type RiskLevel, track } from "@/lib/fakeProfileChecker";
import { LOW_CONFIDENCE_NOTE, sortSignals } from "../../../supabase/functions/_shared/fake-profile";

const REPORT_HELP = "https://www.linkedin.com/help/linkedin/answer/61664";

const WHAT_TO_DO: Record<RiskLevel, { heading: string; items: React.ReactNode[] }> = {
  high: {
    heading: "Be careful before you reply",
    items: [
      "Don't share documents, phone numbers or payment details.",
      "Verify the person through a second channel: their company's website, a known email address or a mutual connection.",
      <>If you're still unsure, you can report the profile to LinkedIn. <a href={REPORT_HELP} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 inline-flex items-center gap-0.5">How to report a profile <ExternalLink className="w-3 h-3" aria-hidden /></a></>,
    ],
  },
  medium: {
    heading: "Check before you go further",
    items: [
      "Ask one specific question only a real person in that role could answer, such as a detail about their current team or a past project.",
      "Don't share documents or payment details until you've had a straight answer.",
    ],
  },
  low: {
    heading: "Looks like a real person",
    items: ["Nothing in the public profile stands out. Use normal judgement, as with any new contact."],
  },
};

function useNoIndex() {
  useEffect(() => {
    const el = document.createElement("meta");
    el.name = "robots";
    el.content = "noindex, nofollow";
    document.head.appendChild(el);
    const prev = document.title;
    document.title = "Your profile check report | Intentsly";
    return () => {
      el.remove();
      document.title = prev;
    };
  }, []);
}

export default function FakeProfileReport() {
  useNoIndex();
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState<FullReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        navigate(`/login?redirect=${encodeURIComponent(FAKE_PROFILE_REPORT_PATH(id))}`, { replace: true });
        return;
      }
      const r = await getReport(id);
      if (cancelled) return;
      if (r.data) {
        setReport(r.data.report);
        track("fpc_report_view", { risk_level: r.data.report.risk_level });
        try {
          localStorage.removeItem(PENDING_KEY);
        } catch {
          // ignore
        }
      } else setError(r.error || "We couldn't load this report.");
    })();
    return () => { cancelled = true; };
  }, [id, navigate]);

  const signals = report ? sortSignals(report.signals || []) : [];
  const checked = signals.filter((s) => s.status !== "unknown");
  const unknown = signals.filter((s) => s.status === "unknown");
  const todo = report ? WHAT_TO_DO[report.risk_level] : null;

  return (
    <div className="min-h-screen bg-white font-sans text-[#0a0a0a]">
      <Navbar variant="light" />
      <main className="relative overflow-hidden px-5 md:px-8 pt-10 md:pt-16 pb-16">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px]" aria-hidden>
          <div className="absolute -top-40 -left-32 h-[460px] w-[460px] rounded-full bg-[hsl(var(--aeline-lime))]/20 blur-3xl" />
          <div className="absolute -top-20 -right-40 h-[480px] w-[480px] rounded-full bg-[#3B82F6]/12 blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto">
          <Link to={FAKE_PROFILE_CHECKER.path} className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white/80 px-3 py-1 text-[13px] font-medium text-neutral-600 hover:text-neutral-900">← Fake LinkedIn Profile Checker</Link>
          <h1 className="mt-4 font-medium tracking-[-0.03em] leading-[1.05]" style={{ fontSize: "clamp(2rem, 4.5vw, 3rem)" }}>Profile check report</h1>

          {!report && !error && (
            <p className="mt-10 flex items-center gap-2 text-neutral-500"><Loader2 className="w-4 h-4 animate-spin" aria-hidden /> Loading your report…</p>
          )}
          {error && (
            <div className="mt-8 rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
              <p>{error}</p>
              <Link to={FAKE_PROFILE_CHECKER.path} className="mt-3 inline-flex items-center gap-1 font-semibold underline underline-offset-2">Check a profile</Link>
            </div>
          )}

          {report && todo && (
            <>
              <p className="mt-2 text-sm text-neutral-500 break-all">
                <a href={report.linkedin_url} target="_blank" rel="noopener noreferrer nofollow" className="underline underline-offset-2">{report.linkedin_url}</a>
                {" · "}checked {new Date(report.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </p>

              <section className="mt-8 rounded-[28px] border border-neutral-200 bg-white p-6 sm:p-10 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.3)]">
                <RiskGauge score={report.risk_score} level={report.risk_level} lowConfidence={report.low_confidence} />
                {report.low_confidence && <p className="mt-3 text-center text-sm text-neutral-600">{LOW_CONFIDENCE_NOTE}</p>}
                {report.summary && <p className="mt-4 text-center text-[15px] text-neutral-700 leading-relaxed max-w-xl mx-auto">{report.summary}</p>}
              </section>

              <section className="mt-10" aria-labelledby="fpc-signals">
                <h2 id="fpc-signals" className="text-2xl font-medium tracking-[-0.02em]">Every signal we checked</h2>
                <ul className="mt-4 space-y-3">
                  {checked.map((s) => <SignalRow key={s.key} signal={s} />)}
                </ul>
                {unknown.length > 0 && (
                  <details className="mt-4 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50/60 px-4 py-3">
                    <summary className="cursor-pointer text-sm font-medium text-neutral-700">
                      {unknown.length} signal{unknown.length === 1 ? "" : "s"} we couldn't check from the public page (not counted in the score)
                    </summary>
                    <ul className="mt-3 space-y-2">
                      {unknown.map((s) => <SignalRow key={s.key} signal={s} />)}
                    </ul>
                  </details>
                )}
              </section>

              <section className={`mt-10 rounded-[24px] border p-6 md:p-8 ${report.risk_level === "high" ? "bg-rose-50/70 border-rose-200" : report.risk_level === "medium" ? "bg-amber-50/70 border-amber-200" : "bg-emerald-50/70 border-emerald-200"}`} aria-labelledby="fpc-todo">
                <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-500">What to do</p>
                <h2 id="fpc-todo" className="mt-1 text-2xl font-medium tracking-[-0.02em]">{todo.heading}</h2>
                <ul className="mt-3 list-disc pl-5 space-y-2 text-[15px] text-neutral-700 leading-relaxed">
                  {todo.items.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </section>

              <p className="mt-6 rounded-2xl bg-neutral-50 px-4 py-3 text-[13px] text-neutral-500 leading-relaxed">{DISCLAIMER}</p>

              <section className="relative mt-10 overflow-hidden rounded-[28px] bg-[#1A1A2E] text-white p-7 md:p-10">
                <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[hsl(var(--aeline-lime))]/20 blur-3xl" aria-hidden />
                <h2 className="relative text-xl md:text-2xl font-medium tracking-tight leading-snug mb-3">Spend your time on real buyers</h2>
                <p className="relative text-sm md:text-[15px] text-white/75 leading-relaxed mb-6 max-w-2xl">
                  Intentsly finds real people on LinkedIn who are asking for the service you sell, so you spend your time on real buyers.
                </p>
                <div className="relative flex flex-wrap gap-3">
                  <Link to="/try-ai" onClick={() => track("fpc_tryai_click", { from: "report" })} className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--aeline-lime))] px-5 py-3 text-[15px] font-semibold text-[#0a0a0a] hover:brightness-95">
                    See who's asking for what you sell <ArrowRight className="w-4 h-4" aria-hidden />
                  </Link>
                  <Link to={FAKE_PROFILE_CHECKER.path} className="inline-flex items-center gap-1.5 rounded-full border border-white/30 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10">
                    <RotateCcw className="w-4 h-4" aria-hidden /> Check another profile
                  </Link>
                </div>
              </section>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

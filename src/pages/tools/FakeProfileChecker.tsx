// /fake-linkedin-profile-checker: free check of a LinkedIn profile's risk
// signals. The visitor sees the risk level, the score and the strongest signal;
// a free account unlocks the full report (/fake-profile-report/:id).
// Prerendered: the tool shell, the guide and the FAQ are in the static HTML.
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Check, Loader2, Lock, ShieldCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/CTAFooter";
import { RelatedTools, useToolHead } from "@/components/FreeTool";
import FakeProfileGuide from "@/components/fake-profile/FakeProfileGuide";
import { RiskGauge, SignalRow } from "@/components/fake-profile/RiskParts";
import { FAKE_PROFILE_CHECKER as T, FAKE_PROFILE_FAQS, FAKE_PROFILE_REPORT_PATH } from "@/data/fakeProfileChecker";
import {
  type CheckTeaser, getTurnstileToken, loadTurnstile, PENDING_KEY, runCheck, track, visitSource,
} from "@/lib/fakeProfileChecker";

// Same pattern as the LinkedIn Profile Analyzer.
const LINKEDIN_RE = /^https?:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\/in\/[^/?#\s]+/i;

const STAGES = [
  "Reading the public profile",
  "Checking the photo",
  "Checking work history",
  "Checking activity and connections",
  "Scoring",
];
const STAGE_MS = 3500;

type Phase =
  | { kind: "idle" }
  | { kind: "checking"; stage: number }
  | { kind: "teaser"; result: CheckTeaser }
  | { kind: "error"; message: string };

export default function FakeProfileChecker() {
  useToolHead(T.title, T.description, T.path);
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const turnstileRef = useRef<HTMLDivElement>(null);
  const timer = useRef<number>();

  useEffect(() => {
    track("fpc_view");
    return () => window.clearInterval(timer.current);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = url.trim();
    if (!LINKEDIN_RE.test(value)) {
      setPhase({ kind: "error", message: "Paste a personal LinkedIn profile link, like https://www.linkedin.com/in/name." });
      return;
    }
    track("fpc_submit");
    setPhase({ kind: "checking", stage: 0 });
    window.clearInterval(timer.current);
    timer.current = window.setInterval(() => {
      setPhase((p) => (p.kind === "checking" && p.stage < STAGES.length - 2 ? { kind: "checking", stage: p.stage + 1 } : p));
    }, STAGE_MS);

    let token: string | null = null;
    try {
      token = turnstileRef.current ? await getTurnstileToken(turnstileRef.current) : null;
    } catch {
      window.clearInterval(timer.current);
      setPhase({ kind: "error", message: "We couldn't confirm you're a person. Please reload the page and try again." });
      return;
    }

    const r = await runCheck(value, token, visitSource());
    window.clearInterval(timer.current);
    if (!r.data) {
      setPhase({ kind: "error", message: r.error || "Something went wrong. Please try again." });
      return;
    }
    setPhase({ kind: "checking", stage: STAGES.length });
    track("fpc_result", { risk_level: r.data.risk_level, low_confidence: r.data.low_confidence });
    if (r.data.owned) {
      navigate(FAKE_PROFILE_REPORT_PATH(r.data.id));
      return;
    }
    window.setTimeout(() => setPhase({ kind: "teaser", result: r.data! }), 400);
  };

  const unlock = (id: string) => {
    try {
      localStorage.setItem(PENDING_KEY, JSON.stringify({ check_id: id }));
    } catch {
      // private mode: the redirect still carries the id
    }
    track("fpc_unlock_click");
    navigate(`/register?source=fake_profile_checker&redirect=${encodeURIComponent(FAKE_PROFILE_REPORT_PATH(id))}`);
  };

  const busy = phase.kind === "checking";

  return (
    <div className="min-h-screen bg-white font-sans text-[#0a0a0a]">
      <Navbar variant="light" />
      <main>
        <section className="px-5 md:px-8 pt-12 md:pt-20 pb-8">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.14em] uppercase text-[#2563EB] mb-4">
              <ShieldCheck className="w-4 h-4" aria-hidden /> Free tool
            </span>
            <h1 className="font-medium tracking-[-0.03em] leading-[1.05]" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>
              Fake LinkedIn Profile Checker
            </h1>
            <p className="mt-4 text-[17px] text-neutral-600 leading-relaxed">
              Paste a LinkedIn profile URL. In about 20 seconds you'll see how likely it is to be fake, and why. Free.
            </p>
          </div>
        </section>

        <section className="px-5 md:px-8 pb-14" aria-label="Check a profile">
          <div className="max-w-2xl mx-auto">
            <form onSubmit={submit} className="rounded-2xl border border-neutral-200 p-3 sm:p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <label htmlFor="fpc-url" className="sr-only">LinkedIn profile URL</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="fpc-url" type="url" inputMode="url" autoComplete="off" required
                  value={url} onChange={(e) => setUrl(e.target.value)} onFocus={() => { loadTurnstile().catch(() => {}); }}
                  placeholder="https://www.linkedin.com/in/…"
                  className="flex-1 min-w-0 rounded-xl border border-neutral-200 px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
                />
                <button
                  type="submit" disabled={busy}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#0a0a0a] text-white px-5 py-3 text-[15px] font-semibold disabled:opacity-60"
                >
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : null}
                  Check profile
                </button>
              </div>
              <div ref={turnstileRef} />
            </form>
            <p className="mt-2 text-center text-xs text-neutral-500">We only read the public profile. Nothing is sent to the person.</p>

            <div aria-live="polite" className="mt-6">
              {phase.kind === "checking" && (
                <ol className="mx-auto max-w-sm space-y-2.5">
                  {STAGES.map((label, i) => {
                    const done = i < phase.stage;
                    const active = i === phase.stage;
                    return (
                      <li key={label} className={`flex items-center gap-2.5 text-sm ${done ? "text-neutral-900" : active ? "text-neutral-900" : "text-neutral-400"}`}>
                        <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${done ? "bg-emerald-600 border-emerald-600 text-white" : "border-neutral-300"}`}>
                          {done ? <Check className="w-3.5 h-3.5" aria-hidden /> : active ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden /> : null}
                        </span>
                        {label}
                      </li>
                    );
                  })}
                </ol>
              )}

              {phase.kind === "error" && (
                <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{phase.message}</p>
              )}

              {phase.kind === "teaser" && <Teaser result={phase.result} onUnlock={unlock} />}
            </div>
          </div>
        </section>

        <FakeProfileGuide />

        <section className="px-5 md:px-8 py-14" aria-labelledby="fpc-faq">
          <div className="max-w-3xl mx-auto">
            <h2 id="fpc-faq" className="font-medium tracking-[-0.02em] text-2xl md:text-3xl mb-6">Questions about the LinkedIn profile checker</h2>
            <div className="divide-y divide-neutral-200 border-y border-neutral-200">
              {FAKE_PROFILE_FAQS.map((f) => (
                <details key={f.q} className="group py-4">
                  <summary className="cursor-pointer list-none flex items-center justify-between gap-4 text-[15px] font-medium">
                    {f.q}
                    <span className="text-neutral-500 transition-transform group-open:rotate-45" aria-hidden>+</span>
                  </summary>
                  <p className="mt-2 text-sm text-neutral-600 leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 md:px-8 pb-14">
          <div className="max-w-3xl mx-auto rounded-[24px] bg-[#1A1A2E] text-white p-7 md:p-9">
            <h2 className="text-xl md:text-2xl font-medium tracking-tight leading-snug mb-3">Spend your time on real buyers</h2>
            <p className="text-sm md:text-[15px] text-white/75 leading-relaxed mb-6 max-w-2xl">
              Intentsly finds real people on LinkedIn who are asking for the service you sell, so you spend your time on real buyers.
            </p>
            <Link to="/try-ai" onClick={() => track("fpc_tryai_click", { from: "checker" })} className="btn-cta inline-flex">
              See who's asking for what you sell <ArrowRight className="w-4 h-4" aria-hidden />
            </Link>
          </div>
        </section>

        <RelatedTools current="fake_profile_checker" />
      </main>
      <Footer />
    </div>
  );
}

function Teaser({ result, onUnlock }: { result: CheckTeaser; onUnlock: (id: string) => void }) {
  const placeholders = Math.min(result.more_count, 12);
  return (
    <div className="rounded-2xl border border-neutral-200 p-5 sm:p-7">
      <RiskGauge score={result.risk_score} level={result.risk_level} lowConfidence={result.low_confidence} />
      {result.low_confidence_note && <p className="mt-3 text-center text-sm text-neutral-600">{result.low_confidence_note}</p>}

      {result.top_signal && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Strongest signal</h2>
          <ul className="divide-y divide-neutral-100"><SignalRow signal={result.top_signal} showWeight={false} /></ul>
        </div>
      )}

      {placeholders > 0 && (
        <div className="mt-4">
          <p className="text-sm font-semibold text-neutral-900">We found {result.more_count} more signal{result.more_count === 1 ? "" : "s"}</p>
          {/* Placeholder text only: the real signals aren't sent to the browser before sign-up. */}
          <ul className="mt-2 space-y-2 select-none" aria-hidden>
            {Array.from({ length: placeholders }, (_, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="h-5 w-20 rounded-full bg-neutral-200" />
                <span className="blur-[5px] text-[15px] text-neutral-700">{i % 2 ? "Signal details hidden until you sign in" : "Another signal from this profile"}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 rounded-xl bg-neutral-50 border border-neutral-200 p-5">
        <p className="text-[15px] text-neutral-800 leading-relaxed">
          See the full report: every signal, what it means, and what to do before you reply. Create a free account, no card needed.
        </p>
        <button
          type="button" onClick={() => onUnlock(result.id)}
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#0a0a0a] text-white px-5 py-3 text-[15px] font-semibold"
        >
          <Lock className="w-4 h-4" aria-hidden /> Unlock the full report
        </button>
      </div>
    </div>
  );
}

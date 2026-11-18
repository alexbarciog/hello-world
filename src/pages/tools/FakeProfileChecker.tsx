// /fake-linkedin-profile-checker: free check of a LinkedIn profile's risk
// signals. The visitor sees the risk level, the score and the strongest signal;
// a free account unlocks the full report (/fake-profile-report/:id).
// Prerendered: the tool shell, the guide and the FAQ are in the static HTML.
// CSS-only visuals (no animation library) to keep Lighthouse scores up.
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Check, Clock, EyeOff, Linkedin, Loader2, Lock, ShieldCheck, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/CTAFooter";
import { RelatedTools, useToolHead } from "@/components/FreeTool";
import FakeProfileGuide from "@/components/fake-profile/FakeProfileGuide";
import { RiskGauge, SignalRow } from "@/components/fake-profile/RiskParts";
import { FAKE_PROFILE_CHECKER as T, FAKE_PROFILE_FAQS, FAKE_PROFILE_REPORT_PATH } from "@/data/fakeProfileChecker";
import {
  type CheckTeaser, getTurnstileToken, loadTurnstile, PENDING_KEY, runCheck, type Signal, track, visitSource,
} from "@/lib/fakeProfileChecker";
import { SIGNAL_DEFS } from "../../../supabase/functions/_shared/fake-profile";

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

// Illustrative only, and labelled "Example" on the page.
const EXAMPLE: Signal[] = [
  { key: "no_experience", status: "red", title: "No work history visible", observed: "", weight: 14 },
  { key: "brand_only_headline", status: "caution", title: "Big-brand title that isn't in the work history", observed: "", weight: 6 },
  { key: "location_missing", status: "fine", title: "Location shown", observed: "", weight: 4 },
];

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
  const panelRef = useRef<HTMLDivElement>(null);
  const timer = useRef<number>();

  useEffect(() => {
    track("fpc_view");
    return () => window.clearInterval(timer.current);
  }, []);

  const showPanel = () => {
    // On phones the panel sits under the form: bring it into view.
    if (window.matchMedia("(max-width: 1023px)").matches) panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = url.trim();
    if (!LINKEDIN_RE.test(value)) {
      setPhase({ kind: "error", message: "Paste a personal LinkedIn profile link, like https://www.linkedin.com/in/name." });
      return;
    }
    track("fpc_submit");
    setPhase({ kind: "checking", stage: 0 });
    showPanel();
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
        {/* ── Hero + tool ── */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            <div className="absolute -top-40 -left-32 h-[520px] w-[520px] rounded-full bg-[hsl(var(--aeline-lime))]/25 blur-3xl" />
            <div className="absolute top-10 -right-40 h-[560px] w-[560px] rounded-full bg-[#3B82F6]/15 blur-3xl" />
            <div
              className="absolute inset-0 opacity-[0.35]"
              style={{ backgroundImage: "radial-gradient(#d4d4d4 1px, transparent 1px)", backgroundSize: "22px 22px", maskImage: "linear-gradient(to bottom, black, transparent 85%)", WebkitMaskImage: "linear-gradient(to bottom, black, transparent 85%)" }}
            />
          </div>

          <div className="relative max-w-6xl mx-auto px-5 md:px-8 pt-10 md:pt-20 pb-16 md:pb-24">
            <div className="grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:items-center">
              {/* Left: copy + form */}
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white/80 px-3.5 py-1.5 text-[13px] font-semibold text-neutral-900 shadow-sm backdrop-blur">
                  <ShieldCheck className="h-4 w-4 text-[#2563EB]" aria-hidden /> Free LinkedIn profile checker
                </span>
                <h1 className="mt-6 font-medium tracking-[-0.035em] leading-[1.02]" style={{ fontSize: "clamp(2.4rem, 6vw, 4.5rem)" }}>
                  Fake <span className="text-[#2563EB]">LinkedIn</span> Profile{" "}
                  <span className="relative whitespace-nowrap">
                    <span className="relative z-10">Checker</span>
                    <span className="absolute inset-x-0 bottom-[0.08em] h-[0.32em] -z-0 rounded bg-[hsl(var(--aeline-lime))]" aria-hidden />
                  </span>
                </h1>
                <p className="mt-5 text-[17px] md:text-xl text-neutral-600 leading-relaxed max-w-xl">
                  Paste a LinkedIn profile URL. In about 20 seconds you'll see how likely it is to be fake, and why. Free.
                </p>

                <form onSubmit={submit} className="mt-8 rounded-3xl border border-neutral-200 bg-white p-3 shadow-[0_24px_60px_-24px_rgba(15,23,42,0.25)]">
                  <label htmlFor="fpc-url" className="sr-only">LinkedIn profile URL</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1 min-w-0">
                      <Linkedin className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-[#0A66C2]" aria-hidden />
                      <input
                        id="fpc-url" type="url" inputMode="url" autoComplete="off" required
                        value={url}
                        onChange={(e) => { setUrl(e.target.value); if (phase.kind === "error") setPhase({ kind: "idle" }); }}
                        onFocus={() => { loadTurnstile().catch(() => {}); }}
                        placeholder="https://www.linkedin.com/in/…"
                        className="h-14 w-full rounded-2xl border border-neutral-200 bg-neutral-50/60 pl-11 pr-4 text-[15px] placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/10 transition"
                      />
                    </div>
                    <button
                      type="submit" disabled={busy}
                      className="h-14 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0a0a0a] px-6 text-[15px] font-semibold text-white hover:bg-neutral-800 transition-colors disabled:opacity-60"
                    >
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                      Check profile
                      {!busy && <ArrowRight className="h-4 w-4" aria-hidden />}
                    </button>
                  </div>
                  <div ref={turnstileRef} />
                  {phase.kind === "error" && (
                    <p role="alert" className="mx-1 mt-3 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-800">{phase.message}</p>
                  )}
                </form>
                <p className="mt-3 flex items-center gap-1.5 text-[13px] text-neutral-500">
                  <Lock className="h-3.5 w-3.5" aria-hidden /> We only read the public profile. Nothing is sent to the person.
                </p>

                <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-[13px] font-medium text-neutral-600">
                  <li className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4 text-neutral-400" aria-hidden /> About 20 seconds</li>
                  <li className="inline-flex items-center gap-1.5"><Sparkles className="h-4 w-4 text-neutral-400" aria-hidden /> {SIGNAL_DEFS.length} risk signals</li>
                  <li className="inline-flex items-center gap-1.5"><EyeOff className="h-4 w-4 text-neutral-400" aria-hidden /> Read-only, never contacts them</li>
                </ul>
              </div>

              {/* Right: example → progress → result */}
              <div ref={panelRef} aria-live="polite" className="scroll-mt-24">
                {phase.kind === "checking" ? (
                  <Progress stage={phase.stage} />
                ) : phase.kind === "teaser" ? (
                  <Teaser result={phase.result} onUnlock={unlock} />
                ) : (
                  <ExampleCard />
                )}
              </div>
            </div>
          </div>
        </section>

        <FakeProfileGuide />

        {/* ── FAQ ── */}
        <section className="px-5 md:px-8 py-16 md:py-24 bg-[#F7F7F5]" aria-labelledby="fpc-faq">
          <div className="max-w-6xl mx-auto grid gap-10 lg:grid-cols-[1fr_1.6fr]">
            <div>
              <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-600 ring-1 ring-neutral-200">FAQ</span>
              <h2 id="fpc-faq" className="mt-4 font-medium tracking-[-0.03em] leading-[1.08]" style={{ fontSize: "clamp(1.75rem, 3.6vw, 2.75rem)" }}>
                Questions about the LinkedIn profile checker
              </h2>
            </div>
            <div className="space-y-3">
              {FAKE_PROFILE_FAQS.map((f) => (
                <details key={f.q} className="group rounded-2xl bg-white border border-neutral-200 px-5 py-4 open:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)]">
                  <summary className="cursor-pointer list-none flex items-center justify-between gap-4 text-[15px] md:text-base font-semibold text-neutral-900">
                    {f.q}
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 transition-transform group-open:rotate-45" aria-hidden>+</span>
                  </summary>
                  <p className="mt-3 text-[15px] text-neutral-600 leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <div className="pt-16"><RelatedTools current="fake_profile_checker" /></div>
      </main>
      <Footer />
    </div>
  );
}

function PanelShell({ children, label }: { children: React.ReactNode; label?: string }) {
  return (
    <div className="relative">
      <div className="absolute -inset-3 rounded-[36px] bg-gradient-to-br from-[hsl(var(--aeline-lime))]/40 via-white/0 to-[#3B82F6]/25 blur-xl" aria-hidden />
      <div className="relative rounded-[28px] border border-neutral-200 bg-white p-5 sm:p-7 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.35)]">
        {label && (
          <span className="absolute right-5 top-5 rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">{label}</span>
        )}
        {children}
      </div>
    </div>
  );
}

function ExampleCard() {
  return (
    <PanelShell label="Example">
      <p className="text-[13px] font-semibold text-neutral-500">What you'll see</p>
      <div className="mt-3"><RiskGauge score={72} level="high" size="sm" /></div>
      <ul className="mt-6 space-y-2.5">
        {EXAMPLE.map((s) => <SignalRow key={s.key} signal={s} showWeight={false} compact />)}
      </ul>
      <p className="mt-4 text-center text-[12px] text-neutral-500">Illustration. Your result depends on the profile you check.</p>
    </PanelShell>
  );
}

function Progress({ stage }: { stage: number }) {
  const pct = Math.min(100, Math.round((Math.min(stage, STAGES.length) / STAGES.length) * 100));
  return (
    <PanelShell>
      <p className="text-[13px] font-semibold text-neutral-500">Checking the profile</p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-100" aria-hidden>
        <div className="h-full rounded-full bg-[#0a0a0a] transition-[width] duration-700" style={{ width: `${Math.max(8, pct)}%` }} />
      </div>
      <ol className="mt-6 space-y-3">
        {STAGES.map((label, i) => {
          const done = i < stage;
          const active = i === stage;
          return (
            <li key={label} className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-[15px] transition-colors ${done ? "border-emerald-200 bg-emerald-50/60 text-neutral-900" : active ? "border-neutral-300 bg-white text-neutral-900" : "border-neutral-100 text-neutral-400"}`}>
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${done ? "bg-emerald-600 text-white" : "border border-neutral-300"}`}>
                {done ? <Check className="h-3.5 w-3.5" aria-hidden /> : active ? <Loader2 className="h-3.5 w-3.5 animate-spin text-neutral-700" aria-hidden /> : null}
              </span>
              {label}
            </li>
          );
        })}
      </ol>
    </PanelShell>
  );
}

function Teaser({ result, onUnlock }: { result: CheckTeaser; onUnlock: (id: string) => void }) {
  const placeholders = Math.min(result.more_count, 5);
  return (
    <PanelShell>
      <RiskGauge score={result.risk_score} level={result.risk_level} lowConfidence={result.low_confidence} />
      {result.low_confidence_note && <p className="mt-3 text-center text-sm text-neutral-600">{result.low_confidence_note}</p>}

      {result.top_signal && (
        <div className="mt-6">
          <h2 className="mb-2 text-[12px] font-semibold uppercase tracking-[0.1em] text-neutral-500">Strongest signal</h2>
          <ul><SignalRow signal={result.top_signal} showWeight={false} /></ul>
        </div>
      )}

      {placeholders > 0 && (
        <div className="relative mt-5">
          <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.1em] text-neutral-500">
            We found {result.more_count} more signal{result.more_count === 1 ? "" : "s"}
          </p>
          {/* Placeholder text only: the real signals aren't sent to the browser before sign-up. */}
          <ul className="space-y-2 select-none" aria-hidden>
            {Array.from({ length: placeholders }, (_, i) => (
              <li key={i} className="flex items-center gap-3 rounded-2xl border border-neutral-200 px-4 py-3">
                <span className="h-8 w-8 shrink-0 rounded-xl bg-neutral-100" />
                <span className="blur-[6px] text-[15px] text-neutral-700">{i % 2 ? "Signal details hidden until you sign in" : "Another signal from this profile"}</span>
              </li>
            ))}
          </ul>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" aria-hidden />
        </div>
      )}

      <div className="mt-4 rounded-2xl bg-[#1A1A2E] p-5 text-white">
        <p className="text-[15px] leading-relaxed text-white/85">
          See the full report: every signal, what it means, and what to do before you reply. Create a free account, no card needed.
        </p>
        <button
          type="button" onClick={() => onUnlock(result.id)}
          className="mt-4 inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-[hsl(var(--aeline-lime))] px-5 py-3 text-[15px] font-semibold text-[#0a0a0a] hover:brightness-95"
        >
          <Lock className="h-4 w-4" aria-hidden /> Unlock the full report
        </button>
      </div>
    </PanelShell>
  );
}

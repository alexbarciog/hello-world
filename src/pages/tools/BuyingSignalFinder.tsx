// /buying-signals and /buying-signals/:service. Type a service (or open one of
// the 12 service pages) and see how buyers phrase it on LinkedIn, the roles
// that post it and, when there are enough, a live count of recent signals.
// Prerendered: service pages carry their static wording in the HTML; the count
// loads client-side. CSS-only visuals (no animation library).
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowRight, Check, EyeOff, LayoutGrid, Loader2, Radar, Search } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/CTAFooter";
import { RelatedTools, useToolHead } from "@/components/FreeTool";
import { ExampleCard, Progress, SignalReport, STAGES } from "@/components/buying-signals/SignalPanel";
import { HowItWorks, ServiceGrid, SignalCta, SignalFaq, WhatIsASignal, serviceIcon } from "@/components/buying-signals/BuyingSignalGuide";
import { BUYING_SIGNAL_FINDER as T, SIGNAL_SERVICES, findService, servicePage } from "@/data/freeTools";
import { findSignals, type SignalStats, type SignalsResult } from "@/lib/freeTools";
import { capitalise } from "@/lib/signalText";
import NotFound from "@/pages/NotFound";

const STAGE_MS = 2200;
const EXAMPLE_SERVICE = SIGNAL_SERVICES[0];

/** Renders the H1 text unchanged, with one phrase in blue and one on a lime bar. */
function Headline({ text, blue, mark }: { text: string; blue: string; mark: string }) {
  const b = text.indexOf(blue);
  const m = text.lastIndexOf(mark);
  if (b < 0 || m < 0 || m < b + blue.length) return <>{text}</>;
  return (
    <>
      {text.slice(0, b)}
      <span className="text-[#2563EB]">{blue}</span>
      {text.slice(b + blue.length, m)}
      <span className="relative whitespace-nowrap">
        <span className="relative z-10">{mark}</span>
        <span className="absolute inset-x-0 bottom-[0.08em] h-[0.32em] -z-0 rounded bg-[hsl(var(--aeline-lime))]" aria-hidden />
      </span>
      {text.slice(m + mark.length)}
    </>
  );
}

export default function BuyingSignalFinder() {
  const { service: slug } = useParams();
  const navigate = useNavigate();
  const known = findService(slug);
  const page = known ? servicePage(known) : null;
  useToolHead(page?.title ?? T.title, page?.description ?? T.description, page?.path ?? T.path);

  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [typed, setTyped] = useState<{ service: string; result: SignalsResult } | null>(null);
  const [stats, setStats] = useState<SignalStats | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const timer = useRef<number>();

  useEffect(() => () => window.clearInterval(timer.current), []);

  // Service pages: the wording is static (and prerendered); stats are live.
  useEffect(() => {
    setStats(null);
    setTyped(null);
    setError(null);
    if (!known) return;
    let cancelled = false;
    findSignals(known.name, { terms: known.terms, statsOnly: true }).then((r) => {
      if (!cancelled && r.data) setStats(r.data.stats);
    });
    return () => { cancelled = true; };
  }, [known]);

  if (slug && !known) return <NotFound />;

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q.length < 3) {
      setError("Type at least 3 characters, like \"SEO\" or \"web design\".");
      return;
    }
    const match = SIGNAL_SERVICES.find((s) => s.name.toLowerCase() === q.toLowerCase() || s.terms.includes(q.toLowerCase()));
    if (match) {
      navigate(`/buying-signals/${match.slug}`);
      return;
    }
    setBusy(true);
    setStage(0);
    setError(null);
    setTyped(null);
    setStats(null);
    // On phones the panel sits under the form: bring it into view.
    if (window.matchMedia("(max-width: 1023px)").matches) panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.clearInterval(timer.current);
    timer.current = window.setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), STAGE_MS);
    const r = await findSignals(q);
    window.clearInterval(timer.current);
    setBusy(false);
    if (r.error) setError(r.error);
    else if (r.data?.result) {
      setTyped({ service: q, result: r.data.result });
      setStats(r.data.stats);
    }
  };

  // A typed search shows its own report, even on a service page.
  const report = typed
    ? { service: typed.service, phrasings: typed.result.phrasings, typical: typed.result.roles, path: T.path }
    : known
      ? { service: known.name, phrasings: known.phrasings, typical: known.roles, path: page!.path }
      : null;
  // Real, anonymised roles when there are enough of them; typical roles otherwise.
  const realRoles = Boolean(stats?.roles?.length);
  const roles = realRoles ? stats!.roles : report?.typical ?? [];
  const h1 = page?.h1 ?? T.h1;

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
            <div className="grid gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-14 lg:items-start">
              {/* Left: copy + form. Sticky so a long report doesn't leave it behind. */}
              <div className="min-w-0 lg:pt-10 lg:sticky lg:top-24">
                <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white/80 px-3.5 py-1.5 text-[13px] font-semibold text-neutral-900 shadow-sm backdrop-blur">
                  <Radar className="h-4 w-4 text-[#2563EB]" aria-hidden /> {known ? `Buying signals · ${capitalise(known.name)}` : "Free buying signal finder"}
                </span>
                <h1 className="mt-6 font-medium tracking-[-0.035em] leading-[1.04] break-words" style={{ fontSize: known ? "clamp(2.1rem, 4.6vw, 3.75rem)" : "clamp(2.4rem, 6vw, 4.5rem)" }}>
                  {known ? <Headline text={h1} blue={known.name} mark="LinkedIn" /> : <Headline text={h1} blue="signal" mark="finder" />}
                </h1>
                <p className="mt-5 text-[17px] md:text-xl text-neutral-600 leading-relaxed max-w-xl">{T.promise}</p>

                <form onSubmit={search} className="mt-8 rounded-3xl border border-neutral-200 bg-white p-3 shadow-[0_24px_60px_-24px_rgba(15,23,42,0.25)]">
                  <label htmlFor="service" className="block px-1.5 pb-2 pt-0.5 text-[13px] font-semibold text-neutral-700">What do you sell?</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1 min-w-0">
                      <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-neutral-500" aria-hidden />
                      <input
                        id="service" value={query} maxLength={80} autoComplete="off"
                        onChange={(e) => { setQuery(e.target.value); if (error) setError(null); }}
                        placeholder={known ? "Try another service…" : "e.g. web design, SEO, pen testing"}
                        className="h-14 w-full rounded-2xl border border-neutral-200 bg-neutral-50 pl-11 pr-4 text-[15px] placeholder:text-neutral-500 focus:bg-white focus:outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/10 transition"
                      />
                    </div>
                    <button
                      type="submit" disabled={busy}
                      className="h-14 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0a0a0a] px-6 text-[15px] font-semibold text-white hover:bg-neutral-800 transition-colors disabled:opacity-60"
                    >
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                      {busy ? "Looking…" : "Find signals"}
                      {!busy && <ArrowRight className="h-4 w-4" aria-hidden />}
                    </button>
                  </div>
                  {error && <p role="alert" className="mx-1 mt-3 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-800">{error}</p>}
                </form>

                <nav className="mt-6" aria-labelledby="bsf-quick">
                  <p id="bsf-quick" className="text-[13px] font-semibold text-neutral-600">Or open a ready-made report</p>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {SIGNAL_SERVICES.map((s) => {
                      const Icon = serviceIcon(s.slug);
                      const here = s.slug === known?.slug;
                      return (
                        <li key={s.slug}>
                          <Link
                            to={`/buying-signals/${s.slug}`} aria-current={here ? "page" : undefined}
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors ${here ? "border-[#0a0a0a] bg-[#0a0a0a] text-white" : "border-neutral-200 bg-white text-neutral-800 hover:border-neutral-400"}`}
                          >
                            <Icon className={`h-3.5 w-3.5 ${here ? "text-[hsl(var(--aeline-lime))]" : "text-neutral-500"}`} aria-hidden />
                            {capitalise(s.name)}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </nav>

                <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-[13px] font-medium text-neutral-600">
                  <li className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-neutral-500" aria-hidden /> Free, no signup</li>
                  <li className="inline-flex items-center gap-1.5"><LayoutGrid className="h-4 w-4 text-neutral-500" aria-hidden /> {SIGNAL_SERVICES.length} ready-made reports</li>
                  <li className="inline-flex items-center gap-1.5"><EyeOff className="h-4 w-4 text-neutral-500" aria-hidden /> Counts without names or post text</li>
                </ul>
              </div>

              {/* Right: example → progress → report */}
              <div ref={panelRef} aria-live="polite" className="min-w-0 scroll-mt-24">
                {busy ? (
                  <Progress stage={stage} />
                ) : report ? (
                  <SignalReport
                    service={report.service}
                    phrasings={report.phrasings}
                    roles={roles}
                    realRoles={realRoles}
                    postRoles={report.typical}
                    count={stats?.count}
                    sharePath={report.path}
                    tool={T.id as "buying_signal_finder"}
                  />
                ) : (
                  <ExampleCard name={EXAMPLE_SERVICE.name} phrasings={EXAMPLE_SERVICE.phrasings} roles={EXAMPLE_SERVICE.roles} />
                )}
              </div>
            </div>
          </div>
        </section>

        <HowItWorks />
        <WhatIsASignal />
        <ServiceGrid current={known?.slug} />
        <SignalFaq faq={T.faq} />
        {report ? (
          <SignalCta
            heading={`Find the people asking for ${report.service}, every day.`}
            body="Intentsly watches LinkedIn for these signals, scores each person against your ideal customer and starts the conversation. See it on your own market in under a minute, no account needed."
          />
        ) : (
          <SignalCta
            heading="See who is showing buying signals for what you sell, today."
            body="Tell Intentsly who you sell to and it shows you real people on LinkedIn signalling intent. It takes under a minute and needs no account."
          />
        )}
        <RelatedTools current={T.id} />
      </main>
      <Footer />
    </div>
  );
}

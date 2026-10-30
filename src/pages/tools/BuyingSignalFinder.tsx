import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Loader2, Search } from "lucide-react";
import { FreeToolLayout, ShareResult, ToolEmailCapture } from "@/components/FreeTool";
import { BUYING_SIGNAL_FINDER as T, SIGNAL_SERVICES, findService, servicePage } from "@/data/freeTools";
import { findSignals, type SignalStats, type SignalsResult } from "@/lib/freeTools";
import NotFound from "@/pages/NotFound";

export default function BuyingSignalFinder() {
  const { service: slug } = useParams();
  const navigate = useNavigate();
  const known = findService(slug);

  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typed, setTyped] = useState<{ service: string; result: SignalsResult } | null>(null);
  const [stats, setStats] = useState<SignalStats | null>(null);

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
    if (q.length < 3) return;
    const match = SIGNAL_SERVICES.find((s) => s.name.toLowerCase() === q.toLowerCase() || s.terms.includes(q.toLowerCase()));
    if (match) {
      navigate(`/buying-signals/${match.slug}`);
      return;
    }
    setBusy(true);
    setError(null);
    setTyped(null);
    setStats(null);
    const r = await findSignals(q);
    setBusy(false);
    if (r.error) setError(r.error);
    else if (r.data?.result) {
      setTyped({ service: q, result: r.data.result });
      setStats(r.data.stats);
    }
  };

  const page = known ? servicePage(known) : null;
  const serviceName = known?.name ?? typed?.service ?? null;
  const phrasings = known?.phrasings ?? typed?.result.phrasings ?? [];
  // Real, anonymised roles when there are enough of them; typical roles otherwise.
  const roles = stats?.roles?.length ? stats.roles : known?.roles ?? typed?.result.roles ?? [];
  const realRoles = Boolean(stats?.roles?.length);

  return (
    <FreeToolLayout
      tool={T.id}
      h1={page?.h1 ?? T.h1}
      promise={T.promise}
      faq={T.faq}
      title={page?.title ?? T.title}
      description={page?.description ?? T.description}
      path={page?.path ?? T.path}
      cta={serviceName ? {
        heading: `Find the people asking for ${serviceName}, every day.`,
        body: "Intentsly watches LinkedIn for these signals, scores each person against your ideal customer and starts the conversation. See it on your own market in under a minute, no account needed.",
      } : undefined}
    >
      <form onSubmit={search} className="flex flex-col sm:flex-row gap-2">
        <label htmlFor="service" className="sr-only">What do you sell?</label>
        <input
          id="service" value={query} onChange={(e) => setQuery(e.target.value)} maxLength={80}
          placeholder={known ? "Try another service…" : "What do you sell? e.g. web design"}
          className="flex-1 min-w-0 rounded-xl border border-neutral-200 px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30"
        />
        <button type="submit" disabled={busy || query.trim().length < 3}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0a0a0a] text-white px-6 py-3 text-[15px] font-semibold disabled:opacity-50">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {busy ? "Looking…" : "Find signals"}
        </button>
      </form>

      {error && <p className="mt-6 rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">{error}</p>}

      {serviceName && (
        <div className="mt-8 space-y-6" aria-live="polite">
          {stats?.count != null && (
            <p className="rounded-2xl bg-[#F4F4F5] p-4 text-[15px]">
              Intentsly saw <strong>{stats.count} matching signals</strong> for {serviceName} in the last 30 days, across customers' agents. Counted without names or post text.
            </p>
          )}
          <div>
            <h2 className="text-lg font-semibold mb-1">How people ask for {serviceName}</h2>
            <p className="text-xs text-neutral-500 mb-2">Illustrative examples, not real posts. Use the wording as LinkedIn search terms.</p>
            <ul className="space-y-2">
              {phrasings.map((p) => <li key={p} className="rounded-xl border border-neutral-200 p-3 text-[15px]">“{p}”</li>)}
            </ul>
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-2">{realRoles ? "Roles behind recent signals" : "Roles that typically post this"}</h2>
            <div className="flex flex-wrap gap-2">
              {roles.map((r) => <span key={r} className="rounded-full bg-neutral-100 px-3 py-1 text-sm">{r}</span>)}
            </div>
          </div>
          <ShareResult text={`How people ask for ${serviceName} on LinkedIn:`} path={page?.path ?? T.path} />
          <ToolEmailCapture tool={T.id} inputSummary={serviceName} inputText={serviceName} heading={`Get the ${serviceName} signal report by email`} />
        </div>
      )}

      <div className="mt-10">
        <h2 className="text-lg font-semibold mb-3">Browse by service</h2>
        <div className="flex flex-wrap gap-2">
          {SIGNAL_SERVICES.filter((s) => s.slug !== known?.slug).map((s) => (
            <Link key={s.slug} to={`/buying-signals/${s.slug}`} className="rounded-full border border-neutral-200 px-3 py-1.5 text-sm hover:border-neutral-400">{s.name}</Link>
          ))}
        </div>
      </div>
    </FreeToolLayout>
  );
}

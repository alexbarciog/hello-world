import { useMemo, useState } from "react";
import { Copy, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { FreeToolLayout, ScoreBadge, ShareResult, ToolEmailCapture } from "@/components/FreeTool";
import { HOOK_ANALYZER as T } from "@/data/freeTools";
import { analyzeHook, type HookResult } from "@/lib/freeTools";
import { analyzeText, readingLabel } from "@/lib/textAnalysis";

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl bg-neutral-50 p-3">
    <p className="text-[11px] uppercase tracking-wider text-neutral-500">{label}</p>
    <p className="text-sm font-semibold mt-0.5">{value}</p>
  </div>
);

export default function HookAnalyzer() {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<HookResult | null>(null);
  const [submitted, setSubmitted] = useState("");

  // Calculated in the browser, so these show even if the AI is unavailable.
  const metrics = useMemo(() => (submitted ? analyzeText(submitted) : null), [submitted]);

  const run = async () => {
    setBusy(true);
    setError(null);
    setResult(null);
    setSubmitted(text);
    const r = await analyzeHook(text);
    setBusy(false);
    if (r.error) setError(r.error);
    else setResult(r.data!.result);
  };

  const copy = (hook: string) => navigator.clipboard.writeText(hook).then(() => toast.success("Copied")).catch(() => toast.error("Couldn't copy"));

  return (
    <FreeToolLayout tool={T.id} h1={T.h1} promise={T.promise} faq={T.faq} title={T.title} description={T.description} path={T.path}>
      <label htmlFor="post" className="sr-only">Your LinkedIn post</label>
      <textarea
        id="post" value={text} onChange={(e) => setText(e.target.value)} maxLength={5000}
        placeholder="Paste your LinkedIn post here…"
        className="w-full min-h-[180px] rounded-2xl border border-neutral-200 p-4 text-[15px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30"
      />
      <button
        onClick={run} disabled={busy || text.trim().length < 10}
        className="mt-3 w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#0a0a0a] text-white px-6 py-3 text-[15px] font-semibold disabled:opacity-50"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        {busy ? "Analyzing…" : "Analyze my hook"}
      </button>

      {metrics && (
        <div className="mt-8 space-y-5" aria-live="polite">
          {result && (
            <div className="flex flex-wrap items-center gap-4">
              <ScoreBadge score={result.score} />
              <p className="flex-1 min-w-[200px] text-[15px] text-neutral-700">{result.verdict}</p>
            </div>
          )}
          {error && <p className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">{error} Your stats below still work.</p>}

          <div>
            <p className="text-xs text-neutral-500 mb-1">Your first line</p>
            <p className="text-[15px] font-medium">“{metrics.firstLine}”</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Stat label="First line" value={`${metrics.firstLineWords} words`} />
            <Stat label="Characters" value={String(metrics.firstLineChars)} />
            <Stat label="Whole post" value={`${metrics.words} words`} />
            <Stat label="Reading level" value={readingLabel(metrics.readingGrade)} />
          </div>

          {result && (
            <>
              <div>
                <h2 className="text-lg font-semibold mb-2">Three stronger hooks</h2>
                <ul className="space-y-2">
                  {result.hooks.map((h) => (
                    <li key={h} className="flex items-start justify-between gap-3 rounded-xl border border-neutral-200 p-3">
                      <span className="text-[15px]">{h}</span>
                      <button aria-label="Copy hook" onClick={() => copy(h)} className="shrink-0 text-neutral-400 hover:text-neutral-900"><Copy className="w-4 h-4" /></button>
                    </li>
                  ))}
                </ul>
              </div>
              <ShareResult text={`My LinkedIn hook scored ${result.score}/100. Check yours:`} path={T.path} />
              <ToolEmailCapture tool={T.id} inputSummary={metrics.firstLine} inputText={submitted} resultSummary={`Score ${result.score}/100. ${result.verdict}`} />
            </>
          )}
        </div>
      )}
    </FreeToolLayout>
  );
}

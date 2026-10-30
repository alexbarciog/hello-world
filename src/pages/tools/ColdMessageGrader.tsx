import { useState } from "react";
import { Copy, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { FreeToolLayout, ScoreBadge, ShareResult, ToolEmailCapture } from "@/components/FreeTool";
import { COLD_MESSAGE_GRADER as T } from "@/data/freeTools";
import { gradeMessage, type GraderResult } from "@/lib/freeTools";

export default function ColdMessageGrader() {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GraderResult | null>(null);

  const run = async () => {
    setBusy(true);
    setError(null);
    setResult(null);
    const r = await gradeMessage(text);
    setBusy(false);
    if (r.error) setError(r.error);
    else setResult(r.data!.result);
  };

  return (
    <FreeToolLayout tool={T.id} h1={T.h1} promise={T.promise} faq={T.faq} title={T.title} description={T.description} path={T.path}>
      <label htmlFor="message" className="sr-only">Your cold message</label>
      <textarea
        id="message" value={text} onChange={(e) => setText(e.target.value)} maxLength={5000}
        placeholder="Paste a LinkedIn DM or cold email here…"
        className="w-full min-h-[180px] rounded-2xl border border-neutral-200 p-4 text-[15px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30"
      />
      <button
        onClick={run} disabled={busy || text.trim().length < 10}
        className="mt-3 w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#0a0a0a] text-white px-6 py-3 text-[15px] font-semibold disabled:opacity-50"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        {busy ? "Grading…" : "Grade my message"}
      </button>

      {error && <p className="mt-6 rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">{error}</p>}

      {result && (
        <div className="mt-8 space-y-5" aria-live="polite">
          <div className="flex flex-wrap items-center gap-4">
            <ScoreBadge score={result.score} />
            <p className="flex-1 min-w-[200px] text-[15px] text-neutral-700">{result.verdict}</p>
          </div>
          {result.issues.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-2">What's holding it back</h2>
              <ul className="list-disc pl-5 space-y-1 text-[15px] text-neutral-700">
                {result.issues.map((i) => <li key={i}>{i}</li>)}
              </ul>
            </div>
          )}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">A shorter version</h2>
              <button
                onClick={() => navigator.clipboard.writeText(result.rewrite).then(() => toast.success("Copied")).catch(() => toast.error("Couldn't copy"))}
                className="inline-flex items-center gap-1.5 text-sm text-neutral-600 hover:text-neutral-900"
              >
                <Copy className="w-4 h-4" /> Copy
              </button>
            </div>
            <p className="rounded-xl border border-neutral-200 p-4 text-[15px] leading-relaxed whitespace-pre-line">{result.rewrite}</p>
          </div>
          <ShareResult text={`My cold message scored ${result.score}/100. Check yours:`} path={T.path} />
          <ToolEmailCapture tool={T.id} inputSummary={text.slice(0, 200)} inputText={text} resultSummary={`Score ${result.score}/100. ${result.verdict}`} />
        </div>
      )}
    </FreeToolLayout>
  );
}

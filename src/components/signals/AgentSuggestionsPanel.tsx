import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Lightbulb, Plus, Check, ChevronDown, Sparkles, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface Suggestion {
  title: string;
  reason?: string;
  frequency?: number;
  confidence?: "high" | "medium" | "low";
  example_headlines?: string[];
}

interface AiSuggestions {
  suggestions: Suggestion[];
  summary?: string | null;
  recommended_action?: string | null;
  generated_at?: string;
}

interface Props {
  agentId: string;
  currentIcpTitles: string[];
  onIcpUpdated?: (newTitles: string[]) => void;
}

export default function AgentSuggestionsPanel({ agentId, currentIcpTitles, onIcpUpdated }: Props) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AiSuggestions | null>(null);
  const [rejectedCount, setRejectedCount] = useState<number>(0);
  const [open, setOpen] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);
  const [addedTitles, setAddedTitles] = useState<Set<string>>(
    new Set(currentIcpTitles.map((t) => t.toLowerCase().trim()))
  );

  useEffect(() => {
    setAddedTitles(new Set(currentIcpTitles.map((t) => t.toLowerCase().trim())));
  }, [currentIcpTitles]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data: run } = await supabase
        .from("signal_agent_runs")
        .select("ai_suggestions, rejected_profiles_sample, suggestions_generated_at")
        .eq("agent_id", agentId)
        .not("suggestions_generated_at", "is", null)
        .order("suggestions_generated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      if (run?.ai_suggestions) {
        setData(run.ai_suggestions as unknown as AiSuggestions);
        const sample = (run.rejected_profiles_sample as any[]) || [];
        setRejectedCount(sample.length);
      } else {
        setData(null);
      }
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [agentId]);

  if (loading) return null;
  if (!data || !data.suggestions || data.suggestions.length === 0) return null;

  async function addToIcp(title: string) {
    const norm = title.toLowerCase().trim();
    if (addedTitles.has(norm)) return;
    setAdding(title);
    try {
      const next = [...currentIcpTitles, title];
      const { error } = await supabase
        .from("signal_agents")
        .update({ icp_job_titles: next })
        .eq("id", agentId);
      if (error) throw error;
      setAddedTitles((prev) => new Set(prev).add(norm));
      onIcpUpdated?.(next);
      toast.success(`"${title}" added to ICP`);
    } catch (e: any) {
      toast.error(`Failed to add: ${e?.message ?? e}`);
    } finally {
      setAdding(null);
    }
  }

  const action = data.recommended_action;
  const actionBanner =
    action === "discovery_mode"
      ? "Most rejected leads have relevant seniority but non-standard titles. Consider switching this agent to Discovery mode to capture more of them."
      : action === "change_competitors"
      ? "The people engaging with these competitor pages may not match your ICP. Consider targeting different competitors."
      : action === "widen_icp"
      ? "Many qualified buyers were rejected. Consider adding the suggested titles below to widen your ICP."
      : null;

  return (
    <div className="mt-3 rounded-xl border border-border bg-muted/30 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
      >
        <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
        <span className="text-sm font-semibold text-foreground">Agent suggestions</span>
        <span className="text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
          {data.suggestions.length} new
        </span>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground ml-auto transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 space-y-3">
          {/* Summary box */}
          <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2.5">
            <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-900 leading-relaxed">
              We noticed{" "}
              <strong>{rejectedCount} leads</strong> were rejected due to ICP mismatch.{" "}
              {data.summary ?? "Here are roles we think could be buyers."}
            </p>
          </div>

          {/* Recommended action banner */}
          {actionBanner && (
            <div className="flex items-start gap-2.5 rounded-lg border border-blue-200 bg-blue-50/70 px-3 py-2.5">
              <AlertTriangle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-900 leading-relaxed">{actionBanner}</p>
            </div>
          )}

          {/* Suggestion cards */}
          <div className="space-y-2">
            {data.suggestions.map((s, i) => {
              const norm = s.title.toLowerCase().trim();
              const isAdded = addedTitles.has(norm);
              const isAdding = adding === s.title;
              const confColor =
                s.confidence === "high"
                  ? "text-green-700 bg-green-50 border-green-200"
                  : "text-amber-700 bg-amber-50 border-amber-200";
              return (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-lg border border-border bg-background px-3 py-2.5"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-foreground">{s.title}</span>
                      {s.confidence && (
                        <span
                          className={`text-[10px] font-semibold uppercase rounded-full px-1.5 py-0.5 border ${confColor}`}
                        >
                          {s.confidence}
                        </span>
                      )}
                      {typeof s.frequency === "number" && s.frequency > 0 && (
                        <span className="text-[10px] text-muted-foreground">
                          seen {s.frequency} {s.frequency === 1 ? "time" : "times"}
                        </span>
                      )}
                    </div>
                    {s.reason && (
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{s.reason}</p>
                    )}
                  </div>
                  <button
                    onClick={() => addToIcp(s.title)}
                    disabled={isAdded || isAdding}
                    className={`shrink-0 flex items-center gap-1.5 text-xs font-medium rounded-lg px-2.5 py-1.5 border transition-colors ${
                      isAdded
                        ? "text-green-700 bg-green-50 border-green-200 cursor-default"
                        : "text-foreground bg-background border-border hover:bg-muted"
                    } ${isAdding ? "opacity-60" : ""}`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Added
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        Add to ICP
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

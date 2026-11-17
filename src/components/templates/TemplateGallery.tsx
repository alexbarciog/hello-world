import { useMemo, useState } from "react";
import { ArrowRight, Check, Loader2, Search, X } from "lucide-react";
import { toast } from "sonner";
import { requestTemplate, type AgentTemplate } from "@/lib/agentTemplates";
import {
  CATEGORY_LABELS, TEMPLATE_CATEGORIES, filterTemplates, sortTemplates, type TemplateCategory,
} from "@/lib/templateMarketplace";
import { TemplateGalleryCard } from "./TemplateGalleryCard";

type Props = {
  templates: AgentTemplate[];
  loading?: boolean;
  /** Where a card links to (gallery page). */
  hrefFor?: (t: AgentTemplate) => string;
  /** Or what a card does when clicked (onboarding picker). */
  onPick?: (t: AgentTemplate) => void;
  /** "Build your own agent": opens the custom agent builder. */
  onBuildOwn: () => void;
  /** Hide the "Request a template" box (e.g. inside onboarding). */
  hideRequest?: boolean;
};

const GRID = "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4";

/** Search, category chips, featured row and the template grid. */
export function TemplateGallery({ templates, loading, hrefFor, onPick, onBuildOwn, hideRequest }: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<TemplateCategory | "all">("all");

  const sorted = useMemo(() => sortTemplates(templates), [templates]);
  const results = useMemo(() => filterTemplates(sorted, query, category), [sorted, query, category]);
  const browsing = !query.trim() && category === "all";
  const featured = browsing ? sorted.filter((t) => t.featured).slice(0, 3) : [];
  const rest = browsing ? results.filter((t) => !featured.includes(t)) : results;

  const card = (t: AgentTemplate, isFeatured = false) => (
    <TemplateGalleryCard
      key={t.id}
      template={t}
      featured={isFeatured}
      to={hrefFor?.(t)}
      onClick={onPick ? () => onPick(t) : undefined}
      cta={onPick ? "Choose" : undefined}
    />
  );

  return (
    <div className="min-w-0">
      <div className="relative max-w-xl">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search templates, e.g. recruiting, SEO, SOC 2"
          aria-label="Search templates"
          className="w-full rounded-xl border border-[#E7E7EA] bg-white pl-10 pr-10 py-2.5 text-[14px] text-neutral-900 placeholder:text-neutral-400 shadow-[0_1px_2px_rgba(10,10,10,0.04)] focus:outline-none focus:border-[#1A8FE3]/50 focus:ring-2 focus:ring-[#1A8FE3]/15 [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Categories">
        {(["all", ...TEMPLATE_CATEGORIES] as const).map((c) => {
          const active = category === c;
          return (
            <button
              key={c}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setCategory(c)}
              className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium border transition-colors ${
                active
                  ? "bg-[#0a0a0a] text-white border-[#0a0a0a]"
                  : "bg-white text-neutral-600 border-[#E7E7EA] hover:border-neutral-300 hover:text-neutral-900"
              }`}
            >
              {c === "all" ? "All" : CATEGORY_LABELS[c]}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
        </div>
      ) : results.length === 0 ? (
        <EmptyState key={query} query={query} onBuildOwn={onBuildOwn} hideRequest={hideRequest} />
      ) : (
        <>
          {featured.length > 0 && (
            <section className="mt-6 rounded-3xl bg-gradient-to-br from-[#E6FF8A]/60 via-[#9BE8D8]/45 to-[#5AA9F0]/35 p-3 sm:p-5 md:p-6">
              <h2 className="px-1 text-[13px] font-semibold text-neutral-800">Featured</h2>
              <div className="mt-3 grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
                {featured.map((t) => card(t, true))}
              </div>
            </section>
          )}

          {rest.length > 0 && (
            <section className="mt-8">
              {browsing && <h2 className="mb-3 text-[13px] font-semibold text-neutral-800">All templates</h2>}
              <div className={GRID}>{rest.map((t) => card(t))}</div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function EmptyState({ query, onBuildOwn, hideRequest }: { query: string; onBuildOwn: () => void; hideRequest?: boolean }) {
  const [text, setText] = useState(query.trim());
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const send = async () => {
    if (!text.trim()) return;
    setBusy(true);
    try {
      await requestTemplate(text);
      setSent(true);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-6 rounded-2xl border border-dashed border-[#E7E7EA] bg-white p-6 md:p-8 text-center">
      <p className="text-[15px] font-semibold text-neutral-900">No template for that yet.</p>
      <button
        type="button"
        onClick={onBuildOwn}
        className="mt-2 inline-flex items-center gap-1 text-[14px] font-medium text-[#1A8FE3] hover:underline underline-offset-2"
      >
        Build your own agent <ArrowRight className="w-4 h-4" />
      </button>

      {!hideRequest && (
        <div className="mt-6 mx-auto max-w-md text-left">
          {sent ? (
            <p className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 text-emerald-800 text-[13px] px-4 py-3">
              <Check className="w-4 h-4" /> Thanks, your request was sent to the Intentsly team.
            </p>
          ) : (
            <>
              <label htmlFor="template-request" className="block text-[13px] font-medium text-neutral-700 mb-1.5">
                Request a template
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="template-request"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  maxLength={1000}
                  placeholder="What kind of business is it for?"
                  className="flex-1 min-w-0 rounded-xl border border-[#E7E7EA] bg-white px-3.5 py-2.5 text-[14px] placeholder:text-neutral-400 focus:outline-none focus:border-[#1A8FE3]/50 focus:ring-2 focus:ring-[#1A8FE3]/15"
                />
                <button
                  type="button"
                  onClick={send}
                  disabled={busy || !text.trim()}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#0a0a0a] text-white px-4 py-2.5 text-[14px] font-medium disabled:opacity-40"
                >
                  {busy && <Loader2 className="w-4 h-4 animate-spin" />} Send request
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

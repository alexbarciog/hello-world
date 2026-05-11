import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Sparkles, Heart, MessageCircle, Repeat2, Loader2, ExternalLink, Wand2, Link2,
  Search, SlidersHorizontal, Calendar as CalendarIcon, ChevronDown,
} from "lucide-react";
import { toast } from "sonner";

interface Props {
  onRemixed: (postId: string) => void;
}

const SUGGESTED_KEYWORDS = [
  "AI coding tips",
  "marketing strategies",
  "startup advice",
  "productivity hacks",
  "design inspiration",
  "growth tactics",
  "fundraising",
  "B2B sales",
];

const DATE_OPTIONS: { value: string; label: string }[] = [
  { value: "past_24h", label: "Past 24 hours" },
  { value: "past_week", label: "Past week" },
  { value: "past_month", label: "Past month" },
];

const MIN_LIKES_OPTIONS = [50, 100, 250, 500, 1000];

export default function Inspiration({ onRemixed }: Props) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const [remixing, setRemixing] = useState<string | null>(null);

  const [keyword, setKeyword] = useState("");
  const [datePosted, setDatePosted] = useState("past_week");
  const [minLikes, setMinLikes] = useState(100);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [cloneUrl, setCloneUrl] = useState("");
  const [cloning, setCloning] = useState(false);
  const [cloneSummary, setCloneSummary] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("superscale_inspirations")
      .select("*")
      .eq("dismissed", false)
      .order("likes", { ascending: false })
      .limit(60);
    setItems(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function discover(kw?: string) {
    setDiscovering(true);
    const body: any = { date_posted: datePosted, min_likes: minLikes };
    if (kw && kw.trim()) body.keyword = kw.trim();
    const { error } = await supabase.functions.invoke("superscale-discover-inspiration", { body });
    if (error) toast.error("Discovery failed");
    else toast.success(kw ? `Found posts for "${kw}"` : "Inspiration refreshed");
    setDiscovering(false);
    await load();
  }

  async function remix(id: string) {
    setRemixing(id);
    const { data, error } = await supabase.functions.invoke("superscale-remix-post", {
      body: { inspiration_id: id },
    });
    setRemixing(null);
    if (error || !data?.post_id) { toast.error("Remix failed"); return; }
    onRemixed(data.post_id);
  }

  async function dismiss(id: string) {
    await supabase.from("superscale_inspirations").update({ dismissed: true }).eq("id", id);
    setItems((prev) => prev.filter((p) => p.id !== id));
  }

  async function cloneCreator() {
    if (!cloneUrl.trim()) return;
    setCloning(true);
    setCloneSummary(null);
    const { data, error } = await supabase.functions.invoke("superscale-clone-creator", {
      body: { profile_url: cloneUrl.trim() },
    });
    setCloning(false);
    if (error || !(data as any)?.ok) {
      toast.error((data as any)?.error || "Couldn't clone this creator");
      return;
    }
    setCloneSummary((data as any).summary || `Cloned ${(data as any).posts_analyzed} posts. Cadence saved.`);
    toast.success("Strategy cloned — cadence saved");
    setCloneUrl("");
    await load();
  }

  const dateLabel = useMemo(
    () => DATE_OPTIONS.find((d) => d.value === datePosted)?.label.toLowerCase() || "past week",
    [datePosted],
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Inspiration</h1>
        <p className="text-sm text-foreground/60 mt-1">
          Discover the most successful posts in your niche this week — and remix them into your voice.
        </p>
      </div>

      {/* Search bar */}
      <div className="flex items-stretch gap-2 mb-3">
        <div className="flex-1 flex items-center gap-2 rounded-2xl bg-white border border-black/[0.06] px-4">
          <Search className="w-4 h-4 text-foreground/40 shrink-0" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") discover(keyword); }}
            placeholder="Search by keyword…"
            className="flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-foreground/40"
          />
          <button
            onClick={() => discover(keyword)}
            disabled={discovering}
            className="rounded-xl bg-sky-500 text-white text-sm font-semibold px-5 py-2 hover:bg-sky-600 disabled:opacity-50 flex items-center gap-2"
          >
            {discovering ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Search
          </button>
        </div>
        <button
          title="Date range"
          onClick={() => setFiltersOpen((v) => !v)}
          className="rounded-2xl bg-white border border-black/[0.06] px-3 hover:bg-black/[0.02]"
        >
          <CalendarIcon className="w-4 h-4 text-foreground/60" />
        </button>
        <button
          title="Clone a creator"
          onClick={() => {
            const el = document.getElementById("clone-creator-panel");
            el?.scrollIntoView({ behavior: "smooth", block: "center" });
          }}
          className="rounded-2xl bg-white border border-black/[0.06] px-3 hover:bg-black/[0.02]"
        >
          <Wand2 className="w-4 h-4 text-foreground/60" />
        </button>
      </div>

      {/* Suggested keyword chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {SUGGESTED_KEYWORDS.map((kw) => (
          <button
            key={kw}
            onClick={() => { setKeyword(kw); discover(kw); }}
            className="text-xs font-medium rounded-full bg-white border border-black/[0.06] px-3 py-1.5 hover:bg-black/[0.04] text-foreground/70"
          >
            {kw}
          </button>
        ))}
      </div>

      {/* Advanced filters */}
      <div className="mb-4">
        <button
          onClick={() => setFiltersOpen((v) => !v)}
          className="flex items-center gap-1.5 text-xs font-semibold text-foreground/70 hover:text-foreground"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Advanced Filters
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
        </button>
        {filtersOpen && (
          <div className="mt-3 rounded-xl bg-white border border-black/[0.06] p-4 flex flex-wrap items-center gap-5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-foreground/60">Date posted</span>
              <select
                value={datePosted}
                onChange={(e) => setDatePosted(e.target.value)}
                className="text-xs rounded-lg bg-black/[0.03] px-2.5 py-1.5 outline-none"
              >
                {DATE_OPTIONS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-foreground/60">Min likes</span>
              <select
                value={minLikes}
                onChange={(e) => setMinLikes(Number(e.target.value))}
                className="text-xs rounded-lg bg-black/[0.03] px-2.5 py-1.5 outline-none"
              >
                {MIN_LIKES_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n}+</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Result context line */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-foreground/50">
          Showing posts from <span className="font-semibold text-foreground/70">{dateLabel}</span> · with{" "}
          <span className="font-semibold text-foreground/70">{minLikes}+</span> likes
        </p>
        <span className="text-xs text-foreground/50">{items.length} result{items.length === 1 ? "" : "s"}</span>
      </div>

      {/* Cards */}
      {loading && items.length === 0 ? (
        <div className="text-sm text-foreground/50">Loading…</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/10 bg-white p-12 text-center">
          <Sparkles className="w-8 h-8 mx-auto text-foreground/30 mb-3" />
          <p className="text-sm text-foreground/60 mb-4">
            No inspiration yet. Try a keyword above, or run a fresh discovery.
          </p>
          <button
            onClick={() => discover()}
            disabled={discovering}
            className="rounded-lg bg-foreground text-background text-sm font-semibold px-4 py-2 hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-2"
          >
            {discovering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Discover for me
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((p) => (
            <div key={p.id} className="rounded-2xl bg-white border border-black/[0.06] p-5 flex flex-col hover:shadow-sm transition-shadow">
              <div className="flex items-start gap-3 mb-3">
                {p.author_avatar_url ? (
                  <img src={p.author_avatar_url} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-black/[0.06] shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{p.author_name || "Unknown"}</div>
                  {p.author_headline && (
                    <div className="text-[11px] text-foreground/50 truncate">{p.author_headline}</div>
                  )}
                </div>
                {p.source_post_url && (
                  <a href={p.source_post_url} target="_blank" rel="noreferrer" className="text-foreground/40 hover:text-foreground shrink-0">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
              <p className="text-sm text-foreground/80 whitespace-pre-wrap line-clamp-6 flex-1">{p.content}</p>
              <div className="flex items-center gap-4 mt-3 text-xs text-foreground/50">
                <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> {p.likes ?? 0}</span>
                <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" /> {p.comments ?? 0}</span>
                <span className="flex items-center gap-1"><Repeat2 className="w-3.5 h-3.5" /> {p.reposts ?? 0}</span>
                {p.industry && <span className="ml-auto px-2 py-0.5 rounded-full bg-black/[0.04] truncate max-w-[140px]">{p.industry}</span>}
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => remix(p.id)}
                  disabled={remixing === p.id}
                  className="flex-1 rounded-lg bg-gradient-to-br from-rose-500 to-orange-500 text-white text-xs font-semibold py-2 hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {remixing === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  Remix for me
                </button>
                <button
                  onClick={() => dismiss(p.id)}
                  className="rounded-lg bg-black/[0.04] text-foreground/60 text-xs font-medium px-3 py-2 hover:bg-black/[0.06]"
                >
                  Skip
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Clone-a-creator panel (kept) */}
      <div id="clone-creator-panel" className="rounded-2xl bg-gradient-to-br from-rose-50 to-orange-50 border border-rose-100 p-5 mt-8">
        <div className="flex items-center gap-2 mb-1">
          <Wand2 className="w-4 h-4 text-rose-600" />
          <h3 className="text-sm font-bold">Clone a creator's strategy</h3>
        </div>
        <p className="text-xs text-foreground/60 mb-3">
          Paste a LinkedIn profile URL — we'll analyze their last 30 posts and copy their cadence, post types, and timing into your Queue.
        </p>
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 rounded-lg bg-white border border-black/[0.06] px-3">
            <Link2 className="w-4 h-4 text-foreground/40 shrink-0" />
            <input
              value={cloneUrl}
              onChange={(e) => setCloneUrl(e.target.value)}
              placeholder="https://linkedin.com/in/their-handle"
              className="flex-1 bg-transparent py-2 text-sm outline-none"
              disabled={cloning}
            />
          </div>
          <button
            onClick={cloneCreator}
            disabled={cloning || !cloneUrl.trim()}
            className="rounded-lg bg-gradient-to-br from-rose-500 to-orange-500 text-white text-sm font-semibold px-4 py-2 hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
          >
            {cloning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            Clone strategy
          </button>
        </div>
        {cloneSummary && (
          <p className="mt-3 text-xs text-foreground/70 bg-white/70 rounded-md px-3 py-2">{cloneSummary}</p>
        )}
      </div>
    </div>
  );
}

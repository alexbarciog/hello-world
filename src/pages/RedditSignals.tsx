import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";
import {
  Search, ExternalLink, Bookmark, X, Plus, Loader2, Trash2,
  RefreshCw, Sparkles, Hash, AlertCircle, Bot, Power, Check, AlertTriangle,
} from "lucide-react";

/* ── Types ──────────────────────────────────────────────────────────── */
interface RedditKeyword {
  id: string;
  keyword: string;
  subreddits: string[];
  active: boolean;
  created_at: string;
}

interface RedditMention {
  id: string;
  keyword_matched: string;
  subreddit: string;
  author: string;
  title: string;
  body: string | null;
  url: string;
  posted_at: string | null;
  found_at: string;
  dismissed: boolean;
  saved: boolean;
}

/* ── Helpers ─────────────────────────────────────────────────────────── */
const RedditIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
  </svg>
);

function timeAgo(dateStr: string | null) {
  if (!dateStr) return "";
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function cleanRedditText(raw: string | null): string {
  if (!raw) return "";
  return raw
    .replace(/<!-- SC_OFF -->|<!-- SC_ON -->/g, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#32;/g, " ")
    .replace(/submitted by\s*\/u\/\S+/gi, "")
    .replace(/\[link\]|\[comments\]/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

const DEFAULT_SUBREDDITS = ["SaaS", "startups", "Entrepreneur", "smallbusiness", "marketing", "sales"];

/* ── Page component ──────────────────────────────────────────────────── */
export default function RedditSignals() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const sub = useSubscription();
  const [newKeyword, setNewKeyword] = useState("");
  const [newSubreddits, setNewSubreddits] = useState("");
  const [polling, setPolling] = useState(false);
  const [filterKeyword, setFilterKeyword] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [viewMode, setViewMode] = useState<"all" | "saved">("all");
  const [inlineAdding, setInlineAdding] = useState(false);
  const [inlineKeyword, setInlineKeyword] = useState("");

  // ── Fetch keywords ──
  const { data: keywords = [], isLoading: kwLoading } = useQuery({
    queryKey: ["reddit-keywords"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reddit_keywords")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as RedditKeyword[];
    },
  });

  // ── Fetch mentions ──
  const { data: mentions = [], isLoading: mentionsLoading } = useQuery({
    queryKey: ["reddit-mentions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reddit_mentions")
        .select("*")
        .eq("dismissed", false)
        .order("found_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data as RedditMention[];
    },
  });

  // ── Add keyword ──
  const addKeyword = useMutation({
    mutationFn: async () => {
      const kw = newKeyword.trim();
      if (!kw) throw new Error("Keyword is required");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const subs = newSubreddits.trim()
        ? newSubreddits.split(",").map(s => s.trim()).filter(Boolean)
        : [];

      const { error } = await supabase.from("reddit_keywords").insert({
        user_id: user.id,
        keyword: kw,
        subreddits: subs,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewKeyword("");
      setNewSubreddits("");
      queryClient.invalidateQueries({ queryKey: ["reddit-keywords"] });
      toast.success("Keyword added!");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // ── Inline add keyword (from agent panel) ──
  const addInlineKeyword = useMutation({
    mutationFn: async () => {
      const kw = inlineKeyword.trim();
      if (!kw) throw new Error("Keyword is required");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("reddit_keywords").insert({
        user_id: user.id,
        keyword: kw,
        subreddits: [],
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setInlineKeyword("");
      setInlineAdding(false);
      queryClient.invalidateQueries({ queryKey: ["reddit-keywords"] });
      toast.success("Keyword added!");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // ── Delete keyword ──
  const deleteKeyword = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reddit_keywords").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reddit-keywords"] });
      queryClient.invalidateQueries({ queryKey: ["reddit-mentions"] });
      toast.success("Keyword removed");
    },
  });

  // ── Agent state ──
  const [agentRunning, setAgentRunning] = useState(false);

  // Check if agent is "running" (has keywords)
  useEffect(() => {
    if (keywords.length > 0) setAgentRunning(true);
  }, [keywords]);

  // ── Start AI Agent (initial scan + enable auto-polling) ──
  const handleStartAgent = async () => {
    if (!sub.subscribed) {
      toast.error("Upgrade to a paid plan to run the Reddit agent", {
        action: { label: "Start Trial", onClick: () => navigate("/billing") },
      });
      return;
    }
    if (keywords.length === 0) {
      toast.error("Add at least one keyword first");
      return;
    }
    setPolling(true);
    setAgentRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("poll-reddit-signals");
      if (error) throw error;
      toast.success(`🤖 AI Agent started! Found ${data?.inserted ?? 0} new mention(s). Auto-scanning runs twice daily.`);
      queryClient.invalidateQueries({ queryKey: ["reddit-mentions"] });
    } catch (err) {
      toast.error("Failed to start agent. Try again.");
      console.error(err);
    } finally {
      setPolling(false);
    }
  };

  // ── Manual re-scan ──
  const handleRescan = async () => {
    if (!sub.subscribed) {
      toast.error("Upgrade to a paid plan to scan Reddit", {
        action: { label: "Start Trial", onClick: () => navigate("/billing") },
      });
      return;
    }
    setPolling(true);
    try {
      const { data, error } = await supabase.functions.invoke("poll-reddit-signals");
      if (error) throw error;
      toast.success(`Scan complete! Found ${data?.inserted ?? 0} new mention(s).`);
      queryClient.invalidateQueries({ queryKey: ["reddit-mentions"] });
    } catch (err) {
      toast.error("Scan failed. Try again.");
      console.error(err);
    } finally {
      setPolling(false);
    }
  };

  // ── Save/unsave mention ──
  const toggleSave = useMutation({
    mutationFn: async ({ id, saved }: { id: string; saved: boolean }) => {
      const { error } = await supabase
        .from("reddit_mentions")
        .update({ saved: !saved })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reddit-mentions"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const filtered = mentions
    .filter(m => viewMode === "saved" ? m.saved : true)
    .filter(m => filterKeyword ? m.keyword_matched === filterKeyword : true)
    .sort((a, b) => {
      const dateA = new Date(a.posted_at || a.found_at).getTime();
      const dateB = new Date(b.posted_at || b.found_at).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

  return (
    <div className="min-h-full rounded-2xl m-3 md:m-4 p-6 md:p-10 font-body bg-white">
      {/* Free plan banner */}
      {!sub.loading && !sub.subscribed && (
        <div className="flex items-center gap-3 px-4 py-3 mb-5 rounded-xl border border-amber-200 bg-amber-50/60">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-900 font-medium">
            Reddit monitoring is paused on the Free plan.{" "}
            <button onClick={() => navigate("/billing")} className="underline font-semibold hover:text-amber-700 transition-colors">
              Start your free trial
            </button>
          </p>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <RedditIcon className="w-7 h-7 text-orange-500" />
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Reddit Signals</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          AI-powered Reddit monitoring — automatically scans for buying intent signals twice daily
        </p>
        {agentRunning && keywords.length > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
            </span>
            <span className="text-xs font-medium text-green-600">AI Agent active — auto-scanning twice daily</span>
          </div>
        )}
      </div>

      {/* ── Agent Status Panel (shown when running) ── */}
      {agentRunning && keywords.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl mb-6 border border-green-200/60 bg-gradient-to-r from-green-50/80 via-white to-emerald-50/50">
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-green-100/30 to-transparent rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />

          <div className="relative px-4 py-3 md:px-5 md:py-3.5">
            {/* Row 1: Agent info + stats + re-scan */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2.5 mr-1">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md shadow-green-500/20">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-sm font-bold text-foreground">Reddit Spy Agent</h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700 border border-green-200">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                  </span>
                  Active
                </span>
              </div>

              <div className="hidden md:block w-px h-5 bg-border/40" />

              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">Keywords:</span>
                  <span className="font-bold text-foreground">{keywords.length}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">Found:</span>
                  <span className="font-bold text-orange-600">{mentions.length}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">Next:</span>
                  <span className="font-bold text-foreground">
                    {(() => {
                      const now = new Date();
                      const nextMorning = new Date(now);
                      nextMorning.setHours(8, 0, 0, 0);
                      const nextEvening = new Date(now);
                      nextEvening.setHours(18, 0, 0, 0);
                      let next: Date;
                      if (now < nextMorning) next = nextMorning;
                      else if (now < nextEvening) next = nextEvening;
                      else { next = new Date(now); next.setDate(next.getDate() + 1); next.setHours(8, 0, 0, 0); }
                      const isToday = next.getDate() === now.getDate();
                      const timeStr = next.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                      return `${isToday ? "Today" : "Tomorrow"}, ${timeStr}`;
                    })()}
                  </span>
                </div>
              </div>

              <div className="hidden md:flex items-center gap-1 ml-1">
                <span className="w-1 h-1 rounded-full bg-red-400 animate-pulse" />
                <span className="w-1 h-1 rounded-full bg-orange-400 animate-pulse" style={{ animationDelay: "150ms" }} />
                <span className="w-1 h-1 rounded-full bg-yellow-400 animate-pulse" style={{ animationDelay: "300ms" }} />
              </div>

              <button
                onClick={handleRescan}
                disabled={polling}
                className="ml-auto w-8 h-8 rounded-lg flex items-center justify-center border border-border text-foreground/60 hover:bg-white/80 transition-all disabled:opacity-50 bg-white/50 backdrop-blur-sm"
                title={polling ? "Scanning..." : "Re-scan now"}
              >
                {polling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Row 2: Keywords + inline add */}
            <div className="flex items-center gap-2 mt-2.5 flex-wrap">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Watching:</span>
              {keywords.map(kw => (
                <span
                  key={kw.id}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-white/80 text-orange-700 border border-orange-200/60 shadow-sm"
                >
                  <Search className="w-2.5 h-2.5 opacity-60" />
                  {kw.keyword}
                  {kw.subreddits.length > 0 && (
                    <span className="text-[9px] opacity-60">({kw.subreddits.length})</span>
                  )}
                  <button onClick={() => deleteKeyword.mutate(kw.id)} className="ml-0.5 hover:opacity-80">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {/* Inline add keyword */}
              {inlineAdding ? (
                <div className="inline-flex items-center gap-1 animate-in slide-in-from-left-2 fade-in duration-200">
                  <input
                    autoFocus
                    value={inlineKeyword}
                    onChange={(e) => setInlineKeyword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && inlineKeyword.trim()) addInlineKeyword.mutate();
                      if (e.key === "Escape") { setInlineAdding(false); setInlineKeyword(""); }
                    }}
                    placeholder="New keyword..."
                    className="w-32 px-2.5 py-1 rounded-full text-xs border border-orange-200 bg-white/90 outline-none focus:ring-1 focus:ring-orange-300 placeholder:text-muted-foreground/50"
                  />
                  <button
                    onClick={() => addInlineKeyword.mutate()}
                    disabled={addInlineKeyword.isPending || !inlineKeyword.trim()}
                    className="w-6 h-6 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-colors disabled:opacity-50"
                  >
                    {addInlineKeyword.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                  </button>
                  <button
                    onClick={() => { setInlineAdding(false); setInlineKeyword(""); }}
                    className="w-6 h-6 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground flex items-center justify-center transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setInlineAdding(true)}
                  className="w-6 h-6 rounded-full border border-dashed border-orange-300 text-orange-400 hover:text-orange-600 hover:border-orange-400 flex items-center justify-center transition-colors"
                  title="Add keyword"
                >
                  <Plus className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Keywords Management Card (only when agent NOT running) ── */}
      {!(agentRunning && keywords.length > 0) && (
        <div className="glass-card rounded-2xl p-5 md:p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Hash className="w-5 h-5 text-foreground/60" />
              <h2 className="text-lg font-semibold text-foreground">Intent Keywords</h2>
            </div>
            <button
              onClick={handleStartAgent}
              disabled={polling || keywords.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
              style={{ background: "hsl(var(--goji-coral))" }}
            >
              {polling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
              {polling ? "Starting..." : "Start AI Agent"}
            </button>
          </div>

          {kwLoading ? (
            <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading keywords...
            </div>
          ) : keywords.length === 0 ? (
            <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
              <AlertCircle className="w-4 h-4" />
              No keywords yet. Add intent keywords below to start monitoring Reddit.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 mb-4">
              {keywords.map(kw => (
                <span
                  key={kw.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium bg-orange-50 text-orange-700 border-orange-200"
                >
                  <Search className="w-3 h-3 opacity-60" />
                  {kw.keyword}
                  {kw.subreddits.length > 0 && (
                    <span className="text-[10px] opacity-60">({kw.subreddits.length} subs)</span>
                  )}
                  <button onClick={() => deleteKeyword.mutate(kw.id)} className="ml-0.5 hover:opacity-80">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addKeyword.mutate()}
              placeholder='Intent keyword (e.g. "alternative to", "how do I")'
              className="flex-1 border border-border rounded-xl px-3.5 py-2.5 text-sm bg-transparent outline-none focus:ring-2 focus:ring-ring/30 transition-shadow placeholder:text-muted-foreground/50"
            />
            <input
              value={newSubreddits}
              onChange={(e) => setNewSubreddits(e.target.value)}
              placeholder="Subreddits (optional, comma-sep)"
              className="sm:w-56 border border-border rounded-xl px-3.5 py-2.5 text-sm bg-transparent outline-none focus:ring-2 focus:ring-ring/30 transition-shadow placeholder:text-muted-foreground/50"
            />
            <button
              onClick={() => addKeyword.mutate()}
              disabled={addKeyword.isPending || !newKeyword.trim()}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            Default subreddits: {DEFAULT_SUBREDDITS.join(", ")}. Override by specifying custom subreddits.
          </p>
        </div>
      )}

      {/* ── Results ── */}
      {mentionsLoading ? (
        <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading mentions...
        </div>
      ) : mentions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <RedditIcon className="w-12 h-12 text-muted-foreground/30" />
          <p className="text-muted-foreground text-sm">No mentions found yet</p>
          <p className="text-muted-foreground/60 text-xs">Add keywords and click "Scan Now" to discover Reddit posts</p>
        </div>
      ) : (
        <>
          {/* Filter bar */}
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-foreground">
                {filtered.length} mention{filtered.length !== 1 ? "s" : ""} found
              </h2>
              <span className="text-foreground/40 cursor-help" title="Reddit posts matching your intent keywords">ⓘ</span>

              {/* View mode tabs */}
              <div className="flex items-center gap-1 ml-2 bg-muted rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode("all")}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    viewMode === "all" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setViewMode("saved")}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
                    viewMode === "saved" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Bookmark className="w-3 h-3" />
                  Saved
                  {mentions.filter(m => m.saved).length > 0 && (
                    <span className="ml-0.5 px-1.5 py-0 rounded-full text-[10px] bg-foreground text-background font-bold">
                      {mentions.filter(m => m.saved).length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Sort + Keyword filter chips */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")}
                className="px-3 py-1 rounded-full text-xs font-medium border border-border bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
              >
                {sortOrder === "newest" ? "↓ Newest" : "↑ Oldest"}
              </button>
              <button
                onClick={() => setFilterKeyword(null)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  !filterKeyword ? "bg-orange-100 text-orange-700 border-orange-300" : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                }`}
              >
                All keywords
              </button>
              {[...new Set(mentions.map(m => m.keyword_matched))].map(kw => (
                <button
                  key={kw}
                  onClick={() => setFilterKeyword(filterKeyword === kw ? null : kw)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    filterKeyword === kw ? "bg-orange-100 text-orange-700 border-orange-300" : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                  }`}
                >
                  {kw}
                </button>
              ))}
            </div>
          </div>

          {/* Mention cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((mention) => (
              <div key={mention.id} className="glass-card rounded-2xl p-5 flex flex-col">
                {/* Top row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <RedditIcon className="w-5 h-5 text-orange-500" />
                    <span className="text-sm font-semibold text-foreground">u/{mention.author}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{timeAgo(mention.posted_at || mention.found_at)}</span>
                </div>

                {/* Subreddit + keyword badge */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200 font-medium">
                    r/{mention.subreddit}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border font-medium">
                    {mention.keyword_matched}
                  </span>
                </div>

                {/* Content */}
                <h3 className="text-sm font-semibold text-foreground mb-1.5 line-clamp-2">{cleanRedditText(mention.title)}</h3>
                {mention.body && cleanRedditText(mention.body) && (
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 flex-1 mb-4">{cleanRedditText(mention.body)}</p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 mt-auto pt-3">
                  <a
                    href={mention.url.replace('://old.reddit.com', '://www.reddit.com')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground/70 hover:bg-muted transition-colors flex-1 justify-center"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    View Post
                  </a>
                  <button
                    onClick={() => toggleSave.mutate({ id: mention.id, saved: mention.saved })}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${
                      mention.saved
                        ? "bg-foreground/10 text-foreground border border-border"
                        : "bg-foreground text-background"
                    }`}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${mention.saved ? "fill-current" : ""}`} />
                    {mention.saved ? "Saved" : "Save"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

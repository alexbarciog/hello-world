import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";
import {
  Search, ExternalLink, Bookmark, X, Plus, Loader2, Trash2,
  RefreshCw, Sparkles, Hash, AlertCircle, Bot, Power, Check, AlertTriangle,
  Heart, Repeat2, MessageCircle,
} from "lucide-react";

/* ── Types ──────────────────────────────────────────────────────────── */
interface XKeyword {
  id: string;
  keyword: string;
  active: boolean;
  created_at: string;
}

interface XMention {
  id: string;
  keyword_matched: string;
  author: string;
  author_name: string | null;
  title: string;
  body: string | null;
  url: string;
  like_count: number;
  retweet_count: number;
  reply_count: number;
  posted_at: string | null;
  found_at: string;
  dismissed: boolean;
  saved: boolean;
}

/* ── Helpers ─────────────────────────────────────────────────────────── */
const XIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
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

/** Parse a field that might be a JSON user object or a plain string */
function parseUserField(raw: string | null, key: "userName" | "name"): string {
  if (!raw) return "";
  if (raw.startsWith("{")) {
    try {
      const obj = JSON.parse(raw);
      return obj[key] || obj.userName || obj.name || raw;
    } catch { /* not JSON */ }
  }
  return raw;
}

function getProfilePicture(authorName: string | null, author: string): string | null {
  for (const raw of [authorName, author]) {
    if (!raw || !raw.startsWith("{")) continue;
    try {
      const obj = JSON.parse(raw);
      if (obj.profilePicture) return obj.profilePicture.replace("_normal.", "_200x200.");
    } catch { /* ignore */ }
  }
  return null;
}

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

/* ── Page component ──────────────────────────────────────────────────── */
export default function XSignals() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const sub = useSubscription();
  const [newKeyword, setNewKeyword] = useState("");
  const [polling, setPolling] = useState(false);
  const [filterKeyword, setFilterKeyword] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [viewMode, setViewMode] = useState<"all" | "saved">("all");
  const [inlineAdding, setInlineAdding] = useState(false);
  const [inlineKeyword, setInlineKeyword] = useState("");

  // ── Fetch keywords ──
  const { data: keywords = [], isLoading: kwLoading } = useQuery({
    queryKey: ["x-keywords"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("x_keywords")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as XKeyword[];
    },
  });

  // ── Fetch mentions ──
  const { data: mentions = [], isLoading: mentionsLoading } = useQuery({
    queryKey: ["x-mentions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("x_mentions")
        .select("*")
        .eq("dismissed", false)
        .order("found_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data as XMention[];
    },
  });

  // ── Add keyword ──
  const addKeyword = useMutation({
    mutationFn: async () => {
      const kw = newKeyword.trim();
      if (!kw) throw new Error("Keyword is required");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("x_keywords").insert({
        user_id: user.id,
        keyword: kw,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewKeyword("");
      queryClient.invalidateQueries({ queryKey: ["x-keywords"] });
      toast.success("Keyword added!");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // ── Inline add keyword ──
  const addInlineKeyword = useMutation({
    mutationFn: async () => {
      const kw = inlineKeyword.trim();
      if (!kw) throw new Error("Keyword is required");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("x_keywords").insert({
        user_id: user.id,
        keyword: kw,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setInlineKeyword("");
      setInlineAdding(false);
      queryClient.invalidateQueries({ queryKey: ["x-keywords"] });
      toast.success("Keyword added!");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // ── Delete keyword ──
  const deleteKeyword = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("x_keywords").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["x-keywords"] });
      queryClient.invalidateQueries({ queryKey: ["x-mentions"] });
      toast.success("Keyword removed");
    },
  });

  // ── Agent state ──
  const [agentRunning, setAgentRunning] = useState(false);
  useEffect(() => {
    if (keywords.length > 0) setAgentRunning(true);
  }, [keywords]);

  // ── Start AI Agent ──
  const handleStartAgent = async () => {
    if (sub.loading) { toast.info("Checking subscription status, please try again in a moment."); return; }
    if (!sub.subscribed) {
      toast.error("Upgrade to a paid plan to run the X agent", {
        action: { label: "Upgrade", onClick: () => navigate("/billing") },
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
      const { data, error } = await supabase.functions.invoke("poll-x-signals");
      if (error) throw error;
      toast.success(`🤖 X Agent started! Found ${data?.inserted ?? 0} new post(s). Auto-scanning runs twice daily.`);
      queryClient.invalidateQueries({ queryKey: ["x-mentions"] });
    } catch (err) {
      toast.error("Failed to start agent. Try again.");
      console.error(err);
    } finally {
      setPolling(false);
    }
  };

  // ── Manual re-scan ──
  const handleRescan = async () => {
    if (sub.loading) { toast.info("Checking subscription status, please try again in a moment."); return; }
    if (!sub.subscribed) {
      toast.error("Upgrade to a paid plan to scan X", {
        action: { label: "Upgrade", onClick: () => navigate("/billing") },
      });
      return;
    }
    setPolling(true);
    try {
      const { data, error } = await supabase.functions.invoke("poll-x-signals");
      if (error) throw error;
      toast.success(`Scan complete! Found ${data?.inserted ?? 0} new post(s).`);
      queryClient.invalidateQueries({ queryKey: ["x-mentions"] });
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
        .from("x_mentions")
        .update({ saved: !saved })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["x-mentions"] });
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
            X monitoring is paused on the Free plan.{" "}
            <button onClick={() => navigate("/billing")} className="underline font-semibold hover:text-amber-700 transition-colors">
              Upgrade now
            </button>
          </p>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <XIcon className="w-6 h-6 text-foreground" />
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">X Signals</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          AI-powered X (Twitter) monitoring — automatically scans for buying intent signals twice daily
        </p>
        {agentRunning && keywords.length > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500" />
            </span>
            <span className="text-xs font-medium text-blue-600">AI Agent active — auto-scanning twice daily</span>
          </div>
        )}
      </div>

      {/* ── Agent Status Panel (shown when running) ── */}
      {agentRunning && keywords.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl mb-6 border border-blue-200/60 bg-gradient-to-r from-blue-50/80 via-white to-sky-50/50">
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-blue-100/30 to-transparent rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />

          <div className="relative px-4 py-3 md:px-5 md:py-3.5">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2.5 mr-1">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-800 to-black flex items-center justify-center shadow-md shadow-black/20">
                  <XIcon className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-sm font-bold text-foreground">X Spy Agent</h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500" />
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
                  <span className="font-bold text-blue-600">{mentions.length}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">Next:</span>
                  <span className="font-bold text-foreground">
                    {(() => {
                      const now = new Date();
                      const nextMorning = new Date(now);
                      nextMorning.setHours(9, 0, 0, 0);
                      const nextEvening = new Date(now);
                      nextEvening.setHours(19, 0, 0, 0);
                      let next: Date;
                      if (now < nextMorning) next = nextMorning;
                      else if (now < nextEvening) next = nextEvening;
                      else { next = new Date(now); next.setDate(next.getDate() + 1); next.setHours(9, 0, 0, 0); }
                      const isToday = next.getDate() === now.getDate();
                      const timeStr = next.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                      return `${isToday ? "Today" : "Tomorrow"}, ${timeStr}`;
                    })()}
                  </span>
                </div>
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

            {/* Keywords row */}
            <div className="flex items-center gap-2 mt-2.5 flex-wrap">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Watching:</span>
              {keywords.map(kw => (
                <span
                  key={kw.id}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-white/80 text-blue-700 border border-blue-200/60 shadow-sm"
                >
                  <Search className="w-2.5 h-2.5 opacity-60" />
                  {kw.keyword}
                  <button onClick={() => deleteKeyword.mutate(kw.id)} className="ml-0.5 hover:opacity-80">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

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
                    className="w-32 px-2.5 py-1 rounded-full text-xs border border-blue-200 bg-white/90 outline-none focus:ring-1 focus:ring-blue-300 placeholder:text-muted-foreground/50"
                  />
                  <button
                    onClick={() => addInlineKeyword.mutate()}
                    disabled={addInlineKeyword.isPending || !inlineKeyword.trim()}
                    className="w-6 h-6 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition-colors disabled:opacity-50"
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
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setInlineAdding(true)}
                    className="w-6 h-6 rounded-full border border-dashed border-blue-300 text-blue-400 hover:text-blue-600 hover:border-blue-400 flex items-center justify-center transition-colors"
                    title="Add keyword"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const { data: { user } } = await supabase.auth.getUser();
                        if (!user) return;
                        const { data: redditKws } = await supabase
                          .from("reddit_keywords")
                          .select("keyword")
                          .eq("user_id", user.id)
                          .eq("active", true);
                        if (!redditKws || redditKws.length === 0) {
                          toast.error("No Reddit keywords found");
                          return;
                        }
                        const existingSet = new Set(keywords.map(k => k.keyword.toLowerCase()));
                        const newKws = redditKws.filter(rk => !existingSet.has(rk.keyword.toLowerCase()));
                        if (newKws.length === 0) {
                          toast("All Reddit keywords already added");
                          return;
                        }
                        const inserts = newKws.map(rk => ({ keyword: rk.keyword, user_id: user.id, active: true }));
                        const { error } = await supabase.from("x_keywords").insert(inserts as any);
                        if (error) throw error;
                        queryClient.invalidateQueries({ queryKey: ["x-keywords"] });
                        toast.success(`Added ${newKws.length} keyword(s) from Reddit`);
                      } catch (err: any) {
                        toast.error(err.message || "Failed to copy Reddit keywords");
                      }
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border border-orange-200 text-orange-600 hover:bg-orange-50 transition-colors"
                    title="Copy keywords from Reddit Spy Agent"
                  >
                    <Sparkles className="w-3 h-3" />
                    Use same as Reddit
                  </button>
                </div>
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 bg-foreground hover:bg-foreground/90"
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
              No keywords yet. Add intent keywords below to start monitoring X.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 mb-4">
              {keywords.map(kw => (
                <span
                  key={kw.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium bg-blue-50 text-blue-700 border-blue-200"
                >
                  <Search className="w-3 h-3 opacity-60" />
                  {kw.keyword}
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
              placeholder='Intent keyword (e.g. "looking for", "recommend a tool")'
              className="flex-1 border border-border rounded-xl px-3.5 py-2.5 text-sm bg-transparent outline-none focus:ring-2 focus:ring-ring/30 transition-shadow placeholder:text-muted-foreground/50"
            />
            <button
              onClick={() => addKeyword.mutate()}
              disabled={addKeyword.isPending || !newKeyword.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 bg-foreground hover:bg-foreground/90"
            >
              {addKeyword.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add Keyword
            </button>
          </div>
        </div>
      )}

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between mb-4 gap-2 overflow-hidden">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* View mode toggle */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setViewMode("all")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === "all" ? "bg-foreground text-white" : "text-muted-foreground hover:bg-muted"}`}
            >
              All
            </button>
            <button
              onClick={() => setViewMode("saved")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1 ${viewMode === "saved" ? "bg-foreground text-white" : "text-muted-foreground hover:bg-muted"}`}
            >
              <Bookmark className="w-3 h-3" />
              Saved
              {mentions.filter(m => m.saved).length > 0 && (
                <span className="bg-blue-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {mentions.filter(m => m.saved).length}
                </span>
              )}
            </button>
          </div>

          {/* Keyword filter chips */}
          {keywords.length > 1 && (
            <div className="min-w-0 flex-1 overflow-x-auto overflow-y-hidden scrollbar-none">
              <div className="flex w-max items-center gap-1 pr-2">
                <button
                  onClick={() => setFilterKeyword(null)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors border whitespace-nowrap shrink-0 ${!filterKeyword ? "bg-foreground text-white border-foreground" : "text-muted-foreground border-border hover:bg-muted"}`}
                >
                  All
                </button>
                {keywords.map(kw => (
                  <button
                    key={kw.id}
                    onClick={() => setFilterKeyword(filterKeyword === kw.keyword ? null : kw.keyword)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors border whitespace-nowrap shrink-0 ${filterKeyword === kw.keyword ? "bg-foreground text-white border-foreground" : "text-muted-foreground border-border hover:bg-muted"}`}
                  >
                    {kw.keyword}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sort */}
        <button
          onClick={() => setSortOrder(s => s === "newest" ? "oldest" : "newest")}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          {sortOrder === "newest" ? "↓ Newest" : "↑ Oldest"}
        </button>
      </div>

      {/* ── Posts list ── */}
      {mentionsLoading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading posts...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <XIcon className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">
            {viewMode === "saved"
              ? "No saved posts yet. Bookmark posts to find them here."
              : keywords.length === 0
                ? "Add keywords above to start monitoring X for intent signals."
                : "No posts found yet. The AI agent will scan X twice daily."}
          </p>
        </div>
      ) : (
        <div className="space-y-0 divide-y divide-border/40">
          {filtered.map(m => {
            const displayName = parseUserField(m.author_name, "name") || parseUserField(m.author, "userName") || m.author;
            const handle = parseUserField(m.author, "userName") || m.author;
            const avatarUrl = getProfilePicture(m.author_name, m.author);
            const tweetContent = m.body && m.body.length > 0 ? `${m.title}\n\n${m.body}` : m.title || "No content";
            const profileUrl = `https://x.com/${handle}`;

            return (
              <div
                key={m.id}
                className="group px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => window.open(m.url, "_blank")}
              >
                <div className="flex gap-3">
                  {/* Avatar */}
                  <a
                    href={profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="shrink-0"
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={handle} className="w-10 h-10 rounded-full object-cover hover:opacity-80 transition-opacity" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-foreground/10 flex items-center justify-center text-sm font-bold text-foreground/60 hover:opacity-80 transition-opacity">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </a>

                  <div className="flex-1 min-w-0">
                    {/* Author line */}
                    <div className="flex items-center gap-1 text-sm leading-5">
                      <a
                        href={profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="font-bold text-foreground hover:underline truncate max-w-[160px]"
                      >
                        {displayName}
                      </a>
                      <span className="text-muted-foreground truncate max-w-[120px]">@{handle}</span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-muted-foreground hover:underline whitespace-nowrap">
                        {timeAgo(m.posted_at || m.found_at)}
                      </span>
                      <span className="ml-auto shrink-0 px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 text-[10px] font-semibold border border-blue-100">
                        {m.keyword_matched}
                      </span>
                    </div>

                    {/* Tweet content */}
                    <div className="mt-0.5 text-[15px] text-foreground leading-[1.4] whitespace-pre-wrap break-words">
                      {tweetContent.length > 400 ? `${tweetContent.slice(0, 400)}…` : tweetContent}
                    </div>

                    {/* Engagement bar — Twitter style */}
                    <div className="flex items-center justify-between mt-2 max-w-[380px]">
                      <button
                        onClick={e => e.stopPropagation()}
                        className="flex items-center gap-1.5 text-muted-foreground hover:text-blue-500 transition-colors group/btn"
                      >
                        <div className="w-8 h-8 rounded-full flex items-center justify-center group-hover/btn:bg-blue-500/10 transition-colors">
                          <MessageCircle className="w-[18px] h-[18px]" />
                        </div>
                        <span className="text-[13px]">{m.reply_count > 0 ? formatNumber(m.reply_count) : ""}</span>
                      </button>

                      <button
                        onClick={e => e.stopPropagation()}
                        className="flex items-center gap-1.5 text-muted-foreground hover:text-green-500 transition-colors group/btn"
                      >
                        <div className="w-8 h-8 rounded-full flex items-center justify-center group-hover/btn:bg-green-500/10 transition-colors">
                          <Repeat2 className="w-[18px] h-[18px]" />
                        </div>
                        <span className="text-[13px]">{m.retweet_count > 0 ? formatNumber(m.retweet_count) : ""}</span>
                      </button>

                      <button
                        onClick={e => e.stopPropagation()}
                        className="flex items-center gap-1.5 text-muted-foreground hover:text-pink-500 transition-colors group/btn"
                      >
                        <div className="w-8 h-8 rounded-full flex items-center justify-center group-hover/btn:bg-pink-500/10 transition-colors">
                          <Heart className="w-[18px] h-[18px]" />
                        </div>
                        <span className="text-[13px]">{m.like_count > 0 ? formatNumber(m.like_count) : ""}</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={e => { e.stopPropagation(); toggleSave.mutate({ id: m.id, saved: m.saved }); }}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                            m.saved ? "text-blue-500 hover:bg-blue-500/10" : "text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10"
                          }`}
                          title={m.saved ? "Unsave" : "Save"}
                        >
                          <Bookmark className={`w-[18px] h-[18px] ${m.saved ? "fill-current" : ""}`} />
                        </button>
                        <a
                          href={m.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 transition-colors"
                          title="Open on X"
                        >
                          <ExternalLink className="w-[18px] h-[18px]" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Search, ChevronDown, ChevronLeft, ChevronRight,
  Flame, AtSign, Plus, Sparkles, Users, SlidersHorizontal, ExternalLink,
} from "lucide-react";

interface Contact {
  id: string;
  first_name: string;
  last_name: string | null;
  linkedin_url: string | null;
  title: string | null;
  company: string | null;
  company_icon_color: string | null;
  signal: string | null;
  signal_post_url: string | null;
  ai_score: number;
  signal_a_hit: boolean;
  signal_b_hit: boolean;
  signal_c_hit: boolean;
  email: string | null;
  email_enriched: boolean;
  list_name: string | null;
  imported_at: string;
}

const AVATAR_COLORS = [
  "bg-orange-500", "bg-blue-500", "bg-green-500",
  "bg-purple-500", "bg-pink-500", "bg-teal-500",
  "bg-red-500", "bg-indigo-500",
];

function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(c: Contact) {
  return (c.first_name[0] + (c.last_name?.[0] || "")).toUpperCase();
}

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const DOT_COLORS: Record<string, string> = {
  orange: "bg-orange-400",
  green: "bg-green-400",
  blue: "bg-blue-400",
  purple: "bg-purple-400",
  pink: "bg-pink-400",
};

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-blue-500 shrink-0" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

export default function Contacts() {
  const [tab, setTab] = useState<"all" | "lists">("all");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [perPage, setPerPage] = useState(25);
  const [page, setPage] = useState(1);
  const [listFilter, setListFilter] = useState<string>("all");
  const [availableLists, setAvailableLists] = useState<string[]>([]);

  useEffect(() => { fetchContacts(); }, []);

  async function fetchContacts() {
    setLoading(true);
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from("contacts")
      .select("*")
      .eq("user_id", user.id)
      .order("imported_at", { ascending: false });
    if (data) {
      setContacts(data as Contact[]);
      const lists = [...new Set(data.map((c: any) => c.list_name).filter(Boolean))] as string[];
      setAvailableLists(lists);
    }
    setLoading(false);
  }

  const filtered = useMemo(() => {
    let result = contacts;
    if (listFilter !== "all") result = result.filter((c) => c.list_name === listFilter);
    if (!searchQuery.trim()) return result;
    const q = searchQuery.toLowerCase();
    return result.filter(
      (c) =>
        c.first_name.toLowerCase().includes(q) ||
        (c.last_name || "").toLowerCase().includes(q) ||
        (c.company || "").toLowerCase().includes(q) ||
        (c.title || "").toLowerCase().includes(q)
    );
  }, [contacts, searchQuery, listFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selectedIds.size === paged.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(paged.map((c) => c.id)));
  }

  return (
    <div className="min-h-full bg-card rounded-2xl m-3 md:m-4 overflow-hidden">

      {/* ── Header ── */}
      <div className="border-b border-border px-4 md:px-6 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Users className="w-4.5 h-4.5 text-muted-foreground shrink-0" />
            <h1 className="text-base font-bold text-foreground">Contacts</h1>
            <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {filtered.length}
            </span>
          </div>
          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-2">
            <button className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground border border-border rounded-lg px-3 py-2 hover:bg-muted/50 transition-colors">
              <Sparkles className="w-3.5 h-3.5" /> Enrich Email
            </button>
            <button
              className="flex items-center gap-1.5 text-xs font-semibold text-white rounded-lg px-4 py-2 transition-colors"
              style={{ background: "linear-gradient(135deg, #5F93FF, #9CBCFB)" }}
            >
              <Plus className="w-3.5 h-3.5" /> Add leads
            </button>
          </div>
          {/* Mobile add button */}
          <button
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-full text-white shrink-0"
            style={{ background: "linear-gradient(135deg, #5F93FF, #9CBCFB)" }}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-5 mt-3">
          {(["all", "lists"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-2 text-sm font-semibold transition-colors relative capitalize ${
                tab === t ? "text-blue-500" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "all" ? "All contacts" : "Lists"}
              {tab === t && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500 rounded-full" />}
            </button>
          ))}
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="px-4 md:px-6 py-3 border-b border-border flex flex-col gap-2.5 md:flex-row md:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            placeholder="Search contacts..."
            className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-background placeholder:text-muted-foreground"
          />
        </div>
        {/* Filters row */}
        <div className="flex items-center gap-2 flex-wrap">
          {availableLists.length > 0 && (
            <div className="relative">
              <select
                value={listFilter}
                onChange={(e) => { setListFilter(e.target.value); setPage(1); }}
                className="border border-border rounded-lg pl-3 pr-7 py-2 text-xs bg-background focus:outline-none appearance-none text-foreground"
              >
                <option value="all">All lists</option>
                {availableLists.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
            </div>
          )}
          <button className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground border border-border rounded-lg px-3 py-2 hover:bg-muted/50 transition-colors">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filters</span>
          </button>
          {selectedIds.size > 0 && (
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
              {selectedIds.size} selected
            </span>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-3 md:px-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-blue-200 border-t-blue-500 animate-spin" />
            <p className="text-sm text-muted-foreground">Loading contacts...</p>
          </div>
        ) : paged.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center px-6">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
              <Users className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold text-foreground">No contacts yet</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              {searchQuery ? "No results match your search." : "Leads discovered by your agents will appear here."}
            </p>
          </div>
        ) : (
          <>
            {/* ── Desktop table ── */}
            <div className="hidden md:block border-x border-border">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={paged.length > 0 && selectedIds.size === paged.length}
                        onChange={toggleAll}
                        className="w-4 h-4 rounded border-border text-blue-500 focus:ring-blue-300 cursor-pointer"
                      />
                    </th>
                    {["Contact", "Signal", "AI Score", "Email", "Added", "List"].map((h) => (
                      <th key={h} className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-3">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paged.map((c) => (
                    <tr key={c.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="w-10 px-4 py-3">
                        <input type="checkbox" checked={selectedIds.has(c.id)} onChange={() => toggleSelect(c.id)}
                          className="w-4 h-4 rounded border-border text-blue-500 focus:ring-blue-300 cursor-pointer" />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${avatarColor(c.first_name + (c.last_name || ""))}`}>
                            {getInitials(c)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              {c.linkedin_url ? (
                                <a href={c.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-blue-600 hover:underline cursor-pointer truncate">
                                  {c.first_name} {c.last_name || ""}
                                </a>
                              ) : (
                                <span className="text-sm font-semibold text-foreground truncate">
                                  {c.first_name} {c.last_name || ""}
                                </span>
                              )}
                              {c.linkedin_url && (
                                <a href={c.linkedin_url} target="_blank" rel="noopener noreferrer" className="shrink-0 hover:opacity-70 transition-opacity">
                                  <LinkedInIcon />
                                </a>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate max-w-[180px]">{c.title}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${DOT_COLORS[c.company_icon_color || ""] || "bg-muted-foreground"}`} />
                              <span className="text-xs text-muted-foreground truncate max-w-[160px]">{c.company}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 max-w-[220px]">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-muted-foreground truncate">{c.signal}</span>
                          {c.signal_post_url && (
                            <a href={c.signal_post_url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-blue-500 hover:text-blue-600 transition-colors" title="View LinkedIn post">
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-0.5">
                          {[c.signal_a_hit, c.signal_b_hit, c.signal_c_hit].map((hit, i) => (
                            <Flame key={i} className={`w-4 h-4 ${hit ? "text-orange-500" : "text-muted-foreground/20"}`} fill={hit ? "currentColor" : "none"} />
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <button className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground border border-border rounded-full px-2.5 py-1 hover:bg-muted/50 transition-colors">
                          <AtSign className="w-3 h-3" /> Enrich
                        </button>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-xs text-muted-foreground">{timeAgo(c.imported_at)}</span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-xs font-medium text-blue-600 hover:underline cursor-pointer">{c.list_name || "—"}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Mobile cards ── */}
            <div className="md:hidden flex flex-col gap-2 py-3">
              {paged.map((c) => (
                <div
                  key={c.id}
                  onClick={() => toggleSelect(c.id)}
                  className={`relative bg-background border rounded-2xl px-4 py-3.5 flex items-start gap-3 transition-all cursor-pointer ${
                    selectedIds.has(c.id) ? "border-blue-400 bg-blue-50/30" : "border-border"
                  }`}
                >
                  {/* Selection dot */}
                  <div className={`absolute top-3 right-3 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                    selectedIds.has(c.id) ? "border-blue-500 bg-blue-500" : "border-muted-foreground/30"
                  }`}>
                    {selectedIds.has(c.id) && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
                        <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${avatarColor(c.first_name + (c.last_name || ""))}`}>
                    {getInitials(c)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 pr-6">
                    {/* Name + LinkedIn */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {c.linkedin_url ? (
                        <a href={c.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-blue-600 hover:underline truncate">
                          {c.first_name} {c.last_name || ""}
                        </a>
                      ) : (
                        <span className="text-sm font-semibold text-foreground truncate">{c.first_name} {c.last_name || ""}</span>
                      )}
                      {c.linkedin_url && (
                        <a href={c.linkedin_url} target="_blank" rel="noopener noreferrer" className="shrink-0 hover:opacity-70 transition-opacity">
                          <LinkedInIcon />
                        </a>
                      )}
                    </div>
                    {/* Title */}
                    {c.title && <p className="text-xs text-muted-foreground truncate mt-0.5">{c.title}</p>}
                    {/* Company */}
                    {c.company && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${DOT_COLORS[c.company_icon_color || ""] || "bg-gray-400"}`} />
                        <span className="text-xs text-muted-foreground truncate">{c.company}</span>
                      </div>
                    )}

                    {/* Footer row */}
                    <div className="flex items-center justify-between mt-2.5 gap-2 flex-wrap">
                      {/* Signal badges */}
                      <div className="flex items-center gap-0.5">
                        {[c.signal_a_hit, c.signal_b_hit, c.signal_c_hit].map((hit, i) => (
                          <Flame key={i} className={`w-3.5 h-3.5 ${hit ? "text-orange-500" : "text-muted-foreground/20"}`} fill={hit ? "currentColor" : "none"} />
                        ))}
                      </div>
                      {/* Signal label */}
                      {c.signal && (
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full truncate max-w-[160px]">
                            {c.signal}
                          </span>
                          {c.signal_post_url && (
                            <a href={c.signal_post_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-blue-500 hover:text-blue-600 transition-colors shrink-0">
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      )}
                      {/* Time */}
                      <span className="text-[10px] text-muted-foreground ml-auto">{timeAgo(c.imported_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Pagination ── */}
      {!loading && filtered.length > 0 && (
        <div className="flex items-center justify-between px-4 md:px-6 py-4 border-t border-border flex-wrap gap-3">
          <p className="text-xs text-muted-foreground">
            {Math.min((page - 1) * perPage + 1, filtered.length)}–{Math.min(page * perPage, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <select
                value={perPage}
                onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
                className="border border-border rounded-lg px-2 py-1.5 text-xs bg-background focus:outline-none"
              >
                {[25, 50, 100].map((n) => <option key={n} value={n}>{n} / page</option>)}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="w-8 h-8 flex items-center justify-center border border-border rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="w-8 h-8 flex items-center justify-center border border-blue-300 rounded-lg text-xs font-semibold text-blue-600">
                {page}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="w-8 h-8 flex items-center justify-center border border-border rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

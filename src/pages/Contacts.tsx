import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Search, ChevronDown, ChevronLeft, ChevronRight,
  Flame, AtSign, Plus, Sparkles, Users, SlidersHorizontal, FolderPlus, List, Trash2,
  Send, UserCheck, MessageSquare, Clock, ThumbsDown, CalendarDays,
} from "lucide-react";
import { Contact, ContactList, avatarColor, getInitials, timeAgo, DOT_COLORS } from "@/components/contacts/types";
import { LinkedInIcon } from "@/components/contacts/LinkedInIcon";
import { CreateListDialog } from "@/components/contacts/CreateListDialog";
import { BookMeetingDialog } from "@/components/contacts/BookMeetingDialog";
import { MeetingPrepPanel } from "@/components/contacts/MeetingPrepPanel";
import { toast } from "sonner";

type Tab = "all" | "hot" | "warm" | "cold" | "not_interested" | "meeting_booked";

export default function Contacts() {
  const [tab, setTab] = useState<Tab>("all");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [lists, setLists] = useState<ContactList[]>([]);
  const [contactListMap, setContactListMap] = useState<Record<string, string[]>>({});
  const [lastActions, setLastActions] = useState<Record<string, { status: string; date: string }>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [perPage, setPerPage] = useState(25);
  const [page, setPage] = useState(1);
  const [listFilter, setListFilter] = useState<string>("all");
  const [showCreateList, setShowCreateList] = useState(false);
  const [bookMeetingContact, setBookMeetingContact] = useState<Contact | null>(null);
  const [meetingPrepData, setMeetingPrepData] = useState<any>(null);
  const [meetings, setMeetings] = useState<Record<string, any>>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) { setLoading(false); return; }

    // Fetch contacts, lists, and junction in parallel
    const [contactsRes, listsRes, junctionRes, connReqRes, meetingsRes] = await Promise.all([
      supabase.from("contacts").select("*").eq("user_id", user.id).order("imported_at", { ascending: false }),
      (supabase.from("lists") as any).select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      (supabase.from("contact_lists") as any).select("contact_id, list_id"),
      supabase.from("campaign_connection_requests").select("contact_id, status, sent_at, accepted_at, current_step").eq("user_id", user.id).order("sent_at", { ascending: false }),
      supabase.from("meetings" as any).select("*").eq("user_id", user.id).order("scheduled_at", { ascending: true }),
    ]);

    if (contactsRes.data) setContacts(contactsRes.data as Contact[]);
    if (listsRes.data) setLists(listsRes.data as ContactList[]);

    // Build meetings map by contact_id
    if (meetingsRes.data) {
      const mMap: Record<string, any> = {};
      for (const m of meetingsRes.data as any[]) {
        mMap[m.contact_id] = m;
      }
      setMeetings(mMap);
    }

    // Build contact -> list_ids map
    if (junctionRes.data) {
      const map: Record<string, string[]> = {};
      for (const row of junctionRes.data as { contact_id: string; list_id: string }[]) {
        if (!map[row.contact_id]) map[row.contact_id] = [];
        map[row.contact_id].push(row.list_id);
      }
      setContactListMap(map);
    }

    // Build contact -> last action map (keep first = most recent due to order)
    if (connReqRes.data) {
      const actionMap: Record<string, { status: string; date: string }> = {};
      for (const row of connReqRes.data as { contact_id: string; status: string; sent_at: string; accepted_at: string | null; current_step: number }[]) {
        if (!actionMap[row.contact_id]) {
          actionMap[row.contact_id] = {
            status: row.status,
            date: row.accepted_at || row.sent_at,
          };
        }
      }
      setLastActions(actionMap);
    }

    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const [deleting, setDeleting] = useState(false);
  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    const confirmed = window.confirm(`Are you sure you want to delete ${selectedIds.size} contact(s)? They will be removed from all lists and campaigns.`);
    if (!confirmed) return;
    setDeleting(true);
    try {
      const ids = Array.from(selectedIds);
      // Delete from contact_lists junction
      await supabase.from("contact_lists").delete().in("contact_id", ids);
      // Delete from campaign_connection_requests
      await supabase.from("campaign_connection_requests").delete().in("contact_id", ids);
      // Delete scheduled_messages
      await supabase.from("scheduled_messages").delete().in("contact_id", ids);
      // Delete the contacts themselves
      const { error } = await supabase.from("contacts").delete().in("id", ids);
      if (error) throw error;
      setSelectedIds(new Set());
      toast.success(`${ids.length} contact(s) deleted successfully`);
      fetchData();
    } catch (err: any) {
      console.error("Delete contacts error:", err);
      toast.error("Failed to delete contacts: " + (err.message || "Unknown error"));
    } finally {
      setDeleting(false);
    }
  };

  const tierCounts = useMemo(() => {
    const counts = { hot: 0, warm: 0, cold: 0, not_interested: 0, meeting_booked: 0 };
    contacts.forEach((c) => {
      if (c.lead_status === 'not_interested') counts.not_interested++;
      if (c.lead_status === 'meeting_booked') counts.meeting_booked++;
      if (c.relevance_tier in counts) (counts as any)[c.relevance_tier]++;
    });
    return counts;
  }, [contacts]);

  // Build list contact counts
  const listCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const listIds of Object.values(contactListMap)) {
      for (const lid of listIds) {
        counts[lid] = (counts[lid] || 0) + 1;
      }
    }
    return counts;
  }, [contactListMap]);

  const filtered = useMemo(() => {
    let result = contacts;
    if (tab === "not_interested") {
      result = result.filter((c) => c.lead_status === 'not_interested');
    } else if (tab === "meeting_booked") {
      result = result.filter((c) => c.lead_status === 'meeting_booked');
    } else if (tab !== "all") {
      result = result.filter((c) => c.relevance_tier === tab);
    }
    if (listFilter !== "all") {
      const contactIdsInList = new Set(
        Object.entries(contactListMap)
          .filter(([, lids]) => lids.includes(listFilter))
          .map(([cid]) => cid)
      );
      result = result.filter((c) => contactIdsInList.has(c.id));
    }
    if (!searchQuery.trim()) return result;
    const q = searchQuery.toLowerCase();
    return result.filter(
      (c) =>
        c.first_name.toLowerCase().includes(q) ||
        (c.last_name || "").toLowerCase().includes(q) ||
        (c.company || "").toLowerCase().includes(q) ||
        (c.title || "").toLowerCase().includes(q)
    );
  }, [contacts, searchQuery, listFilter, tab, contactListMap]);

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

  function getContactListNames(contactId: string): string[] {
    const listIds = contactListMap[contactId] || [];
    return listIds.map((lid) => lists.find((l) => l.id === lid)?.name).filter(Boolean) as string[];
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
            {selectedIds.size > 0 && (
              <>
                <button
                  onClick={() => setShowCreateList(true)}
                  className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground border border-border rounded-lg px-3 py-2 hover:bg-muted/50 transition-colors"
                >
                  <FolderPlus className="w-3.5 h-3.5" /> Add to list
                </button>
                <button
                  onClick={handleDeleteSelected}
                  disabled={deleting}
                  className="flex items-center gap-1.5 text-xs font-medium text-red-500 border border-red-200 rounded-lg px-3 py-2 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" /> {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </>
            )}
          </div>
          {/* Mobile add button */}
          <button className="md:hidden flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground shrink-0">
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-3 md:gap-5 mt-3 overflow-x-auto scrollbar-none">
          {([
            { key: "all" as Tab, label: "All", count: contacts.length },
            { key: "hot" as Tab, label: "🔥 Hot", count: tierCounts.hot },
            { key: "warm" as Tab, label: "☀️ Warm", count: tierCounts.warm },
            { key: "cold" as Tab, label: "❄️ Cold", count: tierCounts.cold },
            { key: "meeting_booked" as Tab, label: "📅 Meeting", count: tierCounts.meeting_booked },
            { key: "not_interested" as Tab, label: "👎 Not Interested", count: tierCounts.not_interested },
          ]).map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setPage(1); }}
              className={`pb-2 text-sm font-semibold transition-colors relative flex items-center gap-1.5 whitespace-nowrap ${
                tab === t.key ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                tab === t.key ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              }`}>
                {t.count}
              </span>
              {tab === t.key && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full" />}
            </button>
          ))}
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="px-4 md:px-6 py-3 border-b border-border flex flex-col gap-2.5 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            placeholder="Search contacts..."
            className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background placeholder:text-muted-foreground text-foreground"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* List filter dropdown */}
          <div className="relative">
            <List className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
            <select
              value={listFilter}
              onChange={(e) => { setListFilter(e.target.value); setPage(1); }}
              className="border border-border rounded-lg pl-7 pr-7 py-2 text-xs bg-background focus:outline-none appearance-none text-foreground"
            >
              <option value="all">All lists</option>
              {lists.map((l) => (
                <option key={l.id} value={l.id}>{l.name} ({listCounts[l.id] || 0})</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
          </div>

          {selectedIds.size > 0 && (
            <>
              <button
                onClick={() => setShowCreateList(true)}
                className="md:hidden flex items-center gap-1.5 text-xs font-medium text-primary border border-primary/30 rounded-lg px-3 py-2 hover:bg-primary/10 transition-colors"
              >
                <FolderPlus className="w-3.5 h-3.5" /> List
              </button>
              <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                {selectedIds.size} selected
              </span>
            </>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-3 md:px-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
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
                        className="w-4 h-4 rounded border-border text-primary focus:ring-ring cursor-pointer"
                      />
                    </th>
                    {["Contact", "Signal", "Score", "Last Action", "Added", "Lists", ""].map((h) => (
                      <th key={h} className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-3">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paged.map((c) => {
                    const cLists = getContactListNames(c.id);
                    return (
                    <tr key={c.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="w-10 px-4 py-3">
                        <input type="checkbox" checked={selectedIds.has(c.id)} onChange={() => toggleSelect(c.id)}
                          className="w-4 h-4 rounded border-border text-primary focus:ring-ring cursor-pointer" />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white ${avatarColor(c.first_name + (c.last_name || ""))}`}>
                              {getInitials(c)}
                            </div>
                            {/* Tier indicator */}
                            <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${
                              c.relevance_tier === 'hot' ? 'bg-red-500' : c.relevance_tier === 'warm' ? 'bg-amber-400' : 'bg-blue-300'
                            }`} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              {c.linkedin_url ? (
                                <a href={c.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-primary hover:underline cursor-pointer truncate">
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
                        {c.signal_post_url ? (
                          <a href={c.signal_post_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:text-primary/80 underline underline-offset-2 truncate block max-w-[200px]">
                            {c.signal}
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground truncate block max-w-[200px]">{c.signal}</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-0.5">
                          {(() => {
                            const tier = c.relevance_tier?.toLowerCase();
                            const count = tier === "hot" ? 3 : tier === "warm" ? 2 : 1;
                            return [0, 1, 2].map((i) => (
                              <Flame key={i} className={`w-4 h-4 ${i < count ? "text-orange-500" : "text-muted-foreground/20"}`} fill={i < count ? "currentColor" : "none"} />
                            ));
                          })()}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-col gap-1">
                          {c.lead_status === 'meeting_booked' && meetings[c.id] && (
                            <div className="flex items-center gap-1">
                              <CalendarDays className="w-3.5 h-3.5 text-primary" />
                              <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                                Meeting {new Date(meetings[c.id].scheduled_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                          )}
                          {c.lead_status === 'not_interested' && (
                            <div className="flex items-center gap-1">
                              <ThumbsDown className="w-3.5 h-3.5 text-destructive" />
                              <span className="text-[10px] font-semibold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-full">Not Interested</span>
                            </div>
                          )}
                          {(() => {
                            const action = lastActions[c.id];
                            if (!action) return (
                              <div className="flex items-center gap-1.5">
                                <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                                <span className="text-xs font-medium text-muted-foreground">Lead added</span>
                                <span className="text-[10px] text-muted-foreground">{timeAgo(c.imported_at)}</span>
                              </div>
                            );
                            const statusConfig: Record<string, { label: string; icon: typeof Send; color: string }> = {
                              pending: { label: "Invite sent", icon: Send, color: "text-blue-500" },
                              sent: { label: "Invite sent", icon: Send, color: "text-blue-500" },
                              accepted: { label: "Accepted", icon: UserCheck, color: "text-emerald-500" },
                              messaged: { label: "Messaged", icon: MessageSquare, color: "text-violet-500" },
                            };
                            const cfg = statusConfig[action.status] || { label: action.status, icon: Clock, color: "text-muted-foreground" };
                            const ActionIcon = cfg.icon;
                            return (
                              <div className="flex items-center gap-1.5">
                                <ActionIcon className={`w-3.5 h-3.5 ${cfg.color}`} />
                                <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                                <span className="text-[10px] text-muted-foreground">{timeAgo(action.date)}</span>
                              </div>
                            );
                          })()}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-xs text-muted-foreground">{timeAgo(c.imported_at)}</span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-1">
                          {cLists.length > 0 ? cLists.map((name) => (
                            <span key={name} className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full truncate max-w-[100px]">
                              {name}
                            </span>
                          )) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          {c.lead_status !== 'meeting_booked' ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); setBookMeetingContact(c); }}
                              className="text-[10px] font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-2 py-1 rounded-lg transition-colors whitespace-nowrap"
                            >
                              📅 Book
                            </button>
                          ) : meetings[c.id] ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setMeetingPrepData({
                                  id: meetings[c.id].id,
                                  contact_id: c.id,
                                  contact_name: `${c.first_name} ${c.last_name || ''}`.trim(),
                                  scheduled_at: meetings[c.id].scheduled_at,
                                  prep_research: meetings[c.id].prep_research,
                                });
                              }}
                              className="text-[10px] font-semibold text-amber-600 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-1 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1"
                            >
                              <Sparkles className="w-3 h-3" /> Prep
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Mobile cards ── */}
            <div className="md:hidden flex flex-col gap-2 py-3">
              {paged.map((c) => {
                const cLists = getContactListNames(c.id);
                return (
                <div
                  key={c.id}
                  onClick={() => toggleSelect(c.id)}
                  className={`relative bg-background border rounded-2xl px-4 py-3.5 flex items-start gap-3 transition-all cursor-pointer ${
                    selectedIds.has(c.id) ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  {/* Selection dot */}
                  <div className={`absolute top-3 right-3 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                    selectedIds.has(c.id) ? "border-primary bg-primary" : "border-muted-foreground/30"
                  }`}>
                    {selectedIds.has(c.id) && (
                      <svg className="w-2.5 h-2.5 text-primary-foreground" fill="none" viewBox="0 0 10 10">
                        <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white ${avatarColor(c.first_name + (c.last_name || ""))}`}>
                      {getInitials(c)}
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${
                      c.relevance_tier === 'hot' ? 'bg-red-500' : c.relevance_tier === 'warm' ? 'bg-amber-400' : 'bg-blue-300'
                    }`} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {c.linkedin_url ? (
                        <a href={c.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-primary hover:underline truncate">
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
                    {c.title && <p className="text-xs text-muted-foreground truncate mt-0.5">{c.title}</p>}
                    {c.company && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${DOT_COLORS[c.company_icon_color || ""] || "bg-muted-foreground"}`} />
                        <span className="text-xs text-muted-foreground truncate">{c.company}</span>
                      </div>
                    )}

                    {/* List badges */}
                    {cLists.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {cLists.map((name) => (
                          <span key={name} className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                            {name}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Footer row */}
                    <div className="flex items-center justify-between mt-2.5 gap-2 flex-wrap">
                      <div className="flex items-center gap-0.5">
                        {[c.signal_a_hit, c.signal_b_hit, c.signal_c_hit].map((hit, i) => (
                          <Flame key={i} className={`w-3.5 h-3.5 ${hit ? "text-orange-500" : "text-muted-foreground/20"}`} fill={hit ? "currentColor" : "none"} />
                        ))}
                      </div>
                      {c.signal && (
                        c.signal_post_url ? (
                          <a href={c.signal_post_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                            className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full truncate max-w-[160px] underline underline-offset-2">
                            {c.signal}
                          </a>
                        ) : (
                          <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full truncate max-w-[160px]">
                            {c.signal}
                          </span>
                        )
                      )}
                      <span className="text-[10px] text-muted-foreground ml-auto">{timeAgo(c.imported_at)}</span>
                    </div>
                  </div>
                </div>
              );
              })}
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
            <select
              value={perPage}
              onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
              className="border border-border rounded-lg px-2 py-1.5 text-xs bg-background focus:outline-none text-foreground"
            >
              {[25, 50, 100].map((n) => <option key={n} value={n}>{n} / page</option>)}
            </select>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="w-8 h-8 flex items-center justify-center border border-border rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="w-8 h-8 flex items-center justify-center border border-primary/30 rounded-lg text-xs font-semibold text-primary">
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

      {/* ── Create List Dialog ── */}
      <CreateListDialog
        open={showCreateList}
        onOpenChange={setShowCreateList}
        selectedContactIds={selectedIds}
        existingLists={lists}
        onCreated={() => { fetchData(); setSelectedIds(new Set()); }}
      />

      {/* ── Book Meeting Dialog ── */}
      <BookMeetingDialog
        open={!!bookMeetingContact}
        onOpenChange={(v) => { if (!v) setBookMeetingContact(null); }}
        contact={bookMeetingContact}
        onBooked={fetchData}
      />

      {/* ── Meeting Prep Panel ── */}
      <MeetingPrepPanel
        open={!!meetingPrepData}
        onOpenChange={(v) => { if (!v) setMeetingPrepData(null); }}
        meeting={meetingPrepData}
        onUpdated={fetchData}
      />
    </div>
  );
}

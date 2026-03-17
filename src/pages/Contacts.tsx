import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Search, SlidersHorizontal, ChevronDown, ChevronLeft, ChevronRight,
  Flame, AtSign, Plus, Download, Sparkles,
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
  ai_score: number;
  signal_a_hit: boolean;
  signal_b_hit: boolean;
  signal_c_hit: boolean;
  email: string | null;
  email_enriched: boolean;
  list_name: string | null;
  imported_at: string;
}


export default function Contacts() {
  const [tab, setTab] = useState<"all" | "lists">("all");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [perPage, setPerPage] = useState(100);
  const [page, setPage] = useState(1);

  useEffect(() => {
    seedAndFetch();
  }, []);

  async function seedAndFetch() {
    setLoading(true);
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) { setLoading(false); return; }

    // Check if contacts exist
    const { data: existing } = await supabase
      .from("contacts")
      .select("id")
      .eq("user_id", user.id)
      .limit(1);

    // Seed demo data if empty
    if (!existing || existing.length === 0) {
      const rows = DEMO_CONTACTS.map((c) => ({
        ...c,
        user_id: user.id,
        email_enriched: false,
        list_name: "My List",
        imported_at: new Date(Date.now() - Math.random() * 900000).toISOString(),
      }));
      await supabase.from("contacts").insert(rows);
    }

    const { data } = await supabase
      .from("contacts")
      .select("*")
      .eq("user_id", user.id)
      .order("imported_at", { ascending: false });

    if (data) setContacts(data as Contact[]);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    const q = searchQuery.toLowerCase();
    return contacts.filter(
      (c) =>
        c.first_name.toLowerCase().includes(q) ||
        (c.last_name || "").toLowerCase().includes(q) ||
        (c.company || "").toLowerCase().includes(q) ||
        (c.title || "").toLowerCase().includes(q)
    );
  }, [contacts, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selectedIds.size === paged.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(paged.map((c) => c.id)));
  }

  function timeAgo(dateStr: string) {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return `${diff} seconds ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  }

  function getInitials(c: Contact) {
    return (c.first_name[0] + (c.last_name?.[0] || "")).toUpperCase();
  }

  const AVATAR_COLORS = ["bg-orange-500", "bg-blue-500", "bg-green-500", "bg-purple-500", "bg-pink-500", "bg-teal-500", "bg-red-500", "bg-indigo-500"];
  function avatarColor(name: string) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
  }

  return (
    <div className="min-h-full p-6 md:p-8">
      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-gray-200 mb-5">
        <button
          onClick={() => setTab("all")}
          className={`pb-2.5 text-sm font-semibold transition-colors relative ${
            tab === "all" ? "text-red-500" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          All contacts
          {tab === "all" && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-red-500 rounded-full" />}
        </button>
        <button
          onClick={() => setTab("lists")}
          className={`pb-2.5 text-sm font-semibold transition-colors relative ${
            tab === "lists" ? "text-red-500" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Lists
          {tab === "lists" && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-red-500 rounded-full" />}
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            placeholder="Search by name, email, company, loc"
            className="pl-9 pr-3 py-2 w-[280px] border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 bg-white placeholder:text-gray-400"
          />
        </div>
        <button className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors">
          <SlidersHorizontal className="w-4 h-4" />
          Add more filters
          <span className="text-orange-500">»</span>
        </button>
        <div className="ml-auto flex items-center gap-2">
          <button className="flex items-center gap-1.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors">
            Add to list
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <button className="flex items-center gap-1.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors">
            Export to...
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <button className="flex items-center gap-1.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors">
            <Sparkles className="w-4 h-4" />
            Enrich Email
          </button>
          <button className="flex items-center gap-1.5 text-sm font-semibold text-white rounded-lg px-4 py-2 transition-colors"
            style={{ background: "linear-gradient(135deg, hsl(25 95% 53%), hsl(330 85% 55%))" }}
          >
            <Plus className="w-4 h-4" />
            Add leads
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="w-10 px-3 py-3">
                <input
                  type="checkbox"
                  checked={paged.length > 0 && selectedIds.size === paged.length}
                  onChange={toggleAll}
                  className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-300 cursor-pointer"
                />
              </th>
              <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">
                <div className="flex items-center gap-1">
                  Contact
                  <SlidersHorizontal className="w-3 h-3 text-gray-300" />
                </div>
              </th>
              <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">
                Signal
              </th>
              <th className="text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">
                <div className="flex items-center justify-center gap-1">
                  AI Score
                  <ChevronDown className="w-3 h-3 text-gray-300" />
                </div>
              </th>
              <th className="text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">
                Email
              </th>
              <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">
                Import ...
              </th>
              <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">
                List
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-16 text-sm text-gray-400">Loading contacts...</td>
              </tr>
            ) : paged.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-16 text-sm text-gray-400">No contacts found.</td>
              </tr>
            ) : (
              paged.map((c) => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  {/* Checkbox */}
                  <td className="w-10 px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(c.id)}
                      onChange={() => toggleSelect(c.id)}
                      className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-300 cursor-pointer"
                    />
                  </td>

                  {/* Contact */}
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${avatarColor(c.first_name + (c.last_name || ""))}`}>
                        {getInitials(c)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-blue-600 hover:underline cursor-pointer truncate">
                            {c.first_name} {c.last_name || ""}
                          </span>
                          {c.linkedin_url !== null && (
                            <svg viewBox="0 0 24 24" className="w-4 h-4 text-blue-600 shrink-0" fill="currentColor">
                              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                            </svg>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate max-w-[220px]">{c.title}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${
                            c.company_icon_color === "orange" ? "bg-orange-400" :
                            c.company_icon_color === "green" ? "bg-green-400" :
                            c.company_icon_color === "blue" ? "bg-blue-400" :
                            c.company_icon_color === "purple" ? "bg-purple-400" :
                            c.company_icon_color === "pink" ? "bg-pink-400" :
                            "bg-gray-400"
                          }`} />
                          <span className="text-xs text-gray-400 truncate max-w-[180px]">{c.company}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Signal */}
                  <td className="px-3 py-3">
                    <span className="text-sm text-gray-600">{c.signal}</span>
                  </td>

                  {/* AI Score */}
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-center gap-0.5">
                      <Flame className={`w-4 h-4 ${c.signal_a_hit ? "text-orange-500" : "text-gray-200"}`} fill={c.signal_a_hit ? "currentColor" : "none"} />
                      <Flame className={`w-4 h-4 ${c.signal_b_hit ? "text-orange-500" : "text-gray-200"}`} fill={c.signal_b_hit ? "currentColor" : "none"} />
                      <Flame className={`w-4 h-4 ${c.signal_c_hit ? "text-orange-500" : "text-gray-200"}`} fill={c.signal_c_hit ? "currentColor" : "none"} />
                    </div>
                  </td>

                  {/* Email */}
                  <td className="px-3 py-3 text-center">
                    <button className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-full px-3 py-1.5 hover:bg-gray-50 transition-colors">
                      <AtSign className="w-3 h-3" />
                      Enrich
                    </button>
                  </td>

                  {/* Imported */}
                  <td className="px-3 py-3">
                    <span className="text-xs text-gray-500">{timeAgo(c.imported_at)}</span>
                  </td>

                  {/* List */}
                  <td className="px-3 py-3">
                    <span className="text-xs font-medium text-blue-600 hover:underline cursor-pointer">
                      {c.list_name || "—"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer pagination */}
      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-gray-500">
          Showing {Math.min((page - 1) * perPage + 1, filtered.length)} to {Math.min(page * perPage, filtered.length)} of {filtered.length} results
        </p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Show:</span>
            <select
              value={perPage}
              onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
              className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm text-gray-500">per page</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="p-1.5 border border-gray-200 rounded-lg text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="w-9 h-9 flex items-center justify-center border border-orange-300 rounded-lg text-sm font-medium text-orange-500">
              {page}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="p-1.5 border border-gray-200 rounded-lg text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

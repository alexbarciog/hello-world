import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useNavigate } from "react-router-dom";
import {
  Users, Radio, Megaphone, MessageSquare, Eye, Hash,
  Copy, Check, ExternalLink, Shield, Database, Activity,
  Search, ChevronDown, ChevronUp, Mail, Globe, Flame
} from "lucide-react";
import { toast } from "sonner";

// ── Types ──
interface TabDef {
  id: string;
  label: string;
  icon: React.ReactNode;
  count?: number;
}

// ── Copy helper ──
function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
  toast.success("Copied to clipboard!");
}

// ── Stat Card ──
function StatCard({ label, value, icon, color }: { label: string; value: number | string; icon: React.ReactNode; color: string }) {
  return (
    <div className="glass-card rounded-2xl p-5 flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: color }}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-md-on-surface-variant font-medium">{label}</p>
        <p className="text-2xl font-light tracking-tight text-md-on-surface font-headline">{value}</p>
      </div>
    </div>
  );
}

// ── Main ──
export default function AdminDashboard() {
  const navigate = useNavigate();
  const { data: isAdmin, isLoading: adminLoading } = useAdminCheck();
  const [activeTab, setActiveTab] = useState("users");
  const [search, setSearch] = useState("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // ── Fetch all data ──
  const { data: allUsers = [] } = useQuery({
    queryKey: ["admin-auth-users"],
    queryFn: async () => {
      const res = await supabase.functions.invoke("admin-get-users");
      return res.data?.users ?? [];
    },
    enabled: isAdmin === true,
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ["admin-campaigns"],
    queryFn: async () => {
      const { data } = await supabase.from("campaigns").select("*");
      return data ?? [];
    },
    enabled: isAdmin === true,
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ["admin-contacts"],
    queryFn: async () => {
      const { data } = await supabase.from("contacts").select("*");
      return data ?? [];
    },
    enabled: isAdmin === true,
  });

  const { data: agents = [] } = useQuery({
    queryKey: ["admin-agents"],
    queryFn: async () => {
      const { data } = await supabase.from("signal_agents").select("*");
      return data ?? [];
    },
    enabled: isAdmin === true,
  });

  const { data: redditMentions = [] } = useQuery({
    queryKey: ["admin-reddit"],
    queryFn: async () => {
      const { data } = await supabase.from("reddit_mentions").select("*").order("found_at", { ascending: false }).limit(200);
      return data ?? [];
    },
    enabled: isAdmin === true,
  });

  const { data: xMentions = [] } = useQuery({
    queryKey: ["admin-x"],
    queryFn: async () => {
      const { data } = await supabase.from("x_mentions").select("*").order("found_at", { ascending: false }).limit(200);
      return data ?? [];
    },
    enabled: isAdmin === true,
  });

  const { data: redditKeywords = [] } = useQuery({
    queryKey: ["admin-reddit-kw"],
    queryFn: async () => {
      const { data } = await supabase.from("reddit_keywords").select("*");
      return data ?? [];
    },
    enabled: isAdmin === true,
  });

  const { data: xKeywords = [] } = useQuery({
    queryKey: ["admin-x-kw"],
    queryFn: async () => {
      const { data } = await supabase.from("x_keywords").select("*");
      return data ?? [];
    },
    enabled: isAdmin === true,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: async () => {
      const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(100);
      return data ?? [];
    },
    enabled: isAdmin === true,
  });

  if (adminLoading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-md-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center gap-4">
        <Shield className="w-16 h-16 text-md-on-surface-variant/30" />
        <h1 className="text-xl font-headline text-md-on-surface">Access Denied</h1>
        <p className="text-md-on-surface-variant text-sm">You don't have admin privileges.</p>
        <button onClick={() => navigate("/dashboard")} className="px-4 py-2 bg-md-primary text-white rounded-lg text-sm font-medium">
          Go to Dashboard
        </button>
      </div>
    );
  }

  // ── Merge user data ──
  const mergedUsers = allUsers;

  const tabs: TabDef[] = [
    { id: "users", label: "Users", icon: <Users className="w-4 h-4" />, count: mergedUsers.length },
    { id: "campaigns", label: "Campaigns", icon: <Megaphone className="w-4 h-4" />, count: campaigns.length },
    { id: "contacts", label: "Contacts", icon: <Users className="w-4 h-4" />, count: contacts.length },
    { id: "agents", label: "Signal Agents", icon: <Radio className="w-4 h-4" />, count: agents.length },
    { id: "reddit", label: "Reddit Mentions", icon: <MessageSquare className="w-4 h-4" />, count: redditMentions.length },
    { id: "x", label: "X Mentions", icon: <Globe className="w-4 h-4" />, count: xMentions.length },
    { id: "notifications", label: "Notifications", icon: <Mail className="w-4 h-4" />, count: notifications.length },
  ];

  const filterData = (data: any[]) => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter((item) =>
      Object.values(item).some((v) =>
        String(v ?? "").toLowerCase().includes(q)
      )
    );
  };

  return (
    <div className="min-h-full rounded-2xl px-4 md:px-8 py-6 md:py-8 m-2 md:m-4 font-body bg-white">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "hsla(var(--md-primary) / 0.12)" }}>
              <Shield className="w-5 h-5 text-md-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-light tracking-tight text-md-on-surface font-headline">
              Admin <span className="font-semibold text-md-primary">Dashboard</span>
            </h1>
          </div>
          <p className="text-md-on-surface-variant font-light text-sm tracking-wide ml-[52px]">
            Full database overview and management
          </p>
        </div>
      </header>

      {/* Stats overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Users" value={mergedUsers.length} icon={<Users className="w-5 h-5 text-md-primary" />} color="hsla(var(--md-primary) / 0.12)" />
        <StatCard label="Campaigns" value={campaigns.length} icon={<Megaphone className="w-5 h-5 text-md-secondary" />} color="hsla(var(--md-secondary) / 0.12)" />
        <StatCard label="Contacts" value={contacts.length} icon={<Users className="w-5 h-5 text-md-tertiary" />} color="hsla(var(--md-tertiary-fixed) / 0.3)" />
        <StatCard label="Active Agents" value={agents.filter((a: any) => a.status === "active").length} icon={<Radio className="w-5 h-5 text-emerald-600" />} color="rgba(16,185,129,0.12)" />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSearch(""); setExpandedRow(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? "bg-md-primary text-white shadow-md"
                : "bg-md-surface-container text-md-on-surface-variant hover:bg-md-surface-container-high"
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === tab.id ? "bg-white/20" : "bg-md-surface-container-high"
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-md-on-surface-variant/50" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${activeTab}...`}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-md-surface-container border-0 text-sm text-md-on-surface placeholder:text-md-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-md-primary/30"
        />
      </div>

      {/* Content */}
      <div className="overflow-x-auto rounded-xl border border-md-outline-variant/30">
        {activeTab === "users" && <UsersTable data={filterData(mergedUsers)} expandedRow={expandedRow} setExpandedRow={setExpandedRow} campaigns={campaigns} />}
        {activeTab === "campaigns" && <CampaignsTable data={filterData(campaigns)} />}
        {activeTab === "contacts" && <ContactsTable data={filterData(contacts)} />}
        {activeTab === "agents" && <AgentsTable data={filterData(agents)} />}
        {activeTab === "reddit" && <RedditTable data={filterData(redditMentions)} />}
        {activeTab === "x" && <XTable data={filterData(xMentions)} />}
        {activeTab === "notifications" && <NotificationsTable data={filterData(notifications)} />}
      </div>
    </div>
  );
}

// ── Table Components ──

function CopyCell({ value, truncate = true }: { value: string | null; truncate?: boolean }) {
  const [copied, setCopied] = useState(false);
  if (!value) return <span className="text-md-on-surface-variant/40">—</span>;
  return (
    <button
      onClick={() => { copyToClipboard(value); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="group flex items-center gap-1.5 text-left hover:text-md-primary transition-colors max-w-[200px]"
      title="Click to copy"
    >
      <span className={truncate ? "truncate" : ""}>{value}</span>
      {copied ? <Check className="w-3 h-3 text-emerald-500 shrink-0" /> : <Copy className="w-3 h-3 opacity-0 group-hover:opacity-50 shrink-0" />}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700",
    paused: "bg-amber-100 text-amber-700",
    draft: "bg-slate-100 text-slate-600",
    pending_linkedin: "bg-blue-100 text-blue-700",
    completed: "bg-purple-100 text-purple-700",
  };
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${colors[status] || "bg-slate-100 text-slate-600"}`}>
      {status}
    </span>
  );
}

function TH({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.15em] font-semibold text-md-on-surface-variant/70 bg-md-surface-container/50">
      {children}
    </th>
  );
}

function TD({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 text-sm text-md-on-surface ${className}`}>{children}</td>;
}

function UsersTable({ data, expandedRow, setExpandedRow, campaigns }: { data: any[]; expandedRow: string | null; setExpandedRow: (id: string | null) => void; campaigns: any[] }) {
  const getUserWebsite = (userId: string) => {
    const campaign = campaigns.find((c: any) => c.user_id === userId && c.website);
    return campaign?.website || null;
  };

  return (
    <table className="w-full">
      <thead>
        <tr><TH>Email</TH><TH>Name</TH><TH>Website</TH><TH>Onboarded</TH><TH>Plan</TH><TH>Credits</TH><TH>LinkedIn</TH><TH>Created</TH><TH>{" "}</TH></tr>
      </thead>
      <tbody className="divide-y divide-md-outline-variant/20">
        {data.map((u: any) => {
          const id = u.id || u.user_id;
          const name = [u.raw_user_meta_data?.first_name, u.raw_user_meta_data?.last_name].filter(Boolean).join(" ") || "—";
          const isExpanded = expandedRow === id;
          const website = getUserWebsite(id);
          const isPaid = (u.credits ?? 0) >= 100;
          return (
            <>
              <tr key={id} className="hover:bg-md-surface-container/30 transition-colors cursor-pointer" onClick={() => setExpandedRow(isExpanded ? null : id)}>
                <TD><CopyCell value={u.email} /></TD>
                <TD>{name}</TD>
                <TD>
                  {website ? (
                    <a href={website.startsWith("http") ? website : `https://${website}`} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 text-blue-500 hover:text-blue-700 text-xs truncate max-w-[150px]">
                      <Globe className="w-3 h-3 shrink-0" />
                      {website.replace(/^https?:\/\//, "")}
                    </a>
                  ) : <span className="text-md-on-surface-variant/40">—</span>}
                </TD>
                <TD>{u.onboarding_complete ? <Check className="w-4 h-4 text-emerald-500" /> : <span className="text-md-on-surface-variant/40">✗</span>}</TD>
                <TD>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${isPaid ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                    {isPaid ? "Paid" : "Free"}
                  </span>
                </TD>
                <TD><span className="font-mono text-xs">{u.credits ?? 0}</span></TD>
                <TD>{u.unipile_account_id ? <Check className="w-4 h-4 text-blue-500" /> : <span className="text-md-on-surface-variant/40">—</span>}</TD>
                <TD><span className="text-xs text-md-on-surface-variant whitespace-nowrap">{new Date(u.created_at).toLocaleString("ro-RO", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span></TD>
                <TD>{isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</TD>
              </tr>
              {isExpanded && (
                <tr key={`${id}-detail`}>
                  <td colSpan={9} className="px-6 py-4 bg-md-surface-container/20">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div><span className="text-md-on-surface-variant/60">User ID:</span> <CopyCell value={id} /></div>
                      <div><span className="text-md-on-surface-variant/60">Website:</span> <CopyCell value={website} /></div>
                      <div><span className="text-md-on-surface-variant/60">Daily Msgs Limit:</span> {u.daily_messages_limit ?? "—"}</div>
                      <div><span className="text-md-on-surface-variant/60">Daily Conn Limit:</span> {u.daily_connections_limit ?? "—"}</div>
                      <div><span className="text-md-on-surface-variant/60">Unipile ID:</span> <CopyCell value={u.unipile_account_id} /></div>
                    </div>
                  </td>
                </tr>
              )}
            </>
          );
        })}
      </tbody>
    </table>
  );
}

function CampaignsTable({ data }: { data: any[] }) {
  return (
    <table className="w-full">
      <thead>
        <tr><TH>Name</TH><TH>Status</TH><TH>User</TH><TH>Invites Sent</TH><TH>Messages</TH><TH>Created</TH></tr>
      </thead>
      <tbody className="divide-y divide-md-outline-variant/20">
        {data.map((c: any) => (
          <tr key={c.id} className="hover:bg-md-surface-container/30 transition-colors">
            <TD><CopyCell value={c.company_name || c.description || c.id} /></TD>
            <TD><StatusBadge status={c.status} /></TD>
            <TD><CopyCell value={c.user_id} /></TD>
            <TD><span className="font-mono text-xs">{c.invitations_sent ?? 0}</span></TD>
            <TD><span className="font-mono text-xs">{c.messages_sent ?? 0}</span></TD>
            <TD><span className="text-xs text-md-on-surface-variant">{new Date(c.created_at).toLocaleDateString()}</span></TD>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ContactsTable({ data }: { data: any[] }) {
  return (
    <table className="w-full">
      <thead>
        <tr><TH>Name</TH><TH>Title</TH><TH>Company</TH><TH>Email</TH><TH>LinkedIn</TH><TH>Score</TH><TH>Tier</TH></tr>
      </thead>
      <tbody className="divide-y divide-md-outline-variant/20">
        {data.map((c: any) => (
          <tr key={c.id} className="hover:bg-md-surface-container/30 transition-colors cursor-pointer"
              onClick={() => {
                const info = `${c.first_name} ${c.last_name || ""}\n${c.title || ""}\n${c.company || ""}\n${c.email || ""}\n${c.linkedin_url || ""}`;
                copyToClipboard(info.trim());
              }}>
            <TD><span className="font-medium">{c.first_name} {c.last_name || ""}</span></TD>
            <TD><span className="text-xs">{c.title || "—"}</span></TD>
            <TD><span className="text-xs">{c.company || "—"}</span></TD>
            <TD><CopyCell value={c.email} /></TD>
            <TD>{c.linkedin_url ? <a href={c.linkedin_url} target="_blank" rel="noopener" className="text-blue-500 hover:text-blue-700" onClick={(e) => e.stopPropagation()}><ExternalLink className="w-3.5 h-3.5" /></a> : "—"}</TD>
            <TD><span className="font-mono text-xs">{c.ai_score ?? 0}</span></TD>
            <TD>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                c.relevance_tier === "hot" ? "bg-red-100 text-red-700" : c.relevance_tier === "warm" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
              }`}>{c.relevance_tier}</span>
            </TD>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function AgentsTable({ data }: { data: any[] }) {
  return (
    <table className="w-full">
      <thead>
        <tr><TH>Name</TH><TH>Status</TH><TH>Type</TH><TH>Results</TH><TH>Precision</TH><TH>Last Launch</TH><TH>User</TH></tr>
      </thead>
      <tbody className="divide-y divide-md-outline-variant/20">
        {data.map((a: any) => (
          <tr key={a.id} className="hover:bg-md-surface-container/30 transition-colors">
            <TD><span className="font-medium">{a.name}</span></TD>
            <TD><StatusBadge status={a.status} /></TD>
            <TD><span className="text-xs">{a.agent_type}</span></TD>
            <TD><span className="font-mono text-xs">{a.results_count}</span></TD>
            <TD><span className="text-xs">{a.precision_mode || "—"}</span></TD>
            <TD><span className="text-xs text-md-on-surface-variant">{a.last_launched_at ? new Date(a.last_launched_at).toLocaleString() : "Never"}</span></TD>
            <TD><CopyCell value={a.user_id} /></TD>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function RedditTable({ data }: { data: any[] }) {
  return (
    <table className="w-full">
      <thead>
        <tr><TH>Title</TH><TH>Subreddit</TH><TH>Author</TH><TH>Keyword</TH><TH>Score</TH><TH>Found</TH><TH>Link</TH></tr>
      </thead>
      <tbody className="divide-y divide-md-outline-variant/20">
        {data.map((m: any) => (
          <tr key={m.id} className="hover:bg-md-surface-container/30 transition-colors">
            <TD><span className="truncate block max-w-[250px] text-xs">{m.title}</span></TD>
            <TD><span className="text-xs font-medium text-md-secondary">r/{m.subreddit}</span></TD>
            <TD><span className="text-xs">{m.author}</span></TD>
            <TD><span className="text-[11px] bg-md-surface-container px-2 py-0.5 rounded-full">{m.keyword_matched}</span></TD>
            <TD><span className="font-mono text-xs">{m.score ?? 0}</span></TD>
            <TD><span className="text-xs text-md-on-surface-variant">{new Date(m.found_at).toLocaleDateString()}</span></TD>
            <TD><a href={m.url} target="_blank" rel="noopener" className="text-blue-500 hover:text-blue-700"><ExternalLink className="w-3.5 h-3.5" /></a></TD>

          </tr>
        ))}
      </tbody>
    </table>
  );
}

function XTable({ data }: { data: any[] }) {
  return (
    <table className="w-full">
      <thead>
        <tr><TH>Content</TH><TH>Author</TH><TH>Keyword</TH><TH>Likes</TH><TH>Retweets</TH><TH>Found</TH><TH>Link</TH></tr>
      </thead>
      <tbody className="divide-y divide-md-outline-variant/20">
        {data.map((m: any) => (
          <tr key={m.id} className="hover:bg-md-surface-container/30 transition-colors">
            <TD><span className="truncate block max-w-[250px] text-xs">{m.title}</span></TD>
            <TD><span className="text-xs">@{m.author}</span></TD>
            <TD><span className="text-[11px] bg-md-surface-container px-2 py-0.5 rounded-full">{m.keyword_matched}</span></TD>
            <TD><span className="font-mono text-xs">{m.like_count ?? 0}</span></TD>
            <TD><span className="font-mono text-xs">{m.retweet_count ?? 0}</span></TD>
            <TD><span className="text-xs text-md-on-surface-variant">{new Date(m.found_at).toLocaleDateString()}</span></TD>
            <TD><a href={m.url} target="_blank" rel="noopener" className="text-blue-500 hover:text-blue-700"><ExternalLink className="w-3.5 h-3.5" /></a></TD>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function NotificationsTable({ data }: { data: any[] }) {
  return (
    <table className="w-full">
      <thead>
        <tr><TH>Title</TH><TH>Body</TH><TH>Type</TH><TH>Read</TH><TH>User</TH><TH>Created</TH></tr>
      </thead>
      <tbody className="divide-y divide-md-outline-variant/20">
        {data.map((n: any) => (
          <tr key={n.id} className="hover:bg-md-surface-container/30 transition-colors">
            <TD><span className="font-medium text-xs">{n.title}</span></TD>
            <TD><span className="truncate block max-w-[200px] text-xs">{n.body || "—"}</span></TD>
            <TD><span className="text-[11px] bg-md-surface-container px-2 py-0.5 rounded-full">{n.type}</span></TD>
            <TD>{n.read ? <Check className="w-4 h-4 text-emerald-500" /> : <span className="text-md-on-surface-variant/40">✗</span>}</TD>
            <TD><CopyCell value={n.user_id} /></TD>
            <TD><span className="text-xs text-md-on-surface-variant">{new Date(n.created_at).toLocaleString()}</span></TD>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

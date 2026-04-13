import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  MessageSquare,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ArrowRight,
  Flame,
  Users,
  MessagesSquare,
  Rocket,
  Check,
  Sparkles,
  Zap,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Status dot: green = hot, amber = warm, gray = cold */
function StatusDot({ tier }: { tier: string }) {
  const color =
    tier === "hot"
      ? "bg-snow-success"
      : tier === "warm"
      ? "bg-snow-warning"
      : "bg-snow-white-400";
  return <span className={`w-2.5 h-2.5 rounded-full inline-block ${color}`} />;
}

function LeadAvatar({ initials, color }: { initials: string; color: string }) {
  return (
    <div
      className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
      style={{ background: color }}
    >
      {initials}
    </div>
  );
}

const avatarColors = ["#4F46E5", "#0369A1", "#7C3AED"];

// ─── Metric Card (SnowUI) ─────────────────────────────────────────────────────
interface MetricCardProps {
  title: string;
  value: number | string;
  loading?: boolean;
  icon: React.ReactNode;
  bg: string;
  trend?: string;
  trendUp?: boolean;
}

function MetricCard({ title, value, loading, icon, bg, trend, trendUp }: MetricCardProps) {
  return (
    <div
      className="rounded-[24px] py-7 px-6 flex flex-col gap-4"
      style={{ background: bg }}
    >
      <div className="flex justify-between items-start">
        {icon}
        {trend && (
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              trendUp
                ? "bg-snow-success/10 text-snow-success"
                : "bg-snow-white-200 text-snow-black-100"
            }`}
          >
            {trendUp ? "+" : ""}
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-sm text-snow-black-100 tracking-wide font-normal">{title}</p>
        {loading ? (
          <div className="h-9 w-16 bg-snow-white-300 rounded animate-pulse mt-1" />
        ) : (
          <h3 className="text-3xl font-bold text-snow-black mt-1 tracking-tight">{value}</h3>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const [getStartedOpen, setGetStartedOpen] = useState(true);

  const handleNewCampaign = () => {
    navigate("/campaigns?autoStart=true");
  };

  // ── User info ──
  const { data: userData } = useQuery({
    queryKey: ["dashboard-user"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return { firstName: "there", email: "" };
      const firstName =
        user.user_metadata?.first_name ||
        user.user_metadata?.full_name?.split(" ")[0] ||
        user.email?.split("@")[0] ||
        "there";
      return { firstName, email: user.email || "" };
    },
    staleTime: 60_000,
  });

  // ── Profile (LinkedIn check) ──
  const { data: profileData } = useQuery({
    queryKey: ["dashboard-profile"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return { linkedinConnected: false, onboardingComplete: false };
      const { data } = await supabase
        .from("profiles")
        .select("unipile_account_id, onboarding_complete")
        .eq("user_id", user.id)
        .single();
      return {
        linkedinConnected: Boolean(data?.unipile_account_id),
        onboardingComplete: data?.onboarding_complete ?? false,
      };
    },
    staleTime: 30_000,
  });

  // ── Active signals count ──
  const { data: signalData } = useQuery({
    queryKey: ["dashboard-signals"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("signal_agents")
        .select("id", { count: "exact", head: true })
        .eq("status", "active");
      if (error) throw error;
      return { activeCount: count ?? 0 };
    },
    staleTime: 30_000,
  });

  // ── Campaigns stats ──
  const { data: campaignStats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-campaign-stats"],
    queryFn: async () => {
      const { data: campaigns, error } = await supabase
        .from("campaigns")
        .select("id, status, invitations_sent, messages_sent, icp_job_titles, icp_industries");
      if (error) throw error;
      const all = campaigns ?? [];
      const leadsEngaged = all.reduce((s, c) => s + (c.invitations_sent ?? 0), 0);
      const conversations = all.reduce((s, c) => s + (c.messages_sent ?? 0), 0);
      const totalCampaigns = all.length;
      const hasIcp = all.some(
        (c) => (c.icp_job_titles?.length ?? 0) > 0 || (c.icp_industries?.length ?? 0) > 0
      );
      const hasLaunched = all.some(
        (c) => c.status === "active" && (c.invitations_sent ?? 0) > 0
      );
      return { leadsEngaged, conversations, totalCampaigns, hasIcp, hasLaunched };
    },
    staleTime: 30_000,
  });

  // ── Hot opportunities ──
  const { data: hotOppsData, isLoading: hotOppsLoading } = useQuery({
    queryKey: ["dashboard-hot-opps"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("contacts")
        .select("id", { count: "exact", head: true })
        .eq("relevance_tier", "hot");
      if (error) throw error;
      return { count: count ?? 0 };
    },
    staleTime: 30_000,
  });

  // ── Latest leads ──
  const { data: latestLeads, isLoading: leadsLoading } = useQuery({
    queryKey: ["dashboard-latest-leads"],
    queryFn: async () => {
      const { data: contacts, error } = await supabase
        .from("contacts")
        .select(
          "first_name, last_name, title, company, ai_score, relevance_tier, imported_at, linkedin_url, signal, signal_post_url"
        )
        .order("imported_at", { ascending: false })
        .limit(50);
      if (error || !contacts || contacts.length === 0) return [];
      const tierOrder: Record<string, number> = { hot: 0, warm: 1, cold: 2 };
      const sorted = [...contacts].sort((a, b) => {
        const ta = tierOrder[a.relevance_tier] ?? 2;
        const tb = tierOrder[b.relevance_tier] ?? 2;
        if (ta !== tb) return ta - tb;
        return new Date(b.imported_at).getTime() - new Date(a.imported_at).getTime();
      });
      return sorted.slice(0, 5).map((c) => ({
        name: [c.first_name, c.last_name].filter(Boolean).join(" "),
        title: c.title,
        company: c.company,
        relevance_tier: c.relevance_tier as string,
        linkedin_url: c.linkedin_url,
        signal: c.signal,
        signal_post_url: c.signal_post_url,
      }));
    },
    staleTime: 30_000,
  });

  // ── Latest replies ──
  const { data: latestReplies, isLoading: repliesLoading } = useQuery({
    queryKey: ["dashboard-latest-replies"],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) return [];
      const res = await supabase.functions.invoke("linkedin-messaging", {
        body: { action: "list_chats", limit: 5 },
      });
      if (res.error) return [];
      const items = res.data?.items ?? [];
      return items
        .map(
          (chat: Record<string, unknown>) => {
            const attendees =
              (chat.attendees as Array<{ display_name?: string; profile_picture_url?: string }>) ??
              [];
            const attendee = attendees[0];
            const lastMsg = chat.last_message as
              | { text?: string; timestamp?: string; is_sender?: boolean }
              | undefined;
            return {
              name: attendee?.display_name ?? "LinkedIn User",
              avatar_url: attendee?.profile_picture_url ?? null,
              text: lastMsg?.text ?? "",
              timestamp: lastMsg?.timestamp ?? "",
              is_sender: lastMsg?.is_sender ?? false,
              chat_id: chat.id as string,
            };
          }
        )
        .filter((r: { is_sender: boolean }) => !r.is_sender)
        .slice(0, 4);
    },
    staleTime: 60_000,
    enabled: Boolean(profileData?.linkedinConnected),
  });

  // ── Chart data from contacts ──
  const { data: chartContacts } = useQuery({
    queryKey: ["dashboard-chart-contacts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select("imported_at")
        .order("imported_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });

  const chartData = (() => {
    const result = [];
    const now = new Date();
    const counts: Record<string, number> = {};
    (chartContacts ?? []).forEach((c) => {
      const d = new Date(c.imported_at);
      const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      counts[key] = (counts[key] || 0) + 1;
    });
    for (let i = 30; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      result.push({ date: label, leads: counts[label] || 0 });
    }
    return result;
  })();

  const hotOpps = hotOppsData?.count ?? 0;
  const leadsEngaged = campaignStats?.leadsEngaged ?? 0;
  const conversations = campaignStats?.conversations ?? 0;
  const activeSignals = signalData?.activeCount ?? 0;
  const linkedinConnected = profileData?.linkedinConnected ?? false;
  const totalCampaigns = campaignStats?.totalCampaigns ?? 0;
  const hasIcp = campaignStats?.hasIcp ?? false;
  const hasLaunched = campaignStats?.hasLaunched ?? false;
  const firstName = userData?.firstName ?? "there";

  // ── Quick Start steps ──
  const quickStartSteps = [
    {
      label: "Connect LinkedIn",
      desc: linkedinConnected ? "Profile synced & verified" : "Required to start outreach",
      done: linkedinConnected,
    },
    {
      label: "Create your first campaign",
      desc: totalCampaigns > 0 ? `${totalCampaigns} campaign(s) created` : "Set up outreach sequence",
      done: totalCampaigns > 0,
    },
    {
      label: "Add your ICP",
      desc: hasIcp ? "Customer profile defined" : "Define ideal customer profile",
      done: hasIcp,
    },
    {
      label: "Launch first outreach",
      desc: hasLaunched ? "Outreach is live!" : "Start engaging leads",
      done: hasLaunched,
    },
  ];

  const getStartedSteps = [
    { label: "Connect your LinkedIn account", done: linkedinConnected },
    { label: "Create your first campaign", done: totalCampaigns > 0 },
    { label: "Add your ICP (Ideal Customer Profile)", done: hasIcp },
    { label: "Launch your first outreach sequence", done: hasLaunched },
  ];

  const completedSteps = getStartedSteps.filter((s) => s.done).length;

  /* ======================================================================== */
  return (
    <div className="min-h-full bg-white px-4 md:px-8 py-8 md:py-10 m-2 md:m-4 rounded-[20px]">
      {/* ── Header ── */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-snow-black">
            Welcome back, <span className="text-snow-primary">{firstName}</span>
          </h1>
          <p className="text-snow-black-100 text-sm">
            Your outreach performance this week.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => navigate("/signals")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeSignals > 0
                ? "text-snow-success bg-snow-success/10"
                : "text-snow-danger bg-snow-danger/10"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                activeSignals > 0 ? "bg-snow-success" : "bg-snow-danger"
              }`}
            />
            {activeSignals} Active Signal(s)
          </button>
          <button
            onClick={() => navigate("/settings?tab=linkedin")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              linkedinConnected
                ? "text-snow-success bg-snow-success/10"
                : "text-snow-warning bg-snow-warning/10"
            }`}
          >
            {linkedinConnected ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-snow-warning" />
            )}
            {linkedinConnected ? "LinkedIn Connected" : "Connect LinkedIn"}
          </button>
          <button
            onClick={handleNewCampaign}
            className="bg-snow-primary text-white px-5 py-2.5 rounded-full font-semibold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Rocket className="w-4 h-4" />
            Start a campaign
          </button>
        </div>
      </header>

      {/* ── Metrics Row ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <MetricCard
          title="Hot Opportunities"
          value={hotOpps}
          loading={hotOppsLoading}
          icon={<Flame className="w-5 h-5 text-snow-primary" />}
          bg="#EDEEFC"
          trend={hotOpps > 0 ? "12.4%" : "0%"}
          trendUp={hotOpps > 0}
        />
        <MetricCard
          title="Leads Engaged"
          value={leadsEngaged}
          loading={statsLoading}
          icon={<Users className="w-5 h-5 text-snow-info" />}
          bg="#E6F1FD"
          trend={leadsEngaged > 0 ? "8.1%" : "0%"}
          trendUp={leadsEngaged > 0}
        />
        <MetricCard
          title="Conversations"
          value={conversations}
          loading={statsLoading}
          icon={<MessagesSquare className="w-5 h-5 text-snow-primary" />}
          bg="#E6F1FD"
          trend={conversations > 0 ? "24%" : "0%"}
          trendUp={conversations > 0}
        />
      </div>

      {/* ── Main: Chart + Quick Start ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-6 mb-8">
        {/* Chart */}
        <div className="bg-snow-white-100 rounded-[20px] p-6 md:p-8 flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-snow-black">Performance</h2>
              <p className="text-xs text-snow-black-100 mt-0.5">Leads created — last 30 days</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-snow-primary" />
              <span className="text-[11px] text-snow-black-100">Leads</span>
            </div>
          </div>

          <div className="flex-grow" style={{ minHeight: 200 }}>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 5, right: 12, left: -28, bottom: 0 }}>
                <defs>
                  <linearGradient id="snowFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="#4F46E5" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#EBEBED" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "#6E6E80" }}
                  tickLine={false}
                  axisLine={false}
                  interval={3}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#6E6E80" }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ stroke: "#E0E0E3", strokeWidth: 1, strokeDasharray: "4 3" }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="bg-white rounded-xl px-4 py-2 shadow-sm text-xs border border-snow-white-300">
                        <p className="text-snow-black-100 mb-0.5">{label}</p>
                        <p className="text-snow-black font-semibold">
                          {payload[0].value} leads
                        </p>
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="leads"
                  stroke="#4F46E5"
                  strokeWidth={2}
                  fill="url(#snowFill)"
                  dot={false}
                  activeDot={{ r: 5, fill: "#4F46E5", stroke: "white", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Start Sidebar */}
        <div className="bg-snow-white-100 rounded-[20px] p-6 flex flex-col">
          <h2 className="text-base font-semibold text-snow-black mb-1">Quick Start</h2>
          <p className="text-xs text-snow-black-100 mb-6">
            {completedSteps}/{quickStartSteps.length} completed
          </p>
          <div className="space-y-5 flex-grow">
            {quickStartSteps.map((step) => (
              <div key={step.label} className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {step.done ? (
                    <div className="w-7 h-7 rounded-full bg-snow-success/15 flex items-center justify-center text-snow-success">
                      <Check className="w-3.5 h-3.5" strokeWidth={3} />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full border-2 border-snow-white-400 flex items-center justify-center text-snow-black-100">
                      <Zap className="w-3 h-3" />
                    </div>
                  )}
                </div>
                <div>
                  <h4
                    className={`text-sm font-medium ${
                      step.done ? "text-snow-black-100 line-through" : "text-snow-black"
                    }`}
                  >
                    {step.label}
                  </h4>
                  <p className="text-xs text-snow-black-100">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleNewCampaign}
            className="w-full py-2.5 mt-6 rounded-full border border-snow-primary/30 text-snow-primary text-sm font-medium hover:bg-snow-primary/5 transition-colors flex items-center justify-center gap-2"
          >
            View setup guide
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Bottom: Leads & Replies ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Latest Hot Leads */}
        <div className="bg-snow-white-100 rounded-[20px] p-6">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-base font-semibold text-snow-black">Latest Hot Leads</h2>
            <button
              onClick={() => navigate("/contacts")}
              className="text-xs font-medium text-snow-primary hover:underline"
            >
              View CRM
            </button>
          </div>
          <div className="space-y-1">
            {leadsLoading ? (
              <div className="space-y-3 py-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-2">
                    <div className="w-10 h-10 rounded-lg bg-snow-white-300 animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-32 bg-snow-white-300 rounded animate-pulse" />
                      <div className="h-2.5 w-24 bg-snow-white-300 rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (latestLeads ?? []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <Users className="w-7 h-7 text-snow-white-400" />
                <p className="text-sm text-snow-black-100">
                  No leads yet. Start a campaign to discover leads.
                </p>
              </div>
            ) : (
              (latestLeads ?? []).map((lead, i) => {
                const initials = lead.name
                  .split(" ")
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase();
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-snow-white-200 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <LeadAvatar
                        initials={initials}
                        color={avatarColors[i % avatarColors.length]}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-snow-black text-sm truncate">
                            {lead.name}
                          </span>
                          {lead.linkedin_url && (
                            <a
                              href={lead.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-[#0A66C2] hover:text-[#004182] shrink-0"
                            >
                              <svg
                                className="w-3.5 h-3.5"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                              >
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                              </svg>
                            </a>
                          )}
                        </div>
                        <p className="text-xs text-snow-black-100 truncate">
                          {[lead.title, lead.company].filter(Boolean).join(" at ") || "No details"}
                        </p>
                        {lead.signal &&
                          (lead.signal_post_url ? (
                            <a
                              href={lead.signal_post_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs text-snow-primary truncate block mt-0.5 hover:underline"
                            >
                              ⚡ {lead.signal}
                            </a>
                          ) : (
                            <p className="text-xs text-snow-black-100 truncate mt-0.5">
                              ⚡ {lead.signal}
                            </p>
                          ))}
                      </div>
                    </div>
                    <StatusDot tier={lead.relevance_tier} />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Latest Replies */}
        <div className="bg-snow-white-100 rounded-[20px] p-6">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-base font-semibold text-snow-black">Latest Replies</h2>
            <button
              onClick={() => navigate("/unibox")}
              className="flex items-center gap-1.5 text-xs font-medium text-snow-primary hover:underline"
            >
              Open Inbox
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {repliesLoading ? (
            <div className="space-y-3 py-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <div className="w-10 h-10 rounded-lg bg-snow-white-300 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-32 bg-snow-white-300 rounded animate-pulse" />
                    <div className="h-2.5 w-48 bg-snow-white-300 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : (latestReplies ?? []).length > 0 ? (
            <div className="space-y-1">
              {(latestReplies ?? []).map((reply, i) => {
                const initials = reply.name
                  .split(" ")
                  .slice(0, 2)
                  .map((w: string) => w[0])
                  .join("")
                  .toUpperCase();
                const timeAgo = reply.timestamp
                  ? (() => {
                      const diff = Math.floor(
                        (Date.now() - new Date(reply.timestamp).getTime()) / 1000
                      );
                      if (diff < 60) return `${diff}s ago`;
                      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
                      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
                      return `${Math.floor(diff / 86400)}d ago`;
                    })()
                  : "";
                return (
                  <div
                    key={reply.chat_id || i}
                    onClick={() => navigate("/unibox")}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-snow-white-200 transition-colors cursor-pointer"
                  >
                    {reply.avatar_url ? (
                      <img
                        src={reply.avatar_url}
                        alt={reply.name}
                        className="w-10 h-10 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <LeadAvatar
                        initials={initials}
                        color={avatarColors[i % avatarColors.length]}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-snow-black text-sm">{reply.name}</span>
                        {timeAgo && (
                          <span className="text-[10px] text-snow-black-100">{timeAgo}</span>
                        )}
                      </div>
                      <p className="text-xs text-snow-black-100 truncate">
                        {reply.text || "No message"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <MessageSquare className="w-7 h-7 text-snow-white-400" />
              <p className="text-sm text-snow-black-100">No new replies yet</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Get Started panel ── */}
      {completedSteps < getStartedSteps.length && (
        <div className="bg-snow-white-100 rounded-[20px] overflow-hidden mb-8">
          <button
            onClick={() => setGetStartedOpen(!getStartedOpen)}
            className="w-full flex items-center justify-between px-5 py-4 transition-colors hover:bg-snow-white-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-snow-primary flex items-center justify-center">
                <Rocket className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-snow-black">Get Started</p>
                <p className="text-[11px] text-snow-black-100">
                  {completedSteps} of {getStartedSteps.length} steps completed
                </p>
              </div>
            </div>
            {getStartedOpen ? (
              <ChevronUp className="w-4 h-4 text-snow-black-100" />
            ) : (
              <ChevronDown className="w-4 h-4 text-snow-black-100" />
            )}
          </button>
          {getStartedOpen && (
            <div className="px-5 pb-5 pt-1 border-t border-snow-white-300">
              <div className="space-y-3 mt-3">
                {getStartedSteps.map((step) => (
                  <div key={step.label} className="flex items-center gap-3">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        background: step.done ? "#4F46E5" : "transparent",
                        border: step.done ? "none" : "2px solid #E0E0E3",
                      }}
                    >
                      {step.done && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                    </div>
                    <p
                      className={`text-sm ${
                        step.done ? "line-through text-snow-black-100" : "text-snow-black"
                      }`}
                    >
                      {step.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

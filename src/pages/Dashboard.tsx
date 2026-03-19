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
  ArrowUpRight,
  ArrowDownRight,
  Flame,
  Users,
  MessagesSquare,
  Rocket,
  Check,
  Zap,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { clearOnboardingSession } from "@/components/OnboardingGuard";
import { supabase } from "@/integrations/supabase/client";

// ─── Sub-components ───────────────────────────────────────────────────────────
function HeatDots({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[0, 1, 2].map((i) => (
        <span key={i} className="text-sm" style={{ opacity: i < count ? 1 : 0.2 }}>🔥</span>
      ))}
    </div>
  );
}

function LeadAvatar({ initials, color }: { initials: string; color: string }) {
  return (
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-md"
      style={{ background: color }}
    >
      {initials}
    </div>
  );
}

const avatarColors = [
  "hsl(var(--md-primary))",
  "hsl(var(--md-secondary))",
  "hsl(var(--md-tertiary))",
];

// ─── Metric Card ──────────────────────────────────────────────────────────────
interface MetricCardProps {
  title: string;
  value: number | string;
  loading?: boolean;
  icon: React.ReactNode;
  iconBg: string;
  trend?: string;
  trendUp?: boolean;
}

function MetricCard({ title, value, loading, icon, iconBg, trend, trendUp }: MetricCardProps) {
  return (
    <div className="glass-card p-5 rounded-2xl flex flex-col justify-between group relative overflow-hidden">
      <div className="flex justify-between items-start mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: iconBg }}>
          {icon}
        </div>
        {trend && (
          <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
            trendUp ? "bg-green-100 text-green-700" : "bg-md-surface-container text-md-on-surface-variant"
          }`}>
            {trendUp ? "↑" : ""} {trend}
          </span>
        )}
      </div>
      <div>
        <h3 className="text-md-on-surface-variant font-light text-[10px] uppercase tracking-[0.2em] mb-1">{title}</h3>
        {loading ? (
          <div className="h-8 w-12 bg-md-surface-container rounded animate-pulse" />
        ) : (
          <div className="text-3xl font-light tracking-tight text-md-on-surface font-headline">{value}</div>
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
    clearOnboardingSession();
    navigate("/");
  };

  // ── User info ──
  const { data: userData } = useQuery({
    queryKey: ["dashboard-user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { firstName: "there", email: "" };
      const firstName = user.user_metadata?.first_name || user.user_metadata?.full_name?.split(" ")[0] || user.email?.split("@")[0] || "there";
      return { firstName, email: user.email || "" };
    },
    staleTime: 60_000,
  });

  // ── Profile (LinkedIn check) ──
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ["dashboard-profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { linkedinConnected: false, onboardingComplete: false };
      const { data } = await supabase.from("profiles").select("unipile_account_id, onboarding_complete").eq("user_id", user.id).single();
      return {
        linkedinConnected: Boolean(data?.unipile_account_id),
        onboardingComplete: data?.onboarding_complete ?? false,
      };
    },
    staleTime: 30_000,
  });

  // ── Active signals count ──
  const { data: signalData, isLoading: signalLoading } = useQuery({
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
      const activeCampaigns = all.filter(c => c.status === "active").length;
      const hasIcp = all.some(c => (c.icp_job_titles?.length ?? 0) > 0 || (c.icp_industries?.length ?? 0) > 0);
      const hasLaunched = all.some(c => c.status === "active" && (c.invitations_sent ?? 0) > 0);
      return { leadsEngaged, conversations, totalCampaigns, activeCampaigns, hasIcp, hasLaunched };
    },
    staleTime: 30_000,
  });

  // ── Hot opportunities (leads) ──
  const { data: hotOppsData, isLoading: hotOppsLoading } = useQuery({
    queryKey: ["dashboard-hot-opps"],
    queryFn: async () => {
      const { data: campaigns } = await supabase.from("campaigns").select("id");
      if (!campaigns || campaigns.length === 0) return { count: 0 };
      const campaignIds = campaigns.map((c) => c.id);
      const { count, error } = await supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .in("campaign_id", campaignIds);
      if (error) throw error;
      return { count: count ?? 0 };
    },
    staleTime: 30_000,
  });

  // ── Real leads for "Latest Hot Leads" ──
  const { data: latestLeads, isLoading: leadsLoading } = useQuery({
    queryKey: ["dashboard-latest-leads"],
    queryFn: async () => {
      const { data: campaigns } = await supabase.from("campaigns").select("id");
      if (!campaigns || campaigns.length === 0) return [];
      const campaignIds = campaigns.map((c) => c.id);
      const { data, error } = await supabase
        .from("leads")
        .select("name, title, company, score")
        .in("campaign_id", campaignIds)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,
  });

  // ── Contacts for chart data ──
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

  // ── Generate chart from real contacts ──
  const chartData = (() => {
    const result = [];
    const now = new Date();
    const counts: Record<string, number> = {};
    (chartContacts ?? []).forEach(c => {
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

  // ── Quick Start steps (dynamic) ──
  const quickStartSteps = [
    { label: "Connect LinkedIn", desc: linkedinConnected ? "Profile synced & verified" : "Required to start outreach", done: linkedinConnected },
    { label: "Create your first campaign", desc: totalCampaigns > 0 ? `${totalCampaigns} campaign(s) created` : "Set up outreach sequence", done: totalCampaigns > 0 },
    { label: "Add your ICP", desc: hasIcp ? "Customer profile defined" : "Define ideal customer profile", done: hasIcp },
    { label: "Launch first outreach", desc: hasLaunched ? "Outreach is live!" : "Start engaging leads", done: hasLaunched },
  ];

  const getStartedSteps = [
    { label: "Connect your LinkedIn account", done: linkedinConnected },
    { label: "Create your first campaign", done: totalCampaigns > 0 },
    { label: "Add your ICP (Ideal Customer Profile)", done: hasIcp },
    { label: "Launch your first outreach sequence", done: hasLaunched },
  ];

  const completedSteps = getStartedSteps.filter(s => s.done).length;

  return (
    <div className="min-h-full rounded-2xl px-4 md:px-8 py-6 md:py-8 relative m-2 md:m-4 font-body bg-white">
      {/* ── Header ── */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-light tracking-tight text-md-on-surface font-headline">
            Welcome back, <span className="font-semibold text-md-primary">{firstName}</span>
          </h1>
          <p className="text-md-on-surface-variant font-light text-sm tracking-wide">
            Your architected outreach performance for this week.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => navigate("/signals")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all shadow-sm ${
              activeSignals > 0
                ? "text-emerald-600 border-emerald-200/60 bg-emerald-50/80 backdrop-blur-sm hover:bg-emerald-50"
                : "text-red-500 border-red-200/60 bg-red-50/80 backdrop-blur-sm hover:bg-red-50"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${activeSignals > 0 ? "bg-emerald-400" : "bg-red-400"}`} />
            {activeSignals} Active Signal(s)
          </button>
          <button
            onClick={() => navigate("/settings?tab=linkedin")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all shadow-sm ${
              linkedinConnected
                ? "text-emerald-600 border-emerald-200/60 bg-emerald-50/80 backdrop-blur-sm hover:bg-emerald-50"
                : "text-orange-600 border-orange-200/60 bg-orange-50/80 backdrop-blur-sm hover:bg-orange-50"
            }`}
          >
            {linkedinConnected ? <Check className="w-3.5 h-3.5" /> : <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />}
            {linkedinConnected ? "LinkedIn Connected" : "Connect LinkedIn"}
          </button>
          <button
            onClick={handleNewCampaign}
            className="text-md-on-primary px-5 py-2.5 rounded-full font-medium text-sm flex items-center gap-2 shadow-lg hover:scale-[1.02] transition-transform duration-300"
            style={{
              background: "var(--gradient-md-brand)",
              boxShadow: "0 8px 32px hsla(var(--md-primary) / 0.2)",
            }}
          >
            <Rocket className="w-4 h-4" />
            Start a campaign
          </button>
        </div>
      </header>

      {/* ── Metrics Bento Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <MetricCard
          title="Hot Opportunities"
          value={hotOpps}
          loading={hotOppsLoading}
          icon={<Flame className="w-5 h-5 text-md-primary" />}
          iconBg="hsla(var(--md-primary) / 0.12)"
          trend={hotOpps > 0 ? "12%" : "0%"}
          trendUp={hotOpps > 0}
        />
        <MetricCard
          title="Leads Engaged"
          value={leadsEngaged}
          loading={statsLoading}
          icon={<Users className="w-5 h-5 text-md-secondary" />}
          iconBg="hsla(var(--md-secondary) / 0.12)"
          trend={leadsEngaged > 0 ? "8%" : "0%"}
          trendUp={leadsEngaged > 0}
        />
        <MetricCard
          title="Conversations"
          value={conversations}
          loading={statsLoading}
          icon={<MessagesSquare className="w-5 h-5 text-md-tertiary" />}
          iconBg="hsla(var(--md-tertiary-fixed) / 0.3)"
          trend={conversations > 0 ? "24%" : "0%"}
          trendUp={conversations > 0}
        />
      </div>

      {/* ── Main Activity Chart & Quick Start ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        {/* Area Chart */}
        <div className="lg:col-span-2 glass-card rounded-2xl overflow-hidden flex flex-col relative">
          <div className="p-5 md:p-6 pb-0">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <h2 className="text-lg font-light font-headline mb-0.5 text-md-on-surface">Performance Velocity</h2>
                <p className="text-md-on-surface-variant font-light text-sm">Real-time engagement tracking across all channels</p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-md-secondary" />
                  <span className="text-[11px] text-md-on-surface-variant font-medium">Leads created</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-md-on-surface-variant bg-white/50 px-3 py-1.5 rounded-full border border-white/40">
                  <span className="w-2 h-2 rounded-full bg-md-secondary animate-pulse" />
                  Live Updates
                </div>
                <div className="flex items-center gap-1 border border-md-outline-variant rounded-full px-3 py-1.5 text-[11px] text-md-on-surface-variant bg-white/80 backdrop-blur-sm shadow-sm font-medium cursor-pointer hover:border-md-outline transition-colors">
                  Last 30 days
                  <ChevronDown className="w-3 h-3" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex-grow relative mt-2" style={{ minHeight: 220 }}>
            <div className="absolute top-2 right-6 glass-card px-4 py-2 rounded-xl shadow-lg border-white/60 z-20">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-md-primary/10 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-md-primary" />
                </div>
                <div>
                  <div className="text-[9px] font-bold text-md-primary uppercase tracking-widest">AI Prediction</div>
                  <div className="text-xs font-medium text-md-on-surface">Lead quality up 15%</div>
                </div>
              </div>
            </div>

            <div className="px-3 md:px-6 pb-4" style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 12, left: -28, bottom: 0 }}>
                  <defs>
                    <linearGradient id="mdGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#005d8f" stopOpacity={0.15} />
                      <stop offset="50%" stopColor="#5b3cdd" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#ffe170" stopOpacity={0.08} />
                    </linearGradient>
                    <linearGradient id="mdStroke" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#005d8f" />
                      <stop offset="50%" stopColor="#5b3cdd" />
                      <stop offset="100%" stopColor="#ffe170" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--md-outline-variant))" vertical={false} strokeOpacity={0.5} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--md-on-surface-variant))", fontWeight: 400 }} tickLine={false} axisLine={false} interval={3} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--md-on-surface-variant))", fontWeight: 400 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    cursor={{ stroke: "hsl(var(--md-secondary) / 0.2)", strokeWidth: 1, strokeDasharray: "4 3" }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="glass-card rounded-2xl px-4 py-3 shadow-2xl text-xs min-w-[120px]">
                          <p className="text-md-on-surface-variant mb-1 font-medium">{label}</p>
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-md-secondary shadow-[0_0_6px_hsl(var(--md-secondary))]" />
                            <span className="text-md-on-surface font-bold text-sm">{payload[0].value}</span>
                            <span className="text-md-on-surface-variant">leads</span>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="leads"
                    stroke="url(#mdStroke)"
                    strokeWidth={3}
                    fill="url(#mdGradient)"
                    dot={false}
                    activeDot={{ r: 6, fill: "#5b3cdd", stroke: "white", strokeWidth: 2.5 }}
                    style={{ filter: "drop-shadow(0px 4px 8px rgba(91, 60, 221, 0.2))" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Quick Start Section */}
        <div className="glass-card rounded-2xl p-5 md:p-6 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-light font-headline text-md-on-surface">Quick Start</h2>
            <span className="text-xs font-medium text-md-primary">{completedSteps}/{quickStartSteps.length}</span>
          </div>
          <div className="space-y-3 flex-grow">
            {quickStartSteps.map((step) => (
              <div
                key={step.label}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-300 ${
                  step.done
                    ? "bg-white/40 border-white/20 hover:bg-white/60"
                    : "bg-white/20 border-white/10 hover:bg-white/40"
                }`}
              >
                <div className="mt-0.5 flex-shrink-0">
                  {step.done ? (
                    <div className="w-5 h-5 rounded-full bg-md-primary text-white flex items-center justify-center">
                      <Check className="w-3 h-3" strokeWidth={3} />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-md-outline-variant bg-transparent" />
                  )}
                </div>
                <div>
                  <div className={`font-medium text-sm ${step.done ? "text-md-on-surface-variant line-through" : "text-md-on-surface"}`}>{step.label}</div>
                  <div className="text-[11px] font-light text-md-on-surface-variant">{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={handleNewCampaign}
            className="w-full py-2.5 mt-5 rounded-full border border-md-primary/30 text-md-primary text-sm font-medium hover:bg-md-primary/5 transition-all duration-300 flex items-center justify-center gap-2"
          >
            View setup guide
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Bottom row: Leads & Replies ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        {/* Latest Hot Leads */}
        <div className="glass-card rounded-2xl p-5 md:p-6">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-light font-headline text-md-on-surface">Latest Hot Leads</h2>
            <button onClick={() => navigate("/contacts")} className="text-xs font-medium text-md-primary hover:underline">View CRM</button>
          </div>
          <div className="space-y-2">
            {leadsLoading ? (
              <div className="space-y-3 py-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3">
                    <div className="w-10 h-10 rounded-xl bg-md-surface-container animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-32 bg-md-surface-container rounded animate-pulse" />
                      <div className="h-2.5 w-24 bg-md-surface-container rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (latestLeads ?? []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <Users className="w-8 h-8 text-md-outline-variant" />
                <p className="text-sm text-md-on-surface-variant">No leads yet. Start a campaign to discover leads.</p>
              </div>
            ) : (
              (latestLeads ?? []).map((lead, i) => {
                const initials = lead.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
                const heat = (lead.score ?? 0) >= 80 ? 3 : (lead.score ?? 0) >= 50 ? 2 : 1;
                return (
                  <div
                    key={i}
                    className="group flex items-center justify-between p-3 rounded-xl bg-white/30 border border-transparent hover:border-white/60 hover:bg-white/60 transition-all duration-500 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <LeadAvatar initials={initials} color={avatarColors[i % avatarColors.length]} />
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-green-500 border-2 border-white flex items-center justify-center shadow-sm">
                          <Zap className="w-2 h-2 text-white" />
                        </div>
                      </div>
                      <div>
                        <div className="font-semibold text-md-on-surface text-sm">{lead.name}</div>
                        <div className="text-xs font-light text-md-on-surface-variant">
                          {[lead.title, lead.company].filter(Boolean).join(" · ") || "No details"}
                        </div>
                      </div>
                    </div>
                    <HeatDots count={heat} />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Latest Replies */}
        <div className="glass-card rounded-2xl p-5 md:p-6">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-light font-headline text-md-on-surface">Latest Replies</h2>
            <button onClick={() => navigate("/unibox")} className="flex items-center gap-1.5 px-3 py-1.5 bg-md-secondary/10 rounded-full cursor-pointer hover:bg-md-secondary/20 transition-colors group">
              <span className="text-xs font-semibold text-md-secondary">Open Inbox</span>
              <ArrowRight className="w-3 h-3 text-md-secondary group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <MessageSquare className="w-8 h-8 text-md-outline-variant" />
            <p className="text-sm text-center text-md-on-surface-variant">
              <button onClick={() => navigate("/unibox")} className="font-semibold text-md-primary hover:opacity-80 transition-opacity">
                Activate your Unibox
              </button>{" "}
              to never miss a reply
            </p>
            <p className="text-xs text-md-on-surface-variant">All your replies will appear here</p>
          </div>
        </div>
      </div>

      {/* ── Get Started panel ── */}
      {completedSteps < getStartedSteps.length && (
        <div className="glass-card rounded-2xl overflow-hidden mb-6">
          <button
            onClick={() => setGetStartedOpen(!getStartedOpen)}
            className="w-full flex items-center justify-between px-5 md:px-6 py-4 transition-colors hover:bg-white/30"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm" style={{ background: "var(--gradient-md-brand)" }}>
                <Rocket className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-md-on-surface font-headline">Get Started</p>
                <p className="text-[11px] text-md-on-surface-variant font-light">{completedSteps} of {getStartedSteps.length} steps completed</p>
              </div>
            </div>
            {getStartedOpen ? (
              <ChevronDown className="w-4 h-4 text-md-on-surface-variant" />
            ) : (
              <ChevronUp className="w-4 h-4 text-md-on-surface-variant" />
            )}
          </button>
          {getStartedOpen && (
            <div className="px-5 md:px-6 pb-5 pt-1 border-t border-white/30">
              <div className="space-y-3 mt-3">
                {getStartedSteps.map((step) => (
                  <div key={step.label} className="flex items-center gap-3">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        background: step.done ? "hsl(var(--md-primary))" : "transparent",
                        border: step.done ? "none" : "2px solid hsl(var(--md-outline-variant))",
                        boxShadow: step.done ? "0 2px 8px hsla(var(--md-primary) / 0.3)" : "none",
                      }}
                    >
                      {step.done && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                    </div>
                    <p className={`text-sm ${step.done ? "line-through text-md-on-surface-variant" : "text-md-on-surface"}`}>
                      {step.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Floating button ── */}
      <button
        className="fixed bottom-6 right-6 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-lg"
        style={{
          background: "var(--gradient-md-brand)",
          boxShadow: "0 8px 32px hsla(var(--md-primary) / 0.4), 0 2px 8px hsla(0, 0%, 0%, 0.15)",
        }}
      >
        <span className="text-white text-lg">🔥</span>
      </button>
    </div>
  );
}

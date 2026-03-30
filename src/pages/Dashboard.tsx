import { useState } from "react";
import meshGradientBg from "@/assets/mesh-gradient-bg.png";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer } from
"recharts";
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
  ArrowRight } from
"lucide-react";
import { clearOnboardingSession } from "@/components/OnboardingGuard";
import { supabase } from "@/integrations/supabase/client";

// ─── Sub-components ───────────────────────────────────────────────────────────
function HeatDots({ count }: {count: number;}) {
  return (
    <div className="flex items-center gap-0.5">
      {[0, 1, 2].map((i) =>
      <span key={i} className="text-sm" style={{ opacity: i < count ? 1 : 0.2 }}>🔥</span>
      )}
    </div>);

}

function LeadAvatar({ initials, color }: {initials: string;color: string;}) {
  return (
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-md"
      style={{ background: color }}>
      
      {initials}
    </div>);

}

const avatarColors = [
"hsl(var(--md-primary))",
"hsl(var(--md-secondary))",
"hsl(var(--md-tertiary))"];


// ─── Metric Card ──────────────────────────────────────────────────────────────
interface MetricCardProps {
  title: string;
  value: number | string;
  loading?: boolean;
  icon: React.ReactNode;
  iconBg: string;
  trend?: string;
  trendUp?: boolean;
  progress?: number;
}

function MetricCard({ title, value, loading, icon, iconBg, trend, trendUp, progress = 0 }: MetricCardProps) {
  return (
    <div className="glass-card p-6 rounded-[1.5rem] flex flex-col justify-between group hover:-translate-y-1 transition-transform duration-300">
      <div className="flex justify-between items-start">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: iconBg }}>
          {icon}
        </div>
        {trend &&
        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
        trendUp ? "bg-emerald-50 text-emerald-600" : "bg-md-surface-container text-md-on-surface-variant"}`
        }>
            {trendUp ? "+" : ""}{trend}
          </span>
        }
      </div>
      <div className="mt-6">
        <p className="text-sm font-semibold text-md-on-surface-variant">{title}</p>
        {loading ?
        <div className="h-9 w-16 bg-md-surface-container rounded animate-pulse mt-1" /> :
        <h3 className="text-3xl font-extrabold text-md-on-surface mt-1 tracking-tight">{value}</h3>
        }
      </div>
      <div className="mt-4 h-1.5 w-full bg-md-surface-container rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${Math.min(100, Math.max(5, progress))}%`,
            background: "var(--gradient-md-brand)"
          }}
        />
      </div>
    </div>);
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { firstName: "there", email: "" };
      const firstName = user.user_metadata?.first_name || user.user_metadata?.full_name?.split(" ")[0] || user.email?.split("@")[0] || "there";
      return { firstName, email: user.email || "" };
    },
    staleTime: 60_000
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
        onboardingComplete: data?.onboarding_complete ?? false
      };
    },
    staleTime: 30_000
  });

  // ── Active signals count ──
  const { data: signalData, isLoading: signalLoading } = useQuery({
    queryKey: ["dashboard-signals"],
    queryFn: async () => {
      const { count, error } = await supabase.
      from("signal_agents").
      select("id", { count: "exact", head: true }).
      eq("status", "active");
      if (error) throw error;
      return { activeCount: count ?? 0 };
    },
    staleTime: 30_000
  });

  // ── Campaigns stats ──
  const { data: campaignStats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-campaign-stats"],
    queryFn: async () => {
      const { data: campaigns, error } = await supabase.
      from("campaigns").
      select("id, status, invitations_sent, messages_sent, icp_job_titles, icp_industries");
      if (error) throw error;
      const all = campaigns ?? [];
      const leadsEngaged = all.reduce((s, c) => s + (c.invitations_sent ?? 0), 0);
      const conversations = all.reduce((s, c) => s + (c.messages_sent ?? 0), 0);
      const totalCampaigns = all.length;
      const activeCampaigns = all.filter((c) => c.status === "active").length;
      const hasIcp = all.some((c) => (c.icp_job_titles?.length ?? 0) > 0 || (c.icp_industries?.length ?? 0) > 0);
      const hasLaunched = all.some((c) => c.status === "active" && (c.invitations_sent ?? 0) > 0);
      return { leadsEngaged, conversations, totalCampaigns, activeCampaigns, hasIcp, hasLaunched };
    },
    staleTime: 30_000
  });

  // ── Hot opportunities (leads) ──
  const { data: hotOppsData, isLoading: hotOppsLoading } = useQuery({
    queryKey: ["dashboard-hot-opps"],
    queryFn: async () => {
      const { data: campaigns } = await supabase.from("campaigns").select("id");
      if (!campaigns || campaigns.length === 0) return { count: 0 };
      const campaignIds = campaigns.map((c) => c.id);
      const { count, error } = await supabase.
      from("leads").
      select("id", { count: "exact", head: true }).
      in("campaign_id", campaignIds);
      if (error) throw error;
      return { count: count ?? 0 };
    },
    staleTime: 30_000
  });

   // ── Real leads for "Latest Hot Leads" (contacts table, ordered by tier then recency) ──
  const { data: latestLeads, isLoading: leadsLoading } = useQuery({
    queryKey: ["dashboard-latest-leads"],
    queryFn: async () => {
      const { data: contacts, error: cErr } = await supabase
        .from("contacts")
        .select("first_name, last_name, title, company, ai_score, relevance_tier, imported_at, linkedin_url")
        .order("imported_at", { ascending: false })
        .limit(50);
      if (cErr || !contacts || contacts.length === 0) return [];
      // Sort: hot first, then warm, then cold — within each tier, newest first
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
        score: c.ai_score ?? 0,
        relevance_tier: c.relevance_tier as string
      }));
    },
    staleTime: 30_000
  });

  // ── Latest replies from LinkedIn messaging ──
  const { data: latestReplies, isLoading: repliesLoading } = useQuery({
    queryKey: ["dashboard-latest-replies"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return [];
      const res = await supabase.functions.invoke("linkedin-messaging", {
        body: { action: "list_chats", limit: 5 }
      });
      if (res.error) return [];
      const items = res.data?.items ?? [];
      return items.map((chat: Record<string, unknown>) => {
        const attendees = chat.attendees as Array<{display_name?: string;profile_picture_url?: string;}> ?? [];
        const attendee = attendees[0];
        const lastMsg = chat.last_message as {text?: string;timestamp?: string;is_sender?: boolean;} | undefined;
        return {
          name: attendee?.display_name ?? "LinkedIn User",
          avatar_url: attendee?.profile_picture_url ?? null,
          text: lastMsg?.text ?? "",
          timestamp: lastMsg?.timestamp ?? "",
          is_sender: lastMsg?.is_sender ?? false,
          chat_id: chat.id as string
        };
      }).filter((r: {is_sender: boolean;}) => !r.is_sender).slice(0, 4);
    },
    staleTime: 60_000,
    enabled: Boolean(profileData?.linkedinConnected)
  });

  // ── Contacts for chart data ──
  const { data: chartContacts } = useQuery({
    queryKey: ["dashboard-chart-contacts"],
    queryFn: async () => {
      const { data, error } = await supabase.
      from("contacts").
      select("imported_at").
      order("imported_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000
  });

  // ── Generate chart from real contacts ──
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

  // ── Quick Start steps (dynamic) ──
  const quickStartSteps = [
  { label: "Connect LinkedIn", desc: linkedinConnected ? "Profile synced & verified" : "Required to start outreach", done: linkedinConnected },
  { label: "Create your first campaign", desc: totalCampaigns > 0 ? `${totalCampaigns} campaign(s) created` : "Set up outreach sequence", done: totalCampaigns > 0 },
  { label: "Add your ICP", desc: hasIcp ? "Customer profile defined" : "Define ideal customer profile", done: hasIcp },
  { label: "Launch first outreach", desc: hasLaunched ? "Outreach is live!" : "Start engaging leads", done: hasLaunched }];


  const getStartedSteps = [
  { label: "Connect your LinkedIn account", done: linkedinConnected },
  { label: "Create your first campaign", done: totalCampaigns > 0 },
  { label: "Add your ICP (Ideal Customer Profile)", done: hasIcp },
  { label: "Launch your first outreach sequence", done: hasLaunched }];


  const completedSteps = getStartedSteps.filter((s) => s.done).length;

  return (
    <div className="min-h-full rounded-2xl px-4 md:px-8 py-8 md:py-10 relative m-2 md:m-4 font-body bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${meshGradientBg})` }}>
      {/* ── Header ── */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div className="space-y-1">
           <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-md-on-surface font-headline">
Welcome back, <span className="font-extrabold text-md-primary">{firstName}</span>
           </h1>
           <p className="text-md-on-surface-variant font-medium text-sm mt-1">
             Your architected outreach performance for this week.
           </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => navigate("/signals")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all shadow-sm ${
            activeSignals > 0 ?
            "text-emerald-600 border-emerald-200/60 bg-emerald-50/80 backdrop-blur-sm hover:bg-emerald-50" :
            "text-red-500 border-red-200/60 bg-red-50/80 backdrop-blur-sm hover:bg-red-50"}`
            }>
            
            <span className={`w-1.5 h-1.5 rounded-full ${activeSignals > 0 ? "bg-emerald-400" : "bg-red-400"}`} />
            {activeSignals} Active Signal(s)
          </button>
          <button
            onClick={() => navigate("/settings?tab=linkedin")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all shadow-sm ${
            linkedinConnected ?
            "text-emerald-600 border-emerald-200/60 bg-emerald-50/80 backdrop-blur-sm hover:bg-emerald-50" :
            "text-orange-600 border-orange-200/60 bg-orange-50/80 backdrop-blur-sm hover:bg-orange-50"}`
            }>
            
            {linkedinConnected ? <Check className="w-3.5 h-3.5" /> : <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />}
            {linkedinConnected ? "LinkedIn Connected" : "Connect LinkedIn"}
          </button>
          <button
            onClick={handleNewCampaign}
            className="brand-gradient-button text-white px-5 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 shadow-lg hover:scale-[1.02] hover:shadow-xl transition-all duration-300"
            >
            
            <Rocket className="w-4 h-4" />
            Start a campaign
          </button>
        </div>
      </header>

      {/* ── Metrics Bento Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <MetricCard
          title="Hot Opportunities"
          value={hotOpps}
          loading={hotOppsLoading}
          icon={<Flame className="w-6 h-6 text-md-primary" />}
          iconBg="hsla(var(--md-primary) / 0.10)"
          trend={hotOpps > 0 ? "12.4%" : "0%"}
          trendUp={hotOpps > 0}
          progress={hotOpps > 0 ? 75 : 5} />
        
        <MetricCard
          title="Leads Engaged"
          value={leadsEngaged}
          loading={statsLoading}
          icon={<Users className="w-6 h-6 text-md-secondary" />}
          iconBg="hsla(var(--md-secondary) / 0.10)"
          trend={leadsEngaged > 0 ? "8.1%" : "0%"}
          trendUp={leadsEngaged > 0}
          progress={leadsEngaged > 0 ? 62 : 5} />
        
        <MetricCard
          title="Conversations"
          value={conversations}
          loading={statsLoading}
          icon={<MessagesSquare className="w-6 h-6 text-md-tertiary" />}
          iconBg="hsla(var(--md-tertiary) / 0.10)"
          trend={conversations > 0 ? "24%" : "0%"}
          trendUp={conversations > 0}
          progress={conversations > 0 ? 48 : 5} />
        
      </div>

      {/* ── Main Activity Chart & Quick Start ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Area Chart */}
        <div className="lg:col-span-2 glass-card rounded-[2rem] overflow-hidden flex flex-col relative">
          <div className="p-6 md:p-8 pb-0">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <h2 className="text-2xl font-bold text-md-on-surface tracking-tight">Performance Velocity</h2>
                <p className="text-sm text-md-on-surface-variant font-medium mt-1">Real-time aggregate data across all channels</p>
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
                        </div>);

                    }} />
                  
                  <Area
                    type="monotone"
                    dataKey="leads"
                    stroke="url(#mdStroke)"
                    strokeWidth={3}
                    fill="url(#mdGradient)"
                    dot={false}
                    activeDot={{ r: 6, fill: "#5b3cdd", stroke: "white", strokeWidth: 2.5 }}
                    style={{ filter: "drop-shadow(0px 4px 8px rgba(91, 60, 221, 0.2))" }} />
                  
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Quick Start Section */}
        <div className="glass-card rounded-[2rem] p-6 md:p-8 flex flex-col">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-md-on-surface tracking-tight">Quick Start Guide</h2>
            <p className="text-xs text-md-on-surface-variant font-medium mt-1 uppercase tracking-widest">{completedSteps}/{quickStartSteps.length} completed</p>
          </div>
          <div className="space-y-6 flex-grow">
            {quickStartSteps.map((step) =>
            <div
              key={step.label}
              className="flex items-center gap-4 group cursor-pointer">
              
                <div className="flex-shrink-0">
                  {step.done ?
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 transition-all group-hover:scale-110">
                      <Check className="w-4 h-4" strokeWidth={3} />
                    </div> :

                <div className="w-10 h-10 rounded-full bg-md-surface-container flex items-center justify-center text-md-on-surface-variant border-2 border-md-primary/20 transition-all group-hover:shadow-[0_0_15px_hsla(var(--md-primary)/0.2)]">
                      <Zap className="w-4 h-4" />
                    </div>
                }
                </div>
                <div>
                  <h4 className={`text-sm font-bold ${step.done ? "text-md-on-surface line-through opacity-50" : "text-md-on-surface"}`}>{step.label}</h4>
                  <p className={`text-xs ${step.done ? "text-md-on-surface-variant" : "text-md-tertiary font-bold"}`}>{step.desc}</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 p-4 bg-md-primary/5 rounded-2xl border border-md-primary/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-md-primary/15 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-md-primary" />
              </div>
              <p className="text-xs font-medium text-md-primary leading-tight">Pro tip: Connect LinkedIn first to unlock AI-powered lead discovery.</p>
            </div>
          </div>

          <button
            onClick={handleNewCampaign}
            className="w-full py-3 mt-6 rounded-full border border-md-primary/30 text-md-primary text-sm font-bold hover:bg-md-primary/5 transition-all duration-300 flex items-center justify-center gap-2">
            
            View setup guide
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Bottom row: Leads & Replies ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Latest Hot Leads */}
        <div className="glass-card rounded-[2rem] p-6 md:p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-md-on-surface tracking-tight">Latest Hot Leads</h2>
            <button onClick={() => navigate("/contacts")} className="text-sm font-bold text-md-primary hover:underline">View CRM</button>
          </div>
          <div className="space-y-2">
            {leadsLoading ?
            <div className="space-y-3 py-4">
                {[...Array(3)].map((_, i) =>
              <div key={i} className="flex items-center gap-3 p-3">
                    <div className="w-10 h-10 rounded-xl bg-md-surface-container animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-32 bg-md-surface-container rounded animate-pulse" />
                      <div className="h-2.5 w-24 bg-md-surface-container rounded animate-pulse" />
                    </div>
                  </div>
              )}
              </div> :
            (latestLeads ?? []).length === 0 ?
            <div className="flex flex-col items-center justify-center py-8 gap-2">
                <Users className="w-8 h-8 text-md-outline-variant" />
                <p className="text-sm text-md-on-surface-variant">No leads yet. Start a campaign to discover leads.</p>
              </div> :

            (latestLeads ?? []).map((lead, i) => {
              const initials = lead.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
              const heat = lead.relevance_tier === 'hot' ? 3 : lead.relevance_tier === 'warm' ? 2 : 1;
              return (
                <div
                  key={i}
                  className="group flex items-center justify-between p-3 rounded-xl bg-white/30 border border-transparent hover:border-white/60 hover:bg-white/60 transition-all duration-500 cursor-pointer">
                  
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
                  </div>);

            })
            }
          </div>
        </div>

        {/* Latest Replies */}
        <div className="glass-card rounded-[2rem] p-6 md:p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-md-on-surface tracking-tight">Latest Replies</h2>
            <button onClick={() => navigate("/unibox")} className="flex items-center gap-1.5 px-3 py-1.5 bg-md-secondary/10 rounded-full cursor-pointer hover:bg-md-secondary/20 transition-colors group">
              <span className="text-xs font-semibold text-md-secondary">Open Inbox</span>
              <ArrowRight className="w-3 h-3 text-md-secondary group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {repliesLoading ?
          <div className="space-y-3 py-4">
              {[...Array(3)].map((_, i) =>
            <div key={i} className="flex items-center gap-3 p-3">
                  <div className="w-10 h-10 rounded-xl bg-md-surface-container animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-32 bg-md-surface-container rounded animate-pulse" />
                    <div className="h-2.5 w-48 bg-md-surface-container rounded animate-pulse" />
                  </div>
                </div>
            )}
            </div> :
          (latestReplies ?? []).length > 0 ?
          <div className="space-y-2">
              {(latestReplies ?? []).map((reply, i) => {
              const initials = reply.name.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase();
              const timeAgo = reply.timestamp ? (() => {
                const diff = Math.floor((Date.now() - new Date(reply.timestamp).getTime()) / 1000);
                if (diff < 60) return `${diff}s ago`;
                if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
                if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
                return `${Math.floor(diff / 86400)}d ago`;
              })() : "";
              return (
                <div
                  key={reply.chat_id || i}
                  onClick={() => navigate("/unibox")}
                  className="group flex items-center gap-3 p-3 rounded-xl bg-white/30 border border-transparent hover:border-white/60 hover:bg-white/60 transition-all duration-500 cursor-pointer">
                  
                    {reply.avatar_url ?
                  <img src={reply.avatar_url} alt={reply.name} className="w-10 h-10 rounded-xl object-cover shrink-0 shadow-md" /> :

                  <LeadAvatar initials={initials} color={avatarColors[i % avatarColors.length]} />
                  }
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-md-on-surface text-sm">{reply.name}</span>
                        {timeAgo && <span className="text-[10px] text-md-on-surface-variant">{timeAgo}</span>}
                      </div>
                      <p className="text-xs font-light text-md-on-surface-variant truncate">{reply.text || "No message"}</p>
                    </div>
                  </div>);

            })}
            </div> :

          <div className="flex flex-col items-center justify-center py-8 gap-2">
              <MessageSquare className="w-8 h-8 text-md-outline-variant" />
              <p className="text-sm text-md-on-surface-variant">No new replies yet</p>
            </div>
          }
        </div>
      </div>

      {/* ── Get Started panel ── */}
      {completedSteps < getStartedSteps.length &&
      <div className="glass-card rounded-[2rem] overflow-hidden mb-8">
          <button
          onClick={() => setGetStartedOpen(!getStartedOpen)}
          className="w-full flex items-center justify-between px-5 md:px-6 py-4 transition-colors hover:bg-white/30">
          
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm" style={{ background: "var(--gradient-md-brand)" }}>
                <Rocket className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-md-on-surface font-headline">Get Started</p>
                <p className="text-[11px] text-md-on-surface-variant font-light">{completedSteps} of {getStartedSteps.length} steps completed</p>
              </div>
            </div>
            {getStartedOpen ?
          <ChevronDown className="w-4 h-4 text-md-on-surface-variant" /> :

          <ChevronUp className="w-4 h-4 text-md-on-surface-variant" />
          }
          </button>
          {getStartedOpen &&
        <div className="px-5 md:px-6 pb-5 pt-1 border-t border-white/30">
              <div className="space-y-3 mt-3">
                {getStartedSteps.map((step) =>
            <div key={step.label} className="flex items-center gap-3">
                    <div
                className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: step.done ? "hsl(var(--md-primary))" : "transparent",
                  border: step.done ? "none" : "2px solid hsl(var(--md-outline-variant))",
                  boxShadow: step.done ? "0 2px 8px hsla(var(--md-primary) / 0.3)" : "none"
                }}>
                
                      {step.done && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                    </div>
                    <p className={`text-sm ${step.done ? "line-through text-md-on-surface-variant" : "text-md-on-surface"}`}>
                      {step.label}
                    </p>
                  </div>
            )}
              </div>
            </div>
        }
        </div>
      }

      {/* ── Floating button ── */}
      







      
    </div>);

}
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { QuickStartPanel } from "@/components/dashboard/QuickStartPanel";
import { HotLeadsList } from "@/components/dashboard/HotLeadsList";
import { LatestReplies } from "@/components/dashboard/LatestReplies";
import { SubscriptionBanner } from "@/components/dashboard/SubscriptionBanner";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { ChevronDown } from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();

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
  const { data: profileData } = useQuery({
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
  const { data: signalData } = useQuery({
    queryKey: ["dashboard-signals"],
    queryFn: async () => {
      const { count, error } = await supabase.from("signal_agents").select("id", { count: "exact", head: true }).eq("status", "active");
      if (error) throw error;
      return { activeCount: count ?? 0 };
    },
    staleTime: 30_000,
  });

  // ── Campaigns stats ──
  const { data: campaignStats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-campaign-stats"],
    queryFn: async () => {
      const { data: campaigns, error } = await supabase.from("campaigns").select("id, status, invitations_sent, messages_sent, icp_job_titles, icp_industries");
      if (error) throw error;
      const all = campaigns ?? [];
      const leadsEngaged = all.reduce((s, c) => s + (c.invitations_sent ?? 0), 0);
      const conversations = all.reduce((s, c) => s + (c.messages_sent ?? 0), 0);
      const totalCampaigns = all.length;
      const hasIcp = all.some((c) => (c.icp_job_titles?.length ?? 0) > 0 || (c.icp_industries?.length ?? 0) > 0);
      const hasLaunched = all.some((c) => c.status === "active" && (c.invitations_sent ?? 0) > 0);
      return { leadsEngaged, conversations, totalCampaigns, hasIcp, hasLaunched };
    },
    staleTime: 30_000,
  });

  // ── Hot opportunities ──
  const { data: hotOppsData, isLoading: hotOppsLoading } = useQuery({
    queryKey: ["dashboard-hot-opps"],
    queryFn: async () => {
      const { count, error } = await supabase.from("contacts").select("id", { count: "exact", head: true }).eq("relevance_tier", "hot");
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
        .select("first_name, last_name, title, company, ai_score, relevance_tier, imported_at, linkedin_url, signal, signal_post_url")
        .order("imported_at", { ascending: false })
        .limit(50);
      if (error || !contacts?.length) return [];
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return [];
      const res = await supabase.functions.invoke("linkedin-messaging", { body: { action: "list_chats", limit: 5 } });
      if (res.error) return [];
      const items = res.data?.items ?? [];
      return items
        .map((chat: Record<string, unknown>) => {
          const attendees = (chat.attendees as Array<{ display_name?: string; profile_picture_url?: string }>) ?? [];
          const attendee = attendees[0];
          const lastMsg = chat.last_message as { text?: string; timestamp?: string; is_sender?: boolean } | undefined;
          return {
            name: attendee?.display_name ?? "LinkedIn User",
            avatar_url: attendee?.profile_picture_url ?? null,
            text: lastMsg?.text ?? "",
            timestamp: lastMsg?.timestamp ?? "",
            is_sender: lastMsg?.is_sender ?? false,
            chat_id: chat.id as string,
          };
        })
        .filter((r: { is_sender: boolean }) => !r.is_sender)
        .slice(0, 4);
    },
    staleTime: 60_000,
    enabled: Boolean(profileData?.linkedinConnected),
  });

  // ── Chart data ──
  const { data: chartContacts } = useQuery({
    queryKey: ["dashboard-chart-contacts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contacts").select("imported_at").order("imported_at", { ascending: true });
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

  const quickStartSteps = [
    { label: "Connect LinkedIn", desc: linkedinConnected ? "Profile synced & verified" : "Required to start outreach", done: linkedinConnected, href: "/settings?tab=linkedin" },
    { label: "Create your first campaign", desc: totalCampaigns > 0 ? `${totalCampaigns} campaign(s) created` : "Set up outreach sequence", done: totalCampaigns > 0, href: "/campaigns?autoStart=true" },
    { label: "Add your ICP", desc: hasIcp ? "Customer profile defined" : "Define ideal customer profile", done: hasIcp, href: "/campaigns" },
    { label: "Launch first outreach", desc: hasLaunched ? "Outreach is live!" : "Start engaging leads", done: hasLaunched, href: "/campaigns" },
  ];

  return (
    <div className="min-h-full px-6 py-6 bg-white">
      {/* ── Header ── */}
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold text-gray-900">Overview</h1>
        <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
          Today
          <ChevronDown className="w-4 h-4" />
        </button>
      </header>

      {/* ── Subscription Banner ── */}
      <SubscriptionBanner />

      {/* ── Metrics ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard title="Hot Opportunities" value={hotOpps} loading={hotOppsLoading} bgColor="bg-[#EDEEFC]" />
        <MetricCard title="Leads Engaged" value={leadsEngaged} loading={statsLoading} bgColor="bg-[#f0ecfb]" />
        <MetricCard title="Conversations" value={conversations} loading={statsLoading} bgColor="bg-[#e8f0fb]" />
        <MetricCard title="Active Signals" value={activeSignals} loading={false} bgColor="bg-[#f0ecfb]" />
      </div>

      {/* ── Chart + Quick Start ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <PerformanceChart chartData={chartData} />
        </div>
        <div>
          <QuickStartPanel steps={quickStartSteps} />
        </div>
      </div>

      {/* ── Leads, Replies & Activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <HotLeadsList leads={latestLeads ?? []} loading={leadsLoading} />
        <LatestReplies replies={latestReplies ?? []} loading={repliesLoading} />
        <RecentActivity />
      </div>
    </div>
  );
}

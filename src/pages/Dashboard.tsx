import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { QuickStartPanel } from "@/components/dashboard/QuickStartPanel";
import { HotLeadsList } from "@/components/dashboard/HotLeadsList";
import { LatestReplies } from "@/components/dashboard/LatestReplies";
import { SubscriptionBanner } from "@/components/dashboard/SubscriptionBanner";
import DailyActivityChart from "@/components/dashboard/DailyActivityChart";
import LeadsByTier from "@/components/dashboard/LeadsByTier";
import { ChevronDown } from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();

  const { data: userData } = useQuery({
    queryKey: ["dashboard-user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
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

  const { data: profileData } = useQuery({
    queryKey: ["dashboard-profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
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

  // Real metrics from campaign_connection_requests
  const { data: engagementData, isLoading: engagementLoading } = useQuery({
    queryKey: ["dashboard-engagement"],
    queryFn: async () => {
      const { data: requests, error } = await supabase
        .from("campaign_connection_requests")
        .select("id, sent_at, last_incoming_message_at");
      if (error) throw error;
      const all = requests ?? [];
      const leadsEngaged = all.length;
      const conversations = all.filter((r) => r.last_incoming_message_at !== null).length;
      return { leadsEngaged, conversations };
    },
    staleTime: 30_000,
  });

  const { data: campaignMeta } = useQuery({
    queryKey: ["dashboard-campaign-meta"],
    queryFn: async () => {
      const { data: campaigns, error } = await supabase
        .from("campaigns")
        .select("id, status, icp_job_titles, icp_industries, invitations_sent, company_name");
      if (error) throw error;
      const all = campaigns ?? [];
      const totalCampaigns = all.length;
      const hasIcp = all.some(
        (c) => (c.icp_job_titles?.length ?? 0) > 0 || (c.icp_industries?.length ?? 0) > 0
      );
      const hasLaunched = all.some((c) => c.status === "active" && (c.invitations_sent ?? 0) > 0);
      return { totalCampaigns, hasIcp, hasLaunched, campaigns: all };
    },
    staleTime: 30_000,
  });

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

  const { data: latestReplies, isLoading: repliesLoading } = useQuery({
    queryKey: ["dashboard-latest-replies"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return [];
      const res = await supabase.functions.invoke("linkedin-messaging", {
        body: { action: "list_chats", limit: 5 },
      });
      if (res.error) return [];
      const items = res.data?.items ?? [];
      return items
        .map((chat: Record<string, unknown>) => {
          const attendees =
            (chat.attendees as Array<{ display_name?: string; profile_picture_url?: string }>) ?? [];
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
        })
        .filter((r: { is_sender: boolean }) => !r.is_sender)
        .slice(0, 4);
    },
    staleTime: 60_000,
    enabled: Boolean(profileData?.linkedinConnected),
  });

  // Chart data: leads found per day + contacted per day
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

  const { data: chartRequests } = useQuery({
    queryKey: ["dashboard-chart-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaign_connection_requests")
        .select("sent_at")
        .order("sent_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });

  const chartData = (() => {
    const result: { date: string; leadsFound: number; contacted: number }[] = [];
    const now = new Date();
    const leadCounts: Record<string, number> = {};
    const contactedCounts: Record<string, number> = {};

    (chartContacts ?? []).forEach((c) => {
      const key = new Date(c.imported_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      leadCounts[key] = (leadCounts[key] || 0) + 1;
    });
    (chartRequests ?? []).forEach((r) => {
      const key = new Date(r.sent_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      contactedCounts[key] = (contactedCounts[key] || 0) + 1;
    });

    for (let i = 30; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      result.push({
        date: label,
        leadsFound: leadCounts[label] || 0,
        contacted: contactedCounts[label] || 0,
      });
    }
    return result;
  })();

  // Leads by tier data
  const { data: tierData, isLoading: tierLoading } = useQuery({
    queryKey: ["dashboard-leads-by-tier"],
    queryFn: async () => {
      const { data: contacts, error } = await supabase
        .from("contacts")
        .select("relevance_tier");
      if (error) throw error;
      const counts: Record<string, number> = { hot: 0, warm: 0, cold: 0 };
      (contacts ?? []).forEach((c) => {
        const tier = c.relevance_tier || "warm";
        counts[tier] = (counts[tier] || 0) + 1;
      });
      return [
        { name: "Hot", value: counts.hot, color: "#333333" },
        { name: "Warm", value: counts.warm, color: "#3B82F6" },
        { name: "Cold", value: counts.cold, color: "#34D399" },
      ];
    },
    staleTime: 30_000,
  });

  // Daily activity: contacts added, responses, meetings booked
  const { data: dailyActivityData, isLoading: dailyActivityLoading } = useQuery({
    queryKey: ["dashboard-daily-activity"],
    queryFn: async () => {
      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const isoStart = thirtyDaysAgo.toISOString();

      const [contactsRes, responsesRes, meetingsRes] = await Promise.all([
        supabase
          .from("contacts")
          .select("imported_at")
          .gte("imported_at", isoStart),
        supabase
          .from("campaign_connection_requests")
          .select("last_incoming_message_at")
          .not("last_incoming_message_at", "is", null)
          .gte("last_incoming_message_at", isoStart),
        supabase
          .from("meetings")
          .select("created_at")
          .gte("created_at", isoStart),
      ]);

      const contactCounts: Record<string, number> = {};
      const responseCounts: Record<string, number> = {};
      const meetingCounts: Record<string, number> = {};

      const toKey = (d: string) =>
        new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });

      (contactsRes.data ?? []).forEach((c) => {
        const k = toKey(c.imported_at);
        contactCounts[k] = (contactCounts[k] || 0) + 1;
      });
      (responsesRes.data ?? []).forEach((r) => {
        const k = toKey(r.last_incoming_message_at!);
        responseCounts[k] = (responseCounts[k] || 0) + 1;
      });
      (meetingsRes.data ?? []).forEach((m) => {
        const k = toKey(m.created_at);
        meetingCounts[k] = (meetingCounts[k] || 0) + 1;
      });

      const result = [];
      for (let i = 30; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        result.push({
          date: label,
          contacts: contactCounts[label] || 0,
          responses: responseCounts[label] || 0,
          meetings: meetingCounts[label] || 0,
        });
      }
      return result;
    },
    staleTime: 30_000,
  });

  const hotOpps = hotOppsData?.count ?? 0;
  const leadsEngaged = engagementData?.leadsEngaged ?? 0;
  const conversations = engagementData?.conversations ?? 0;
  const activeSignals = signalData?.activeCount ?? 0;
  const linkedinConnected = profileData?.linkedinConnected ?? false;
  const totalCampaigns = campaignMeta?.totalCampaigns ?? 0;
  const hasIcp = campaignMeta?.hasIcp ?? false;
  const hasLaunched = campaignMeta?.hasLaunched ?? false;
  const firstName = userData?.firstName ?? "there";

  const quickStartSteps = [
    {
      label: "Connect LinkedIn",
      desc: linkedinConnected ? "Profile synced & verified" : "Required to start outreach",
      done: linkedinConnected,
      href: "/settings?tab=linkedin",
    },
    {
      label: "Create your first campaign",
      desc: totalCampaigns > 0 ? `${totalCampaigns} campaign(s) created` : "Set up outreach sequence",
      done: totalCampaigns > 0,
      href: "/campaigns?autoStart=true",
    },
    {
      label: "Add your ICP",
      desc: hasIcp ? "Customer profile defined" : "Define ideal customer profile",
      done: hasIcp,
      href: "/campaigns",
    },
    {
      label: "Launch first outreach",
      desc: hasLaunched ? "Outreach is live!" : "Start engaging leads",
      done: hasLaunched,
      href: "/campaigns",
    },
  ];

  return (
    <div className="flex gap-8 w-full max-w-[1400px] mx-auto px-6 py-8">
      <div className="flex-1 min-w-0 flex flex-col gap-6 bg-white rounded-[20px] p-6 border border-gray-200/60 shadow-sm">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Overview</h1>
          </div>
          <button className="flex items-center gap-1.5 text-sm text-gray-500 bg-white border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">
            Today
            <ChevronDown className="w-4 h-4" />
          </button>
        </header>

        <SubscriptionBanner />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard title="Hot Opportunities" value={hotOpps} loading={hotOppsLoading} bgColor="bg-[#EDEEFC]" />
          <MetricCard title="Leads Engaged" value={leadsEngaged} loading={engagementLoading} />
          <MetricCard title="Conversations" value={conversations} loading={engagementLoading} />
          <MetricCard title="Active Signals" value={activeSignals} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2">
            <PerformanceChart chartData={chartData} />
          </div>
          <QuickStartPanel steps={quickStartSteps} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <DailyActivityChart data={dailyActivityData ?? []} loading={dailyActivityLoading} />
          <LeadsByTier data={tierData ?? []} loading={tierLoading} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <HotLeadsList leads={latestLeads ?? []} loading={leadsLoading} />
          <LatestReplies replies={latestReplies ?? []} loading={repliesLoading} />
        </div>
      </div>
    </div>
  );
}

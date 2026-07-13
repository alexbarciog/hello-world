import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { RecentLeadsTable } from "@/components/dashboard/RecentLeadsTable";
import { SubscriptionBanner } from "@/components/dashboard/SubscriptionBanner";
import { SetupWizardBanner } from "@/components/dashboard/SetupWizardBanner";
import { AgencyWelcomeBanner } from "@/components/dashboard/AgencyWelcomeBanner";
import LeadsByTier from "@/components/dashboard/LeadsByTier";
import { ChevronDown, Flame, Users, MessageCircle, Radio, Plus, Check } from "lucide-react";
import { motion } from "framer-motion";
import { Reveal, fadeStagger, fadeStaggerItem, CountUp } from "@/lib/motion";
import { useState, useRef, useEffect, useMemo } from "react";

export default function Dashboard() {
  const navigate = useNavigate();

  type Period = "week" | "month" | "quarter" | "year";
  const [period, setPeriod] = useState<Period>("month");
  const [periodOpen, setPeriodOpen] = useState(false);
  const periodRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (periodRef.current && !periodRef.current.contains(e.target as Node)) {
        setPeriodOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const periodLabel: Record<Period, string> = {
    week: "Last 7 days",
    month: "This month",
    quarter: "This quarter",
    year: "This year",
  };

  const periodDays: Record<Period, number> = {
    week: 7,
    month: 30,
    quarter: 90,
    year: 365,
  };

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

  const periodStartISO = (() => {
    const d = new Date();
    d.setDate(d.getDate() - periodDays[period]);
    return d.toISOString();
  })();

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

  // Real metrics from campaign_connection_requests — scoped to selected period
  const { data: engagementData, isLoading: engagementLoading } = useQuery({
    queryKey: ["dashboard-engagement", period],
    queryFn: async () => {
      const { data: requests, error } = await supabase
        .from("campaign_connection_requests")
        .select("id, sent_at, last_incoming_message_at")
        .gte("sent_at", periodStartISO);
      if (error) throw error;
      const all = requests ?? [];
      const leadsEngaged = all.length;
      const conversations = all.filter(
        (r) => r.last_incoming_message_at !== null && new Date(r.last_incoming_message_at) >= new Date(periodStartISO)
      ).length;
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
    queryKey: ["dashboard-hot-opps", period],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("contacts")
        .select("id", { count: "exact", head: true })
        .eq("relevance_tier", "hot")
        .gte("imported_at", periodStartISO);
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
        body: { action: "list_chats", limit: 10, enrich: true },
      });
      if (res.error) return [];
      const items = res.data?.items ?? [];
      return items
        .map((chat: Record<string, unknown>) => {
          const attendees = Array.isArray(chat.attendees)
            ? (chat.attendees as Array<{
                display_name?: string;
                name?: string;
                profile_picture_url?: string;
                avatar_url?: string;
                picture_url?: string;
              }>)
            : [];
          const attendee = attendees[0];
          const lastMessage = chat.last_message as
            | { text?: string; body?: string; content?: string }
            | undefined;
          const fallbackName =
            attendee?.display_name ||
            attendee?.name ||
            (typeof chat.name === "string" ? chat.name : "") ||
            "LinkedIn User";
          const text =
            (chat._resolved_msg_text as string) ||
            lastMessage?.text ||
            lastMessage?.body ||
            lastMessage?.content ||
            "";

          return {
            name: (chat._resolved_name as string) || fallbackName,
            avatar_url:
              (chat._resolved_avatar as string) ||
              attendee?.profile_picture_url ||
              attendee?.avatar_url ||
              attendee?.picture_url ||
              null,
            text,
            timestamp:
              (chat._resolved_msg_timestamp as string) ||
              (typeof chat.timestamp === "string" ? chat.timestamp : "") ||
              "",
            is_sender: Boolean(chat._resolved_msg_is_sender),
            chat_id: chat.id as string,
            is_unread: Boolean(chat._is_unread),
          };
        })
        .filter((reply: { text: string; is_sender: boolean }) => Boolean(reply.text) && !reply.is_sender)
        .sort(
          (a: { timestamp: string }, b: { timestamp: string }) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        .slice(0, 4);
    },
    staleTime: 60_000,
    enabled: Boolean(profileData?.linkedinConnected),
  });

  // Chart data: leads found per day + contacted per day.
  // IMPORTANT: memoize the cutoff so it isn't a new value every render — otherwise
  // the useQuery key rotates on each render and `data` is perpetually undefined,
  // which is what caused the chart to render as "No leads yet" even with data present.
  const chartCutoffISO = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - periodDays[period]);
    // Round to the hour so minor render-to-render skew doesn't invalidate the key.
    d.setMinutes(0, 0, 0);
    return d.toISOString();
  }, [period]);

  const { data: chartContacts } = useQuery({
    queryKey: ["dashboard-chart-contacts", chartCutoffISO],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select("imported_at")
        .gte("imported_at", chartCutoffISO)
        .order("imported_at", { ascending: true })
        .limit(50000);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });

  const { data: chartRequests } = useQuery({
    queryKey: ["dashboard-chart-requests", chartCutoffISO],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaign_connection_requests")
        .select("sent_at")
        .gte("sent_at", chartCutoffISO)
        .order("sent_at", { ascending: true })
        .limit(50000);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });


  const chartData = (() => {
    const result: { date: string; leadsFound: number; contacted: number }[] = [];
    const now = new Date();
    const days = periodDays[period];
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - days);
    const leadCounts: Record<string, number> = {};
    const contactedCounts: Record<string, number> = {};

    (chartContacts ?? []).forEach((c) => {
      const d = new Date(c.imported_at);
      if (d < cutoff) return;
      const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      leadCounts[key] = (leadCounts[key] || 0) + 1;
    });
    (chartRequests ?? []).forEach((r) => {
      const d = new Date(r.sent_at);
      if (d < cutoff) return;
      const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      contactedCounts[key] = (contactedCounts[key] || 0) + 1;
    });

    for (let i = days; i >= 0; i--) {
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

  // Leads by tier data — use head counts per tier to avoid the 1000-row default cap
  const { data: tierData, isLoading: tierLoading } = useQuery({
    queryKey: ["dashboard-leads-by-tier"],
    queryFn: async () => {
      const [hotRes, warmRes, coldRes] = await Promise.all([
        supabase.from("contacts").select("id", { count: "exact", head: true }).eq("relevance_tier", "hot"),
        supabase.from("contacts").select("id", { count: "exact", head: true }).eq("relevance_tier", "warm"),
        supabase.from("contacts").select("id", { count: "exact", head: true }).eq("relevance_tier", "cold"),
      ]);
      return [
        { name: "Hot", value: hotRes.count ?? 0, color: "#333333" },
        { name: "Warm", value: warmRes.count ?? 0, color: "#3B82F6" },
        { name: "Cold", value: coldRes.count ?? 0, color: "#34D399" },
      ];
    },
    staleTime: 30_000,
  });

  // Daily activity: past 7 days
  const { data: weeklyActivityData, isLoading: weeklyActivityLoading } = useQuery({
    queryKey: ["dashboard-daily-activity-7d"],
    queryFn: async () => {
      const now = new Date();
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const isoStart = sevenDaysAgo.toISOString();

      const [contactsRes, responsesRes, meetingsRes] = await Promise.all([
        supabase.from("contacts").select("imported_at").gte("imported_at", isoStart),
        supabase.from("campaign_connection_requests").select("last_incoming_message_at").not("last_incoming_message_at", "is", null).gte("last_incoming_message_at", isoStart),
        supabase.from("meetings").select("created_at").gte("created_at", isoStart),
      ]);

      const toKey = (d: string) =>
        new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

      const contactCounts: Record<string, number> = {};
      const responseCounts: Record<string, number> = {};
      const meetingCounts: Record<string, number> = {};

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
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const label = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
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
  void profileData;
  void campaignMeta;
  void navigate;
  void userData;

  return (
    <div className="relative w-full min-h-screen bg-transparent">


      <div className="relative w-full max-w-[1440px] mx-auto px-6 lg:px-8 pt-6 pb-10 bg-transparent">


        <motion.div
          variants={fadeStagger}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-5"
        >
          {/* ── Page header: title + subtitle + period + CTA ── */}
          <motion.header variants={fadeStaggerItem} className="flex items-end justify-between flex-wrap gap-4 mb-1">
            <div>
              <h1 className="text-[28px] md:text-[32px] leading-[1.1] font-medium tracking-[-0.01em] text-neutral-900">
                Pipeline Activity<span className="text-black"> — {periodLabel[period]}</span>
              </h1>
              <p className="mt-2 text-[14.5px] text-neutral-500">
                Stay updated with your latest signals, conversations and hot opportunities.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative" ref={periodRef}>
                <button
                  onClick={() => setPeriodOpen((v) => !v)}
                  className="inline-flex items-center gap-1.5 text-[13px] font-medium text-neutral-800 bg-white/35 border border-white/60 rounded-full px-4 py-2.5 hover:bg-white/60 transition-colors"
                >
                  {periodLabel[period]}
                  <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${periodOpen ? "rotate-180" : ""}`} />
                </button>
                {periodOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] p-1.5 z-50">
                    {(Object.keys(periodLabel) as Period[]).map((p) => (
                      <button
                        key={p}
                        onClick={() => {
                          setPeriod(p);
                          setPeriodOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-[13px] rounded-xl transition-colors ${
                          period === p ? "bg-black/[0.04] text-neutral-900 font-medium" : "text-neutral-600 hover:bg-black/[0.03]"
                        }`}
                      >
                        {periodLabel[p]}
                        {period === p && <Check className="w-3.5 h-3.5 text-neutral-700" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/campaigns/new")}
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-white bg-[#3B82F6] hover:bg-[#2563eb] rounded-full px-4 py-2.5 shadow-[0_6px_16px_-6px_rgba(59,130,246,0.5)] transition-colors"
              >
                <Plus className="w-4 h-4" />
                New campaign
              </motion.button>
            </div>
          </motion.header>

          <motion.div variants={fadeStaggerItem}><AgencyWelcomeBanner /></motion.div>
          <motion.div variants={fadeStaggerItem}><SetupWizardBanner /></motion.div>
          <motion.div variants={fadeStaggerItem}><SubscriptionBanner /></motion.div>

          <motion.div variants={fadeStaggerItem} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard title="Hot Opportunities" value={hotOpps} loading={hotOppsLoading} accent="blue" icon={Flame} trend={{ value: 3.2 }} onDetails={() => navigate("/contacts")} />
            <MetricCard title="Leads Engaged" value={leadsEngaged} loading={engagementLoading} accent="indigo" icon={Users} trend={{ value: 5.1 }} onDetails={() => navigate("/contacts")} />
            <MetricCard title="Conversations" value={conversations} loading={engagementLoading} accent="lime" icon={MessageCircle} trend={{ value: 1.4 }} onDetails={() => navigate("/unibox")} />
            <MetricCard title="Active Signals" value={activeSignals} accent="black" icon={Radio} trend={{ value: 2.6 }} onDetails={() => navigate("/signals")} />
          </motion.div>

          <Reveal y={24} className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
            <PerformanceChart chartData={chartData} />
            <LeadsByTier data={tierData ?? []} loading={tierLoading} />
          </Reveal>

          <Reveal y={24} delay={0.1}>
            <RecentLeadsTable leads={latestLeads ?? []} loading={leadsLoading} />
          </Reveal>

          {/* Silence unused vars from removed sections */}
          <div className="hidden">{weeklyActivityLoading ? "" : ""}{JSON.stringify(weeklyActivityData ?? []).slice(0, 0)}{latestReplies?.length ?? 0}{repliesLoading ? "" : ""}</div>
        </motion.div>
      </div>
    </div>
  );
}


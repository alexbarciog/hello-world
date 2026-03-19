import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
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
  MoreVertical,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { clearOnboardingSession } from "@/components/OnboardingGuard";
import { supabase } from "@/integrations/supabase/client";

// ─── Main chart data ──────────────────────────────────────────────────────────
const generateChartData = () => {
  const data = [];
  const now = new Date("2026-03-17");
  for (let i = 30; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    data.push({ date: label, leads: i === 15 ? 1 : i === 10 ? 2 : 0 });
  }
  return data;
};
const chartData = generateChartData();

// ─── Sparkline data per card ──────────────────────────────────────────────────
const sparkFlat = [
  { v: 0 }, { v: 0 }, { v: 0 }, { v: 0 }, { v: 0 },
  { v: 0 }, { v: 0 }, { v: 0 },
];
const sparkHot = [
  { v: 1 }, { v: 0 }, { v: 1 }, { v: 2 }, { v: 1 },
  { v: 2 }, { v: 3 }, { v: 3 },
];

// ─── Static example leads ────────────────────────────────────────────────────
const exampleLeads = [
  { name: "Dylan Teixeira (example)", role: "Co-Founder", company: "GojiberryAI", heat: 2 },
  { name: "Pierre-Eliott Lallemant (example)", role: "Co-Founder", company: "GojiberryAI", heat: 2 },
  { name: "Román Czerny (example)", role: "Co-Founder", company: "GojiberryAI", heat: 2 },
];

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

function Avatar({ initials, color }: { initials: string; color: string }) {
  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ring-2 ring-white/70 shadow-sm"
      style={{ background: color }}
    >
      {initials}
    </div>
  );
}

const avatarColors = ["#1a1a2e", "#374151", "#1f2937"];

// ─── Inline mini sparkline ────────────────────────────────────────────────────
function Sparkline({ data, color }: { data: { v: number }[]; color: string }) {
  return (
    <div style={{ width: 88, height: 44 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 2, left: 2, bottom: 4 }}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Design primitives ────────────────────────────────────────────────────────
const premiumCard =
  "relative overflow-hidden bg-white rounded-xl border border-[hsl(220_20%_94%)] shadow-[0_1px_3px_hsl(220_14%_10%/0.06),0_4px_16px_hsl(220_14%_10%/0.06)]";

function ShineOverlay() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-transparent pointer-events-none rounded-xl" />
  );
}

// ─── New-style Metric Card (image reference) ──────────────────────────────────
interface MetricCardProps {
  title: string;
  value: number | string;
  loading?: boolean;
  accent?: "teal" | "neutral";
  trend?: string;
  trendUp?: boolean;
  sparkData?: { v: number }[];
  footer?: React.ReactNode;
}

function MetricCard({
  title,
  value,
  loading,
  accent = "neutral",
  trend,
  trendUp,
  sparkData,
  footer,
}: MetricCardProps) {
  const tealColor = "hsl(152 60% 38%)";
  const coralColor = "hsl(18 95% 58%)";
  const neutralColor = "hsl(222 28% 14%)";
  const valueColor = accent === "teal" ? tealColor : neutralColor;
  const sparkColor = accent === "teal" ? tealColor : "hsl(220 10% 72%)";
  const trendColor = trendUp === true ? tealColor : trendUp === false && trend !== "+0%" ? coralColor : "hsl(220 10% 60%)";

  return (
    <div className={`${premiumCard} px-5 py-4 flex flex-col gap-2 min-h-[110px]`}>
      <ShineOverlay />

      {/* Title row */}
      <div className="relative z-10 flex items-center justify-between">
        <p className="text-[11px] font-semibold text-[hsl(220_10%_55%)] tracking-wide">
          {title}
        </p>
        <button className="text-[hsl(220_10%_75%)] hover:text-[hsl(220_10%_55%)] transition-colors">
          <MoreVertical className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Number + sparkline row */}
      <div className="relative z-10 flex items-end justify-between">
        <div className="flex flex-col gap-1">
          {loading ? (
            <div className="h-8 w-12 bg-[hsl(220_20%_96%)] rounded animate-pulse" />
          ) : (
            <span
              className="text-[2rem] font-black leading-none tabular-nums tracking-tight"
              style={{ color: valueColor }}
            >
              {value}
            </span>
          )}

          {/* Trend */}
          {trend !== undefined && (
            <div className="flex items-center gap-1">
              {trendUp ? (
                <ArrowUpRight className="w-3 h-3" style={{ color: trendColor }} />
              ) : (
                <ArrowDownRight className="w-3 h-3" style={{ color: trendColor }} />
              )}
              <span className="text-[11px] font-semibold" style={{ color: trendColor }}>
                {trend}
              </span>
              <span className="text-[11px] text-[hsl(220_10%_60%)]">vs last month</span>
            </div>
          )}
        </div>

        {/* Sparkline */}
        {sparkData && (
          <div className="mb-1">
            <Sparkline data={sparkData} color={sparkColor} />
          </div>
        )}
      </div>

      {/* Optional footer */}
      {footer && (
        <div className="relative z-10 pt-2 border-t border-[hsl(220_14%_93%)]">
          {footer}
        </div>
      )}
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

  // ── Live data: aggregate campaign stats ──────────────────────────────────
  const { data: campaignStats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-campaign-stats"],
    queryFn: async () => {
      const { data: campaigns, error } = await supabase
        .from("campaigns")
        .select("invitations_sent, messages_sent");
      if (error) throw error;
      const leadsEngaged = (campaigns ?? []).reduce(
        (s, c) => s + (c.invitations_sent ?? 0),
        0
      );
      const conversations = (campaigns ?? []).reduce(
        (s, c) => s + (c.messages_sent ?? 0),
        0
      );
      return { leadsEngaged, conversations };
    },
    staleTime: 30_000,
  });

  // ── Live data: hot opportunities (leads count for user's campaigns) ──────
  const { data: hotOppsData, isLoading: hotOppsLoading } = useQuery({
    queryKey: ["dashboard-hot-opps"],
    queryFn: async () => {
      // Get all campaigns for this user first
      const { data: campaigns } = await supabase
        .from("campaigns")
        .select("id");
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

  const hotOpps = hotOppsData?.count ?? 0;
  const leadsEngaged = campaignStats?.leadsEngaged ?? 0;
  const conversations = campaignStats?.conversations ?? 0;

  return (
    <div className="min-h-full bg-[hsl(30_20%_98%)] rounded-2xl px-4 md:px-8 py-6 relative m-2 md:m-4">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-[hsl(222_28%_15%)]">Welcome Alex 🚀</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium text-red-500 border-red-200/60 bg-red-50/80 backdrop-blur-sm hover:bg-red-50 transition-all shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            0 Active Signal(s)
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium text-emerald-600 border-emerald-200/60 bg-emerald-50/80 backdrop-blur-sm hover:bg-emerald-50 transition-all shadow-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            2 LinkedIn Account(s)
          </button>
        </div>
      </div>

      {/* ── Stats row ── */}
      {/* Top strip: CTA card full-width on its own row on mobile; 4-col on ≥md */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        {/* Ready to outreach (unchanged) */}
        <div className={`${premiumCard} p-6 flex flex-col items-center justify-center gap-3`}>
          <ShineOverlay />
          <p className="text-sm font-semibold text-[hsl(222_28%_18%)] relative z-10">
            Ready to outreach?
          </p>
          <button
            onClick={handleNewCampaign}
            className="relative z-10 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02]"
            style={{
              background: "linear-gradient(135deg, hsl(18 95% 58%), hsl(5 90% 65%))",
              boxShadow: "0 4px 16px hsl(5 90% 65% / 0.45)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.boxShadow = "0 6px 24px hsl(5 90% 65% / 0.55)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.boxShadow = "0 4px 16px hsl(5 90% 65% / 0.45)")
            }
          >
            <span className="text-base">+</span>
            Start a campaign
            <span>›</span>
          </button>
        </div>

        {/* Hot Opportunities */}
        <MetricCard
          title="Hot Opportunities"
          value={hotOpps}
          description="Detected this period"
          loading={hotOppsLoading}
          accent="teal"
          trend="+0%"
          trendUp={hotOpps > 0}
          sparkColor="hsl(152 60% 40%)"
        />

        {/* Leads Engaged */}
        <MetricCard
          title="Leads Engaged"
          value={leadsEngaged}
          description="Invitations sent"
          loading={statsLoading}
          accent="neutral"
          trend="+0%"
          trendUp={false}
          sparkColor="hsl(220 10% 70%)"
        />

        {/* Conversations */}
        <MetricCard
          title="Conversations"
          value={conversations}
          description="Messages sent"
          loading={statsLoading}
          accent="neutral"
          trend="+0%"
          trendUp={false}
          sparkColor="hsl(220 10% 70%)"
          footer={
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">
                Set deal size to see pipeline generated
              </p>
              <button
                className="text-xs font-semibold ml-2 shrink-0"
                style={{ color: "hsl(var(--goji-coral))" }}
              >
                Edit
              </button>
            </div>
          }
        />
      </div>

      {/* ── Activity Overview ── */}
      <div className={`${premiumCard} p-4 md:p-6 mb-6`}>
        <ShineOverlay />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-1">
          <div>
            <h2 className="text-base font-bold text-[hsl(222_28%_15%)]">Activity Overview</h2>
            <p className="text-xs text-gray-400">
              Track your lead generation &amp; outreach performance
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: "hsl(var(--goji-coral))" }}
              />
              <span className="text-xs text-gray-500">Leads created</span>
            </div>
            <button
              onClick={handleNewCampaign}
              className="text-xs font-semibold hover:opacity-80 transition-opacity"
              style={{ color: "hsl(var(--goji-coral))" }}
            >
              Start a campaign »
            </button>
            <div className="flex items-center gap-1 border border-[hsl(220_14%_88%)] rounded-lg px-2 py-1 text-xs text-gray-500 bg-white/70 shadow-sm">
              Last 30 days
              <ChevronDown className="w-3 h-3" />
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-4" style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -30, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 94%)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
                interval={3}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                ticks={[0, 1, 2]}
              />
              <Tooltip
                contentStyle={{
                  background: "rgba(255,255,255,0.95)",
                  border: "1px solid hsl(220 20% 90%)",
                  borderRadius: "10px",
                  fontSize: "12px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
                  backdropFilter: "blur(8px)",
                }}
              />
              <Line
                type="monotone"
                dataKey="leads"
                stroke="hsl(var(--goji-coral))"
                strokeWidth={2.5}
                dot={false}
                activeDot={{
                  r: 5,
                  fill: "hsl(var(--goji-coral))",
                  stroke: "hsl(5 90% 75%)",
                  strokeWidth: 3,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Bottom row ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
        {/* Latest Hot Leads */}
        <div className={`${premiumCard} p-6`}>
          <ShineOverlay />
          <div className="relative z-10 flex items-start justify-between mb-1">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-sm"
                style={{ background: "hsl(var(--goji-coral) / 0.12)" }}
              >
                👤
              </div>
              <div>
                <h3 className="text-sm font-bold text-[hsl(222_28%_15%)]">Latest Hot Leads</h3>
                <p className="text-xs text-gray-400">Your most promising prospects</p>
              </div>
            </div>
            <button
              className="flex items-center gap-1 text-xs font-semibold hover:opacity-80 transition-opacity"
              style={{ color: "hsl(var(--goji-coral))" }}
            >
              View More <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="relative z-10 mt-4 space-y-1">
            {exampleLeads.map((lead, i) => (
              <div
                key={lead.name}
                className="flex items-center gap-3 rounded-lg px-2 py-2 -mx-2 transition-colors hover:bg-[hsl(5_90%_65%/0.04)] cursor-pointer"
              >
                <Avatar
                  initials={lead.name
                    .split(" ")
                    .slice(0, 2)
                    .map((w) => w[0])
                    .join("")}
                  color={avatarColors[i]}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[hsl(222_28%_15%)] truncate">
                    {lead.name}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {lead.role} · {lead.company}
                  </p>
                </div>
                <HeatDots count={lead.heat} />
              </div>
            ))}
          </div>
        </div>

        {/* Latest Replies */}
        <div className={`${premiumCard} p-6`}>
          <ShineOverlay />
          <div className="relative z-10 flex items-center gap-2 mb-1">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm"
              style={{ background: "hsl(var(--goji-coral) / 0.10)" }}
            >
              <MessageSquare className="w-4 h-4" style={{ color: "hsl(var(--goji-coral))" }} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[hsl(222_28%_15%)]">Latest Replies</h3>
              <p className="text-xs text-gray-400">Recent conversation responses</p>
            </div>
          </div>

          <div className="relative z-10 flex flex-col items-center justify-center py-10 gap-3">
            <MessageSquare className="w-10 h-10 text-[hsl(220_14%_88%)]" />
            <p className="text-sm text-center text-gray-400">
              <button
                className="font-semibold hover:opacity-80 transition-opacity"
                style={{ color: "hsl(var(--goji-coral))" }}
              >
                Activate your Unibox
              </button>{" "}
              to never miss a reply
            </p>
            <p className="text-xs text-gray-400">All your replies will appear here</p>
          </div>
        </div>
      </div>

      {/* ── Get Started panel ── */}
      <div className={`${premiumCard} overflow-hidden`}>
        <ShineOverlay />
        <button
          onClick={() => setGetStartedOpen(!getStartedOpen)}
          className="relative z-10 w-full flex items-center justify-between px-5 py-4 transition-colors hover:bg-[hsl(5_90%_65%/0.03)]"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm"
              style={{
                background: "linear-gradient(135deg, hsl(25 95% 53%), hsl(330 85% 55%))",
              }}
            >
              <span className="text-sm">🚀</span>
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-[hsl(222_28%_15%)]">Get Started</p>
              <p className="text-xs text-gray-400">Complete these steps to start</p>
            </div>
          </div>
          {getStartedOpen ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          )}
        </button>
        {getStartedOpen && (
          <div className="relative z-10 px-5 pb-5 pt-1 border-t border-[hsl(220_14%_93%)]">
            <div className="space-y-3 mt-3">
              {[
                { label: "Connect your LinkedIn account", done: true },
                { label: "Create your first campaign", done: false },
                { label: "Add your ICP (Ideal Customer Profile)", done: false },
                { label: "Launch your first outreach sequence", done: false },
              ].map((step) => (
                <div key={step.label} className="flex items-center gap-3">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 border-2 transition-all"
                    style={{
                      borderColor: step.done ? "hsl(142 70% 45%)" : "hsl(220 20% 75%)",
                      background: step.done ? "hsl(142 70% 45%)" : "transparent",
                      boxShadow: step.done ? "0 2px 8px hsl(142 70% 45% / 0.3)" : "none",
                    }}
                  >
                    {step.done && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="w-3 h-3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <p
                    className={`text-sm ${
                      step.done ? "line-through text-gray-400" : "text-[hsl(222_28%_15%)]"
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

      {/* ── Floating button ── */}
      <button
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
        style={{
          background: "linear-gradient(135deg, hsl(18 95% 58%), hsl(5 90% 65%))",
          boxShadow: "0 8px 32px hsl(5 90% 65% / 0.5), 0 2px 8px hsl(0 0% 0% / 0.15)",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.boxShadow =
            "0 12px 40px hsl(5 90% 65% / 0.6), 0 2px 8px hsl(0 0% 0% / 0.15)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.boxShadow =
            "0 8px 32px hsl(5 90% 65% / 0.5), 0 2px 8px hsl(0 0% 0% / 0.15)")
        }
      >
        <img
          src="/favicon.ico"
          alt=""
          className="w-5 h-5 object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        <span className="text-white text-lg absolute">🔥</span>
      </button>
    </div>
  );
}

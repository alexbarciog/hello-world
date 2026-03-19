import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
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
          loading={hotOppsLoading}
          accent="teal"
          trend="+0%"
          trendUp={hotOpps > 0}
          sparkData={sparkHot}
        />

        {/* Leads Engaged */}
        <MetricCard
          title="Leads Engaged"
          value={leadsEngaged}
          loading={statsLoading}
          accent="neutral"
          trend="+0%"
          trendUp={false}
          sparkData={sparkFlat}
        />

        {/* Conversations */}
        <MetricCard
          title="Conversations"
          value={conversations}
          loading={statsLoading}
          accent="neutral"
          trend="+0%"
          trendUp={false}
          sparkData={sparkFlat}
          footer={
            <div className="flex items-center justify-between">
              <p className="text-xs text-[hsl(220_10%_60%)]">
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
      <div className="relative overflow-hidden rounded-2xl mb-6 border border-white/80 shadow-[0_2px_4px_hsl(220_14%_10%/0.04),0_12px_40px_hsl(220_14%_10%/0.10)]"
        style={{
          background: "linear-gradient(145deg, rgba(255,255,255,0.97) 0%, rgba(255,252,250,0.95) 100%)",
        }}
      >
        {/* Decorative background orbs */}
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, hsl(18 95% 58% / 0.08) 0%, transparent 70%)" }} />
        <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, hsl(152 60% 38% / 0.06) 0%, transparent 70%)" }} />

        <div className="relative z-10 p-5 md:p-7">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-base font-bold text-[hsl(222_28%_15%)]">Activity Overview</h2>
              <p className="text-xs text-[hsl(220_10%_55%)] mt-0.5">
                Track your lead generation &amp; outreach performance
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {/* Legend */}
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: "hsl(var(--goji-coral))" }} />
                <span className="text-[11px] text-[hsl(220_10%_50%)] font-medium">Leads created</span>
              </div>
              {/* CTA */}
              <button
                onClick={handleNewCampaign}
                className="text-[11px] font-semibold px-3 py-1.5 rounded-full transition-all duration-200 hover:scale-[1.03]"
                style={{
                  color: "white",
                  background: "linear-gradient(135deg, hsl(18 95% 58%), hsl(5 90% 62%))",
                  boxShadow: "0 2px 10px hsl(5 90% 62% / 0.35)",
                }}
              >
                + Start a campaign
              </button>
              {/* Period pill */}
              <div className="flex items-center gap-1 border border-[hsl(220_14%_90%)] rounded-full px-3 py-1.5 text-[11px] text-[hsl(220_10%_50%)] bg-white/80 backdrop-blur-sm shadow-sm font-medium cursor-pointer hover:border-[hsl(220_14%_80%)] transition-colors">
                Last 30 days
                <ChevronDown className="w-3 h-3" />
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="relative" style={{ height: 220 }}>
            {/* Subtle inner glass panel behind chart */}
            <div className="absolute inset-x-0 bottom-0 top-0 rounded-xl pointer-events-none"
              style={{ background: "linear-gradient(180deg, transparent 60%, hsl(18 95% 58% / 0.03) 100%)" }} />
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 12, left: -28, bottom: 0 }}>
                <defs>
                  <linearGradient id="coralGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(18, 95%, 58%)" stopOpacity={0.22} />
                    <stop offset="55%" stopColor="hsl(18, 95%, 58%)" stopOpacity={0.07} />
                    <stop offset="100%" stopColor="hsl(18, 95%, 58%)" stopOpacity={0} />
                  </linearGradient>
                  <filter id="glowLine">
                    <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <CartesianGrid
                  strokeDasharray="4 4"
                  stroke="hsl(220 20% 94%)"
                  vertical={false}
                  strokeOpacity={0.8}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "hsl(220,10%,65%)", fontWeight: 500 }}
                  tickLine={false}
                  axisLine={false}
                  interval={3}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "hsl(220,10%,65%)", fontWeight: 500 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  ticks={[0, 1, 2]}
                />
                <Tooltip
                  cursor={{ stroke: "hsl(18 95% 58% / 0.2)", strokeWidth: 1, strokeDasharray: "4 3" }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div style={{
                        background: "rgba(255,255,255,0.92)",
                        backdropFilter: "blur(16px)",
                        WebkitBackdropFilter: "blur(16px)",
                        border: "1px solid rgba(255,255,255,0.9)",
                        borderRadius: "12px",
                        padding: "10px 14px",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.06)",
                        fontSize: "12px",
                        minWidth: 120,
                      }}>
                        <p style={{ color: "hsl(220,10%,50%)", marginBottom: 4, fontWeight: 500 }}>{label}</p>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{
                            width: 8, height: 8, borderRadius: "50%",
                            background: "hsl(18, 95%, 58%)",
                            display: "inline-block",
                            boxShadow: "0 0 6px hsl(18, 95%, 58%)",
                          }} />
                          <span style={{ color: "hsl(222,28%,15%)", fontWeight: 700, fontSize: 14 }}>
                            {payload[0].value}
                          </span>
                          <span style={{ color: "hsl(220,10%,55%)", fontWeight: 400 }}>leads</span>
                        </div>
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="leads"
                  stroke="hsl(18, 95%, 58%)"
                  strokeWidth={2.5}
                  fill="url(#coralGradient)"
                  dot={false}
                  activeDot={{
                    r: 6,
                    fill: "hsl(18, 95%, 58%)",
                    stroke: "white",
                    strokeWidth: 2.5,
                    filter: "drop-shadow(0 0 6px hsl(18 95% 58% / 0.6))",
                  }}
                  style={{ filter: "url(#glowLine)" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
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

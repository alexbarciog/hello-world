import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Flame,
  Users,
  TrendingUp,
  Zap,
  CheckCircle2,
  ArrowUpRight,
} from "lucide-react";
import { clearOnboardingSession } from "@/components/OnboardingGuard";

// Generate chart data for last 30 days
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

const exampleLeads = [
  { name: "Dylan Teixeira (example)", role: "Co-Founder", company: "GojiberryAI", heat: 2 },
  { name: "Pierre-Eliott Lallemant (example)", role: "Co-Founder", company: "GojiberryAI", heat: 2 },
  { name: "Román Czerny (example)", role: "Co-Founder", company: "GojiberryAI", heat: 2 },
];

function HeatDots({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[0, 1, 2].map((i) => (
        <span key={i} className="text-sm" style={{ opacity: i < count ? 1 : 0.2 }}>
          🔥
        </span>
      ))}
    </div>
  );
}

function Avatar({ initials, color }: { initials: string; color: string }) {
  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
      style={{ background: color }}
    >
      {initials}
    </div>
  );
}

const avatarColors = ["#1a1a2e", "#374151", "#1f2937"];

export default function Dashboard() {
  const navigate = useNavigate();
  const [getStartedOpen, setGetStartedOpen] = useState(true);

  const handleNewCampaign = () => {
    clearOnboardingSession();
    navigate("/");
  };

  return (
    <div className="min-h-full px-4 md:px-6 py-6 space-y-5">

      {/* ── Header row ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">
            Welcome Alex 🚀
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Here's what's happening with your outreach today.</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Active Signals badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-medium text-muted-foreground shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            0 Active Signal(s)
          </div>
          {/* LinkedIn Accounts badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-medium shadow-sm" style={{ color: "hsl(142 60% 38%)", borderColor: "hsl(142 60% 85%)", background: "hsl(142 50% 97%)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            2 LinkedIn Account(s)
          </div>
        </div>
      </div>

      {/* ── Metric cards row ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">

        {/* CTA card */}
        <div className="bg-card rounded-2xl border border-border p-5 flex flex-col gap-3 shadow-[0_1px_4px_0_hsl(220_14%_10%/0.06)]">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--goji-coral) / 0.12)" }}>
            <Zap className="w-4 h-4" style={{ color: "hsl(var(--goji-coral))" }} />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Ready to outreach?</p>
            <button
              onClick={handleNewCampaign}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-95"
              style={{ background: "hsl(var(--goji-coral))" }}
            >
              + Start a campaign <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Hot Opportunities */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-[0_1px_4px_0_hsl(220_14%_10%/0.06)]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-muted-foreground">Hot Opportunities</p>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--goji-coral) / 0.1)" }}>
              <Flame className="w-3.5 h-3.5" style={{ color: "hsl(var(--goji-coral))" }} />
            </div>
          </div>
          <p className="text-3xl font-bold text-foreground tracking-tight">3</p>
          <p className="text-xs text-muted-foreground mt-1">Detected this period</p>
        </div>

        {/* Leads Engaged */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-[0_1px_4px_0_hsl(220_14%_10%/0.06)]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-muted-foreground">Leads Engaged</p>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-green-50">
              <Users className="w-3.5 h-3.5 text-green-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-foreground tracking-tight">0</p>
          <p className="text-xs text-muted-foreground mt-1">Invitations sent</p>
        </div>

        {/* Conversations */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-[0_1px_4px_0_hsl(220_14%_10%/0.06)] flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-muted-foreground">Conversations</p>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-blue-50">
              <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-foreground tracking-tight">0</p>
          <p className="text-xs text-muted-foreground mt-1">Messages sent</p>
          <div className="mt-auto pt-3 border-t border-border flex items-center justify-between">
            <p className="text-[11px] text-muted-foreground/70 leading-tight">Set deal size to see pipeline</p>
            <button className="text-[11px] font-semibold" style={{ color: "hsl(var(--goji-coral))" }}>Edit</button>
          </div>
        </div>
      </div>

      {/* ── Activity Overview chart ──────────────────────────────────────── */}
      <div className="bg-card rounded-2xl border border-border p-5 md:p-6 shadow-[0_1px_4px_0_hsl(220_14%_10%/0.06)]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <h2 className="text-sm font-bold text-foreground">Activity Overview</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Track your lead generation &amp; outreach performance</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs text-muted-foreground">Leads created</span>
            </div>
            <button
              onClick={handleNewCampaign}
              className="text-xs font-semibold hover:opacity-80 transition-opacity"
              style={{ color: "hsl(var(--goji-coral))" }}
            >
              Start a campaign »
            </button>
            <div className="flex items-center gap-1 border border-border rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground bg-muted/40">
              Last 30 days
              <ChevronDown className="w-3 h-3 ml-0.5" />
            </div>
          </div>
        </div>

        {/* Chart — DO NOT MODIFY */}
        <div style={{ height: 200 }}>
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
                  background: "white",
                  border: "1px solid hsl(220 20% 90%)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Line
                type="monotone"
                dataKey="leads"
                stroke="hsl(var(--goji-coral))"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Bottom row: Latest Hot Leads & Latest Replies ────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Latest Hot Leads */}
        <div className="bg-card rounded-2xl border border-border shadow-[0_1px_4px_0_hsl(220_14%_10%/0.06)] overflow-hidden">
          {/* Card header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--goji-coral) / 0.1)" }}>
                <Flame className="w-4 h-4" style={{ color: "hsl(var(--goji-coral))" }} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Latest Hot Leads</h3>
                <p className="text-[11px] text-muted-foreground">Your most promising prospects</p>
              </div>
            </div>
            <button className="flex items-center gap-1 text-xs font-semibold text-[hsl(220,80%,55%)] hover:opacity-80 transition-opacity">
              View More <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          {/* Table header */}
          <div className="grid grid-cols-[1fr_auto] gap-4 px-5 py-2 bg-muted/30 border-b border-border">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Contact</span>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Heat</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-border">
            {exampleLeads.map((lead, i) => (
              <div key={lead.name} className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/20 transition-colors">
                <Avatar
                  initials={lead.name.split(" ").slice(0, 2).map((w) => w[0]).join("")}
                  color={avatarColors[i]}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[hsl(220,80%,55%)] truncate">{lead.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{lead.role} · {lead.company}</p>
                </div>
                <HeatDots count={lead.heat} />
              </div>
            ))}
          </div>
        </div>

        {/* Latest Replies */}
        <div className="bg-card rounded-2xl border border-border shadow-[0_1px_4px_0_hsl(220_14%_10%/0.06)] overflow-hidden">
          {/* Card header */}
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50">
              <MessageSquare className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Latest Replies</h3>
              <p className="text-[11px] text-muted-foreground">Recent conversation responses</p>
            </div>
          </div>

          {/* Empty state */}
          <div className="flex flex-col items-center justify-center py-14 px-6 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-muted-foreground/30" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                <button className="text-[hsl(220,80%,55%)] hover:underline font-semibold">Activate your Unibox</button>
                {" "}to never miss a reply
              </p>
              <p className="text-xs text-muted-foreground mt-1">All your replies will appear here</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Get Started panel ───────────────────────────────────────────── */}
      <div className="bg-card rounded-2xl border border-border shadow-[0_1px_4px_0_hsl(220_14%_10%/0.06)] overflow-hidden">
        <button
          onClick={() => setGetStartedOpen(!getStartedOpen)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/20 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, hsl(25 95% 53%), hsl(330 85% 55%))" }}
            >
              <span className="text-sm">🚀</span>
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-foreground">Get Started</p>
              <p className="text-xs text-muted-foreground">Complete these steps to start</p>
            </div>
          </div>
          {getStartedOpen ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          )}
        </button>

        {getStartedOpen && (
          <div className="px-5 pb-5 border-t border-border">
            <div className="space-y-3 mt-4">
              {[
                { label: "Connect your LinkedIn account", done: true },
                { label: "Create your first campaign", done: false },
                { label: "Add your ICP (Ideal Customer Profile)", done: false },
                { label: "Launch your first outreach sequence", done: false },
              ].map((step) => (
                <div key={step.label} className="flex items-center gap-3">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors"
                    style={{
                      borderColor: step.done ? "hsl(142 70% 45%)" : "hsl(220 20% 80%)",
                      background: step.done ? "hsl(142 70% 45%)" : "transparent",
                    }}
                  >
                    {step.done && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="w-3 h-3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <p className={`text-sm ${step.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {step.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Floating action button */}
      <button
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 z-30"
        style={{ background: "linear-gradient(135deg, hsl(25 95% 53%), hsl(330 85% 55%))" }}
      >
        <img
          src="/favicon.ico"
          alt=""
          className="w-5 h-5 object-contain"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
        <span className="text-white text-lg absolute">🔥</span>
      </button>
    </div>
  );
}

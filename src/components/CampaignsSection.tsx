import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Types ────────────────────────────────────────────────────────────────────

type Lead = {
  id: string;
  name: string;
  title: string;
  company: string;
  company_size: string | null;
  industry: string | null;
  location: string | null;
  score: number;
  precision_tier: string;
  signal_a_hit: boolean;
  signal_b_hit: boolean;
  signal_c_hit: boolean;
  reason: string | null;
};

type Campaign = {
  id: string;
  company_name: string | null;
  precision_mode: string | null;
  campaign_goal: string | null;
  industry: string | null;
  website: string | null;
  status: string;
  created_at: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

function getScoreColor(score: number) {
  if (score >= 90) return { bg: "hsl(var(--goji-coral) / 0.12)", text: "hsl(var(--goji-coral))" };
  if (score >= 70) return { bg: "hsl(30 95% 55% / 0.12)", text: "hsl(30 95% 45%)" };
  return { bg: "hsl(220 10% 55% / 0.12)", text: "hsl(220 10% 40%)" };
}

function getPrecisionLabel(tier: string) {
  if (tier === "hot") return { label: "Hot Lead", color: "hsl(var(--goji-coral))" };
  if (tier === "warm") return { label: "Warm Lead", color: "hsl(30 95% 45%)" };
  return { label: "Discovery", color: "hsl(220 10% 50%)" };
}

const SignalDot = ({ hit, label, color }: { hit: boolean; label: string; color: string }) => (
  <div className="flex items-center gap-1.5" title={label}>
    <div
      className="w-2 h-2 rounded-full transition-all"
      style={{ background: hit ? color : "hsl(220 10% 88%)", boxShadow: hit ? `0 0 6px ${color}` : "none" }}
    />
    <span className="text-xs" style={{ color: hit ? color : "hsl(var(--goji-text-muted))" }}>
      {label}
    </span>
  </div>
);

const LeadCard = ({ lead }: { lead: Lead }) => {
  const scoreStyle = getScoreColor(lead.score);
  const tierInfo = getPrecisionLabel(lead.precision_tier);

  return (
    <div
      className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-4 transition-all duration-200 hover:shadow-md"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarFallback
              className="text-sm font-semibold"
              style={{
                background: "linear-gradient(135deg, hsl(var(--goji-orange)), hsl(var(--goji-coral)))",
                color: "white",
              }}
            >
              {getInitials(lead.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-semibold text-sm leading-tight truncate" style={{ color: "hsl(var(--goji-dark))" }}>
              {lead.name}
            </p>
            <p className="text-xs mt-0.5 truncate" style={{ color: "hsl(var(--goji-text-muted))" }}>
              {lead.title}
            </p>
          </div>
        </div>
        <div
          className="shrink-0 rounded-lg px-2.5 py-1 font-bold text-sm tabular-nums"
          style={{ background: scoreStyle.bg, color: scoreStyle.text }}
        >
          {lead.score}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border border-border" style={{ color: "hsl(var(--goji-text-muted))" }}>
          🏢 {lead.company}
        </span>
        {lead.location && (
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border border-border" style={{ color: "hsl(var(--goji-text-muted))" }}>
            📍 {lead.location}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4 py-2 px-3 rounded-xl" style={{ background: "hsl(220 20% 97%)" }}>
        <SignalDot hit={lead.signal_a_hit} label="Social" color="hsl(var(--goji-coral))" />
        <SignalDot hit={lead.signal_b_hit} label="Growth" color="hsl(210 90% 52%)" />
        <SignalDot hit={lead.signal_c_hit} label="Context" color="hsl(142 70% 42%)" />
        <div className="ml-auto">
          <span className="text-xs font-semibold rounded-full px-2 py-0.5" style={{ color: tierInfo.color, background: `${tierInfo.color}18` }}>
            {tierInfo.label}
          </span>
        </div>
      </div>

      {lead.reason && (
        <p className="text-xs italic leading-relaxed border-l-2 pl-3" style={{ color: "hsl(var(--goji-text-muted))", borderColor: "hsl(var(--goji-coral) / 0.35)" }}>
          {lead.reason}
        </p>
      )}
    </div>
  );
};

const SkeletonRow = () => (
  <div className="flex items-center gap-4 px-5 py-4 border-b border-border last:border-0">
    <Skeleton className="h-8 w-8 rounded-full shrink-0" />
    <div className="flex-1 space-y-1.5">
      <Skeleton className="h-3.5 w-36" />
      <Skeleton className="h-3 w-24" />
    </div>
    <Skeleton className="h-6 w-16 rounded-full" />
    <Skeleton className="h-6 w-10 rounded-lg" />
  </div>
);

// ─── Campaign Row ─────────────────────────────────────────────────────────────

const CampaignRow = ({
  campaign,
  leadsCount,
  selected,
  onClick,
}: {
  campaign: Campaign;
  leadsCount: number;
  selected: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/50 ${selected ? "bg-muted/60" : ""}`}
  >
    <div
      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm"
      style={{ background: "linear-gradient(135deg, hsl(var(--goji-orange)), hsl(var(--goji-coral)))" }}
    >
      📡
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-semibold text-sm truncate" style={{ color: "hsl(var(--goji-dark))" }}>
        {campaign.company_name ?? "My Campaign"}
      </p>
      <p className="text-xs mt-0.5 truncate" style={{ color: "hsl(var(--goji-text-muted))" }}>
        {campaign.industry ?? campaign.campaign_goal ?? "—"}
      </p>
    </div>
    <span className="text-sm font-semibold tabular-nums" style={{ color: "hsl(var(--goji-dark))" }}>
      {leadsCount}
    </span>
    <span
      className="text-xs font-semibold rounded-full px-2.5 py-1"
      style={{
        background: campaign.status === "active" ? "hsl(142 70% 42% / 0.12)" : "hsl(220 10% 55% / 0.12)",
        color: campaign.status === "active" ? "hsl(142 70% 35%)" : "hsl(220 10% 40%)",
      }}
    >
      {campaign.status === "active" ? "Active" : campaign.status}
    </span>
    <span className="text-xs shrink-0" style={{ color: "hsl(var(--goji-text-muted))" }}>
      {new Date(campaign.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
    </span>
  </button>
);

// ─── Main Section ─────────────────────────────────────────────────────────────

export default function CampaignsSection({ campaignIdFromUrl }: { campaignIdFromUrl?: string | null }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadCounts, setLeadCounts] = useState<Record<string, number>>({});
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [loadingLeads, setLoadingLeads] = useState(false);

  // Load all campaigns
  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("campaigns")
        .select("id, company_name, precision_mode, campaign_goal, industry, website, status, created_at")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      const rows = (data as Campaign[]) ?? [];
      setCampaigns(rows);

      if (rows.length > 0) {
        // Load lead counts for all campaigns
        const counts: Record<string, number> = {};
        await Promise.all(
          rows.map(async (c) => {
            const { count } = await supabase
              .from("leads")
              .select("id", { count: "exact", head: true })
              .eq("campaign_id", c.id);
            counts[c.id] = count ?? 0;
          })
        );
        setLeadCounts(counts);

        // Auto-select: prefer the one from URL, else first
        const initial = campaignIdFromUrl
          ? rows.find((r) => r.id === campaignIdFromUrl) ?? rows[0]
          : rows[0];
        setSelectedCampaign(initial);
      }

      setLoadingCampaigns(false);
    }
    load();
  }, [campaignIdFromUrl]);

  // Load leads when selectedCampaign changes
  const loadLeads = useCallback(async (campaignId: string) => {
    setLoadingLeads(true);
    const { data } = await supabase
      .from("leads")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("score", { ascending: false });
    setLeads((data as Lead[]) ?? []);
    setLoadingLeads(false);
  }, []);

  useEffect(() => {
    if (selectedCampaign) loadLeads(selectedCampaign.id);
  }, [selectedCampaign, loadLeads]);

  const hotLeads = leads.filter((l) => l.precision_tier === "hot").length;
  const warmLeads = leads.filter((l) => l.precision_tier === "warm").length;

  return (
    <section id="campaigns" className="py-20 px-4 max-w-6xl mx-auto">
      {/* Section header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "hsl(var(--goji-coral))" }}>
              📡 Campaigns
            </span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight" style={{ color: "hsl(var(--goji-dark))" }}>
            Your outreach campaigns
          </h2>
          <p className="text-sm mt-1" style={{ color: "hsl(var(--goji-text-muted))" }}>
            Create and manage your outreach campaigns
          </p>
        </div>
        <a
          href="/"
          className="hidden md:inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ background: "hsl(var(--goji-coral))", color: "white" }}
        >
          + Start a campaign
        </a>
      </div>

      {/* Panel */}
      <div
        className="rounded-2xl border border-border bg-card overflow-hidden"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        {loadingCampaigns ? (
          <div>
            {Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        ) : campaigns.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 text-center px-6">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 text-2xl"
              style={{ background: "hsl(220 20% 95%)" }}
            >
              📡
            </div>
            <h3 className="font-semibold text-base mb-2" style={{ color: "hsl(var(--goji-dark))" }}>
              No campaigns yet
            </h3>
            <p className="text-sm mb-6 max-w-xs" style={{ color: "hsl(var(--goji-text-muted))" }}>
              Complete the onboarding to create your first AI-powered outreach campaign.
            </p>
            <a
              href="/"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ background: "hsl(var(--goji-coral))", color: "white" }}
            >
              + Start a campaign
            </a>
          </div>
        ) : (
          <div className="flex min-h-[420px]">
            {/* Left: campaigns list */}
            <div className="w-full md:w-[45%] border-r border-border flex flex-col">
              {/* Table header */}
              <div className="flex items-center gap-4 px-5 py-3 border-b border-border bg-muted/30">
                <div className="flex-1 text-xs font-semibold uppercase tracking-wide" style={{ color: "hsl(var(--goji-text-muted))" }}>
                  Campaign Name
                </div>
                <span className="text-xs font-semibold uppercase tracking-wide w-10 text-right" style={{ color: "hsl(var(--goji-text-muted))" }}>
                  Leads
                </span>
                <span className="text-xs font-semibold uppercase tracking-wide w-16" style={{ color: "hsl(var(--goji-text-muted))" }}>
                  Status
                </span>
                <span className="text-xs font-semibold uppercase tracking-wide w-24" style={{ color: "hsl(var(--goji-text-muted))" }}>
                  Created
                </span>
              </div>

              {/* Campaign rows */}
              <div className="divide-y divide-border flex-1 overflow-y-auto">
                {campaigns.map((c) => (
                  <CampaignRow
                    key={c.id}
                    campaign={c}
                    leadsCount={leadCounts[c.id] ?? 0}
                    selected={selectedCampaign?.id === c.id}
                    onClick={() => setSelectedCampaign(c)}
                  />
                ))}
              </div>
            </div>

            {/* Right: leads panel */}
            <div className="hidden md:flex flex-col flex-1 min-w-0">
              {/* Panel header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
                <div>
                  <p className="font-semibold text-sm" style={{ color: "hsl(var(--goji-dark))" }}>
                    {selectedCampaign?.company_name ?? "Campaign"} — Leads
                  </p>
                  {!loadingLeads && leads.length > 0 && (
                    <p className="text-xs mt-0.5" style={{ color: "hsl(var(--goji-text-muted))" }}>
                      {leads.length} total · {hotLeads} hot · {warmLeads} warm
                    </p>
                  )}
                </div>
                {selectedCampaign?.precision_mode && (
                  <span
                    className="text-xs font-semibold rounded-full px-3 py-1"
                    style={{
                      background: selectedCampaign.precision_mode === "high_precision"
                        ? "hsl(var(--goji-coral) / 0.12)"
                        : "hsl(210 90% 52% / 0.12)",
                      color: selectedCampaign.precision_mode === "high_precision"
                        ? "hsl(var(--goji-coral))"
                        : "hsl(210 90% 45%)",
                    }}
                  >
                    {selectedCampaign.precision_mode === "high_precision" ? "🎯 High Precision" : "🔍 Discovery"}
                  </span>
                )}
              </div>

              {/* Leads */}
              <div className="flex-1 overflow-y-auto p-4">
                {loadingLeads ? (
                  <div className="grid grid-cols-1 gap-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="rounded-2xl border border-border p-4 flex gap-3">
                        <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-3.5 w-28" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                        <Skeleton className="h-8 w-10 rounded-lg" />
                      </div>
                    ))}
                  </div>
                ) : leads.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                    <p className="text-sm font-medium mb-1" style={{ color: "hsl(var(--goji-dark))" }}>
                      No leads yet
                    </p>
                    <p className="text-xs" style={{ color: "hsl(var(--goji-text-muted))" }}>
                      Signal agents are scanning for prospects…
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {leads.map((lead) => (
                      <LeadCard key={lead.id} lead={lead} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

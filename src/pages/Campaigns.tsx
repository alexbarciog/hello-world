import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import gojiIcon from "@/assets/gojiberry-icon.png";
import { toast } from "sonner";
import { Info, Trash2, Pencil, Play, Pause, MoreVertical, Plus, Users, Zap, TrendingUp, ArrowRight, Bot, Sparkles } from "lucide-react";
import { CreateCampaignWizard } from "@/components/campaigns/CreateCampaignWizard";
import { motion, AnimatePresence } from "framer-motion";

const MAX_CAMPAIGNS = 2;

type Campaign = {
  id: string;
  company_name: string | null;
  status: string;
  created_at: string;
  campaign_goal: string | null;
  invitations_sent: number;
  invitations_accepted: number;
  messages_sent: number;
  messages_replied: number;
};

type CampaignWithLeads = Campaign & { leadsCount: number };

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

function StatusBadge({ status }: { status: string }) {
  const isActive = status === "active";
  const isPending = status === "pending_linkedin";
  const color = isActive ? "hsl(142 70% 45%)" : isPending ? "hsl(38 92% 50%)" : "hsl(220 10% 65%)";
  const bgColor = isActive ? "hsl(142 70% 95%)" : isPending ? "hsl(38 92% 95%)" : "hsl(220 10% 95%)";
  const label = isActive ? "Active" : isPending ? "Pending" : status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ color, background: bgColor }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function MiniStatBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px] font-medium">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-bold" style={{ color }}>{pct}%</span>
      </div>
      <div className="h-1 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function CampaignCard({
  c, index, onToggle, onEdit, onDelete,
}: {
  c: CampaignWithLeads;
  index: number;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const navigate = useNavigate();
  const isActive = c.status === "active";
  const borderAccent = isActive ? "hsl(142 70% 45%)" : c.status === "pending_linkedin" ? "hsl(38 92% 50%)" : "hsl(220 10% 80%)";

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="group relative rounded-xl border border-border bg-card overflow-hidden cursor-pointer transition-shadow duration-200 hover:shadow-lg hover:shadow-primary/5"
      onClick={() => navigate(`/campaigns/${c.id}`)}
    >
      {/* Status accent line */}
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ background: borderAccent }} />

      <div className="pl-5 pr-4 py-4">
        {/* Top row: name + status + actions */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-muted/60 flex items-center justify-center shrink-0">
              <img src={gojiIcon} alt="" className="w-5 h-5 object-contain opacity-70" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold truncate text-foreground">
                {c.company_name || "My Campaign"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {c.campaign_goal === "demos" ? "Book demos" : "Start conversations"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <StatusBadge status={c.status} />
            <div onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground opacity-0 group-hover:opacity-100">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  {!isActive ? (
                    <DropdownMenuItem onClick={onToggle} className="gap-2 text-sm">
                      <Play className="w-3.5 h-3.5 text-green-600" /> Activate
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={onToggle} className="gap-2 text-sm">
                      <Pause className="w-3.5 h-3.5" /> Pause
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={onEdit} className="gap-2 text-sm">
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onDelete} className="gap-2 text-sm text-destructive focus:text-destructive">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          <div className="rounded-lg bg-muted/40 px-3 py-2.5 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Leads</p>
            <p className="text-lg font-bold text-foreground mt-0.5">{c.leadsCount}</p>
          </div>
          <div className="rounded-lg bg-muted/40 px-3 py-2.5 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Sent</p>
            <p className="text-lg font-bold text-foreground mt-0.5">{c.invitations_sent || 0}</p>
          </div>
          <div className="rounded-lg bg-muted/40 px-3 py-2.5 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Connect</p>
            <p className="text-lg font-bold text-foreground mt-0.5">{c.invitations_accepted || 0}</p>
          </div>
          <div className="rounded-lg bg-muted/40 px-3 py-2.5 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Reply</p>
            <p className="text-lg font-bold text-foreground mt-0.5">{c.messages_replied || 0}</p>
          </div>
        </div>

        {/* Rate bars */}
        <div className="grid grid-cols-2 gap-4 mt-3">
          <MiniStatBar label="Accept Rate" value={c.invitations_accepted || 0} total={c.invitations_sent || 0} color="hsl(142 70% 45%)" />
          <MiniStatBar label="Reply Rate" value={c.messages_replied || 0} total={c.messages_sent || 0} color="hsl(217 91% 60%)" />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px]">👤</div>
            First account · connected
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function CampaignsPage() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<CampaignWithLeads[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [editCampaignId, setEditCampaignId] = useState<string | null>(null);

  const atLimit = campaigns.length >= MAX_CAMPAIGNS;

  const load = async () => {
    const { data } = await supabase
      .from("campaigns")
      .select("id, company_name, status, created_at, campaign_goal, invitations_sent, invitations_accepted, messages_sent, messages_replied")
      .order("created_at", { ascending: false });
    const rows = (data ?? []) as Campaign[];
    const withCounts: CampaignWithLeads[] = await Promise.all(
      rows.map(async (c) => {
        const { count } = await supabase.from("leads").select("id", { count: "exact", head: true }).eq("campaign_id", c.id);
        return { ...c, leadsCount: count ?? 0 };
      })
    );
    setCampaigns(withCounts);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleNewCampaign = () => {
    if (atLimit) { toast.error(`You've reached the limit of ${MAX_CAMPAIGNS} campaigns.`); return; }
    setEditCampaignId(null);
    setShowWizard(true);
  };

  const handleEditCampaign = (id: string) => { setEditCampaignId(id); setShowWizard(true); };

  const handleDeleteCampaign = async (id: string) => {
    const { error } = await supabase.from("campaigns").delete().eq("id", id);
    if (error) toast.error("Failed to delete campaign");
    else { setCampaigns((prev) => prev.filter((c) => c.id !== id)); toast.success("Campaign deleted"); }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "paused" : "active";
    const { error } = await supabase.from("campaigns").update({ status: newStatus }).eq("id", id);
    if (error) toast.error("Failed to update campaign status");
    else { setCampaigns((prev) => prev.map((c) => c.id === id ? { ...c, status: newStatus } : c)); toast.success(newStatus === "active" ? "Campaign activated" : "Campaign paused"); }
  };

  // Summary stats
  const totalLeads = campaigns.reduce((sum, c) => sum + c.leadsCount, 0);
  const activeCampaigns = campaigns.filter(c => c.status === "active").length;
  const totalSent = campaigns.reduce((sum, c) => sum + (c.invitations_sent || 0), 0);
  const totalAccepted = campaigns.reduce((sum, c) => sum + (c.invitations_accepted || 0), 0);
  const avgAcceptRate = totalSent > 0 ? Math.round((totalAccepted / totalSent) * 100) : 0;

  const emptyState = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center gap-4 py-20"
    >
      <div className="flex items-center gap-6 mb-2">
        {[
          { icon: Bot, label: "Create Agent", color: "hsl(var(--goji-coral))" },
          { icon: Sparkles, label: "Build Campaign", color: "hsl(217 91% 60%)" },
          { icon: Zap, label: "Start Outreach", color: "hsl(142 70% 45%)" },
        ].map((step, i) => (
          <div key={i} className="flex items-center gap-3">
            {i > 0 && <ArrowRight className="w-4 h-4 text-muted-foreground/40" />}
            <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: `${step.color}15` }}>
                <step.icon className="w-6 h-6" style={{ color: step.color }} />
              </div>
              <span className="text-xs font-semibold text-muted-foreground">{step.label}</span>
            </div>
          </div>
        ))}
      </div>
      <p className="text-base font-bold text-foreground mt-2">No campaigns yet</p>
      <p className="text-sm text-muted-foreground max-w-md text-center">
        Create your first AI-powered outreach campaign to start connecting with your ideal prospects on LinkedIn.
      </p>
      <button
        onClick={handleNewCampaign}
        className={`mt-2 btn-cta text-sm ${campaigns.length === 0 ? "animate-pulse" : ""}`}
      >
        <Plus className="w-4 h-4" />
        Start your first campaign
      </button>
    </motion.div>
  );

  return (
    <div className="min-h-full bg-card rounded-2xl m-3 md:m-4 p-4 md:p-6">
      {/* Header */}
      <div className="rounded-xl bg-card border border-border p-4 mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-base font-bold flex items-center gap-2 flex-wrap text-foreground">
            <span className="flex items-center gap-1.5">
              <img src={gojiIcon} alt="" className="w-5 h-5 object-contain" />
              Campaigns
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {loading ? "..." : campaigns.length} / {MAX_CAMPAIGNS}
            </span>
          </h1>
          <p className="text-xs mt-1 ml-7 text-muted-foreground">
            Create and manage your outreach campaigns
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          {atLimit && (
            <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-1.5">
              <Info className="w-3.5 h-3.5 shrink-0" />
              Limit reached ({MAX_CAMPAIGNS}/{MAX_CAMPAIGNS})
            </div>
          )}
          <button
            onClick={handleNewCampaign}
            disabled={atLimit}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all hover:opacity-90 hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 w-full sm:w-auto justify-center text-white"
            style={{ background: "hsl(var(--goji-coral))" }}
          >
            <Plus className="w-4 h-4" />
            Start a campaign
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      {!loading && campaigns.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5"
        >
          {[
            { label: "Total Leads", value: totalLeads, icon: Users, color: "hsl(var(--goji-coral))" },
            { label: "Active", value: activeCampaigns, icon: Play, color: "hsl(142 70% 45%)" },
            { label: "Invitations Sent", value: totalSent, icon: Zap, color: "hsl(217 91% 60%)" },
            { label: "Avg Accept Rate", value: `${avgAcceptRate}%`, icon: TrendingUp, color: "hsl(var(--goji-orange))" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border bg-card p-3.5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${stat.color}12` }}>
                <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                <p className="text-lg font-bold text-foreground">{stat.value}</p>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Campaign Cards */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border p-5 space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <div className="grid grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, j) => <Skeleton key={j} className="h-14 rounded-lg" />)}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-4 rounded-full" />
                <Skeleton className="h-4 rounded-full" />
              </div>
            </div>
          ))
        ) : campaigns.length === 0 ? (
          emptyState
        ) : (
          <AnimatePresence>
            {campaigns.map((c, i) => (
              <CampaignCard
                key={c.id}
                c={c}
                index={i}
                onToggle={() => handleToggleStatus(c.id, c.status)}
                onEdit={() => handleEditCampaign(c.id)}
                onDelete={() => handleDeleteCampaign(c.id)}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Create/Edit Campaign Wizard */}
      <CreateCampaignWizard
        open={showWizard}
        onOpenChange={setShowWizard}
        editCampaignId={editCampaignId}
        onCreated={(id) => {
          load();
          navigate(`/campaigns/${id}`);
        }}
      />
    </div>
  );
}

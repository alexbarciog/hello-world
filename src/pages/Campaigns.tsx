import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import gojiIcon from "@/assets/gojiberry-icon.png";
import { clearOnboardingSession } from "@/components/OnboardingGuard";
import { toast } from "sonner";
import { Info, Trash2, Pencil, Play, Pause, MoreVertical, Plus } from "lucide-react";
import { CreateCampaignWizard } from "@/components/campaigns/CreateCampaignWizard";

const MAX_CAMPAIGNS = 2;

type Campaign = {
  id: string;
  company_name: string | null;
  status: string;
  created_at: string;
  campaign_goal: string | null;
};

type CampaignWithLeads = Campaign & { leadsCount: number };

// ── Mobile campaign card ─────────────────────────────────────────────────────
function CampaignCard({
  c,
  onToggle,
  onEdit,
  onDelete,
}: {
  c: CampaignWithLeads;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isActive = c.status === "active";
  const isPending = c.status === "pending_linkedin";

  const statusColor = isActive
    ? "hsl(142 70% 45%)"
    : isPending
    ? "hsl(38 92% 50%)"
    : "hsl(220 10% 65%)";

  const statusLabel = isActive ? "Active" : isPending ? "Pending LinkedIn" : c.status;

  return (
    <div className="rounded-xl border border-border bg-background p-4 flex flex-col gap-3">
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <img src={gojiIcon} alt="" className="w-6 h-6 object-contain shrink-0 opacity-70" />
          <p
            className="text-sm font-semibold truncate"
            style={{ color: "hsl(var(--goji-dark))" }}
          >
            {c.company_name || "My Campaign"}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Status badge */}
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: statusColor }} />
            <span className="text-xs font-medium" style={{ color: statusColor }}>
              {statusLabel}
            </span>
          </div>

          {/* Actions menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                style={{ color: "hsl(var(--goji-text-muted))" }}
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {!isActive ? (
                <DropdownMenuItem onClick={onToggle} className="gap-2 text-sm">
                  <Play className="w-3.5 h-3.5 text-green-600" />
                  Activate campaign
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={onToggle} className="gap-2 text-sm">
                  <Pause className="w-3.5 h-3.5" />
                  Pause campaign
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onEdit} className="gap-2 text-sm">
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="gap-2 text-sm text-destructive focus:text-destructive">
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        <div className="rounded-lg bg-muted/40 px-3 py-2 text-center">
          <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "hsl(var(--goji-text-muted))" }}>Leads</p>
          <p className="text-sm font-bold" style={{ color: "hsl(var(--goji-dark))" }}>{c.leadsCount}</p>
        </div>
        <div className="rounded-lg bg-muted/40 px-3 py-2 text-center">
          <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "hsl(var(--goji-text-muted))" }}>Connect</p>
          <p className="text-sm text-muted-foreground">—</p>
        </div>
        <div className="rounded-lg bg-muted/40 px-3 py-2 text-center">
          <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "hsl(var(--goji-text-muted))" }}>Reply</p>
          <p className="text-sm text-muted-foreground">—</p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs" style={{ color: "hsl(var(--goji-text-muted))" }}>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]" style={{ background: "hsl(220 14% 92%)" }}>👤</div>
          First account · connected
        </div>
        <span>
          {new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
      </div>
    </div>
  );
}

export default function CampaignsPage() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<CampaignWithLeads[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [editCampaignId, setEditCampaignId] = useState<string | null>(null);

  const atLimit = campaigns.length >= MAX_CAMPAIGNS;

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("campaigns")
        .select("id, company_name, status, created_at, campaign_goal")
        .order("created_at", { ascending: false });

      const rows = (data ?? []) as Campaign[];

      const withCounts: CampaignWithLeads[] = await Promise.all(
        rows.map(async (c) => {
          const { count } = await supabase
            .from("leads")
            .select("id", { count: "exact", head: true })
            .eq("campaign_id", c.id);
          return { ...c, leadsCount: count ?? 0 };
        })
      );

      setCampaigns(withCounts);
      setLoading(false);
    }
    load();
  }, []);

  const load = async () => {
    const { data } = await supabase
      .from("campaigns")
      .select("id, company_name, status, created_at, campaign_goal")
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

  const handleNewCampaign = () => {
    if (atLimit) {
      toast.error(`You've reached the limit of ${MAX_CAMPAIGNS} campaigns.`);
      return;
    }
    setEditCampaignId(null);
    setShowWizard(true);
  };

  const handleEditCampaign = (id: string) => {
    setEditCampaignId(id);
    setShowWizard(true);
  };

  const handleDeleteCampaign = async (id: string) => {
    const { error } = await supabase.from("campaigns").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete campaign");
    } else {
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
      toast.success("Campaign deleted");
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "paused" : "active";
    const { error } = await supabase.from("campaigns").update({ status: newStatus }).eq("id", id);
    if (error) {
      toast.error("Failed to update campaign status");
    } else {
      setCampaigns((prev) => prev.map((c) => c.id === id ? { ...c, status: newStatus } : c));
      toast.success(newStatus === "active" ? "Campaign activated" : "Campaign paused");
    }
  };

  const emptyState = (
    <div className="flex flex-col items-center gap-3 py-16">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
        style={{ background: "hsl(220 20% 95%)" }}
      >
        📡
      </div>
      <p className="text-sm font-medium" style={{ color: "hsl(var(--goji-dark))" }}>No campaigns yet</p>
      <p className="text-xs" style={{ color: "hsl(var(--goji-text-muted))" }}>Create your first campaign to get started.</p>
      <button
        onClick={handleNewCampaign}
        className="mt-2 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90"
        style={{ background: "hsl(var(--goji-coral))", color: "white" }}
      >
        + Start a campaign
      </button>
    </div>
  );

  return (
    <div className="min-h-full bg-card rounded-2xl m-3 md:m-4 p-4 md:p-6">

      {/* Header */}
      <div className="rounded-xl bg-card border border-border p-4 mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-base font-semibold flex items-center gap-2 flex-wrap" style={{ color: "hsl(var(--goji-dark))" }}>
            <span className="flex items-center gap-1.5">
              <img src={gojiIcon} alt="" className="w-5 h-5 object-contain" />
              Campaigns
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted" style={{ color: "hsl(var(--goji-text-muted))" }}>
              {loading ? "..." : campaigns.length} / {MAX_CAMPAIGNS}
            </span>
          </h1>
          <p className="text-xs mt-1 ml-7" style={{ color: "hsl(var(--goji-text-muted))" }}>
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
            className="inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-auto justify-center"
            style={{ background: "hsl(var(--goji-coral))", color: "white" }}
          >
            <Plus className="w-4 h-4" />
            Start a campaign
          </button>
        </div>
      </div>

      {/* Mobile: card list */}
      <div className="md:hidden space-y-3">
        {loading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border p-4 space-y-3">
              <Skeleton className="h-5 w-40" />
              <div className="grid grid-cols-3 gap-2">
                <Skeleton className="h-12 rounded-lg" />
                <Skeleton className="h-12 rounded-lg" />
                <Skeleton className="h-12 rounded-lg" />
              </div>
            </div>
          ))
        ) : campaigns.length === 0 ? (
          emptyState
        ) : (
          campaigns.map((c) => (
            <div key={c.id} onClick={() => navigate(`/campaigns/${c.id}`)} className="cursor-pointer">
              <CampaignCard
                c={c}
                onToggle={() => handleToggleStatus(c.id, c.status)}
                onEdit={() => handleEditCampaign(c.id)}
                onDelete={() => handleDeleteCampaign(c.id)}
              />
            </div>
          ))
        )}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block rounded-md border border-border bg-card overflow-visible">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--goji-text-muted))" }}>Campaign Name</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-center" style={{ color: "hsl(var(--goji-text-muted))" }}>Leads</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-center" style={{ color: "hsl(var(--goji-text-muted))" }}>Connect</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-center" style={{ color: "hsl(var(--goji-text-muted))" }}>Reply</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--goji-text-muted))" }}>LinkedIn Account</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--goji-text-muted))" }}>Status</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--goji-text-muted))" }}>Created</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-center" style={{ color: "hsl(var(--goji-text-muted))" }}>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell className="text-center"><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                  <TableCell className="text-center"><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                  <TableCell className="text-center"><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell className="text-center"><Skeleton className="h-4 w-10 mx-auto" /></TableCell>
                </TableRow>
              ))
            ) : campaigns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-0">{emptyState}</TableCell>
              </TableRow>
            ) : (
              campaigns.map((c) => (
                <TableRow key={c.id} className="group cursor-pointer" onClick={() => navigate(`/campaigns/${c.id}`)}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img src={gojiIcon} alt="" className="w-5 h-5 object-contain shrink-0 opacity-70" />
                      <span className="text-sm font-medium" style={{ color: "hsl(var(--goji-dark))" }}>
                        {c.company_name || "My Campaign"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-sm font-semibold" style={{ color: "hsl(var(--goji-dark))" }}>{c.leadsCount}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-sm" style={{ color: "hsl(var(--goji-text-muted))" }}>—</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-sm" style={{ color: "hsl(var(--goji-text-muted))" }}>—</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0" style={{ background: "hsl(220 14% 92%)", color: "hsl(var(--goji-text-muted))" }}>👤</div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate" style={{ color: "hsl(var(--goji-dark))" }}>First account</p>
                        <p className="text-[10px] truncate" style={{ color: "hsl(var(--goji-text-muted))" }}>connected</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: c.status === "active" ? "hsl(142 70% 45%)" : c.status === "pending_linkedin" ? "hsl(38 92% 50%)" : "hsl(220 10% 65%)" }} />
                      <span className="text-sm font-medium" style={{ color: c.status === "active" ? "hsl(142 70% 35%)" : c.status === "pending_linkedin" ? "hsl(38 80% 35%)" : "hsl(220 10% 50%)" }}>
                        {c.status === "active" ? "Active" : c.status === "pending_linkedin" ? "Pending LinkedIn" : c.status}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm" style={{ color: "hsl(var(--goji-text-muted))" }}>
                      {new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1.5 rounded hover:bg-muted/60 transition-colors" style={{ color: "hsl(var(--goji-text-muted))" }}>
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                            <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
                          </svg>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        {c.status !== "active" ? (
                          <DropdownMenuItem onClick={() => handleToggleStatus(c.id, c.status)} className="gap-2 text-sm">
                            <Play className="w-3.5 h-3.5 text-green-600" />Activate campaign
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleToggleStatus(c.id, c.status)} className="gap-2 text-sm">
                            <Pause className="w-3.5 h-3.5" />Pause campaign
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditCampaign(c.id); }} className="gap-2 text-sm">
                          <Pencil className="w-3.5 h-3.5" />Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDeleteCampaign(c.id)} className="gap-2 text-sm text-destructive focus:text-destructive">
                          <Trash2 className="w-3.5 h-3.5" />Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

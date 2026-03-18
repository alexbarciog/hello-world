import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import gojiIcon from "@/assets/gojiberry-icon.png";
import { clearOnboardingSession } from "@/components/OnboardingGuard";
import { toast } from "sonner";
import { Info, Trash2, Pencil, Play, Pause } from "lucide-react";

const MAX_CAMPAIGNS = 2;

type Campaign = {
  id: string;
  company_name: string | null;
  status: string;
  created_at: string;
  campaign_goal: string | null;
};

type CampaignWithLeads = Campaign & { leadsCount: number };

export default function CampaignsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<CampaignWithLeads[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const atLimit = campaigns.length >= MAX_CAMPAIGNS;

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("campaigns")
        .select("id, company_name, status, created_at, campaign_goal")
        
        .order("created_at", { ascending: false });

      const rows = (data ?? []) as Campaign[];

      // Get lead counts
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

  // Close menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleNewCampaign = () => {
    if (atLimit) {
      toast.error(`You've reached the limit of ${MAX_CAMPAIGNS} campaigns. Delete an existing one to create a new campaign.`);
      return;
    }
    clearOnboardingSession();
    navigate("/");
  };

  const handleDeleteCampaign = async (id: string) => {
    setMenuOpen(null);
    const { error } = await supabase.from("campaigns").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete campaign");
    } else {
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
      toast.success("Campaign deleted");
    }
  };

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      {/* Header card */}
      <div className="rounded-md bg-card p-4 mb-6 border border-border flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold flex items-center gap-2" style={{ color: "hsl(var(--goji-dark))" }}>
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
        <div className="flex items-center gap-2">
          {atLimit && (
            <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-1.5">
              <Info className="w-3.5 h-3.5 shrink-0" />
              Limit reached ({MAX_CAMPAIGNS}/{MAX_CAMPAIGNS})
            </div>
          )}
          <button
            onClick={handleNewCampaign}
            disabled={atLimit}
            className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "hsl(var(--goji-coral))", color: "white" }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Start a campaign
          </button>
        </div>
      </div>

      {/* Table card */}
      <div className="rounded-md border border-border bg-card overflow-visible">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead
                className="text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: "hsl(var(--goji-text-muted))" }}
              >
                Campaign Name
              </TableHead>
              <TableHead
                className="text-[11px] font-semibold uppercase tracking-wider text-center"
                style={{ color: "hsl(var(--goji-text-muted))" }}
              >
                Leads
              </TableHead>
              <TableHead
                className="text-[11px] font-semibold uppercase tracking-wider text-center"
                style={{ color: "hsl(var(--goji-text-muted))" }}
              >
                Connect
              </TableHead>
              <TableHead
                className="text-[11px] font-semibold uppercase tracking-wider text-center"
                style={{ color: "hsl(var(--goji-text-muted))" }}
              >
                Reply
              </TableHead>
              <TableHead
                className="text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: "hsl(var(--goji-text-muted))" }}
              >
                LinkedIn Account
              </TableHead>
              <TableHead
                className="text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: "hsl(var(--goji-text-muted))" }}
              >
                Status
              </TableHead>
              <TableHead
                className="text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: "hsl(var(--goji-text-muted))" }}
              >
                Created
              </TableHead>
              <TableHead
                className="text-[11px] font-semibold uppercase tracking-wider text-center"
                style={{ color: "hsl(var(--goji-text-muted))" }}
              >
                Actions
              </TableHead>
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
                <TableCell colSpan={8} className="text-center py-16">
                  <div className="flex flex-col items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                      style={{ background: "hsl(220 20% 95%)" }}
                    >
                      📡
                    </div>
                    <p className="text-sm font-medium" style={{ color: "hsl(var(--goji-dark))" }}>
                      No campaigns yet
                    </p>
                    <p className="text-xs" style={{ color: "hsl(var(--goji-text-muted))" }}>
                      Create your first campaign to get started.
                    </p>
                    <button
                      onClick={handleNewCampaign}
                      className="mt-2 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90"
                      style={{ background: "hsl(var(--goji-coral))", color: "white" }}
                    >
                      + Start a campaign
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              campaigns.map((c) => (
                <TableRow key={c.id} className="group">
                  {/* Campaign Name */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img src={gojiIcon} alt="" className="w-5 h-5 object-contain shrink-0 opacity-70" />
                      <span
                        className="text-sm font-medium"
                        style={{ color: "hsl(var(--goji-dark))" }}
                      >
                        {c.company_name || "My Campaign"}
                      </span>
                    </div>
                  </TableCell>
                  {/* Leads */}
                  <TableCell className="text-center">
                    <span className="text-sm font-semibold" style={{ color: "hsl(var(--goji-dark))" }}>
                      {c.leadsCount}
                    </span>
                  </TableCell>
                  {/* Connect */}
                  <TableCell className="text-center">
                    <span className="text-sm" style={{ color: "hsl(var(--goji-text-muted))" }}>—</span>
                  </TableCell>
                  {/* Reply */}
                  <TableCell className="text-center">
                    <span className="text-sm" style={{ color: "hsl(var(--goji-text-muted))" }}>—</span>
                  </TableCell>
                  {/* LinkedIn Account */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0"
                        style={{ background: "hsl(220 14% 92%)", color: "hsl(var(--goji-text-muted))" }}
                      >
                        👤
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate" style={{ color: "hsl(var(--goji-dark))" }}>
                          First account
                        </p>
                        <p className="text-[10px] truncate" style={{ color: "hsl(var(--goji-text-muted))" }}>
                          connected
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  {/* Status */}
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{
                          background:
                            c.status === "active"
                              ? "hsl(142 70% 45%)"
                              : c.status === "pending_linkedin"
                              ? "hsl(38 92% 50%)"
                              : "hsl(220 10% 65%)",
                        }}
                      />
                      <span
                        className="text-sm font-medium"
                        style={{
                          color:
                            c.status === "active"
                              ? "hsl(142 70% 35%)"
                              : c.status === "pending_linkedin"
                              ? "hsl(38 80% 35%)"
                              : "hsl(220 10% 50%)",
                        }}
                      >
                        {c.status === "active"
                          ? "Active"
                          : c.status === "pending_linkedin"
                          ? "Pending LinkedIn"
                          : c.status}
                      </span>
                    </div>
                  </TableCell>
                  {/* Created */}
                  <TableCell>
                    <span className="text-sm" style={{ color: "hsl(var(--goji-text-muted))" }}>
                      {new Date(c.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </TableCell>
                  {/* Actions */}
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        className="p-1.5 rounded hover:bg-muted/60 transition-colors"
                        style={{ color: "hsl(var(--goji-text-muted))" }}
                        title="View details"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                          <rect x="3" y="3" width="7" height="7" />
                          <rect x="14" y="3" width="7" height="7" />
                          <rect x="3" y="14" width="7" height="7" />
                          <rect x="14" y="14" width="7" height="7" />
                        </svg>
                      </button>
                      <div className="relative" ref={menuOpen === c.id ? menuRef : undefined}>
                        <button
                          className="p-1.5 rounded hover:bg-muted/60 transition-colors"
                          style={{ color: "hsl(var(--goji-text-muted))" }}
                          title="More"
                          onClick={() => setMenuOpen(menuOpen === c.id ? null : c.id)}
                        >
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                            <circle cx="12" cy="5" r="1.5" />
                            <circle cx="12" cy="12" r="1.5" />
                            <circle cx="12" cy="19" r="1.5" />
                          </svg>
                        </button>
                        {menuOpen === c.id && (
                          <div className="absolute right-0 bottom-full mb-1 w-40 rounded-lg bg-card border border-border shadow-lg z-50 py-1">
                            <button
                              onClick={() => { setMenuOpen(null); navigate(`/onboarding?campaign=${c.id}`); }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteCampaign(c.id)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
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

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useSubscription } from "@/hooks/useSubscription";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from
"@/components/ui/dropdown-menu";
import intentslyIcon from "@/assets/intentsly-icon.png";
import meshGradientBg from "@/assets/mesh-gradient.png";
import { toast } from "sonner";
import { Info, Trash2, Pencil, Play, Pause, MoreVertical, Plus, Users, Zap, TrendingUp, ArrowRight, Bot, Sparkles, Rocket, Mail, BarChart3 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { fadeStagger, fadeStaggerItem, Reveal } from "@/lib/motion";

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

type CampaignWithLeads = Campaign & {leadsCount: number;};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }
  })
};

function StatusBadge({ status }: {status: string;}) {
  const isActive = status === "active";
  const isPaused = status === "paused";
  const isPending = status === "pending_linkedin";

  if (isActive) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] tracking-wider font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        ACTIVE
      </span>);

  }
  if (isPaused) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] tracking-wider font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">
        <span className="w-2 h-2 rounded-full bg-amber-400" />
        PAUSED
      </span>);

  }
  if (isPending) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] tracking-wider font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">
        <span className="w-2 h-2 rounded-full bg-amber-400" />
        PENDING
      </span>);

  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] tracking-wider font-medium px-2 py-0.5 rounded-full bg-md-surface-container text-md-on-surface-variant">
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>);

}

function CampaignCard({
  c, index, onToggle, onEdit, onDelete






}: {c: CampaignWithLeads;index: number;onToggle: () => void;onEdit: () => void;onDelete: () => void;}) {
  const navigate = useNavigate();
  const isActive = c.status === "active";
  const acceptRate = c.invitations_sent > 0 ? Math.round((c.invitations_accepted || 0) / c.invitations_sent * 100) : 0;
  const replyRate = c.invitations_sent > 0 ? Math.round((c.messages_replied || 0) / c.invitations_sent * 100) : 0;

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="group relative rounded-[22px] bg-gradient-to-b from-[#F2F4FE] to-[#FDFDFD] border border-white/55 shadow-[0_1px_2px_rgba(10,10,10,0.03)] hover:shadow-[0_16px_36px_-18px_rgba(10,10,10,0.18)] transition-shadow p-5 flex flex-col md:flex-row md:items-center gap-4 md:gap-8 cursor-pointer"
      onClick={() => navigate(`/campaigns/${c.id}`)}>

      {/* Icon */}
      <div className="w-11 h-11 rounded-xl bg-white ring-1 ring-[#EBECF0] flex items-center justify-center shrink-0">
        <img alt="" className="w-6 h-6 object-contain" src="/lovable-uploads/84a6842d-39a2-4615-a12e-aab711fa1c8d.webp" />
      </div>

      {/* Title & status */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1.5">
          <h3 className="text-[15px] font-medium tracking-[-0.01em] text-[#050E2A] truncate">
            {c.company_name || "My Campaign"}
          </h3>
          <StatusBadge status={c.status} />
        </div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white border border-emerald-200">
          <p className="text-[11.5px] text-emerald-600 font-medium">
            {c.campaign_goal === "demos" ? "Booking demos" : "Starting conversations"}
          </p>
          {c.status === "active" && (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" style={{ animationDelay: "300ms" }} />
            </>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-8 md:gap-10 text-center items-center md:px-6">
        <div>
          <p className="text-[10.5px] text-neutral-500 mb-1 uppercase tracking-[0.14em] font-medium">Leads</p>
          <p className="text-[18px] leading-none text-[#050E2A] font-medium tracking-[-0.02em]">{c.leadsCount}</p>
        </div>
        <div>
          <p className="text-[10.5px] text-neutral-500 mb-1 uppercase tracking-[0.14em] font-medium">Sent</p>
          <p className="text-[18px] leading-none text-[#050E2A] font-medium tracking-[-0.02em]">{c.invitations_sent || 0}</p>
        </div>
        <div>
          <p className="text-[10.5px] text-neutral-500 mb-1 uppercase tracking-[0.14em] font-medium">Connect</p>
          <p className="text-[18px] leading-none text-[#3B82F6] font-medium tracking-[-0.02em]">{acceptRate}%</p>
        </div>
        <div>
          <p className="text-[10.5px] text-neutral-500 mb-1 uppercase tracking-[0.14em] font-medium">Reply</p>
          <p className="text-[18px] leading-none text-emerald-600 font-medium tracking-[-0.02em]">{replyRate}%</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => navigate(`/campaigns/${c.id}`)}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-neutral-800 bg-white border border-[#EBECF0] rounded-full px-4 py-2 hover:bg-neutral-50 transition-colors">
          View leads
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-2 text-neutral-400 hover:text-neutral-700 transition-colors">
              <MoreVertical className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            {!isActive ?
            <DropdownMenuItem onClick={onToggle} className="gap-2 text-sm">
                <Play className="w-3.5 h-3.5 text-green-600" /> Activate
              </DropdownMenuItem> :

            <DropdownMenuItem onClick={onToggle} className="gap-2 text-sm">
                <Pause className="w-3.5 h-3.5" /> Pause
              </DropdownMenuItem>
            }
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
    </motion.div>);

}

export default function CampaignsPage() {
  const navigate = useNavigate();
  const sub = useSubscription();
  const { currentOrg } = useOrganization();
  const [campaigns, setCampaigns] = useState<CampaignWithLeads[]>([]);
  const [loading, setLoading] = useState(true);
  const [meetingsCount, setMeetingsCount] = useState(0);


  const atLimit = campaigns.length >= MAX_CAMPAIGNS;

  const load = async () => {
    if (!currentOrg?.id) { setCampaigns([]); setLoading(false); return; }
    const { data } = await supabase.
    from("campaigns").
    select("id, company_name, status, created_at, campaign_goal, invitations_sent, invitations_accepted, messages_sent, messages_replied, source_agent_id, source_list_id, source_type").
    eq("organization_id", currentOrg.id).
    order("created_at", { ascending: false });
    const rows = (data ?? []) as (Campaign & { source_agent_id: string | null; source_list_id: string | null; source_type: string | null })[];
    const withCounts: CampaignWithLeads[] = await Promise.all(
      rows.map(async (c) => {
        let leadsCount = 0;

        if (c.source_list_id) {
          const { data: listLinks } = await supabase
            .from("contact_lists")
            .select("contact_id")
            .eq("list_id", c.source_list_id);

          leadsCount = (listLinks || []).length;
        } else if (c.source_agent_id) {
          const { data: agentData } = await supabase
            .from("signal_agents")
            .select("leads_list_name")
            .eq("id", c.source_agent_id)
            .single();

          if (agentData?.leads_list_name) {
            const { count } = await supabase
              .from("contacts")
              .select("id", { count: "exact", head: true })
              .eq("organization_id", currentOrg.id)
              .eq("list_name", agentData.leads_list_name);
            leadsCount = count ?? 0;
          }
        }

        const { data: requestData } = await supabase
          .from("campaign_connection_requests" as any)
          .select("status, current_step, last_incoming_message_at")
          .eq("campaign_id", c.id);

        const requests = ((requestData ?? []) as unknown[]) as {
          status: string;
          current_step: number | null;
          last_incoming_message_at: string | null;
        }[];
        const sentCount = requests.filter((request) =>
          ["sent", "accepted", "completed"].includes(request.status)
        ).length;
        const acceptedCount = requests.filter((request) =>
          ["accepted", "completed"].includes(request.status)
        ).length;
        const repliedCount = requests.filter((request) =>
          ["accepted", "completed"].includes(request.status) &&
          (request.current_step ?? 0) >= 2 &&
          Boolean(request.last_incoming_message_at)
        ).length;

        return {
          ...c,
          leadsCount,
          invitations_sent: sentCount,
          invitations_accepted: acceptedCount,
          messages_sent: sentCount,
          messages_replied: repliedCount,
        };
      })
    );
    setCampaigns(withCounts);
    // Load opportunities (meetings) for current org
    const { count: mCount } = await supabase
      .from("meetings")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", currentOrg.id);
    setMeetingsCount(mCount ?? 0);
    setLoading(false);
  };

  useEffect(() => {load();}, [currentOrg?.id]);

  const handleNewCampaign = () => {
    if (atLimit) {toast.error(`You've reached the limit of ${MAX_CAMPAIGNS} campaigns.`);return;}
    navigate("/campaigns/new");
  };

  const handleEditCampaign = (id: string) => {navigate(`/campaigns/new?edit=${id}`)};

  const handleDeleteCampaign = async (id: string) => {
    const { error } = await supabase.from("campaigns").delete().eq("id", id);
    if (error) toast.error("Failed to delete campaign");else
    {setCampaigns((prev) => prev.filter((c) => c.id !== id));toast.success("Campaign deleted");}
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "paused" : "active";
    if (newStatus === "active") {
      if (sub.hadSubscription && !sub.subscribed && !(sub.freeTrialEnabled && sub.hasCard)) {
        toast.error("Your subscription has been canceled. Please upgrade your plan to reactivate campaigns.", {
          action: { label: "Upgrade", onClick: () => navigate("/billing") },
        });
        return;
      }

      if (!sub.subscribed) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { count } = await supabase
            .from("meetings")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id);

          if ((count ?? 0) > 1) {
            toast.error("You have outstanding meetings without an active subscription. Please subscribe to continue.", {
              action: { label: "Subscribe", onClick: () => navigate("/billing") },
            });
            return;
          }
        }

        // Free trial mode: require card only
        if (sub.freeTrialEnabled) {
          if (!sub.hasCard) {
            toast.error("Add your card to activate campaigns.", {
              action: { label: "Add Card", onClick: () => navigate("/signals") },
            });
            return;
          }
        } else {
          // Direct payment mode: must subscribe first
          toast.error("You need an active subscription to activate campaigns.", {
            action: { label: "Subscribe", onClick: () => navigate("/billing") },
          });
          return;
        }
      }
    }
    const { error } = await supabase.from("campaigns").update({ status: newStatus }).eq("id", id);
    if (error) { toast.error("Failed to update campaign status"); return; }
    setCampaigns((prev) => prev.map((c) => c.id === id ? { ...c, status: newStatus } : c));
    toast.success(newStatus === "active" ? "Campaign activated" : "Campaign paused");

    // When activating, immediately enqueue today's leads so the user doesn't wait for the cron.
    if (newStatus === "active") {
      try {
        await supabase.functions.invoke("schedule-daily-leads");
      } catch (e) {
        console.warn("[Campaigns] schedule-daily-leads trigger failed:", e);
      }
    }
  };

  // Summary stats
  const totalLeads = campaigns.reduce((sum, c) => sum + c.leadsCount, 0);
  const activeCampaigns = campaigns.filter((c) => c.status === "active").length;
  const totalSent = campaigns.reduce((sum, c) => sum + (c.invitations_sent || 0), 0);
  const totalAccepted = campaigns.reduce((sum, c) => sum + (c.invitations_accepted || 0), 0);
  const avgAcceptRate = totalSent > 0 ? Math.round(totalAccepted / totalSent * 100) : 0;

  const emptyState =
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className="flex flex-col items-center gap-4 py-20">
    
      <div className="flex items-center gap-6 mb-2">
        {[
      { icon: Bot, label: "Create Agent", color: "hsl(var(--md-primary))" },
      { icon: Sparkles, label: "Build Campaign", color: "hsl(var(--md-secondary))" },
      { icon: Zap, label: "Start Outreach", color: "hsl(var(--md-tertiary))" }].
      map((step, i) =>
      <div key={i} className="flex items-center gap-3">
            {i > 0 && <ArrowRight className="w-4 h-4 text-md-outline-variant" />}
            <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center glass-card ghost-border">
                <step.icon className="w-6 h-6" style={{ color: step.color }} />
              </div>
              <span className="text-xs font-medium text-md-on-surface-variant">{step.label}</span>
            </div>
          </div>
      )}
      </div>
      <p className="text-base font-medium text-md-on-surface mt-2 font-headline">No campaigns yet</p>
      <p className="text-sm text-md-on-surface-variant max-w-md text-center font-light">
        Create your first AI-powered outreach campaign to start connecting with your ideal prospects on LinkedIn.
      </p>
      <button
      onClick={handleNewCampaign}
      className="mt-2 px-6 py-3 rounded-full bg-md-primary text-md-on-primary text-sm font-medium shadow-md hover:opacity-90 transition-opacity flex items-center gap-2">
      
        <Plus className="w-4 h-4" />
        Start your first campaign
      </button>
    </motion.div>;


  return (
    <div className="relative w-full min-h-screen bg-transparent">
      <div className="relative w-full max-w-[1440px] mx-auto px-6 lg:px-8 pt-6 pb-10 bg-transparent">
        <motion.div
          variants={fadeStagger}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-5"
        >
          {/* Header */}
          <motion.header
            variants={fadeStaggerItem}
            className="flex items-end justify-between flex-wrap gap-4 mb-1"
          >
            <div>
              <h1 className="text-[28px] md:text-[32px] leading-[1.1] font-medium tracking-[-0.01em] text-neutral-900">
                Outreach Campaigns
              </h1>
              <p className="mt-2 text-[14.5px] text-neutral-500">
                {loading ? "Loading…" : `${campaigns.length} / ${MAX_CAMPAIGNS} campaigns · `}
                Create and manage your outreach campaigns.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {atLimit && (
                <div className="inline-flex items-center gap-1.5 text-[12.5px] text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-3.5 py-2">
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  Limit reached
                </div>
              )}
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleNewCampaign}
                disabled={atLimit}
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-white bg-[#3B82F6] hover:bg-[#2563eb] disabled:opacity-40 disabled:cursor-not-allowed rounded-full px-4 py-2.5 shadow-[0_6px_16px_-6px_rgba(59,130,246,0.5)] transition-colors"
              >
                <Plus className="w-4 h-4" />
                New campaign
              </motion.button>
            </div>
          </motion.header>

          {/* Summary Stats */}
          {!loading && campaigns.length > 0 && (
            <motion.div
              variants={fadeStaggerItem}
              className="grid grid-cols-2 lg:grid-cols-4 gap-4"
            >
              <MetricCard title="Total Leads" value={totalLeads} accent="blue" icon={Users} onDetails={() => navigate("/contacts")} />
              <MetricCard title="Active Campaigns" value={activeCampaigns} accent="indigo" icon={Rocket} />
              <MetricCard title="Invitations Sent" value={totalSent} accent="lime" icon={Mail} />
              <MetricCard title="Avg Accept Rate" value={`${avgAcceptRate}%`} accent="black" icon={BarChart3} />
            </motion.div>
          )}

          {/* Active Outreach Streams */}
          {!loading && campaigns.length > 0 && (
            <Reveal y={24} className="flex items-end justify-between mt-2">
              <div>
                <h2 className="text-[20px] font-medium tracking-[-0.01em] text-neutral-900">
                  Active outreach streams
                </h2>
                <p className="mt-1 text-[13px] text-neutral-500">
                  {conversationsLabel(totalAccepted)} · {meetingsCount} opportunities booked
                </p>
              </div>
              <span className="text-[13px] text-neutral-500">
                Sort by: <span className="text-[#3B82F6] font-medium cursor-pointer">Efficiency ↓</span>
              </span>
            </Reveal>
          )}

          {/* Campaign Cards */}
          <div className="space-y-3">
            {loading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="rounded-[22px] bg-gradient-to-b from-[#F2F4FE] to-[#FDFDFD] border border-white/55 p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-11 w-11 rounded-xl" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                  <div className="grid grid-cols-4 gap-8">
                    {Array.from({ length: 4 }).map((_, j) => <Skeleton key={j} className="h-10 rounded-lg" />)}
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
        </motion.div>
      </div>
    </div>
  );
}

function conversationsLabel(n: number) {
  return `${n.toLocaleString()} conversation${n === 1 ? "" : "s"} started`;
}

}
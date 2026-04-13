import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from
"@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Info, Trash2, Pencil, Play, Pause, MoreVertical, Plus, Users, Zap, TrendingUp, ArrowRight, Bot, Sparkles, Rocket, Mail, BarChart3 } from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";

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
    <span className="inline-flex items-center gap-1.5 text-[10px] tracking-wider font-medium px-2 py-0.5 rounded-full bg-[#F7F8FA] text-gray-500">
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
      className="bg-[#F7F8FA] rounded-[20px] p-5 hover:bg-[#F0F1F3] transition-colors duration-200 flex flex-col md:flex-row md:items-center gap-4 md:gap-8 cursor-pointer"
      onClick={() => navigate(`/campaigns/${c.id}`)}>
      
      {/* Icon */}
      <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shrink-0">
        <img alt="" className="w-6 h-6 object-contain" src="/lovable-uploads/84a6842d-39a2-4615-a12e-aab711fa1c8d.webp" />
      </div>

      {/* Title & status */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
          <h3 className="text-sm font-semibold text-gray-900 truncate">
            {c.company_name || "My Campaign"}
          </h3>
          <StatusBadge status={c.status} />
        </div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F7F8FA] text-gray-600">
          <p className="text-xs font-medium">
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
      <div className="grid grid-cols-4 gap-8 md:gap-12 text-center items-center md:px-8">
        <div>
          <p className="text-xs text-gray-500 mb-1">Leads</p>
          <p className="text-lg font-semibold text-gray-900">{c.leadsCount}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Sent</p>
          <p className="text-lg font-semibold text-gray-900">{c.invitations_sent || 0}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Connect</p>
          <p className="text-lg font-semibold text-gray-900">{acceptRate}%</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Reply</p>
          <p className="text-lg font-semibold text-gray-900">{replyRate}%</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => navigate(`/campaigns/${c.id}`)}
          className="px-4 py-2 rounded-xl bg-black text-white text-xs font-medium hover:bg-gray-800 transition-colors">
          View Leads
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-2 text-gray-400 hover:text-gray-900 transition-colors">
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
  const [campaigns, setCampaigns] = useState<CampaignWithLeads[]>([]);
  const [loading, setLoading] = useState(true);
  

  const atLimit = campaigns.length >= MAX_CAMPAIGNS;

  const load = async () => {
    const { data } = await supabase.
    from("campaigns").
    select("id, company_name, status, created_at, campaign_goal, invitations_sent, invitations_accepted, messages_sent, messages_replied, source_agent_id, source_list_id, source_type").
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
    setLoading(false);
  };

  useEffect(() => {load();}, []);

  const handleNewCampaign = () => {
    if (atLimit) {toast.error(`You've reached the limit of ${MAX_CAMPAIGNS} campaigns.`);return;}
    navigate("/campaigns/new");
  };

  const handleEditCampaign = (id: string) => { navigate(`/campaigns/new?edit=${id}`); };

  const handleDeleteCampaign = async (id: string) => {
    const { error } = await supabase.from("campaigns").delete().eq("id", id);
    if (error) toast.error("Failed to delete campaign");else
    {setCampaigns((prev) => prev.filter((c) => c.id !== id));toast.success("Campaign deleted");}
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "paused" : "active";
    if (newStatus === "active") {
      if (sub.hadSubscription && !sub.subscribed) {
        toast.error("Your subscription has been canceled. Please upgrade your plan to reactivate campaigns.", {
          action: { label: "Upgrade", onClick: () => navigate("/billing") },
        });
        return;
      }
      if (!sub.subscribed && !sub.hasCard) {
        toast.error("Add your card to activate campaigns.", {
          action: { label: "Add Card", onClick: () => navigate("/signals") },
        });
        return;
      }
    }
    const { error } = await supabase.from("campaigns").update({ status: newStatus }).eq("id", id);
    if (error) toast.error("Failed to update campaign status");else
    {setCampaigns((prev) => prev.map((c) => c.id === id ? { ...c, status: newStatus } : c));toast.success(newStatus === "active" ? "Campaign activated" : "Campaign paused");}
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
      { icon: Bot, label: "Create Agent" },
      { icon: Sparkles, label: "Build Campaign" },
      { icon: Zap, label: "Start Outreach" }].
      map((step, i) =>
      <div key={i} className="flex items-center gap-3">
            {i > 0 && <ArrowRight className="w-4 h-4 text-gray-400" />}
            <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-[20px] flex items-center justify-center bg-[#F7F8FA]">
                <step.icon className="w-6 h-6 text-gray-600" />
              </div>
              <span className="text-xs font-medium text-gray-500">{step.label}</span>
            </div>
          </div>
      )}
      </div>
      <p className="text-base font-semibold text-gray-900 mt-2">No campaigns yet</p>
      <p className="text-sm text-gray-500 max-w-md text-center">
        Create your first AI-powered outreach campaign to start connecting with your ideal prospects on LinkedIn.
      </p>
      <button
      onClick={handleNewCampaign}
      className="mt-2 px-6 py-3 rounded-xl bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2">
        <Plus className="w-4 h-4" />
        Start your first campaign
      </button>
    </motion.div>;


  return (
    <div className="min-h-full px-6 py-6 bg-white">
      
      {/* Header */}
      <header className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 mb-1">
            Outreach Campaigns
          </h1>
          <p className="text-sm text-gray-500">
            {loading ? "Loading..." : `${campaigns.length} / ${MAX_CAMPAIGNS} campaigns · `}
            Create and manage your outreach campaigns
          </p>
        </div>
        <div className="flex gap-3">
          {atLimit &&
          <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-4 py-2">
              <Info className="w-3.5 h-3.5 shrink-0" />
              Limit reached
            </div>
          }
          <button
            onClick={handleNewCampaign}
            disabled={atLimit}
            className="px-6 py-2.5 rounded-xl bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
            Start a campaign
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Summary Stats */}
      {!loading && campaigns.length > 0 &&
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <MetricCard title="Total Leads" value={totalLeads} bgColor="bg-[#EDEEFC]" />
          <MetricCard title="Active Campaigns" value={activeCampaigns} bgColor="bg-[#E6F1FD]" />
          <MetricCard title="Invitations Sent" value={totalSent.toLocaleString()} bgColor="bg-[#e8f0fb]" />
          <MetricCard title="Avg Accept Rate" value={`${avgAcceptRate}%`} bgColor="bg-[#E6F1FD]" />
        </motion.div>
      }

      {/* Active Outreach Streams */}
      {!loading && campaigns.length > 0 &&
      <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-semibold text-gray-900">Active Outreach Streams</h2>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>Sort by: <span className="text-gray-900 font-medium cursor-pointer">Efficiency ↓</span></span>
            </div>
          </div>
        </section>
      }

      {/* Campaign Cards */}
      <div className="space-y-4">
        {loading ?
        Array.from({ length: 2 }).map((_, i) =>
        <div key={i} className="bg-[#F7F8FA] rounded-[20px] p-5 space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-xl" />
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
        ) :
        campaigns.length === 0 ?
        emptyState :

        <AnimatePresence>
            {campaigns.map((c, i) =>
          <CampaignCard
            key={c.id}
            c={c}
            index={i}
            onToggle={() => handleToggleStatus(c.id, c.status)}
            onEdit={() => handleEditCampaign(c.id)}
            onDelete={() => handleDeleteCampaign(c.id)} />
          )}
          </AnimatePresence>
        }
      </div>

    </div>);
}

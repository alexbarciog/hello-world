import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from
"@/components/ui/dropdown-menu";
import gojiIcon from "@/assets/gojiberry-icon.png";
import { toast } from "sonner";
import { Info, Trash2, Pencil, Play, Pause, MoreVertical, Plus, Users, Zap, TrendingUp, ArrowRight, Bot, Sparkles, Rocket, Mail, BarChart3 } from "lucide-react";
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
  const replyRate = c.messages_sent > 0 ? Math.round((c.messages_replied || 0) / c.messages_sent * 100) : 0;

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="glass-card rounded-2xl p-5 ghost-border hover:shadow-xl hover:shadow-md-primary/5 transition-all duration-300 flex flex-col md:flex-row md:items-center gap-4 md:gap-8 cursor-pointer"
      onClick={() => navigate(`/campaigns/${c.id}`)}>
      
      {/* Icon */}
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-md-primary/10 to-md-secondary/10 flex items-center justify-center shrink-0">
        <img alt="" className="w-6 h-6 object-contain" src="/lovable-uploads/84a6842d-39a2-4615-a12e-aab711fa1c8d.webp" />
      </div>

      {/* Title & status */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
          <h3 className="font-headline font-normal text-md-on-surface truncate">
            {c.company_name || "My Campaign"}
          </h3>
          <StatusBadge status={c.status} />
        </div>
        <p className="text-xs text-md-on-surface-variant font-light">
          {c.campaign_goal === "demos" ? "Book demos" : "Start conversations"}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-8 md:gap-12 text-center items-center md:px-8">
        <div>
          <p className="text-[10px] text-md-outline font-medium mb-1 uppercase tracking-widest">Leads</p>
          <p className="text-lg font-light text-md-on-surface">{c.leadsCount}</p>
        </div>
        <div>
          <p className="text-[10px] text-md-outline font-medium mb-1 uppercase tracking-widest">Sent</p>
          <p className="text-lg font-light text-md-on-surface">{c.invitations_sent || 0}</p>
        </div>
        <div>
          <p className="text-[10px] text-md-outline font-medium mb-1 uppercase tracking-widest">Connect</p>
          <p className="text-lg font-light text-md-primary">{acceptRate}%</p>
        </div>
        <div>
          <p className="text-[10px] text-md-outline font-medium mb-1 uppercase tracking-widest">Reply</p>
          <p className="text-lg font-light text-md-secondary">{replyRate}%</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => navigate(`/campaigns/${c.id}`)}
          className="px-5 py-2 rounded-full bg-white/80 ghost-border text-xs font-medium hover:bg-white transition-colors">
          
          View Leads
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-2 text-md-outline hover:text-md-on-surface transition-colors">
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
  const [campaigns, setCampaigns] = useState<CampaignWithLeads[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [editCampaignId, setEditCampaignId] = useState<string | null>(null);

  const atLimit = campaigns.length >= MAX_CAMPAIGNS;

  const load = async () => {
    const { data } = await supabase.
    from("campaigns").
    select("id, company_name, status, created_at, campaign_goal, invitations_sent, invitations_accepted, messages_sent, messages_replied").
    order("created_at", { ascending: false });
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

  useEffect(() => {load();}, []);

  const handleNewCampaign = () => {
    if (atLimit) {toast.error(`You've reached the limit of ${MAX_CAMPAIGNS} campaigns.`);return;}
    setEditCampaignId(null);
    setShowWizard(true);
  };

  const handleEditCampaign = (id: string) => {setEditCampaignId(id);setShowWizard(true);};

  const handleDeleteCampaign = async (id: string) => {
    const { error } = await supabase.from("campaigns").delete().eq("id", id);
    if (error) toast.error("Failed to delete campaign");else
    {setCampaigns((prev) => prev.filter((c) => c.id !== id));toast.success("Campaign deleted");}
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "paused" : "active";
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
    <div
      className="min-h-full rounded-2xl m-3 md:m-4 p-6 md:p-10 font-body bg-white">
      
      {/* Header */}
      <header className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-headline font-light tracking-tight text-md-on-surface mb-2">
            Campaign Intelligence
          </h1>
          <p className="text-md-on-surface-variant font-light">
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
            className="px-6 py-2.5 rounded-full bg-md-primary text-md-on-primary text-sm font-medium shadow-md shadow-md-primary/10 hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
            
            <Plus className="w-4 h-4" />
            Start a campaign
          </button>
        </div>
      </header>

      {/* Summary Stats */}
      {!loading && campaigns.length > 0 &&
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
        
          {[
        { label: "Total Leads", value: totalLeads, icon: Users, iconBg: "from-md-primary/10 to-md-secondary/10" },
        { label: "Active Campaigns", value: activeCampaigns, icon: Rocket, iconBg: "from-emerald-100/60 to-emerald-50/40" },
        { label: "Invitations Sent", value: totalSent.toLocaleString(), icon: Mail, iconBg: "from-md-secondary/10 to-md-primary/5" },
        { label: "Avg Accept Rate", value: `${avgAcceptRate}%`, icon: BarChart3, iconBg: "from-md-tertiary-fixed/30 to-md-tertiary-fixed/10" }].
        map((stat) =>
        <div key={stat.label} className="glass-card rounded-2xl p-6 ghost-border flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.iconBg} flex items-center justify-center`}>
                  <stat.icon className="w-5 h-5 text-md-primary" />
                </div>
              </div>
              <div>
                <p className="text-md-on-surface-variant text-sm font-light mb-1">{stat.label}</p>
                <p className="text-2xl font-headline tracking-tight text-md-on-surface">{stat.value}</p>
              </div>
            </div>
        )}
        </motion.div>
      }

      {/* Active Outreach Streams */}
      {!loading && campaigns.length > 0 &&
      <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-headline font-light tracking-tight text-md-on-surface">Active Outreach Streams</h2>
            <div className="flex items-center gap-4 text-sm text-md-on-surface-variant">
              <span>Sort by: <span className="text-md-primary font-medium cursor-pointer">Efficiency ↓</span></span>
            </div>
          </div>
        </section>
      }

      {/* Campaign Cards */}
      <div className="space-y-4">
        {loading ?
        Array.from({ length: 2 }).map((_, i) =>
        <div key={i} className="glass-card ghost-border rounded-2xl p-5 space-y-4">
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

      {/* Create/Edit Campaign Wizard */}
      <CreateCampaignWizard
        open={showWizard}
        onOpenChange={setShowWizard}
        editCampaignId={editCampaignId}
        onCreated={(id) => {
          load();
          navigate(`/campaigns/${id}`);
        }} />
      
    </div>);

}
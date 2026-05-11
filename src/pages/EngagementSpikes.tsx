import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Flame, Plus, Clock, MessageSquare, CheckCircle2, XCircle } from "lucide-react";
import ScheduleSpikeWizard from "@/components/spikes/ScheduleSpikeWizard";
import DefaultKeywordsPanel from "@/components/spikes/DefaultKeywordsPanel";
import { toast } from "sonner";

function timeUntil(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "now";
  const m = Math.floor(ms / 60000);
  if (m < 60) return `in ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `in ${h}h ${m % 60}m`;
  return `in ${Math.floor(h / 24)}d`;
}

const STATUS_PILL: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  discovering: "bg-blue-50 text-blue-600",
  ready: "bg-amber-50 text-amber-700",
  running: "bg-emerald-50 text-emerald-700",
  completed: "bg-gray-100 text-gray-600",
  failed: "bg-rose-50 text-rose-600",
  cancelled: "bg-gray-100 text-gray-500",
};

export default function EngagementSpikes() {
  const [wizardOpen, setWizardOpen] = useState(false);
  const navigate = useNavigate();

  const { data: spikes = [], refetch } = useQuery({
    queryKey: ["engagement-spikes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("engagement_spikes")
        .select("id, scheduled_for, target_count, status, keywords, created_at")
        .order("scheduled_for", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const groups = {
    upcoming: spikes.filter(s => ["draft", "discovering", "ready"].includes(s.status) && new Date(s.scheduled_for).getTime() > Date.now()),
    live: spikes.filter(s => s.status === "running"),
    done: spikes.filter(s => ["completed", "failed", "cancelled"].includes(s.status)),
  };

  const cancel = async (id: string) => {
    const { error } = await supabase.functions.invoke("cancel-engagement-spike", { body: { spike_id: id } });
    if (error) toast.error(error.message);
    else { toast.success("Spike cancelled"); refetch(); }
  };

  const Card = ({ s }: { s: any }) => (
    <div className="snow-card p-5 flex items-center justify-between gap-4 hover:shadow-sm transition-shadow cursor-pointer"
      onClick={() => navigate(`/engagement-spikes/${s.id}`)}>
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
          <Flame className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-gray-900">
              {new Date(s.scheduled_for).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
            <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${STATUS_PILL[s.status]}`}>
              {s.status}
            </span>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />{timeUntil(s.scheduled_for)}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1 truncate">
            <MessageSquare className="w-3 h-3 inline mr-1" />
            {s.target_count} comments · {(s.keywords || []).slice(0, 3).join(", ")}
          </p>
        </div>
      </div>
      {["draft", "discovering", "ready", "running"].includes(s.status) && (
        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); cancel(s.id); }}>
          Cancel
        </Button>
      )}
    </div>
  );

  const empty = (
    <div className="text-center py-16 text-sm text-muted-foreground">
      No spikes here yet.
    </div>
  );

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Flame className="w-6 h-6 text-orange-500" />
              Engagement Spikes
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Schedule a burst of human-sounding comments on relevant LinkedIn posts right before a key moment.
            </p>
          </div>
          <Button onClick={() => setWizardOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Schedule a spike
          </Button>
        </div>

        <Tabs defaultValue="upcoming">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming ({groups.upcoming.length})</TabsTrigger>
            <TabsTrigger value="live">Live ({groups.live.length})</TabsTrigger>
            <TabsTrigger value="done">Completed ({groups.done.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="upcoming" className="space-y-3 mt-4">
            {groups.upcoming.length === 0 ? empty : groups.upcoming.map(s => <Card key={s.id} s={s} />)}
          </TabsContent>
          <TabsContent value="live" className="space-y-3 mt-4">
            {groups.live.length === 0 ? empty : groups.live.map(s => <Card key={s.id} s={s} />)}
          </TabsContent>
          <TabsContent value="done" className="space-y-3 mt-4">
            {groups.done.length === 0 ? empty : groups.done.map(s => <Card key={s.id} s={s} />)}
          </TabsContent>
        </Tabs>
      </div>

      <ScheduleSpikeWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onCreated={(id) => { refetch(); navigate(`/engagement-spikes/${id}`); }}
      />
    </DashboardLayout>
  );
}

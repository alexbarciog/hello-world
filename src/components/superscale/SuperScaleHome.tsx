import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Eye, Heart, Trophy, ArrowRight } from "lucide-react";

export default function SuperScaleHome({ onNavigate }: { onNavigate: (v: any, id?: string | null) => void }) {
  const [posts, setPosts] = useState<any[]>([]);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [scheduled, setScheduled] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data: all } = await supabase
        .from("linkedin_posts")
        .select("*")
        .eq("user_id", u.user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      setPosts(all || []);
      setDrafts((all || []).filter((p) => p.status === "draft").slice(0, 6));
      setScheduled((all || []).filter((p) => p.status === "scheduled").sort((a, b) => +new Date(a.scheduled_for) - +new Date(b.scheduled_for)).slice(0, 5));
    })();
  }, []);

  const sent = posts.filter((p) => p.status === "posted");
  const totalLikes = sent.reduce((s, p) => s + (p.metrics?.likes || 0), 0);
  const totalImpressions = sent.reduce((s, p) => s + (p.metrics?.views || 0), 0);
  const topPost = sent.sort((a, b) => (b.metrics?.views || 0) - (a.metrics?.views || 0))[0];

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-black/[0.04]">
          <div className="text-xs text-foreground/50 mb-2 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" /> Posts published</div>
          <div className="text-4xl font-bold tracking-tight">{sent.length}</div>
          <div className="text-xs text-foreground/40 mt-2">Lifetime on SuperScale</div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-4 border border-black/[0.04]">
            <div className="text-[11px] text-foreground/50 mb-1 flex items-center gap-1.5"><Eye className="w-3 h-3" /> Impressions</div>
            <div className="text-2xl font-bold">{totalImpressions || "—"}</div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-black/[0.04]">
            <div className="text-[11px] text-foreground/50 mb-1 flex items-center gap-1.5"><Heart className="w-3 h-3" /> Engagements</div>
            <div className="text-2xl font-bold">{totalLikes || "—"}</div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-black/[0.04]">
            <div className="text-[11px] text-foreground/50 mb-1 flex items-center gap-1.5"><Trophy className="w-3 h-3" /> Top post</div>
            <div className="text-sm font-semibold truncate">{topPost ? `${topPost.metrics?.views || 0} views` : "—"}</div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-black/[0.04]">
            <div className="text-[11px] text-foreground/50 mb-1">Scheduled</div>
            <div className="text-2xl font-bold">{scheduled.length}</div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-bold mb-3">My queue</h2>
        <div className="bg-white rounded-2xl border border-black/[0.04] divide-y divide-black/[0.04]">
          {scheduled.length === 0 && <div className="p-6 text-sm text-foreground/40 text-center">Nothing scheduled. Compose a post to get started.</div>}
          {scheduled.map((p) => (
            <button key={p.id} onClick={() => onNavigate("compose", p.id)} className="w-full text-left flex items-center gap-4 p-4 hover:bg-black/[0.02] transition-colors">
              <div className="text-xs text-foreground/50 w-32 shrink-0 font-medium">{new Date(p.scheduled_for).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</div>
              <div className="text-sm text-foreground/80 truncate flex-1">{p.content.slice(0, 120) || "Empty post"}</div>
              {p.comments_spike_enabled && <span className="text-[10px] font-semibold uppercase bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">Spike</span>}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Ready to post</h2>
          <button onClick={() => onNavigate("drafts")} className="text-xs text-foreground/50 hover:text-foreground flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {drafts.length === 0 && <div className="col-span-2 bg-white rounded-2xl p-6 text-sm text-foreground/40 text-center border border-black/[0.04]">No drafts yet. Visit <span className="font-semibold">Inspiration</span> to remix viral posts.</div>}
          {drafts.map((d) => (
            <div key={d.id} className="bg-white rounded-2xl p-5 border border-black/[0.04]">
              <p className="text-sm text-foreground/80 line-clamp-5 mb-3 whitespace-pre-wrap">{d.content || "Empty draft"}</p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-foreground/40">{new Date(d.created_at).toLocaleDateString()}</span>
                <button onClick={() => onNavigate("compose", d.id)} className="text-xs font-semibold bg-black text-white px-3 py-1.5 rounded-lg hover:opacity-80">Edit post</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

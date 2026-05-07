import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Heart, MessageCircle, Repeat2, Loader2, ExternalLink, Wand2, Link2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  onRemixed: (postId: string) => void;
}

export default function Inspiration({ onRemixed }: Props) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [remixing, setRemixing] = useState<string | null>(null);
  const [cloneUrl, setCloneUrl] = useState("");
  const [cloning, setCloning] = useState(false);
  const [cloneSummary, setCloneSummary] = useState<string | null>(null);

  async function cloneCreator() {
    if (!cloneUrl.trim()) return;
    setCloning(true);
    setCloneSummary(null);
    const { data, error } = await supabase.functions.invoke("superscale-clone-creator", {
      body: { profile_url: cloneUrl.trim() },
    });
    setCloning(false);
    if (error || !data?.ok) {
      toast.error((data as any)?.error || "Couldn't clone this creator");
      return;
    }
    setCloneSummary(data.summary || `Cloned ${data.posts_analyzed} posts. Cadence saved.`);
    toast.success("Strategy cloned — cadence saved to Calendar");
    setCloneUrl("");
    await load();
  }

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("superscale_inspirations")
      .select("*")
      .eq("dismissed", false)
      .order("likes", { ascending: false })
      .limit(60);
    setItems(data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function discover() {
    setLoading(true);
    const { error } = await supabase.functions.invoke("superscale-discover-inspiration");
    if (error) toast.error("Discovery failed");
    else toast.success("Inspiration refreshed");
    await load();
  }

  async function remix(id: string) {
    setRemixing(id);
    const { data, error } = await supabase.functions.invoke("superscale-remix-post", {
      body: { inspiration_id: id },
    });
    setRemixing(null);
    if (error || !data?.post_id) {
      toast.error("Remix failed");
      return;
    }
    onRemixed(data.post_id);
  }

  async function dismiss(id: string) {
    await supabase.from("superscale_inspirations").update({ dismissed: true }).eq("id", id);
    setItems((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inspiration</h1>
          <p className="text-sm text-foreground/60 mt-1">Viral LinkedIn posts in your industry — remix into your voice.</p>
        </div>
        <button
          onClick={discover}
          disabled={loading}
          className="rounded-lg bg-foreground text-background text-sm font-semibold px-4 py-2 hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Discover new
        </button>
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-rose-50 to-orange-50 border border-rose-100 p-5 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Wand2 className="w-4 h-4 text-rose-600" />
          <h3 className="text-sm font-bold">Clone a creator's strategy</h3>
        </div>
        <p className="text-xs text-foreground/60 mb-3">
          Paste a LinkedIn profile URL — we'll analyze their last 30 posts and copy their cadence, post types, and timing into your Calendar.
        </p>
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 rounded-lg bg-white border border-black/[0.06] px-3">
            <Link2 className="w-4 h-4 text-foreground/40 shrink-0" />
            <input
              value={cloneUrl}
              onChange={(e) => setCloneUrl(e.target.value)}
              placeholder="https://linkedin.com/in/their-handle"
              className="flex-1 bg-transparent py-2 text-sm outline-none"
              disabled={cloning}
            />
          </div>
          <button
            onClick={cloneCreator}
            disabled={cloning || !cloneUrl.trim()}
            className="rounded-lg bg-gradient-to-br from-rose-500 to-orange-500 text-white text-sm font-semibold px-4 py-2 hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
          >
            {cloning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            Clone strategy
          </button>
        </div>
        {cloneSummary && (
          <p className="mt-3 text-xs text-foreground/70 bg-white/70 rounded-md px-3 py-2">{cloneSummary}</p>
        )}
      </div>

      {loading && items.length === 0 ? (
        <div className="text-sm text-foreground/50">Loading…</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-black/10 p-12 text-center">
          <Sparkles className="w-8 h-8 mx-auto text-foreground/30 mb-3" />
          <p className="text-sm text-foreground/60">No inspirations yet. Click "Discover new" to fetch viral posts.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((p) => (
            <div key={p.id} className="rounded-xl bg-white border border-black/[0.06] p-5 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold">{p.author_name || "Unknown"}</div>
                {p.source_post_url && (
                  <a href={p.source_post_url} target="_blank" rel="noreferrer" className="text-foreground/40 hover:text-foreground">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
              <p className="text-sm text-foreground/80 whitespace-pre-wrap line-clamp-6 flex-1">{p.content}</p>
              <div className="flex items-center gap-4 mt-3 text-xs text-foreground/50">
                <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> {p.likes ?? 0}</span>
                <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" /> {p.comments ?? 0}</span>
                <span className="flex items-center gap-1"><Repeat2 className="w-3.5 h-3.5" /> {p.reposts ?? 0}</span>
                {p.format_tag && <span className="ml-auto px-2 py-0.5 rounded-full bg-black/[0.04]">{p.format_tag}</span>}
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => remix(p.id)}
                  disabled={remixing === p.id}
                  className="flex-1 rounded-lg bg-gradient-to-br from-rose-500 to-orange-500 text-white text-xs font-semibold py-2 hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {remixing === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  Remix for me
                </button>
                <button
                  onClick={() => dismiss(p.id)}
                  className="rounded-lg bg-black/[0.04] text-foreground/60 text-xs font-medium px-3 py-2 hover:bg-black/[0.06]"
                >
                  Skip
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Pencil, Trash2, ExternalLink, Clock, CheckCircle2, AlertCircle, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface Props {
  onEdit: (id: string) => void;
}

type Tab = "draft" | "scheduled" | "posted" | "failed";

const tabs: { id: Tab; label: string; icon: any }[] = [
  { id: "draft", label: "Drafts", icon: FileText },
  { id: "scheduled", label: "Scheduled", icon: Clock },
  { id: "posted", label: "Sent", icon: CheckCircle2 },
  { id: "failed", label: "Failed", icon: AlertCircle },
];

export default function Drafts({ onEdit }: Props) {
  const [tab, setTab] = useState<Tab>("draft");
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("linkedin_posts")
      .select("*")
      .eq("status", tab)
      .order("created_at", { ascending: false })
      .limit(50);
    setPosts(data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [tab]);

  async function remove(id: string) {
    await supabase.from("linkedin_posts").delete().eq("id", id);
    setPosts((prev) => prev.filter((p) => p.id !== id));
    toast.success("Deleted");
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Drafts & Sent</h1>
        <p className="text-sm text-foreground/60 mt-1">Manage your post pipeline.</p>
      </div>

      <div className="flex gap-1 mb-5 border-b border-black/[0.06]">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                active ? "border-foreground text-foreground" : "border-transparent text-foreground/50 hover:text-foreground"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="text-sm text-foreground/50">Loading…</div>
      ) : posts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-black/10 p-12 text-center">
          <p className="text-sm text-foreground/60">No {tab} posts.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => (
            <div key={p.id} className="rounded-xl bg-white border border-black/[0.06] p-5 flex gap-4">
              {p.image_url && (
                <img src={p.image_url} alt="" className="w-20 h-20 rounded-lg object-cover shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground/80 line-clamp-3 whitespace-pre-wrap">{p.content}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-foreground/50">
                  {p.scheduled_for && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {tab === "posted" ? "Sent " : ""}
                      {formatDistanceToNow(new Date(p.posted_at || p.scheduled_for), { addSuffix: true })}
                    </span>
                  )}
                  {p.comments_spike_enabled && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600">Comments spike</span>
                  )}
                  {p.error && <span className="text-rose-600 truncate">{p.error}</span>}
                </div>
              </div>
              <div className="flex items-start gap-1.5 shrink-0">
                {p.post_url && (
                  <a
                    href={p.post_url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-md text-foreground/50 hover:bg-black/[0.04] hover:text-foreground"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                {tab !== "posted" && (
                  <button
                    onClick={() => onEdit(p.id)}
                    className="p-2 rounded-md text-foreground/50 hover:bg-black/[0.04] hover:text-foreground"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => remove(p.id)}
                  className="p-2 rounded-md text-foreground/50 hover:bg-black/[0.04] hover:text-rose-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

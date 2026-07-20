import { useEffect } from "react";
import { externalLinkProps } from "@/lib/openExternal";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Flame, ArrowLeft, Check, ExternalLink, RefreshCw, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const STATUS_PILL: Record<string, string> = {
  drafted: "bg-blue-50 text-blue-600",
  approved: "bg-amber-50 text-amber-700",
  sent: "bg-emerald-50 text-emerald-700",
  failed: "bg-rose-50 text-rose-600",
  skipped: "bg-gray-100 text-gray-500",
};

export default function SpikeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const spikeQ = useQuery({
    queryKey: ["spike", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("engagement_spikes").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    refetchInterval: 5000,
  });

  const commentsQ = useQuery({
    queryKey: ["spike-comments", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("engagement_spike_comments")
        .select("*").eq("spike_id", id!).order("scheduled_drop_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 5000,
  });

  const spike = spikeQ.data;
  const comments = commentsQ.data || [];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <button onClick={() => navigate("/engagement-spikes")} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to spikes
        </button>

        {spike && (
          <div className="snow-card p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500">
                  <Flame className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">
                    {new Date(spike.scheduled_for).toLocaleString(undefined, {
                      weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    {spike.target_count} comments · {spike.drop_window_minutes} min window · status: <span className="font-medium text-foreground">{spike.status}</span>
                  </p>
                </div>
              </div>
            </div>
            {spike.error && <p className="mt-3 text-xs text-rose-600">{spike.error}</p>}
          </div>
        )}

        <div className="space-y-3">
          {comments.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-12">
              {spike?.status === "discovering" ? "Finding posts…" : "No comments yet."}
            </p>
          )}
          {comments.map(c => (
            <CommentRow key={c.id} c={c} requireApproval={spike?.require_approval} onChange={() => commentsQ.refetch()} />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

function CommentRow({ c, requireApproval, onChange }: { c: any; requireApproval?: boolean; onChange: () => void }) {
  const [text, setText] = useState(c.comment_text || "");
  const [saving, setSaving] = useState(false);
  const [regen, setRegen] = useState(false);

  useEffect(() => { setText(c.comment_text || ""); }, [c.comment_text]);

  const editable = ["drafted", "approved"].includes(c.status);

  const save = async (status?: string) => {
    setSaving(true);
    const update: any = { comment_text: text, edited_by_user: true };
    if (status) update.status = status;
    const { error } = await supabase.from("engagement_spike_comments").update(update).eq("id", c.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success(status === "approved" ? "Approved" : "Saved"); onChange(); }
  };

  const regenerate = async () => {
    setRegen(true);
    await supabase.from("engagement_spike_comments").update({ comment_text: null, status: "drafted" }).eq("id", c.id);
    const { error } = await supabase.functions.invoke("generate-spike-comments", { body: { comment_id: c.id } });
    setRegen(false);
    if (error) toast.error(error.message); else { toast.success("Regenerated"); onChange(); }
  };

  const skip = async () => {
    await supabase.from("engagement_spike_comments").update({ status: "skipped" }).eq("id", c.id);
    onChange();
  };

  return (
    <div className="snow-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-gray-900">{c.post_author_name || "Unknown author"}</p>
            <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${STATUS_PILL[c.status] || "bg-muted"}`}>
              {c.status}
            </span>
            {c.scheduled_drop_at && (
              <span className="text-[11px] text-gray-400">
                drops {new Date(c.scheduled_drop_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{c.post_snippet}</p>
          {c.post_url && (
            <a {...externalLinkProps(c.post_url)} className="text-[11px] text-blue-600 hover:underline inline-flex items-center gap-0.5 mt-1">
              View post <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {c.status === "sent" ? (
        <p className="text-sm bg-emerald-50/50 rounded-md p-3">{c.comment_text}</p>
      ) : (
        <Textarea
          rows={2}
          value={text}
          onChange={e => setText(e.target.value)}
          disabled={!editable}
          placeholder={c.comment_text ? "" : "Generating…"}
          className="text-sm"
        />
      )}
      {c.error && <p className="text-xs text-rose-600">{c.error}</p>}

      {editable && (
        <div className="flex items-center gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={regenerate} disabled={regen}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${regen ? "animate-spin" : ""}`} /> Regenerate
          </Button>
          <Button variant="ghost" size="sm" onClick={skip}>
            <X className="w-3.5 h-3.5 mr-1" /> Skip
          </Button>
          <Button size="sm" onClick={() => save("approved")} disabled={saving || !text.trim()}>
            <Check className="w-3.5 h-3.5 mr-1" /> {requireApproval ? "Approve" : "Save"}
          </Button>
        </div>
      )}
    </div>
  );
}

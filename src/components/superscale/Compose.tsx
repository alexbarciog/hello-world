import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, Image as ImageIcon, Loader2, X, Calendar as CalendarIcon, Flame } from "lucide-react";

const MAX = 3000;
const WARN = 1300;

export default function Compose({ postId, onSaved }: { postId: string | null; onSaved: () => void }) {
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [scheduledFor, setScheduledFor] = useState("");
  const [spike, setSpike] = useState(false);
  const [loading, setLoading] = useState(false);
  const [genImg, setGenImg] = useState(false);
  const [id, setId] = useState<string | null>(postId);

  useEffect(() => {
    setId(postId);
    if (!postId) { setContent(""); setImageUrl(null); setScheduledFor(""); setSpike(false); return; }
    (async () => {
      const { data } = await supabase.from("linkedin_posts").select("*").eq("id", postId).maybeSingle();
      if (data) {
        setContent(data.content || "");
        setImageUrl(data.image_url);
        setScheduledFor(data.scheduled_for ? new Date(data.scheduled_for).toISOString().slice(0, 16) : "");
        setSpike(!!data.comments_spike_enabled);
      }
    })();
  }, [postId]);

  async function save(status: "draft" | "scheduled") {
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setLoading(false); return; }
    if (status === "scheduled" && !scheduledFor) { toast.error("Pick a schedule time"); setLoading(false); return; }
    const payload: any = {
      user_id: u.user.id,
      content, image_url: imageUrl,
      scheduled_for: status === "scheduled" ? new Date(scheduledFor).toISOString() : null,
      comments_spike_enabled: spike, status,
    };
    let savedId = id;
    if (id) {
      const { error } = await supabase.from("linkedin_posts").update(payload).eq("id", id);
      if (error) { toast.error(error.message); setLoading(false); return; }
    } else {
      const { data, error } = await supabase.from("linkedin_posts").insert(payload).select("id").single();
      if (error) { toast.error(error.message); setLoading(false); return; }
      savedId = data.id; setId(data.id);
    }
    toast.success(status === "scheduled" ? "Scheduled!" : "Draft saved");
    setLoading(false);
    onSaved();
  }

  async function handleUpload(file: File) {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const path = `${u.user.id}/uploads/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("superscale").upload(path, file);
    if (error) { toast.error(error.message); return; }
    const { data } = supabase.storage.from("superscale").getPublicUrl(path);
    setImageUrl(data.publicUrl);
  }

  async function generateImage() {
    if (!content.trim()) { toast.error("Write the post first"); return; }
    setGenImg(true);
    const { data, error } = await supabase.functions.invoke("superscale-generate-image", {
      body: { prompt: content, post_id: id },
    });
    setGenImg(false);
    if (error || data?.error) { toast.error(data?.error || error?.message || "Failed"); return; }
    setImageUrl(data.image_url);
    toast.success("Image generated");
  }

  const len = content.length;
  const overWarn = len > WARN;
  const overMax = len > MAX;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-5">Compose</h1>

      <div className="bg-white rounded-2xl border border-black/[0.04] p-5 mb-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, MAX))}
          placeholder="What do you want to share with your network?"
          className="w-full min-h-[200px] resize-none outline-none text-[15px] leading-relaxed placeholder:text-foreground/30"
        />
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-black/[0.04]">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-foreground/60 cursor-pointer hover:text-foreground flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-black/[0.04]">
              <ImageIcon className="w-4 h-4" /> Upload image
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} />
            </label>
            <button onClick={generateImage} disabled={genImg} className="text-xs font-medium text-foreground/60 hover:text-foreground flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-black/[0.04]">
              {genImg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Generate from my style
            </button>
          </div>
          <span className={`text-xs ${overMax ? "text-red-500 font-semibold" : overWarn ? "text-orange-500" : "text-foreground/40"}`}>{len}/{MAX}</span>
        </div>
        {imageUrl && (
          <div className="mt-3 relative inline-block">
            <img src={imageUrl} alt="" className="rounded-lg max-h-64" />
            <button onClick={() => setImageUrl(null)} className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"><X className="w-3 h-3" /></button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-black/[0.04] p-5 mb-4 space-y-4">
        <div>
          <label className="text-xs font-semibold text-foreground/60 mb-1.5 flex items-center gap-1.5"><CalendarIcon className="w-3.5 h-3.5" /> Schedule</label>
          <input type="datetime-local" value={scheduledFor} onChange={(e) => setScheduledFor(e.target.value)} className="w-full text-sm border border-black/10 rounded-lg px-3 py-2 outline-none focus:border-black/30" />
        </div>
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={spike} onChange={(e) => setSpike(e.target.checked)} className="mt-0.5 w-4 h-4 accent-orange-500" />
          <div>
            <div className="text-sm font-semibold flex items-center gap-1.5"><Flame className="w-3.5 h-3.5 text-orange-500" /> Trigger Comments Spike</div>
            <div className="text-xs text-foreground/50">~30 min after publish, 8 AI-drafted human-sounding comments will land on similar posts in your space — driving discovery to yours.</div>
          </div>
        </label>
      </div>

      <div className="flex items-center gap-3 justify-end">
        <button onClick={() => save("draft")} disabled={loading || overMax} className="text-sm font-medium px-4 py-2 rounded-lg border border-black/10 hover:bg-black/5 disabled:opacity-40">Save draft</button>
        <button onClick={() => save("scheduled")} disabled={loading || overMax || !content.trim()} className="text-sm font-semibold px-5 py-2 rounded-lg bg-gradient-to-br from-rose-500 to-orange-500 text-white hover:opacity-90 disabled:opacity-40">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Schedule post"}
        </button>
      </div>
    </div>
  );
}

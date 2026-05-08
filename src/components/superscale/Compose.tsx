import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, Image as ImageIcon, Loader2, X, Calendar as CalendarIcon, Flame, Zap } from "lucide-react";
import GenerateImageDialog from "./GenerateImageDialog";

const MAX = 3000;
const WARN = 1300;

export default function Compose({ postId, onSaved }: { postId: string | null; onSaved: () => void }) {
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [scheduledFor, setScheduledFor] = useState("");
  const [spike, setSpike] = useState(false);
  const [loading, setLoading] = useState(false);
  const [id, setId] = useState<string | null>(postId);
  const [pickingSlot, setPickingSlot] = useState(false);
  const [nextSlotLabel, setNextSlotLabel] = useState<string | null>(null);
  const [genOpen, setGenOpen] = useState(false);

  function toLocalInput(d: Date) {
    const tz = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tz).toISOString().slice(0, 16);
  }

  async function pickNextSlot() {
    setPickingSlot(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data: cadence } = await supabase
        .from("superscale_cadence")
        .select("*")
        .eq("user_id", u.user.id)
        .eq("enabled", true);
      const { data: existing } = await supabase
        .from("linkedin_posts")
        .select("scheduled_for")
        .eq("user_id", u.user.id)
        .in("status", ["scheduled", "draft"])
        .not("scheduled_for", "is", null);

      const taken = new Set(
        (existing || [])
          .map((p: any) => (p.scheduled_for ? new Date(p.scheduled_for).getTime() : 0))
          .filter(Boolean)
      );

      const enabledByDow: Record<number, any> = {};
      (cadence || []).forEach((c: any) => (enabledByDow[c.day_of_week] = c));

      if (!Object.keys(enabledByDow).length) {
        toast.error("Set your cadence in Calendar first");
        return;
      }

      const now = new Date();
      for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
        const day = new Date(now);
        day.setDate(now.getDate() + dayOffset);
        const dow = (day.getDay() + 6) % 7; // Mon=0
        const c = enabledByDow[dow];
        if (!c) continue;
        const [h, m] = (c.first_slot || "09:00").split(":").map(Number);
        for (let i = 0; i < (c.post_count || 1); i++) {
          const slot = new Date(day);
          slot.setHours(h, m, 0, 0);
          slot.setMinutes(slot.getMinutes() + i * (c.delay_minutes || 240));
          if (slot.getTime() <= now.getTime() + 5 * 60000) continue;
          // round to minute for collision check
          let collision = false;
          for (const t of taken) {
            if (Math.abs(t - slot.getTime()) < 30 * 60000) { collision = true; break; }
          }
          if (collision) continue;
          setScheduledFor(toLocalInput(slot));
          if (c.comments_spike_enabled) setSpike(true);
          setNextSlotLabel(slot.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }));
          toast.success("Slot selected from your cadence");
          return;
        }
      }
      toast.error("No free slot found in the next 2 weeks");
    } finally {
      setPickingSlot(false);
    }
  }

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

  function openGenerate() {
    if (!content.trim()) { toast.error("Write the post first"); return; }
    setGenOpen(true);
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
        <div className="flex items-center justify-end mt-3 pt-3 border-t border-black/[0.04]">
          <span className={`text-xs ${overMax ? "text-red-500 font-semibold" : overWarn ? "text-orange-500" : "text-foreground/40"}`}>{len}/{MAX}</span>
        </div>

        {imageUrl ? (
          <div className="mt-3 relative inline-block">
            <img src={imageUrl} alt="" className="rounded-lg max-h-64" />
            <button onClick={() => setImageUrl(null)} className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"><X className="w-3 h-3" /></button>
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="group cursor-pointer flex flex-col items-center justify-center gap-1.5 py-5 rounded-xl border border-dashed border-black/10 hover:border-black/30 hover:bg-black/[0.02] transition">
              <ImageIcon className="w-5 h-5 text-foreground/50 group-hover:text-foreground" />
              <span className="text-xs font-medium text-foreground/70 group-hover:text-foreground">Upload image</span>
              <span className="text-[10px] text-foreground/40">PNG, JPG up to 5MB</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} />
            </label>
            <button
              onClick={openGenerate}
              type="button"
              className="group flex flex-col items-center justify-center gap-1.5 py-5 rounded-xl border border-dashed border-black/10 hover:border-orange-400/50 hover:bg-gradient-to-br hover:from-rose-50 hover:to-orange-50 transition"
            >
              <Sparkles className="w-5 h-5 text-orange-500" />
              <span className="text-xs font-medium text-foreground/70 group-hover:text-foreground">Generate from design refs</span>
              <span className="text-[10px] text-foreground/40">Pick from 3 AI variants</span>
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-black/[0.04] p-5 mb-4 space-y-4">
        <div>
          <label className="text-xs font-semibold text-foreground/60 mb-1.5 flex items-center gap-1.5"><CalendarIcon className="w-3.5 h-3.5" /> Schedule</label>
          <input type="datetime-local" value={scheduledFor} onChange={(e) => setScheduledFor(e.target.value)} className="w-full text-sm border border-black/10 rounded-lg px-3 py-2 outline-none focus:border-black/30" />
          <button
            type="button"
            onClick={pickNextSlot}
            disabled={pickingSlot}
            className="mt-2 text-xs font-medium text-foreground/70 hover:text-foreground inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/[0.04] hover:bg-black/[0.07] disabled:opacity-50"
          >
            {pickingSlot ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 text-orange-500" />}
            {nextSlotLabel ? `Next slot: ${nextSlotLabel}` : "Use next available slot"}
          </button>
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

      <GenerateImageDialog
        open={genOpen}
        onClose={() => setGenOpen(false)}
        postId={id}
        postContent={content}
        onPick={(url) => { setImageUrl(url); toast.success("Image attached"); }}
      />
    </div>
  );
}

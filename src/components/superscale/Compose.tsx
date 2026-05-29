import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, Image as ImageIcon, Loader2, X, Calendar as CalendarIcon, Flame, Zap, Wand2, Laugh, ShieldCheck, SpellCheck, MessageCircle, Heart, Clock, Send, Bot } from "lucide-react";
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
  const [scheduleMode, setScheduleMode] = useState<"queue" | "custom">("queue");
  const [enhancing, setEnhancing] = useState<string | null>(null);
  const [previousContent, setPreviousContent] = useState<string | null>(null);
  const [autoCommentEnabled, setAutoCommentEnabled] = useState(false);
  const [autoCommentText, setAutoCommentText] = useState("");
  const [autoCommentTrigger, setAutoCommentTrigger] = useState<"likes" | "comments" | "minutes">("likes");
  const [autoCommentThreshold, setAutoCommentThreshold] = useState<number>(10);
  const [autoDmEnabled, setAutoDmEnabled] = useState(false);
  const [autoDmMessage, setAutoDmMessage] = useState("");
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
  const [queueTz, setQueueTz] = useState<string>(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");

  // Convert a wall-clock "YYYY-MM-DDTHH:mm" string to a UTC Date as if entered in `tz`.
  function wallClockInTzToUTC(local: string, tz: string): Date {
    const [datePart, timePart] = local.split("T");
    const [y, mo, d] = datePart.split("-").map(Number);
    const [h, mi] = (timePart || "00:00").split(":").map(Number);
    const utcGuess = Date.UTC(y, mo - 1, d, h, mi);
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone: tz, hourCycle: "h23",
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
    const parts = dtf.formatToParts(new Date(utcGuess));
    const m: any = {};
    parts.forEach((p) => { if (p.type !== "literal") m[p.type] = parseInt(p.value); });
    const projected = Date.UTC(m.year, m.month - 1, m.day, m.hour === 24 ? 0 : m.hour, m.minute, m.second);
    const offset = projected - utcGuess;
    return new Date(utcGuess - offset);
  }

  // Format a UTC Date back to a "YYYY-MM-DDTHH:mm" string in `tz` for the datetime-local input.
  function utcToWallClockInTz(d: Date, tz: string): string {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz, hourCycle: "h23",
      year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
    }).formatToParts(d);
    const m: any = {};
    parts.forEach((p) => { if (p.type !== "literal") m[p.type] = p.value; });
    const hh = m.hour === "24" ? "00" : m.hour;
    return `${m.year}-${m.month}-${m.day}T${hh}:${m.minute}`;
  }

  async function enhance(action: "hook" | "funny" | "undetectable" | "grammar") {
    if (!content.trim()) { toast.error("Write something first"); return; }
    setEnhancing(action);
    const prev = content;
    try {
      const { data, error } = await supabase.functions.invoke("superscale-enhance-post", {
        body: { content, action },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.content) {
        setPreviousContent(prev);
        setContent(data.content.slice(0, MAX));
        toast.success("Updated — tap Undo to revert", {
          action: { label: "Undo", onClick: () => { setContent(prev); setPreviousContent(null); } },
        });
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to enhance");
    } finally {
      setEnhancing(null);
    }
  }

  function toLocalInput(d: Date) {
    const tz = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tz).toISOString().slice(0, 16);
  }

  async function pickNextSlot() {
    setPickingSlot(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const [{ data: queueSlots }, { data: prefs }, { data: existing }] = await Promise.all([
        supabase.from("superscale_queue_slots").select("day_of_week,time").eq("user_id", u.user.id),
        supabase.from("superscale_queue_prefs").select("natural_jitter_minutes,comments_spike_default").eq("user_id", u.user.id).maybeSingle(),
        supabase
          .from("linkedin_posts")
          .select("scheduled_for")
          .eq("user_id", u.user.id)
          .in("status", ["scheduled", "draft"])
          .not("scheduled_for", "is", null),
      ]);

      if (!queueSlots || queueSlots.length === 0) {
        toast.error("Set up your queue first (Queue → Edit Queue)");
        return;
      }

      const taken = new Set(
        (existing || [])
          .map((p: any) => (p.scheduled_for ? new Date(p.scheduled_for).getTime() : 0))
          .filter(Boolean)
      );

      const jitterMin = prefs?.natural_jitter_minutes ?? 0;
      const jitterFor = (key: string) => {
        if (!jitterMin) return 0;
        let h = 0;
        for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
        return (Math.abs(h) % (jitterMin * 2 + 1)) - jitterMin;
      };

      // Group slots by day-of-week (0=Sun..6=Sat)
      const byDow: Record<number, string[]> = {};
      queueSlots.forEach((s: any) => {
        (byDow[s.day_of_week] ||= []).push(s.time);
      });
      Object.values(byDow).forEach((arr) => arr.sort());

      const now = new Date();
      // Compute "today" in queue tz to anchor day iteration.
      const todayInTz = utcToWallClockInTz(now, queueTz).slice(0, 10); // YYYY-MM-DD
      const [ty, tm, td] = todayInTz.split("-").map(Number);
      for (let dayOffset = 0; dayOffset < 21; dayOffset++) {
        const cursor = new Date(Date.UTC(ty, tm - 1, td + dayOffset, 12, 0, 0));
        // Day-of-week as observed in the queue tz
        const dowStr = new Intl.DateTimeFormat("en-US", { timeZone: queueTz, weekday: "short" }).format(cursor);
        const dowMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
        const dow = dowMap[dowStr] ?? 0;
        const times = byDow[dow] || [];
        const wallDate = utcToWallClockInTz(cursor, queueTz).slice(0, 10);
        for (const t of times) {
          const [h, m] = t.split(":").map(Number);
          const j = jitterFor(`${wallDate}${t}`);
          const wallClock = `${wallDate}T${String(h).padStart(2, "0")}:${String(m + j).padStart(2, "0")}`;
          const slot = wallClockInTzToUTC(wallClock, queueTz);
          if (slot.getTime() <= now.getTime() + 5 * 60000) continue;
          let collision = false;
          for (const tk of taken) {
            if (Math.abs(tk - slot.getTime()) < 30 * 60000) { collision = true; break; }
          }
          if (collision) continue;
          setScheduledFor(utcToWallClockInTz(slot, queueTz));
          if (prefs?.comments_spike_default) setSpike(true);
          setNextSlotLabel(slot.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: queueTz }) + ` (${queueTz})`);
          toast.success("Slot picked from your queue");
          return;
        }
      }
      toast.error("No free slot found in the next 3 weeks");
    } finally {
      setPickingSlot(false);
    }
  }

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data: prefs } = await supabase
        .from("superscale_queue_prefs")
        .select("timezone").eq("user_id", u.user.id).maybeSingle();
      if (prefs?.timezone) setQueueTz(prefs.timezone);
    })();
  }, []);

  useEffect(() => {
    setId(postId);
    if (!postId) {
      setContent(""); setImageUrl(null); setScheduledFor(""); setSpike(false);
      setAutoCommentEnabled(false); setAutoCommentText(""); setAutoCommentTrigger("likes"); setAutoCommentThreshold(10);
      setAutoDmEnabled(false); setAutoDmMessage(""); setAutoReplyEnabled(false);
      return;
    }
    (async () => {
      const { data } = await supabase.from("linkedin_posts").select("*").eq("id", postId).maybeSingle();
      if (data) {
        setContent(data.content || "");
        setImageUrl(data.image_url);
        setScheduledFor(data.scheduled_for ? utcToWallClockInTz(new Date(data.scheduled_for), queueTz) : "");
        setSpike(!!data.comments_spike_enabled);
        setAutoCommentEnabled(!!(data as any).auto_comment_enabled);
        setAutoCommentText((data as any).auto_comment_text || "");
        setAutoCommentTrigger(((data as any).auto_comment_trigger as any) || "likes");
        setAutoCommentThreshold((data as any).auto_comment_threshold ?? 10);
        setAutoDmEnabled(!!(data as any).auto_dm_commenters_enabled);
        setAutoDmMessage((data as any).auto_dm_message || "");
        setAutoReplyEnabled(!!(data as any).auto_reply_comments_enabled);
      }
    })();
  }, [postId, queueTz]);

  async function save(status: "draft" | "scheduled") {
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setLoading(false); return; }
    if (status === "scheduled" && !scheduledFor) { toast.error("Pick a schedule time"); setLoading(false); return; }
    if (autoCommentEnabled && !autoCommentText.trim()) { toast.error("Write your auto-comment or disable it"); setLoading(false); return; }
    if (autoDmEnabled && !autoDmMessage.trim()) { toast.error("Write your auto-DM message or disable it"); setLoading(false); return; }
    const payload: any = {
      user_id: u.user.id,
      content, image_url: imageUrl,
      scheduled_for: status === "scheduled" ? wallClockInTzToUTC(scheduledFor, queueTz).toISOString() : null,
      comments_spike_enabled: spike, status,
      auto_comment_enabled: autoCommentEnabled,
      auto_comment_text: autoCommentEnabled ? autoCommentText : null,
      auto_comment_trigger: autoCommentEnabled ? autoCommentTrigger : null,
      auto_comment_threshold: autoCommentEnabled ? autoCommentThreshold : null,
      auto_dm_commenters_enabled: autoDmEnabled,
      auto_dm_message: autoDmEnabled ? autoDmMessage : null,
      auto_reply_comments_enabled: autoReplyEnabled,
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
        <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-black/[0.04]">
          <div className="flex items-center gap-1.5 flex-wrap">
            {([
              { id: "hook", label: "Engaging hook", icon: Wand2 },
              { id: "funny", label: "Make it funny", icon: Laugh },
              { id: "undetectable", label: "AI undetectable", icon: ShieldCheck },
              { id: "grammar", label: "Fix grammar", icon: SpellCheck },
            ] as const).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => enhance(id)}
                disabled={!!enhancing || !content.trim()}
                className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-full bg-gradient-to-br from-rose-50 to-orange-50 text-foreground/80 hover:from-rose-100 hover:to-orange-100 border border-orange-200/60 disabled:opacity-40 transition"
              >
                {enhancing === id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Icon className="w-3 h-3 text-orange-500" />}
                {label}
              </button>
            ))}
            {previousContent && (
              <button
                type="button"
                onClick={() => { setContent(previousContent); setPreviousContent(null); }}
                className="text-[11px] font-medium px-2.5 py-1.5 rounded-full text-foreground/60 hover:text-foreground hover:bg-black/5"
              >
                Undo
              </button>
            )}
          </div>
          <span className={`text-xs whitespace-nowrap ${overMax ? "text-red-500 font-semibold" : overWarn ? "text-orange-500" : "text-foreground/40"}`}>{len}/{MAX}</span>
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
          <label className="text-xs font-semibold text-foreground/60 mb-2 flex items-center gap-1.5"><CalendarIcon className="w-3.5 h-3.5" /> Schedule</label>

          <div className="grid grid-cols-2 gap-2 p-1 bg-black/[0.04] rounded-lg mb-3">
            <button
              type="button"
              onClick={() => { setScheduleMode("queue"); if (!nextSlotLabel) pickNextSlot(); }}
              className={`text-xs font-semibold py-2 rounded-md transition flex items-center justify-center gap-1.5 ${
                scheduleMode === "queue" ? "bg-white text-foreground shadow-sm" : "text-foreground/60 hover:text-foreground"
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-orange-500" /> Next queue slot
            </button>
            <button
              type="button"
              onClick={() => setScheduleMode("custom")}
              className={`text-xs font-semibold py-2 rounded-md transition ${
                scheduleMode === "custom" ? "bg-white text-foreground shadow-sm" : "text-foreground/60 hover:text-foreground"
              }`}
            >
              Specific time
            </button>
          </div>

          {scheduleMode === "queue" ? (
            <button
              type="button"
              onClick={pickNextSlot}
              disabled={pickingSlot}
              className="w-full text-left text-sm font-medium text-foreground/80 inline-flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg bg-black/[0.03] hover:bg-black/[0.05] disabled:opacity-50"
            >
              <span className="flex items-center gap-2">
                {pickingSlot ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-orange-500" />}
                {nextSlotLabel ? nextSlotLabel : "Find next available slot"}
              </span>
              <span className="text-[11px] text-foreground/40">Tap to refresh</span>
            </button>
          ) : (
            <div>
              <input
                type="datetime-local"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
                className="w-full text-sm border border-black/10 rounded-lg px-3 py-2 outline-none focus:border-black/30"
              />
              <div className="text-[11px] text-foreground/50 mt-1.5">
                Time is interpreted in your queue timezone: <span className="font-medium text-foreground/70">{queueTz}</span>
              </div>
            </div>
          )}
        </div>
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={spike} onChange={(e) => setSpike(e.target.checked)} className="mt-0.5 w-4 h-4 accent-orange-500" />
          <div>
            <div className="text-sm font-semibold flex items-center gap-1.5"><Flame className="w-3.5 h-3.5 text-orange-500" /> Trigger Comments Spike</div>
            <div className="text-xs text-foreground/50">~30 min after publish, 8 AI-drafted human-sounding comments will land on similar posts in your space — driving discovery to yours.</div>
          </div>
        </label>

        <div className="pt-4 border-t border-black/[0.04]">
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={autoCommentEnabled} onChange={(e) => setAutoCommentEnabled(e.target.checked)} className="mt-0.5 w-4 h-4 accent-orange-500" />
            <div className="flex-1">
              <div className="text-sm font-semibold flex items-center gap-1.5"><MessageCircle className="w-3.5 h-3.5 text-orange-500" /> Auto-comment on this post</div>
              <div className="text-xs text-foreground/50">Drop your own comment automatically — perfect for a CTA, a link, or extra context that boosts reach.</div>
            </div>
          </label>

          {autoCommentEnabled && (
            <div className="mt-3 ml-7 space-y-3">
              <textarea
                value={autoCommentText}
                onChange={(e) => setAutoCommentText(e.target.value.slice(0, 1250))}
                placeholder="e.g. PS — full breakdown + free template here: yourlink.com"
                className="w-full min-h-[80px] resize-none text-sm border border-black/10 rounded-lg px-3 py-2 outline-none focus:border-black/30 placeholder:text-foreground/30"
              />

              <div className="grid grid-cols-3 gap-1.5 p-1 bg-black/[0.04] rounded-lg">
                {([
                  { id: "likes", label: "Likes", icon: Heart },
                  { id: "comments", label: "Comments", icon: MessageCircle },
                  { id: "minutes", label: "Minutes", icon: Clock },
                ] as const).map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setAutoCommentTrigger(id)}
                    className={`text-xs font-semibold py-1.5 rounded-md transition flex items-center justify-center gap-1 ${
                      autoCommentTrigger === id ? "bg-white text-foreground shadow-sm" : "text-foreground/60 hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-3 h-3" /> {label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span className="text-foreground/60">
                  {autoCommentTrigger === "minutes" ? "Post the comment after" : "Post the comment when it reaches"}
                </span>
                <input
                  type="number"
                  min={1}
                  value={autoCommentThreshold}
                  onChange={(e) => setAutoCommentThreshold(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 text-sm border border-black/10 rounded-lg px-2 py-1.5 outline-none focus:border-black/30"
                />
                <span className="text-foreground/60">
                  {autoCommentTrigger === "likes" && "likes"}
                  {autoCommentTrigger === "comments" && "comments"}
                  {autoCommentTrigger === "minutes" && "minutes after publish"}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-black/[0.04]">
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={autoDmEnabled} onChange={(e) => setAutoDmEnabled(e.target.checked)} className="mt-0.5 w-4 h-4 accent-orange-500" />
            <div className="flex-1">
              <div className="text-sm font-semibold flex items-center gap-1.5"><Send className="w-3.5 h-3.5 text-orange-500" /> Auto-DM people who comment</div>
              <div className="text-xs text-foreground/50">Send a personal LinkedIn DM to anyone who comments on this post — great for delivering a lead magnet or starting a 1:1 thread.</div>
            </div>
          </label>
          {autoDmEnabled && (
            <div className="mt-3 ml-7">
              <textarea
                value={autoDmMessage}
                onChange={(e) => setAutoDmMessage(e.target.value.slice(0, 1000))}
                placeholder="e.g. Hey {first_name} — thanks for the comment! Here's the template I mentioned: yourlink.com"
                className="w-full min-h-[80px] resize-none text-sm border border-black/10 rounded-lg px-3 py-2 outline-none focus:border-black/30 placeholder:text-foreground/30"
              />
              <div className="text-[11px] text-foreground/40 mt-1">Use {"{first_name}"} to personalize.</div>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-black/[0.04]">
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={autoReplyEnabled} onChange={(e) => setAutoReplyEnabled(e.target.checked)} className="mt-0.5 w-4 h-4 accent-orange-500" />
            <div className="flex-1">
              <div className="text-sm font-semibold flex items-center gap-1.5"><Bot className="w-3.5 h-3.5 text-orange-500" /> Auto-reply to comments with AI</div>
              <div className="text-xs text-foreground/50">AI replies to every comment on this post in your voice — keeps the thread alive and boosts reach. Your own comments are skipped.</div>
            </div>
          </label>
        </div>
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

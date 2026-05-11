import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Pencil, Loader2, BarChart3, Sparkles, Clock, Wand2 } from "lucide-react";
import { toast } from "sonner";
import EditQueueDialog from "./EditQueueDialog";

type Slot = { day_of_week: number; time: string };
type Post = {
  id: string;
  content: string | null;
  image_url: string | null;
  scheduled_for: string | null;
  status: string;
};

const DOW_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// deterministic jitter so the same slot always shows the same offset
function jitterFor(dateKey: string, time: string, jitterMin: number) {
  if (!jitterMin) return 0;
  let h = 0;
  const s = `${dateKey}${time}`;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  // map to [-jitter, +jitter]
  return ((Math.abs(h) % (jitterMin * 2 + 1)) - jitterMin);
}

function fmtSlot(time: string, jitter: number) {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + jitter;
  const hh = ((Math.floor(total / 60) % 24) + 24) % 24;
  const mm = ((total % 60) + 60) % 60;
  const ampm = hh >= 12 ? "PM" : "AM";
  const h12 = ((hh + 11) % 12) + 1;
  return `${String(h12).padStart(2, "0")}:${String(mm).padStart(2, "0")} ${ampm}`;
}

function dayLabel(date: Date, today: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const t = new Date(today);
  t.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - t.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return DOW_NAMES[d.getDay()];
}

function shortDate(date: Date) {
  return date.toLocaleDateString(undefined, { month: "short", day: "2-digit" }).replace(" ", "-");
}

export default function Queue({ onCompose }: { onCompose: (postId: string | null) => void }) {
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [jitter, setJitter] = useState(0);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const [{ data: s }, { data: pf }, { data: p }] = await Promise.all([
        supabase.from("superscale_queue_slots").select("day_of_week,time").eq("user_id", u.user.id),
        supabase.from("superscale_queue_prefs").select("natural_jitter_minutes").eq("user_id", u.user.id).maybeSingle(),
        supabase.from("linkedin_posts")
          .select("id,content,image_url,scheduled_for,status")
          .eq("user_id", u.user.id)
          .in("status", ["scheduled", "draft"])
          .not("scheduled_for", "is", null)
          .gte("scheduled_for", new Date().toISOString())
          .order("scheduled_for", { ascending: true })
          .limit(200),
      ]);
      setSlots(s || []);
      setJitter(pf?.natural_jitter_minutes ?? 0);
      setPosts(p || []);
      setLoading(false);
    })();
  }, [reloadTick]);

  // Build the next ~14 days view, listing slots per day
  const days = useMemo(() => {
    const today = new Date();
    today.setSeconds(0, 0);
    const out: { date: Date; entries: { time: string; jitter: number; post: Post | null }[] }[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dow = d.getDay();
      const daySlots = slots.filter((s) => s.day_of_week === dow).sort((a, b) => a.time.localeCompare(b.time));
      const dateKey = d.toISOString().slice(0, 10);
      const entries = daySlots.map((s) => {
        const j = jitterFor(dateKey, s.time, jitter);
        // try to match an existing post within ±60min of this slot
        const slotDt = new Date(d);
        const [hh, mm] = s.time.split(":").map(Number);
        slotDt.setHours(hh, mm + j, 0, 0);
        const matched = posts.find((p) => {
          if (!p.scheduled_for) return false;
          return Math.abs(new Date(p.scheduled_for).getTime() - slotDt.getTime()) < 60 * 60000;
        });
        return { time: s.time, jitter: j, post: matched ?? null };
      });
      out.push({ date: d, entries });
    }
    return out;
  }, [slots, posts, jitter]);

  // Heatmap from sent posts (last 90d) — count by hour
  const [hourCounts, setHourCounts] = useState<number[]>(Array(24).fill(0));
  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const since = new Date();
      since.setDate(since.getDate() - 90);
      const { data } = await supabase.from("linkedin_posts")
        .select("posted_at,metrics")
        .eq("user_id", u.user.id)
        .eq("status", "posted")
        .gte("posted_at", since.toISOString())
        .limit(500);
      const arr = Array(24).fill(0);
      (data || []).forEach((p: any) => {
        if (!p.posted_at) return;
        const h = new Date(p.posted_at).getHours();
        const m = p?.metrics ?? {};
        const eng = (m.likes ?? 0) + (m.comments ?? 0) * 3 + (m.reposts ?? 0) * 2;
        arr[h] += Math.max(1, eng);
      });
      setHourCounts(arr);
    })();
  }, [reloadTick]);

  const today = new Date();

  return (
    <div>
      {/* Header */}
      <div className="flex items-end justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Queue</h1>
          <p className="text-sm text-foreground/55 mt-1">
            Posts auto-publish at your queued time slots. {jitter > 0 && (
              <span className="text-rose-600 font-medium">±{jitter}min natural jitter on</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-black/10 bg-white pl-3 pr-1 py-1">
            <Wand2 className="w-4 h-4 text-rose-500" />
            <span className="text-sm font-medium">Generate</span>
            <input
              type="number"
              min={3}
              max={28}
              value={genCount}
              onChange={(e) => setGenCount(Math.max(3, Math.min(28, Number(e.target.value) || 12)))}
              className="w-12 text-sm font-semibold tabular-nums text-center bg-transparent focus:outline-none"
            />
            <span className="text-sm text-foreground/55">slots</span>
            <button
              onClick={generateFromBestTimes}
              disabled={generating}
              className="ml-2 rounded-md bg-foreground text-background text-xs font-semibold px-2.5 py-1.5 hover:opacity-90 disabled:opacity-50 flex items-center gap-1"
            >
              {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Apply"}
            </button>
          </div>
          <button
            onClick={() => setShowHeatmap((v) => !v)}
            className="rounded-lg border border-black/10 bg-white text-sm font-medium px-3 py-2 hover:bg-black/[0.03] flex items-center gap-1.5"
          >
            <BarChart3 className="w-4 h-4" /> Best times
          </button>
          <button
            onClick={() => setEditOpen(true)}
            className="rounded-lg border-[1.5px] border-rose-500 text-rose-600 text-sm font-semibold px-4 py-2 hover:bg-rose-50 flex items-center gap-1.5"
          >
            <Pencil className="w-4 h-4" /> Edit Queue
          </button>
        </div>
      </div>

      {showHeatmap && (
        <div className="mt-4 rounded-2xl border border-black/[0.06] bg-white p-5">
          <div className="text-sm font-semibold mb-1">Best times to post</div>
          <div className="text-xs text-foreground/50 mb-4">
            Based on engagement of your last 90 days of posts.
          </div>
          <Heatmap counts={hourCounts} />
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-foreground/40">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : slots.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-black/10 p-12 text-center">
          <Clock className="w-6 h-6 mx-auto text-foreground/30" />
          <p className="text-sm text-foreground/60 mt-3">
            No time slots yet. Click <span className="font-semibold">Edit Queue</span> to set when posts go out.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-7">
          {days.map((d) => {
            if (d.entries.length === 0) return null;
            return (
              <div key={d.date.toISOString()}>
                <div className="flex items-baseline gap-2 mb-2">
                  <h2 className="text-base font-bold">{dayLabel(d.date, today)}</h2>
                  <span className="text-sm text-foreground/40">{shortDate(d.date)}</span>
                </div>
                <div className="space-y-2">
                  {d.entries.map((entry, idx) => (
                    <button
                      key={idx}
                      onClick={() => onCompose(entry.post?.id ?? null)}
                      className={`w-full text-left rounded-xl border bg-white px-4 py-3 flex items-center gap-4 transition-colors ${
                        entry.post
                          ? "border-rose-500/40 hover:border-rose-500/70"
                          : "border-black/[0.08] hover:border-black/20"
                      }`}
                    >
                      <span className="text-sm font-semibold tabular-nums text-foreground/80 w-[88px] shrink-0">
                        {fmtSlot(entry.time, entry.jitter)}
                      </span>
                      {entry.post ? (
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {entry.post.image_url && (
                            <img src={entry.post.image_url} alt="" className="w-10 h-10 rounded-md object-cover shrink-0" />
                          )}
                          <p className="text-sm text-foreground/80 line-clamp-1 flex-1">
                            {entry.post.content || "(empty post)"}
                          </p>
                        </div>
                      ) : (
                        <span className="text-sm italic text-foreground/40 flex-1">
                          Press "Add to Queue" to schedule your post
                        </span>
                      )}
                      {entry.jitter !== 0 && (
                        <span className="text-[10px] font-medium text-rose-600/80 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />{entry.jitter > 0 ? "+" : ""}{entry.jitter}m
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <EditQueueDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={() => setReloadTick((t) => t + 1)}
      />
    </div>
  );
}

function Heatmap({ counts }: { counts: number[] }) {
  const max = Math.max(1, ...counts);
  return (
    <div>
      <div className="flex items-end gap-1 h-32">
        {counts.map((c, h) => (
          <div key={h} className="flex-1 flex flex-col justify-end">
            <div
              className="w-full rounded-t-sm bg-rose-500"
              style={{ height: `${(c / max) * 100}%`, minHeight: c ? 2 : 0, opacity: c ? 0.5 + (c / max) * 0.5 : 0.08 }}
              title={`${h}:00 — ${c} engagement`}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-foreground/40 mt-1.5">
        <span>12am</span><span>6am</span><span>12pm</span><span>6pm</span><span>11pm</span>
      </div>
    </div>
  );
}

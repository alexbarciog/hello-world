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

// Get y/m/d/dow for a given UTC instant interpreted in tz
function partsInTz(d: Date, tz: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit", weekday: "short",
  }).formatToParts(d);
  const m: any = {};
  parts.forEach((p) => { if (p.type !== "literal") m[p.type] = p.value; });
  const dowMap: any = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return { y: +m.year, mo: +m.month, d: +m.day, dow: dowMap[m.weekday] };
}

// Convert a wall-clock (y, mo, d, h, mi) in tz to a real UTC Date
function wallClockInTzToUTC(y: number, mo: number, d: number, h: number, mi: number, tz: string): Date {
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

function dayLabel(dateInfo: { y: number; mo: number; d: number; dow: number }, todayInfo: { y: number; mo: number; d: number }) {
  const d = Date.UTC(dateInfo.y, dateInfo.mo - 1, dateInfo.d);
  const t = Date.UTC(todayInfo.y, todayInfo.mo - 1, todayInfo.d);
  const diff = Math.round((d - t) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return DOW_NAMES[dateInfo.dow];
}

function shortDate(dateInfo: { y: number; mo: number; d: number }) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[dateInfo.mo - 1]}-${String(dateInfo.d).padStart(2, "0")}`;
}

export default function Queue({ onCompose }: { onCompose: (postId: string | null) => void }) {
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [jitter, setJitter] = useState(0);
  const [queueTz, setQueueTz] = useState<string>(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
  const [reloadTick, setReloadTick] = useState(0);
  const [genCount, setGenCount] = useState(12);
  const [generating, setGenerating] = useState(false);

  async function generateFromBestTimes() {
    const totalScore = grid.flat().reduce((s, c) => s + c, 0);
    if (totalScore === 0) {
      toast.error("No post history yet — add slots manually first.");
      return;
    }
    if (slots.length > 0 && !confirm(`Replace your current ${slots.length} slot(s) with ${genCount} slots based on your best-performing day & time combos?`)) {
      return;
    }
    setGenerating(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data: prof } = await supabase
        .from("profiles")
        .select("current_organization_id")
        .eq("user_id", u.user.id)
        .maybeSingle();
      const orgId = prof?.current_organization_id ?? null;

      // Rank (day, hour) cells by engagement, take the top genCount
      const cells: { dow: number; h: number; score: number }[] = [];
      for (let d = 0; d < 7; d++) {
        for (let h = 0; h < 24; h++) {
          if (grid[d][h] > 0) cells.push({ dow: d, h, score: grid[d][h] });
        }
      }
      cells.sort((a, b) => b.score - a.score);
      const ranked = cells.slice(0, genCount);
      const rows: { user_id: string; organization_id: string | null; day_of_week: number; time: string }[] = [];
      for (const cell of ranked) {
        rows.push({
          user_id: u.user.id,
          organization_id: orgId,
          day_of_week: cell.dow,
          time: `${String(cell.h).padStart(2, "0")}:00`,
        });
      }

      await supabase.from("superscale_queue_slots").delete().eq("user_id", u.user.id);
      const { error } = await supabase.from("superscale_queue_slots").insert(rows);
      if (error) {
        toast.error("Couldn't save generated queue");
        return;
      }
      toast.success(`Generated ${rows.length} slots from your best times`);
      setReloadTick((t) => t + 1);
    } finally {
      setGenerating(false);
    }
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const [{ data: s }, { data: pf }, { data: p }] = await Promise.all([
        supabase.from("superscale_queue_slots").select("day_of_week,time").eq("user_id", u.user.id),
        supabase.from("superscale_queue_prefs").select("natural_jitter_minutes,timezone").eq("user_id", u.user.id).maybeSingle(),
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
      if ((pf as any)?.timezone) setQueueTz((pf as any).timezone);
      setPosts(p || []);
      setLoading(false);
    })();
  }, [reloadTick]);

  // Build the next ~14 days view, listing slots per day — interpreted in queue timezone
  const days = useMemo(() => {
    const now = new Date();
    const todayInfo = partsInTz(now, queueTz);
    const out: { info: { y: number; mo: number; d: number; dow: number }; entries: { time: string; jitter: number; post: Post | null }[] }[] = [];
    for (let i = 0; i < 14; i++) {
      // Compute a UTC instant inside this day in tz, then read parts back to handle month rollover
      const noonUtc = wallClockInTzToUTC(todayInfo.y, todayInfo.mo, todayInfo.d + i, 12, 0, queueTz);
      const info = partsInTz(noonUtc, queueTz);
      const daySlots = slots.filter((s) => s.day_of_week === info.dow).sort((a, b) => a.time.localeCompare(b.time));
      const dateKey = `${info.y}-${String(info.mo).padStart(2, "0")}-${String(info.d).padStart(2, "0")}`;
      const entries = daySlots.map((s) => {
        const j = jitterFor(dateKey, s.time, jitter);
        const [hh, mm] = s.time.split(":").map(Number);
        const slotDt = wallClockInTzToUTC(info.y, info.mo, info.d, hh, mm + j, queueTz);
        const matched = posts.find((p) => {
          if (!p.scheduled_for) return false;
          return Math.abs(new Date(p.scheduled_for).getTime() - slotDt.getTime()) < 60 * 60000;
        });
        return { time: s.time, jitter: j, post: matched ?? null };
      });
      out.push({ info, entries });
    }
    return out;
  }, [slots, posts, jitter, queueTz]);

  // Heatmap from sent posts (last 90d) — score by day-of-week × hour, weighted by views + likes
  const [grid, setGrid] = useState<number[][]>(() => Array.from({ length: 7 }, () => Array(24).fill(0)));
  const [postSampleCount, setPostSampleCount] = useState(0);
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
      const g: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
      let sample = 0;
      (data || []).forEach((p: any) => {
        if (!p.posted_at) return;
        const dt = new Date(p.posted_at);
        const dow = dt.getDay();
        const h = dt.getHours();
        const m = p?.metrics ?? {};
        // Views are the strongest signal of "people online at this time"
        const views = Number(m.views ?? m.impressions ?? 0);
        const likes = Number(m.likes ?? 0);
        const comments = Number(m.comments ?? 0);
        const reposts = Number(m.reposts ?? m.shares ?? 0);
        const score = views + likes * 5 + comments * 10 + reposts * 8;
        g[dow][h] += Math.max(1, score);
        sample++;
      });
      setGrid(g);
      setPostSampleCount(sample);
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
          <div className="flex items-end justify-between mb-3">
            <div>
              <div className="text-sm font-semibold">Best times to post</div>
              <div className="text-xs text-foreground/50 mt-0.5">
                {postSampleCount > 0
                  ? `Based on views, likes, comments & reposts of your last ${postSampleCount} LinkedIn post${postSampleCount === 1 ? "" : "s"} (90 days).`
                  : "No posted LinkedIn data yet — post a few times so we can learn your audience."}
              </div>
            </div>
          </div>
          <DayHourHeatmap grid={grid} />
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

const DOW_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function DayHourHeatmap({ grid }: { grid: number[][] }) {
  const max = Math.max(1, ...grid.flat());
  // Find the top 5 cells to highlight
  const cells: { d: number; h: number; v: number }[] = [];
  for (let d = 0; d < 7; d++) for (let h = 0; h < 24; h++) cells.push({ d, h, v: grid[d][h] });
  const topKeys = new Set(
    cells
      .filter((c) => c.v > 0)
      .sort((a, b) => b.v - a.v)
      .slice(0, 5)
      .map((c) => `${c.d}-${c.h}`)
  );

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full">
        <div className="grid" style={{ gridTemplateColumns: "36px repeat(24, minmax(18px,1fr))" }}>
          <div />
          {Array.from({ length: 24 }, (_, h) => (
            <div key={h} className="text-[9px] text-foreground/40 text-center pb-1">
              {h % 6 === 0 ? (h === 0 ? "12a" : h === 12 ? "12p" : h < 12 ? `${h}a` : `${h - 12}p`) : ""}
            </div>
          ))}
          {DOW_SHORT.map((label, d) => (
            <>
              <div key={`l-${d}`} className="text-[10px] font-medium text-foreground/55 pr-2 flex items-center justify-end h-6">
                {label}
              </div>
              {Array.from({ length: 24 }, (_, h) => {
                const v = grid[d][h];
                const intensity = v > 0 ? 0.15 + (v / max) * 0.85 : 0;
                const isTop = topKeys.has(`${d}-${h}`);
                return (
                  <div key={`c-${d}-${h}`} className="px-[1px] py-[1px]">
                    <div
                      className={`h-5 rounded-[3px] transition-colors ${isTop ? "ring-[1.5px] ring-rose-500" : ""}`}
                      style={{
                        backgroundColor: v > 0 ? `rgba(244, 63, 94, ${intensity})` : "rgba(0,0,0,0.04)",
                      }}
                      title={`${DOW_SHORT[d]} ${h}:00 — ${v ? v.toFixed(0) : 0} engagement`}
                    />
                  </div>
                );
              })}
            </>
          ))}
        </div>
        <div className="flex items-center justify-between mt-3 text-[10px] text-foreground/40">
          <span>Less</span>
          <div className="flex items-center gap-1">
            {[0.1, 0.3, 0.5, 0.75, 1].map((a) => (
              <div key={a} className="w-4 h-2.5 rounded-sm" style={{ backgroundColor: `rgba(244, 63, 94, ${a})` }} />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
}

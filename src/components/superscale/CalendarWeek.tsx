import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const SLOTS = ["08:00", "12:00", "16:00", "20:00"];

export default function CalendarWeek({ onCompose }: { onCompose: (date: Date) => void }) {
  const [posts, setPosts] = useState<any[]>([]);
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    const dow = (d.getDay() + 6) % 7; // Mon=0
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - dow);
    return d;
  });

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart); d.setDate(weekStart.getDate() + i); return d;
  }), [weekStart]);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const start = new Date(weekStart);
      const end = new Date(weekStart); end.setDate(end.getDate() + 7);
      const { data } = await supabase.from("linkedin_posts")
        .select("*").eq("user_id", u.user.id)
        .gte("scheduled_for", start.toISOString())
        .lt("scheduled_for", end.toISOString());
      setPosts(data || []);
    })();
  }, [weekStart]);

  function postsAt(day: Date, slot: string) {
    const [h, m] = slot.split(":").map(Number);
    return posts.filter((p) => {
      if (!p.scheduled_for) return false;
      const d = new Date(p.scheduled_for);
      return d.toDateString() === day.toDateString() && Math.abs(d.getHours() * 60 + d.getMinutes() - (h * 60 + m)) < 90;
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold">Content calendar</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d); }} className="px-3 py-1.5 text-sm rounded-lg border border-black/10 hover:bg-black/5">←</button>
          <button onClick={() => { const d = new Date(); const dow = (d.getDay() + 6) % 7; d.setHours(0,0,0,0); d.setDate(d.getDate() - dow); setWeekStart(d); }} className="px-3 py-1.5 text-sm rounded-lg border border-black/10 hover:bg-black/5">Today</button>
          <button onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d); }} className="px-3 py-1.5 text-sm rounded-lg border border-black/10 hover:bg-black/5">→</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-black/[0.04] overflow-hidden">
        <div className="grid grid-cols-8 border-b border-black/[0.04]">
          <div className="p-3 text-[11px] font-semibold text-foreground/40 uppercase tracking-wider"></div>
          {days.map((d) => (
            <div key={d.toISOString()} className="p-3 text-center border-l border-black/[0.04]">
              <div className="text-[11px] uppercase tracking-wider text-foreground/40">{d.toLocaleDateString(undefined, { weekday: "short" })}</div>
              <div className="text-base font-bold mt-0.5">{d.getDate()}</div>
            </div>
          ))}
        </div>
        {SLOTS.map((slot) => (
          <div key={slot} className="grid grid-cols-8 border-b border-black/[0.04] last:border-0">
            <div className="p-3 text-xs font-medium text-foreground/50">{slot}</div>
            {days.map((d) => {
              const matches = postsAt(d, slot);
              const slotDate = new Date(d); const [h, m] = slot.split(":").map(Number); slotDate.setHours(h, m, 0, 0);
              return (
                <button
                  key={d.toISOString() + slot}
                  onClick={() => onCompose(slotDate)}
                  className="border-l border-black/[0.04] p-2 min-h-[80px] text-left hover:bg-black/[0.02] transition-colors"
                >
                  {matches.map((p) => (
                    <div key={p.id} className="text-[10px] bg-rose-50 text-rose-700 rounded-md px-2 py-1 mb-1 truncate font-medium">
                      {p.content.slice(0, 40) || "Empty"}
                    </div>
                  ))}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

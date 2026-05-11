import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X, Trash2, Plus, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]; // 0=Sun .. 6=Sat

type Slot = { day_of_week: number; time: string };

export default function EditQueueDialog({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // Map: time -> Set<day_of_week>
  const [grid, setGrid] = useState<Record<string, Set<number>>>({});
  const [newTime, setNewTime] = useState("08:00");
  const [naturalJitter, setNaturalJitter] = useState(0);
  const [timezone, setTimezone] = useState<string>(
    Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
  );
  const timezones: string[] = (() => {
    try {
      // @ts-ignore
      return (Intl as any).supportedValuesOf?.("timeZone") ?? [];
    } catch {
      return [];
    }
  })();

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const [{ data: slots }, { data: prefs }] = await Promise.all([
        supabase.from("superscale_queue_slots").select("*").eq("user_id", u.user.id),
        supabase.from("superscale_queue_prefs").select("*").eq("user_id", u.user.id).maybeSingle(),
      ]);
      const g: Record<string, Set<number>> = {};
      (slots || []).forEach((s: any) => {
        if (!g[s.time]) g[s.time] = new Set();
        g[s.time].add(s.day_of_week);
      });
      setGrid(g);
      setNaturalJitter(prefs?.natural_jitter_minutes ?? 0);
      setLoading(false);
    })();
  }, [open]);

  const times = Object.keys(grid).sort();

  function toggle(time: string, dow: number) {
    setGrid((prev) => {
      const next = { ...prev };
      const set = new Set(next[time] ?? []);
      if (set.has(dow)) set.delete(dow);
      else set.add(dow);
      next[time] = set;
      return next;
    });
  }

  function addRow() {
    if (!newTime || grid[newTime]) return;
    setGrid((prev) => ({ ...prev, [newTime]: new Set() }));
  }

  function removeRow(time: string) {
    setGrid((prev) => {
      const next = { ...prev };
      delete next[time];
      return next;
    });
  }

  async function save() {
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) {
      setSaving(false);
      return;
    }
    const { data: prof } = await supabase
      .from("profiles")
      .select("current_organization_id")
      .eq("user_id", u.user.id)
      .maybeSingle();
    const orgId = prof?.current_organization_id ?? null;

    // Replace all slots
    const rows: any[] = [];
    Object.entries(grid).forEach(([time, days]) => {
      days.forEach((dow) =>
        rows.push({ user_id: u.user!.id, organization_id: orgId, day_of_week: dow, time })
      );
    });

    await supabase.from("superscale_queue_slots").delete().eq("user_id", u.user.id);
    if (rows.length) {
      const { error } = await supabase.from("superscale_queue_slots").insert(rows);
      if (error) {
        toast.error("Couldn't save queue");
        setSaving(false);
        return;
      }
    }

    await supabase.from("superscale_queue_prefs").upsert({
      user_id: u.user.id,
      natural_jitter_minutes: naturalJitter,
      updated_at: new Date().toISOString(),
    });

    setSaving(false);
    toast.success("Queue saved");
    onSaved();
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-start justify-between px-7 pt-6 pb-2">
          <h2 className="text-2xl font-bold tracking-tight">Edit your post schedule</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-foreground/40 hover:text-foreground hover:bg-black/[0.04]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-7 pb-6">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-foreground/40">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-black/[0.08] overflow-hidden">
                <div className="grid grid-cols-[repeat(7,1fr)_80px_40px] bg-[#f9f9fa] px-4 py-3 text-sm font-semibold">
                  {DAYS.map((d) => (
                    <div key={d} className="text-center">{d}</div>
                  ))}
                  <div className="text-right pr-2">Time</div>
                  <div />
                </div>

                {times.length === 0 && (
                  <div className="px-4 py-6 text-center text-sm text-foreground/50">
                    No time slots yet. Add one below.
                  </div>
                )}

                {times.map((time) => (
                  <div
                    key={time}
                    className="grid grid-cols-[repeat(7,1fr)_80px_40px] items-center px-4 py-3 border-t border-black/[0.06]"
                  >
                    {DAYS.map((_, dow) => {
                      const checked = grid[time]?.has(dow);
                      return (
                        <div key={dow} className="flex justify-center">
                          <button
                            type="button"
                            onClick={() => toggle(time, dow)}
                            aria-pressed={checked}
                            className={`w-6 h-6 rounded-md border transition-colors flex items-center justify-center ${
                              checked
                                ? "bg-rose-500 border-rose-500 text-white"
                                : "bg-white border-black/15 hover:border-black/30"
                            }`}
                          >
                            {checked && (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </button>
                        </div>
                      );
                    })}
                    <div className="text-right pr-2 font-semibold text-base tabular-nums">{time}</div>
                    <div className="flex justify-end">
                      <button
                        onClick={() => removeRow(time)}
                        className="p-1.5 rounded-md text-foreground/40 hover:text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                <div className="grid grid-cols-[repeat(7,1fr)_80px_40px] items-center px-4 py-3 border-t border-black/[0.06] bg-[#fafafb]">
                  <div className="col-span-7" />
                  <div className="flex items-center justify-end gap-1.5">
                    <input
                      type="time"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="text-sm font-medium tabular-nums bg-transparent w-[70px] focus:outline-none text-foreground/60"
                    />
                  </div>
                  <button
                    onClick={addRow}
                    disabled={!newTime || !!grid[newTime]}
                    className="p-1.5 rounded-md text-foreground/40 hover:text-foreground hover:bg-black/[0.04] disabled:opacity-30"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-5 rounded-xl bg-[#f9f9fa] p-4 flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold">Make my schedule more natural</div>
                      <div className="text-xs text-foreground/55 mt-0.5">
                        Add a small random offset to each post so it doesn't go out at the exact same minute every week.
                      </div>
                    </div>
                    <select
                      value={naturalJitter}
                      onChange={(e) => setNaturalJitter(Number(e.target.value))}
                      className="text-sm font-medium bg-white border border-black/10 rounded-md px-2 py-1.5"
                    >
                      <option value={0}>Off</option>
                      <option value={5}>± 5 min</option>
                      <option value={10}>± 10 min</option>
                      <option value={20}>± 20 min</option>
                      <option value={45}>± 45 min</option>
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-black/[0.06] px-7 py-4 bg-white">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-foreground/70 hover:bg-black/[0.04]"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-foreground text-background text-sm font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save schedule
          </button>
        </div>
      </div>
    </div>
  );
}

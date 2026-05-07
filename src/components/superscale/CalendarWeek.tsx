import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Save, Sparkles, MessageCircle } from "lucide-react";
import { toast } from "sonner";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const POST_TYPES = [
  { id: "text", label: "Text" },
  { id: "image", label: "Image" },
  { id: "carousel", label: "Carousel" },
  { id: "story", label: "Story" },
  { id: "case_study", label: "Case study" },
  { id: "hot_take", label: "Hot take" },
];

type Row = {
  day_of_week: number;
  enabled: boolean;
  post_count: number;
  post_types: string[];
  first_slot: string;
  delay_minutes: number;
  comments_spike_enabled: boolean;
};

const DEFAULT: Omit<Row, "day_of_week"> = {
  enabled: false,
  post_count: 1,
  post_types: ["text"],
  first_slot: "09:00",
  delay_minutes: 240,
  comments_spike_enabled: false,
};

export default function CalendarWeek({ onCompose }: { onCompose: (date: Date) => void }) {
  const [rows, setRows] = useState<Row[]>(
    DAYS.map((_, i) => ({ day_of_week: i, ...DEFAULT }))
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase
        .from("superscale_cadence")
        .select("*")
        .eq("user_id", u.user.id);
      if (data && data.length) {
        setRows((prev) =>
          prev.map((r) => {
            const found = data.find((d: any) => d.day_of_week === r.day_of_week);
            return found ? { ...r, ...found } : r;
          })
        );
      }
      setLoading(false);
    })();
  }, []);

  function update(i: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function toggleType(i: number, t: string) {
    const r = rows[i];
    const has = r.post_types.includes(t);
    update(i, { post_types: has ? r.post_types.filter((x) => x !== t) : [...r.post_types, t] });
  }

  async function save() {
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) {
      setSaving(false);
      return;
    }
    const { data: member } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", u.user.id)
      .maybeSingle();
    const payload = rows.map((r) => ({
      ...r,
      user_id: u.user!.id,
      organization_id: member?.organization_id ?? null,
    }));
    const { error } = await supabase
      .from("superscale_cadence")
      .upsert(payload, { onConflict: "user_id,day_of_week" });
    setSaving(false);
    if (error) toast.error("Couldn't save cadence");
    else toast.success("Cadence saved");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-foreground/40">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  const enabledCount = rows.filter((r) => r.enabled).length;
  const totalPerWeek = rows.reduce((sum, r) => sum + (r.enabled ? r.post_count : 0), 0);

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Content cadence</h1>
          <p className="text-sm text-foreground/60 mt-1">
            Define your weekly rhythm — we'll auto-fill your calendar with drafts.
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-foreground text-background text-sm font-semibold px-4 py-2 hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save cadence
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="rounded-xl bg-white border border-black/[0.06] p-4">
          <div className="text-xs text-foreground/50 uppercase tracking-wider">Active days</div>
          <div className="text-2xl font-bold mt-1">{enabledCount}/7</div>
        </div>
        <div className="rounded-xl bg-white border border-black/[0.06] p-4">
          <div className="text-xs text-foreground/50 uppercase tracking-wider">Posts / week</div>
          <div className="text-2xl font-bold mt-1">{totalPerWeek}</div>
        </div>
        <div className="rounded-xl bg-white border border-black/[0.06] p-4">
          <div className="text-xs text-foreground/50 uppercase tracking-wider">Spike-enabled days</div>
          <div className="text-2xl font-bold mt-1">{rows.filter((r) => r.enabled && r.comments_spike_enabled).length}</div>
        </div>
        <div className="rounded-xl bg-white border border-black/[0.06] p-4">
          <div className="text-xs text-foreground/50 uppercase tracking-wider">Avg / active day</div>
          <div className="text-2xl font-bold mt-1">
            {enabledCount ? (totalPerWeek / enabledCount).toFixed(1) : "—"}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {rows.map((r, i) => (
          <div
            key={r.day_of_week}
            className={`rounded-xl border p-5 transition-colors ${
              r.enabled ? "bg-white border-black/[0.06]" : "bg-[#f9f9fa] border-transparent"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={r.enabled}
                    onChange={(e) => update(i, { enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-black/10 rounded-full peer peer-checked:bg-foreground transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-transform peer-checked:after:translate-x-4" />
                </label>
                <div>
                  <div className="text-base font-semibold">{DAYS[r.day_of_week]}</div>
                  <div className="text-xs text-foreground/50">
                    {r.enabled
                      ? `${r.post_count} post${r.post_count > 1 ? "s" : ""} · starts ${r.first_slot}`
                      : "Off"}
                  </div>
                </div>
              </div>
              {r.enabled && r.comments_spike_enabled && (
                <span className="text-[11px] font-medium px-2 py-1 rounded-full bg-rose-50 text-rose-600 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Comments spike on
                </span>
              )}
            </div>

            {r.enabled && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-black/[0.04]">
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-foreground/50 font-medium">
                    Posts that day
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={r.post_count}
                    onChange={(e) => update(i, { post_count: Math.max(1, Math.min(5, Number(e.target.value))) })}
                    className="mt-1.5 w-full rounded-lg bg-[#f9f9fa] border border-transparent px-3 py-2 text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-foreground/50 font-medium">
                    First slot
                  </label>
                  <input
                    type="time"
                    value={r.first_slot}
                    onChange={(e) => update(i, { first_slot: e.target.value })}
                    className="mt-1.5 w-full rounded-lg bg-[#f9f9fa] border border-transparent px-3 py-2 text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-foreground/50 font-medium">
                    Delay between posts (min)
                  </label>
                  <input
                    type="number"
                    min={30}
                    step={15}
                    value={r.delay_minutes}
                    onChange={(e) => update(i, { delay_minutes: Math.max(30, Number(e.target.value)) })}
                    disabled={r.post_count < 2}
                    className="mt-1.5 w-full rounded-lg bg-[#f9f9fa] border border-transparent px-3 py-2 text-sm font-medium disabled:opacity-40"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="text-[11px] uppercase tracking-wider text-foreground/50 font-medium">
                    Post types
                  </label>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {POST_TYPES.map((t) => {
                      const active = r.post_types.includes(t.id);
                      return (
                        <button
                          key={t.id}
                          onClick={() => toggleType(i, t.id)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                            active
                              ? "bg-foreground text-background"
                              : "bg-[#f9f9fa] text-foreground/60 hover:bg-black/5"
                          }`}
                        >
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="md:col-span-3 flex items-center justify-between rounded-lg bg-[#f9f9fa] px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <MessageCircle className="w-4 h-4 text-rose-500" />
                    <div>
                      <div className="text-sm font-medium">Auto Comments Spike</div>
                      <div className="text-xs text-foreground/50">
                        Drop human-sounding comments on related posts ~30 min before each post goes live.
                      </div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={r.comments_spike_enabled}
                      onChange={(e) => update(i, { comments_spike_enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-black/10 rounded-full peer peer-checked:bg-rose-500 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-transform peer-checked:after:translate-x-4" />
                  </label>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

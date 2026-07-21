import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, ShieldAlert, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { WidgetCard, WidgetHeader } from "./WidgetCard";

const RAMP_START = 5;
const RAMP_STEP = 2;

function rampAdjustedLimit(configured: number, rampStartedAt: string | null): { limit: number; ramping: boolean; day: number } {
  if (!rampStartedAt) return { limit: configured, ramping: false, day: 0 };
  const days = Math.floor((Date.now() - new Date(rampStartedAt).getTime()) / 86_400_000);
  if (days < 0) return { limit: RAMP_START, ramping: true, day: 0 };
  const limit = Math.min(configured, RAMP_START + RAMP_STEP * days);
  return { limit, ramping: limit < configured, day: days + 1 };
}

function utcDayStart(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

function utcWeekStart(): string {
  const d = new Date();
  const dow = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dow);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

interface Meter {
  label: string;
  used: number;
  limit: number;
  color: string;
}

function MeterRow({ m }: { m: Meter }) {
  const pct = m.limit > 0 ? Math.min(100, Math.round((m.used / m.limit) * 100)) : 0;
  const over = m.used >= m.limit && m.limit > 0;
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-[12.5px] text-neutral-500 w-24 shrink-0">{m.label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-[#F4F4F5] overflow-hidden">
        <div
          className="h-full rounded-full transition-[width] duration-700"
          style={{ width: `${pct}%`, backgroundColor: over ? "#F59E0B" : m.color }}
        />
      </div>
      <span className="text-[12.5px] font-semibold text-neutral-900 w-16 text-right tabular-nums">
        {m.used} / {m.limit}
      </span>
    </div>
  );
}

/**
 * Live view of the LinkedIn safety system: today's action usage vs the
 * account's budgets, the weekly invitation wall, and cooldown/ramp status.
 */
export function AccountHealthCard() {
  const { data, isLoading } = useQuery({
    queryKey: ["account-health"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const dayStart = utcDayStart();
      const weekStart = utcWeekStart();

      const [profileRes, invitesDay, invitesWeek, msgsDay, engDay] = await Promise.all([
        supabase
          .from("profiles")
          .select("daily_connections_limit, daily_messages_limit, daily_engagement_limit, weekly_invites_limit, linkedin_cooldown_until, linkedin_ramp_started_at")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase.from("campaign_connection_requests" as any).select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("sent_at", dayStart),
        supabase.from("campaign_connection_requests" as any).select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("sent_at", weekStart),
        supabase.from("scheduled_messages" as any).select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("sent_at", dayStart),
        supabase.from("linkedin_actions" as any).select("id", { count: "exact", head: true }).eq("user_id", user.id).in("action_type", ["like", "comment"]).gte("created_at", dayStart),
      ]);

      const p: any = profileRes.data || {};
      return {
        connLimit: p.daily_connections_limit || 25,
        msgLimit: p.daily_messages_limit || 15,
        engLimit: p.daily_engagement_limit ?? 40,
        weeklyLimit: p.weekly_invites_limit ?? 80,
        cooldownUntil: p.linkedin_cooldown_until as string | null,
        rampStartedAt: p.linkedin_ramp_started_at as string | null,
        invitesToday: invitesDay.count ?? 0,
        invitesWeek: invitesWeek.count ?? 0,
        messagesToday: msgsDay.count ?? 0,
        engagementToday: engDay.count ?? 0,
      };
    },
    staleTime: 60_000,
  });

  const coolingDown = !!(data?.cooldownUntil && new Date(data.cooldownUntil) > new Date());
  const connRamp = data ? rampAdjustedLimit(data.connLimit, data.rampStartedAt) : null;
  const msgRamp = data ? rampAdjustedLimit(data.msgLimit, data.rampStartedAt) : null;

  return (
    <WidgetCard className="p-5">
      <WidgetHeader icon={coolingDown ? ShieldAlert : ShieldCheck} title="Account health" suffix="(LinkedIn safety)" />

      <div className="mt-3">
        {coolingDown ? (
          <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-amber-700 bg-amber-50 rounded-full px-2.5 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Cooling down until {new Date(data!.cooldownUntil!).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
          </span>
        ) : connRamp?.ramping ? (
          <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-sky-700 bg-sky-50 rounded-full px-2.5 py-1">
            <TrendingUp className="w-3 h-3" />
            Ramp-up day {connRamp.day} — limits raise gradually
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-emerald-700 bg-emerald-50 rounded-full px-2.5 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Protected — all budgets active
          </span>
        )}
      </div>

      {isLoading || !data ? (
        <div className="space-y-2.5 mt-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-4 bg-neutral-100 rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2.5 mt-4">
          <MeterRow m={{ label: "Invites", used: data.invitesToday, limit: connRamp?.limit ?? data.connLimit, color: "#FA7534" }} />
          <MeterRow m={{ label: "Messages", used: data.messagesToday, limit: msgRamp?.limit ?? data.msgLimit, color: "#635BEB" }} />
          <MeterRow m={{ label: "Engagement", used: data.engagementToday, limit: data.engLimit, color: "#FBBF24" }} />
          <MeterRow m={{ label: "Weekly invites", used: data.invitesWeek, limit: data.weeklyLimit, color: "#93C5FD" }} />
        </div>
      )}
    </WidgetCard>
  );
}

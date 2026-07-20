// Central LinkedIn safety budget — the single authority for "may this account
// perform another LinkedIn action right now?".
//
// Every actor (invites, messages, likes, comments) MUST consult
// getLinkedInBudget() before acting and recordLinkedInAction() after acting.
// The ledger lives in public.linkedin_actions; per-account limits and safety
// state live on public.profiles:
//   - daily_connections_limit / daily_messages_limit / daily_engagement_limit
//   - weekly_invites_limit (LinkedIn's real wall is weekly, ~100-200)
//   - linkedin_cooldown_until   → all actions blocked until then
//   - linkedin_ramp_started_at  → limits climb 5, 7, 9… after a cooldown or a
//     fresh account connect, instead of jumping straight to full volume

export type LinkedInActionType = 'invite' | 'message' | 'like' | 'comment';

const RAMP_START = 5;
const RAMP_STEP = 2;

export interface BudgetVerdict {
  allowed: boolean;
  remainingToday: number;
  dailyLimit: number;
  reason: string;
}

export function rampAdjustedLimit(configured: number, rampStartedAt: string | null | undefined): number {
  if (!rampStartedAt) return configured;
  const days = Math.floor((Date.now() - new Date(rampStartedAt).getTime()) / 86_400_000);
  if (days < 0) return RAMP_START; // ramp scheduled to start when cooldown ends
  return Math.min(configured, RAMP_START + RAMP_STEP * days);
}

function utcDayStart(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

function utcWeekStart(): string {
  const d = new Date();
  const dow = (d.getUTCDay() + 6) % 7; // Monday = 0
  d.setUTCDate(d.getUTCDate() - dow);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function getLinkedInBudget(
  sb: any,
  userId: string,
  action: LinkedInActionType,
): Promise<BudgetVerdict> {
  const { data: prof, error: profErr } = await sb
    .from('profiles')
    .select('daily_connections_limit, daily_messages_limit, daily_engagement_limit, weekly_invites_limit, linkedin_cooldown_until, linkedin_ramp_started_at')
    .eq('user_id', userId)
    .maybeSingle();

  // Safety feature: if we cannot read limits, act conservatively (tiny budget),
  // never wide-open.
  if (profErr || !prof) {
    console.warn('[LI-BUDGET] profile read failed — conservative fallback:', profErr?.message);
    return { allowed: true, remainingToday: 2, dailyLimit: 2, reason: 'profile unavailable — conservative fallback' };
  }

  if (prof.linkedin_cooldown_until && new Date(prof.linkedin_cooldown_until) > new Date()) {
    return {
      allowed: false,
      remainingToday: 0,
      dailyLimit: 0,
      reason: `account cooling down until ${prof.linkedin_cooldown_until}`,
    };
  }

  const configured = action === 'invite'
    ? (prof.daily_connections_limit || 25)
    : action === 'message'
      ? (prof.daily_messages_limit || 15)
      : (prof.daily_engagement_limit ?? 40);
  const dailyLimit = rampAdjustedLimit(configured, prof.linkedin_ramp_started_at);

  // Likes and comments share one engagement pool.
  const types = action === 'like' || action === 'comment' ? ['like', 'comment'] : [action];
  const { count: usedToday } = await sb
    .from('linkedin_actions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .in('action_type', types)
    .gte('created_at', utcDayStart());

  let remaining = Math.max(0, dailyLimit - (usedToday || 0));
  let reason = remaining > 0 ? 'ok' : `daily ${action} limit reached (${usedToday}/${dailyLimit})`;

  // Weekly wall for invitations. Count from BOTH the ledger and the historical
  // send records so pre-ledger sends still count against the week.
  if (action === 'invite' && remaining > 0) {
    const weeklyLimit = prof.weekly_invites_limit ?? 80;
    const weekStart = utcWeekStart();
    const [{ count: ledgerWeek }, { count: sentWeek }] = await Promise.all([
      sb.from('linkedin_actions').select('id', { count: 'exact', head: true })
        .eq('user_id', userId).eq('action_type', 'invite').gte('created_at', weekStart),
      sb.from('campaign_connection_requests').select('id', { count: 'exact', head: true })
        .eq('user_id', userId).gte('sent_at', weekStart),
    ]);
    const weekUsed = Math.max(ledgerWeek || 0, sentWeek || 0);
    const weekRemaining = Math.max(0, weeklyLimit - weekUsed);
    if (weekRemaining < remaining) {
      remaining = weekRemaining;
      if (remaining === 0) reason = `weekly invite limit reached (${weekUsed}/${weeklyLimit})`;
    }
  }

  return { allowed: remaining > 0, remainingToday: remaining, dailyLimit, reason };
}

export async function recordLinkedInAction(
  sb: any,
  userId: string,
  accountId: string | null | undefined,
  action: LinkedInActionType,
): Promise<void> {
  const { error } = await sb.from('linkedin_actions').insert({
    user_id: userId,
    account_id: accountId || null,
    action_type: action,
  });
  if (error) console.warn('[LI-BUDGET] failed to record action:', error.message);
}

/**
 * Pause all LinkedIn activity for an account after distress signals (rate
 * limits, unexpected provider errors) and schedule a gentle ramp-up after.
 */
export async function triggerLinkedInCooldown(
  sb: any,
  userId: string,
  reason: string,
  hours = 24,
): Promise<void> {
  const until = new Date(Date.now() + hours * 3_600_000).toISOString();
  const { error } = await sb
    .from('profiles')
    .update({ linkedin_cooldown_until: until, linkedin_ramp_started_at: until })
    .eq('user_id', userId);
  if (error) {
    console.error('[LI-BUDGET] cooldown update failed:', error.message);
    return;
  }
  console.warn(`[LI-BUDGET] cooldown until ${until} for user ${userId}: ${reason}`);
  try {
    await sb.from('notifications').insert({
      user_id: userId,
      title: 'LinkedIn activity paused for safety',
      body: `We detected unusual responses from LinkedIn (${reason}). To protect your account, outreach is paused for ${hours}h and will resume gradually at reduced volume.`,
      type: 'warning',
      link: '/settings?tab=linkedin',
    });
  } catch { /* notification is best-effort */ }
}

/** Randomized human-behaviour delay. */
export function humanDelay(minMs: number, maxMs: number): Promise<void> {
  return new Promise((r) => setTimeout(r, minMs + Math.floor(Math.random() * (maxMs - minMs))));
}

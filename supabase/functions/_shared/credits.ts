// Credits: the one place edge functions charge, refund and handle running out.
// Balance and ledger live in Postgres (spend_credits / refund_credits /
// grant_credits, see migration 20261117210000_credit_pricing.sql); costs come
// from public.credit_costs so Alex can change them without a deploy.
//
// New leads are charged by a trigger on contacts (charge_new_contact), so
// every lead path is covered; this module handles LinkedIn sends.
//
// Rules (Alex, 17 Nov 2026):
//   lead found: 1 fire = lead_1, 2 = lead_2, 3 = lead_3, charged once when it
//     first appears in the account; below 1 fire, duplicates and re-scores are free
//   connection request: charged when sent, refunded when the send fails
//   AI-written campaign message: charged when generated, refunded when the send fails
//   template message: charged when sent, refunded when the send fails
//   replies, AI replies inside a conversation, profile views and likes: free
//
// Charges go to the workspace's billing owner. Accounts without a plan are not
// charged until billing_settings.credits_enforced is turned on.
// If the credit functions are missing (migration not applied yet) every call
// fails open, so deploying functions first never stops the product.
import { billingOwnerOf } from "./account-access.ts";

// deno-lint-ignore no-explicit-any
type Supabase = any;

export type CreditAction = "lead_1" | "lead_2" | "lead_3" | "connection" | "ai_message" | "template_message";

export const DEFAULT_COSTS: Record<CreditAction, number> = {
  lead_1: 1,
  lead_2: 3,
  lead_3: 5,
  connection: 1,
  ai_message: 5,
  template_message: 2,
};

/** The charge for a lead at this fire level (1-3), or null when it's free (below 1 fire). */
export function leadAction(fires: number | null | undefined): CreditAction | null {
  const f = Math.round(Number(fires ?? 0));
  if (!Number.isFinite(f) || f < 1) return null;
  return f >= 3 ? "lead_3" : f === 2 ? "lead_2" : "lead_1";
}

let costCache: { at: number; costs: Record<CreditAction, number> } | null = null;

export async function creditCosts(db: Supabase): Promise<Record<CreditAction, number>> {
  if (costCache && Date.now() - costCache.at < 60_000) return costCache.costs;
  const costs = { ...DEFAULT_COSTS };
  try {
    const { data, error } = await db.from("credit_costs").select("action, credits");
    if (!error) {
      for (const row of (data ?? []) as { action: CreditAction; credits: number }[]) {
        if (row.action in costs && Number.isInteger(row.credits)) costs[row.action] = row.credits;
      }
    }
  } catch {
    /* defaults */
  }
  costCache = { at: Date.now(), costs };
  return costs;
}

const ownerCache = new Map<string, string>();
async function ownerOf(db: Supabase, userId: string): Promise<string> {
  const hit = ownerCache.get(userId);
  if (hit) return hit;
  const owner = await billingOwnerOf(db, userId).catch(() => userId);
  ownerCache.set(userId, owner);
  return owner;
}

/** Owners already handled as out of credits in this invocation (one pause + notification per run). */
const exhaustedThisRun = new Set<string>();

export interface SpendResult {
  ok: boolean;
  /** The account that was charged (the workspace's billing owner). */
  ownerId: string;
  cost: number;
}

/**
 * Charges `action` for `refId` to the user's billing owner. ok=false means the
 * account is out of credits: don't create the lead / don't send. The account's
 * agents and campaigns are paused and the owner is told once.
 */
export async function spendCredits(
  db: Supabase,
  userId: string,
  action: CreditAction,
  refType: string,
  refId: string,
): Promise<SpendResult> {
  const ownerId = await ownerOf(db, userId);
  const cost = (await creditCosts(db))[action];
  if (!cost) return { ok: true, ownerId, cost: 0 };
  const { data, error } = await db.rpc("spend_credits", {
    p_user_id: ownerId,
    p_amount: cost,
    p_reason: action,
    p_ref_type: refType,
    p_ref_id: refId,
  });
  if (error) {
    console.warn(`[credits] spend_credits failed open (${action} ${refId}): ${error.message}`);
    return { ok: true, ownerId, cost: 0 };
  }
  if (data === false) {
    await handleOutOfCredits(db, ownerId);
    return { ok: false, ownerId, cost };
  }
  return { ok: true, ownerId, cost };
}

/** Gives back a charge whose action didn't happen (failed send). Safe to call twice. */
export async function refundCredits(db: Supabase, userId: string, action: CreditAction, refId: string): Promise<number> {
  const ownerId = await ownerOf(db, userId);
  const { data, error } = await db.rpc("refund_credits", { p_user_id: ownerId, p_reason: action, p_ref_id: refId });
  if (error) {
    console.warn(`[credits] refund_credits failed (${action} ${refId}): ${error.message}`);
    return 0;
  }
  return typeof data === "number" ? data : 0;
}

/**
 * Out of credits: pause the workspace's agents and campaigns (they resume on
 * the next grant) and tell the owner once (public.credits_exhausted).
 */
export async function handleOutOfCredits(db: Supabase, ownerId: string): Promise<void> {
  if (exhaustedThisRun.has(ownerId)) return;
  exhaustedThisRun.add(ownerId);
  const { error } = await db.rpc("credits_exhausted", { p_owner: ownerId });
  if (error) console.error("[credits] credits_exhausted failed", error.message);
  else console.log(`[credits] ${ownerId} is out of credits: paused and notified`);
}

/** True when the owner's account currently can't spend (used to skip work early). */
export async function isOutOfCredits(db: Supabase, userId: string): Promise<boolean> {
  const ownerId = await ownerOf(db, userId);
  const { data } = await db.from("profiles").select("credits, plan").eq("user_id", ownerId).maybeSingle();
  if (!data || data.plan == null) {
    const { data: settings } = await db.from("billing_settings").select("credits_enforced").maybeSingle();
    if (!settings?.credits_enforced) return false;
  }
  return (data?.credits ?? 0) <= 0;
}

// Resolves billing access for users. A workspace member inherits the access of
// the workspace owner (the person who pays); someone without a workspace is
// their own owner. Used by the agent runner, the LinkedIn senders and the
// billing enforcer so they all apply the same rule.
import { decideAccess, type Access, type BillingRow } from "./billing.ts";
import { PAYMENTS_ENABLED } from "./payments-policy.ts";

const BILLING_COLUMNS =
  "user_id, current_organization_id, subscription_status, trial_started_at, trial_ends_at, current_period_end, founding";

// Supabase client (untyped: the generated DB types live in the web app).
// deno-lint-ignore no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Supabase = any;

export async function accessForUsers(supabase: Supabase, userIds: string[]): Promise<Map<string, Access>> {
  const result = new Map<string, Access>();
  const ids = [...new Set(userIds.filter(Boolean))];
  if (ids.length === 0) return result;

  const { data: members } = await supabase.from("profiles").select("user_id, current_organization_id").in("user_id", ids);
  const orgIds = [...new Set((members ?? []).map((m: { current_organization_id: string | null }) => m.current_organization_id).filter(Boolean))];
  const ownerByOrg = new Map<string, string>();
  if (orgIds.length) {
    const { data: orgs } = await supabase.from("organizations").select("id, owner_id").in("id", orgIds);
    for (const o of orgs ?? []) if (o.owner_id) ownerByOrg.set(o.id, o.owner_id);
  }

  const ownerOf = new Map<string, string>();
  for (const id of ids) {
    const m = (members ?? []).find((p: { user_id: string }) => p.user_id === id);
    ownerOf.set(id, (m?.current_organization_id && ownerByOrg.get(m.current_organization_id)) || id);
  }

  const ownerIds = [...new Set(ownerOf.values())];
  const { data: owners } = await supabase.from("profiles").select(BILLING_COLUMNS).in("user_id", ownerIds);
  const rowByOwner = new Map<string, BillingRow>();
  for (const o of owners ?? []) rowByOwner.set(o.user_id, o);

  const now = new Date();
  for (const id of ids) {
    result.set(id, decideAccess(rowByOwner.get(ownerOf.get(id)!) ?? null, now, { paymentsEnabled: PAYMENTS_ENABLED }));
  }
  return result;
}

export async function accessForUser(supabase: Supabase, userId: string): Promise<Access> {
  return (await accessForUsers(supabase, [userId])).get(userId) ?? "none";
}

/**
 * Read-only mode for an account: pause the owner's and the workspace members'
 * signal agents and campaigns. Reactivating is a deliberate user action once
 * billing is fixed.
 */
export async function pauseAccount(supabase: Supabase, ownerUserId: string): Promise<{ agents: number; campaigns: number }> {
  const { data: owner } = await supabase.from("profiles").select("current_organization_id").eq("user_id", ownerUserId).maybeSingle();
  let userIds = [ownerUserId];
  if (owner?.current_organization_id) {
    const { data: org } = await supabase.from("organizations").select("owner_id").eq("id", owner.current_organization_id).maybeSingle();
    if (org?.owner_id === ownerUserId) {
      const { data: members } = await supabase.from("organization_members").select("user_id").eq("organization_id", owner.current_organization_id);
      userIds = [...new Set([ownerUserId, ...(members ?? []).map((m: { user_id: string }) => m.user_id)])];
    }
  }
  const { data: agents } = await supabase.from("signal_agents").update({ status: "paused" }).in("user_id", userIds).eq("status", "active").select("id");
  const { data: campaigns } = await supabase.from("campaigns").update({ status: "paused" }).in("user_id", userIds).eq("status", "active").select("id");
  return { agents: agents?.length ?? 0, campaigns: campaigns?.length ?? 0 };
}

/** Signals (contacts) delivered to the account since its trial started. */
export async function countTrialSignals(supabase: Supabase, userId: string, orgId: string | null, since: string | null): Promise<number> {
  if (!since) return 0;
  let q = supabase.from("contacts").select("id", { count: "exact", head: true }).gte("imported_at", since);
  q = orgId ? q.or(`user_id.eq.${userId},organization_id.eq.${orgId}`) : q.eq("user_id", userId);
  const { count, error } = await q;
  if (error) throw new Error(error.message);
  return count ?? 0;
}

/** The workspace owner whose subscription covers this user (themselves if no workspace). */
export async function billingOwnerOf(supabase: Supabase, userId: string): Promise<string> {
  const { data: me } = await supabase.from("profiles").select("current_organization_id").eq("user_id", userId).maybeSingle();
  if (!me?.current_organization_id) return userId;
  const { data: org } = await supabase.from("organizations").select("owner_id").eq("id", me.current_organization_id).maybeSingle();
  return org?.owner_id || userId;
}

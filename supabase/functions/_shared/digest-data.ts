// Builds one account's weekly digest numbers from real tables. Used by the
// scheduler and the admin preview, so the preview is exactly what would go out.
import type { DigestPayload } from "./email-templates/index.ts";

// deno-lint-ignore no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any;

export async function buildDigestPayload(db: Db, userId: string, firstName: string | null, now: Date = new Date()): Promise<DigestPayload> {
  const since = new Date(now.getTime() - 7 * 86_400_000).toISOString();
  const { data: profile } = await db.from("profiles").select("current_organization_id").eq("user_id", userId).maybeSingle();
  const orgId = profile?.current_organization_id ?? null;

  let contacts = db.from("contacts").select("id", { count: "exact", head: true }).gte("imported_at", since);
  contacts = orgId ? contacts.or(`user_id.eq.${userId},organization_id.eq.${orgId}`) : contacts.eq("user_id", userId);

  const [signals, messages, replies, meetings] = await Promise.all([
    contacts,
    db.from("linkedin_actions").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("action_type", "message").gte("created_at", since),
    db.from("campaign_connection_requests").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("last_incoming_message_at", since),
    db.from("meetings").select("contact_id").eq("user_id", userId).neq("status", "cancelled").gte("created_at", since),
  ]);

  const payload: DigestPayload = {
    firstName,
    signals: signals.count ?? 0,
    messages: messages.count ?? 0,
    replies: replies.count ?? 0,
    // One lead can have several meeting rows; count people.
    meetings: new Set((meetings.data ?? []).map((m: { contact_id: string }) => m.contact_id)).size,
  };

  if (payload.signals + payload.messages + payload.replies + payload.meetings === 0) {
    const { data: agent } = await db.from("signal_agents").select("signals_config, icp_job_titles")
      .eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle();
    const keywords: string[] = agent?.signals_config?.keywords?.keyword_posts ?? [];
    if (keywords.length) {
      payload.keywords = keywords.slice(0, 3);
      const { data: stats } = await db.rpc("buying_signal_stats", { _terms: keywords.slice(0, 10), _days: 7 });
      payload.missedCount = stats?.count ?? null;
    }
  }
  return payload;
}

/** Latest campaign's time zone, else UTC. */
export async function accountTimezone(db: Db, userId: string): Promise<string> {
  const { data } = await db.from("campaigns").select("timezone").eq("user_id", userId)
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  return data?.timezone || "UTC";
}

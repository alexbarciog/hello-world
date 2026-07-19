// Full-profile enrichment via Unipile.
// Lead payloads from engagement endpoints are thin (headline only), so the
// pipeline historically scored and stored the HEADLINE as the lead's role.
// This helper fetches the profile with its experience section and derives the
// real current position (title + company), which then feeds both the ICP gate
// and the inserted contact fields.

const POSITION_ARRAY_KEYS = ['work_experience', 'experience', 'experiences', 'positions', 'current_positions'];

export interface CurrentPosition {
  title: string | null;
  company: string | null;
}

function positionsOf(profile: any): any[] {
  for (const k of POSITION_ARRAY_KEYS) {
    const v = profile?.[k];
    if (Array.isArray(v) && v.length) return v;
  }
  return [];
}

function posTitle(pos: any): string | null {
  const t = pos?.position || pos?.title || pos?.role || null;
  return typeof t === 'string' && t.trim() ? t.trim() : null;
}

function posCompany(pos: any): string | null {
  const c = pos?.company;
  if (typeof c === 'string' && c.trim()) return c.trim();
  const n = c?.name || pos?.company_name || pos?.organization || null;
  return typeof n === 'string' && n.trim() ? n.trim() : null;
}

function posIsCurrent(pos: any): boolean {
  if (pos?.current === true || pos?.is_current === true) return true;
  const end = pos?.end ?? pos?.end_date ?? pos?.ends_at ?? pos?.date_range?.end ?? null;
  return end === null || end === undefined || end === '';
}

export function currentPositionOf(profile: any): CurrentPosition | null {
  const arr = positionsOf(profile);
  if (!arr.length) return null;
  const cur = arr.find(posIsCurrent) || arr[0];
  const title = posTitle(cur);
  const company = posCompany(cur);
  if (!title && !company) return null;
  return { title, company };
}

/**
 * In-place: derives `current_role` (real job title) and fills `company` from
 * the current experience entry when present. The headline stays untouched.
 */
export function applyExperienceFields(profile: any): any {
  if (!profile) return profile;
  const cur = currentPositionOf(profile);
  if (cur) {
    if (cur.title && !profile.current_role) profile.current_role = cur.title;
    if (cur.company && !profile.company) profile.company = cur.company;
  }
  return profile;
}

/**
 * Fetches a profile including its experience section via the users endpoint;
 * falls back to the legacy linkedin/profile endpoint when that fails.
 */
export async function fetchProfileWithExperience(
  id: string,
  accountId: string,
  apiKey: string,
  dsn: string,
): Promise<any | null> {
  try {
    const res = await fetch(
      `https://${dsn}/api/v1/users/${encodeURIComponent(id)}?account_id=${accountId}&linkedin_sections=experience`,
      { headers: { 'X-API-KEY': apiKey, 'Accept': 'application/json' } },
    );
    if (res.ok) {
      const data = await res.json();
      if (data && (data.provider_id || data.public_identifier || data.first_name || data.name)) {
        return applyExperienceFields(data);
      }
    } else {
      await res.text();
    }
  } catch { /* fall through to legacy endpoint */ }

  try {
    const res = await fetch(
      `https://${dsn}/api/v1/linkedin/profile/${id}?account_id=${accountId}`,
      { headers: { 'X-API-KEY': apiKey, 'Accept': 'application/json' } },
    );
    if (!res.ok) { await res.text(); return null; }
    return applyExperienceFields(await res.json());
  } catch {
    return null;
  }
}

/**
 * Merges enrichment into a thin payload right before contact insert.
 * No-op when the profile already carries experience data. Never throws.
 */
export async function enrichProfileInPlace(
  p: any,
  accountId: string,
  apiKey: string,
  dsn: string,
): Promise<void> {
  try {
    if (!p || p.current_role) return;
    if (positionsOf(p).length) { applyExperienceFields(p); return; }
    const id = p.public_identifier || p.public_id || p.provider_id || p.id;
    if (!id) return;
    const full = await fetchProfileWithExperience(String(id), accountId, apiKey, dsn);
    if (!full) return;
    for (const k of ['headline', 'industry', 'location', 'public_identifier', 'provider_id', 'first_name', 'last_name', 'summary']) {
      if (full[k] && !p[k]) p[k] = full[k];
    }
    for (const k of POSITION_ARRAY_KEYS) {
      if (Array.isArray(full[k]) && full[k].length && !p[k]) p[k] = full[k];
    }
    if (full.current_role && !p.current_role) p.current_role = full.current_role;
    applyExperienceFields(p);
  } catch { /* enrichment must never break the insert path */ }
}

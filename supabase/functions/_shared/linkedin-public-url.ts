// Helpers to guarantee contacts get a *public* LinkedIn profile URL
// (https://www.linkedin.com/in/{vanity-slug}) instead of one built from
// Unipile's internal member id (ACoAA…/ACwAA…). LinkedIn blocks cross-site
// navigations to /in/{internal-id} URLs ("Blocked this request"), so those
// links fail when clicked from the app even though they work when pasted.

// Internal member ids are ~39-char base64url tokens starting with ACo/ACw.
// Over-matching is harmless: resolving an actual vanity slug through Unipile
// simply returns the same slug back.
const INTERNAL_ID_RE = /^ac[ow][a-z0-9_-]{20,}$/i;

export function isLinkedinInternalId(id: string | null | undefined): boolean {
  if (!id) return false;
  return INTERNAL_ID_RE.test(String(id).trim());
}

export function urlHasInternalId(url: string | null | undefined): boolean {
  if (!url) return false;
  const m = String(url).match(/linkedin\.com\/in\/([^/?#\s]+)/i);
  if (!m) return false;
  let slug = m[1];
  try { slug = decodeURIComponent(slug); } catch { /* keep raw */ }
  return isLinkedinInternalId(slug);
}

export interface PublicUrlResult {
  linkedin_url: string | null;
  public_identifier: string | null;
  resolved_via_api: boolean;
}

/**
 * Returns the best public profile URL for a scraped profile payload.
 * Falls back to one Unipile profile fetch when only an internal id is known.
 * On total failure, returns the internal-id URL (never null if an id exists)
 * so the contact stays discoverable by the backfill job.
 */
export async function resolvePublicLinkedinUrl(
  profile: any,
  accountId: string,
  apiKey: string,
  dsn: string,
): Promise<PublicUrlResult> {
  const directUrl = profile?.linkedin_url || profile?.public_url || profile?.profile_url || null;
  if (directUrl && !urlHasInternalId(directUrl)) {
    return { linkedin_url: directUrl, public_identifier: null, resolved_via_api: false };
  }

  const publicId = [profile?.public_id, profile?.public_identifier]
    .find((v: unknown) => typeof v === 'string' && v && !isLinkedinInternalId(v as string)) as string | undefined;
  if (publicId) {
    return {
      linkedin_url: `https://www.linkedin.com/in/${publicId}`,
      public_identifier: publicId,
      resolved_via_api: false,
    };
  }

  const anyId = profile?.public_id || profile?.public_identifier || profile?.provider_id || profile?.id;
  if (anyId) {
    const resolved = await fetchPublicIdentifier(String(anyId), accountId, apiKey, dsn);
    if (resolved) {
      return {
        linkedin_url: `https://www.linkedin.com/in/${resolved}`,
        public_identifier: resolved,
        resolved_via_api: true,
      };
    }
  }

  // Last resort: keep the old behavior so the backfill can retry later.
  return {
    linkedin_url: directUrl || (anyId ? `https://www.linkedin.com/in/${anyId}` : null),
    public_identifier: null,
    resolved_via_api: false,
  };
}

/** One Unipile profile fetch; returns the vanity slug or null. */
export async function fetchPublicIdentifier(
  id: string,
  accountId: string,
  apiKey: string,
  dsn: string,
): Promise<string | null> {
  try {
    const res = await fetch(
      `https://${dsn}/api/v1/users/${encodeURIComponent(id)}?account_id=${accountId}`,
      { headers: { 'X-API-KEY': apiKey, 'Accept': 'application/json' } },
    );
    if (!res.ok) { await res.text(); return null; }
    const data = await res.json();
    const slug = data?.public_identifier || data?.public_id || null;
    if (slug && !isLinkedinInternalId(slug)) return String(slug);
    // Some payloads only carry the vanity slug inside the profile URL.
    const fromUrl = String(data?.public_profile_url || data?.profile_url || '').match(/linkedin\.com\/in\/([^/?#\s]+)/i);
    if (fromUrl && !isLinkedinInternalId(fromUrl[1])) return fromUrl[1];
    return null;
  } catch {
    return null;
  }
}

/**
 * Normalizes a post URL fabricated as /feed/update/{id}:
 * bare numeric activity ids only work wrapped as urn:li:activity:{id}.
 * Returns null when the URL is fine as-is.
 */
export function normalizePostUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = String(url).match(/linkedin\.com\/feed\/update\/([^/?#\s]+)/i);
  if (!m) return null;
  const id = m[1];
  if (/^\d{5,}$/.test(id)) {
    return `https://www.linkedin.com/feed/update/urn:li:activity:${id}`;
  }
  return null;
}

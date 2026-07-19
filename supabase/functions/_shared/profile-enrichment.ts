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
    if (!p) return;
    if (!p.current_role) {
      if (positionsOf(p).length) {
        applyExperienceFields(p);
      } else {
        const id = p.public_identifier || p.public_id || p.provider_id || p.id;
        if (id) {
          const full = await fetchProfileWithExperience(String(id), accountId, apiKey, dsn);
          if (full) {
            for (const k of ['headline', 'industry', 'location', 'public_identifier', 'provider_id', 'first_name', 'last_name', 'summary']) {
              if (full[k] && !p[k]) p[k] = full[k];
            }
            for (const k of POSITION_ARRAY_KEYS) {
              if (Array.isArray(full[k]) && full[k].length && !p[k]) p[k] = full[k];
            }
            if (full.current_role && !p.current_role) p.current_role = full.current_role;
            applyExperienceFields(p);
          }
        }
      }
    }
    await resolvePrimaryEmployerIfAmbiguous(p, accountId, apiKey, dsn);
  } catch { /* enrichment must never break the insert path */ }
}

async function fetchRecentPostTexts(
  id: string,
  accountId: string,
  apiKey: string,
  dsn: string,
  limit = 5,
): Promise<string[]> {
  try {
    const res = await fetch(
      `https://${dsn}/api/v1/users/${encodeURIComponent(id)}/posts?account_id=${accountId}&limit=${limit}`,
      { headers: { 'X-API-KEY': apiKey, 'Accept': 'application/json' } },
    );
    if (!res.ok) { await res.text(); return []; }
    const data = await res.json();
    const items = data?.items || data?.data || (Array.isArray(data) ? data : []);
    return (Array.isArray(items) ? items : [])
      .map((post: any) => String(post?.text || post?.commentary || '').trim())
      .filter((t: string) => t.length > 30)
      .slice(0, limit);
  } catch {
    return [];
  }
}

/**
 * Side-project disambiguation: people often list several "current" positions
 * (a day job plus advisor/founder side projects). When 2+ current positions
 * exist, one AI call over their recent posts picks the position that is their
 * actual main focus, and title/company are set from it. Never throws.
 */
export async function resolvePrimaryEmployerIfAmbiguous(
  p: any,
  accountId: string,
  apiKey: string,
  dsn: string,
): Promise<void> {
  try {
    const currents = positionsOf(p).filter(posIsCurrent);
    if (currents.length < 2) return;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) return;

    const id = p.provider_id || p.public_identifier || p.public_id || p.id;
    const postTexts = id ? await fetchRecentPostTexts(String(id), accountId, apiKey, dsn) : [];

    const positionsBlock = currents
      .map((pos: any, i: number) => `${i}. ${posTitle(pos) || '(role unknown)'} @ ${posCompany(pos) || '(company unknown)'}`)
      .join('\n');
    const postsBlock = postTexts.length
      ? `RECENT POSTS BY THIS PERSON:\n${postTexts.map((t) => `- ${t.slice(0, 280)}`).join('\n')}`
      : 'RECENT POSTS: none available (decide from the positions and headline alone)';

    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        temperature: 0.1,
        messages: [
          {
            role: 'system',
            content: 'A LinkedIn profile lists several concurrent positions. Decide which one is the person\'s PRIMARY occupation — their real day-to-day focus — using their recent posts (what they actually talk about), position order, and seniority. Side projects, advisor seats, and vanity founder titles are NOT primary unless the posts clearly revolve around them. Respond ONLY via the tool call.',
          },
          {
            role: 'user',
            content: `HEADLINE: ${p.headline || '(none)'}\n\nCURRENT POSITIONS:\n${positionsBlock}\n\n${postsBlock}\n\nWhich position index is their primary occupation?`,
          },
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'pick_primary_position',
            description: 'Select the primary current position',
            parameters: {
              type: 'object',
              properties: {
                primary_index: { type: 'number', description: 'Index of the primary position from the list' },
                reason: { type: 'string', description: 'Short reason, max 12 words' },
              },
              required: ['primary_index', 'reason'],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: 'function', function: { name: 'pick_primary_position' } },
      }),
    });
    if (!res.ok) { await res.text(); return; }
    const data = await res.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) return;
    const parsed = JSON.parse(toolCall.function.arguments);
    const idx = Math.floor(Number(parsed?.primary_index));
    if (!Number.isFinite(idx) || idx < 0 || idx >= currents.length) return;
    const chosen = currents[idx];
    const title = posTitle(chosen);
    const company = posCompany(chosen);
    if (title) p.current_role = title;
    if (company) p.company = company;
    p.primary_employer_reason = String(parsed?.reason || '');
  } catch { /* disambiguation is best-effort */ }
}

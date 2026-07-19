// Word-boundary phrase matching for ICP filters.
// Plain substring checks produce false positives that poison lead quality:
// location "US" matches "aUStria"/"rUSsia", title "CEO" matches "I help CEOs".
// A phrase only counts when it appears as whole words inside the container.

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * True when `phrase` appears in `container` bounded by non-alphanumerics,
 * so it works on both normalized text ("new york us") and raw headlines
 * ("CEO/Founder @ Acme"). Case-insensitive.
 */
export function wordPhraseIncludes(container: string, phrase: string): boolean {
  const c = (container || '').trim();
  const p = (phrase || '').trim();
  if (!c || !p) return false;
  return new RegExp(`(^|[^a-z0-9])${escapeRegExp(p)}([^a-z0-9]|$)`, 'i').test(c);
}

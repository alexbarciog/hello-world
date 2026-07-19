const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { fetchPublicIdentifier, normalizePostUrl, urlHasInternalId } from '../_shared/linkedin-public-url.ts';

/**
 * One-off/resumable backfill: rewrites contact LinkedIn URLs that were built
 * from Unipile internal member ids (/in/ACoAA…) into real public profile URLs,
 * and normalizes fabricated post URLs (/feed/update/{bare-numeric-id}).
 *
 * Body: { batch_size?: number (default 30, max 100), dry_run?: boolean, after_id?: string }
 * Re-invoke with the returned `last_id` as `after_id` until `remaining` is 0.
 * Rows that fail to resolve are reported and skipped within the run; they stay
 * in place so a later run can retry them (pass their ids via `after_id` to move past).
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const json = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  try {
    const UNIPILE_API_KEY = Deno.env.get('UNIPILE_API_KEY');
    const UNIPILE_DSN = Deno.env.get('UNIPILE_DSN');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    if (!UNIPILE_API_KEY || !UNIPILE_DSN) throw new Error('Unipile not configured');

    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const body = await req.json().catch(() => ({}));
    const batchSize = Math.min(Math.max(Number(body.batch_size) || 30, 1), 100);
    const dryRun = body.dry_run === true;
    const afterId: string | null = body.after_id || null;

    const INTERNAL_URL_FILTER = 'linkedin_url.ilike.%/in/acoaa%,linkedin_url.ilike.%/in/acwaa%';

    // ── Pass 1: profile URLs built from internal ids ──
    let q = sb
      .from('contacts')
      .select('id, user_id, linkedin_url, linkedin_profile_id')
      .or(INTERNAL_URL_FILTER)
      .order('id', { ascending: true })
      .limit(batchSize);
    if (afterId) q = q.gt('id', afterId);
    const { data: broken, error: qErr } = await q;
    if (qErr) throw qErr;

    // Map each owner to their Unipile account once per run.
    const userIds = [...new Set((broken || []).map((c: any) => c.user_id))];
    const accountByUser = new Map<string, string>();
    if (userIds.length) {
      const { data: profiles } = await sb
        .from('profiles')
        .select('user_id, unipile_account_id')
        .in('user_id', userIds);
      for (const p of profiles || []) {
        if (p.unipile_account_id) accountByUser.set(p.user_id, p.unipile_account_id);
      }
    }

    let fixed = 0;
    let failed = 0;
    let noAccount = 0;
    let lastId: string | null = afterId;
    const failures: { id: string; reason: string }[] = [];

    for (const c of broken || []) {
      lastId = c.id;
      const accountId = accountByUser.get(c.user_id);
      if (!accountId) { noAccount++; continue; }

      const idFromUrl = String(c.linkedin_url || '').match(/linkedin\.com\/in\/([^/?#\s]+)/i)?.[1] || null;
      const resolveId = idFromUrl || c.linkedin_profile_id;
      if (!resolveId) { failed++; failures.push({ id: c.id, reason: 'no id to resolve' }); continue; }

      const slug = await fetchPublicIdentifier(resolveId, accountId, UNIPILE_API_KEY, UNIPILE_DSN);
      if (!slug) { failed++; failures.push({ id: c.id, reason: 'unipile could not resolve' }); continue; }

      const newUrl = `https://www.linkedin.com/in/${slug}`;
      if (!dryRun) {
        const { error: upErr } = await sb.from('contacts').update({ linkedin_url: newUrl }).eq('id', c.id);
        if (upErr) { failed++; failures.push({ id: c.id, reason: upErr.message }); continue; }
      }
      fixed++;
      await new Promise((r) => setTimeout(r, 300)); // stay well under Unipile rate limits
    }

    // ── Pass 2: post URLs with bare numeric ids (pure rewrite, no API calls) ──
    let postsFixed = 0;
    const { data: brokenPosts } = await sb
      .from('contacts')
      .select('id, signal_post_url')
      .ilike('signal_post_url', '%/feed/update/%')
      .not('signal_post_url', 'ilike', '%urn:%')
      .limit(200);
    for (const c of brokenPosts || []) {
      const normalized = normalizePostUrl(c.signal_post_url);
      if (!normalized) continue;
      if (!dryRun) {
        const { error: upErr } = await sb.from('contacts').update({ signal_post_url: normalized }).eq('id', c.id);
        if (upErr) continue;
      }
      postsFixed++;
    }

    // Estimate how many profile rows still match (includes this batch's failures).
    const { count: remaining } = await sb
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .or(INTERNAL_URL_FILTER);

    // Sanity check the counter itself so callers can trust `remaining`.
    const stillInternal = (remaining || 0) > 0 && (broken || []).some((c: any) => urlHasInternalId(c.linkedin_url));

    return json({
      status: 'ok',
      dry_run: dryRun,
      batch: (broken || []).length,
      fixed,
      failed,
      no_unipile_account: noAccount,
      posts_fixed: postsFixed,
      remaining: remaining || 0,
      has_more: stillInternal || (remaining || 0) > failed + noAccount,
      last_id: lastId,
      failures: failures.slice(0, 20),
    });
  } catch (error) {
    console.error('[backfill-linkedin-urls] fatal:', error);
    return json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});

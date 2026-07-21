/**
 * keyword-performance-review — weekly intelligence pass (cron: Monday 06:00).
 *
 * For every active signal agent, evaluates each configured keyword against
 * real outcomes (leads produced → user approvals/rejections mined from
 * contacts.signal + approval_status) and notifies the owner about
 * underperformers. Deliberately NON-destructive: it never edits the agent's
 * keyword list — the user stays in control and can regenerate keywords from
 * the agent editor (generation already learns from the same history).
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: agents } = await supabase
      .from('signal_agents')
      .select('id, user_id, name, keywords, status')
      .eq('status', 'active');

    let reviewed = 0;
    let notified = 0;

    for (const agent of agents || []) {
      const keywords: string[] = (Array.isArray(agent.keywords) ? agent.keywords : [])
        .filter((k: unknown) => typeof k === 'string' && k);
      if (keywords.length === 0) continue;
      reviewed++;

      // Outcomes for this user's keyword-attributed leads
      const { data: rows } = await supabase
        .from('contacts')
        .select('signal, approval_status')
        .eq('user_id', agent.user_id)
        .like('signal', 'Posted about "%')
        .limit(2000);

      const stats = new Map<string, { total: number; approved: number; rejected: number }>();
      for (const row of rows || []) {
        const m = /^Posted about "(.+?)"/.exec(row.signal || '');
        if (!m) continue;
        const kw = m[1].toLowerCase();
        const s = stats.get(kw) || { total: 0, approved: 0, rejected: 0 };
        s.total++;
        if (row.approval_status === 'approved') s.approved++;
        if (row.approval_status === 'rejected') s.rejected++;
        stats.set(kw, s);
      }

      const underperformers: string[] = [];
      const winners: string[] = [];
      for (const kw of keywords) {
        const s = stats.get(kw.toLowerCase());
        if (!s) continue;
        if (s.total >= 5 && s.approved === 0 && s.rejected >= 2) {
          underperformers.push(`"${kw}" (${s.total} leads, ${s.rejected} rejected, 0 approved)`);
        } else if (s.approved >= 2 && s.approved >= s.rejected) {
          winners.push(kw);
        }
      }

      if (underperformers.length === 0) continue;

      // De-dupe: at most one review notification per agent per week
      const weekAgo = new Date(Date.now() - 6.5 * 86_400_000).toISOString();
      const { count: recent } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', agent.user_id)
        .eq('title', `Keyword review: ${agent.name}`)
        .gte('created_at', weekAgo);
      if ((recent || 0) > 0) continue;

      await supabase.from('notifications').insert({
        user_id: agent.user_id,
        title: `Keyword review: ${agent.name}`,
        body: `${underperformers.length} keyword${underperformers.length === 1 ? ' is' : 's are'} producing leads you keep rejecting: ${underperformers.slice(0, 3).join('; ')}${underperformers.length > 3 ? '…' : ''}. Open the agent and regenerate keywords — generation learns from your approvals${winners.length ? ` (keeping winners like "${winners[0]}")` : ''}.`,
        type: 'info',
        link: '/signals',
      });
      notified++;
    }

    console.log(`[keyword-review] agents reviewed: ${reviewed}, notifications sent: ${notified}`);
    return json({ ok: true, reviewed, notified });
  } catch (e) {
    console.error('[keyword-review] error:', e);
    return json({ error: e instanceof Error ? e.message : 'Unknown' }, 500);
  }
});

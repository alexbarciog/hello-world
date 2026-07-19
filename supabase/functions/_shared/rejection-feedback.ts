// Feedback loop: leads the user manually rejected become negative few-shot
// examples for the AI classifiers, so the pipeline stops re-surfacing the
// same kind of lead. Loaded once per agent run; failures return '' so the
// classifiers run exactly as before when no feedback exists.

export async function loadRejectionExamples(
  sb: any,
  userId: string,
  limit = 10,
): Promise<string> {
  try {
    const { data } = await sb
      .from('contacts')
      .select('title, company, industry, signal')
      .eq('user_id', userId)
      .eq('approval_status', 'rejected')
      .order('imported_at', { ascending: false })
      .limit(limit);
    if (!data || data.length === 0) return '';
    const lines = data.map((c: any, i: number) => {
      const sig = (c.signal || '').slice(0, 120);
      return `${i + 1}. ${c.title || '(no title)'} @ ${c.company || '(unknown company)'}${c.industry ? ` — ${c.industry}` : ''}${sig ? ` | signal: "${sig}"` : ''}`;
    });
    return `

═══════════════════════════════════════════════════════════════════════════════
USER FEEDBACK — LEADS THE USER MANUALLY REJECTED (learn from these)
═══════════════════════════════════════════════════════════════════════════════
The user reviewed and REJECTED these recent leads. Treat profiles resembling
them as poor fits: score them low and lean toward rejection when a new person
matches the same role/company/industry pattern.
${lines.join('\n')}`;
  } catch {
    return '';
  }
}

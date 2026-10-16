-- Plan and budget settings read by the weekly CEO review.
insert into public.ops_config (key, value) values
 ('budget_rule', '{"pct_of_last_month_mrr":30,"floor_usd":50,"currency":"usd","set_by":"Alex Barciog","set_on":"2026-10-16"}'),
 ('known_costs', '[]'),
 ('plan_stages', '[{"stage":0,"mrr_to":1000,"goal":"10 paying customers by hand, 5 testimonials"},{"stage":1,"mrr_to":5000,"goal":"Launch (Product Hunt + Reddit), one free tool a month"},{"stage":2,"mrr_to":20000,"goal":"Sharper positioning, higher prices, share loop; part-time support contractor at $10k MRR"},{"stage":3,"mrr_to":50000,"goal":"Hire an operator at $20-25k MRR; freelance dev; TrustMRR verified revenue"},{"stage":4,"mrr_to":105000,"goal":"Full-time engineer; paid ads on top of working organic; sell at 3-4x ARR"}]')
on conflict (key) do nothing;

-- Removes the claim that Intentsly has Reddit and X signals from /learn/what-is-intent-data.
-- One sentence; the rest of the page is unchanged.
update public.blog_posts
set content_md = replace(content_md,
  $q$Intentsly's [LinkedIn signals](/features/linkedin-signals) and [Reddit and X signals](/features/reddit-x-signals) do the same monitoring continuously$q$,
  $q$Intentsly's [LinkedIn signals](/features/linkedin-signals) do the same monitoring on LinkedIn continuously$q$)
where slug = 'what-is-intent-data' and content_md like '%/features/reddit-x-signals%'
returning slug, status, updated_at;

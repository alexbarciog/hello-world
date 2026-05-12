update public.linkedin_posts
set auto_comment_posted_at = null
where id = '6b1d222e-7bbc-4a58-a9fd-69c5ce7bc980'
  and auto_comment_posted_at is not null;
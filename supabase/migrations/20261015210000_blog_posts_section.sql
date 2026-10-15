-- Content sections for intentsly.com: /blog, /guides, /learn, /solutions, /compare.
-- Additive: one column with a default, one index. Existing rows stay in 'blog'.
alter table public.blog_posts
  add column if not exists section text not null default 'blog'
  check (section in ('blog', 'guides', 'learn', 'solutions', 'compare'));

create index if not exists blog_posts_section_idx
  on public.blog_posts (section, published_at desc) where status = 'published';

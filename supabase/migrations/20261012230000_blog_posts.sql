-- Blog storage for intentsly.com/blog. Additive: touches no existing table.
create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  meta_title text not null,
  meta_description text not null,
  excerpt text not null,
  content_md text not null,
  primary_keyword text,
  secondary_keywords text[] not null default '{}',
  cluster text,
  article_type text,
  faq jsonb not null default '[]'::jsonb,
  cover_image_url text,
  author_name text,
  author_title text,
  reading_minutes int,
  word_count int,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists blog_posts_published_idx on public.blog_posts (published_at desc) where status = 'published';
create index if not exists blog_posts_cluster_idx on public.blog_posts (cluster) where status = 'published';

alter table public.blog_posts enable row level security;

-- Anyone may read published articles. Nobody can write through the public API:
-- writes go through the blog-publish edge function, which uses the service role.
drop policy if exists "Published posts are public" on public.blog_posts;
create policy "Published posts are public" on public.blog_posts
  for select to anon, authenticated using (status = 'published');

create or replace function public.blog_posts_touch() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists blog_posts_touch on public.blog_posts;
create trigger blog_posts_touch before update on public.blog_posts
  for each row execute function public.blog_posts_touch();

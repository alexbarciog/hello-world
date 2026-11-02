#!/usr/bin/env python3
"""Publishing helper for runs that write to the database through the Supabase connector.

  python3 scripts/blog_cloud.py sql  blog/drafts/<slug>.md   -> gate, then write blog/out/<slug>.sql
  python3 scripts/blog_cloud.py mark blog/drafts/<slug>.md   -> after the SQL succeeded: file the article as published

`sql` refuses to produce anything unless the gate passes and today's quota is free. Updating a published
page uses the same commands with a draft of the same slug (refresh mode): its original published_at stays.
For a new page, `sql` also writes upserts for the pages named in `backlinks_from`.
"""
import sys, json, re, pathlib, secrets
from common import ROOT, parse_draft, today
import blog_gate

COLS = ["slug", "section", "title", "meta_title", "meta_description", "excerpt", "content_md", "primary_keyword", "cluster",
        "article_type", "author_name", "author_title"]


def published_today():
    """Pages published or refreshed today, across all sections."""
    stamp = today().strftime("%Y-%m-%d")
    n = 0
    for f in (ROOT / "blog" / "published").glob("*.md"):
        m, _ = parse_draft(f)
        n += stamp in blog_gate.run_dates(m)
    return n


def build_sql(meta, body, c, n_words):
    parts = re.split(r"^## +FAQ.*$", body, flags=re.M | re.I)
    faq = [{"question": q.strip(), "answer": a.strip()} for q, a in
           re.findall(r"^### +(.+?)\s*\n(.*?)(?=^### |\Z)", parts[1] if len(parts) > 1 else "", re.M | re.S)]
    row = {"slug": meta["slug"], "section": meta.get("section", "blog"), "title": meta["title"], "meta_title": meta["meta_title"],
           "meta_description": meta["meta_description"], "excerpt": meta["excerpt"], "content_md": body,
           "primary_keyword": meta["primary_keyword"], "cluster": meta["cluster"], "article_type": meta["type"],
           "author_name": c["author"], "author_title": c["author_title"]}
    secondary = [s.strip() for s in meta.get("secondary_keywords", "").split(",") if s.strip()]
    everything = json.dumps([row, faq, secondary])
    while True:  # a dollar-quote tag that cannot occur in the content
        tag = "q" + secrets.token_hex(6)
        if tag not in everything:
            break
    q = lambda s: f"${tag}${s}${tag}$"
    values = [q(row[k]) for k in COLS]
    arr = "array[" + ", ".join(q(s) for s in secondary) + "]::text[]" if secondary else "'{}'::text[]"
    minutes = max(1, round(n_words / 220))
    # updated_at is set by a trigger on every UPDATE and drives <lastmod>, so an identical re-run must not
    # update the row. No row returned means nothing changed.
    return (
        f"insert into public.blog_posts ({', '.join(COLS)}, secondary_keywords, faq, reading_minutes, word_count, status, published_at)\n"
        f"values ({', '.join(values)}, {arr}, {q(json.dumps(faq, ensure_ascii=False))}::jsonb, {minutes}, {n_words}, 'published', now())\n"
        "on conflict (slug) do update set\n  "
        + ",\n  ".join(f"{k} = excluded.{k}" for k in COLS[1:] + ["secondary_keywords", "faq", "reading_minutes", "word_count", "status"])
        + ",\n  published_at = coalesce(public.blog_posts.published_at, excluded.published_at)\n"
        "where (public.blog_posts.content_md, public.blog_posts.title, public.blog_posts.meta_title, public.blog_posts.meta_description, public.blog_posts.excerpt, public.blog_posts.status)\n"
        "  is distinct from (excluded.content_md, excluded.title, excluded.meta_title, excluded.meta_description, excluded.excerpt, excluded.status)\n"
        "returning slug, status, published_at, updated_at;\n"
    )


def main():
    if len(sys.argv) != 3 or sys.argv[1] not in ("sql", "mark"):
        sys.exit(__doc__)
    path = pathlib.Path(sys.argv[2]); c = blog_gate.cfg()
    meta, body = parse_draft(path)

    if sys.argv[1] == "mark":
        now = today()
        dest = ROOT / "blog" / "published" / path.name
        text = re.sub(r"^(published_at|updated_at):.*\n", "", path.read_text(), flags=re.M)
        stamps = f"published_at: {now.isoformat()}\n"
        if dest.exists():  # refresh: the page keeps its publication date
            stamps = f"published_at: {parse_draft(dest)[0].get('published_at', now.isoformat())}\nupdated_at: {now.isoformat()}\n"
        dest.write_text(text.replace("---\n", f"---\n{stamps}", 1)); path.unlink()
        with open(ROOT / "blog" / "published" / "log.jsonl", "a") as f:
            f.write(json.dumps({"slug": meta["slug"], "keyword": meta["primary_keyword"], "at": now.isoformat()}) + "\n")
        kp = ROOT / "blog" / "keywords.json"; data = json.loads(kp.read_text())
        for k in data["keywords"]:
            if k["keyword"].lower() == meta["primary_keyword"].lower():
                k["status"], k["slug"] = "published", meta["slug"]
        kp.write_text(json.dumps(data, indent=1))
        sec = c.get("sections", {}).get(meta.get("section", "blog"), c["blog_path"])
        print(json.dumps({"marked": True, "url": f"{c['site']}{sec}/{meta['slug']}"})); return

    report = blog_gate.check(path)
    if report["pass"] and published_today() >= c.get("max_posts_per_day", 1):
        report["pass"] = False; report["fails"].append("daily cap reached: an article was already published today")
    if c["author"].strip().upper() == "YOUR NAME":
        report["pass"] = False; report["fails"].append("author is still the placeholder in config/blog.json")
    if not report["pass"]:
        print(json.dumps({"ready": False, **report}, indent=2, ensure_ascii=False)); sys.exit(1)

    out = ROOT / "blog" / "out"; out.mkdir(exist_ok=True)
    (out / f"{meta['slug']}.sql").write_text(build_sql(meta, body, c, report["words"]))
    # A new page must not be an orphan: re-upsert the two pages that now link to it.
    backlink_files = []
    for name, m in blog_gate.published():
        if blog_gate.page_path(m, c) in [s.strip() for s in meta.get("backlinks_from", "").split(",")]:
            m2, b2 = parse_draft(ROOT / "blog" / "published" / name)
            (out / f"{m2['slug']}.sql").write_text(build_sql(m2, b2, c, len(blog_gate.words(blog_gate.plain(b2)))))
            backlink_files.append(f"blog/out/{m2['slug']}.sql")
    print(json.dumps({"ready": True, "sql_file": f"blog/out/{meta['slug']}.sql", "words": report["words"],
                      "unique_words": report["unique_words"], "backlink_sql_files": backlink_files,
                      "warnings": report["warnings"]}, indent=2))


if __name__ == "__main__":
    main()

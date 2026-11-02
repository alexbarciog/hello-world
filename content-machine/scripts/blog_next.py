#!/usr/bin/env python3
"""Pick the next keyword to write about, or update a keyword's status.

Usage: python3 scripts/blog_next.py [--section <name>]   -> next queued keyword in that section (default blog) as JSON
       python3 scripts/blog_next.py --refresh [--section <name>]   -> the weakest existing page in that section
       python3 scripts/blog_next.py set "<keyword>" <status> [slug]
Order: priority 1 first, then easier difficulty, while rotating clusters so one topic is not
published twice in a row. Statuses: queued, briefed, drafted, published, blocked, skipped, paused.
Keywords whose intent an existing page already covers are passed over. When nothing is left in the
queue the answer is refresh mode: improve the weakest existing page instead of publishing a new one.
"""
import sys, json, re, datetime
from common import ROOT, parse_draft, seo_policy, today
import blog_gate

P = ROOT / "blog" / "keywords.json"
RANK = {"low": 0, "medium": 1, "high": 2}


def weakest_page(section):
    """Indexable page in the section with the fewest words and internal links, not refreshed recently."""
    c, policy = blog_gate.cfg(), seo_policy()
    cooldown = today().date() - datetime.timedelta(days=c.get("refresh_cooldown_days", 30))
    pages = []
    for name, m in blog_gate.published():
        if m.get("section", "blog") != section or not blog_gate.is_indexable(blog_gate.page_path(m, c), policy):
            continue
        if m.get("updated_at", "")[:10] and datetime.date.fromisoformat(m["updated_at"][:10]) > cooldown:
            continue
        _, body = parse_draft(ROOT / "blog" / "published" / name)
        links = {u for u in re.findall(r"(?<!!)\[[^\]]+\]\((/[^)\s#?]+)", body)}
        pages.append({"slug": m["slug"], "section": section, "cluster": m.get("cluster"), "keyword": m.get("primary_keyword"),
                      "file": f"blog/published/{name}", "words": len(blog_gate.words(blog_gate.plain(body))), "internal_links": len(links)})
    by_words = sorted(pages, key=lambda p: p["words"])
    by_links = sorted(pages, key=lambda p: p["internal_links"])
    pages.sort(key=lambda p: (by_words.index(p) + by_links.index(p), p["slug"]))
    if not pages:
        return {"mode": "refresh", "slug": None, "note": f"nothing to refresh in {section}: publish nothing this run"}
    return {"mode": "refresh", **pages[0], "note": "improve this page, do not create a new one; see RUN.md"}


def main():
    data = json.loads(P.read_text()); kws = data["keywords"]
    section = "blog"  # each scheduled task works one section; "set" applies to any keyword
    refresh = "--refresh" in sys.argv
    if refresh:
        sys.argv.remove("--refresh")
    if len(sys.argv) >= 3 and sys.argv[1] == "--section":
        section = sys.argv[2]; del sys.argv[1:3]
    if not (len(sys.argv) >= 4 and sys.argv[1] == "set"):
        kws = [k for k in kws if k.get("section", "blog") == section]
    if len(sys.argv) >= 4 and sys.argv[1] == "set":
        for k in kws:
            if k["keyword"].lower() == sys.argv[2].lower():
                k["status"] = sys.argv[3]
                if len(sys.argv) > 4: k["slug"] = sys.argv[4]
                P.write_text(json.dumps(data, indent=1)); print(json.dumps(k)); return
        sys.exit("keyword not found")
    if refresh:
        print(json.dumps(weakest_page(section), indent=1)); return
    done = [k for k in data["keywords"] if k["status"] == "published"]
    last_cluster = done[-1]["cluster"] if done else None
    queue = sorted((k for k in kws if k["status"] == "queued" and not blog_gate.intent_conflicts(k["keyword"], k.get("slug"))),
                   key=lambda k: (k["priority"], k["cluster"] == last_cluster, RANK.get(k["difficulty"], 1)))
    print(json.dumps({"mode": "new", **queue[0]} if queue else weakest_page(section), indent=1))


if __name__ == "__main__":
    main()

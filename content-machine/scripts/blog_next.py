#!/usr/bin/env python3
"""Pick the next keyword to write about, or update a keyword's status.

Usage: python3 scripts/blog_next.py [--section <name>]   -> next queued keyword in that section (default blog) as JSON
       python3 scripts/blog_next.py set "<keyword>" <status> [slug]
Order: priority 1 first, then easier difficulty, while rotating clusters so one topic is not
published twice in a row. Statuses: queued, briefed, drafted, published, blocked, skipped.
"""
import sys, json
from common import ROOT

P = ROOT / "blog" / "keywords.json"
RANK = {"low": 0, "medium": 1, "high": 2}


def main():
    data = json.loads(P.read_text()); kws = data["keywords"]
    section = "blog"  # each scheduled task works one section; "set" applies to any keyword
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
    done = [k for k in data["keywords"] if k["status"] == "published"]
    last_cluster = done[-1]["cluster"] if done else None
    queue = sorted((k for k in kws if k["status"] == "queued"),
                   key=lambda k: (k["priority"], k["cluster"] == last_cluster, RANK.get(k["difficulty"], 1)))
    print(json.dumps(queue[0] if queue else {"keyword": None, "note": "queue empty: run blog-keywords"}, indent=1))


if __name__ == "__main__":
    main()

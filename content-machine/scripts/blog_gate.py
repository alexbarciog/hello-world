#!/usr/bin/env python3
"""Quality gate for blog articles. Every article must pass before it is published.

Usage: python3 scripts/blog_gate.py blog/drafts/<slug>.md
Exit 0 = pass, 1 = fail. Prints a JSON report.
"""
import sys, re, json, difflib, datetime
from common import ROOT, parse_draft, today
import gate as li_gate

REQUIRED = ["title", "slug", "primary_keyword", "cluster", "type", "meta_title", "meta_description",
            "excerpt", "original_angle", "checked_on"]
BLOG_BANNED = ["delve", "in today's", "ever-evolving", "ever-changing", "fast-paced", "landscape of", "let's dive in",
               "game-changer", "game changer", "seamless", "robust solution", "unlock the", "supercharge",
               "revolutionize", "in conclusion", "look no further", "when it comes to", "it's important to note",
               "it is important to note", "navigating the", "ultimate guide", "everything you need to know",
               "take your", "to the next level", "in the world of"]
STOP = {"a", "an", "the", "to", "for", "of", "on", "in", "and", "or", "with", "how", "what", "is", "my", "vs", "your"}


def cfg():
    return json.loads((ROOT / "config" / "blog.json").read_text())


def words(text):
    return re.findall(r"[A-Za-z0-9][A-Za-z0-9'’-]*", text)


def plain(md):
    t = re.sub(r"```.*?```", " ", md, flags=re.S)
    t = re.sub(r"!\[[^\]]*\]\([^)]*\)", " ", t)
    t = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", t)
    return re.sub(r"[#>*_`|]", " ", t)


def kw_in(keyword, text):
    """Loose match: every meaningful word of the keyword (or its singular/plural) appears."""
    low = text.lower()
    toks = [w for w in words(keyword.lower()) if w not in STOP]
    return all(re.search(r"\b" + re.escape(w.rstrip("s")) + r"(s|es)?\b", low) for w in toks)


def published():
    out = []
    for f in sorted((ROOT / "blog" / "published").glob("*.md")):
        m, _ = parse_draft(f)
        out.append((f.name, m))
    return out


def check(path):
    c = cfg()
    meta, body = parse_draft(path)
    fails, warns = [], []
    if (ROOT / "PAUSE").exists():
        fails.append("PAUSE file present: publishing is stopped")

    missing = [k for k in REQUIRED if not meta.get(k)]
    if missing:
        return {"article": str(path), "pass": False, "fails": ["missing front matter: " + ", ".join(missing)], "warnings": []}

    kw, typ, slug = meta["primary_keyword"], meta["type"], meta["slug"]
    text = plain(body)
    n = len(words(text))

    # --- structure and SEO basics
    if not re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", slug) or len(slug) > 70:
        fails.append("slug must be lowercase-with-hyphens, 70 chars max")
    if typ not in c["min_words"]:
        fails.append(f"unknown type '{typ}'")
    elif n < c["min_words"][typ]:
        fails.append(f"too short for a {typ} article: {n} words (min {c['min_words'][typ]})")
    if n > c["max_words"]:
        fails.append(f"too long: {n} words (max {c['max_words']})")
    if len(meta["meta_title"]) > c["meta_title_max"]:
        fails.append(f"meta_title is {len(meta['meta_title'])} chars (max {c['meta_title_max']})")
    lo, hi = c["meta_description_range"]
    if not lo <= len(meta["meta_description"]) <= hi:
        fails.append(f"meta_description is {len(meta['meta_description'])} chars (needs {lo}-{hi})")
    for field in ("title", "meta_title", "meta_description"):
        if not kw_in(kw, meta[field]):
            fails.append(f"{field} does not contain the primary keyword")
    if re.search(r"^# ", body, re.M):
        fails.append("body contains an H1: the title is the H1, use ## and ###")
    h2 = re.findall(r"^## +(.+)$", body, re.M)
    if len(h2) < 4:
        fails.append(f"only {len(h2)} H2 sections (min 4)")
    if not any(kw_in(kw, h) for h in h2):
        fails.append("no H2 contains the primary keyword")
    first = body.split("\n\n")[0]
    if first.startswith("#"):
        fails.append("article must open with a paragraph that answers the query, not a heading")
    elif len(words(plain(first))) > 90:
        fails.append(f"opening paragraph is {len(words(plain(first)))} words (max 90): answer first")
    if not kw_in(kw, " ".join(words(text)[:150])):
        fails.append("primary keyword missing from the first 150 words")
    exact = len(re.findall(re.escape(kw.lower()), text.lower()))
    density = 100.0 * exact * len(words(kw)) / max(n, 1)
    if density > c["max_keyword_density_pct"]:
        fails.append(f"keyword stuffing: exact phrase used {exact} times ({density:.1f}% of words)")
    if typ in ("alternatives", "listicle", "comparison") and not re.search(r"^\|.+\|\s*\n\|[ :|-]+\|", body, re.M):
        fails.append(f"a {typ} article needs a comparison table")

    # --- FAQ
    faq = re.split(r"^## +FAQ.*$", body, flags=re.M | re.I)
    qs = re.findall(r"^### +(.+\?)\s*$", faq[1], re.M) if len(faq) > 1 else []
    if len(qs) < c["min_faq"]:
        fails.append(f"FAQ section needs at least {c['min_faq']} '### Question?' entries (found {len(qs)})")

    # --- links
    links = re.findall(r"(?<!!)\[[^\]]+\]\(([^)\s]+)\)", body)
    site = c["site"].rstrip("/")
    allowed = set(json.loads((ROOT / "blog" / "site-pages.json").read_text())["pages"])
    allowed |= {c["blog_path"]} | {f"{c['blog_path']}/{m.get('slug')}" for _, m in published()}
    internal, external = [], []
    for u in links:
        if u.startswith("/") or u.startswith(site):
            internal.append(u.replace(site, "").split("#")[0].split("?")[0].rstrip("/") or "/")
        elif u.startswith("http"):
            external.append(u)
        elif not u.startswith("#") and not u.startswith("mailto:"):
            fails.append(f"malformed link: {u}")
    bad = sorted({u for u in internal if u not in allowed})
    if bad:
        fails.append("internal links to pages that do not exist: " + ", ".join(bad))
    if len(set(internal)) < c["min_internal_links"]:
        fails.append(f"{len(set(internal))} internal links (min {c['min_internal_links']})")
    if len(set(external)) < c["min_external_links"]:
        fails.append(f"{len(set(external))} external source links (min {c['min_external_links']})")
    if re.search(r"\]\([^)]*\)\s*\[?(click here|here|this link)\b", body, re.I) or re.search(r"\[(click here|here|this)\]\(", body, re.I):
        fails.append("vague anchor text ('here', 'click here')")

    # --- honesty
    low = text.lower()
    banned = sorted(set(p for p in li_gate.banned_phrases() + BLOG_BANNED if p and p not in ("agree?", "thoughts?") and p in low))
    if banned:
        fails.append("banned phrases: " + ", ".join(banned))
    if len(meta["original_angle"]) < 60:
        fails.append("original_angle is too thin: state what this adds that ranking pages lack")
    fh = meta.get("first_hand", "")
    if fh and not (ROOT / fh).exists():
        fails.append(f"first_hand file not found: {fh}")
    if typ == "data" and not fh:
        fails.append("a data article must name its first_hand source file in brain/")

    # every statistic must be verified proof or carry a source link in its own paragraph
    ok_nums = li_gate.numbers(li_gate.verified_text())
    STAT = re.compile(r"\$\s?\d[\d,.]*\s?[kKmM]?|\d[\d,.]*\s?%|\b\d[\d,.]*x\b|\b\d[\d,.]*\s?(?:percent|million|billion)\b", re.I)
    unsourced = []
    for para in re.split(r"\n\s*\n", body):
        has_link = "](http" in para  # tables need their own Source column
        for m in STAT.finditer(plain(para)):
            digits = re.sub(r"[^\d.]", "", m.group(0)).rstrip(".")
            if digits and digits not in ok_nums and not has_link:
                unsourced.append(m.group(0).strip())
    if unsourced:
        fails.append("statistics with no source link in the same paragraph and not in verified proof: " + ", ".join(sorted(set(unsourced))[:8]))
    if re.search(r"\b(studies show|research shows|experts say|according to (recent )?(studies|research))\b", low):
        fails.append("vague attribution ('studies show'): name and link the source or cut it")

    try:
        age = (today().date() - datetime.date.fromisoformat(meta["checked_on"])).days
        if typ in ("alternatives", "comparison", "listicle") and age > c["competitor_fact_max_age_days"]:
            fails.append(f"competitor facts were checked {age} days ago (max {c['competitor_fact_max_age_days']}): re-verify")
    except ValueError:
        fails.append("checked_on must be YYYY-MM-DD")

    # --- duplication and pacing
    week_ago = today().date() - datetime.timedelta(days=7)
    recent = 0
    for name, m in published():
        if m.get("slug") == slug:
            continue  # update of an existing article
        if m.get("primary_keyword", "").lower() == kw.lower():
            fails.append(f"keyword already targeted by {name}: update that article instead")
        if difflib.SequenceMatcher(None, meta["title"].lower(), m.get("title", "").lower()).ratio() > 0.75:
            fails.append(f"title too close to {name}")
        try:
            if datetime.date.fromisoformat(m.get("published_at", "")[:10]) > week_ago:
                recent += 1
        except ValueError:
            pass
    if recent >= c["max_posts_per_week"]:
        fails.append(f"weekly cap reached ({recent} articles in the last 7 days)")

    if "—" in body:
        warns.append("contains em dashes: rewrite those sentences")
    if exact == 0:
        warns.append("exact keyword phrase never appears in the body (fine if it reads unnaturally)")
    return {"article": str(path), "words": n, "h2": len(h2), "faq": len(qs), "internal_links": len(set(internal)),
            "external_links": len(set(external)), "pass": not fails, "fails": fails, "warnings": warns}


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    r = check(sys.argv[1])
    print(json.dumps(r, indent=2, ensure_ascii=False))
    sys.exit(0 if r["pass"] else 1)

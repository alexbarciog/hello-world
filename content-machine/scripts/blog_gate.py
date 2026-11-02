#!/usr/bin/env python3
"""Quality gate for blog articles. Every article must pass before it is published.

Usage: python3 scripts/blog_gate.py blog/drafts/<slug>.md
       python3 scripts/blog_gate.py --check-keyword "<keyword>"   -> is an existing page already on this intent?
Exit 0 = pass, 1 = fail. Prints a JSON report.
"""
import sys, re, json, difflib, datetime
from common import ROOT, parse_draft, seo_policy, today
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


# --- fewer, better pages: the rules from the Search Console review (November 2026)

INTENT_STOP = STOP | {"best", "top", "tool", "tools", "guide", "free", "online", "using", "use", "do", "does", "are", "get", "find",
                      "from", "can", "that", "this", "it", "you", "by", "at", "as", "be", "2026", "before", "after", "without"}


def intent_tokens(text):
    return {w.rstrip("s") for w in words(text.lower().replace("-", " ")) if w not in INTENT_STOP and len(w) > 1}


def page_path(meta, c=None):
    c = c or cfg()
    return f"{c['sections'].get(meta.get('section', 'blog'), c['blog_path'])}/{meta.get('slug')}"


def is_indexable(path, policy=None):
    policy = policy or seo_policy()
    return not (path in policy["noindex"] or path in policy["merged"] or any(path.startswith(x) for x in policy["noindexPrefixes"]))


def intent_conflicts(keyword, slug=None):
    """Published pages whose keyword, title, slug or H1 target the same intent. A page's own slug never conflicts."""
    kw = intent_tokens(keyword)
    if len(kw) < 2:
        return []
    c, policy, out = cfg(), seo_policy(), []
    for name, m in published():
        if m.get("slug") == slug:
            continue
        hit = None
        for label, value in (("primary keyword", m.get("primary_keyword", "")), ("title and H1", m.get("title", "")), ("slug", m.get("slug", ""))):
            other = intent_tokens(value)
            if not other:
                continue
            jaccard = len(kw & other) / len(kw | other)
            # a title is longer and looser than a keyword, so a two-word overlap with one proves little
            subset = kw <= other and (len(kw) >= 3 or label != "title and H1")
            if jaccard >= 0.6 or subset:
                hit = label
                break
        if hit:
            path = page_path(m, c)
            out.append({"slug": m.get("slug"), "path": policy["merged"].get(path, path), "matched_on": hit})
    return out


def body_tokens(md):
    return [w.lower() for w in words(plain(md))]


def uniqueness(body, slug, policy=None, c=None, k=6):
    """Words on this page that appear in no 6-word run on another live page, and the closest other page."""
    policy, c = policy or seo_policy(), c or cfg()
    toks = body_tokens(body)
    grams = [tuple(toks[i:i + k]) for i in range(max(len(toks) - k + 1, 0))]
    own = set(grams)
    seen, closest, closest_share = set(), None, 0.0
    for f in sorted((ROOT / "blog" / "published").glob("*.md")):
        m, other = parse_draft(f)
        if m.get("slug") == slug or page_path(m, c) in policy["merged"]:
            continue  # a merged page's text no longer lives on the site
        t = body_tokens(other)
        o = {tuple(t[i:i + k]) for i in range(max(len(t) - k + 1, 0))}
        shared = own & o
        seen |= shared
        share = len(shared) / max(len(own), 1)
        if share > closest_share:
            closest, closest_share = m.get("slug"), share
    covered = [False] * len(toks)
    for i, g in enumerate(grams):
        if g in seen:
            covered[i:i + k] = [True] * k
    return covered.count(False), closest, round(100 * closest_share)


def has_original_element(body):
    """A worked example, a numbered step-by-step, a table with sourced facts, or a checklist."""
    table_sourced = any("](" in tbl or "source" in tbl.lower() for tbl in re.findall(r"(?:^\|.+\|\s*\n)+", body, re.M))
    steps = len(re.findall(r"^\d+\. ", body, re.M)) >= 3 or len(re.findall(r"^#+ +step \d", body, re.M | re.I)) >= 3
    checklist = bool(re.search(r"^[-*] \[[ x]\] ", body, re.M)) or bool(re.search(r"^#+ .*(checklist|worksheet)", body, re.M | re.I))
    example = bool(re.search(r"^#+ .*(worked example|example)", body, re.M | re.I))
    return table_sourced or steps or checklist or example


UNSUPPORTED = re.compile(
    r"\b(reddit|twitter|x posts|on x\b|website visitors?|profile viewers?|profile visits|job[- ]changes?|funding rounds?|hiring signals?|email sequences?|sends? (?:cold )?emails?|salesforce|pipedrive)\b",
    re.I,
)
CLAIM_VERB = re.compile(r"\b(monitors?|tracks?|watch(?:es)?|scans?|covers?|detects?|alerts?|sends?|surfaces?|integrates?|connects?)\b", re.I)
NEGATED = re.compile(r"\b(not|no|never|only|without|isn't|doesn't|does not|cannot|can't|wrong|instead|outside|beyond|lists no)\b", re.I)


def unsupported_claims(body):
    """Sentences that say Intentsly does something product.md lists as not available. Negated sentences are fine."""
    out = []
    for sentence in re.split(r"(?<=[.!?])\s+|\n+", plain(body)):
        if re.search(r"\bintentsly\b", sentence, re.I) and CLAIM_VERB.search(sentence) and UNSUPPORTED.search(sentence) and not NEGATED.search(sentence):
            out.append(sentence.strip()[:160])
    return out


def run_dates(meta):
    """A published page and a refreshed page both use up the shared daily and weekly caps."""
    return [meta.get(k, "")[:10] for k in ("published_at", "updated_at") if meta.get(k)]


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
    section = meta.get("section", "blog")
    if section not in c.get("sections", {"blog": "/blog"}):
        fails.append(f"unknown section '{section}' (one of {', '.join(c.get('sections', {}))})")
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

    # --- fewer, better pages
    policy = seo_policy()
    pub_slugs = {m.get("slug"): m for _, m in published()}
    is_new = slug not in pub_slugs
    if is_new and (section in c.get("paused_sections", []) or meta["cluster"] in c.get("paused_clusters", [])):
        fails.append(f"section '{section}' / cluster '{meta['cluster']}' is paused: no new pages, improve an existing one in refresh mode")
    if page_path(meta, c) in policy["merged"]:
        fails.append(f"this URL is merged into {policy['merged'][page_path(meta, c)]}: improve that page instead")
    for hit in (intent_conflicts(kw, slug) if is_new else []):  # a refresh improves the page that holds the intent
        fails.append(f"same intent as {hit['path']} (matched on its {hit['matched_on']}): do not create a new page, re-run that page's upsert with richer content")
    unique_words, closest, closest_pct = uniqueness(body, slug, policy, c)
    if unique_words < c.get("min_unique_words", 0):
        fails.append(f"only {unique_words} words of unique content (min {c['min_unique_words']}): text shared with other pages does not count")
    if closest_pct > c.get("max_template_overlap_pct", 100):
        fails.append(f"{closest_pct}% of this page's wording is also on {closest} (max {c['max_template_overlap_pct']}%): this reads as a swapped-noun template")
    if not has_original_element(body):
        fails.append("no original element: add a worked example, a step-by-step, a comparison table with sourced facts, or a checklist")
    for sentence in unsupported_claims(body):
        fails.append(f"claims a feature product.md does not list: \"{sentence}\"")
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
    if typ in ("alternatives", "listicle", "comparison", "landing") and not re.search(r"^\|.+\|\s*\n\|[ :|-]+\|", body, re.M):
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
    secs = c.get("sections", {"blog": c["blog_path"]})
    allowed |= set(secs.values()) | {f"{secs.get(m.get('section', 'blog'), c['blog_path'])}/{m.get('slug')}" for _, m in published()}
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
    linked = set(internal)
    cluster_pages = {page_path(m, c) for _, m in published()
                     if m.get("cluster") == meta["cluster"] and m.get("slug") != slug and is_indexable(page_path(m, c), policy)}
    cluster_linked = linked & cluster_pages
    wanted = min(c.get("min_cluster_links", 0), len(cluster_pages))
    if len(cluster_linked) < wanted:
        fails.append(f"{len(cluster_linked)} links to indexable pages in cluster '{meta['cluster']}' (min {wanted}): " + ", ".join(sorted(cluster_pages)[:6]))
    if len(cluster_linked) > c.get("max_cluster_links", 99) and page_path(meta, c) not in policy["pillars"].values():
        fails.append(f"{len(cluster_linked)} links within cluster '{meta['cluster']}' (max {c['max_cluster_links']})")
    if secs.get(section) not in linked:
        fails.append(f"no link to the hub page {secs.get(section)}")
    not_indexable = sorted(u for u in linked if not is_indexable(u, policy))
    if not_indexable:
        fails.append("links to noindexed or merged pages: " + ", ".join(not_indexable))
    if is_new:
        sources = [s.strip() for s in meta.get("backlinks_from", "").split(",") if s.strip()]
        if len(sources) < c.get("min_backlinks", 0):
            fails.append(f"backlinks_from names {len(sources)} pages (min {c['min_backlinks']}): no page is published as an orphan")
        by_path = {page_path(m, c): name for name, m in published()}
        for s in sources:
            if s not in by_path or not is_indexable(s, policy):
                fails.append(f"backlinks_from: {s} is not an indexable published page")
            elif f"({page_path(meta, c)})" not in parse_draft(ROOT / "blog" / "published" / by_path[s])[1]:
                fails.append(f"backlinks_from: blog/published/{by_path[s]} does not link to {page_path(meta, c)} yet")
    if len(set(internal)) < c["min_internal_links"]:
        fails.append(f"{len(set(internal))} internal links (min {c['min_internal_links']})")
    conv = set(c.get("conversion_pages", []))
    if conv and not any(u in conv for u in internal):
        fails.append("no link to a conversion page (" + ", ".join(sorted(conv)[:4]) + ", ...): every page must give the reader a way to try Intentsly")
    content_prefixes = tuple(f"{v}/" for v in secs.values())
    if not any(u.startswith(content_prefixes) for u in internal):
        fails.append("no link to another published content page (blog, guide, lesson, solution or comparison): promote related pages")
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
        if page_path(m, c) in policy["merged"]:
            continue  # merged pages are gone from the site, and their keywords now belong to the target
        if m.get("primary_keyword", "").lower() == kw.lower():
            fails.append(f"keyword already targeted by {name}: update that article instead")
        if difflib.SequenceMatcher(None, meta["title"].lower(), m.get("title", "").lower()).ratio() > 0.75:
            fails.append(f"title too close to {name}")
        try:
            if any(datetime.date.fromisoformat(d) > week_ago for d in run_dates(m)):
                recent += 1
        except ValueError:
            pass
    if recent >= c["max_posts_per_week"]:
        fails.append(f"weekly cap reached ({recent} pages published or refreshed in the last 7 days)")

    if "—" in body:
        warns.append("contains em dashes: rewrite those sentences")
    if exact == 0:
        warns.append("exact keyword phrase never appears in the body (fine if it reads unnaturally)")
    return {"article": str(path), "words": n, "h2": len(h2), "faq": len(qs), "internal_links": len(set(internal)),
            "unique_words": unique_words, "closest_page": closest, "closest_page_overlap_pct": closest_pct,
            "external_links": len(set(external)), "pass": not fails, "fails": fails, "warnings": warns}


if __name__ == "__main__":
    if len(sys.argv) == 3 and sys.argv[1] == "--check-keyword":
        hits = intent_conflicts(sys.argv[2])
        print(json.dumps({"keyword": sys.argv[2], "clear": not hits, "conflicts": hits}, indent=2))
        sys.exit(1 if hits else 0)
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    r = check(sys.argv[1])
    print(json.dumps(r, indent=2, ensure_ascii=False))
    sys.exit(0 if r["pass"] else 1)

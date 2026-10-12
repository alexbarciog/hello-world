#!/usr/bin/env python3
"""Publishing gate. Every post must pass before it can go out.

Usage: python3 scripts/gate.py queue/approved/<draft>.md
Exit 0 = pass, 1 = fail. Prints a JSON report.
"""
import sys, re, json, difflib
from common import ROOT, settings, parse_draft, today


def banned_phrases():
    text = (ROOT / "brain" / "corrections.md").read_text()
    m = re.search(r"## Banned phrases\n(.*?)(\n## |\Z)", text, re.S)
    return [l[2:].strip().lower() for l in (m.group(1).splitlines() if m else []) if l.startswith("- ")]


def verified_text():
    """Text that numbers in a post are allowed to come from."""
    out = []
    proof = ROOT / "brain" / "wiki" / "proof.md"
    if proof.exists():
        for line in proof.read_text().splitlines():
            cells = [c.strip() for c in line.split("|")]
            if len(cells) >= 4 and cells[-2].lower() == "verified":
                out.append(cells[1])
    for f in (ROOT / "brain" / "stories").glob("*.md"):
        if f.name != "README.md":
            out.append(f.read_text())
    return "\n".join(out)


NUM = re.compile(r"(?<![\w.])\$?\d[\d,]*(?:\.\d+)?(?:\s?%|x\b|k\b|m\b|\+)?", re.I)


def numbers(text):
    found = set()
    for m in NUM.finditer(text):
        tok = m.group(0)
        digits = re.sub(r"[^\d.]", "", tok).rstrip(".")
        if digits:
            found.add(digits)
    return found


def check(path):
    s = settings()
    pub = s["publishing"]
    meta, body = parse_draft(path)
    fails, warns = [], []

    if (ROOT / "PAUSE").exists():
        fails.append("PAUSE file present: publishing is stopped")

    if pub.get("require_trained_voice", True):
        voice = (ROOT / "brain" / "voice.md").read_text()
        if not re.search(r"^status:\s*trained\s*$", voice, re.M):
            fails.append("voice.md is not trained yet: add real posts to brain/posts and run brain-ingest")

    n = len(body)
    if n < pub["min_chars"]:
        fails.append(f"too short: {n} chars (min {pub['min_chars']})")
    if n > pub["max_chars"]:
        fails.append(f"too long: {n} chars (max {pub['max_chars']})")

    low = body.lower()
    hits = [p for p in banned_phrases() if p and p in low]
    if hits:
        fails.append("banned phrases: " + ", ".join(hits))

    if not pub.get("allow_links_in_body") and re.search(r"https?://|www\.", low):
        fails.append("link in body: move it to the first comment")

    tags = re.findall(r"(?<!\w)#\w+", body)
    if len(tags) > pub["max_hashtags"]:
        fails.append(f"{len(tags)} hashtags (max {pub['max_hashtags']})")

    if re.search(r"(?<!\w)@\w+", body):
        fails.append("@mention in body: tagging people is not automated")

    if re.search(r"comment\s+[\"'“]?\w+[\"'”]?\s+(and|to)\s+(i'll|i will|get|receive)", low):
        fails.append("engagement bait ('comment X and I'll send...')")

    if "—" in body:
        warns.append("contains em dash: common AI tell, consider rewriting")

    pillar = meta.get("pillar", "")
    if pillar not in s["pillars"]:
        fails.append(f"pillar '{pillar}' is not in settings.json")

    allowed = numbers(verified_text())
    # small counts and years are fine; anything else must be backed by proof or a story
    unbacked = sorted(x for x in numbers(body) if x not in allowed
                      and not (x.isdigit() and (int(x) <= 10 or 1990 <= int(x) <= 2100)))
    if unbacked:
        fails.append("numbers not found in verified proof or stories: " + ", ".join(unbacked))

    hook = body[:220].lower()
    pubdir = ROOT / "queue" / "published"
    stamp = today().strftime("%Y-%m-%d")
    todays = 0
    for f in sorted(pubdir.glob("*.md")):
        if f.name.startswith(stamp):
            todays += 1
        _, old = parse_draft(f)
        if difflib.SequenceMatcher(None, hook, old[:220].lower()).ratio() > 0.6:
            fails.append(f"too similar to already published {f.name}")
            break
    if todays >= pub["max_posts_per_day"]:
        fails.append(f"daily cap reached ({todays} published today)")

    return {"draft": str(path), "chars": n, "pass": not fails, "fails": fails, "warnings": warns}


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    r = check(sys.argv[1])
    print(json.dumps(r, indent=2, ensure_ascii=False))
    sys.exit(0 if r["pass"] else 1)

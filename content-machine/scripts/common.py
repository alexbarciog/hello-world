"""Shared helpers. Standard library only."""
import json, os, re, datetime, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent


def load_env():
    env = dict(os.environ)
    p = ROOT / ".env"
    if p.exists():
        for line in p.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                env.setdefault(k.strip(), v.strip())
    return env


def save_env(updates):
    p = ROOT / ".env"
    lines = p.read_text().splitlines() if p.exists() else []
    seen = set()
    for i, line in enumerate(lines):
        k = line.split("=", 1)[0].strip()
        if k in updates:
            lines[i] = f"{k}={updates[k]}"
            seen.add(k)
    lines += [f"{k}={v}" for k, v in updates.items() if k not in seen]
    p.write_text("\n".join(lines) + "\n")
    os.chmod(p, 0o600)


def settings():
    return json.loads((ROOT / "config" / "settings.json").read_text())


def icp():
    return json.loads((ROOT / "config" / "icp.json").read_text())


def parse_draft(path):
    """Draft = front matter between --- lines (key: value), then the post body."""
    text = pathlib.Path(path).read_text()
    meta, body = {}, text
    m = re.match(r"^---\n(.*?)\n---\n?(.*)$", text, re.S)
    if m:
        for line in m.group(1).splitlines():
            if ":" in line:
                k, v = line.split(":", 1)
                meta[k.strip()] = v.strip()
        body = m.group(2)
    return meta, body.strip()


def today(tz_name=None):
    try:
        from zoneinfo import ZoneInfo
        return datetime.datetime.now(ZoneInfo(tz_name or settings()["publishing"]["timezone"]))
    except Exception:
        return datetime.datetime.now()

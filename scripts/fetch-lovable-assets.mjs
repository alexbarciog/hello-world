// Lovable stores uploaded images as src/**/*.asset.json pointers to
// /__l5e/assets-v1/<id>/<file>, a path only Lovable's own hosting serves.
// On Cloudflare those URLs 404, so before each build copy any referenced
// asset that isn't in public/ yet from the Lovable project's preview host.
// Files already in public/ (committed) are left alone, so builds don't
// depend on Lovable being reachable.
import fs from "node:fs";
import path from "node:path";

const SRC = path.resolve("src");
const PUBLIC = path.resolve("public");
const ASSET_PATH = /\/__l5e\/assets-v1\/[0-9a-f-]{36}\/[A-Za-z0-9._-]+/g;

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (/\.(tsx?|jsx?|json|css)$/.test(entry.name)) out.push(p);
  }
  return out;
}

const urls = new Set();
const projectIds = new Set();
for (const file of walk(SRC)) {
  const text = fs.readFileSync(file, "utf8");
  for (const m of text.match(ASSET_PATH) ?? []) urls.add(m);
  if (file.endsWith(".asset.json")) {
    const { project_id } = JSON.parse(text);
    if (project_id) projectIds.add(project_id);
  }
}

const missing = [...urls].filter((u) => !fs.existsSync(path.join(PUBLIC, u)));
if (missing.length === 0) {
  console.log(`lovable assets: all ${urls.size} present in public/`);
  process.exit(0);
}

const hosts = [...projectIds].map((id) => `https://${id}.lovableproject.com`);
let failed = 0;
for (const url of missing) {
  let ok = false;
  for (const host of hosts) {
    try {
      const res = await fetch(host + url, { signal: AbortSignal.timeout(20000) });
      const type = res.headers.get("content-type") || "";
      if (!res.ok || type.startsWith("text/html")) continue;
      const out = path.join(PUBLIC, url);
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, Buffer.from(await res.arrayBuffer()));
      console.log(`lovable assets: fetched ${url}`);
      ok = true;
      break;
    } catch {
      // try the next host
    }
  }
  if (!ok) {
    failed++;
    console.warn(`lovable assets: could not fetch ${url} — it will 404 on this deploy`);
  }
}
// Don't block a deploy over an image; the warning shows in the build log.
console.log(`lovable assets: ${missing.length - failed}/${missing.length} missing assets fetched`);

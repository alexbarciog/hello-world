// Fake LinkedIn Profile Checker: the signals, their weights and the scoring.
// Pure functions only, shared by the check-fake-profile edge function, the
// page (the "How the checker works" table) and the tests.
//
// Wording rule: results describe risk signals in the profile. They never call
// the person fake or a scammer.

export type SignalStatus = "red" | "caution" | "fine" | "unknown";
export type RiskLevel = "low" | "medium" | "high";

export type SignalKey =
  | "no_experience"
  | "scam_bait_headline"
  | "photo_missing"
  | "low_connections"
  | "career_story"
  | "odd_name"
  | "experience_no_dates"
  | "brand_only_headline"
  | "generic_about"
  | "no_about"
  | "no_activity"
  | "followers_vs_connections"
  | "location_missing"
  | "photo_stock_ai"
  | "education_missing";

export interface SignalDef {
  key: SignalKey;
  /** Short name for the table on the page. */
  label: string;
  /** Why it matters, one line. */
  why: string;
  weight: number;
  /** Judged by the AI model rather than a fixed rule. */
  ai?: boolean;
}

export const SIGNAL_DEFS: SignalDef[] = [
  { key: "no_experience", label: "No work history", why: "Real professionals almost always list at least one job. An empty history is the most common gap in throwaway accounts.", weight: 14 },
  { key: "scam_bait_headline", label: "Headline reads like a pitch for money", why: "Investment returns, crypto or \"hiring urgently\" with no company named are the usual openers of recruitment and investment scams.", weight: 12, ai: true },
  { key: "photo_missing", label: "No profile photo", why: "Most active members have a photo. A missing one is weak on its own but adds up with other gaps.", weight: 10 },
  { key: "low_connections", label: "Very few connections", why: "Under 50 connections usually means a new or unused account.", weight: 10 },
  { key: "career_story", label: "Career that doesn't hang together", why: "Jumps between unrelated senior roles, overlapping full-time jobs or titles that don't match the companies suggest an invented history.", weight: 10, ai: true },
  { key: "odd_name", label: "Name with digits or odd capitals", why: "Real names rarely contain numbers or random capital letters; generated accounts often do.", weight: 8 },
  { key: "experience_no_dates", label: "Jobs without dates", why: "A history you can't place in time is hard to verify and easy to invent.", weight: 8 },
  { key: "brand_only_headline", label: "Big-brand title with nothing behind it", why: "\"Manager at Google\" with no matching job in the history borrows a famous name for credibility.", weight: 6 },
  { key: "generic_about", label: "Template-like About text", why: "Copy that could describe anyone, with no specifics, is cheap to mass-produce.", weight: 6, ai: true },
  { key: "no_about", label: "No About section", why: "Many real profiles skip it, so it counts for little, but it removes one way to check the person.", weight: 5 },
  { key: "no_activity", label: "No visible activity", why: "No posts, comments or reactions means nobody can see how the person engages.", weight: 5 },
  { key: "followers_vs_connections", label: "Followers far above connections", why: "Bought followers inflate the follower count without real connections behind it.", weight: 5 },
  { key: "location_missing", label: "No location", why: "Almost every profile shows a city or country. Hiding it makes the person harder to place.", weight: 4 },
  { key: "photo_stock_ai", label: "Photo may be a stock or AI image", why: "Stock photos and AI-generated faces are common in made-up accounts. We can flag a likely one, never prove it.", weight: 4, ai: true },
  { key: "education_missing", label: "No education listed", why: "Plenty of real people leave it out, so it carries the least weight.", weight: 3 },
];

export const SIGNAL_BY_KEY = Object.fromEntries(SIGNAL_DEFS.map((d) => [d.key, d])) as Record<SignalKey, SignalDef>;
export const AI_SIGNAL_KEYS: SignalKey[] = ["career_story", "generic_about", "scam_bait_headline"];

export interface Signal {
  key: SignalKey;
  status: SignalStatus;
  /** What the row says, e.g. "No work history visible". */
  title: string;
  /** What we saw, quoted or counted from the profile. Empty when nothing to quote. */
  observed: string;
  weight: number;
}

/** What it means and what to do, per status. Fixed text, never model output. */
export const EXPLANATIONS: Record<SignalKey, { flag: string; fine: string }> = {
  no_experience: { flag: "There are no jobs on the profile, so there's nothing to verify the person against.", fine: "Jobs are listed, so you can check the companies and roles." },
  scam_bait_headline: { flag: "The headline leads with money, returns or urgent hiring. Be careful with anything that asks for payment or personal documents.", fine: "The headline describes a role, not an offer." },
  photo_missing: { flag: "No photo makes it harder to tell who you're talking to.", fine: "The profile has a photo." },
  low_connections: { flag: "Very few connections usually means a new or barely used account.", fine: "The connection count looks like an established account." },
  career_story: { flag: "The roles and dates don't add up to one believable career. Ask about a specific past role.", fine: "The jobs follow a believable path." },
  odd_name: { flag: "Numbers or random capitals in a name are unusual for a real person.", fine: "The name looks like a normal personal name." },
  experience_no_dates: { flag: "Without dates you can't see when, or whether, the person held these roles.", fine: "The jobs have start and end dates." },
  brand_only_headline: { flag: "The headline names a well-known company that doesn't appear in the work history.", fine: "The headline matches the work history." },
  generic_about: { flag: "The About text is vague enough to fit almost anyone.", fine: "The About text has specifics about this person's work." },
  no_about: { flag: "No About section, so there's less to check. Many real profiles skip it too.", fine: "The profile has an About section." },
  no_activity: { flag: "No posts or comments are visible, so you can't see how the person engages.", fine: "The profile shows recent activity." },
  followers_vs_connections: { flag: "Far more followers than connections can mean bought followers.", fine: "Followers and connections are in a normal ratio." },
  location_missing: { flag: "No location makes the person harder to place.", fine: "A location is shown." },
  photo_stock_ai: { flag: "The photo looks like it may be a stock or AI image. This is a guess from the image, not proof.", fine: "Nothing about the photo looks like a stock or AI image." },
  education_missing: { flag: "No education listed. Many real profiles leave it out.", fine: "Education is listed." },
};

// ── URL ──────────────────────────────────────────────────────────────────────

/** https://www.linkedin.com/in/<slug>, or null for anything that isn't a personal profile URL. */
export function normaliseProfileUrl(input: string): string | null {
  let raw = (input || "").trim();
  if (!raw) return null;
  if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  const host = u.hostname.toLowerCase();
  if (host !== "linkedin.com" && !/^([a-z]{2,3}|www)\.linkedin\.com$/.test(host)) return null;
  const m = u.pathname.match(/^\/in\/([^/]+)\/?$/);
  if (!m) return null;
  let slug: string;
  try {
    slug = decodeURIComponent(m[1]).toLowerCase();
  } catch {
    return null;
  }
  if (!/^[\p{L}\p{N}_-]{2,100}$/u.test(slug)) return null;
  return `https://www.linkedin.com/in/${encodeURIComponent(slug)}`;
}

// ── Parsing the scraped profile ─────────────────────────────────────────────

export interface ParsedProfile {
  name: string | null;
  headline: string | null;
  location: string | null;
  about: string | null;
  /** null when the scrape had no work-history section to look at. */
  jobs: { company: string; title: string; dated: boolean; start?: string; end?: string; description?: string }[] | null;
  education: string[] | null;
  connections: number | null;
  connectionsPlus: boolean;
  followers: number | null;
  photoUrl: string | null;
  /** True/false when the page showed an activity section; null when it didn't say. */
  hasActivity: boolean | null;
  textLength: number;
}

function section(md: string, heading: RegExp): string | null {
  const lines = md.split("\n");
  const start = lines.findIndex((l) => /^##\s+/.test(l) && heading.test(l.replace(/^##\s+/, "")));
  if (start < 0) return null;
  const out: string[] = [];
  for (let i = start + 1; i < lines.length; i++) {
    if (/^##\s+/.test(lines[i])) break;
    out.push(lines[i]);
  }
  return out.join("\n").trim();
}

const stripMd = (s: string) => s.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/[*_`]/g, "").trim();

function parseCount(s: string): number {
  const m = s.trim().toLowerCase().replace(/,/g, "").match(/^([\d.]+)\s*([km])?/);
  if (!m) return NaN;
  const n = parseFloat(m[1]);
  return Math.round(m[2] === "k" ? n * 1_000 : m[2] === "m" ? n * 1_000_000 : n);
}

const DATE_LINE = /^\s*-\s*(\d{4}(?:-\d{2}){0,2})\s*-\s*(now|present|\?|\d{4}(?:-\d{2}){0,2})\s*:\s*(.+)$/i;

export function parseProfile(markdown: string): ParsedProfile {
  const md = (markdown || "").replace(/\r/g, "");
  const lines = md.split("\n");

  const nameLine = lines.find((l) => /^#\s+/.test(l));
  const name = nameLine ? stripMd(nameLine.replace(/^#\s+/, "")) || null : null;

  // Headline: the first bold-only line after the name.
  let headline: string | null = null;
  const nameIdx = nameLine ? lines.indexOf(nameLine) : -1;
  for (let i = nameIdx + 1; i < Math.min(lines.length, nameIdx + 6); i++) {
    const m = lines[i].match(/^\*\*(.+)\*\*\s*$/);
    if (m) {
      headline = stripMd(m[1]);
      break;
    }
    if (/^##\s+/.test(lines[i])) break;
  }

  const loc = md.match(/^\s*-\s*\*\*Location\*\*:\s*(.+)$/im);
  const location = loc ? stripMd(loc[1]) || null : null;

  const aboutRaw = section(md, /^about\b/i);
  const about = aboutRaw ? stripMd(aboutRaw) || null : null;

  let jobs: ParsedProfile["jobs"] = null;
  const history = section(md, /^(employment history|experience)\b/i);
  if (history !== null) {
    jobs = [];
    let company = "";
    let undated: { company: string } | null = null;
    for (const l of history.split("\n")) {
      const h = l.match(/^###\s+(.+)$/);
      if (h) {
        if (undated) jobs.push({ company: undated.company, title: "", dated: false });
        company = stripMd(h[1]);
        undated = { company };
        continue;
      }
      const d = l.match(DATE_LINE);
      if (d) {
        jobs.push({ company, title: stripMd(d[3]), dated: true, start: d[1], end: d[2].toLowerCase() });
        undated = null;
        continue;
      }
      const desc = l.match(/^\s+-\s*\*\*Description\*\*:\s*(.+)$/i);
      if (desc && jobs.length) jobs[jobs.length - 1].description = stripMd(desc[1]).slice(0, 400);
    }
    if (undated) jobs.push({ company: undated.company, title: "", dated: false });
  }

  const eduRaw = section(md, /^education\b/i);
  const education = eduRaw === null
    ? null
    : eduRaw.split("\n").filter((l) => /^\s*-\s+/.test(l) && !/^\s+-\s*\*\*/.test(l)).map((l) => stripMd(l.replace(/^\s*-\s+/, "")));

  const plus = /\b500\+\s*connections\b/i.test(md);
  const conn = md.match(/\b([\d,.]+\s*[kKmM]?)\s+connections\b/);
  const fol = md.match(/\b([\d,.]+\s*[kKmM]?)\s+followers\b/);
  const photo = md.match(/https:\/\/media\.licdn\.com\/dms\/image\/[^\s)"']*profile-displayphoto[^\s)"']*/i);

  const activity = section(md, /^activity\b/i);

  return {
    name,
    headline,
    location,
    about,
    jobs,
    education,
    connections: plus ? 500 : conn ? parseCount(conn[1]) : null,
    connectionsPlus: plus,
    followers: fol ? parseCount(fol[1]) : null,
    photoUrl: photo ? photo[0] : null,
    hasActivity: activity === null ? null : activity.replace(/\s/g, "").length > 20,
    textLength: md.replace(/\s+/g, " ").length,
  };
}

// ── Rule signals ─────────────────────────────────────────────────────────────

const BIG_BRANDS = [
  "google", "microsoft", "apple", "amazon", "meta", "facebook", "netflix", "tesla", "ibm", "oracle", "deloitte", "pwc",
  "kpmg", "ey", "ernst & young", "mckinsey", "boston consulting group", "bcg", "bain", "goldman sachs", "jpmorgan",
  "j.p. morgan", "morgan stanley", "blackrock", "citi", "citibank", "hsbc", "barclays", "pfizer", "unilever", "shell",
  "united nations", "un", "nasa", "us army", "u.s. army", "binance", "coinbase",
];

const NAME_PARTICLES = new Set(["van", "von", "de", "der", "den", "da", "di", "del", "della", "la", "le", "du", "bin", "binti", "al", "el", "dos", "das", "ter", "ten"]);

/** Digits, or capitals in places real names don't put them. "Alexandru B." and "McDonald" are fine. */
export function nameLooksOdd(name: string): string | null {
  if (/\d/.test(name)) return "contains digits";
  const words = name.split(/\s+/).filter(Boolean).map((w) => w.replace(/[.,'’()]/g, ""));
  for (const w of words) {
    if (w.length < 2 || NAME_PARTICLES.has(w.toLowerCase())) continue;
    const parts = w.split("-");
    for (const p of parts) {
      if (p.length < 2) continue;
      if (/^[\p{Ll}]/u.test(p)) return "a name that starts with a small letter";
      if (p.length > 3 && p === p.toUpperCase() && /\p{Lu}/u.test(p)) return "a name in capitals";
      const body = p.replace(/^(Mc|Mac|O)(?=\p{Lu})/u, "");
      if (/\p{Ll}\p{Lu}/u.test(body.slice(1))) return "random capital letters";
    }
  }
  return null;
}

const s = (key: SignalKey, status: SignalStatus, title: string, observed = ""): Signal => ({
  key, status, title, observed: observed.slice(0, 200), weight: SIGNAL_BY_KEY[key].weight,
});

export function ruleSignals(p: ParsedProfile): Signal[] {
  const out: Signal[] = [];

  if (p.jobs === null) out.push(s("no_experience", "unknown", "Work history not visible"));
  else if (p.jobs.length === 0) out.push(s("no_experience", "red", "No work history visible"));
  else out.push(s("no_experience", "fine", `${p.jobs.length} job${p.jobs.length === 1 ? "" : "s"} listed`, [...new Set(p.jobs.map((j) => j.company))].slice(0, 4).join(", ")));

  if (!p.jobs || p.jobs.length === 0) out.push(s("experience_no_dates", "unknown", "Job dates not visible"));
  else {
    const undated = p.jobs.filter((j) => !j.dated).length;
    if (undated === p.jobs.length) out.push(s("experience_no_dates", "red", "None of the jobs have dates"));
    else if (undated > 0) out.push(s("experience_no_dates", "caution", `${undated} of ${p.jobs.length} jobs have no dates`));
    else out.push(s("experience_no_dates", "fine", "Every job has dates"));
  }

  if (p.photoUrl) out.push(s("photo_missing", "fine", "Has a profile photo"));
  else out.push(s("photo_missing", "unknown", "Photo not visible to logged-out visitors"));

  if (p.connections === null) out.push(s("low_connections", "unknown", "Connection count not visible"));
  else if (p.connectionsPlus) out.push(s("low_connections", "fine", "500+ connections", "500+ connections"));
  else if (p.connections < 50) out.push(s("low_connections", "red", "Fewer than 50 connections", `${p.connections} connections`));
  else if (p.connections < 150) out.push(s("low_connections", "caution", "A small network", `${p.connections} connections`));
  else out.push(s("low_connections", "fine", "An established network", `${p.connections} connections`));

  if (p.followers === null || p.connections === null) out.push(s("followers_vs_connections", "unknown", "Follower ratio not visible"));
  else if (!p.connectionsPlus && p.connections < 200 && p.followers > p.connections * 20 && p.followers > 2000) {
    out.push(s("followers_vs_connections", "caution", "Many more followers than connections", `${p.followers.toLocaleString("en-US")} followers, ${p.connections} connections`));
  } else out.push(s("followers_vs_connections", "fine", "Followers and connections look normal"));

  if (!p.name) out.push(s("odd_name", "unknown", "Name not visible"));
  else {
    const odd = nameLooksOdd(p.name);
    out.push(odd ? s("odd_name", "red", `Name has ${odd}`, p.name) : s("odd_name", "fine", "The name looks normal"));
  }

  if (!p.headline) out.push(s("brand_only_headline", "unknown", "Headline not visible"));
  else {
    const m = p.headline.match(/^\s*([^|,]{2,60}?)\s+(?:at|@)\s+([^|,]{2,40})\s*$/i);
    const brand = m ? m[2].trim().toLowerCase() : "";
    const titleWords = m ? m[1].trim().split(/\s+/).length : 0;
    if (m && titleWords <= 4 && BIG_BRANDS.includes(brand)) {
      const inHistory = (p.jobs ?? []).some((j) => j.company.toLowerCase().includes(brand));
      if (p.jobs === null) out.push(s("brand_only_headline", "unknown", "Big-brand headline, work history not visible", p.headline));
      else if (inHistory) out.push(s("brand_only_headline", "fine", "Headline matches the work history", p.headline));
      else out.push(s("brand_only_headline", "caution", "Big-brand title that isn't in the work history", p.headline));
    } else out.push(s("brand_only_headline", "fine", "Headline isn't just a borrowed brand name", p.headline));
  }

  if (p.about === null) out.push(s("no_about", p.textLength > 300 ? "caution" : "unknown", p.textLength > 300 ? "No About section" : "About section not visible"));
  else out.push(s("no_about", "fine", "Has an About section"));

  if (p.hasActivity === null) out.push(s("no_activity", "unknown", "Activity not visible to logged-out visitors"));
  else out.push(p.hasActivity ? s("no_activity", "fine", "Recent activity is visible") : s("no_activity", "caution", "No posts or comments visible"));

  if (p.location) out.push(s("location_missing", "fine", "Location shown", p.location));
  else out.push(s("location_missing", p.textLength > 300 ? "caution" : "unknown", p.textLength > 300 ? "No location shown" : "Location not visible"));

  if (p.education === null) out.push(s("education_missing", p.jobs && p.jobs.length > 0 ? "caution" : "unknown", p.jobs && p.jobs.length > 0 ? "No education listed" : "Education not visible"));
  else if (p.education.length === 0) out.push(s("education_missing", "caution", "No education listed"));
  else out.push(s("education_missing", "fine", "Education listed", p.education.slice(0, 2).join("; ")));

  return out;
}

// ── AI signals ───────────────────────────────────────────────────────────────

export function aiPrompt(p: ParsedProfile): { system: string; user: string } {
  const jobs = (p.jobs ?? []).slice(0, 12).map((j) =>
    `- ${j.company}: ${j.title || "(no title)"} ${j.dated ? `(${j.start} to ${j.end})` : "(no dates)"}${j.description ? `\n  ${j.description}` : ""}`
  ).join("\n");
  return {
    system:
      "You review the public text of a LinkedIn profile for risk signals that it may not belong to a real professional. " +
      "Judge ONLY from the text you are given. Never guess or invent details. If the text needed for a judgement is missing, set status to \"unknown\". " +
      "Never call the person fake or a scammer; describe what the profile shows. Quote short phrases from the text in `observed`. " +
      "Respond only through the report_signals tool.",
    user: `Name: ${p.name ?? "(not visible)"}
Headline: ${p.headline ?? "(not visible)"}
Location: ${p.location ?? "(not visible)"}
About:
${p.about ? p.about.slice(0, 2500) : "(not visible)"}

Jobs:
${p.jobs === null ? "(not visible)" : jobs || "(none listed)"}

Education: ${p.education === null ? "(not visible)" : p.education.join("; ") || "(none listed)"}

Judge three signals:
1. career_story: does the career hang together? red = clearly contradictory (e.g. overlapping senior full-time roles at unrelated big companies, titles that don't fit the companies, an impossible timeline); caution = some odd jumps; fine = a believable path; unknown = not enough jobs to judge.
2. generic_about: is the About text generic or template-like, with nothing specific to this person? red = pure template or copy that could fit anyone; caution = mostly generic; fine = has specifics; unknown = no About text.
3. scam_bait_headline: does the headline (or About) lead with investment returns, crypto trading, forex, "hiring urgently"/"remote job offer" with no company named, or similar money bait? red = clearly; caution = partly; fine = no; unknown = no headline.`,
  };
}

export const AI_TOOL = {
  type: "function",
  function: {
    name: "report_signals",
    description: "Report the three judgement signals and a one-sentence summary.",
    parameters: {
      type: "object",
      properties: {
        signals: {
          type: "array",
          items: {
            type: "object",
            properties: {
              key: { type: "string", enum: ["career_story", "generic_about", "scam_bait_headline"] },
              title: { type: "string", description: "Under 70 characters, describing what the profile shows. Never say fake or scammer." },
              status: { type: "string", enum: ["red", "caution", "fine", "unknown"] },
              observed: { type: "string", description: "A short quote or fact from the text, or empty." },
            },
            required: ["key", "title", "status", "observed"],
            additionalProperties: false,
          },
        },
        summary: { type: "string", description: "One neutral sentence about the overall picture. Never call the person fake or a scammer." },
      },
      required: ["signals", "summary"],
      additionalProperties: false,
    },
  },
} as const;

const BANNED = /\b(fake|scam(?:mer)?s?|fraud(?:ster)?s?|catfish)\b/gi;
/** Model text goes on the page; keep the wording rule even if the model slips. */
export const clean = (text: unknown, max: number) =>
  String(text ?? "").replace(BANNED, "suspicious").replace(/\s+/g, " ").trim().slice(0, max);

const DEFAULT_AI_TITLES: Record<string, Record<SignalStatus, string>> = {
  career_story: { red: "The career history doesn't add up", caution: "Some odd jumps in the career", fine: "The career follows a believable path", unknown: "Not enough jobs to judge the career" },
  generic_about: { red: "The About text reads like a template", caution: "The About text is mostly generic", fine: "The About text has specifics", unknown: "No About text to judge" },
  scam_bait_headline: { red: "The headline leads with money or urgent hiring", caution: "The headline leans on money talk", fine: "The headline describes a role", unknown: "No headline to judge" },
};

/** The model's answer → signals for the three AI keys. Anything missing or malformed is "unknown". */
export function parseAiSignals(raw: unknown): { signals: Signal[]; summary: string } {
  const r = (raw && typeof raw === "object" ? raw : {}) as { signals?: unknown; summary?: unknown };
  const list = Array.isArray(r.signals) ? r.signals : [];
  const signals = AI_SIGNAL_KEYS.map((key) => {
    const hit = list.find((x) => x && typeof x === "object" && (x as { key?: unknown }).key === key) as
      | { status?: unknown; title?: unknown; observed?: unknown }
      | undefined;
    const status: SignalStatus = ["red", "caution", "fine", "unknown"].includes(String(hit?.status)) ? (hit!.status as SignalStatus) : "unknown";
    const title = clean(hit?.title, 80) || DEFAULT_AI_TITLES[key][status];
    return s(key, status, title, status === "unknown" ? "" : clean(hit?.observed, 200));
  });
  return { signals, summary: clean(r.summary, 300) };
}

// ── Score ────────────────────────────────────────────────────────────────────

export interface Score {
  risk_score: number;
  risk_level: RiskLevel;
  low_confidence: boolean;
}

export const levelFor = (score: number): RiskLevel => (score >= 65 ? "high" : score >= 35 ? "medium" : "low");

/** Weight of the signals we could actually check, below which the result is "low confidence". */
export const MIN_KNOWN_WEIGHT = 40;

/**
 * Red flags count their full weight, cautions half. Unknowns don't count at
 * all: the score is normalised over the weight of the signals we could check.
 * Little data → low confidence, capped at Medium.
 */
export function scoreSignals(signals: Signal[], textLength: number): Score {
  const known = signals.filter((x) => x.status !== "unknown");
  const knownWeight = known.reduce((a, x) => a + x.weight, 0);
  const points = known.reduce((a, x) => a + (x.status === "red" ? x.weight : x.status === "caution" ? x.weight / 2 : 0), 0);
  let score = knownWeight ? Math.round((100 * points) / knownWeight) : 0;
  const low_confidence = textLength < 400 || knownWeight < MIN_KNOWN_WEIGHT;
  if (low_confidence) score = Math.min(score, 64);
  return { risk_score: score, risk_level: levelFor(score), low_confidence };
}

const STATUS_RANK: Record<SignalStatus, number> = { red: 3, caution: 2, fine: 1, unknown: 0 };

/** The strongest signal: the heaviest red flag, else the heaviest caution, else the heaviest "looks fine". */
export function topSignal(signals: Signal[]): Signal | null {
  const known = signals.filter((x) => x.status !== "unknown");
  if (!known.length) return null;
  return [...known].sort((a, b) => STATUS_RANK[b.status] - STATUS_RANK[a.status] || b.weight - a.weight)[0];
}

/** Signals in report order: red, caution, fine, unknown; heavier first. */
export const sortSignals = (signals: Signal[]) =>
  [...signals].sort((a, b) => STATUS_RANK[b.status] - STATUS_RANK[a.status] || b.weight - a.weight);

export const LOW_CONFIDENCE_NOTE =
  "We could only see a little of this profile. LinkedIn hides most of it from logged-out visitors.";

// Display helpers for the Buying Signal Finder's illustrative example posts.
// Pure functions: they only label and highlight wording that is already on the
// page. Nothing here invents data about real people or posts.

export type SignalKind = "Asking for a recommendation" | "Asking peers" | "Comparing options" | "Actively looking" | "Describing the problem";

// Checked in order; the first cue found decides the label and is highlighted.
const CUES: [SignalKind, RegExp][] = [
  ["Asking for a recommendation", /\b(?:can anyone recommend|any recommendations|recommendations|recommend|who do you (?:use|trust|rate)|who'?s the best|who is the best|anyone know|recruiters you rate|any good \w+)\b/i],
  ["Comparing options", /\b(?:should we|should i|is it worth|is a part-time \w+ worth it|worth it|agency or freelancer|in-house or|how do you vet|what should i ask|how much should)\b/i],
  // Takes in up to three following words, so "Looking for a PPC specialist" is highlighted, not just "Looking for".
  ["Actively looking", /\b(?:looking for|we need|need (?:a|an|someone|help|extra|proper)|thinking about|time for|time to get|we're raising)(?: [\w'-]+){0,3}/i],
  ["Asking peers", /\b(?:has anyone|is anyone|anyone had|anyone switched|who'?s run|what did you wish|where would you start|where do we even start|what are we missing|any advice|how do you make|when did you know|who (?:helps|handles|builds|can))\b/i],
  ["Describing the problem", /\b(?:dropped|hasn't been touched|is a mess|was a mess|struggling|is a guess|no leads|takes days|held together|keeps going up|all wrong|security scare|rank for nothing|outgrown)\b/i],
];

export interface SignalReading {
  kind: SignalKind;
  /** The phrasing split around the intent cue, so the cue can be highlighted. */
  before: string;
  cue: string;
  after: string;
}

export function readSignal(text: string): SignalReading {
  for (const [kind, re] of CUES) {
    const m = re.exec(text);
    if (m) return { kind, before: text.slice(0, m.index), cue: m[0], after: text.slice(m.index + m[0].length) };
  }
  return { kind: "Describing the problem", before: text, cue: "", after: "" };
}

const SMALL = new Set(["of", "and", "the", "for", "&", "to", "at", "in"]);

/** "Head of Marketing" → "HM", "CEO" → "CEO", "founder" → "F". */
export function roleInitials(role: string): string {
  const t = role.trim();
  if (/^[A-Z]{2,4}$/.test(t)) return t;
  const words = t.split(/\s+/).filter((w) => w && !SMALL.has(w.toLowerCase()));
  return words.slice(0, 2).map((w) => w[0]!.toUpperCase()).join("") || "?";
}

export const capitalise = (s: string) => (s ? s[0]!.toUpperCase() + s.slice(1) : s);

/** LinkedIn content search for the wording, without trailing punctuation. */
export const linkedInSearchUrl = (text: string) =>
  `https://www.linkedin.com/search/results/content/?keywords=${encodeURIComponent(text.replace(/[\s.?!,]+$/, ""))}`;

// Plain-text email templates. Every template is a pure function with the same
// signature: (data, ctx) => { subject, text, template }. No side effects, unit
// tested in src/test/email-templates.test.ts. Only real data goes in: a number
// that isn't known simply isn't mentioned.
export interface EmailCtx {
  siteUrl: string;
  unsubscribeUrl: string;
  /** Postal address for the footer (marketing email legally needs one). */
  postalAddress?: string;
}
export interface RenderedEmail { subject: string; text: string; template: string }

const footer = (ctx: EmailCtx) =>
  `\n\n--\nUnsubscribe: ${ctx.unsubscribeUrl}${ctx.postalAddress ? `\n${ctx.postalAddress}` : ""}`;

/**
 * For anything that started as user input. The lead form accepts any address,
 * so emails must not be usable to deliver someone's link or long message to a
 * third party: no URLs, no line breaks, short.
 */
export function safeText(input: unknown, max = 160): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
    .replace(/\S+@\S+/g, "")
    .replace(/\b(?:https?:\/\/|www\.)\S+/gi, "")
    // Any bare domain, whatever the ending ("evil.shop/promo"). "Node.js" goes too; fine for a summary.
    .replace(/\b[\w-]+(?:\.[\w-]+)*\.[a-z]{2,}\b\S*/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max)
    .trim();
}

export interface LeadData {
  tool: string;
  /** The service they looked up (finder) or null. */
  service?: string | null;
  /** Server-generated result from tool_cache. Never browser input. */
  report?: Record<string, unknown> | null;
  /** Anonymised count for "this week", only when 10 or more. */
  weekCount?: number | null;
}

const TOOL_NAMES: Record<string, string> = {
  hook_analyzer: "LinkedIn hook",
  cold_message_grader: "cold message",
  buying_signal_finder: "buying signal",
  profile_analyzer: "LinkedIn profile",
};
const TOOL_PATHS: Record<string, string> = {
  hook_analyzer: "/linkedin-hook-analyzer",
  cold_message_grader: "/cold-message-grader",
  buying_signal_finder: "/buying-signals",
  profile_analyzer: "/linkedin-profile-analyzer",
};

const list = (v: unknown, n: number) =>
  Array.isArray(v) ? v.map((x) => safeText(x, 240)).filter(Boolean).slice(0, n) : [];
const bullets = (items: string[]) => items.map((i) => `- ${i}`).join("\n");

function reportBody(lead: LeadData): string {
  const r = lead.report ?? {};
  const score = typeof r.score === "number" ? `Score: ${Math.round(r.score)}/100\n` : "";
  const verdict = safeText(r.verdict, 300);
  const head = `${score}${verdict ? `${verdict}\n` : ""}`;
  switch (lead.tool) {
    case "hook_analyzer": {
      const hooks = list(r.hooks, 3);
      return hooks.length ? `${head}\nThree stronger hooks:\n${bullets(hooks)}` : "";
    }
    case "cold_message_grader": {
      const issues = list(r.issues, 3);
      const rewrite = safeText(r.rewrite, 1200);
      return rewrite ? `${head}${issues.length ? `\nWhat's holding it back:\n${bullets(issues)}\n` : ""}\nA shorter version:\n${rewrite}` : "";
    }
    case "buying_signal_finder": {
      const phrasings = list(r.phrasings, 5);
      const roles = list(r.roles, 5);
      return phrasings.length ? `Example phrasings to search for:\n${bullets(phrasings)}${roles.length ? `\n\nRoles that typically post these: ${roles.join(", ")}.` : ""}` : "";
    }
    default:
      return "";
  }
}

const SIGN_OFF = "\n\nAlex\nIntentsly";

/** Day 0: the report they asked for. */
export function nurtureDay0(lead: LeadData, ctx: EmailCtx): RenderedEmail {
  const name = TOOL_NAMES[lead.tool] ?? "free tool";
  const service = safeText(lead.service, 60);
  const body = reportBody(lead);
  const link = `${ctx.siteUrl}${TOOL_PATHS[lead.tool] ?? "/tools"}`;
  const fallback = lead.tool === "profile_analyzer"
    ? `Three things to check on your LinkedIn profile today:\n- Does your headline say who you help, not just your job title?\n- Does the first line of your About section give a reason to keep reading?\n- Is there one clear next step for someone who wants to talk to you?\n\nFor a full review of your own profile: ${link}`
    : `Run it again any time: ${link}`;
  return {
    template: "nurture_day0",
    subject: lead.tool === "buying_signal_finder" && service ? `How people ask for ${service} on LinkedIn` : `Your ${name} results`,
    text: `Hi,\n\nHere's what you asked for.\n\n${body || fallback}${body ? `\n\nRun it again any time: ${link}` : ""}${SIGN_OFF}${footer(ctx)}`,
  };
}

const TIPS: Record<string, { tip: string; auto: string }> = {
  hook_analyzer: {
    tip: "One tip for your next post: write the first line last. Once the post is done you know what the most surprising thing in it is, and that's your hook.",
    auto: "Intentsly does the next part for you: it watches who engages with posts on topics like yours and shows you the people who look like buyers.",
  },
  cold_message_grader: {
    tip: "One tip for your next message: mention the specific thing that made you write to them, in the first sentence. If it could go to anyone, it reads like it went to everyone.",
    auto: "Intentsly does this automatically: it finds people showing buying signals on LinkedIn and opens the conversation by referring to what they did.",
  },
  buying_signal_finder: {
    tip: "One tip: reply to the post before you send a connection request. Someone who has just seen your name in their comments is far more likely to accept.",
    auto: "Intentsly does the watching for you: it monitors LinkedIn for these signals every day and scores each person against your ideal customer.",
  },
  profile_analyzer: {
    tip: "One tip: put one clear next step in your Featured section. People who visit your profile from a comment are deciding whether to talk to you, so make that easy.",
    auto: "Intentsly finds the people worth sending to that profile: it watches LinkedIn for buying signals and scores each person against your ideal customer.",
  },
};

/** Day 2: one tip, one line on how Intentsly does it automatically, /try-ai. */
export function nurtureDay2(lead: LeadData, ctx: EmailCtx): RenderedEmail {
  const t = TIPS[lead.tool] ?? TIPS.buying_signal_finder;
  return {
    template: "nurture_day2",
    subject: "One tip since you tried the tool",
    text: `Hi,\n\n${t.tip}\n\n${t.auto} You can see it on your own market in under a minute, no account needed:\n${ctx.siteUrl}/try-ai${SIGN_OFF}${footer(ctx)}`,
  };
}

/** Day 5: real count when there is one; otherwise no number at all. */
export function nurtureDay5(lead: LeadData, ctx: EmailCtx): RenderedEmail {
  const service = safeText(lead.service, 60);
  const hasCount = service && typeof lead.weekCount === "number" && lead.weekCount >= 10;
  return {
    template: "nurture_day5",
    subject: hasCount ? `I found ${lead.weekCount} people asking for ${service} this week` : "Who's asking for what you sell?",
    text: `Hi,\n\n${hasCount
      ? `Intentsly saw ${lead.weekCount} signals matching ${service} across customers' agents this week.`
      : `People describe the problem you solve on LinkedIn every day. Most of them never get a reply from someone who can help.`} Intentsly finds them, scores each one against your ideal customer and starts the conversation.\n\nYou can start a 7-day free trial here:\n${ctx.siteUrl}/register\n\nThat's the last email in this series.${SIGN_OFF}${footer(ctx)}`,
  };
}

export const NURTURE_STEPS = [
  { step: 0, afterDays: 0, render: nurtureDay0 },
  { step: 2, afterDays: 2, render: nurtureDay2 },
  { step: 5, afterDays: 5, render: nurtureDay5 },
] as const;

// ── Weekly digest ───────────────────────────────────────────────────────────
export interface DigestPayload {
  firstName?: string | null;
  signals: number;
  messages: number;
  replies: number;
  meetings: number;
  /** The account's own keywords (idle accounts only). */
  keywords?: string[];
  /** Anonymised matches for those keywords this week, only when 10 or more. */
  missedCount?: number | null;
}

// One per week, in rotation. Product facts from brain/wiki/product.md only.
export const DIGEST_TIPS = [
  { text: "Tip: the signal that tends to be easiest to act on is someone writing about the problem you solve. Add a keyword phrased the way a buyer would say it, not the way you'd sell it.", path: "/signals" },
  { text: "Tip: keep your daily LinkedIn sends modest. We cap at 30 messages and 30 connection requests per account and recommend 15.", path: "/settings?tab=linkedin" },
  { text: "Tip: add your calendar link to your campaign, so the AI SDR can send it when a lead is ready to talk.", path: "/campaigns" },
  { text: "Tip: competitor followers and the people engaging with competitor posts are often worth a look. Add a competitor's page to your agent.", path: "/signals" },
];

export const isIdle = (p: DigestPayload) => p.signals + p.messages + p.replies + p.meetings === 0;

export function weeklyDigest(p: DigestPayload, ctx: EmailCtx & { weekIndex: number }): RenderedEmail {
  const hi = `Hi${safeText(p.firstName, 40) ? ` ${safeText(p.firstName, 40)}` : ""},`;
  const tip = DIGEST_TIPS[Math.abs(ctx.weekIndex) % DIGEST_TIPS.length];
  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
  if (isIdle(p)) {
    const keywords = (p.keywords ?? []).map((k) => safeText(k, 40)).filter(Boolean).slice(0, 3);
    const missed = typeof p.missedCount === "number" && p.missedCount >= 10 && keywords.length;
    return {
      template: "digest_idle",
      subject: missed ? `${p.missedCount} signals matched your keywords this week` : "Your Intentsly agent was quiet this week",
      text: `${hi}\n\n${missed
        ? `Here's what you're missing: Intentsly saw ${p.missedCount} signals matching ${keywords.join(", ")} across customers' agents this week. Your account didn't act on any of them.`
        : "Your account didn't find or send anything this week, so here's what you're missing: people on LinkedIn are asking for what you sell, and nobody from your company is answering."}\n\nIt usually takes a few minutes to get going again:\n${ctx.siteUrl}/signals\n\n${tip.text}${SIGN_OFF}${footer(ctx)}`,
    };
  }
  return {
    template: "digest_active",
    subject: `Your week: ${plural(p.signals, "signal")}, ${plural(p.replies, "reply").replace("replys", "replies")}, ${plural(p.meetings, "meeting")}`,
    text: `${hi}\n\nHere's your week on Intentsly:\n\n- Signals found: ${p.signals}\n- Messages sent: ${p.messages}\n- Replies: ${p.replies}\n- Meetings booked: ${p.meetings}\n\n${tip.text}\n\n${ctx.siteUrl}${tip.path}${SIGN_OFF}${footer(ctx)}`,
  };
}

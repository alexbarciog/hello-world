import { describe, it, expect } from "vitest";
import {
  DIGEST_TIPS, NURTURE_STEPS, isIdle, nurtureDay0, nurtureDay2, nurtureDay5, safeText, weeklyDigest,
} from "../../supabase/functions/_shared/email-templates/index";
import { makeUnsubToken, readUnsubToken } from "../../supabase/functions/_shared/email-tokens";
import { digestDue, nextNurtureStep, weekStartOf } from "../../supabase/functions/_shared/email-schedule";

const ctx = { siteUrl: "https://intentsly.com", unsubscribeUrl: "https://intentsly.com/u/abc" };

describe("safeText (the form can be pointed at anyone's address)", () => {
  it("strips links, emails and line breaks and caps the length", () => {
    expect(safeText("Win big at https://evil.example/x now")).toBe("Win big at now");
    expect(safeText("visit www.evil.com or evil.io/promo today")).toBe("visit or today");
    expect(safeText("mail me a@b.co please")).toBe("mail me please");
    expect(safeText("go to evil.shop/promo now")).toBe("go to now");
    expect(safeText("e.g. a normal sentence")).toBe("e.g. a normal sentence");
    expect(safeText("line\r\nBcc: x")).toBe("line Bcc: x");
    expect(safeText("x".repeat(500), 20)).toHaveLength(20);
    expect(safeText(42)).toBe("");
  });
});

describe("nurture", () => {
  it("day 0 includes the server report, with links removed", () => {
    const e = nurtureDay0({ tool: "hook_analyzer", report: { score: 72, verdict: "Good", hooks: ["Hook one", "See https://evil.example now"] } }, ctx);
    expect(e.text).toContain("Score: 72/100");
    expect(e.text).toContain("Hook one");
    expect(e.text).not.toContain("evil.example");
    expect(e.text).toContain(ctx.unsubscribeUrl);
  });

  it("day 0 still works without a report", () => {
    expect(nurtureDay0({ tool: "profile_analyzer" }, ctx).text).toContain("headline");
    expect(nurtureDay0({ tool: "hook_analyzer" }, ctx).text).toContain("/linkedin-hook-analyzer");
  });

  it("day 2 has a tip, the automatic line and /try-ai", () => {
    const e = nurtureDay2({ tool: "cold_message_grader" }, ctx);
    expect(e.text).toContain("One tip");
    expect(e.text).toContain("/try-ai");
  });

  it("day 5 states a number only when it's real and 10+", () => {
    const real = nurtureDay5({ tool: "buying_signal_finder", service: "web design", weekCount: 14 }, ctx);
    expect(real.subject).toBe("I found 14 people asking for web design this week");
    expect(real.text).toContain("/register");
    for (const weekCount of [null, undefined, 3]) {
      const e = nurtureDay5({ tool: "buying_signal_finder", service: "web design", weekCount }, ctx);
      expect(e.subject).not.toMatch(/\d/);
      expect(e.text).not.toMatch(/Intentsly saw \d/);
    }
    expect(nurtureDay5({ tool: "hook_analyzer", weekCount: 14 }, ctx).subject).not.toMatch(/\d/);
  });

  it("is exactly three emails", () => {
    expect(NURTURE_STEPS.map((s) => s.afterDays)).toEqual([0, 2, 5]);
  });
});

describe("nextNurtureStep", () => {
  const now = new Date("2026-11-10T12:00:00Z");
  const ago = (d: number) => new Date(now.getTime() - d * 86_400_000).toISOString();

  it("sends in order, each when due", () => {
    expect(nextNurtureStep({ createdAt: ago(0), sent: [] }, now)).toBe(0);
    expect(nextNurtureStep({ createdAt: ago(1), sent: [{ step: 0, sentAt: ago(1) }] }, now)).toBeNull();
    expect(nextNurtureStep({ createdAt: ago(2), sent: [{ step: 0, sentAt: ago(2) }] }, now)).toBe(2);
    expect(nextNurtureStep({ createdAt: ago(5), sent: [{ step: 0, sentAt: ago(5) }, { step: 2, sentAt: ago(3) }] }, now)).toBe(5);
  });

  it("stops after three", () => {
    expect(nextNurtureStep({ createdAt: ago(9), sent: [{ step: 0, sentAt: ago(9) }, { step: 2, sentAt: ago(7) }, { step: 5, sentAt: ago(4) }] }, now)).toBeNull();
  });

  it("never sends two in one day when catching up, and drops very old leads", () => {
    expect(nextNurtureStep({ createdAt: ago(6), sent: [{ step: 0, sentAt: ago(0.5) }] }, now)).toBeNull();
    expect(nextNurtureStep({ createdAt: ago(20), sent: [] }, now)).toBeNull();
  });
});

describe("digest", () => {
  const active = { signals: 12, messages: 9, replies: 1, meetings: 2 };

  it("reports real numbers for an active account", () => {
    const e = weeklyDigest({ ...active, firstName: "Dana" }, { ...ctx, weekIndex: 0 });
    expect(e.template).toBe("digest_active");
    expect(e.subject).toBe("Your week: 12 signals, 1 reply, 2 meetings");
    expect(e.text).toContain("Hi Dana,");
    expect(e.text).toContain("Messages sent: 9");
    expect(e.text).toContain("Alex");
    expect(e.text).toContain(ctx.unsubscribeUrl);
  });

  it("sends the what-you're-missing version to an idle account", () => {
    const idle = { signals: 0, messages: 0, replies: 0, meetings: 0, keywords: ["web design"], missedCount: 15 };
    expect(isIdle(idle)).toBe(true);
    const e = weeklyDigest(idle, { ...ctx, weekIndex: 1 });
    expect(e.template).toBe("digest_idle");
    expect(e.text).toContain("15 signals matching web design");
  });

  it("invents no number when the count is unknown or under 10", () => {
    const e = weeklyDigest({ signals: 0, messages: 0, replies: 0, meetings: 0, keywords: ["web design"], missedCount: 4 }, { ...ctx, weekIndex: 2 });
    expect(e.subject).not.toMatch(/\d/);
    expect(e.text).not.toMatch(/saw \d/);
  });

  it("rotates one tip", () => {
    const a = weeklyDigest(active, { ...ctx, weekIndex: 0 });
    const b = weeklyDigest(active, { ...ctx, weekIndex: 1 });
    expect(a.text).toContain(DIGEST_TIPS[0].text);
    expect(b.text).toContain(DIGEST_TIPS[1].text);
  });
});

describe("digestDue", () => {
  it("is due Tuesday 09:00-11:59 in the account's timezone", () => {
    expect(digestDue(new Date("2026-11-10T09:05:00Z"), "UTC")).toBe(true); // Tue
    expect(digestDue(new Date("2026-11-10T08:59:00Z"), "UTC")).toBe(false);
    expect(digestDue(new Date("2026-11-10T12:00:00Z"), "UTC")).toBe(false);
    expect(digestDue(new Date("2026-11-11T09:05:00Z"), "UTC")).toBe(false); // Wed
    expect(digestDue(new Date("2026-11-10T14:05:00Z"), "America/New_York")).toBe(true); // 09:05 in NY
    expect(digestDue(new Date("2026-11-10T09:05:00Z"), "America/New_York")).toBe(false);
    expect(digestDue(new Date("2026-11-10T09:05:00Z"), "Not/AZone")).toBe(true); // falls back to UTC
  });

  it("uses the same week id all week", () => {
    expect(weekStartOf(new Date("2026-11-10T09:05:00Z"))).toBe("2026-11-09");
    expect(weekStartOf(new Date("2026-11-15T23:00:00Z"))).toBe("2026-11-09");
    expect(weekStartOf(new Date("2026-11-16T00:00:00Z"))).toBe("2026-11-16");
  });
});

describe("unsubscribe tokens", () => {
  it("round-trips and rejects tampering or the wrong secret", async () => {
    const t = await makeUnsubToken({ kind: "e", value: "dana@acme.com" }, "secret-1");
    expect(await readUnsubToken(t, "secret-1")).toEqual({ kind: "e", value: "dana@acme.com" });
    expect(await readUnsubToken(t, "secret-2")).toBeNull();
    const [p, m] = t.split(".");
    const forged = await makeUnsubToken({ kind: "u", value: "victim" }, "other");
    expect(await readUnsubToken(`${forged.split(".")[0]}.${m}`, "secret-1")).toBeNull();
    expect(await readUnsubToken(p, "secret-1")).toBeNull();
    expect(await readUnsubToken("junk", "secret-1")).toBeNull();
  });
});

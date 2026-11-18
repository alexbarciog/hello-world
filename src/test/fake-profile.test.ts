import { describe, expect, it } from "vitest";
import {
  clean, levelFor, nameLooksOdd, normaliseProfileUrl, parseAiSignals, parseProfile, ruleSignals, scoreSignals,
  SIGNAL_DEFS, topSignal, type Signal,
} from "../../supabase/functions/_shared/fake-profile";

// Shaped like Firecrawl's markdown for a public LinkedIn profile. Invented person.
const FULL = `# Maria Ionescu

**Head of Operations at Brightline Logistics**

- **Location**: Cluj-Napoca, Romania

## About

I run operations for a 40-person freight forwarding team. Before that I spent six years in customs brokerage, mostly road freight between Romania and Germany.

## Employment History

### [Brightline Logistics](https://www.linkedin.com/company/brightline)

- 2021-03-01 - now: Head of Operations
  - **Description**: Run the dispatch and customs teams.

### Carpathia Customs

- 2015-01-01 - 2021-02-01: Customs Broker

## Education

- Babes-Bolyai University: (2010-09-01 - 2014-06-01)

## Skills

Logistics, Customs
`;

const EMPTY_HISTORY = `# john SMITH77

**CEO at Google**

## About

Passionate professional. Results-driven leader. Let's connect!

## Employment History

## Education
`;

describe("normaliseProfileUrl", () => {
  it("keeps only linkedin.com/in/<slug>, lowercased, without query or trailing slash", () => {
    expect(normaliseProfileUrl("https://www.linkedin.com/in/Maria-Ionescu/?utm_source=x")).toBe("https://www.linkedin.com/in/maria-ionescu");
    expect(normaliseProfileUrl("linkedin.com/in/maria-ionescu")).toBe("https://www.linkedin.com/in/maria-ionescu");
    expect(normaliseProfileUrl("https://ro.linkedin.com/in/maria-ionescu")).toBe("https://www.linkedin.com/in/maria-ionescu");
  });
  it("rejects company pages, other paths and other sites", () => {
    expect(normaliseProfileUrl("https://www.linkedin.com/company/acme")).toBeNull();
    expect(normaliseProfileUrl("https://www.linkedin.com/in/maria/details/experience")).toBeNull();
    expect(normaliseProfileUrl("https://evil.com/in/maria")).toBeNull();
    expect(normaliseProfileUrl("https://linkedin.com.evil.com/in/maria")).toBeNull();
    expect(normaliseProfileUrl("")).toBeNull();
  });
});

describe("parseProfile", () => {
  it("reads name, headline, location, about, jobs and education", () => {
    const p = parseProfile(FULL);
    expect(p.name).toBe("Maria Ionescu");
    expect(p.headline).toBe("Head of Operations at Brightline Logistics");
    expect(p.location).toBe("Cluj-Napoca, Romania");
    expect(p.about).toMatch(/freight forwarding/);
    expect(p.jobs).toHaveLength(2);
    expect(p.jobs?.every((j) => j.dated)).toBe(true);
    expect(p.jobs?.[0].company).toBe("Brightline Logistics");
    expect(p.education).toHaveLength(1);
    expect(p.connections).toBeNull();
    expect(p.photoUrl).toBeNull();
  });
  it("marks companies with no date line as undated", () => {
    const p = parseProfile("# A B\n\n## Employment History\n\n### Acme\n\n### Beta\n\n- 2020-01 - now: Owner\n");
    expect(p.jobs).toEqual([
      { company: "Acme", title: "", dated: false },
      { company: "Beta", title: "Owner", dated: true, start: "2020-01", end: "now" },
    ]);
  });
  it("reads connection and follower counts when the page shows them", () => {
    const p = parseProfile("# A B\n\n12 connections · 3,400 followers\n");
    expect(p.connections).toBe(12);
    expect(p.followers).toBe(3400);
    expect(parseProfile("500+ connections").connectionsPlus).toBe(true);
  });
});

describe("nameLooksOdd", () => {
  it("accepts ordinary and abbreviated names", () => {
    for (const n of ["Maria Ionescu", "Alexandru B.", "Ian McDonald", "Seán O'Brien", "Ludwig van Beethoven", "Anne-Marie Dupont", "José da Silva"]) {
      expect(nameLooksOdd(n), n).toBeNull();
    }
  });
  it("flags digits, lowercase starts, all caps and random capitals", () => {
    expect(nameLooksOdd("John Smith77")).toMatch(/digits/);
    expect(nameLooksOdd("john Smith")).toMatch(/small letter/);
    expect(nameLooksOdd("JOHN SMITH")).toMatch(/capitals/);
    expect(nameLooksOdd("JoHn Smith")).toMatch(/random/);
  });
});

describe("rules and score", () => {
  it("a complete, consistent profile is low risk", () => {
    const signals = ruleSignals(parseProfile(FULL));
    expect(signals.find((s) => s.key === "no_experience")?.status).toBe("fine");
    expect(signals.find((s) => s.key === "photo_missing")?.status).toBe("unknown");
    const score = scoreSignals(signals, FULL.length);
    expect(score.risk_level).toBe("low");
    expect(score.low_confidence).toBe(false);
  });

  it("an empty history, odd name and borrowed brand headline score high", () => {
    const p = parseProfile(EMPTY_HISTORY + "\n".padEnd(400, " ") + "x".repeat(400));
    const signals = [...ruleSignals(p), ...parseAiSignals({ signals: [{ key: "generic_about", status: "red", title: "Template About", observed: "Results-driven leader" }] }).signals];
    expect(signals.find((s) => s.key === "no_experience")?.status).toBe("red");
    expect(signals.find((s) => s.key === "odd_name")?.status).toBe("red");
    expect(signals.find((s) => s.key === "brand_only_headline")?.status).toBe("caution");
    const score = scoreSignals(signals, 900);
    expect(score.risk_level).toBe("high");
    expect(topSignal(signals)?.key).toBe("no_experience");
  });

  it("unknown signals don't count", () => {
    const sig = (status: Signal["status"], weight: number): Signal => ({ key: "no_about", status, title: "", observed: "", weight });
    const a = scoreSignals([sig("red", 20), sig("fine", 30)], 1000);
    const b = scoreSignals([sig("red", 20), sig("fine", 30), sig("unknown", 50)], 1000);
    expect(a.risk_score).toBe(40);
    expect(b.risk_score).toBe(40);
  });

  it("little data is low confidence and never High", () => {
    const sig = (status: Signal["status"], weight: number): Signal => ({ key: "no_experience", status, title: "", observed: "", weight });
    const s = scoreSignals([sig("red", 14), sig("red", 10)], 200);
    expect(s.low_confidence).toBe(true);
    expect(s.risk_score).toBeLessThanOrEqual(64);
    expect(s.risk_level).not.toBe("high");
  });

  it("levels: 0–34 low, 35–64 medium, 65+ high", () => {
    expect([0, 34, 35, 64, 65, 100].map(levelFor)).toEqual(["low", "low", "medium", "medium", "high", "high"]);
  });
});

describe("AI output", () => {
  it("malformed or missing answers become unknown and never invent signals", () => {
    const r = parseAiSignals({ signals: [{ key: "made_up", status: "red" }, { key: "career_story", status: "maybe" }] });
    expect(r.signals.map((s) => s.key)).toEqual(["career_story", "generic_about", "scam_bait_headline"]);
    expect(r.signals.every((s) => s.status === "unknown")).toBe(true);
  });
  it("keeps the wording rule even when the model slips", () => {
    expect(clean("This looks like a fake profile run by a scammer", 200)).not.toMatch(/fake|scammer/i);
  });
  it("weights come from the definitions, not the model", () => {
    const r = parseAiSignals({ signals: [{ key: "scam_bait_headline", status: "red", title: "x", observed: "", weight: 999 }] });
    expect(r.signals.find((s) => s.key === "scam_bait_headline")?.weight).toBe(SIGNAL_DEFS.find((d) => d.key === "scam_bait_headline")?.weight);
  });
});

import { describe, it, expect } from "vitest";
import { capitalise, linkedInSearchUrl, readSignal, roleInitials } from "@/lib/signalText";
import { SIGNAL_SERVICES } from "@/data/freeTools";

describe("readSignal", () => {
  it("labels and highlights the intent cue without changing the text", () => {
    const r = readSignal("Can anyone recommend a web designer for a B2B site?");
    expect(r.kind).toBe("Asking for a recommendation");
    expect(r.cue).toBe("Can anyone recommend");
    expect(r.before + r.cue + r.after).toBe("Can anyone recommend a web designer for a B2B site?");
  });

  it("tells looking, comparing and problem posts apart", () => {
    expect(readSignal("Looking for a PPC specialist for a small budget.")).toMatchObject({ kind: "Actively looking", cue: "Looking for a PPC specialist" });
    expect(readSignal("Our website hasn't been touched in years, time for a redesign.").cue).toBe("time for a redesign");
    expect(readSignal("Should we hire SEO in-house or use an agency?").kind).toBe("Comparing options");
    expect(readSignal("Our cash forecasting is a guess. Who helps with this?").kind).toBe("Asking peers");
    expect(readSignal("Something with no cue at all").cue).toBe("");
  });

  it("keeps every built-in phrasing intact", () => {
    for (const s of SIGNAL_SERVICES) for (const p of s.phrasings) {
      const r = readSignal(p);
      expect(r.before + r.cue + r.after).toBe(p);
    }
  });
});

describe("display helpers", () => {
  it("makes initials from roles", () => {
    expect(roleInitials("Head of Marketing")).toBe("HM");
    expect(roleInitials("CEO")).toBe("CEO");
    expect(roleInitials("Founder")).toBe("F");
    expect(roleInitials("  ")).toBe("?");
  });

  it("capitalises and builds a LinkedIn search link", () => {
    expect(capitalise("web design")).toBe("Web design");
    expect(capitalise("SEO")).toBe("SEO");
    expect(linkedInSearchUrl("Who do you use?")).toBe("https://www.linkedin.com/search/results/content/?keywords=Who%20do%20you%20use");
  });
});

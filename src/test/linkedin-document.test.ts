import { describe, expect, it } from "vitest";
import {
  documentCheck,
  documentFileName,
  documentFromMetrics,
  isPdf,
} from "../../supabase/functions/_shared/linkedin-document";

describe("documentFromMetrics", () => {
  it("reads document_url and document_title", () => {
    expect(documentFromMetrics({ document_url: " https://x/a.pdf ", document_title: " Signals " })).toEqual({
      url: "https://x/a.pdf",
      title: "Signals",
    });
  });
  it("is null without a usable URL, so the image path runs", () => {
    expect(documentFromMetrics(null)).toBeNull();
    expect(documentFromMetrics({})).toBeNull();
    expect(documentFromMetrics({ document_url: "" })).toBeNull();
    expect(documentFromMetrics({ document_url: "file:///etc/passwd" })).toBeNull();
    expect(documentFromMetrics({ likes: 3 })).toBeNull();
  });
  it("allows a missing title", () => {
    expect(documentFromMetrics({ document_url: "https://x/a.pdf" })).toEqual({ url: "https://x/a.pdf", title: null });
  });
});

describe("isPdf", () => {
  it("accepts %PDF and rejects anything else", () => {
    expect(isPdf(new TextEncoder().encode("%PDF-1.7\n"))).toBe(true);
    expect(isPdf(new Uint8Array([0x89, 0x50, 0x4e, 0x47]))).toBe(false);
    expect(isPdf(new TextEncoder().encode("<html>"))).toBe(false);
    expect(isPdf(new Uint8Array())).toBe(false);
  });
});

describe("documentFileName", () => {
  it("uses the title as the file name", () => {
    expect(documentFileName("5 buying signals: a guide")).toBe("5 buying signals a guide.pdf");
  });
  it("strips path characters and caps the length", () => {
    expect(documentFileName("../../etc/x")).toBe(".. .. etc x.pdf");
    expect(documentFileName("a".repeat(300))).toHaveLength(104);
  });
  it("falls back to document.pdf", () => {
    expect(documentFileName(null)).toBe("document.pdf");
    expect(documentFileName("///")).toBe("document.pdf");
  });
});

describe("documentCheck", () => {
  it("passes when the post has a file attachment", () => {
    expect(documentCheck({ attachments: [{ type: "file", file_name: "x.pdf" }] })).toEqual({
      ok: true,
      attachment_types: ["file"],
    });
  });
  it("fails for images or no attachments", () => {
    expect(documentCheck({ attachments: [{ type: "img" }] })).toEqual({ ok: false, attachment_types: ["img"] });
    expect(documentCheck({})).toEqual({ ok: false, attachment_types: [] });
    expect(documentCheck(null)).toEqual({ ok: false, attachment_types: [] });
  });
});

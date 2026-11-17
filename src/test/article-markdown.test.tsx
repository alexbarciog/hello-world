import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { parseStats, rehypeArticle, remarkArticle, splitFaq } from "@/lib/articleMarkdown";

const html = (md: string) =>
  renderToStaticMarkup(
    <ReactMarkdown remarkPlugins={[remarkGfm, remarkArticle]} rehypePlugins={[rehypeArticle]}>
      {md}
    </ReactMarkdown>,
  );

describe("article markdown", () => {
  it("turns [!TYPE] blockquotes into callouts and strips the marker", () => {
    const out = html("> [!TIP]\n> Reply fast.");
    expect(out).toContain('data-callout="tip"');
    expect(out).toContain("Reply fast.");
    expect(out).not.toContain("[!TIP]");
  });

  it("leaves plain blockquotes alone", () => {
    expect(html("> Just a quote")).toContain("<blockquote>");
  });

  it("marks ordered lists whose items all start with bold as steps", () => {
    expect(html("1. **One.** a\n2. **Two.** b")).toContain('class="steps"');
    expect(html("1. One\n2. **Two.** b")).not.toContain("steps");
  });

  it("wraps tables and highlights the Intentsly column", () => {
    const out = html("| Feature | Intentsly | Other |\n| --- | --- | --- |\n| A | yes | no |");
    expect(out).toContain('class="table-wrap"');
    expect(out.match(/col-intentsly/g)?.length).toBe(2);
  });

  it("splits the FAQ section out of the body", () => {
    const { body, faq } = splitFaq("Intro\n\n## Part\n\nText\n\n## FAQ\n\n### Q one?\n\nA one.\n\n### Q two?\n\nA two.\n");
    expect(body).not.toContain("## FAQ");
    expect(body).toContain("## Part");
    expect(faq).toEqual([
      { question: "Q one?", answer: "A one." },
      { question: "Q two?", answer: "A two." },
    ]);
  });

  it("keeps sections after the FAQ and ignores headings in code", () => {
    const { body, faq } = splitFaq("```\n## FAQ\n```\n\n## FAQ\n\n### Q?\n\nA.\n\n## After\n\nMore");
    expect(faq).toHaveLength(1);
    expect(body).toContain("## After");
    expect(body).toContain("```\n## FAQ\n```");
  });

  it("drops stat lines without a source URL", () => {
    expect(parseStats("3 | a | https://x.com\n4 | b\n5 | c | not-a-url")).toEqual([
      { value: "3", label: "a", source: "https://x.com" },
    ]);
  });
});

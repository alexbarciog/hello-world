// Markdown extensions for content pages. Writers use plain markdown plus:
//   > [!SUMMARY] / [!TIP] / [!NOTE] / [!WARNING] / [!EXAMPLE]   callouts
//   1. **Bold lead** ...                                          steps (every item opens with bold text)
//   ```message                                                   LinkedIn-style message card
//   ```stats   value | label | source-url                        stat strip
//   a table whose header has "Intentsly"                         that column highlighted
// Reference for writers: content-machine/skills/blog-write.md ("Components").
import type { Blockquote, List, Paragraph, Root as MdRoot, RootContent, Text } from "mdast";
import type { Element, ElementContent, Root as HastRoot, RootContent as HastContent } from "hast";

export const CALLOUT_TYPES = ["summary", "tip", "note", "warning", "example"] as const;
export type CalloutType = (typeof CALLOUT_TYPES)[number];

const MARKER = /^\[!(SUMMARY|TIP|NOTE|WARNING|EXAMPLE)\][ \t]*\n?/i;

function walkMd(node: MdRoot | RootContent, fn: (n: RootContent) => void) {
  if ("children" in node) {
    for (const child of node.children as RootContent[]) {
      fn(child);
      walkMd(child, fn);
    }
  }
}

/** remark: callouts and step lists. */
export function remarkArticle() {
  return (tree: MdRoot) => {
    walkMd(tree, (node) => {
      if (node.type === "blockquote") {
        const bq = node as Blockquote;
        const first = bq.children[0] as Paragraph | undefined;
        const text = first?.type === "paragraph" ? (first.children[0] as Text | undefined) : undefined;
        const m = text?.type === "text" ? text.value.match(MARKER) : null;
        if (!m || !text || !first) return;
        text.value = text.value.slice(m[0].length);
        if (!text.value) first.children.shift();
        if (first.children.length === 0) bq.children.shift();
        bq.data = { ...(bq.data ?? {}), hName: "aside", hProperties: { dataCallout: m[1].toLowerCase() } };
      }
      if (node.type === "list" && (node as List).ordered) {
        const list = node as List;
        const isSteps =
          list.children.length >= 2 &&
          list.children.every((item) => {
            const p = item.children[0];
            return p?.type === "paragraph" && p.children[0]?.type === "strong";
          });
        if (isSteps) list.data = { ...(list.data ?? {}), hProperties: { className: ["steps"] } };
      }
    });
  };
}

const textOfHast = (n: ElementContent | HastContent): string =>
  n.type === "text" ? n.value : "children" in n ? (n.children as ElementContent[]).map(textOfHast).join("") : "";

const elementChildren = (n: { children: (ElementContent | HastContent)[] }) =>
  n.children.filter((c): c is Element => c.type === "element");

function addClass(el: Element, cls: string) {
  const cur: unknown = el.properties.className;
  const list = Array.isArray(cur) ? cur.map(String) : typeof cur === "string" ? cur.split(" ") : [];
  el.properties.className = [...list, cls];
}

/** rehype: wrap tables for horizontal scroll and highlight an "Intentsly" column. */
export function rehypeArticle() {
  return (tree: HastRoot) => {
    const visit = (parent: { children: (ElementContent | HastContent)[] }) => {
      parent.children.forEach((child, i) => {
        if (child.type !== "element") return;
        if (child.tagName === "table") {
          highlightIntentsly(child);
          const wrap: Element = {
            type: "element",
            tagName: "div",
            properties: { className: ["table-wrap"], tabIndex: 0, role: "region", ariaLabel: "Table" },
            children: [child],
          };
          parent.children[i] = wrap;
          return;
        }
        visit(child);
      });
    };
    visit(tree);
  };
}

function highlightIntentsly(table: Element) {
  const sections = elementChildren(table);
  const head = sections.find((s) => s.tagName === "thead");
  const headRow = head ? elementChildren(head).find((r) => r.tagName === "tr") : undefined;
  if (!headRow) return;
  const col = elementChildren(headRow).findIndex((th) => /\bintentsly\b/i.test(textOfHast(th)));
  if (col < 0) return;
  for (const section of sections) {
    for (const row of elementChildren(section).filter((r) => r.tagName === "tr")) {
      const cell = elementChildren(row)[col];
      if (cell) addClass(cell, "col-intentsly");
    }
  }
}

export interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_HEADING = /^##\s+(faq|faqs|frequently asked questions)\b.*$/i;

/**
 * Pulls the "## FAQ" section (### questions) out of the body so it can render
 * as an accordion at the end. Skips fenced code. Body is returned without it.
 */
export function splitFaq(md: string): { body: string; faq: FaqItem[] } {
  const lines = md.split("\n");
  let inCode = false;
  let start = -1;
  let end = lines.length;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trimStart().startsWith("```")) inCode = !inCode;
    if (inCode) continue;
    if (start < 0 && FAQ_HEADING.test(lines[i].trim())) start = i;
    else if (start >= 0 && /^##\s+/.test(lines[i])) {
      end = i;
      break;
    }
  }
  if (start < 0) return { body: md, faq: [] };
  const section = lines.slice(start + 1, end);
  const faq: FaqItem[] = [];
  let cur: FaqItem | null = null;
  for (const line of section) {
    const q = line.match(/^###\s+(.+?)\s*$/);
    if (q) {
      if (cur) faq.push(cur);
      cur = { question: q[1].replace(/[*_`]/g, ""), answer: "" };
    } else if (cur) cur.answer += `${line}\n`;
  }
  if (cur) faq.push(cur);
  const cleaned = faq.map((f) => ({ ...f, answer: f.answer.trim() })).filter((f) => f.question && f.answer);
  if (cleaned.length === 0) return { body: md, faq: [] };
  const body = [...lines.slice(0, start), ...lines.slice(end)].join("\n").trimEnd();
  return { body, faq: cleaned };
}

export interface Stat {
  value: string;
  label: string;
  source: string | null;
}

/** ```stats lines: `value | label | source-url`. Lines without a source are dropped. */
export function parseStats(src: string): Stat[] {
  return src
    .split("\n")
    .map((l) => l.split("|").map((p) => p.trim()))
    .filter((p) => p.length >= 2 && p[0] && p[1])
    .map(([value, label, source]) => ({ value, label, source: source && /^https?:\/\//.test(source) ? source : null }))
    .filter((s) => s.source)
    .slice(0, 4);
}

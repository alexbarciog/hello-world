// Building blocks of the article page. Everything renders in the prerendered
// HTML; JavaScript only adds the scroll-spy, the progress bar and copy buttons.
import { useEffect, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Copy,
  Info,
  Lightbulb,
  ListChecks,
  MessageSquareText,
} from "lucide-react";
import type { CalloutType, Stat } from "@/lib/articleMarkdown";

const CALLOUTS: Record<CalloutType, { label: string; icon: typeof Info; box: string; iconCls: string }> = {
  summary: { label: "Key takeaways", icon: ListChecks, box: "bg-[#EEF6FD] border-[#D3E7F8]", iconCls: "text-[#1A8FE3]" },
  tip: { label: "Tip", icon: Lightbulb, box: "bg-[#F7FFDB] border-[#E4F5A3]", iconCls: "text-[#4D6B00]" },
  note: { label: "Note", icon: Info, box: "bg-[#EEF6FD] border-[#D3E7F8]", iconCls: "text-[#1A8FE3]" },
  warning: { label: "Warning", icon: AlertTriangle, box: "bg-[#FFF7E6] border-[#FBE3B0]", iconCls: "text-[#B45309]" },
  example: { label: "Example", icon: MessageSquareText, box: "bg-[#F5F6F8] border-[#E6E8EC]", iconCls: "text-[#5B6372]" },
};

export function Callout({ type, children }: { type: CalloutType; children: ReactNode }) {
  const c = CALLOUTS[type];
  const Icon = c.icon;
  return (
    <aside
      className={`callout callout-${type} not-prose my-8 rounded-2xl border px-5 py-4 md:px-6 md:py-5 ${c.box} [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:mb-0 [&_li]:mb-1.5 [&_li:last-child]:mb-0 text-[16px] md:text-[17px] leading-[1.65]`}
    >
      <div className="mb-2 flex items-center gap-2 text-[14px] font-semibold text-[#0a0a0a]">
        <Icon className={`h-4 w-4 ${c.iconCls}`} aria-hidden="true" />
        {c.label}
      </div>
      {children}
    </aside>
  );
}

/** ```message: an example post or opener, styled as a LinkedIn message bubble. */
export function MessageCard({ text }: { text: string }) {
  return (
    <figure className="not-prose my-8 max-w-[560px]">
      <div className="flex items-start gap-3">
        <div
          aria-hidden="true"
          className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E8F3FC] text-[13px] font-semibold text-[#1A8FE3]"
        >
          in
        </div>
        <div className="rounded-2xl rounded-tl-md border border-[#E6E8EC] bg-white px-4 py-3 shadow-[0_6px_20px_-12px_rgba(16,24,40,0.25)]">
          <p className="m-0 whitespace-pre-line text-[16px] leading-[1.6] text-[#1D212B]">{text.trim()}</p>
        </div>
      </div>
    </figure>
  );
}

/** ```stats: 2-4 big numbers, each with a source link. */
export function StatsStrip({ stats }: { stats: Stat[] }) {
  if (stats.length === 0) return null;
  return (
    <div className="not-prose my-8 grid grid-cols-2 gap-3 md:grid-cols-[repeat(auto-fit,minmax(0,1fr))]">
      {stats.map((s) => (
        <a
          key={s.label}
          href={s.source ?? undefined}
          target="_blank"
          rel="noopener noreferrer"
          title={`Source: ${s.source}`}
          className="group block rounded-2xl border border-[#E6E8EC] bg-white px-4 py-4 !no-underline hover:border-[#C9D3E0]"
        >
          <span className="block text-[30px] font-bold leading-none tracking-[-0.03em] text-[#0a0a0a]">{s.value}</span>
          <span className="mt-2 block text-[14px] leading-snug text-[#5B6372]">{s.label}</span>
          <span className="mt-2 block truncate text-[12px] text-[#1172C0] opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            Source: {s.source ? new URL(s.source).hostname.replace(/^www\./, "") : ""}
          </span>
        </a>
      ))}
    </div>
  );
}

export function CodeBlock({ code, className }: { code: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked */
    }
  };
  return (
    <div className="code-block">
      <pre>
        <code className={className}>{code}</code>
      </pre>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? "Copied" : "Copy code"}
        className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-[12px] text-white/80 hover:bg-white/20 hover:text-white"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

export function ArticleImage({ src, alt, title }: { src?: string; alt?: string; title?: string }) {
  if (!src) return null;
  return (
    <span className="article-figure">
      <img src={src} alt={alt ?? ""} loading="lazy" decoding="async" width={1200} height={675} />
      {title && <span className="caption">{title}</span>}
    </span>
  );
}

export interface TocItem {
  id: string;
  text: string;
}

/** Highlights the section currently being read. */
function useActiveSection(items: TocItem[]) {
  const [active, setActive] = useState<string | null>(items[0]?.id ?? null);
  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter((e): e is HTMLElement => Boolean(e));
    if (els.length === 0) return;
    // The last heading above the reading line is the current section.
    const update = () => {
      let current = els[0].id;
      for (const el of els) if (el.getBoundingClientRect().top < 140) current = el.id;
      setActive(current);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [items]);
  return active;
}

/** Sticky table of contents for the left rail (≥1200px). */
export function TocRail({ items }: { items: TocItem[] }) {
  const active = useActiveSection(items);
  if (items.length < 2) return null;
  return (
    <nav aria-label="In this article" className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
      <div className="mb-3 text-[12px] font-medium uppercase tracking-wide text-[#5B6372]">In this article</div>
      <ol className="space-y-0.5 border-l border-[#E6E8EC]">
        {items.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              aria-current={active === h.id ? "location" : undefined}
              className={`-ml-px block border-l-2 py-1.5 pl-3 text-[14px] leading-snug transition-colors ${
                active === h.id
                  ? "border-[#1A8FE3] font-medium text-[#0a0a0a]"
                  : "border-transparent text-[#5B6372] hover:text-[#0a0a0a]"
              }`}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Collapsible "In this article" block (below 1200px). Works without JS. */
export function TocCollapsible({ items }: { items: TocItem[] }) {
  if (items.length < 2) return null;
  return (
    <details className="group mb-10 rounded-2xl border border-[#E6E8EC] bg-[#F9FAFB] px-5 py-4">
      <summary className="flex cursor-pointer list-none items-center justify-between text-[14px] font-semibold text-[#0a0a0a] [&::-webkit-details-marker]:hidden">
        In this article
        <ChevronDown className="h-4 w-4 text-[#5B6372] transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <ol className="mt-3 space-y-2">
        {items.map((h) => (
          <li key={h.id}>
            <a href={`#${h.id}`} className="text-[15px] text-[#2B3240] hover:text-[#1A8FE3]">
              {h.text}
            </a>
          </li>
        ))}
      </ol>
    </details>
  );
}

/** 2px reading progress bar at the top of the viewport. */
export function ReadingProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const update = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setProgress(max > 0 ? Math.min(1, Math.max(0, h.scrollTop / max)) : 0);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[2px]">
      <div
        className="h-full origin-left bg-[#1A8FE3]"
        style={{ transform: `scaleX(${progress})`, transition: "transform 80ms linear" }}
      />
    </div>
  );
}

export function FaqAccordion({ id, items, render }: { id: string; items: { question: string; answer: string }[]; render: (md: string) => ReactNode }) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby={id} className="mt-14">
      <h2 id={id} className="scroll-mt-28 mb-5 text-[24px] md:text-[30px] font-[650] tracking-[-0.02em] leading-tight text-[#0a0a0a]">
        Frequently asked questions
      </h2>
      <div className="divide-y divide-[#E6E8EC] rounded-2xl border border-[#E6E8EC] bg-white">
        {items.map((f, i) => (
          <details key={f.question} className="group px-5 md:px-6" open={i === 0}>
            <summary className="flex cursor-pointer list-none items-start justify-between gap-4 py-4 text-[17px] font-semibold leading-snug text-[#0a0a0a] [&::-webkit-details-marker]:hidden">
              <h3 className="m-0 text-[17px] font-semibold tracking-[-0.01em]">{f.question}</h3>
              <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-[#5B6372] transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="article-body pb-5 !text-[16px] md:!text-[17px] [&_p:last-child]:mb-0">{render(f.answer)}</div>
          </details>
        ))}
      </div>
    </section>
  );
}

export function AuthorBox({ name, title }: { name: string; title: string | null }) {
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const isAlex = /alex barciog/i.test(name);
  return (
    <aside className="mt-12 flex items-start gap-4 rounded-2xl border border-[#E6E8EC] bg-white p-5 md:p-6">
      <div
        aria-hidden="true"
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#0a0a0a] text-[15px] font-semibold text-[#C8FF00]"
      >
        {initials}
      </div>
      <div>
        <div className="text-[16px] font-semibold text-[#0a0a0a]">{name}</div>
        <div className="text-[14px] text-[#5B6372]">{isAlex ? "Founder of Intentsly" : title}</div>
        {isAlex && (
          <p className="mt-2 mb-0 text-[15px] leading-relaxed text-[#2B3240]">
            Ran a software agency before building Intentsly.
          </p>
        )}
      </div>
    </aside>
  );
}

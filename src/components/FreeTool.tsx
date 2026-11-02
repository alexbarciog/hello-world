// Shared layout for the free tools: H1, promise, the tool, FAQ, related tools
// and the standard call to action. Also the pieces used inside a result:
// the email capture and the share button.
import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Check, Link2, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/CTAFooter";
import { ALL_TOOLS, type Faq, type FreeToolInfo } from "@/data/freeTools";
import { saveToolLead } from "@/lib/freeTools";

/** Keeps the head right when arriving by in-app navigation (static HTML covers crawlers). */
export function useToolHead(title: string, description: string, path: string) {
  useEffect(() => {
    document.title = title;
    const url = `https://intentsly.com${path}`;
    const set = (selector: string, make: () => HTMLElement, attr: string, value: string) => {
      let el = document.head.querySelector(selector) as HTMLElement | null;
      if (!el) {
        el = make();
        document.head.appendChild(el);
      }
      el.setAttribute(attr, value);
    };
    set('meta[name="description"]', () => Object.assign(document.createElement("meta"), { name: "description" }), "content", description);
    set('link[rel="canonical"]', () => Object.assign(document.createElement("link"), { rel: "canonical" }), "href", url);
  }, [title, description, path]);
}

export function FreeToolLayout({
  tool, h1, promise, faq, title, description, path, children, cta,
}: {
  tool: FreeToolInfo["id"];
  h1: string;
  promise: string;
  faq: Faq[];
  title: string;
  description: string;
  path: string;
  children: ReactNode;
  cta?: { heading: string; body: string };
}) {
  useToolHead(title, description, path);
  return (
    <div className="min-h-screen bg-white font-sans text-[#0a0a0a]">
      <Navbar variant="light" />
      <main>
        <section className="px-5 md:px-8 pt-12 md:pt-20 pb-8">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-block text-[11px] font-semibold tracking-[0.14em] uppercase text-[#3B82F6] mb-4">Free tool · No signup</span>
            <h1 className="font-medium tracking-[-0.03em] leading-[1.05]" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>{h1}</h1>
            <p className="mt-4 text-[17px] text-neutral-600 leading-relaxed">{promise}</p>
          </div>
        </section>

        <section className="px-5 md:px-8 pb-16">
          <div className="max-w-3xl mx-auto">{children}</div>
        </section>

        <ToolCta {...cta} />

        <section className="px-5 md:px-8 py-16" aria-labelledby="tool-faq">
          <div className="max-w-3xl mx-auto">
            <h2 id="tool-faq" className="font-medium tracking-[-0.02em] text-2xl md:text-3xl mb-6">Questions</h2>
            <div className="divide-y divide-neutral-200 border-y border-neutral-200">
              {faq.map((f) => (
                <details key={f.q} className="group py-4">
                  <summary className="cursor-pointer list-none flex items-center justify-between gap-4 text-[15px] font-medium">
                    {f.q}
                    <span className="text-neutral-400 transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-2 text-sm text-neutral-600 leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <RelatedTools current={tool} />
      </main>
      <Footer />
    </div>
  );
}

export function RelatedTools({ current }: { current?: FreeToolInfo["id"] }) {
  const tools = ALL_TOOLS.filter((t) => t.id !== current);
  return (
    <section className="px-5 md:px-8 pb-20" aria-labelledby="related-tools">
      <div className="max-w-3xl mx-auto">
        <h2 id="related-tools" className="font-medium tracking-[-0.02em] text-2xl mb-4">More free tools</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {tools.map((t) => (
            <Link key={t.id} to={t.path} className="rounded-2xl border border-neutral-200 p-4 hover:border-neutral-400 transition-colors">
              <p className="text-sm font-semibold">{t.name}</p>
              <p className="text-[13px] text-neutral-500 mt-1 leading-snug">{t.blurb}</p>
            </Link>
          ))}
        </div>
        <p className="mt-4 text-sm"><Link to="/tools" className="underline underline-offset-2 text-neutral-600 hover:text-neutral-900">See all free tools</Link></p>
      </div>
    </section>
  );
}

export function ToolCta({
  heading = "See who is showing buying signals for what you sell, today.",
  body = "Tell Intentsly who you sell to and it shows you real people on LinkedIn signalling intent. It takes under a minute and needs no account.",
}: { heading?: string; body?: string }) {
  return (
    <section className="px-5 md:px-8">
      <div className="max-w-3xl mx-auto rounded-[24px] bg-[#1A1A2E] text-white p-7 md:p-9">
        <h2 className="text-xl md:text-2xl font-medium tracking-tight leading-snug mb-3">{heading}</h2>
        <p className="text-sm md:text-[15px] text-white/70 leading-relaxed mb-6 max-w-2xl">{body}</p>
        <Link to="/try-ai" className="btn-cta inline-flex">
          Try it free, no signup
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}

/** "Save results, get the full report by email". Optional; consent is explicit. */
export function ToolEmailCapture({
  tool, inputSummary, inputText, resultSummary, heading = "Save results, get the full report by email",
}: {
  tool: FreeToolInfo["id"];
  inputSummary?: string;
  /** The text the tool ran on, so the server can attach its own result. */
  inputText?: string;
  resultSummary?: string;
  heading?: string;
}) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) {
      toast.error("Please tick the box so we can email you.");
      return;
    }
    setBusy(true);
    const result = await saveToolLead({ email, tool, input_summary: inputSummary, input_text: inputText, result_summary: resultSummary, consent_marketing: true });
    setBusy(false);
    if (result.ok) setDone(true);
    else toast.error(result.error);
  };

  if (done) {
    return (
      <p className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800 inline-flex items-center gap-2 w-full">
        <Check className="w-4 h-4 shrink-0" /> Saved. Watch your inbox.
      </p>
    );
  }
  return (
    <form onSubmit={submit} className="rounded-2xl border border-neutral-200 p-4">
      <p className="text-sm font-semibold mb-2 inline-flex items-center gap-1.5"><Mail className="w-4 h-4" /> {heading}</p>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" aria-label="Your email"
          className="flex-1 min-w-0 rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30"
        />
        <button type="submit" disabled={busy} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#0a0a0a] text-white px-4 py-2 text-sm font-semibold disabled:opacity-60">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />} Send it to me
        </button>
      </div>
      <label className="mt-2 flex items-start gap-2 text-xs text-neutral-500">
        <input type="checkbox" className="mt-0.5" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        Email me this and up to two related tips from Intentsly. Unsubscribe any time.
      </label>
    </form>
  );
}

export function ShareResult({ text, path }: { text: string; path: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${text} https://intentsly.com${path}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy. Please copy the link from your address bar.");
    }
  };
  return (
    <button type="button" onClick={copy} className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm hover:bg-neutral-50">
      {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Link2 className="w-4 h-4" />}
      {copied ? "Copied" : "Copy link to share"}
    </button>
  );
}

export function ScoreBadge({ score }: { score: number }) {
  const tone = score >= 70 ? "text-emerald-700 bg-emerald-50 border-emerald-200" : score >= 40 ? "text-amber-700 bg-amber-50 border-amber-200" : "text-rose-700 bg-rose-50 border-rose-200";
  return (
    <div className={`inline-flex items-baseline gap-1 rounded-2xl border px-4 py-2 ${tone}`}>
      <span className="text-3xl font-bold tabular-nums">{score}</span>
      <span className="text-sm">/100</span>
    </div>
  );
}

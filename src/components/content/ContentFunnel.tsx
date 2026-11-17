// Next steps on every content page (/blog, /guides, /learn, /solutions, /compare):
//  - GuideInlineCard: free PDF by email, placed before the article's second H2
//  - TryAiEndCta: /try-ai block at the end of the article
//  - TryAiStickyBar: slim desktop-only bar after 60% of the article
// All three render in the prerendered HTML; the form works once the page hydrates.
import { useEffect, useRef, useState, type RefObject } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, X } from "lucide-react";
import { requestLeadMagnet } from "@/lib/leadMagnets";
import { track } from "@/lib/analytics";
import { tryAiHref, type GuideOffer } from "@/lib/contentFunnel";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Inline "free PDF" card with an email field. */
export function GuideInlineCard({ guide, path }: { guide: GuideOffer; path: string }) {
  const ref = useRef<HTMLElement>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ assetUrl: string; emailed: boolean } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          track("guide_cta_view", { slug: guide.slug, path });
          io.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [guide.slug, path]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setError("Please enter a valid email.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await requestLeadMagnet({ slug: guide.slug, email: trimmed, name: "", source: `content:${path}` });
      if (result.status === "error") {
        setError(result.message);
        return;
      }
      track("guide_cta_submit", { slug: guide.slug, path });
      setDone({ assetUrl: result.assetUrl, emailed: result.status === "sent" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <aside
      ref={ref}
      aria-label={`Free guide: ${guide.title}`}
      className="not-prose my-10 rounded-3xl border border-neutral-200/80 bg-white p-5 md:p-6 shadow-[0_8px_30px_-12px_rgba(10,20,40,0.18)] font-sans"
    >
      <div className="flex gap-4 md:gap-5">
        <img
          src={guide.thumb}
          alt={`Cover of ${guide.title}`}
          width={240}
          height={340}
          loading="lazy"
          decoding="async"
          className="hidden sm:block w-[72px] md:w-[84px] h-auto self-start rounded-md shadow-[0_10px_20px_-10px_rgba(10,20,40,0.45)] rotate-[-3deg]"
        />
        <div className="min-w-0 flex-1">
          <p className="text-[17px] leading-snug text-[#0a0a0a] mb-1">
            <span className="font-semibold">Free: {guide.title}.</span>{" "}
            <span className="text-neutral-600">{guide.blurb}</span>
          </p>
          {done ? (
            <p className="mt-3 text-[15px] text-[#0a0a0a]" aria-live="polite">
              {done.emailed ? "Sent. Check your inbox." : "We couldn't email it, but here it is."}{" "}
              <a
                href={done.assetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[#1A8FE3] underline underline-offset-2"
              >
                Open it now
              </a>
            </p>
          ) : (
            <form onSubmit={submit} className="mt-3 flex flex-col sm:flex-row gap-2" noValidate>
              <label htmlFor={`guide-email-${guide.slug}`} className="sr-only">
                Your email
              </label>
              <input
                id={`guide-email-${guide.slug}`}
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="min-w-0 flex-1 rounded-full border border-neutral-300 bg-white px-4 py-2.5 text-[15px] text-[#0a0a0a] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#1A8FE3]/40 focus:border-[#1A8FE3]"
              />
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#C8FF00] px-5 py-2.5 text-[15px] font-semibold text-[#0a0a0a] hover:bg-[#d4ff33] disabled:opacity-60 whitespace-nowrap"
              >
                {loading ? "Sending…" : "Send me the PDF"}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>
          )}
          {error && (
            <p className="mt-2 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}

/** End-of-article block pointing to /try-ai. */
export function TryAiEndCta({ slug, path }: { slug: string; path: string }) {
  return (
    <aside
      aria-labelledby="tryai-end-heading"
      className="not-prose mt-14 rounded-3xl border border-neutral-200/80 bg-white p-7 md:p-9 shadow-[0_8px_30px_-12px_rgba(10,20,40,0.18)] font-sans"
    >
      <h2 id="tryai-end-heading" className="text-2xl md:text-[28px] font-semibold tracking-tight leading-tight text-[#0a0a0a] mb-3">
        See who's asking for what you sell
      </h2>
      <p className="text-[16px] text-neutral-600 leading-relaxed mb-6 max-w-xl">
        Put in your website. Intentsly shows you the people on LinkedIn asking for your service this week. No signup
        needed.
      </p>
      <Link
        to={tryAiHref(slug)}
        onClick={() => track("tryai_click", { path, from: "end_cta" })}
        className="inline-flex items-center gap-2 rounded-full bg-[#C8FF00] px-6 py-3 text-[15px] font-semibold text-[#0a0a0a] hover:bg-[#d4ff33]"
      >
        Show me who's asking
        <ArrowUpRight className="h-4 w-4" />
      </Link>
    </aside>
  );
}

const STICKY_DISMISSED = "ia_sticky_dismissed";

/** Desktop-only bar that slides up after the reader passes 60% of the article. */
export function TryAiStickyBar({
  slug,
  path,
  articleRef,
}: {
  slug: string;
  path: string;
  articleRef: RefObject<HTMLElement>;
}) {
  const [enabled, setEnabled] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STICKY_DISMISSED)) return;
    } catch {
      /* storage unavailable: show as normal */
    }
    const desktop = window.matchMedia("(min-width: 1024px)");
    if (!desktop.matches) return;
    setEnabled(true);
    const check = () => {
      const el = articleRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const read = (window.innerHeight - rect.top) / Math.max(1, rect.height);
      setShown(read >= 0.6); // same value = no re-render
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check, { passive: true });
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [articleRef]);

  const dismiss = () => {
    setEnabled(false);
    try {
      sessionStorage.setItem(STICKY_DISMISSED, "1");
    } catch {
      /* ignore */
    }
  };

  if (!enabled) return null;
  return (
    <div
      role="complementary"
      aria-label="Try Intentsly"
      aria-hidden={!shown}
      className={`fixed inset-x-0 bottom-0 z-40 hidden lg:block px-4 pb-4 transition-transform duration-300 ${
        shown ? "translate-y-0" : "translate-y-[130%]"
      }`}
    >
      <div className="mx-auto max-w-3xl rounded-2xl border border-neutral-200 bg-white shadow-[0_12px_40px_-12px_rgba(10,20,40,0.30)] px-5 py-3 flex items-center gap-4 font-sans">
        <p className="flex-1 min-w-0 text-[15px] text-[#0a0a0a]">
          <span className="font-semibold">See who's asking for what you sell.</span>{" "}
          <span className="text-neutral-500">No signup needed.</span>
        </p>
        <Link
          to={tryAiHref(slug)}
          tabIndex={shown ? 0 : -1}
          onClick={() => track("tryai_click", { path, from: "sticky_bar" })}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#C8FF00] px-4 py-2 text-sm font-semibold text-[#0a0a0a] hover:bg-[#d4ff33] whitespace-nowrap"
        >
          Show me who's asking
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
        <button
          type="button"
          onClick={dismiss}
          tabIndex={shown ? 0 : -1}
          aria-label="Close"
          className="p-1 rounded-md text-neutral-400 hover:text-[#0a0a0a]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// Conversion elements for the content sections (/blog, /guides, /learn,
// /solutions, /compare). Every page gets them automatically; the copy adapts
// to the section so the pitch matches what the reader is doing.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, X } from "lucide-react";
import type { Section } from "@/lib/blog";

interface Copy {
  eyebrow: string;
  heading: string;
  body: string;
  primary: { label: string; to: string };
  secondary: { label: string; to: string };
}

const COPY: Record<Section, Copy> = {
  blog: {
    eyebrow: "Do this automatically",
    heading: "See who is showing buying signals for what you sell, today.",
    body: "Intentsly watches LinkedIn for people engaging with competitor posts, writing about the problem you solve or following your competitors' pages, then scores them against your ideal customer and starts the conversation.",
    primary: { label: "Try it free, no signup", to: "/try-ai" },
    secondary: { label: "See LinkedIn signals", to: "/features/linkedin-signals" },
  },
  guides: {
    eyebrow: "Skip the manual steps",
    heading: "Everything in this guide, running for you every day.",
    body: "The searches, filters and follow-ups above are what Intentsly does continuously: it finds the people showing intent, enriches them with verified emails and books the meetings.",
    primary: { label: "Try it on your ICP", to: "/try-ai" },
    secondary: { label: "How the AI SDR works", to: "/features/ai-sdr" },
  },
  learn: {
    eyebrow: "See it in practice",
    heading: "Watch these signals show up for your own market.",
    body: "Tell Intentsly who you sell to and it will show you real people on LinkedIn who are signalling intent right now. It takes under a minute and needs no account.",
    primary: { label: "Find buyers in seconds", to: "/try-ai" },
    secondary: { label: "Get the Buying Signal Playbook", to: "/signal-playbook" },
  },
  solutions: {
    eyebrow: "Built for this",
    heading: "Turn these signals into booked meetings without a sales team.",
    body: "Intentsly monitors the signals on this page for your market, scores every prospect against your ideal customer, holds the LinkedIn conversation for you and sends your calendar link so the meeting gets booked. Live in five minutes, 7-day free trial.",
    primary: { label: "Start for free", to: "/register" },
    secondary: { label: "See pricing", to: "/pricing" },
  },
  compare: {
    eyebrow: "Decide with real data",
    heading: "Run Intentsly on your own market before you choose.",
    body: "The fastest way to settle a comparison is to see which signals each tool finds for your buyers. Intentsly shows you matching prospects in seconds, before you create an account.",
    primary: { label: "Try it free", to: "/try-ai" },
    secondary: { label: "See pricing", to: "/pricing" },
  },
};

/** Card placed inside the article body after the second section. */
export const InlineCta = ({ section }: { section: Section }) => {
  const c = COPY[section];
  return (
    <aside
      aria-label="Try Intentsly"
      className="not-prose my-12 rounded-[24px] bg-[#1A1A2E] text-white p-7 md:p-9"
    >
      <div className="text-xs uppercase tracking-[0.2em] text-white/50 mb-3">{c.eyebrow}</div>
      <h3 className="text-xl md:text-2xl font-medium tracking-tight leading-snug mb-3">{c.heading}</h3>
      <p className="text-sm md:text-[15px] text-white/70 leading-relaxed mb-6 max-w-2xl">{c.body}</p>
      <div className="flex flex-wrap gap-3">
        <Link to={c.primary.to} className="btn-cta">
          {c.primary.label}
          <ArrowUpRight className="w-4 h-4" />
        </Link>
        <Link
          to={c.secondary.to}
          className="inline-flex items-center gap-1.5 text-sm text-white/80 hover:text-white px-4 py-3"
        >
          {c.secondary.label}
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>
    </aside>
  );
};

/** "Next step" box at the end of the article, before related pages. */
export const NextStepCta = ({ section }: { section: Section }) => {
  const c = COPY[section];
  return (
    <section aria-labelledby="next-step-heading" className="max-w-3xl mx-auto px-6 pb-16">
      <div className="rounded-[24px] bg-[#f4f4f5] p-7 md:p-9">
        <h2 id="next-step-heading" className="text-xs uppercase tracking-[0.2em] text-foreground/50 mb-4">
          Your next step
        </h2>
        <p className="text-lg md:text-xl font-medium tracking-tight text-foreground mb-2">{c.heading}</p>
        <p className="text-[15px] text-foreground/65 leading-relaxed mb-6 max-w-2xl">{c.body}</p>
        <div className="flex flex-wrap gap-3">
          <Link to={c.primary.to} className="btn-cta">
            {c.primary.label}
            <ArrowUpRight className="w-4 h-4" />
          </Link>
          <Link to="/register" className="inline-flex items-center gap-1.5 text-sm text-foreground/70 hover:text-foreground px-4 py-3">
            Create an account
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
        <p className="mt-5 text-sm text-foreground/60">
          Questions? Email{" "}
          <a href="mailto:alex@intentsly.com" className="underline underline-offset-2 hover:text-foreground">alex@intentsly.com</a>
          , I answer within a day.
        </p>
      </div>
    </section>
  );
};

/** Dismissible bar that appears once the reader has scrolled a third of the page. */
export const StickyCta = ({ section }: { section: Section }) => {
  const c = COPY[section];
  const [shown, setShown] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem("intentsly-cta-dismissed")) {
        setDismissed(true);
        return;
      }
    } catch {
      // storage unavailable: show the bar as normal
    }
    const onScroll = () => {
      const h = document.documentElement;
      const progress = (h.scrollTop || document.body.scrollTop) / Math.max(1, h.scrollHeight - h.clientHeight);
      setShown(progress > 0.33);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const dismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem("intentsly-cta-dismissed", "1");
    } catch {
      // ignore
    }
  };

  if (dismissed) return null;
  return (
    <div
      role="complementary"
      aria-label="Try Intentsly"
      className={`fixed inset-x-0 bottom-0 z-40 px-3 pb-3 transition-transform duration-300 ${
        shown ? "translate-y-0" : "translate-y-[120%]"
      }`}
    >
      <div className="mx-auto max-w-3xl rounded-2xl bg-[#1A1A2E] text-white shadow-2xl px-4 py-3 md:px-6 md:py-4 flex items-center gap-3 md:gap-5">
        <p className="text-sm text-white/85 leading-snug flex-1 min-w-0">
          <span className="font-medium text-white">{c.eyebrow}.</span>{" "}
          <span className="hidden sm:inline">Intentsly finds people showing buying signals for what you sell.</span>
        </p>
        <Link to={c.primary.to} className="btn-cta text-xs !py-2 !px-4 whitespace-nowrap">
          {c.primary.label}
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="text-white/50 hover:text-white p-1 rounded-md"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

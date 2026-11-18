// Sections below the Buying Signal Finder: how it works, what a buying signal
// is, the service reports, FAQ and the call to action. Static markup only (it
// is prerendered): no state, no effects, CSS-only visuals, no statistics.
import { Link } from "react-router-dom";
import {
  ArrowRight, ArrowUpRight, Calculator, Code2, Headset, LineChart, Megaphone, MessageSquareText, Palette, PenLine,
  Presentation, Radar, Repeat2, Search, ShieldCheck, Target, ThumbsUp, Type, UserPlus, Video, type LucideIcon,
} from "lucide-react";
import { SIGNAL_SERVICES, type Faq } from "@/data/freeTools";
import { capitalise } from "@/lib/signalText";

const SERVICE_ICONS: Record<string, LucideIcon> = {
  "web-design": Palette,
  seo: Search,
  recruiting: UserPlus,
  "software-development": Code2,
  "content-marketing": PenLine,
  "paid-ads": Megaphone,
  bookkeeping: Calculator,
  "fractional-cfo": LineChart,
  "it-support": Headset,
  cybersecurity: ShieldCheck,
  "video-production": Video,
  "sales-training": Presentation,
};
export const serviceIcon = (slug: string) => SERVICE_ICONS[slug] ?? Radar;

const P = "text-[16px] md:text-[17px] leading-relaxed text-neutral-600";

function SectionHead({ id, eyebrow, title, lead, center = false, onBand = false }: {
  id: string; eyebrow: string; title: string; lead?: string; center?: boolean; onBand?: boolean;
}) {
  return (
    <div className={center ? "text-center max-w-3xl mx-auto" : "max-w-3xl"}>
      <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-600 ${onBand ? "bg-white ring-1 ring-neutral-200" : "bg-neutral-100"}`}>
        {eyebrow}
      </span>
      <h2 id={id} className="mt-4 font-medium tracking-[-0.03em] leading-[1.08] text-[#0a0a0a]" style={{ fontSize: "clamp(1.75rem, 3.6vw, 2.75rem)" }}>
        {title}
      </h2>
      {lead && <p className={`mt-4 ${P}`}>{lead}</p>}
    </div>
  );
}

const STEPS: { Icon: LucideIcon; title: string; text: string }[] = [
  { Icon: Type, title: "Type what you sell", text: "A service in your own words, like \"web design\" or \"pen testing\". Or open one of the 12 ready-made service reports." },
  { Icon: MessageSquareText, title: "See how buyers word it", text: "Five example posts written the way buyers tend to ask, and the roles that usually post them. The examples are illustrative, not real posts." },
  { Icon: Target, title: "Go find the real people", text: "Search the wording on LinkedIn yourself, or let Intentsly watch for it every day and score each person against your ideal customer." },
];

const KINDS: { Icon: LucideIcon; title: string; text: string; example: string }[] = [
  { Icon: MessageSquareText, title: "Asking for recommendations", text: "The clearest signal. Someone names the service and asks who to use.", example: "Can anyone recommend a bookkeeper for a small agency?" },
  { Icon: Search, title: "Describing the problem", text: "They don't name the service yet, but they describe the pain it fixes.", example: "Our cash forecasting is a guess." },
  { Icon: ThumbsUp, title: "Engaging with a competitor", text: "Liking, commenting on or sharing posts from a company that sells what you sell.", example: "A comment on a competitor's launch post" },
  { Icon: Repeat2, title: "Changing jobs", text: "New leaders review suppliers and budgets in their first months in a role.", example: "A new Head of Marketing, in the role a few weeks" },
];

const CHECKS = [
  { title: "Is it the person who buys?", text: "A founder asking for a fractional CFO is a buyer. A student asking how CFOs work is not." },
  { title: "Is it recent?", text: "A request from this week can still be answered. One from last year has usually been solved." },
  { title: "Is it specific?", text: "\"Who builds internal tools?\" is worth a message. \"Software is eating the world\" is not." },
];

export function HowItWorks() {
  return (
    <section className="px-5 md:px-8 py-16 md:py-24" aria-labelledby="bsf-how">
      <div className="max-w-6xl mx-auto">
        <SectionHead
          id="bsf-how" eyebrow="How it works" title="From a service name to the people asking for it" center
          lead="The finder shows the pattern: how people who need your service talk about it on LinkedIn, and who they are. Intentsly does the finding."
        />
        <ol className="mt-12 grid gap-4 md:grid-cols-3">
          {STEPS.map(({ Icon, title, text }, i) => (
            <li key={title} className="relative rounded-3xl border border-neutral-200 bg-white p-6 md:p-7 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0a0a0a] text-[hsl(var(--aeline-lime))]"><Icon className="h-5 w-5" aria-hidden /></span>
                <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[12px] font-semibold text-neutral-600 tabular-nums">Step {i + 1}</span>
              </div>
              <h3 className="mt-5 text-lg font-semibold tracking-tight">{title}</h3>
              <p className="mt-1.5 text-[15px] leading-relaxed text-neutral-600">{text}</p>
            </li>
          ))}
        </ol>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl bg-neutral-50 border border-neutral-200 p-6 md:p-7">
            <h3 className="text-lg font-semibold tracking-tight inline-flex items-center gap-2"><Radar className="h-4 w-4 text-[#2563EB]" aria-hidden /> Where the count comes from</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-neutral-600">
              Intentsly's agents watch LinkedIn for its customers. The report counts matching signals they found in the last
              30 days, without names or post text. If there are fewer than 10, no number is shown.
            </p>
          </div>
          <div className="rounded-3xl bg-neutral-50 border border-neutral-200 p-6 md:p-7">
            <h3 className="text-lg font-semibold tracking-tight inline-flex items-center gap-2"><MessageSquareText className="h-4 w-4 text-[#2563EB]" aria-hidden /> Why the examples are made up</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-neutral-600">
              Real posts belong to real people, so the finder never shows them. The examples are written to match how buyers
              tend to phrase it, so you can recognise the pattern and reuse the wording.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function WhatIsASignal() {
  return (
    <section className="px-5 md:px-8 py-16 md:py-24 bg-[#F7F7F5]" aria-labelledby="bsf-what">
      <div className="max-w-6xl mx-auto">
        <SectionHead
          id="bsf-what" eyebrow="The basics" title="What is a buying signal?" onBand
          lead="Something a person does in public that suggests they may need what you sell. On LinkedIn, four kinds come up again and again."
        />
        <div className="mt-10 grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-start">
          <ul className="grid gap-3 sm:grid-cols-2">
            {KINDS.map(({ Icon, title, text, example }) => (
              <li key={title} className="flex flex-col rounded-2xl bg-white border border-neutral-200 p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-800"><Icon className="h-5 w-5" aria-hidden /></span>
                <h3 className="mt-4 text-[16px] font-semibold tracking-tight text-neutral-900">{title}</h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-neutral-600">{text}</p>
                <p className="mt-4 rounded-xl bg-neutral-50 px-3 py-2 text-[13px] leading-snug text-neutral-700">
                  <span className="font-semibold text-neutral-900">For example:</span> {example}
                </p>
              </li>
            ))}
          </ul>
          <aside className="rounded-3xl bg-white border border-neutral-200 p-6 md:p-7 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.25)]" aria-labelledby="bsf-checks">
            <h3 id="bsf-checks" className="text-xl font-semibold tracking-tight">Three checks before you reach out</h3>
            <ol className="mt-5 space-y-3">
              {CHECKS.map(({ title, text }, i) => (
                <li key={title} className="flex gap-3.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0a0a0a] text-[12px] font-semibold text-white tabular-nums">{i + 1}</span>
                  <div>
                    <p className="text-[15px] font-semibold text-neutral-900">{title}</p>
                    <p className="mt-0.5 text-[14px] leading-relaxed text-neutral-600">{text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-5 text-[14px] leading-relaxed text-neutral-600">
              More in our guide to{" "}
              <Link to="/blog/linkedin-buying-signals" className="font-semibold text-neutral-900 underline underline-offset-2 decoration-neutral-300 hover:decoration-neutral-900">LinkedIn buying signals</Link>.
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}

export function ServiceGrid({ current }: { current?: string }) {
  return (
    <section className="px-5 md:px-8 py-16 md:py-24" aria-labelledby="bsf-services">
      <div className="max-w-6xl mx-auto">
        <SectionHead
          id="bsf-services" eyebrow="Service reports" title="Buying signals by service"
          lead="Ready-made reports for 12 services, each with example phrasings, the roles that post them and a live signal count when there is one."
        />
        <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SIGNAL_SERVICES.map((s) => {
            const Icon = serviceIcon(s.slug);
            const here = s.slug === current;
            return (
              <li key={s.slug}>
                <Link
                  to={`/buying-signals/${s.slug}`} aria-current={here ? "page" : undefined}
                  className={`group flex h-full flex-col rounded-2xl border bg-white p-5 transition-[border-color,box-shadow] hover:border-neutral-400 hover:shadow-[0_12px_40px_-20px_rgba(15,23,42,0.3)] ${here ? "border-[#2563EB] ring-1 ring-[#2563EB]" : "border-neutral-200"}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB]"><Icon className="h-5 w-5" aria-hidden /></span>
                    <ArrowUpRight className="h-4 w-4 text-neutral-500 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
                  </div>
                  <h3 className="mt-4 text-[16px] font-semibold tracking-tight text-neutral-900">{capitalise(s.name)}</h3>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-neutral-600">“{s.phrasings[0]}”</p>
                  <p className="mt-auto pt-4 text-[12px] font-medium text-neutral-600">{s.roles.slice(0, 3).join(" · ")}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export function SignalFaq({ faq }: { faq: Faq[] }) {
  return (
    <section className="px-5 md:px-8 py-16 md:py-24 bg-[#F7F7F5]" aria-labelledby="bsf-faq">
      <div className="max-w-6xl mx-auto grid gap-10 lg:grid-cols-[1fr_1.6fr]">
        <div>
          <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-600 ring-1 ring-neutral-200">FAQ</span>
          <h2 id="bsf-faq" className="mt-4 font-medium tracking-[-0.03em] leading-[1.08]" style={{ fontSize: "clamp(1.75rem, 3.6vw, 2.75rem)" }}>
            Questions about the buying signal finder
          </h2>
        </div>
        <div className="space-y-3">
          {faq.map((f) => (
            <details key={f.q} className="group rounded-2xl bg-white border border-neutral-200 px-5 py-4 open:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)]">
              <summary className="cursor-pointer list-none flex items-center justify-between gap-4 text-[15px] md:text-base font-semibold text-neutral-900">
                {f.q}
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 transition-transform group-open:rotate-45" aria-hidden>+</span>
              </summary>
              <p className="mt-3 text-[15px] text-neutral-600 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SignalCta({ heading, body }: { heading: string; body: string }) {
  return (
    <section className="px-5 md:px-8 py-16 md:py-24" aria-labelledby="bsf-cta">
      <div className="max-w-6xl mx-auto relative overflow-hidden rounded-[32px] bg-[#1A1A2E] p-7 md:p-14">
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[hsl(var(--aeline-lime))]/20 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-[#3B82F6]/25 blur-3xl" aria-hidden />
        <div className="relative grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-end">
          <div>
            <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[hsl(var(--aeline-lime))]">
              Find the real people
            </span>
            <h2 id="bsf-cta" className="mt-4 font-medium tracking-[-0.03em] leading-[1.08] text-white" style={{ fontSize: "clamp(1.75rem, 3.6vw, 2.75rem)" }}>
              {heading}
            </h2>
            <p className="mt-4 max-w-2xl text-[16px] md:text-[17px] leading-relaxed text-neutral-300">{body}</p>
          </div>
          <div className="lg:justify-self-end">
            <Link to="/try-ai" className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--aeline-lime))] px-6 py-3.5 text-[15px] font-semibold text-[#0a0a0a] hover:brightness-95">
              Try it free, no signup <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

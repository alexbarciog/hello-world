// Long-form guide rendered below the Fake LinkedIn Profile Checker. Static
// markup only (it is prerendered for search engines): no state, no effects,
// CSS-only visuals. Every claim about LinkedIn links to the page it comes from.
//
// Wording rule: the sections about the checker talk about risk signals and
// never call a checked person fake or a scammer.

import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Activity, ArrowRight, BadgeDollarSign, Bitcoin, Briefcase, Building2, CalendarClock, Copy, ExternalLink, EyeOff, FileText,
  Fish, Flag, Gauge, GraduationCap, Image as ImageIcon, Link2, MapPin, MessageCircle, Receipt, ScanSearch, Sparkles, UserX, Users,
} from "lucide-react";
import { SIGNAL_DEFS } from "../../../supabase/functions/_shared/fake-profile";
import { track } from "@/lib/fakeProfileChecker";

const URLS = {
  reportFakeProfiles: "https://www.linkedin.com/help/linkedin/answer/61664",
  recogniseScams: "https://www.linkedin.com/help/linkedin/answer/a1336387",
  communityReport: "https://about.linkedin.com/transparency/community-report",
  aboutThisProfile:
    "https://www.linkedin.com/blog/member/trust-and-safety/new-linkedin-profile-features-help-verify-identity-detect-remove-fake-accounts-boost-authenticity",
  ftcJobScams: "https://consumer.ftc.gov/articles/job-scams",
  ftcCrypto: "https://consumer.ftc.gov/articles/what-know-about-cryptocurrency-and-scams",
  ftcPhishing: "https://consumer.ftc.gov/articles/how-recognize-and-avoid-phishing-scams",
};

const P = "text-[16px] md:text-[17px] leading-relaxed text-neutral-600";
const A = "underline underline-offset-2 decoration-neutral-300 hover:decoration-neutral-900 text-neutral-900";
const B = "font-semibold text-neutral-900";
const MAX_WEIGHT = Math.max(...SIGNAL_DEFS.map((d) => d.weight));

function Ext({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={A}>
      {children}
    </a>
  );
}

function SectionHead({ id, eyebrow, title, lead, center = false, dark = false }: {
  id: string; eyebrow: string; title: string; lead?: ReactNode; center?: boolean; dark?: boolean;
}) {
  return (
    <div className={center ? "text-center max-w-3xl mx-auto" : "max-w-3xl"}>
      <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${dark ? "bg-white/10 text-[hsl(var(--aeline-lime))]" : "bg-neutral-100 text-neutral-600"}`}>
        {eyebrow}
      </span>
      <h2 id={id} className={`mt-4 font-medium tracking-[-0.03em] leading-[1.08] ${dark ? "text-white" : "text-[#0a0a0a]"}`} style={{ fontSize: "clamp(1.75rem, 3.6vw, 2.75rem)" }}>
        {title}
      </h2>
      {lead && <p className={`mt-4 ${dark ? "text-white/70 text-[16px] md:text-[17px] leading-relaxed" : P}`}>{lead}</p>}
    </div>
  );
}

const STEPS = [
  { Icon: Link2, title: "Paste a profile link", text: "Any personal linkedin.com/in/ link. Company pages aren't supported." },
  { Icon: ScanSearch, title: "We read the public page", text: "Only what a logged-out visitor sees. We don't log in to LinkedIn and nothing is sent to the person." },
  { Icon: Gauge, title: "You get a risk score", text: "A 0–100 score, the risk level and the signals behind it, with what each one means." },
];

const SIGNS: { Icon: typeof ImageIcon; title: string; text: ReactNode }[] = [
  { Icon: ImageIcon, title: "A stock or AI-generated photo", text: <>Too polished, a celebrity, or a picture found elsewhere under another name. LinkedIn <Ext href={URLS.reportFakeProfiles}>lists stock and heavily edited photos</Ext> as warning signs.</> },
  { Icon: Users, title: "Few connections, many endorsements", text: "Endorsements come from a network. Dozens of them on an account with a handful of connections don't add up." },
  { Icon: Building2, title: "Vague titles at big brands", text: "\"Manager at Google\" with no team, no dates and nothing that matches the rest of the history." },
  { Icon: Activity, title: "No activity", text: "No posts, comments or reactions, ever, on an account that is busy sending messages." },
  { Icon: FileText, title: "Generic About text", text: "\"Passionate, results-driven professional\" with nothing specific about the person's own work." },
  { Icon: MapPin, title: "Mismatched locations", text: "A London address, a job in Singapore and a phone number from a third country, with no explanation." },
  { Icon: GraduationCap, title: "Education that doesn't fit", text: "A degree that ends after the senior roles began, or a school that doesn't seem to exist." },
  { Icon: UserX, title: "Name and photo don't match", text: "The name suggests one person, the face another, or a reverse image search finds the photo under a different name." },
  { Icon: CalendarClock, title: "A recently created profile", text: <>LinkedIn's <Ext href={URLS.aboutThisProfile}>"About this profile" panel</Ext> shows when a profile was created. A long career on a weeks-old account is odd.</> },
  { Icon: BadgeDollarSign, title: "Only recruiter or \"investment\" talk", text: "Every post and message is about a job that pays too well or a trading opportunity, and nothing else." },
  { Icon: MessageCircle, title: "A fast push to WhatsApp or Telegram", text: <>LinkedIn's <Ext href={URLS.recogniseScams}>scam guidance</Ext> names urgent requests to move to WhatsApp, Telegram or outside forms as a warning sign.</> },
  { Icon: Copy, title: "Copy-paste messages", text: <>Not addressed to you and could have gone to a thousand people. LinkedIn <Ext href={URLS.recogniseScams}>flags these</Ext> too.</> },
];

const SCAMS: { Icon: typeof Briefcase; tone: string; title: string; text: ReactNode }[] = [
  {
    Icon: Briefcase, tone: "bg-sky-50 text-sky-600", title: "Fake recruiters and job offers",
    text: <>High pay for little work, then a request for a fee, bank details, ID or equipment. LinkedIn's <Ext href={URLS.recogniseScams}>scam help page</Ext> says legitimate companies shouldn't ask for transfers, cheques, gift cards or wired money when you apply. The FTC's <Ext href={URLS.ftcJobScams}>job scams page</Ext>: honest employers never ask you to pay to get a job.</>,
  },
  {
    Icon: Bitcoin, tone: "bg-amber-50 text-amber-600", title: "Crypto and investment scams",
    text: <>Friendly networking that turns into a trading platform, a coin or a "mentor" with great returns. The FTC's page on <Ext href={URLS.ftcCrypto}>cryptocurrency and scams</Ext> says these often start on social media, promise guaranteed returns, and that only scammers demand payment in crypto.</>,
  },
  {
    Icon: Receipt, tone: "bg-violet-50 text-violet-600", title: "Fake buyers: a proposal, then a fee",
    text: <>Aimed at people who sell. A keen "buyer" asks for a proposal, then for a small fee first: supplier registration, a compliance check, a vendor portal. It's a version of what LinkedIn calls <Ext href={URLS.recogniseScams}>advance fee fraud</Ext>. A real buyer pays you; you don't pay them.</>,
  },
  {
    Icon: Fish, tone: "bg-rose-50 text-rose-600", title: "Phishing links",
    text: <>A "document", "job application" or fake login page that collects your password or installs malware. The FTC's guide to <Ext href={URLS.ftcPhishing}>recognising phishing</Ext> describes invented account problems and pushy links. LinkedIn <Ext href={URLS.recogniseScams}>will never ask for your password</Ext>.</>,
  },
];

const TODO: { title: string; text: ReactNode }[] = [
  { title: "Don't pay, don't click, don't send documents", text: "Hold off on any link, payment, gift card or copy of your ID until you know who you're dealing with." },
  { title: "Keep the conversation on LinkedIn", text: <>LinkedIn <Ext href={URLS.aboutThisProfile}>says it may warn you</Ext> about messages asking you to move to another platform, because that can be a sign of a scam.</> },
  { title: "Open \"About this profile\"", text: <>It <Ext href={URLS.aboutThisProfile}>shows</Ext> when the profile was created and last updated, and whether a phone number or work email is verified. A verification is one point in its favour, not proof.</> },
  { title: "Check the photo", text: "Run it through a reverse image search. If it shows up under other names, that's a strong sign." },
  { title: "Check the company yourself", text: <>Use the company's own website or phone number, not the one in the message, and ask whether the person works there. The <Ext href={URLS.ftcPhishing}>FTC gives the same advice</Ext>.</> },
  { title: "Run the profile through the checker", text: "It won't give you certainty, but it puts the public risk signals in one place in about 20 seconds." },
  { title: "Report the profile", text: "Follow LinkedIn's steps on the right. Reporting helps LinkedIn find accounts its own systems missed." },
  { title: "Report any losses", text: <>Contact your bank and local police. LinkedIn's <Ext href={URLS.recogniseScams}>scam page</Ext> also points to the FBI's IC3 and the FTC; in the US, <Ext href={URLS.ftcJobScams}>job scams</Ext> go to ReportFraud.ftc.gov.</> },
];

export default function FakeProfileGuide() {
  return (
    <div>
      {/* 1. How the checker works */}
      <section className="px-5 md:px-8 py-16 md:py-24" aria-labelledby="how-it-works">
        <div className="max-w-6xl mx-auto">
          <SectionHead
            id="how-it-works" eyebrow="How it works" title="How this LinkedIn profile checker works" center
            lead="It reads the public version of a profile, the one anyone can see without logging in, and looks for risk signals: gaps and patterns that often show up in made-up or throwaway accounts."
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

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="rounded-3xl bg-neutral-50 border border-neutral-200 p-6 md:p-7">
              <h3 className="text-lg font-semibold tracking-tight">Fixed rules first</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-neutral-600">
                Most signals come from rules that work the same way every time. Is there a work history? Do the jobs have
                dates? How many connections show? Does the headline name a big company that never appears in the history?
              </p>
            </div>
            <div className="rounded-3xl bg-neutral-50 border border-neutral-200 p-6 md:p-7">
              <h3 className="text-lg font-semibold tracking-tight inline-flex items-center gap-2"><Sparkles className="h-4 w-4 text-[#2563EB]" aria-hidden /> Then one AI judgement</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-neutral-600">
                An AI model reads the text once and judges three things: whether the career story hangs together, whether
                the About text reads like a template, and whether the headline leads with money bait. When a photo is
                visible, a cautious check can flag a likely stock or AI image. It can never prove it.
              </p>
            </div>
            <div className="rounded-3xl bg-neutral-50 border border-neutral-200 p-6 md:p-7">
              <h3 className="text-lg font-semibold tracking-tight inline-flex items-center gap-2"><EyeOff className="h-4 w-4 text-neutral-500" aria-hidden /> Hidden isn't missing</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-neutral-600">
                LinkedIn hides parts of many profiles from logged-out visitors. A section we can't see is marked
                "couldn't check" and left out of the score, so a private profile isn't marked down for being private.
              </p>
            </div>
          </div>

          {/* Score scale */}
          <div className="mt-6 rounded-3xl border border-neutral-200 bg-white p-6 md:p-8">
            <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
              <div>
                <h3 className="text-xl font-semibold tracking-tight">How the score is worked out</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-neutral-600">
                  Each signal has a weight. A red flag counts its full weight and a caution counts half. The score is that
                  share out of the total weight of the signals we could check, from 0 to 100.
                </p>
                <p className="mt-3 text-[15px] leading-relaxed text-neutral-600">
                  <span className={B}>Example:</span> the signals we could check carry 80 points. One red flag worth 20
                  and one caution worth 10 (counted as 5) make 25 out of 80: a score of 31, Low.
                </p>
                <p className="mt-3 text-[15px] leading-relaxed text-neutral-600">
                  When LinkedIn shows very little of a profile, the result is marked <span className={B}>Low confidence</span>{" "}
                  and never goes above Medium. The risk level and strongest signal show straight away; a free account
                  unlocks the full report.
                </p>
              </div>
              <div>
                <div className="flex h-4 overflow-hidden rounded-full" aria-hidden>
                  <span className="bg-emerald-500" style={{ width: "35%" }} />
                  <span className="bg-amber-500" style={{ width: "30%" }} />
                  <span className="bg-rose-500" style={{ width: "35%" }} />
                </div>
                <div className="mt-2 flex text-[12px] font-medium text-neutral-500 tabular-nums" aria-hidden>
                  <span style={{ width: "35%" }}>0</span><span style={{ width: "30%" }}>35</span><span>65 – 100</span>
                </div>
                <ul className="mt-5 grid grid-cols-3 gap-3 text-center">
                  <li className="rounded-2xl bg-emerald-50 p-4"><p className="text-sm font-semibold text-emerald-700">Low</p><p className="mt-0.5 text-xs text-emerald-700">0 to 34</p></li>
                  <li className="rounded-2xl bg-amber-50 p-4"><p className="text-sm font-semibold text-amber-800">Medium</p><p className="mt-0.5 text-xs text-amber-800">35 to 64</p></li>
                  <li className="rounded-2xl bg-rose-50 p-4"><p className="text-sm font-semibold text-rose-700">High</p><p className="mt-0.5 text-xs text-rose-700">65 or more</p></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Signal table */}
          <div className="mt-6 rounded-3xl border border-neutral-200 bg-white overflow-hidden">
            <div className="px-6 md:px-8 pt-6 md:pt-8 pb-4">
              <h3 className="text-xl font-semibold tracking-tight">The {SIGNAL_DEFS.length} signals and their weights</h3>
              <p className="mt-1 text-[15px] text-neutral-600">Heaviest first. "AI judgement" signals come from the AI check; the rest are fixed rules.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[14px] md:text-[15px]">
                <caption className="sr-only">Risk signals the checker looks at, why each matters and its weight</caption>
                <thead className="bg-neutral-50 text-neutral-500 text-[12px] uppercase tracking-[0.08em]">
                  <tr>
                    <th scope="col" className="px-6 md:px-8 py-3 font-semibold">Signal</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Why it matters</th>
                    <th scope="col" className="px-6 md:px-8 py-3 font-semibold text-right">Weight</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-neutral-600">
                  {SIGNAL_DEFS.map((d) => (
                    <tr key={d.key} className="align-top">
                      <th scope="row" className="px-6 md:px-8 py-4 font-semibold text-neutral-900 min-w-[12rem]">
                        {d.label}
                        {d.ai && <span className="ml-2 inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#2563EB] align-middle">AI judgement</span>}
                      </th>
                      <td className="px-4 py-4 leading-relaxed min-w-[16rem]">{d.why}</td>
                      <td className="px-6 md:px-8 py-4">
                        <div className="flex items-center justify-end gap-2.5">
                          <span className="hidden sm:block h-1.5 w-20 rounded-full bg-neutral-100" aria-hidden>
                            <span className="block h-full rounded-full bg-[#0a0a0a]" style={{ width: `${(d.weight / MAX_WEIGHT) * 100}%` }} />
                          </span>
                          <span className="w-6 text-right font-semibold tabular-nums text-neutral-900">{d.weight}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="px-6 md:px-8 py-5 text-[14px] leading-relaxed text-neutral-600 border-t border-neutral-100 bg-neutral-50/60">
              No single signal decides the result. Plenty of real people have no photo, skip the About section or rarely post.
              LinkedIn's own page on <Ext href={URLS.reportFakeProfiles}>reporting fake profiles</Ext> makes the same point: not
              every incomplete profile is fake. The result is an estimate from public risk signals, not a verdict on the person.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Manual checklist */}
      <section className="px-5 md:px-8 py-16 md:py-24 bg-[#F7F7F5]" aria-labelledby="how-to-spot">
        <div className="max-w-6xl mx-auto">
          <SectionHead
            id="how-to-spot" eyebrow="Manual checklist" title="How to spot a fake LinkedIn profile: 12 signs"
            lead="You don't need a tool for a first look. These are 12 signs a LinkedIn profile is fake, or at least worth a closer look. One sign on its own means little; three or four together are worth taking seriously."
          />
          <ol className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SIGNS.map(({ Icon, title, text }, i) => (
              <li key={title} className="rounded-2xl bg-white border border-neutral-200 p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-800"><Icon className="h-5 w-5" aria-hidden /></span>
                  <span className="text-[12px] font-semibold text-neutral-500 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <h3 className="mt-4 text-[16px] font-semibold tracking-tight text-neutral-900">{title}</h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-neutral-600">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 3. Scams */}
      <section className="px-5 md:px-8 py-16 md:py-24" aria-labelledby="scam-profiles">
        <div className="max-w-6xl mx-auto">
          <SectionHead
            id="scam-profiles" eyebrow="Know the patterns" title="LinkedIn scam profiles: common scams that use fake accounts"
            lead="LinkedIn removes a large number of fake accounts. Most are caught early, but some still reach inboxes, and they tend to run one of a few familiar scams."
          />

          <div className="mt-10 rounded-3xl bg-[#1A1A2E] text-white p-6 md:p-8">
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[hsl(var(--aeline-lime))]">LinkedIn Community Report · July to December 2025</p>
            <dl className="mt-5 grid gap-6 sm:grid-cols-3">
              <div><dt className="text-sm text-white/70">Fake accounts stopped at registration</dt><dd className="mt-1 text-4xl md:text-5xl font-semibold tracking-tight">88.9M</dd></div>
              <div><dt className="text-sm text-white/70">Restricted before any member reported them</dt><dd className="mt-1 text-4xl md:text-5xl font-semibold tracking-tight">24.4M</dd></div>
              <div><dt className="text-sm text-white/70">Restricted after member reports</dt><dd className="mt-1 text-4xl md:text-5xl font-semibold tracking-tight">361.3K</dd></div>
            </dl>
            <p className="mt-5 text-[13px] text-white/60">
              Source:{" "}
              <a href={URLS.communityReport} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 text-white/80 hover:text-white">LinkedIn Community Report</a>
            </p>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {SCAMS.map(({ Icon, tone, title, text }) => (
              <article key={title} className="rounded-3xl border border-neutral-200 bg-white p-6 md:p-7">
                <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tone}`}><Icon className="h-5 w-5" aria-hidden /></span>
                <h3 className="mt-4 text-lg font-semibold tracking-tight">{title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-neutral-600">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 4. What to do */}
      <section className="px-5 md:px-8 py-16 md:py-24 bg-[#F7F7F5]" aria-labelledby="what-to-do">
        <div className="max-w-6xl mx-auto">
          <SectionHead
            id="what-to-do" eyebrow="If something feels off" title="Is this LinkedIn profile real? What to do if you think it's fake"
            lead="Slow down. Nothing a stranger sends you on LinkedIn needs an answer today. Work through these steps."
          />
          <div className="mt-10 grid gap-6 lg:grid-cols-[1.25fr_1fr] lg:items-start">
            <ol className="relative space-y-3">
              {TODO.map(({ title, text }, i) => (
                <li key={title} className="flex gap-4 rounded-2xl bg-white border border-neutral-200 p-5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0a0a0a] text-[13px] font-semibold text-white tabular-nums">{i + 1}</span>
                  <div>
                    <h3 className="text-[16px] font-semibold tracking-tight text-neutral-900">{title}</h3>
                    <p className="mt-1 text-[14px] leading-relaxed text-neutral-600">{text}</p>
                  </div>
                </li>
              ))}
            </ol>

            <aside className="lg:sticky lg:top-24 rounded-3xl bg-white border border-neutral-200 p-6 md:p-7 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.25)]" aria-labelledby="how-to-report">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600"><Flag className="h-5 w-5" aria-hidden /></span>
              <h3 id="how-to-report" className="mt-4 text-xl font-semibold tracking-tight">How to report a profile on LinkedIn</h3>
              <p className="mt-1.5 text-[14px] text-neutral-600">
                From LinkedIn's help article on <Ext href={URLS.reportFakeProfiles}>reporting fake profiles</Ext>. Same steps in the app.
              </p>
              <ol className="mt-5 space-y-2.5 text-[14px] text-neutral-700">
                {[
                  <>Open the profile and click <span className={B}>More</span></>,
                  <>Click <span className={B}>Report / Block</span></>,
                  <>Choose to report the person or the entire account</>,
                  <>Pick <span className={B}>This person is impersonating someone</span> or <span className={B}>This account is not a real person</span></>,
                  <>Click <span className={B}>Submit report</span></>,
                ].map((step, i) => (
                  <li key={i} className="flex gap-3 rounded-xl bg-neutral-50 px-3.5 py-2.5">
                    <span className="font-semibold text-neutral-400 tabular-nums">{i + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-4 text-[13px] leading-relaxed text-neutral-500">
                LinkedIn says it doesn't tell the member who reported them, and acts when a profile breaks its policies.
              </p>
              <a href={URLS.reportFakeProfiles} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#2563EB] hover:underline">
                Open LinkedIn's help article <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            </aside>
          </div>
        </div>
      </section>

      {/* 5. Sales */}
      <section className="px-5 md:px-8 py-16 md:py-24" aria-labelledby="sales">
        <div className="max-w-6xl mx-auto relative overflow-hidden rounded-[32px] bg-[#1A1A2E] p-7 md:p-14">
          <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[hsl(var(--aeline-lime))]/20 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-[#3B82F6]/25 blur-3xl" aria-hidden />
          <div className="relative grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div>
              <SectionHead id="sales" eyebrow="For people who sell" title="Why fake LinkedIn profiles matter for sales" dark />
              <p className="mt-5 text-[16px] leading-relaxed text-white/75">
                Every connection request and follow-up sent to an account with no real person behind it is outreach that
                can never become a meeting. And a "buyer" who wants your proposal by Friday feels like a lead, which is the
                point. Before you spend a day on a proposal, spend two minutes on the profile.
              </p>
              <p className="mt-4 text-[16px] leading-relaxed text-white/75">
                The better fix is to start from people who are clearly real and clearly in the market. Our guide to{" "}
                <Link to="/blog/linkedin-buying-signals" className="underline underline-offset-2 text-white">LinkedIn buying signals</Link>{" "}
                covers which ones are worth chasing, and{" "}
                <Link to="/learn/what-is-intent-data" className="underline underline-offset-2 text-white">what intent data is</Link>{" "}
                explains why timing beats volume.
              </p>
            </div>
            <div className="rounded-3xl bg-white/[0.06] ring-1 ring-white/10 p-6 md:p-7">
              <p className="text-[17px] leading-relaxed text-white">
                Intentsly finds real people on LinkedIn who are publicly asking for the service you sell, so your outreach
                goes to someone with a reason to answer.
              </p>
              <Link to="/try-ai" onClick={() => track("fpc_tryai_click", { from: "guide" })} className="mt-6 inline-flex items-center gap-2 rounded-full bg-[hsl(var(--aeline-lime))] px-5 py-3 text-[15px] font-semibold text-[#0a0a0a] hover:brightness-95">
                See who's asking for what you sell <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

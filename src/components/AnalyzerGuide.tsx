// Long-form copy for /linkedin-profile-analyzer. Everything here describes what
// supabase/functions/analyze-linkedin-profile does, so check that function
// before changing a claim. The FAQ is also FAQPage JSON-LD (scripts/prerender.mjs).
import { Link } from "react-router-dom";

export const ANALYZER_TITLE = "Free LinkedIn Profile Analyzer & Checker — Instant AI Review | Intentsly";
export const ANALYZER_DESCRIPTION =
  "Free LinkedIn profile analyzer and checker. Paste your profile URL and get an AI review: a score out of 100, specific fixes and a rewritten headline.";

export const ANALYZER_FAQS = [
  { q: "Is this LinkedIn profile analyzer really free?", a: "Yes. There is no card and no trial. You create a free Intentsly account and the report appears there." },
  { q: "How long does the review take?", a: "About 45 seconds. The analyzer reads your public profile, then writes the score, the fixes and the rewrites." },
  { q: "Do I need to give you my LinkedIn password?", a: "Never. It only reads your public profile, the same version anyone sees when they open your link in an incognito window." },
  { q: "What will I actually get in the report?", a: "A score out of 100, sub-scores for your headline, About, banner and photo, and social proof, a rewritten headline and About hook, your top 3 issues with fixes, missing buyer keywords, missing trust signals and a checklist of quick wins." },
  { q: "Will you post or message from my account?", a: "No. The review is read-only. Nothing is posted, messaged or automated on your behalf." },
  { q: "Is the score an official LinkedIn score?", a: "No. LinkedIn does not issue it and it does not measure your reach. It is an AI's judgement of how well your profile sells what you told it you sell." },
];

const CHECKS = [
  ["Headline", "does the first line say who you help and with what, or is it only a job title?"],
  ["About section", "do the opening lines give a buyer a reason to keep reading?"],
  ["Banner and photo", "does the top of the profile back up what you sell?"],
  ["Social proof", "are there results, names or credentials a buyer can check?"],
  ["Buyer keywords", "the 5 to 8 terms people looking for your service would use that your profile never mentions."],
  ["Trust signals", "the 3 to 6 credibility markers a buyer would expect and cannot find."],
];

const MISTAKES = [
  ["The headline is a job title.", "“Founder at Acme Consulting” tells a buyer nothing. “I help seed-stage SaaS founders get their first 20 customers” tells them whether to keep reading."],
  ["The About section opens with a career history.", "“With over 15 years of experience” answers a question nobody asked. Open with the problem you solve and who has it."],
  ["The keywords are yours, not your buyer's.", "You call yourself a “growth partner”. Your buyer searches for “fractional CMO”. If their words are missing, you do not show up when they look."],
  ["Claims with nothing behind them.", "“Results-driven” is not proof. One named client, one specific outcome or one recommendation from a buyer does more."],
  ["No next step.", "A convinced reader still has to know what to do. Say what to message you about, or link the page you want them to see."],
];

const GUIDES = [
  { href: "/guides/linkedin-lead-generation-guide", label: "LinkedIn lead generation guide", why: "how to find buyers who are already asking" },
  { href: "/guides/write-linkedin-outreach-message", label: "how to write a LinkedIn outreach message that gets a reply", why: "what to send once your profile is ready for the visit it earns" },
  { href: "/guides/find-decision-makers-on-linkedin", label: "how to find decision makers on LinkedIn", why: "a six-step method for reaching the person who can say yes" },
];

const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 className="font-medium tracking-[-0.03em] leading-[1.1] text-[#0a0a0a] mt-14 mb-5" style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)" }}>
    {children}
  </h2>
);

export const AnalyzerGuide = () => (
  <section className="px-5 md:px-8 pb-20 bg-white">
    <div className="max-w-3xl mx-auto text-[16px] text-neutral-600 leading-relaxed">
      <H2>What the LinkedIn profile analyzer checks</H2>
      <p className="mb-5">
        This LinkedIn profile checker reads the public version of your profile and grades it against one sentence from you about
        what you sell. That second input matters. A headline that works for a recruiter can be wrong for a fractional CFO, so
        nothing is judged in the abstract. The review covers:
      </p>
      <ul className="list-disc pl-6 mb-5 space-y-2 marker:text-neutral-300">
        {CHECKS.map(([name, text]) => (
          <li key={name}>
            <strong className="font-semibold text-[#0a0a0a]">{name}:</strong> {text}
          </li>
        ))}
      </ul>
      <p className="mb-5">
        You also get your top 3 issues, each with why it costs you and the exact fix, a new headline of up to 220 characters, the
        first three lines of a rewritten About section, and 5 to 7 quick wins you can do today.
      </p>

      <H2>How the LinkedIn profile score works</H2>
      <p className="mb-5">
        You get one overall score from 0 to 100, plus four sub-scores: headline, About section, banner and photo, and social proof.
        An AI model gives these scores after reading your profile text and your description of what you sell.
      </p>
      <p className="mb-5">
        There is no fixed formula behind the number and no LinkedIn data. It does not measure your reach, your search ranking or
        your Social Selling Index. Because it is a judgement, two runs on the same profile can land a few points apart, so the
        diagnoses and fixes are worth more than the score itself.
      </p>
      <p className="mb-5">
        Two limits to know. The analyzer works from the text on your public page, so treat the banner and photo score as a rough
        guide. And if your public profile cannot be read, the review falls back to what you told it you sell, which makes it more
        general: check your public profile settings and run it again.
      </p>

      <H2>Common LinkedIn profile mistakes</H2>
      <p className="mb-5">These are the patterns a good profile review should flag. The examples are illustrative.</p>
      <ol className="list-decimal pl-6 mb-5 space-y-3 marker:text-neutral-400">
        {MISTAKES.map(([name, text]) => (
          <li key={name}>
            <strong className="font-semibold text-[#0a0a0a]">{name}</strong> {text}
          </li>
        ))}
      </ol>

      <H2>What to do after you fix your profile</H2>
      <p className="mb-3">A stronger profile converts the people who visit it. These guides cover how to get the right people there:</p>
      <ul className="list-disc pl-6 space-y-2 marker:text-neutral-300">
        {GUIDES.map((g) => (
          <li key={g.href}>
            <Link to={g.href} className="text-[#3B82F6] underline underline-offset-2">
              {g.label}
            </Link>
            : {g.why}
          </li>
        ))}
      </ul>
    </div>
  </section>
);

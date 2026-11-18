// Long-form guide rendered below the Fake LinkedIn Profile Checker. Static
// markup only (it is prerendered for search engines): no state, no effects.
// Every claim about LinkedIn links to the page it comes from.
//
// Wording rule: the sections about the checker talk about risk signals and
// never call a checked person fake or a scammer.

import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { SIGNAL_DEFS } from "../../../supabase/functions/_shared/fake-profile";

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

const H2 = "font-medium tracking-[-0.02em] text-2xl md:text-3xl mb-4";
const H3 = "font-medium tracking-[-0.01em] text-lg md:text-xl mt-8 mb-2";
const P = "text-[16px] md:text-[17px] leading-relaxed text-neutral-700 mt-4";
const LIST = "text-[16px] md:text-[17px] leading-relaxed text-neutral-700 mt-4 pl-5 space-y-2";
const A = "underline underline-offset-2 hover:text-neutral-900";

function Ext({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={A}>
      {children}
    </a>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section className="px-5 md:px-8 py-12" aria-labelledby={id}>
      <div className="max-w-3xl mx-auto">
        <h2 id={id} className={H2}>{title}</h2>
        {children}
      </div>
    </section>
  );
}

export default function FakeProfileGuide() {
  return (
    <div>
      {/* 1. How the checker works */}
      <Section id="how-it-works" title="How this LinkedIn profile checker works">
        <p className={P}>
          You paste a link to a personal LinkedIn profile. The checker reads the public version of that page, the one
          anyone can see without logging in, and looks for risk signals: gaps and patterns that often show up in
          made-up or throwaway accounts. It then shows you a risk level, the signals behind it and what each one means.
        </p>

        <h3 className={H3}>What we read, and what we don't</h3>
        <p className={P}>
          We fetch the public profile through a scraping service. We don't log in to LinkedIn, we don't use your
          account or anyone else's, and nothing is sent to the person you check. We only see what LinkedIn shows to a
          logged-out visitor, which is often less than you see when you are signed in.
        </p>

        <h3 className={H3}>Fixed rules first, then one AI judgement</h3>
        <p className={P}>
          Most signals come from fixed rules that work the same way every time. Is there a work history? Do the jobs
          have dates? How many connections does the profile show? Does the headline name a big company that never
          appears in the work history?
        </p>
        <p className={P}>
          A few things can't be judged by a simple rule, so an AI model reads the text once and gives a judgement on
          three of them: whether the career story hangs together, whether the About text reads like a template, and
          whether the headline leads with money bait such as investment returns or urgent hiring with no company
          named. When a profile photo is visible, a separate, cautious check looks at whether it may be a stock or AI
          image. That check can flag a likely one. It can never prove it.
        </p>

        <h3 className={H3}>Signals we can't see don't count</h3>
        <p className={P}>
          LinkedIn hides parts of many profiles from logged-out visitors. When a section isn't visible, we mark the
          signal "couldn't check" and leave it out of the score. A hidden section is not treated as a missing one, so a
          private profile is not marked down for being private.
        </p>

        <h3 className={H3}>How the score is worked out</h3>
        <p className={P}>
          Each signal has a weight. A red flag counts its full weight and a caution counts half. The score is the
          share of weight that came out as red flags or cautions, out of the total weight of the signals we could
          check, on a scale of 0 to 100.
        </p>
        <ul className={`${LIST} list-disc`}>
          <li><strong className="font-semibold text-neutral-900">Low</strong>: a score of 0 to 34.</li>
          <li><strong className="font-semibold text-neutral-900">Medium</strong>: 35 to 64.</li>
          <li><strong className="font-semibold text-neutral-900">High</strong>: 65 or more.</li>
        </ul>
        <p className={P}>
          A worked example: say the signals we could check carry 80 points of weight between them. One red flag is
          worth 20 points and one caution is worth 10, which counts as 5. That is 25 out of 80, a score of 31, so the
          risk level is Low.
        </p>
        <p className={P}>
          When LinkedIn shows very little of a profile to logged-out visitors, there isn't enough to go on. The result
          is then marked Low confidence and the risk level never goes above Medium, however many gaps we found.
        </p>
        <p className={P}>
          The risk level and the strongest signal show straight away. A free account unlocks the full report with
          every signal, what we saw and what to do about it.
        </p>

        <h3 className={H3}>The signals and their weights</h3>
        <p className={P}>
          These are all the signals the checker looks at, heaviest first. Signals marked "AI judgement" come from the
          AI check; the rest come from fixed rules.
        </p>
        <div className="mt-6 overflow-x-auto rounded-2xl border border-neutral-200">
          <table className="w-full text-left text-[14px] md:text-[15px]">
            <caption className="sr-only">Risk signals the checker looks at, why each matters and its weight</caption>
            <thead className="bg-neutral-50 text-neutral-900">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Signal</th>
                <th scope="col" className="px-4 py-3 font-semibold">Why it matters</th>
                <th scope="col" className="px-4 py-3 font-semibold text-right">Weight</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-neutral-700">
              {SIGNAL_DEFS.map((d) => (
                <tr key={d.key} className="align-top">
                  <th scope="row" className="px-4 py-3 font-medium text-neutral-900 min-w-[10rem]">
                    {d.label}
                    {d.ai && <span className="block text-xs font-normal text-neutral-500 mt-0.5">AI judgement</span>}
                  </th>
                  <td className="px-4 py-3 leading-relaxed">{d.why}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{d.weight}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={P}>
          No single signal decides the result. Plenty of real people have no photo, skip the About section or rarely
          post. LinkedIn's own help page on{" "}
          <Ext href={URLS.reportFakeProfiles}>reporting fake profiles</Ext> makes the same point: not every incomplete
          profile is fake, so look for other signs before you act. The result is an estimate from public risk
          signals, not a verdict on the person.
        </p>
      </Section>

      {/* 2. Manual checklist */}
      <Section id="how-to-spot" title="How to spot a fake LinkedIn profile: 12 signs">
        <p className={P}>
          You don't need a tool to do a first check. These are 12 signs a LinkedIn profile is fake, or at least worth
          a closer look. One sign on its own means little. Three or four together are worth taking seriously.
        </p>
        <ol className={`${LIST} list-decimal`}>
          <li>
            <strong className="font-semibold text-neutral-900">A stock or AI-generated photo.</strong> A face that
            looks too polished, a celebrity, or a picture you can find elsewhere under another name. LinkedIn{" "}
            <Ext href={URLS.reportFakeProfiles}>lists stock photos and heavily edited images</Ext> as warning signs.
          </li>
          <li>
            <strong className="font-semibold text-neutral-900">Very few connections but many endorsements.</strong>{" "}
            Endorsements usually come from a network. Dozens of them on an account with a handful of connections don't
            add up.
          </li>
          <li>
            <strong className="font-semibold text-neutral-900">Vague job titles at big brand names.</strong> "Manager
            at Google" or "Consultant at Deloitte" with no team, no dates and nothing that matches the rest of the
            history.
          </li>
          <li>
            <strong className="font-semibold text-neutral-900">No activity.</strong> No posts, comments or reactions,
            ever, on an account that is busy sending messages.
          </li>
          <li>
            <strong className="font-semibold text-neutral-900">Generic About text.</strong> A summary that could fit
            anyone ("passionate, results-driven professional") with nothing specific about the person's own work.
          </li>
          <li>
            <strong className="font-semibold text-neutral-900">Mismatched locations.</strong> A London address, a
            job in Singapore and a phone number from a third country, with no explanation.
          </li>
          <li>
            <strong className="font-semibold text-neutral-900">Education that doesn't fit the career.</strong> A
            degree that ends after the senior roles began, or a school that doesn't seem to exist.
          </li>
          <li>
            <strong className="font-semibold text-neutral-900">A name and photo that don't match.</strong> The name
            suggests one person, the face suggests someone else, or a reverse image search finds the photo under a
            different name.
          </li>
          <li>
            <strong className="font-semibold text-neutral-900">A recently created profile.</strong> LinkedIn added an{" "}
            <Ext href={URLS.aboutThisProfile}>"About this profile" panel</Ext> that shows when a profile was created and
            last updated. A long career on an account that is a few weeks old is odd.
          </li>
          <li>
            <strong className="font-semibold text-neutral-900">Only recruiter or "investment" talk.</strong> Every post
            and message is about a job that pays too well or a trading opportunity, and nothing else.
          </li>
          <li>
            <strong className="font-semibold text-neutral-900">A fast push to WhatsApp or Telegram.</strong> LinkedIn's{" "}
            <Ext href={URLS.recogniseScams}>scam guidance</Ext> names urgent requests to move to WhatsApp, Telegram or
            outside forms as a warning sign.
          </li>
          <li>
            <strong className="font-semibold text-neutral-900">Copy-paste messages.</strong> A message that isn't
            addressed to you, doesn't mention anything about you and could have gone to a thousand people. LinkedIn{" "}
            <Ext href={URLS.recogniseScams}>flags messages not addressed to you personally</Ext> too.
          </li>
        </ol>
      </Section>

      {/* 3. Scams */}
      <Section id="scam-profiles" title="LinkedIn scam profiles: common scams that use fake accounts">
        <p className={P}>
          LinkedIn removes a large number of fake accounts. Its{" "}
          <Ext href={URLS.communityReport}>Community Report</Ext> says that between July and December 2025 it stopped
          88.9 million fake accounts at registration and restricted another 24.4 million before any member reported
          them. It restricted a further 361.3 thousand after members reported them. Most are caught early, but some still reach
          people's inboxes. When they do, they tend to run one of a few familiar scams.
        </p>

        <h3 className={H3}>Fake recruiters and job offers</h3>
        <p className={P}>
          A "recruiter" offers high pay for little work, then asks for a fee, bank details or ID documents, or for you
          to buy equipment. LinkedIn's <Ext href={URLS.recogniseScams}>help page on scams</Ext> says legitimate
          companies should not ask for transfers, cheques, gift cards or wired money as part of applying. The US
          Federal Trade Commission's <Ext href={URLS.ftcJobScams}>job scams page</Ext> is blunter: honest employers
          will never ask you to pay to get a job, and none will send you a cheque to deposit and ask you to send part
          of the money on.
        </p>

        <h3 className={H3}>Crypto and investment scams</h3>
        <p className={P}>
          These often start as friendly networking. After a few messages the talk turns to a trading platform, a
          coin or a "mentor" with great returns. The FTC's page on{" "}
          <Ext href={URLS.ftcCrypto}>cryptocurrency and scams</Ext> says investment scams often start on social media,
          that scammers promise guaranteed returns, and that only scammers demand payment in cryptocurrency.
        </p>

        <h3 className={H3}>Fake buyers who want a proposal and a payment</h3>
        <p className={P}>
          This one targets people who sell. A "buyer" asks for a proposal, seems keen, then says you need to pay a
          small fee first: a supplier registration, a compliance check, a vendor portal. Once paid, the buyer is gone.
          It is a version of what LinkedIn calls{" "}
          <Ext href={URLS.recogniseScams}>advance fee fraud</Ext>, where a small fee is asked for up front. A real
          buyer pays you; you don't pay them to be considered.
        </p>

        <h3 className={H3}>Phishing links</h3>
        <p className={P}>
          A message links to a "document", a "job application" or a login page that looks like LinkedIn or Microsoft.
          The page collects your password or installs malware. The FTC's guide to{" "}
          <Ext href={URLS.ftcPhishing}>recognising phishing</Ext> describes messages that invent a problem with your
          account, ask you to confirm personal details or push you to click a link. LinkedIn's{" "}
          <Ext href={URLS.recogniseScams}>scam page</Ext> also says it will never ask for your password or access to
          your computer.
        </p>
      </Section>

      {/* 4. What to do */}
      <Section id="what-to-do" title="Is this LinkedIn profile real? What to do if you think it's fake">
        <p className={P}>
          If a profile or a message feels off, slow down. Nothing a stranger sends you on LinkedIn needs an answer
          today. Work through these steps.
        </p>
        <ol className={`${LIST} list-decimal`}>
          <li>
            <strong className="font-semibold text-neutral-900">Don't pay, don't click, don't send documents.</strong>{" "}
            Hold off on any link, payment, gift card or copy of your ID until you know who you are dealing with.
          </li>
          <li>
            <strong className="font-semibold text-neutral-900">Keep the conversation on LinkedIn.</strong> LinkedIn{" "}
            <Ext href={URLS.aboutThisProfile}>says it may warn you</Ext> about messages that ask you to move to another
            platform, because that can be a sign of a scam.
          </li>
          <li>
            <strong className="font-semibold text-neutral-900">Look at "About this profile".</strong> LinkedIn{" "}
            <Ext href={URLS.aboutThisProfile}>says this panel shows</Ext> when
            the profile was created and last updated, and whether the member has verified details such as a phone
            number or work email. Treat a verification as one point in the profile's favour, not proof of everything
            on it.
          </li>
          <li>
            <strong className="font-semibold text-neutral-900">Check the photo.</strong> Run it through a reverse
            image search. If it shows up under other names, that is a strong sign.
          </li>
          <li>
            <strong className="font-semibold text-neutral-900">Check the company yourself.</strong> Find the company's
            own website or phone number, not the one in the message, and ask whether the person works there. The{" "}
            <Ext href={URLS.ftcPhishing}>FTC gives the same advice</Ext> for any message that claims to come from a
            company.
          </li>
          <li>
            <strong className="font-semibold text-neutral-900">Run the profile through the checker above.</strong> It
            won't give you certainty, but it puts the public risk signals in one place in a few seconds.
          </li>
          <li>
            <strong className="font-semibold text-neutral-900">Report the profile.</strong> See the steps below.
          </li>
          <li>
            <strong className="font-semibold text-neutral-900">Report losses.</strong> If you have lost money or
            shared personal details, contact your bank and your local police. LinkedIn's{" "}
            <Ext href={URLS.recogniseScams}>scam page</Ext> also points to the FBI's Internet Crime Complaint Center
            and the FTC. In the US, the <Ext href={URLS.ftcJobScams}>FTC</Ext> takes job scam reports at
            ReportFraud.ftc.gov.
          </li>
        </ol>

        <h3 className={H3}>How to report a profile on LinkedIn</h3>
        <p className={P}>
          These steps come from LinkedIn's help article on{" "}
          <Ext href={URLS.reportFakeProfiles}>reporting fake profiles</Ext>. They are the same on the app, with taps
          instead of clicks.
        </p>
        <ol className={`${LIST} list-decimal`}>
          <li>Open the profile and click <strong className="font-semibold text-neutral-900">More</strong>.</li>
          <li>Click <strong className="font-semibold text-neutral-900">Report / Block</strong>.</li>
          <li>Choose the option to report the person or the entire account.</li>
          <li>
            Pick <strong className="font-semibold text-neutral-900">This person is impersonating someone</strong> or{" "}
            <strong className="font-semibold text-neutral-900">This account is not a real person</strong>.
          </li>
          <li>Click <strong className="font-semibold text-neutral-900">Submit report</strong>.</li>
        </ol>
        <p className={P}>
          LinkedIn says it doesn't tell the member who reported them, and that it acts when a profile breaks its
          policies. Reporting helps: LinkedIn's{" "}
          <Ext href={URLS.communityReport}>Community Report</Ext> counts the fake accounts it restricted after member
          reports separately from the ones it caught on its own.
        </p>
      </Section>

      {/* 5. Sales */}
      <Section id="sales" title="Why fake LinkedIn profiles matter for sales">
        <p className={P}>
          If you sell on LinkedIn, fake and low-quality profiles cost you time before they cost you money. Every
          connection request, follow-up and tailored message sent to an account with no real person behind it is
          outreach that can never turn into a meeting. A list built from job titles alone will contain some of these
          accounts, and you won't know which ones until they never reply.
        </p>
        <p className={P}>
          The fake buyer is the more direct risk. A message that says "we need your proposal by Friday" feels like a
          lead, and that is the point. Before you spend a day on a proposal, spend two minutes on the profile: check
          the risk signals above, confirm the company exists and that the person works there, and be wary of any
          request for a fee before a contract.
        </p>
        <p className={P}>
          The better fix is to start from people who are clearly real and clearly in the market. Someone who posts in
          public that they are looking for an agency or a tool, with a history of posts and a network behind them, is
          far less likely to be a throwaway account than a name pulled from a database. Our guide to{" "}
          <Link to="/blog/linkedin-buying-signals" className={A}>LinkedIn buying signals</Link> covers which signals
          are worth chasing, and{" "}
          <Link to="/learn/what-is-intent-data" className={A}>what intent data is</Link> explains why timing beats
          volume.
        </p>
        <p className={P}>
          That is what Intentsly is built for: it finds real people on LinkedIn who are publicly asking for the
          service you sell, so your outreach goes to someone with a reason to answer.{" "}
          <Link to="/try-ai" className={A}>Try it on your own offer</Link> and see who is asking right now.
        </p>
      </Section>
    </div>
  );
}

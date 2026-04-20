import intentslyIcon from "@/assets/intentsly-icon.png";
import massoftindLogo from "@/assets/logo-massoftind.png";
import logicmelonLogo from "@/assets/logo-logicmelon.png";
import ogIntentsly from "@/assets/og/case-study-intentsly.jpg";
import ogMassoftind from "@/assets/og/case-study-massoftind.png";
import ogLogicmelon from "@/assets/og/case-study-logicmelon.png";

export interface CaseStudyMetric {
  label: string;
  value: string;
}

export interface CaseStudy {
  slug: string;
  company: string;
  domain: string;
  website: string;
  industry: string;
  headline: string;
  subheadline: string;
  result: string;
  resultLabel: string;
  timeframe: string;
  meetings: number;
  challenge: string;
  solution: string;
  outcome: string;
  bgClass: string;
  accentText: string;
  accentBg: string;
  logo?: string;
  // SEO
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
  // Long-form content
  context: string[];
  approach: { title: string; body: string }[];
  results: CaseStudyMetric[];
  quote?: { text: string; author: string; role: string };
  takeaways: string[];
  publishedAt: string; // ISO date
}

export const caseStudies: CaseStudy[] = [
  {
    slug: "intentsly",
    company: "Intentsly",
    domain: "intentsly.com",
    website: "https://intentsly.com",
    industry: "AI Sales Platform",
    headline: "How we used our own platform to book 14 meetings in 2 weeks",
    subheadline:
      "Launching Intentsly with zero ad spend — only intent signals, AI SDR, and Conversational AI on LinkedIn.",
    result: "14",
    resultLabel: "meetings booked",
    timeframe: "2 weeks",
    meetings: 14,
    challenge:
      "Launching a new AI sales platform in a noisy market — competing against established outreach tools with massive budgets and existing brand awareness.",
    solution:
      "We deployed our own intent signals + AI SDR on LinkedIn. Targeted founders complaining about cold outreach burnout, ran conversational AI replies, and let the system book demos automatically.",
    outcome:
      "14 qualified demos in 14 days. Zero manual outreach. Reply rate 4× our previous cold campaigns. Most leads came from intent signals we caught in real-time.",
    bgClass: "bg-[#1A8FE3]",
    accentText: "text-[#1A8FE3]",
    accentBg: "bg-[#1A8FE3]/10",
    logo: intentslyIcon,
    metaTitle: "Intentsly Case Study — 14 LinkedIn meetings booked in 2 weeks | Intentsly",
    metaDescription:
      "How Intentsly used its own AI SDR + intent signals to book 14 qualified LinkedIn demos in 14 days — zero ad spend, zero manual outreach. Read the playbook.",
    ogImage: ogIntentsly,
    publishedAt: "2025-03-15",
    context: [
      "Intentsly launched into a saturated outbound market dominated by tools with massive ad budgets, established brand awareness, and inbound funnels we couldn't match.",
      "We had two weeks, no SDRs, no paid traffic, and one constraint: prove the platform works by using it on ourselves first.",
      "The bet: if intent signals + Conversational AI can book us demos at a rate cold email can't match, we have a product worth selling.",
    ],
    approach: [
      {
        title: "Surfaced live buyer-intent signals on LinkedIn",
        body: "We pointed our signal agents at founders, RevOps leaders, and SDR managers actively posting about cold-outreach fatigue, low reply rates, and SDR burnout — exactly the pain we solve.",
      },
      {
        title: "Personalized invites off the actual signal",
        body: "Every connection request opened with a reference to the lead's specific post — not a templated 'I noticed you' opener. Reply rate jumped 4× immediately.",
      },
      {
        title: "Conversational AI handled the back-and-forth",
        body: "Once a lead replied, our AI SDR took over — short, peer-to-peer messages, deepening the conversation rather than pivoting straight to a pitch. It booked demos directly into our calendar.",
      },
    ],
    results: [
      { label: "Qualified demos booked", value: "14" },
      { label: "Days to first meeting", value: "< 48h" },
      { label: "Reply rate vs. cold email", value: "4×" },
      { label: "Manual outreach hours", value: "0" },
    ],
    quote: {
      text: "We launched the platform on a Tuesday. Friday morning we had three demos on the calendar. By the end of week two we'd run out of available slots.",
      author: "The Intentsly team",
      role: "Founders",
    },
    takeaways: [
      "Buyer-intent signals beat list scraping — every time.",
      "Personalization at the signal level is the unlock for reply rate.",
      "Conversational AI removes the bottleneck between reply and booked meeting.",
    ],
  },
  {
    slug: "massoftind",
    company: "Massoftind",
    domain: "massoftind.com",
    website: "https://massoftind.com",
    industry: "Software Development Agency",
    headline: "A dev agency booked 3 qualified meetings in less than a week",
    subheadline:
      "How a boutique software agency replaced cold email and referrals with a predictable inbound channel — without hiring an SDR.",
    result: "3",
    resultLabel: "meetings booked",
    timeframe: "< 1 week",
    meetings: 3,
    challenge:
      "A boutique software agency tired of low-conversion cold email and unreliable referrals. They needed a predictable channel for inbound-quality conversations without hiring an SDR.",
    solution:
      "We set up a Conversational AI campaign targeting startup founders and CTOs actively posting about engineering bottlenecks. Each invite was personalized off the lead's actual signal.",
    outcome:
      "3 demo calls in their first 6 days live — all founders with active hiring or build-vs-buy posts. Two converted to scoping calls within the same week.",
    bgClass: "bg-[#0F172A]",
    accentText: "text-[#1A1A2E]",
    accentBg: "bg-[#EDEEFC]",
    logo: massoftindLogo,
    metaTitle: "Massoftind Case Study — Dev agency booked 3 meetings in 6 days | Intentsly",
    metaDescription:
      "How a boutique software dev agency used Intentsly's Conversational AI SDR to book 3 qualified founder/CTO meetings in under a week — no SDR, no ad spend.",
    ogImage: ogMassoftind,
    publishedAt: "2025-03-22",
    context: [
      "Massoftind is a boutique software development agency that historically grew through referrals and the occasional cold-email push — both unpredictable, both slow.",
      "They didn't want to hire a full-time SDR for a channel that might not work, and they didn't want to burn their domain reputation with another cold-email blast.",
      "They needed a way to land in front of founders and CTOs at the exact moment those leaders were thinking about a build-vs-buy or engineering hire.",
    ],
    approach: [
      {
        title: "Targeted engineering-pain signals",
        body: "We pointed a signal agent at founders and CTOs posting about hiring engineers, build-vs-buy decisions, technical debt, and shipping velocity — the moments when a dev agency becomes relevant.",
      },
      {
        title: "Conversational invites, not pitches",
        body: "First touch referenced the lead's exact post. No 'I help companies like yours' language. The opener felt like a peer reaching out, not a vendor.",
      },
      {
        title: "AI SDR booked the meetings",
        body: "The Conversational AI SDR handled the discovery phase, qualified intent, and dropped the calendar link only when the lead was warm — protecting the agency's reputation while compressing the sales cycle.",
      },
    ],
    results: [
      { label: "Meetings booked in week one", value: "3" },
      { label: "Conversion to scoping calls", value: "2 of 3" },
      { label: "Time to first meeting", value: "< 6 days" },
      { label: "SDRs hired", value: "0" },
    ],
    quote: {
      text: "We were skeptical because we'd been burned by outbound tools before. Three founder meetings in the first week — two of them moved into scoping calls — and the math worked.",
      author: "Massoftind",
      role: "Software Development Agency",
    },
    takeaways: [
      "Agencies don't need an SDR to run outbound — they need the right signal at the right moment.",
      "Founders respond when the message references something they actually said, not a generic problem.",
      "Conversational AI works particularly well for high-trust services like custom development.",
    ],
  },
  {
    slug: "logicmelon",
    company: "LogicMelon",
    domain: "logicmelon.com",
    website: "https://logicmelon.com",
    industry: "HR Tech / Recruitment Software",
    headline: "An enterprise recruitment platform booked a meeting in 2 days",
    subheadline:
      "How LogicMelon broke into a notoriously hard ICP — HR Directors and TA leaders at 500+ employee orgs — within 48 hours of going live.",
    result: "1",
    resultLabel: "meeting in 48h",
    timeframe: "2 days",
    meetings: 1,
    challenge:
      "Selling enterprise recruitment software requires reaching busy HR directors and TA leaders — a notoriously hard audience to break into via cold channels.",
    solution:
      "We launched a high-precision agent surfacing TA leaders engaging with hiring-pain content on LinkedIn. AI SDR opened with the lead's specific signal — not a generic pitch.",
    outcome:
      "First qualified meeting booked within 48 hours of going live, with an HR Director at a 500+ employee org. Pipeline started compounding from week one.",
    bgClass: "bg-[#C8FF00]",
    accentText: "text-[#1A1A2E]",
    accentBg: "bg-[#C8FF00]/30",
    logo: logicmelonLogo,
    metaTitle: "LogicMelon Case Study — Enterprise meeting booked in 48 hours | Intentsly",
    metaDescription:
      "How LogicMelon, an enterprise recruitment platform, booked an HR Director at a 500+ employee org within 48 hours using Intentsly's High-Precision agent and AI SDR.",
    ogImage: ogLogicmelon,
    publishedAt: "2025-04-02",
    context: [
      "LogicMelon sells ATS, CRM, and multi-poster software to recruitment agencies and in-house TA teams — a buyer notoriously protective of their inbox and skeptical of outbound.",
      "Traditional cold email rarely lands; LinkedIn InMails get ignored; events take quarters to convert.",
      "They needed a channel that put them in front of HR Directors at the exact moment those leaders were vocalizing hiring pain.",
    ],
    approach: [
      {
        title: "High-Precision mode on TA pain signals",
        body: "We launched a High-Precision signal agent watching TA leaders, HR Directors, and Heads of Talent at 500+ employee orgs engaging with hiring-bottleneck and time-to-hire content.",
      },
      {
        title: "Signal-led opener, not pitch-led",
        body: "The AI SDR's first message referenced the exact post the lead had engaged with — turning a cold connection request into a peer-to-peer continuation of a conversation already happening.",
      },
      {
        title: "Qualified before the calendar drop",
        body: "The Conversational AI verified org size, role, and active hiring intent before offering the meeting link — protecting LogicMelon's sales team from low-fit calls.",
      },
    ],
    results: [
      { label: "Time to first meeting", value: "48h" },
      { label: "Org size of first meeting", value: "500+ employees" },
      { label: "Lead role", value: "HR Director" },
      { label: "Pipeline trajectory", value: "Compounding from week 1" },
    ],
    quote: {
      text: "Forty-eight hours from launch to a meeting on the calendar with an HR Director at a 500-person org. That's the kind of speed we'd never seen from outbound.",
      author: "LogicMelon",
      role: "Recruitment Software",
    },
    takeaways: [
      "High-Precision mode is the difference between hitting the right buyer and hitting any buyer.",
      "Intent signals collapse the typical enterprise sales cycle from quarters to days for the first meeting.",
      "Qualifying before the calendar drop keeps sales teams focused on real opportunities.",
    ],
  },
];

export const totalMeetings = caseStudies.reduce((sum, c) => sum + c.meetings, 0);

export const getCaseStudyBySlug = (slug: string): CaseStudy | undefined =>
  caseStudies.find((c) => c.slug === slug);

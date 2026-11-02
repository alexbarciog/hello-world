// The free tools: routes, SEO copy and FAQs. Used by the pages and by the
// build-time prerender (titles, sitemap, FAQ JSON-LD), so they can't drift.
// Example phrasings are illustrative and labelled as such; nothing here is
// presented as a real post, person or statistic.

export interface Faq { q: string; a: string }

export interface FreeToolInfo {
  id: "hook_analyzer" | "cold_message_grader" | "buying_signal_finder" | "profile_analyzer";
  path: string;
  name: string;
  blurb: string;
  title: string;
  description: string;
  h1: string;
  promise: string;
  ogImage: string;
  faq: Faq[];
}

const NO_ACCOUNT = "No. It works without an account or a card. Leaving your email is optional.";

export const HOOK_ANALYZER: FreeToolInfo = {
  id: "hook_analyzer",
  path: "/linkedin-hook-analyzer",
  name: "LinkedIn Hook Analyzer",
  blurb: "Score your post's first line and get three stronger hooks.",
  title: "Free LinkedIn Hook Generator & Post Analyzer | Intentsly",
  description: "Paste a LinkedIn post to score its first line, check length and reading level, and get three rewritten hooks. Free, no signup.",
  h1: "LinkedIn hook generator and post analyzer",
  promise: "Paste your post. See how the first line scores, and get three stronger hooks to choose from.",
  ogImage: "/og/tools/linkedin-hook-analyzer.png",
  faq: [
    { q: "What is a LinkedIn hook?", a: "The first line or two of a post, which is all people see before “see more”. If the hook doesn't earn the click, the rest of the post doesn't get read." },
    { q: "How is the score worked out?", a: "An AI model rates how likely the first line is to make a busy B2B reader click “see more”: is it specific, is it about the reader, does it open a question they want answered. Length and reading level are calculated directly from your text." },
    { q: "Do I need an account?", a: NO_ACCOUNT },
    { q: "Do you keep my post?", a: "Your text is sent to an AI model to generate the result, and the answer is cached so the same text gets the same result. It isn't published or added to your LinkedIn." },
    { q: "How long should a LinkedIn hook be?", a: "Short enough to fit before the “see more” cut on a phone. Aim for one clear sentence; the tool shows your first line's word and character count." },
  ],
};

export const COLD_MESSAGE_GRADER: FreeToolInfo = {
  id: "cold_message_grader",
  path: "/cold-message-grader",
  name: "Cold Message Grader",
  blurb: "Grade a LinkedIn DM or cold email and get a shorter rewrite.",
  title: "Free Cold Message Grader for LinkedIn DMs & Cold Emails | Intentsly",
  description: "Paste a LinkedIn DM or cold email to get a score, the specific problems, and a rewrite in under five sentences. Free, no signup.",
  h1: "Cold message grader",
  promise: "Paste a LinkedIn DM or a cold email. Get a score, what's holding it back, and a rewrite in under five sentences.",
  ogImage: "/og/tools/cold-message-grader.png",
  faq: [
    { q: "What does the grader look for?", a: "Whether the message is specific to the reader, short, about their problem rather than your company, and ends with one easy ask." },
    { q: "Does it work for both LinkedIn and email?", a: "Yes. Paste either. For email, paste the body; add the subject line at the top if you want it considered." },
    { q: "Can I keep placeholders like {{first_name}}?", a: "Yes. The rewrite keeps them so you can paste it back into your outreach tool." },
    { q: "Do I need an account?", a: NO_ACCOUNT },
    { q: "Why under five sentences?", a: "Cold messages get skimmed. A short message with one clear ask is easier to answer than a long one." },
  ],
};

export const BUYING_SIGNAL_FINDER: FreeToolInfo = {
  id: "buying_signal_finder",
  path: "/buying-signals",
  name: "Buying Signal Finder",
  blurb: "See what people asking for your service look like on LinkedIn.",
  title: "Buying Signal Finder: Who's Asking for Your Service on LinkedIn | Intentsly",
  description: "Type a service and see how buyers phrase it on LinkedIn, the roles that post it, and how many matching signals Intentsly has seen recently. Free, no signup.",
  h1: "Buying signal finder",
  promise: "Type what you sell. See how people asking for it talk on LinkedIn, and which roles post it.",
  ogImage: "/og/tools/buying-signals.png",
  faq: [
    { q: "What is a buying signal?", a: "Something a person does in public that suggests they may need what you sell: asking for recommendations, describing the problem, engaging with a competitor's posts, or changing jobs." },
    { q: "Where does the signal count come from?", a: "From signals Intentsly found across its customers' agents in the last 30 days, counted without names or post text. We only show a count when there are at least 10 matches." },
    { q: "Are the example phrasings real posts?", a: "No. They are illustrative examples of how buyers tend to phrase it, so you can recognise the pattern and use the wording as search terms." },
    { q: "Do I need an account?", a: NO_ACCOUNT },
    { q: "How do I find the actual people?", a: "Search the phrasings on LinkedIn yourself, or try Intentsly, which watches LinkedIn for these signals and scores each person against your ideal customer." },
  ],
};

export const PROFILE_ANALYZER: Pick<FreeToolInfo, "id" | "path" | "name" | "blurb"> = {
  id: "profile_analyzer",
  path: "/linkedin-profile-analyzer",
  name: "LinkedIn Profile Analyzer",
  blurb: "An AI review of your profile, with specific fixes.",
};

export const ALL_TOOLS = [PROFILE_ANALYZER, HOOK_ANALYZER, BUYING_SIGNAL_FINDER, COLD_MESSAGE_GRADER];

export const TOOLS_INDEX = {
  path: "/tools",
  title: "Free LinkedIn & Outbound Tools | Intentsly",
  description: "Free tools for B2B outbound: a LinkedIn profile analyzer, hook generator, buying signal finder and cold message grader.",
};

export interface SignalService {
  slug: string;
  name: string;
  /** Matched against signal text to count recent signals. */
  terms: string[];
  /** Illustrative only. */
  phrasings: string[];
  roles: string[];
}

export const SIGNAL_SERVICES: SignalService[] = [
  {
    slug: "web-design", name: "web design", terms: ["web design", "website redesign", "new website", "web designer", "webflow"],
    phrasings: ["Can anyone recommend a web designer for a B2B site?", "Our website hasn't been touched in years, time for a redesign.", "Looking for a Webflow developer who understands SaaS.", "What did you wish you knew before redoing your website?", "We're rebranding next quarter and the site has to change too."],
    roles: ["Founder", "CEO", "Head of Marketing", "Marketing Director", "Brand Manager"],
  },
  {
    slug: "seo", name: "SEO", terms: ["seo", "organic traffic", "search rankings", "google rankings"],
    phrasings: ["Our organic traffic dropped this year, who do you trust for SEO?", "Is anyone actually getting results from an SEO agency?", "We rank for nothing that converts. Where would you start?", "Looking for someone to run an SEO audit for us.", "Should we hire SEO in-house or use an agency?"],
    roles: ["Head of Marketing", "Founder", "Growth Lead", "Content Lead", "CMO"],
  },
  {
    slug: "recruiting", name: "recruiting", terms: ["recruiter", "recruiting", "recruitment agency", "hiring help", "headhunter"],
    phrasings: ["We've been trying to hire a senior engineer for months, any recruiters you rate?", "Who's the best recruitment partner for early-stage startups?", "Our inbound applicants are all wrong for the role. Any advice?", "Thinking about using a headhunter for our first sales hire.", "How do you make hiring less of a full-time job for founders?"],
    roles: ["Founder", "CEO", "Head of People", "CTO", "HR Manager"],
  },
  {
    slug: "software-development", name: "software development", terms: ["software development", "development partner", "dev agency", "outsource development", "mvp"],
    phrasings: ["Looking for a dev partner to build our MVP, recommendations?", "Has anyone had a good experience outsourcing development?", "Our internal tool is held together with spreadsheets. Who builds this stuff?", "We need extra engineering capacity for two quarters.", "How do you vet a software agency before signing?"],
    roles: ["Founder", "CTO", "Head of Product", "COO", "VP Engineering"],
  },
  {
    slug: "content-marketing", name: "content marketing", terms: ["content marketing", "content writer", "ghostwriter", "content agency"],
    phrasings: ["Anyone know a B2B content writer who doesn't sound like AI?", "We need someone to run our blog and LinkedIn. Agency or freelancer?", "Looking for a ghostwriter for our CEO's LinkedIn.", "Our content gets no leads. What are we missing?", "Who's the best content agency for technical products?"],
    roles: ["Head of Marketing", "Founder", "CMO", "Content Manager", "CEO"],
  },
  {
    slug: "paid-ads", name: "paid ads", terms: ["google ads", "paid ads", "linkedin ads", "ppc", "ad agency"],
    phrasings: ["Our Google Ads spend keeps going up and leads aren't. Who can take a look?", "Anyone had real results from LinkedIn ads for B2B?", "Looking for a PPC specialist for a small budget.", "Is it worth moving our paid ads to an agency?", "Who do you trust to audit an ad account?"],
    roles: ["Head of Marketing", "Founder", "Growth Lead", "Performance Marketing Manager", "CMO"],
  },
  {
    slug: "bookkeeping", name: "bookkeeping and accounting", terms: ["bookkeeper", "bookkeeping", "accountant", "accounting firm"],
    phrasings: ["We've outgrown doing the books ourselves. Who do you use?", "Looking for an accountant who understands SaaS revenue.", "Any recommendations for a bookkeeper for a small agency?", "Tax season was a mess this year, time to get proper help.", "What should I ask before hiring an accounting firm?"],
    roles: ["Founder", "CEO", "COO", "Office Manager", "Finance Manager"],
  },
  {
    slug: "fractional-cfo", name: "fractional CFO services", terms: ["fractional cfo", "part-time cfo", "outsourced cfo", "financial model"],
    phrasings: ["We're raising next year and need a fractional CFO. Any recommendations?", "When did you know you needed a CFO?", "Looking for help building a proper financial model.", "Our cash forecasting is a guess. Who helps with this?", "Is a part-time CFO worth it at our stage?"],
    roles: ["Founder", "CEO", "COO", "Managing Director", "Head of Finance"],
  },
  {
    slug: "it-support", name: "managed IT support", terms: ["it support", "managed it", "msp", "it provider"],
    phrasings: ["Our IT provider takes days to reply. Who do you use?", "Looking for managed IT for a 30-person company.", "We've just had a security scare and need proper IT support.", "Anyone switched MSP recently? Was it worth it?", "Who handles IT when you're too small for an IT team?"],
    roles: ["COO", "Office Manager", "Founder", "Operations Manager", "Managing Director"],
  },
  {
    slug: "cybersecurity", name: "cybersecurity", terms: ["cybersecurity", "penetration test", "pen test", "soc 2", "iso 27001"],
    phrasings: ["A customer is asking for SOC 2. Where do we even start?", "Looking for someone to run a pen test on our product.", "Any recommendations for an ISO 27001 consultant?", "We need a security review before a big enterprise deal.", "Who helps small companies get security right?"],
    roles: ["CTO", "Founder", "Head of Engineering", "COO", "IT Manager"],
  },
  {
    slug: "video-production", name: "video production", terms: ["video production", "videographer", "explainer video", "product video"],
    phrasings: ["Looking for someone to make a product explainer video.", "Who's the best video production company for B2B?", "We want to turn customer stories into videos. Any recommendations?", "How much should a good product video cost?", "Need a videographer for our company event."],
    roles: ["Head of Marketing", "Brand Manager", "Founder", "Marketing Manager", "Content Lead"],
  },
  {
    slug: "sales-training", name: "sales training", terms: ["sales training", "sales coach", "sales coaching", "cold calling training"],
    phrasings: ["Our new reps are struggling. Any good sales coaches?", "Looking for cold calling training for a small team.", "Who's run a sales training that actually stuck?", "As a founder doing sales myself, who should I learn from?", "We need help with discovery calls. Recommendations?"],
    roles: ["Head of Sales", "VP Sales", "Founder", "Sales Manager", "CEO"],
  },
];

export const findService = (slug: string | undefined) => SIGNAL_SERVICES.find((s) => s.slug === slug);

export const servicePage = (s: SignalService) => ({
  path: `/buying-signals/${s.slug}`,
  title: `Buying Signals for ${s.name[0].toUpperCase()}${s.name.slice(1)}: Who's Asking on LinkedIn | Intentsly`,
  description: `How people asking for ${s.name} talk on LinkedIn: example phrasings, the roles that post them, and recent signal counts. Free, no signup.`,
  h1: `Who's asking for ${s.name} on LinkedIn`,
});

export const faqJsonLd = (faq: Faq[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
});

/** Every free-tool page, for the prerender and the sitemap. */
export const toolRoutes = (site: string) => [
  { path: TOOLS_INDEX.path, title: TOOLS_INDEX.title, description: TOOLS_INDEX.description, priority: "0.7", changefreq: "monthly" },
  ...[HOOK_ANALYZER, COLD_MESSAGE_GRADER, BUYING_SIGNAL_FINDER].map((t) => ({
    path: t.path, title: t.title, description: t.description, image: `${site}${t.ogImage}`,
    jsonLd: faqJsonLd(t.faq), priority: "0.8", changefreq: "monthly",
  })),
  ...SIGNAL_SERVICES.map((s) => ({
    ...servicePage(s), h1: undefined, image: `${site}${BUYING_SIGNAL_FINDER.ogImage}`,
    jsonLd: faqJsonLd(BUYING_SIGNAL_FINDER.faq), priority: "0.6", changefreq: "monthly",
  })),
];

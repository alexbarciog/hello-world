// FAQs for the Fake LinkedIn Profile Checker. Rendered on the page and used for
// the FAQPage JSON-LD, so answers are plain text. They describe risk signals
// and never call a checked person fake or a scammer.

import type { Faq } from "@/data/freeTools";

export const FAKE_PROFILE_FAQS: Faq[] = [
  {
    q: "Is the fake LinkedIn profile checker free?",
    a: "Yes. The risk level and the strongest signal show without an account. A free account unlocks the full report with every signal, what we saw and what to do about it. No card is needed.",
  },
  {
    q: "Does the person know I checked their profile?",
    a: "No. We only read the public version of the profile page through a scraping service. Nothing is sent to the person, and we don't log in to LinkedIn or use anyone's LinkedIn account to run the check.",
  },
  {
    q: "How accurate is it?",
    a: "It is an automated estimate from public risk signals, not a verdict. It can be wrong both ways: a real person with a sparse profile can show several gaps, and a carefully made-up account can look tidy. When LinkedIn hides most of a profile from logged-out visitors, the result is marked low confidence and never goes above Medium.",
  },
  {
    q: "Can it detect AI-generated profile photos?",
    a: "Only partly. When a photo is visible, the checker flags photos that look like stock or AI-generated images. It can't prove where a photo came from, so this signal carries little weight. A reverse image search is a useful second check.",
  },
  {
    q: "What should I do if I think a profile is fake?",
    a: "Don't send money, documents or passwords, and don't click links from the account. Keep the conversation on LinkedIn, check the company through its own website, then report the profile: click More on the profile, then Report / Block, and choose that the person is impersonating someone or that the account is not a real person. If you have lost money, contact your bank and your local police.",
  },
  {
    q: "Do I need an account?",
    a: "Not to see the risk level and the strongest signal. A free account unlocks the full report.",
  },
  {
    q: "Does it work for company pages?",
    a: "No. It checks personal profiles only, the links that start with linkedin.com/in/. Company pages, job posts and groups aren't supported.",
  },
  {
    q: "Why do some signals say \"couldn't check\"?",
    a: "LinkedIn hides parts of many profiles from logged-out visitors. When a section isn't visible we can't judge it, so we mark it \"couldn't check\" and leave it out of the score instead of counting it against the profile.",
  },
];

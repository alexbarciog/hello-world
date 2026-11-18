import { CONTACT_EMAIL } from "@/lib/billing";

/** Pricing questions. Also rendered as FAQPage JSON-LD by scripts/prerender.mjs. */
export const PRICING_FAQS = [
  {
    q: "Do unused credits roll over?",
    a: "No. Your credits reset to your plan amount at each renewal.",
  },
  {
    q: "What happens when I run out?",
    a: "Your agents pause until your plan renews, or you upgrade. When you upgrade, you get the difference in credits straight away.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes, from Settings, and you keep access until the end of the period you paid for.",
  },
  {
    q: "Is there a free trial?",
    a: "No, but you can see who's asking for your service for free at intentsly.com/try-ai, no signup needed.",
  },
  {
    q: "What happens if a payment fails?",
    a: "Your account becomes read-only: signals and LinkedIn outreach pause until the card is updated. One click on Reactivate takes you to billing, and everything resumes.",
  },
  {
    q: "Is there a sales call?",
    a: `No. Setup is self-serve and takes about 5 minutes. If you have questions, email ${CONTACT_EMAIL}.`,
  },
];

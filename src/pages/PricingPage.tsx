import Navbar from "@/components/Navbar";
import Pricing from "@/components/Pricing";
import FAQ from "@/components/FAQ";
import { Footer } from "@/components/CTAFooter";
import { isOnboardingComplete } from "@/components/OnboardingGuard";
import { DemoVideo } from "@/components/billing/DemoVideo";
import { CONTACT_EMAIL, PLAN_PRICE_USD } from "@/lib/billing";

const PRICING_FAQ = [
  {
    q: "How does the free trial work?",
    a: `You get 7 days with everything switched on. We ask for a card up front; nothing is charged during the trial. The trial ends after 7 days or once Intentsly has delivered your first 20 signals, whichever comes first, and then your card is charged $${PLAN_PRICE_USD}/month.`,
  },
  {
    q: "Can I cancel?",
    a: "Yes, in one click from Settings → Billing, at any time. Cancel during the trial and you are never charged.",
  },
  {
    q: "Do you offer refunds?",
    a: "No. The 7-day trial is the refund window: try everything first, and cancel before it ends if Intentsly isn't for you.",
  },
  {
    q: "What is the founding deal?",
    a: `The first 10 paying customers keep $${PLAN_PRICE_USD}/month for life, even if the price goes up later. You'll see a "Founding customer" badge in the app.`,
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

const PricingPage = () => {
  const showCampaigns = isOnboardingComplete();

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar showCampaigns={showCampaigns} forceDark />
      <div className="pt-20">
        <Pricing />

        <section className="px-6 pb-16 md:pb-24">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-medium tracking-tight text-center mb-6" style={{ color: "hsl(var(--aeline-dark))" }}>
              See it in 3 minutes
            </h2>
            <DemoVideo />
          </div>
        </section>

        <section className="px-6 pb-20 md:pb-28" aria-labelledby="pricing-faq">
          <div className="max-w-3xl mx-auto">
            <h2 id="pricing-faq" className="text-2xl md:text-3xl font-medium tracking-tight text-center mb-8" style={{ color: "hsl(var(--aeline-dark))" }}>
              Pricing questions
            </h2>
            <div className="divide-y divide-border rounded-2xl border border-border bg-white">
              {PRICING_FAQ.map((item) => (
                <details key={item.q} className="group px-5 py-4">
                  <summary className="cursor-pointer list-none flex items-center justify-between gap-4 text-[15px] font-medium" style={{ color: "hsl(var(--aeline-dark))" }}>
                    {item.q}
                    <span className="text-muted-foreground transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
        <FAQ />
      </div>
      <Footer />
    </div>
  );
};

export default PricingPage;

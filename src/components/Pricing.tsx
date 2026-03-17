import { Check } from "lucide-react";
import { ArrowUpRight } from "lucide-react";

const proFeatures = [
  "30+ Intent Signals",
  "2 LinkedIn senders",
  "Unlimited LinkedIn campaigns",
  "Unlimited Warm lead",
  "AI-powered outreach with smart lead scoring",
  "Email Waterfall Enrichment (+15 data providers)",
  "CRM & API integrations (HubSpot, Pipedrive...)",
  "Chat & email support",
];

const customFeatures = [
  "Everything in Pro",
  "More LinkedIn Accounts",
  "More Intent Signals",
  "Dedicated Customer Success Manager",
  "Deep & custom integrations",
];

const Pricing = () => {
  return (
    <section id="pricing" className="py-24 px-4 bg-background">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col items-center text-center mb-16">
          <span
            className="text-xs font-semibold uppercase tracking-widest mb-4 inline-block border rounded-full px-4 py-1.5"
            style={{
              color: "hsl(var(--goji-orange))",
              background: "hsl(var(--goji-orange) / 0.06)",
              borderColor: "hsl(var(--goji-orange) / 0.2)",
            }}
          >
            Pricing
          </span>
          <p className="text-sm font-medium text-goji-text-muted mb-3 mt-4">
            Simple pricing for all your needs
          </p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-goji-dark tracking-tight leading-tight">
            Warm Leads Found. Campaign Launched.
            <br />
            All in 10 Minutes
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Pro plan */}
          <div className="relative rounded-3xl border-2 overflow-hidden"
            style={{ borderColor: "hsl(var(--goji-orange))" }}>
            {/* Popular badge */}
            <div
              className="absolute top-0 left-0 right-0 text-center py-2 text-xs font-bold text-primary-foreground uppercase tracking-widest"
              style={{ background: "hsl(var(--goji-orange))" }}
            >
              Most Popular
            </div>
            <div className="pt-12 p-8">
              <h3 className="text-xl font-bold text-goji-dark mb-1">Pro</h3>
              <div className="flex items-end gap-1 mb-2">
                <span className="text-5xl font-black text-goji-dark">$99</span>
                <span className="text-goji-text-muted text-sm mb-2">/ month</span>
              </div>
              <p className="text-sm text-goji-text-muted mb-8 leading-relaxed">
                For B2B founders, SDRs and solo operators or teams of 2.
              </p>
              <a
                href="https://app.gojiberry.ai/registration"
                className="flex items-center justify-center gap-2 w-full text-sm font-semibold text-primary-foreground rounded-full py-3.5 mb-8 transition-all hover:opacity-90"
                style={{ background: "hsl(var(--goji-berry))" }}
              >
                Try Gojiberry for Free
                <ArrowUpRight className="w-4 h-4" />
              </a>
              <ul className="space-y-3">
                {proFeatures.map((feat, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-goji-dark">
                    <span
                      className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: "hsl(var(--goji-orange) / 0.12)" }}
                    >
                      <Check className="w-3 h-3 text-goji-orange" />
                    </span>
                    {feat}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Custom plan */}
          <div className="rounded-3xl border border-border bg-card overflow-hidden p-8 flex flex-col">
            <h3 className="text-xl font-bold text-goji-dark mb-1">Custom</h3>
            <p className="text-sm text-goji-text-muted mb-4 leading-relaxed">
              For small sales teams (5+) looking to scale their outreach with AI.
            </p>
            <div className="mb-2">
              <span className="text-3xl font-black text-goji-dark">Talk with us</span>
            </div>
            <a
              href="https://calendly.com/d/cvbb-bf6-fth"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full text-sm font-semibold text-goji-berry border-2 rounded-full py-3.5 mb-8 mt-4 transition-all hover:bg-goji-berry hover:text-primary-foreground"
              style={{ borderColor: "hsl(var(--goji-berry))" }}
            >
              Get Demo
              <ArrowUpRight className="w-4 h-4" />
            </a>
            <ul className="space-y-3 mt-auto">
              {customFeatures.map((feat, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-goji-dark">
                  <span
                    className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: "hsl(var(--goji-berry) / 0.1)" }}
                  >
                    <Check className="w-3 h-3 text-goji-berry" />
                  </span>
                  {feat}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;

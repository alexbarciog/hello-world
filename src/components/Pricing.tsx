import { Check } from "lucide-react";
import pricingGradientBg from "@/assets/pricing-gradient-bg.png";

const features = [
  "30+ Intent Signals",
  "2 LinkedIn senders",
  "Unlimited LinkedIn campaigns",
  "Unlimited Warm leads",
  "AI-powered smart lead scoring",
];

const Pricing = () => {
  return (
    <section id="pricing" className="py-20 md:py-32 px-6 md:px-10 bg-background">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-semibold text-foreground tracking-tight">Simple, transparent pricing</h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">Choose the plan that fits your needs. Start generating warm leads today with no hidden fees.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Left card — featured with gradient */}
          <div className="relative rounded-3xl bg-card overflow-hidden shadow-lg">
            {/* Top gradient background */}
            <div
              className="h-52 px-8 pt-8 flex flex-col justify-start relative overflow-hidden bg-cover bg-center"
              style={{ backgroundImage: `url(${pricingGradientBg})` }}
            >
              <h3 className="text-2xl font-semibold text-foreground">Plus</h3>
              <div className="flex items-baseline gap-2 mt-3">
                <span className="text-5xl font-bold text-foreground tracking-tight">$99</span>
                <span className="text-sm text-foreground/70">/month</span>
              </div>
              <div className="mt-4">
                <a
                  href="/register"
                  className="flex items-center justify-center w-full text-sm font-medium py-3.5 rounded-full bg-foreground text-background hover:bg-foreground/90 transition-colors"
                >
                  Get started
                </a>
              </div>
            </div>
            {/* Features */}
            <div className="px-8 pt-8 pb-8">
              <ul className="space-y-4">
                {features.map((feat, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-foreground">
                    <Check className="w-4 h-4 text-foreground/60 shrink-0" />
                    {feat}
                  </li>
                ))}
              </ul>
            </div>

            {/* Bottom link */}
            <div className="px-8 pb-8">
              <a href="/billing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Need higher limits?
              </a>
            </div>
          </div>

          {/* Right card — minimal/clean */}
          <div className="rounded-3xl overflow-hidden shadow-sm h-fit" style={{ background: "hsl(0 0% 96%)" }}>
            <div className="px-8 pt-8">
              <h3 className="text-2xl font-semibold text-foreground">Custom</h3>
              <p className="text-3xl font-light text-foreground tracking-tight mt-3">Contact us</p>
            </div>

            {/* CTA button */}
            <div className="px-8 mt-6 pb-8">
              <a
                href="/register"
                className="flex items-center justify-center w-full text-sm font-medium py-3.5 rounded-full bg-foreground text-background hover:bg-foreground/90 transition-colors"
              >
                Get started
              </a>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;

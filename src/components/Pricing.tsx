import { useState } from "react";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import pricingGradientBg from "@/assets/pricing-gradient-bg.png";
import { useSubscription } from "@/hooks/useSubscription";

const starterFeatures = [
  "LinkedIn Intent Signals",
  "LinkedIn Automated Outreach",
  "AI SDR Conversational Replies",
  "Unlimited Warm Leads",
  "2 LinkedIn senders",
];

const proFeatures = [
  "Everything in Starter",
  "Reddit Signal Monitoring",
  "X (Twitter) Signal Monitoring",
  "30+ Cross-platform Signals",
  "AI-powered smart lead scoring",
];

const STARTER_PRICE_ID = "price_1TIByxFsgTpFMX56JNwbw3TA";
const PRO_PRICE_ID = "price_1TCpq6FsgTpFMX56cX4ufXJo";

const Pricing = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const sub = useSubscription();

  const handleCheckout = async (priceId: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/register";
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          priceId,
          returnUrl: window.location.origin,
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error("Checkout error:", err);
      toast({
        title: "Checkout failed",
        description: err.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderButton = (priceId: string) => {
    if (sub.subscribed) {
      return (
        <div className="flex items-center justify-center w-full text-sm font-semibold py-3.5 rounded-full text-white" style={{ background: "hsl(142 71% 45%)" }}>
          <Check className="w-4 h-4 mr-2" />
          Active
        </div>
      );
    }
    return (
      <button
        onClick={() => handleCheckout(priceId)}
        disabled={loading}
        className="flex items-center justify-center w-full text-sm font-medium py-3.5 rounded-full bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-50"
      >
        {loading ? "Redirecting..." : "Get started"}
      </button>
    );
  };

  return (
    <section id="pricing" className="py-20 md:py-32 px-6 md:px-10 bg-background">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-normal text-foreground tracking-tight">Simple, transparent pricing</h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">Choose the plan that fits your needs. Start generating warm leads today with no hidden fees.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {/* Starter — $59/mo */}
          <div className="relative rounded-3xl bg-card overflow-hidden shadow-lg">
            <div
              className="h-52 px-8 pt-8 flex flex-col justify-start relative overflow-hidden bg-cover bg-center"
              style={{ backgroundImage: `url(${pricingGradientBg})` }}
            >
              <h3 className="text-2xl font-semibold text-foreground">Starter</h3>
              <div className="flex items-baseline gap-2 mt-3">
                <span className="text-5xl font-bold text-foreground tracking-tight">$59</span>
                <span className="text-sm text-foreground/70">/month</span>
              </div>
              <div className="mt-4">
                {renderButton(STARTER_PRICE_ID)}
              </div>
            </div>
            <div className="px-8 pt-8 pb-8">
              <ul className="space-y-4">
                {starterFeatures.map((feat, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-foreground">
                    <Check className="w-4 h-4 text-foreground/60 shrink-0" />
                    {feat}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Pro — $99/mo */}
          <div className="relative rounded-3xl bg-card overflow-hidden shadow-lg ring-2 ring-primary">
            <div className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-primary text-primary-foreground">
              Popular
            </div>
            <div
              className="h-52 px-8 pt-8 flex flex-col justify-start relative overflow-hidden bg-cover bg-center"
              style={{ backgroundImage: `url(${pricingGradientBg})` }}
            >
              <h3 className="text-2xl font-semibold text-foreground">Pro</h3>
              <div className="flex items-baseline gap-2 mt-3">
                <span className="text-5xl font-bold text-foreground tracking-tight">$99</span>
                <span className="text-sm text-foreground/70">/month</span>
              </div>
              <div className="mt-4">
                {renderButton(PRO_PRICE_ID)}
              </div>
            </div>
            <div className="px-8 pt-8 pb-8">
              <ul className="space-y-4">
                {proFeatures.map((feat, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-foreground">
                    <Check className="w-4 h-4 text-foreground/60 shrink-0" />
                    {feat}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Custom */}
          <div className="rounded-3xl overflow-hidden shadow-sm h-fit" style={{ background: "hsl(0 0% 96%)" }}>
            <div className="px-8 pt-8">
              <h3 className="text-2xl font-semibold text-foreground">Custom</h3>
              <p className="text-3xl font-light text-foreground tracking-tight mt-3">Contact us</p>
              <p className="text-sm text-muted-foreground mt-3">Tailored for teams with advanced needs and higher volume.</p>
            </div>
            <div className="px-8 mt-6">
              <a
                href="/register"
                className="flex items-center justify-center w-full text-sm font-medium py-3.5 rounded-full bg-foreground text-background hover:bg-foreground/90 transition-colors"
              >
                Get started
              </a>
            </div>
            <div className="px-8 pt-6 pb-8">
              <ul className="space-y-3">
                {["Everything in Pro", "Unlimited LinkedIn senders", "Dedicated account manager", "Custom integrations"].map((feat, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-foreground">
                    <Check className="w-4 h-4 text-foreground/60 shrink-0" />
                    {feat}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;

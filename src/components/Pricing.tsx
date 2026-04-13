import { useState, useEffect, useRef } from "react";
import { Check, ArrowUp, ArrowDown, ArrowUpRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { ttqInitiateCheckout, ttqAddToCart } from "@/lib/tiktok-pixel";

const STARTER_PRODUCT_ID = "prod_UGjR0WwP5rbgZX";
const PRO_PRODUCT_ID = "prod_UBCE3Xunx980Z6";

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

const useReveal = () => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.classList.add("revealed"); obs.disconnect(); }
    }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
};

const Pricing = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const sub = useSubscription();
  const ref = useReveal();

  const handleCheckout = async (priceId: string, planName: string = "Plan", planValue?: number) => {
    setLoading(true);
    ttqAddToCart(planName, planValue);
    ttqInitiateCheckout(planName, planValue);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/register"; return; }
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId, returnUrl: window.location.origin },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (err: any) {
      console.error("Checkout error:", err);
      toast({ title: "Checkout failed", description: err.message || "Something went wrong", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const activePlan = sub.subscribed
    ? sub.productId === STARTER_PRODUCT_ID ? "starter"
    : sub.productId === PRO_PRODUCT_ID ? "pro"
    : "other"
    : null;

  const renderButton = (plan: "starter" | "pro", priceId: string, planLabel = "Plan", planValue = 0) => {
    if (activePlan === plan) {
      return (
        <div className="flex items-center justify-center w-full text-sm font-semibold py-3.5 rounded-full text-white bg-green-500">
          <Check className="w-4 h-4 mr-2" /> Active
        </div>
      );
    }
    if (activePlan === "pro" && plan === "starter") {
      return (
        <button onClick={() => handleCheckout(priceId, planLabel, planValue)} disabled={loading}
          className="flex items-center justify-center w-full text-sm font-medium py-3.5 rounded-full border border-border text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50">
          <ArrowDown className="w-4 h-4 mr-2" /> {loading ? "Redirecting..." : "Downgrade"}
        </button>
      );
    }
    if (activePlan === "starter" && plan === "pro") {
      return (
        <button onClick={() => handleCheckout(priceId, planLabel, planValue)} disabled={loading}
          className="flex items-center justify-center w-full text-sm font-medium py-3.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
          <ArrowUp className="w-4 h-4 mr-2" /> {loading ? "Redirecting..." : "Upgrade"}
        </button>
      );
    }
    return (
      <button onClick={() => handleCheckout(priceId, planLabel, planValue)} disabled={loading}
        className="btn-cta w-full justify-center">
        {loading ? "Redirecting..." : "Get Started"}
        <ArrowUpRight className="w-4 h-4" />
      </button>
    );
  };

  return (
    <section id="pricing" className="py-20 md:py-32 px-6 bg-background">
      <div ref={ref} className="reveal-up max-w-5xl mx-auto">
        <span className="section-label mb-6 block">Pricing</span>

        <h2 className="text-4xl md:text-5xl font-medium tracking-tight leading-[1.1] mb-4" style={{ color: "hsl(var(--aeline-dark))" }}>
          Flexible Plans Built for Every Stage of Growth
        </h2>
        <p className="text-base text-muted-foreground max-w-2xl mb-14 leading-relaxed">
          Whether you're just starting or scaling enterprise-wide, we offer tailored solutions that grow with you.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Starter */}
          <div className="rounded-3xl bg-[#f5f5f5] p-8 flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold" style={{ color: "hsl(var(--aeline-dark))" }}>Starter Plan</h3>
              {activePlan === "starter" && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white bg-green-500">Your Plan</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-6">Perfect for small teams beginning to explore AI-powered outreach.</p>
            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-4xl font-bold" style={{ color: "hsl(var(--aeline-dark))" }}>$59</span>
              <span className="text-sm text-muted-foreground">/month</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {starterFeatures.map((feat, i) => (
                <li key={i} className="flex items-center gap-3 text-sm" style={{ color: "hsl(var(--aeline-dark))" }}>
                  <Check className="w-4 h-4 text-[#1A8FE3] shrink-0" /> {feat}
                </li>
              ))}
            </ul>
            {renderButton("starter", STARTER_PRICE_ID, "Starter", 59)}
          </div>

          {/* Pro — highlighted */}
          <div className="rounded-3xl bg-[#f5f5f5] p-8 flex flex-col ring-2 ring-[#C8FF00] relative">
            <div className="absolute -top-3 left-8 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#C8FF00]" style={{ color: "hsl(var(--aeline-dark))" }}>
              Popular
            </div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold" style={{ color: "hsl(var(--aeline-dark))" }}>Growth Plan</h3>
              {activePlan === "pro" && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white bg-green-500">Your Plan</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-6">Designed for growing companies ready to integrate AI into their operations.</p>
            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-4xl font-bold" style={{ color: "hsl(var(--aeline-dark))" }}>$99</span>
              <span className="text-sm text-muted-foreground">/month</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {proFeatures.map((feat, i) => (
                <li key={i} className="flex items-center gap-3 text-sm" style={{ color: "hsl(var(--aeline-dark))" }}>
                  <Check className="w-4 h-4 text-[#1A8FE3] shrink-0" /> {feat}
                </li>
              ))}
            </ul>
            {renderButton("pro", PRO_PRICE_ID, "Pro", 99)}
          </div>

          {/* Custom */}
          <div className="rounded-3xl bg-[#f5f5f5] p-8 flex flex-col">
            <h3 className="text-lg font-semibold mb-2" style={{ color: "hsl(var(--aeline-dark))" }}>Enterprise Plan</h3>
            <p className="text-sm text-muted-foreground mb-6">Custom-built for enterprises seeking full-scale transformation.</p>
            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-4xl font-bold" style={{ color: "hsl(var(--aeline-dark))" }}>Custom</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {["Everything in Pro", "Unlimited LinkedIn senders", "Dedicated account manager", "Custom integrations", "24/7 premium support"].map((feat, i) => (
                <li key={i} className="flex items-center gap-3 text-sm" style={{ color: "hsl(var(--aeline-dark))" }}>
                  <Check className="w-4 h-4 text-[#1A8FE3] shrink-0" /> {feat}
                </li>
              ))}
            </ul>
            <a href="/register" className="btn-outline-dark w-full justify-center">
              Get Started
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;

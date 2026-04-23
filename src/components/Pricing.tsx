import { useState, useEffect, useRef } from "react";
import { Check, ArrowUpRight, Lock, RotateCcw, Zap, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { ttqInitiateCheckout, ttqAddToCart } from "@/lib/tiktok-pixel";
import { CountUp } from "@/lib/motion";

const PRO_PRODUCT_ID = "prod_UBCE3Xunx980Z6";
const PRO_PRICE_ID = "price_1TCpq6FsgTpFMX56cX4ufXJo";

const features = [
  "LinkedIn intent discovery",
  "Buyer & company targeting workflows",
  "Signal-based prospect identification",
  "Fast setup, no sales call required",
  "Cancel anytime",
];

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

  const handleCheckout = async () => {
    setLoading(true);
    ttqAddToCart("Intentsly", 97);
    ttqInitiateCheckout("Intentsly", 97);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/register"; return; }
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: PRO_PRICE_ID, returnUrl: window.location.origin },
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

  const isActive = sub.subscribed && sub.productId === PRO_PRODUCT_ID;

  return (
    <section id="pricing" className="py-20 md:py-32 px-6 bg-background">
      <div ref={ref} className="reveal-up max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="section-label mb-6 block justify-center">Pricing</span>
          <h2 className="text-4xl md:text-5xl font-medium tracking-tight leading-[1.1] mb-4" style={{ color: "hsl(var(--aeline-dark))" }}>
            Simple pricing
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            One plan. Everything you need to find buyers showing intent on LinkedIn.
          </p>
        </div>

        {/* Scarcity bar */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200/70">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-orange-700">
              <CountUp to={12} /> teams started this week
            </span>
          </div>
        </div>

        <div className="max-w-md mx-auto">
          <div className="relative rounded-3xl bg-[#f5f5f5] p-8 md:p-10 flex flex-col">
            {/* Most popular ribbon */}
            {!isActive && (
              <div className="absolute -top-3 right-6 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#C8FF00] text-[10px] font-bold uppercase tracking-wider shadow-[0_4px_12px_-2px_rgba(200,255,0,0.6)]" style={{ color: "hsl(var(--aeline-dark))" }}>
                <Star className="w-3 h-3 fill-current" />
                Most popular
              </div>
            )}

            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold" style={{ color: "hsl(var(--aeline-dark))" }}>Intentsly</h3>
              {isActive && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white bg-green-500">
                  Your Plan
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              For B2B teams that want better timing and sharper targeting.
            </p>

            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-5xl font-bold" style={{ color: "hsl(var(--aeline-dark))" }}>
                $<CountUp to={97} duration={1.2} />
              </span>
              <span className="text-sm text-muted-foreground">/month</span>
            </div>

            <ul className="space-y-3 mb-8">
              {features.map((feat, i) => (
                <li key={i} className="flex items-center gap-3 text-sm" style={{ color: "hsl(var(--aeline-dark))" }}>
                  <Check className="w-4 h-4 text-[#1A8FE3] shrink-0" /> {feat}
                </li>
              ))}
            </ul>

            {isActive ? (
              <div className="flex items-center justify-center w-full text-sm font-semibold py-3.5 rounded-full text-white bg-green-500">
                <Check className="w-4 h-4 mr-2" /> Active
              </div>
            ) : (
              <button onClick={handleCheckout} disabled={loading} className="btn-cta btn-shimmer w-full justify-center">
                {loading ? "Redirecting..." : "Start for $97"}
                <ArrowUpRight className="w-4 h-4" />
              </button>
            )}

            {/* Trust row */}
            <div className="flex items-center justify-center gap-4 mt-5 pt-5 border-t border-border/50">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Lock className="w-3 h-3" />
                Secure checkout
              </div>
              <span className="text-muted-foreground/30">·</span>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <RotateCcw className="w-3 h-3" />
                Cancel anytime
              </div>
              <span className="text-muted-foreground/30">·</span>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Zap className="w-3 h-3" />
                Live in 5 min
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground text-center mt-6 leading-relaxed">
            A simple monthly subscription. Cancel anytime — no contract, no sales call required.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Pricing;

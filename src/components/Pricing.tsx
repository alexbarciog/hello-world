import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, ArrowUpRight, Lock, RotateCcw, Zap, Star, Mail } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { useFoundingSlotsLeft } from "@/hooks/useFoundingSlotsLeft";
import { ttqInitiateCheckout, ttqAddToCart } from "@/lib/tiktok-pixel";
import { CONTACT_EMAIL, PLAN_PRICE_USD, SETUP_PRICE_USD, openBillingPortal, startCheckout } from "@/lib/billing";
import { Button } from "@/components/ui/button";

// Only facts confirmed in content-machine/brain/wiki/product.md and proof.md.
const features = [
  "LinkedIn buying signals: competitor and industry post engagement, keyword posts, competitor followers",
  "Every prospect scored against your ideal customer",
  "Verified emails and export",
  "AI SDR: connection requests and LinkedIn conversations that send your calendar link",
  "Up to 2 LinkedIn accounts, with safe daily limits",
  "HubSpot, Cal.com and Google Calendar",
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
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const sub = useSubscription();
  const foundingLeft = useFoundingSlotsLeft();
  const ref = useReveal();

  const isActive = sub.status === "active" || sub.status === "trialing" || (sub.access === "legacy" && sub.subscribed);

  const handleCheckout = async () => {
    setLoading(true);
    ttqAddToCart("Intentsly", PLAN_PRICE_USD);
    ttqInitiateCheckout("Intentsly", PLAN_PRICE_USD);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/register");
      return;
    }
    const result = await startCheckout();
    if (!result.ok) toast.error(result.message);
    setLoading(false);
  };

  const handleManage = async () => {
    setLoading(true);
    const result = await openBillingPortal();
    if (!result.ok) toast.error(result.message);
    setLoading(false);
  };

  return (
    <section id="pricing" className="py-20 md:py-32 px-6 bg-background">
      <div ref={ref} className="reveal-up max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="section-label mb-6 block justify-center">Pricing</span>
          <h2 className="text-4xl md:text-5xl font-medium tracking-tight leading-[1.1] mb-4" style={{ color: "hsl(var(--aeline-dark))" }}>
            One plan. Try it free for 7 days.
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            Everything Intentsly does, for ${PLAN_PRICE_USD}/month. Card required, cancel in one click.
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <div className="relative rounded-3xl bg-[#f5f5f5] p-6 md:p-10 flex flex-col">
            {!isActive && foundingLeft !== null && foundingLeft > 0 && (
              <div className="absolute -top-2.5 right-4 md:-top-3 md:right-6 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#C8FF00] text-[10px] font-bold uppercase tracking-wider shadow-[0_4px_12px_-2px_rgba(200,255,0,0.6)]" style={{ color: "hsl(var(--aeline-dark))" }}>
                <Star className="w-3 h-3 fill-current" />
                {foundingLeft} founding spot{foundingLeft === 1 ? "" : "s"} left
              </div>
            )}

            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold" style={{ color: "hsl(var(--aeline-dark))" }}>Intentsly</h3>
              {isActive && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white bg-green-500">
                  {sub.status === "trialing" ? "Your trial" : "Your plan"}
                </span>
              )}
              {sub.founding && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#C8FF00]" style={{ color: "hsl(var(--aeline-dark))" }}>
                  Founding customer
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Find the people on LinkedIn who are already looking for what you sell, and start the conversation.
            </p>

            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-5xl font-bold" style={{ color: "hsl(var(--aeline-dark))" }}>${PLAN_PRICE_USD}</span>
              <span className="text-sm text-muted-foreground">/month</span>
            </div>
            <p className="text-[13px] text-muted-foreground mb-8">
              7-day free trial, card required, cancel in one click.
            </p>

            <ul className="space-y-3 mb-8">
              {features.map((feat) => (
                <li key={feat} className="flex items-start gap-3 text-sm" style={{ color: "hsl(var(--aeline-dark))" }}>
                  <Check className="w-4 h-4 text-[#1A8FE3] shrink-0 mt-0.5" /> {feat}
                </li>
              ))}
            </ul>

            {isActive ? (
              <Button onClick={handleManage} disabled={loading || !sub.isBillingOwner} variant="outline" className="w-full justify-center rounded-full py-3.5">
                {loading ? "Opening…" : sub.isBillingOwner ? "Manage billing" : "Managed by your workspace owner"}
              </Button>
            ) : (
              <Button onClick={handleCheckout} disabled={loading} className="btn-cta btn-shimmer w-full justify-center">
                {loading ? "Redirecting…" : sub.hadSubscription ? `Subscribe for $${PLAN_PRICE_USD}/month` : "Start your 7-day free trial"}
                <ArrowUpRight className="w-4 h-4" />
              </Button>
            )}

            {foundingLeft !== null && foundingLeft > 0 && (
              <p className="mt-4 text-[12.5px] leading-relaxed text-center" style={{ color: "hsl(var(--aeline-dark))" }}>
                <strong>Founding deal:</strong> the first 10 paying customers keep ${PLAN_PRICE_USD}/month for life, even if the price goes up.
              </p>
            )}

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-center sm:gap-4 mt-5 pt-5 border-t border-border/50">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Lock className="w-3 h-3" />
                Secure checkout by Stripe
              </div>
              <span className="hidden sm:inline text-muted-foreground/30">·</span>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <RotateCcw className="w-3 h-3" />
                Cancel in one click
              </div>
              <span className="hidden sm:inline text-muted-foreground/30">·</span>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Zap className="w-3 h-3" />
                Live in 5 min
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground text-center mt-6 leading-relaxed">
            Want it set up for you?{" "}
            <Link to="/settings/setup" className="font-medium underline underline-offset-2" style={{ color: "hsl(var(--aeline-dark))" }}>
              Add the Done-for-you setup
            </Link>
            : a 30-minute call and a custom agent built by Alex, ${SETUP_PRICE_USD} one-time.
          </p>

          <p className="text-sm text-muted-foreground text-center mt-3 leading-relaxed inline-flex w-full items-center justify-center gap-1.5">
            <Mail className="w-4 h-4" />
            Questions? Email{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium underline underline-offset-2" style={{ color: "hsl(var(--aeline-dark))" }}>
              {CONTACT_EMAIL}
            </a>
            , I answer within a day.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Pricing;

import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Lock, Mail, RotateCcw, Sparkles } from "lucide-react";
import { PlanPicker } from "@/components/billing/PlanPicker";
import { CreditCostTable } from "@/components/billing/CreditCostTable";
import { CONTACT_EMAIL, SETUP_PRICE_USD } from "@/lib/billing";
import { isPlanKey } from "@/lib/plans";

const DARK = "hsl(var(--aeline-dark))";

const useReveal = () => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.classList.add("revealed"); obs.disconnect(); }
    }, { threshold: 0.05 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
};

/** Plans, "How credits work" and the contact lines. Used on /pricing and in-app /billing. */
const Pricing = ({ selected, source = "pricing" }: { selected?: string | null; source?: string }) => {
  const ref = useReveal();

  return (
    <section id="pricing" className="py-16 md:py-28 px-4 sm:px-6 bg-background">
      <div ref={ref} className="reveal-up max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-14">
          <span className="section-label mb-6 block justify-center">Pricing</span>
          <h2 className="text-[32px] sm:text-4xl md:text-5xl font-medium tracking-tight leading-[1.1] mb-4" style={{ color: DARK }}>
            Pay for the leads you see and the messages that go out.
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            Every plan comes with a monthly pot of credits. Pick the one that fits how many people you want to reach. Cancel anytime.
          </p>
        </div>

        <PlanPicker variant="page" selected={isPlanKey(selected) ? selected : null} source={source} />

        <div className="mt-6 flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-4 text-[12px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> Secure checkout by Creem</span>
          <span className="hidden sm:inline text-muted-foreground/30">·</span>
          <span className="inline-flex items-center gap-1.5"><RotateCcw className="w-3.5 h-3.5" /> Cancel anytime</span>
        </div>

        <div className="mt-8 mx-auto max-w-xl rounded-2xl bg-[#F2F8FE] px-5 py-4 text-center text-sm leading-relaxed" style={{ color: DARK }}>
          <Sparkles className="inline w-4 h-4 mr-1.5 -mt-0.5 text-[#1A8FE3]" />
          Want to look first?{" "}
          <a href="/try-ai" className="font-semibold underline underline-offset-2">Try the free demo</a>
          {" "}and see who's asking for your service. No signup needed.
        </div>

        <div className="mt-16 md:mt-24 max-w-4xl mx-auto">
          <CreditCostTable />
        </div>

        <div className="mt-14 max-w-2xl mx-auto">
          <p className="text-sm text-muted-foreground text-center leading-relaxed">
            Want it set up for you?{" "}
            <Link to="/settings/setup" className="font-medium underline underline-offset-2" style={{ color: DARK }}>
              Add the Done-for-you setup
            </Link>
            : a 30-minute call and a custom agent built by Alex, ${SETUP_PRICE_USD} one-time.
          </p>

          <p className="text-sm text-muted-foreground text-center mt-3 leading-relaxed">
            <Mail className="inline w-4 h-4 mr-1.5 -mt-0.5" />
            Questions? Email{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium underline underline-offset-2" style={{ color: DARK }}>
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

import { PRICING_FAQS } from "@/lib/pricingFaq";

const DARK = "hsl(var(--aeline-dark))";

export function PricingFaq() {
  return (
    <section className="px-4 sm:px-6 pb-20 md:pb-28" aria-labelledby="pricing-faq">
      <div className="max-w-3xl mx-auto">
        <h2 id="pricing-faq" className="text-2xl md:text-3xl font-medium tracking-tight text-center mb-8" style={{ color: DARK }}>
          Pricing questions
        </h2>
        <div className="divide-y divide-border rounded-2xl border border-border bg-white">
          {PRICING_FAQS.map((item) => (
            <details key={item.q} className="group px-5 py-4">
              <summary className="cursor-pointer list-none flex items-center justify-between gap-4 text-[15px] font-medium" style={{ color: DARK }}>
                {item.q}
                <span className="text-muted-foreground transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                {item.q === "Is there a free trial?" ? (
                  <>
                    No, but you can see who's asking for your service for free at{" "}
                    <a href="/try-ai" className="font-medium underline underline-offset-2" style={{ color: DARK }}>/try-ai</a>, no signup needed.
                  </>
                ) : item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

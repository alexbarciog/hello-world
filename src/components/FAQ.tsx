import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "How is Gojiberry different from classic automation tools?",
    a: "Unlike traditional automation tools that spray and pray, Gojiberry uses AI to detect buying intent signals. We track when prospects engage with competitors, join relevant communities, get new roles, or raise funding — so you only reach out to people who are already in the market for your solution.",
  },
  {
    q: "Is this for sales teams, agencies or founders?",
    a: "Gojiberry is built for B2B founders, SDRs, solo sales operators, and small sales teams. If you're doing outbound on LinkedIn and want to reach only the warmest prospects, this is for you.",
  },
  {
    q: "How does Gojiberry find high-intent leads?",
    a: "Our AI Agents monitor 30+ intent signals across LinkedIn, the web, and various data sources. We track actions like engaging with competitor content, joining industry groups, new role announcements, funding rounds, and more.",
  },
  {
    q: "How safe is it and does Gojiberry risk my LinkedIn account?",
    a: "We follow LinkedIn's usage limits and use safe, human-like sending patterns. Our system respects LinkedIn's terms of service and keeps your account activity within safe thresholds to minimize any risk.",
  },
  {
    q: "What kind of results can I realistically expect?",
    a: "Our users typically see 2-3x higher reply rates compared to cold outreach, because they're reaching people who already have buying intent. Some teams report booking 5 demos from just 30 leads found by their AI Agent.",
  },
];

const FAQ = () => {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 px-4" style={{ background: "hsl(var(--muted))" }}>
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col items-center text-center mb-16">
          <span
            className="text-xs font-semibold uppercase tracking-widest mb-4 inline-block border rounded-full px-4 py-1.5"
            style={{
              color: "hsl(var(--goji-orange))",
              background: "hsl(var(--goji-orange) / 0.06)",
              borderColor: "hsl(var(--goji-orange) / 0.2)",
            }}
          >
            FAQs
          </span>
          <p className="text-sm font-medium text-goji-text-muted mb-3 mt-4">
            Questions you might have
          </p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-goji-dark tracking-tight leading-tight">
            Questions?{" "}
            <span
              className="italic"
              style={{ color: "hsl(var(--goji-orange))" }}
            >
              We're Glad You Asked.
            </span>
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="bg-card rounded-2xl border border-border overflow-hidden transition-all"
            >
              <button
                className="w-full flex items-center justify-between px-6 py-5 text-left"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="font-semibold text-goji-dark text-sm pr-4">{faq.q}</span>
                <ChevronDown
                  className="w-5 h-5 text-goji-text-muted shrink-0 transition-transform duration-300"
                  style={{ transform: open === i ? "rotate(180deg)" : "rotate(0deg)" }}
                />
              </button>
              {open === i && (
                <div className="px-6 pb-5">
                  <p className="text-sm text-goji-text-muted leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;

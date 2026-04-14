import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { motion } from "framer-motion";

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

const faqs = [
  {
    q: "How is Intentsly different from classic automation tools?",
    a: "Unlike traditional automation tools that spray and pray, Intentsly uses AI to detect buying intent signals. We track when prospects engage with competitors, join relevant communities, get new roles, or raise funding — so you only reach out to people who are already in the market for your solution.",
  },
  {
    q: "Is this for sales teams, agencies or founders?",
    a: "Intentsly is built for B2B founders, SDRs, solo sales operators, and small sales teams. If you're doing outbound on LinkedIn and want to reach only the warmest prospects, this is for you.",
  },
  {
    q: "How does Intentsly find high-intent leads?",
    a: "Our AI Agents monitor 30+ intent signals across LinkedIn, the web, and various data sources. We track actions like engaging with competitor content, joining industry groups, new role announcements, funding rounds, and more.",
  },
  {
    q: "How safe is it and does Intentsly risk my LinkedIn account?",
    a: "We follow LinkedIn's usage limits and use safe, human-like sending patterns. Our system respects LinkedIn's terms of service and keeps your account activity within safe thresholds to minimize any risk.",
  },
  {
    q: "What kind of results can I realistically expect?",
    a: "Our users typically see 2-3x higher reply rates compared to cold outreach, because they're reaching people who already have buying intent. Some teams report booking 5 demos from just 30 leads found by their AI Agent.",
  },
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-20 md:py-32 px-6 md:px-10 bg-background">
      <div className="max-w-4xl mx-auto">
        {/* Header - centered */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center mb-14"
        >
          <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium">■ FAQ</span>
          <h2 className="text-4xl md:text-5xl font-medium mt-4 text-foreground tracking-tight">
            Frequently asked questions
          </h2>
          <p className="text-base text-muted-foreground mt-4 max-w-xl mx-auto leading-relaxed">
            Everything you need to know about our intent-driven AI outreach — from strategy to implementation.
          </p>
        </motion.div>

        {/* Accordion items - card style */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="space-y-4"
        >
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              variants={staggerItem}
              className="rounded-2xl bg-secondary/50 overflow-hidden"
            >
              <button
                className="w-full flex items-center justify-between p-6 md:p-7 text-left"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
              >
                <span className="font-medium text-lg md:text-xl pr-8 text-foreground">{faq.q}</span>
                <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center flex-shrink-0">
                  {openIndex === i ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
              </button>
              <div className={`overflow-hidden transition-all duration-300 ${openIndex === i ? "max-h-60 pb-6 px-6 md:px-7" : "max-h-0"}`}>
                <p className="text-base text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FAQ;

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { motion } from "framer-motion";

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
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
    <section id="faq" className="py-20 md:py-32 px-6 md:px-10">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium">FAQs</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-4 text-foreground">
              Got a question? We've got the answer
            </h2>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="space-y-0"
          >
            {faqs.map((faq, i) => (
              <motion.div key={i} variants={staggerItem} className="border-t border-foreground/10">
                <button
                  className="w-full flex items-center justify-between py-6 text-left"
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                >
                  <span className="font-medium text-sm md:text-base pr-8 text-foreground">{faq.q}</span>
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    {openIndex === i ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </div>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openIndex === i ? "max-h-40 pb-6" : "max-h-0"}`}>
                  <p className="text-sm text-muted-foreground">{faq.a}</p>
                </div>
              </motion.div>
            ))}
            <div className="border-t border-foreground/10" />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;

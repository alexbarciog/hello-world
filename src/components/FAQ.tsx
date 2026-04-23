import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Minus, ArrowRight, Calendar } from "lucide-react";
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
    q: "What does Intentsly actually do?",
    a: "Intentsly helps B2B companies identify people and companies on LinkedIn showing signals that may indicate buying intent — so teams can prioritize better opportunities instead of working static lists.",
  },
  {
    q: "Is this just another lead database?",
    a: "No. Intentsly is built around intent signals and timing, not just static contact data or generic lead lists. The goal is to find buyers who are showing movement right now.",
  },
  {
    q: "Who is Intentsly best for?",
    a: "B2B SaaS companies, lead-gen agencies, sales teams, founders, and B2B service businesses that want a better way to find likely buyers on LinkedIn.",
  },
  {
    q: "Do I need a large outbound team to use it?",
    a: "No. Intentsly is designed to help lean teams focus faster, not create more complexity. It works well for solo founders, SDRs, and small sales teams.",
  },
  {
    q: "Does this replace my CRM or sales tools?",
    a: "No. Intentsly improves targeting and prioritization. It fits alongside your existing CRM and sales workflow rather than replacing it.",
  },
  {
    q: "How quickly can I get value?",
    a: "Most users start identifying relevant opportunities shortly after setup. The onboarding is designed to get you to your first list of intent-based prospects fast.",
  },
  {
    q: "Is there a contract?",
    a: "No. It's a monthly subscription. Cancel anytime.",
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
            Everything you need to know about finding intent-driven buyers on LinkedIn.
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

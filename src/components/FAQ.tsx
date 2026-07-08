import { useState } from "react";
import { Plus, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;

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
    <section id="faq" className="py-14 md:py-32 px-5 md:px-10 bg-background">
      <div className="max-w-4xl mx-auto">
        {/* Header - centered */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center mb-8 md:mb-14"
        >
          <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium">■ FAQ</span>
          <h2 className="text-[28px] md:text-5xl font-medium mt-3 md:mt-4 text-foreground tracking-tight leading-tight">
            Frequently asked questions
          </h2>
          <p className="text-[15px] md:text-base text-muted-foreground mt-3 md:mt-4 max-w-xl mx-auto leading-relaxed">
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
          {faqs.map((faq, i) => {
            const open = openIndex === i;
            return (
              <motion.div
                key={i}
                variants={staggerItem}
                whileHover={{ y: -3, transition: { type: "spring", stiffness: 300, damping: 20 } }}
                className={`rounded-2xl overflow-hidden transition-colors duration-300 ${open ? "bg-secondary shadow-[0_20px_50px_-20px_rgba(0,0,0,0.15)]" : "bg-secondary/50 hover:bg-secondary/70"}`}
              >
                <button
                  className="w-full flex items-center justify-between p-4 md:p-7 text-left gap-3"
                  onClick={() => setOpenIndex(open ? null : i)}
                >
                  <span className="font-medium text-[15px] md:text-xl text-foreground">{faq.q}</span>
                  <motion.div
                    animate={{ rotate: open ? 45 : 0, backgroundColor: open ? "#C8FF00" : "#ffffff" }}
                    transition={{ duration: 0.35, ease: EASE }}
                    className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  >
                    <Plus className="w-4 h-4 md:w-5 md:h-5" />
                  </motion.div>
                </button>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: EASE }}
                      className="overflow-hidden"
                    >
                      <motion.p
                        initial={{ y: -8 }}
                        animate={{ y: 0 }}
                        exit={{ y: -8 }}
                        transition={{ duration: 0.3 }}
                        className="text-[14px] md:text-base text-muted-foreground leading-relaxed pb-5 md:pb-6 px-4 md:px-7"
                      >
                        {faq.a}
                      </motion.p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Closing two-CTA card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mt-10 rounded-2xl p-7 md:p-9 text-center"
        >
          <p className="text-lg md:text-xl font-medium mb-2" style={{ color: "hsl(var(--aeline-dark))" }}>
            Still have questions?
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Either path works — pick what feels right.
          </p>
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-center gap-3">
            <a
              href="mailto:hello@intentsly.com?subject=10-min%20walkthrough"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border border-black/10 bg-white text-sm font-semibold hover:border-black/30 hover:shadow-[0_8px_24px_-12px_rgba(15,23,42,0.25)] transition-all w-full sm:w-auto"
              style={{ color: "hsl(var(--aeline-dark))" }}
            >
              <Calendar className="w-3.5 h-3.5" />
              Book a 10-min walkthrough
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQ;

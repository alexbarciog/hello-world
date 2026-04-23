import { motion } from "framer-motion";
import { Target, MessageSquareOff, Clock } from "lucide-react";

const pains = [
  {
    icon: Target,
    title: "Guesswork targeting",
    desc: "You know your market, but not who is actually in-market right now.",
  },
  {
    icon: MessageSquareOff,
    title: "Low-response outreach",
    desc: "Cold lists create weak timing, weak relevance, and wasted effort.",
  },
  {
    icon: Clock,
    title: "Missed buying windows",
    desc: "By the time intent is obvious, someone else may already be in the deal.",
  },
];

const ProblemSection = () => {
  return (
    <section id="problem" className="py-20 md:py-32 px-6 bg-background">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="max-w-3xl mb-14"
        >
          <span className="section-label mb-6 block">The problem</span>
          <h2 className="text-4xl md:text-5xl font-medium tracking-tight leading-[1.1] mb-6" style={{ color: "hsl(var(--aeline-dark))" }}>
            Most B2B teams are still targeting too early or too broadly
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed mb-3">
            They build lead lists, guess who might be interested, and waste time chasing people with no active need.
          </p>
          <p className="text-base text-muted-foreground leading-relaxed">
            Meanwhile, the best opportunities are often the buyers already showing signals on LinkedIn — talking about problems, hiring around new initiatives, changing tools, growing teams, or engaging in ways that suggest a purchase may be coming. Intentsly helps you catch those moments earlier.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {pains.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.4, delay: i * 0.08, ease: "easeOut" }}
              className="rounded-3xl bg-[#f5f5f5] p-7"
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 bg-[#1A8FE3]/10">
                <p.icon className="w-5 h-5 text-[#1A8FE3]" />
              </div>
              <h3 className="text-xl font-semibold mb-3" style={{ color: "hsl(var(--aeline-dark))" }}>
                {p.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;

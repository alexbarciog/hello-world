import { motion } from "framer-motion";
import { Rocket, Building2, Users, User, Wrench, Settings2 } from "lucide-react";

const cases = [
  {
    icon: Rocket,
    title: "B2B SaaS teams",
    desc: "Find companies and decision-makers showing signals they may be entering your category.",
  },
  {
    icon: Building2,
    title: "Lead gen agencies",
    desc: "Give clients a stronger prospecting angle by targeting buyers with real movement.",
  },
  {
    icon: Users,
    title: "Sales teams",
    desc: "Prioritize outreach around timing, not just ICP fit.",
  },
  {
    icon: User,
    title: "Founders",
    desc: "A faster, leaner way to identify likely buyers without building a full outbound machine.",
  },
  {
    icon: Wrench,
    title: "B2B service businesses",
    desc: "Spot companies that may need support based on growth, hiring, or visible demand triggers.",
  },
  {
    icon: Settings2,
    title: "RevOps / GTM operators",
    desc: "Improve targeting inputs for outbound, account selection, and sales prioritization.",
  },
];

const UseCases = () => {
  return (
    <section id="use-cases" className="py-20 md:py-32 px-6 bg-background">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="max-w-2xl mb-14"
        >
          <span className="section-label mb-6 block">Who Intentsly is for</span>
          <h2 className="text-4xl md:text-5xl font-medium tracking-tight leading-[1.1] mb-4" style={{ color: "hsl(var(--aeline-dark))" }}>
            Built for B2B teams that care about timing
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            Different teams. Same goal: find buyers worth your attention now.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cases.map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.4, delay: (i % 3) * 0.06, ease: "easeOut" }}
              className="rounded-3xl bg-[#f5f5f5] p-7"
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 bg-[#1A8FE3]/10">
                <c.icon className="w-5 h-5 text-[#1A8FE3]" />
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: "hsl(var(--aeline-dark))" }}>
                {c.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{c.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UseCases;

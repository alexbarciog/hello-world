import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Bot, MessageSquare, Send, Target, Zap, TrendingUp, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";

const steps = [
  {
    icon: Target,
    title: "Define Your ICP",
    desc: "Tell us who your ideal customers are — job titles, industries, company sizes. Our AI builds a precision-targeted profile.",
  },
  {
    icon: Bot,
    title: "AI Crafts Personalized Messages",
    desc: "Each connection request and follow-up is uniquely written based on the lead's profile, activity, and your value proposition.",
  },
  {
    icon: Send,
    title: "Automated Multi-Step Outreach",
    desc: "Connection requests, follow-up messages, and nurture sequences run on autopilot — respecting LinkedIn's daily limits.",
  },
  {
    icon: MessageSquare,
    title: "Smart Conversation Handling",
    desc: "When leads reply, the AI SDR responds naturally — mirroring their tone, asking discovery questions, and guiding toward a meeting.",
  },
  {
    icon: TrendingUp,
    title: "Continuous Optimization",
    desc: "Message performance is tracked. The AI learns what works for your audience and refines its approach over time.",
  },
];

const stats = [
  { value: "10x", label: "More conversations started" },
  { value: "< 25", label: "Words per AI reply" },
  { value: "24/7", label: "Outreach running nonstop" },
  { value: "0", label: "Manual effort needed" },
];

export default function AiSdrOutreach() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 md:px-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Bot className="w-4 h-4" />
              AI SDR & Outreach
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground tracking-tight leading-tight">
              Your AI sales rep that never sleeps
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Intentsly's AI SDR sends personalized LinkedIn messages, manages multi-step campaigns, and handles replies — all on autopilot.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button onClick={() => navigate("/register")} className="btn-cta text-base px-8 py-3.5">
                Start for Free
                <ArrowRight className="w-4 h-4 ml-2 inline" />
              </button>
              <button onClick={() => navigate("/video")} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Watch demo →
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 md:px-10 border-y border-border/40">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="text-3xl md:text-4xl font-bold text-foreground">{s.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 md:py-28 px-6 md:px-10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-4">How it works</h2>
          <p className="text-muted-foreground text-center max-w-xl mx-auto mb-16">
            From defining your ideal customer to closing meetings — fully automated.
          </p>
          <div className="space-y-12">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                className="flex gap-6 items-start"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <step.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
                  <p className="text-muted-foreground mt-1">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 md:px-10">
        <div className="max-w-3xl mx-auto text-center rounded-3xl bg-primary/5 border border-primary/10 p-12">
          <Zap className="w-8 h-8 text-primary mx-auto mb-4" />
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">Ready to automate your outreach?</h2>
          <p className="text-muted-foreground mt-3 mb-8">Start generating warm conversations on LinkedIn today.</p>
          <button onClick={() => navigate("/register")} className="btn-cta text-base px-8 py-3.5">
            Get Started Free <ArrowRight className="w-4 h-4 ml-2 inline" />
          </button>
        </div>
      </section>
    </div>
  );
}
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageCircle, Brain, Calendar, Shield, Sparkles, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";

const capabilities = [
  {
    icon: MessageCircle,
    title: "Natural Conversations",
    desc: "Replies under 25 words that mirror the lead's energy. No robotic sales pitches — just human-like responses.",
  },
  {
    icon: Brain,
    title: "Context-Aware Intelligence",
    desc: "The AI reads the full conversation history, understands intent, and calibrates its approach based on the conversation stage.",
  },
  {
    icon: Calendar,
    title: "Auto Meeting Booking",
    desc: "When a lead shows interest, the AI naturally suggests a call and detects when a meeting is agreed upon.",
  },
  {
    icon: Shield,
    title: "Smart Escalation",
    desc: "Complex questions or high-value opportunities are flagged for your attention — the AI knows when to hand off.",
  },
];

const phases = [
  { phase: "Replies 1-2", title: "Build Rapport", desc: "Pure relationship building. Ask about their work, find common ground. Zero selling." },
  { phase: "Replies 3-4", title: "Discovery", desc: "Light exploration of challenges. Mention your solution only if naturally relevant." },
  { phase: "Reply 5+", title: "Soft Close", desc: "If there's mutual interest, suggest a brief call. Never pushy, always natural." },
];

export default function ConversationalAi() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-32 pb-20 px-6 md:px-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Conversational AI
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground tracking-tight leading-tight">
              AI that talks like your best SDR
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              When leads reply, our Conversational AI handles the dialogue — building rapport, qualifying interest, and booking meetings automatically.
            </p>
            <div className="mt-8">
              <button onClick={() => navigate("/register")} className="btn-cta text-base px-8 py-3.5">
                Try It Free <ArrowRight className="w-4 h-4 ml-2 inline" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Conversation example */}
      <section className="py-16 px-6 md:px-10">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">See it in action</h2>
          <div className="space-y-4">
            {[
              { from: "lead", name: "Lead", msg: "Hi, thanks for connecting!" },
              { from: "ai", name: "AI SDR", msg: "Hey! Thanks for accepting 🙌 Saw you're scaling growth at Acme — how's that going?" },
              { from: "lead", name: "Lead", msg: "It's been intense, we're trying to find more qualified leads" },
              { from: "ai", name: "AI SDR", msg: "Totally get it. What's been your biggest bottleneck — sourcing or converting?" },
              { from: "lead", name: "Lead", msg: "Mostly sourcing, we spend too much time on it" },
              { from: "ai", name: "AI SDR", msg: "We actually help teams automate lead sourcing using intent signals. Happy to show you in 15 min if useful?" },
            ].map((m, i) => (
              <motion.div
                key={i}
                className={`flex ${m.from === "ai" ? "justify-start" : "justify-end"}`}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${m.from === "ai" ? "bg-primary/10 text-foreground" : "bg-muted text-foreground"}`}>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{m.name}</div>
                  <div className="text-sm">{m.msg}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Phases */}
      <section className="py-20 px-6 md:px-10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground text-center mb-4">Intelligent conversation phases</h2>
          <p className="text-muted-foreground text-center max-w-xl mx-auto mb-12">
            The AI adapts its strategy as the conversation progresses — never rushing, always natural.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {phases.map((p, i) => (
              <motion.div
                key={i}
                className="rounded-2xl border border-border/60 p-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="text-xs font-bold uppercase tracking-wider text-primary mb-2">{p.phase}</div>
                <h3 className="text-lg font-semibold text-foreground">{p.title}</h3>
                <p className="text-sm text-muted-foreground mt-2">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="py-20 px-6 md:px-10 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">Key capabilities</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {capabilities.map((c, i) => (
              <motion.div
                key={i}
                className="flex gap-4 items-start"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <c.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{c.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{c.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 md:px-10">
        <div className="max-w-3xl mx-auto text-center rounded-3xl bg-primary/5 border border-primary/10 p-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">Let AI handle your conversations</h2>
          <p className="text-muted-foreground mt-3 mb-8">Focus on closing deals while the AI warms up your pipeline.</p>
          <button onClick={() => navigate("/register")} className="btn-cta text-base px-8 py-3.5">
            Get Started Free <ArrowRight className="w-4 h-4 ml-2 inline" />
          </button>
        </div>
      </section>
    </div>
  );
}
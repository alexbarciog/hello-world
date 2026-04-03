import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Linkedin, Search, Activity, Users, Filter, Crosshair, ArrowRight, Zap } from "lucide-react";
import Navbar from "@/components/Navbar";

const signals = [
  {
    icon: Activity,
    title: "Post Engagement Signals",
    desc: "Find people who like, comment on, or share posts from your competitors and industry leaders — they're already thinking about your space.",
  },
  {
    icon: Search,
    title: "Keyword Post Signals",
    desc: "Monitor LinkedIn for posts mentioning specific pain points, tools, or topics relevant to your solution.",
  },
  {
    icon: Users,
    title: "Competitor Page Followers",
    desc: "Target people following your competitors' company pages — they've already shown interest in solutions like yours.",
  },
  {
    icon: Crosshair,
    title: "Hashtag Engagement",
    desc: "Track engagement on industry-specific hashtags to find active participants in your market.",
  },
];

const howItWorks = [
  { step: "1", title: "Set your signals", desc: "Choose competitor pages, keywords, influencers, and hashtags to monitor." },
  { step: "2", title: "AI scans continuously", desc: "Our agents run daily, finding fresh leads who match your ICP and show buying intent." },
  { step: "3", title: "Leads scored & filtered", desc: "Each lead gets an AI relevance score. Cold leads are capped at 20% — only warm signals matter." },
  { step: "4", title: "Auto-enrolled in campaigns", desc: "High-intent leads flow directly into your outreach campaigns for immediate engagement." },
];

export default function LinkedInSignals() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-32 pb-20 px-6 md:px-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-600 text-sm font-medium mb-6">
              <Linkedin className="w-4 h-4" />
              LinkedIn Intent Signals
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground tracking-tight leading-tight">
              Find leads who are already looking for you
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Stop cold outreach. Intentsly monitors LinkedIn engagement to find people actively interested in what you sell — before your competitors do.
            </p>
            <div className="mt-8">
              <button onClick={() => navigate("/register")} className="btn-cta text-base px-8 py-3.5">
                Start Finding Leads <ArrowRight className="w-4 h-4 ml-2 inline" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Signal types */}
      <section className="py-20 px-6 md:px-10 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground text-center mb-4">Intent signals we track</h2>
          <p className="text-muted-foreground text-center max-w-xl mx-auto mb-12">
            Every signal type captures a different buying behavior — together they paint a complete picture of intent.
          </p>
          <div className="grid md:grid-cols-2 gap-8">
            {signals.map((s, i) => (
              <motion.div
                key={i}
                className="rounded-2xl border border-border/60 bg-card p-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
                  <s.icon className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">{s.title}</h3>
                <p className="text-sm text-muted-foreground mt-2">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 md:px-10">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">From signal to conversation</h2>
          <div className="space-y-8">
            {howItWorks.map((h, i) => (
              <motion.div
                key={i}
                className="flex gap-5 items-start"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  {h.step}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{h.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{h.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Precision */}
      <section className="py-20 px-6 md:px-10">
        <div className="max-w-3xl mx-auto text-center rounded-3xl bg-primary/5 border border-primary/10 p-12">
          <Filter className="w-8 h-8 text-primary mx-auto mb-4" />
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">Precision filtering built-in</h2>
          <p className="text-muted-foreground mt-3 mb-8">
            Every lead is matched against your ICP — job titles, industries, company sizes, and locations. Cold leads are limited to 20% max.
          </p>
          <button onClick={() => navigate("/register")} className="btn-cta text-base px-8 py-3.5">
            Get Started Free <ArrowRight className="w-4 h-4 ml-2 inline" />
          </button>
        </div>
      </section>
    </div>
  );
}
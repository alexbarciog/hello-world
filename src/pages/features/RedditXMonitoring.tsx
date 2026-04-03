import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Globe, MessageSquareMore, Twitter, Hash, Bell, TrendingUp, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";

const platforms = [
  {
    icon: MessageSquareMore,
    title: "Reddit Monitoring",
    features: [
      "Track keywords across specific subreddits",
      "Relevance scoring on every mention",
      "Save high-value discussions for outreach",
      "Real-time alerts when your keywords trend",
    ],
  },
  {
    icon: Twitter,
    title: "X (Twitter) Monitoring",
    features: [
      "Monitor keyword mentions in real-time",
      "Track engagement metrics (likes, replies, retweets)",
      "Identify thought leaders in your space",
      "Save and organize relevant conversations",
    ],
  },
];

const useCases = [
  { title: "Competitor mentions", desc: "Know instantly when someone complains about a competitor or asks for alternatives." },
  { title: "Pain point detection", desc: "Find people publicly describing the exact problems your product solves." },
  { title: "Buying intent", desc: "Catch posts like 'looking for a tool that...' or 'anyone recommend...' before your competitors do." },
  { title: "Market intelligence", desc: "Understand what your target audience cares about — in their own words." },
];

export default function RedditXMonitoring() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-32 pb-20 px-6 md:px-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 text-orange-600 text-sm font-medium mb-6">
              <Globe className="w-4 h-4" />
              Reddit & X Monitoring
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground tracking-tight leading-tight">
              Capture buying signals across the web
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Monitor Reddit and X for real-time conversations about your industry, competitors, and the problems you solve.
            </p>
            <div className="mt-8">
              <button onClick={() => navigate("/register")} className="btn-cta text-base px-8 py-3.5">
                Start Monitoring <ArrowRight className="w-4 h-4 ml-2 inline" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Platform cards */}
      <section className="py-20 px-6 md:px-10">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          {platforms.map((p, i) => (
            <motion.div
              key={i}
              className="rounded-2xl border border-border/60 bg-card p-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
            >
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-5">
                <p.icon className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-4">{p.title}</h3>
              <ul className="space-y-3">
                {p.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Use cases */}
      <section className="py-20 px-6 md:px-10 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground text-center mb-4">What you can catch</h2>
          <p className="text-muted-foreground text-center max-w-xl mx-auto mb-12">
            Real examples of signals that turn into revenue opportunities.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {useCases.map((u, i) => (
              <motion.div
                key={i}
                className="rounded-2xl border border-border/60 bg-card p-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <h3 className="font-semibold text-foreground">{u.title}</h3>
                <p className="text-sm text-muted-foreground mt-2">{u.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 md:px-10">
        <div className="max-w-3xl mx-auto text-center rounded-3xl bg-primary/5 border border-primary/10 p-12">
          <Bell className="w-8 h-8 text-primary mx-auto mb-4" />
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">Never miss a buying signal</h2>
          <p className="text-muted-foreground mt-3 mb-8">Available on the Pro plan. Start capturing intent signals from Reddit and X today.</p>
          <button onClick={() => navigate("/register")} className="btn-cta text-base px-8 py-3.5">
            Get Started Free <ArrowRight className="w-4 h-4 ml-2 inline" />
          </button>
        </div>
      </section>
    </div>
  );
}
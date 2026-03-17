import { CheckCircle2, Zap, Users, BarChart3 } from "lucide-react";
import { ArrowUpRight } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Find warm leads on autopilot",
    description: "AI Agents spot buyers showing intent 24/7 with 10+ intent signals.",
  },
  {
    icon: Users,
    title: "Only your ICP, nothing else",
    description: "Every lead is pre-filtered to match your ideal buyer profile.",
  },
  {
    icon: CheckCircle2,
    title: "AI outreach that books demos",
    description: "Smart, personalized LinkedIn messages sent automatically.",
  },
  {
    icon: BarChart3,
    title: "See what gets replies",
    description: "Track signals & campaigns that convert into meetings or sales.",
  },
];

const Features = () => {
  return (
    <section id="features" className="py-24 px-4 bg-background">
      <div className="max-w-6xl mx-auto">
        {/* Section label */}
        <div className="flex flex-col items-center text-center mb-16">
          <span className="text-xs font-semibold uppercase tracking-widest text-goji-orange mb-4 border border-goji-orange/20 rounded-full px-4 py-1.5"
            style={{ background: "hsl(var(--goji-orange) / 0.06)" }}>
            Features
          </span>
          <p className="text-sm font-medium text-goji-text-muted mb-3">What we do</p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-goji-dark tracking-tight leading-tight max-w-2xl">
            Run your AI Agents 24/7 and find warm leads every day.
          </h2>
        </div>

        {/* Main feature layout */}
        <div className="grid md:grid-cols-2 gap-8 mb-10">
          {/* Left: Feature list */}
          <div className="space-y-6 flex flex-col justify-center">
            {features.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div key={i} className="flex items-start gap-4 group">
                  <div
                    className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center mt-0.5"
                    style={{ background: "hsl(var(--goji-orange) / 0.1)" }}
                  >
                    <Icon className="w-5 h-5 text-goji-orange" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-goji-dark text-base mb-1">{feat.title}</h3>
                    <p className="text-goji-text-muted text-sm leading-relaxed">{feat.description}</p>
                  </div>
                </div>
              );
            })}

            <a
              href="https://app.gojiberry.ai/registration"
              className="inline-flex items-center gap-2 self-start text-sm font-semibold text-primary-foreground rounded-full px-6 py-3 mt-2 transition-all hover:opacity-90"
              style={{ background: "hsl(var(--goji-berry))" }}
            >
              Launch your AI Agent for free
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>

          {/* Right: Visual */}
          <div className="relative">
            <div
              className="rounded-3xl overflow-hidden border border-border shadow-card p-6"
              style={{
                background: "linear-gradient(145deg, hsl(5 85% 97%), hsl(0 0% 100%))",
              }}
            >
              {/* Mock agent cards */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-primary-foreground text-xs font-bold"
                    style={{ background: "hsl(var(--goji-orange))" }}
                  >
                    AI
                  </div>
                  <div>
                    <div className="text-sm font-bold text-goji-dark">Agent: SaaS Buyers</div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-xs text-goji-text-muted">Running 24/7</span>
                    </div>
                  </div>
                </div>

                {[
                  { signal: "🔥 Liked competitor post", name: "James Walker", company: "Acme Corp", score: 94 },
                  { signal: "💼 New role: VP Sales", name: "Elena Russo", company: "GrowthHub", score: 87 },
                  { signal: "📣 Joined #saas-tools community", name: "Teo Martin", company: "DataFlow", score: 81 },
                  { signal: "💰 New funding round", name: "Priya Nair", company: "ScaleAI", score: 79 },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-background rounded-xl px-4 py-3 border border-border/60 hover:border-goji-orange/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground"
                        style={{ background: i % 2 === 0 ? "hsl(var(--goji-orange))" : "hsl(var(--goji-berry))" }}
                      >
                        {item.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-goji-dark">{item.name} · {item.company}</div>
                        <div className="text-[10px] text-goji-text-muted">{item.signal}</div>
                      </div>
                    </div>
                    <div
                      className="text-xs font-bold rounded-full px-2.5 py-0.5"
                      style={{
                        background: "hsl(var(--goji-orange) / 0.12)",
                        color: "hsl(var(--goji-orange))",
                      }}
                    >
                      {item.score}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;

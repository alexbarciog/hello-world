const steps = [
  {
    num: "01",
    title: "Sign up in seconds",
    description: "Create your Gojiberry account and you're in.",
    visual: <SignupCard />,
  },
  {
    num: "02",
    title: "Pick your signals",
    description:
      "AI Agents track buyers engaging with content, competitors, influencers — or signals like funding rounds, new roles, events, and groups.",
    visual: <SignalsCard />,
  },
  {
    num: "03",
    title: "Launch your outreach",
    description: "AI sends smart LinkedIn messages that convert.",
    visual: <OutreachCard />,
  },
];

function SignupCard() {
  return (
    <div className="bg-background rounded-2xl border border-border p-5 shadow-card">
      <h4 className="font-semibold text-goji-dark mb-4 text-sm">Create your account</h4>
      <div className="space-y-3">
        {["Your name", "Email address", "Password"].map((placeholder, i) => (
          <div key={i} className="bg-muted rounded-lg px-3 py-2.5 text-xs text-goji-text-muted border border-border/50">
            {placeholder}
          </div>
        ))}
        <button
          className="w-full rounded-lg py-2.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          style={{ background: "hsl(var(--goji-berry))" }}
        >
          Sign Up →
        </button>
      </div>
    </div>
  );
}

function SignalsCard() {
  const signals = [
    { label: "Liked competitor post", icon: "🔥" },
    { label: "New funding round", icon: "💰" },
    { label: "Joined industry group", icon: "👥" },
    { label: "New role: VP Sales", icon: "💼" },
    { label: "Published content", icon: "✍️" },
    { label: "Attended webinar", icon: "📺" },
  ];
  return (
    <div className="bg-background rounded-2xl border border-border p-5 shadow-card">
      <h4 className="font-semibold text-goji-dark mb-4 text-sm">Intent Signals</h4>
      <div className="grid grid-cols-2 gap-2">
        {signals.map((s, i) => (
          <div
            key={i}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-medium text-goji-dark border border-border/60"
            style={{ background: i < 2 ? "hsl(var(--goji-orange) / 0.08)" : "hsl(var(--muted))" }}
          >
            <span>{s.icon}</span>
            {s.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function OutreachCard() {
  const campaigns = [
    { name: "Campaign A", rate: 18, color: "hsl(var(--goji-text-muted))" },
    { name: "Campaign B", rate: 27, color: "hsl(220 80% 55%)" },
    { name: "Campaign C", rate: 31, color: "hsl(var(--goji-orange))" },
  ];
  return (
    <div className="bg-background rounded-2xl border border-border p-5 shadow-card">
      <h4 className="font-semibold text-goji-dark mb-4 text-sm">Campaign Performance</h4>
      <div className="space-y-3">
        {campaigns.map((c, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-xs text-goji-text-muted w-24 shrink-0">{c.name}</span>
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${c.rate * 3}%`, background: c.color }}
              />
            </div>
            <span className="text-xs font-bold text-goji-dark w-12 text-right">
              {c.rate}% Reply
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 px-4" style={{ background: "hsl(var(--muted))" }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col items-center text-center mb-16">
          <span
            className="text-xs font-semibold uppercase tracking-widest mb-4 border rounded-full px-4 py-1.5"
            style={{
              color: "hsl(var(--goji-orange))",
              background: "hsl(var(--goji-orange) / 0.06)",
              borderColor: "hsl(var(--goji-orange) / 0.2)",
            }}
          >
            Steps
          </span>
          <p className="text-sm font-medium text-goji-text-muted mb-3">
            Discover how Gojiberry works
          </p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-goji-dark tracking-tight leading-tight">
            Get started with our simple
            <br />
            3 step process
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div key={i} className="flex flex-col gap-6">
              {/* Visual */}
              <div>{step.visual}</div>
              {/* Text */}
              <div>
                <div
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-black text-primary-foreground mb-3"
                  style={{ background: "hsl(var(--goji-orange))" }}
                >
                  {step.num}
                </div>
                <h3 className="text-lg font-bold text-goji-dark mb-2">{step.title}</h3>
                <p className="text-sm text-goji-text-muted leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;

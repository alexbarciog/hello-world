import { ArrowUpRight } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-20 pb-16">
      {/* Background gradient */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -10%, hsl(5 85% 93%) 0%, hsl(20 90% 95%) 40%, hsl(0 0% 100%) 80%)",
        }}
      />

      {/* Grid overlay */}
      <div className="absolute inset-0 z-0 hero-grid-bg opacity-60" />

      {/* Soft blobs */}
      <div className="absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl opacity-20 z-0"
        style={{ background: "hsl(5 90% 75%)" }} />
      <div className="absolute top-32 right-10 w-64 h-64 rounded-full blur-3xl opacity-15 z-0"
        style={{ background: "hsl(20 90% 78%)" }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-4xl mx-auto">
        <h1
          className="text-5xl md:text-7xl font-extrabold text-goji-dark leading-[1.1] tracking-tight mb-6 animate-fade-in-up"
          style={{ animationDelay: "0ms" }}
        >
          Find &amp; Contact{" "}
          <span className="text-goji-dark">High-Intent</span>
          <br />
          <span className="text-goji-dark">Leads With AI</span>
        </h1>

        <p
          className="text-lg md:text-xl text-goji-text-muted max-w-2xl mb-10 leading-relaxed animate-fade-in-up"
          style={{ animationDelay: "120ms" }}
        >
          Our AI detects intent signals, scores prospects based on your ideal customers,
          starts relevant conversations on LinkedIn, and books more demos, on autopilot.
        </p>

        <a
          href="https://app.gojiberry.ai/registration"
          className="inline-flex items-center gap-2 text-base font-semibold text-primary-foreground rounded-full px-8 py-4 animate-fade-in-up transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: "hsl(var(--goji-berry))",
            boxShadow: "0 8px 32px 0 hsl(var(--goji-coral) / 0.3)",
            animationDelay: "240ms",
          }}
        >
          Launch your AI Agent for free
          <ArrowUpRight className="w-4 h-4" />
        </a>

        {/* Video / App Preview */}
        <div
          className="mt-14 w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl animate-fade-in-up border border-border/30"
          style={{ animationDelay: "360ms" }}
        >
          <AppPreviewMockup />
        </div>
      </div>
    </section>
  );
};

const AppPreviewMockup = () => (
  <div className="bg-background rounded-2xl border border-border overflow-hidden">
    {/* Browser chrome */}
    <div className="bg-muted px-4 py-3 flex items-center gap-2 border-b border-border">
      <div className="flex gap-1.5">
        <div className="w-3 h-3 rounded-full bg-red-400" />
        <div className="w-3 h-3 rounded-full bg-yellow-400" />
        <div className="w-3 h-3 rounded-full bg-green-400" />
      </div>
      <div className="flex-1 mx-4 bg-background rounded-md py-1 px-3 text-xs text-goji-text-muted text-center">
        app.gojiberry.ai
      </div>
    </div>
    {/* App content mockup */}
    <div className="grid grid-cols-3 gap-0 min-h-[300px] md:min-h-[380px]">
      {/* Sidebar */}
      <div className="bg-muted/40 border-r border-border p-4 hidden md:block">
        <div className="space-y-3">
          {["AI Agents", "Intent Signals", "Campaigns", "Leads", "Analytics"].map((item, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
                i === 0
                  ? "bg-goji-berry text-primary-foreground"
                  : "text-goji-text-muted hover:bg-muted"
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${i === 0 ? "bg-goji-orange" : "bg-border"}`} />
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="col-span-3 md:col-span-2 p-5 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-goji-dark">AI Agent Dashboard</span>
          <div
            className="text-xs font-semibold text-primary-foreground rounded-full px-3 py-1"
            style={{ background: "hsl(var(--goji-orange))" }}
          >
            🔥 24/7 Active
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Leads Found", val: "1,847", color: "hsl(var(--goji-orange))" },
            { label: "Reply Rate", val: "27%", color: "hsl(142 70% 45%)" },
            { label: "Demos Booked", val: "38", color: "hsl(220 80% 55%)" },
          ].map((s) => (
            <div key={s.label} className="bg-muted/50 rounded-xl p-3 text-center border border-border/50">
              <div className="text-lg font-bold" style={{ color: s.color }}>{s.val}</div>
              <div className="text-[10px] text-goji-text-muted mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Leads list */}
        <div className="space-y-2">
          {[
            { name: "Alex Chen", role: "VP Sales @ TechCorp", signal: "Liked competitor post", hot: true },
            { name: "Sarah Miller", role: "CEO @ GrowthOS", signal: "New funding round", hot: true },
            { name: "Marc Dubois", role: "Head of Sales @ Nexus", signal: "Joined sales community", hot: false },
          ].map((lead, i) => (
            <div key={i} className="flex items-center gap-3 bg-muted/30 rounded-xl px-3 py-2.5 border border-border/40">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0"
                style={{ background: lead.hot ? "hsl(var(--goji-orange))" : "hsl(var(--goji-berry))" }}
              >
                {lead.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-goji-dark truncate">{lead.name}</div>
                <div className="text-[10px] text-goji-text-muted truncate">{lead.role}</div>
              </div>
              <div
                className="text-[10px] font-medium rounded-full px-2 py-0.5 shrink-0"
                style={{
                  background: lead.hot ? "hsl(var(--goji-orange) / 0.12)" : "hsl(var(--goji-berry) / 0.1)",
                  color: lead.hot ? "hsl(var(--goji-orange))" : "hsl(var(--goji-berry))",
                }}
              >
                {lead.signal}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default Hero;

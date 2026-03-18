import { ArrowUpRight } from "lucide-react";
import { useState, useEffect } from "react";

const platformLogos = [
  // LinkedIn
  <svg key="linkedin" className="inline h-10 md:h-14 w-10 md:w-14" viewBox="0 0 24 24" fill="#0A66C2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>,
  // X
  <svg key="x" className="inline h-10 md:h-14 w-10 md:w-14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
  // Reddit
  <svg key="reddit" className="inline h-10 md:h-14 w-10 md:w-14" viewBox="0 0 24 24" fill="#FF4500"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 13.38c.7 0 1.28.58 1.28 1.28 0 .7-.58 1.28-1.28 1.28-.7 0-1.28-.58-1.28-1.28 0-.7.58-1.28 1.28-1.28zm-10.02 0c.7 0 1.28.58 1.28 1.28 0 .7-.58 1.28-1.28 1.28-.7 0-1.28-.58-1.28-1.28 0-.7.58-1.28 1.28-1.28zm8.56 4.37c-.98.98-2.56 1.46-3.55 1.46-.99 0-2.57-.48-3.55-1.46a.424.424 0 0 1 .6-.6c.77.77 2.06 1.16 2.95 1.16.89 0 2.18-.39 2.95-1.16a.424.424 0 0 1 .6.6zM17.97 12c-.97 0-1.75-.44-1.75-.98 0-.27.24-.75.83-.75.97 0 1.75.43 1.75.98 0 .26-.24.75-.83.75zm-6.45-2.6c1.03 0 1.87.57 1.87 1.28 0 .71-.84 1.28-1.87 1.28-1.03 0-1.87-.57-1.87-1.28 0-.71.84-1.28 1.87-1.28zm-4.6.85c-.59 0-.83-.48-.83-.75 0-.55.78-.98 1.75-.98.59 0 .83.48.83.75 0 .55-.78.98-1.75.98zm5.08-4c2.41 0 4.37.72 4.37 1.61 0 .89-1.96 1.61-4.37 1.61-2.41 0-4.37-.72-4.37-1.61 0-.89 1.96-1.61 4.37-1.61zM19.54 9.4c1.1 0 2 .62 2 1.38 0 .76-.9 1.38-2 1.38-.26 0-.5-.04-.72-.12.53-.37.87-.87.87-1.42 0-.42-.2-.8-.53-1.1.12-.08.25-.12.38-.12zM4.46 9.4c.13 0 .26.04.38.12-.33.3-.53.68-.53 1.1 0 .55.34 1.05.87 1.42-.22.08-.46.12-.72.12-1.1 0-2-.62-2-1.38 0-.76.9-1.38 2-1.38z"/></svg>,
];

const Hero = () => {
  const [currentLogo, setCurrentLogo] = useState(0);
  const [nextLogo, setNextLogo] = useState(1);
  const [phase, setPhase] = useState<"visible" | "exit" | "enter">("visible");

  useEffect(() => {
    const DISPLAY_TIME = 2200;
    const ANIM_TIME = 350;

    const cycle = () => {
      // Phase 1: slide current logo up & fade out
      setPhase("exit");

      setTimeout(() => {
        // Phase 2: swap to next logo, slide in from below
        setCurrentLogo((prev) => {
          const next = (prev + 1) % platformLogos.length;
          setNextLogo((next + 1) % platformLogos.length);
          return next;
        });
        setPhase("enter");

        setTimeout(() => {
          // Phase 3: settle
          setPhase("visible");
        }, ANIM_TIME);
      }, ANIM_TIME);
    };

    const interval = setInterval(cycle, DISPLAY_TIME + ANIM_TIME * 2);
    return () => clearInterval(interval);
  }, []);
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-20 pb-16">
      {/* Background gradient */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 70% at 50% 30%, hsl(265 70% 75% / 0.6) 0%, hsl(230 80% 70% / 0.4) 40%, hsl(200 60% 85% / 0.2) 65%, hsl(0 0% 100%) 100%)",
        }}
      />

      {/* Grid overlay */}
      <div className="absolute inset-0 z-0 hero-grid-bg opacity-60" />

      {/* Soft blobs */}
      <div className="absolute top-20 left-10 w-80 h-80 rounded-full blur-3xl opacity-30 z-0"
        style={{ background: "hsl(270 65% 72%)" }} />
      <div className="absolute top-32 right-10 w-72 h-72 rounded-full blur-3xl opacity-25 z-0"
        style={{ background: "hsl(220 75% 65%)" }} />
      <div className="absolute top-48 left-1/3 w-64 h-64 rounded-full blur-3xl opacity-20 z-0"
        style={{ background: "hsl(250 80% 78%)" }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-4xl mx-auto">
        <h1
          className="text-5xl md:text-7xl font-extrabold text-goji-dark leading-[1.1] tracking-tight mt-16 md:mt-24 mb-6 animate-fade-in-up"
          style={{ animationDelay: "0ms" }}
        >
          Find People Looking For
          <br />
          What You Offer on{" "}
          <span className="inline-flex items-center align-middle relative h-10 md:h-14 w-10 md:w-14 overflow-hidden">
            <span
              className="absolute inset-0 flex items-center justify-center"
              style={{
                transition: "transform 350ms ease-in-out, opacity 350ms ease-in-out",
                transform: phase === "exit" ? "translateY(-100%)" : "translateY(0)",
                opacity: phase === "exit" ? 0 : 1,
              }}
            >
              {platformLogos[currentLogo]}
            </span>
          </span>
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
          className="btn-cta text-base animate-fade-in-up"
          style={{ animationDelay: "240ms" }}
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

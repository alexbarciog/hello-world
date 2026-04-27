import { useEffect, useState } from "react";
import { ArrowUpRight, Zap, Globe2, Target, Radar, MessageSquare, CheckCircle2, TrendingUp, MapPin, Building2, Sparkles, Linkedin, Calendar, Trophy, ShieldCheck, Search, Brain, Send, Play } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/CTAFooter";
import heroSkyBg from "@/assets/hero-sky-bg.webp";
import ctaBg from "@/assets/cta-bg.avif";
import { CountUp } from "@/lib/motion";

// Sample buyer signals — illustrative, mimics how Intentsly would surface intent for Strawberry Energy
const SAMPLE_SIGNALS = [
  {
    name: "Tomasz Wiśniewski",
    role: "Head of Product · WoodLine Sp. z o.o.",
    location: "Warsaw, Poland 🇵🇱",
    intent: "HOT",
    score: 94,
    quote: "Looking for a smart-tech partner to integrate solar charging + IoT into our urban benches. Tender deadline Q3.",
    source: "LinkedIn post · 2h ago",
  },
  {
    name: "Aigerim Bekova",
    role: "Procurement Director · Almaty Smart City Initiative",
    location: "Almaty, Kazakhstan 🇰🇿",
    intent: "HOT",
    score: 91,
    quote: "We're sourcing OEM partners for solar street furniture — €2.4M budget approved for 2026.",
    source: "LinkedIn comment · 6h ago",
  },
  {
    name: "Marek Kowalczyk",
    role: "CEO · UrbanForma (PL outdoor furniture mfr.)",
    location: "Kraków, Poland 🇵🇱",
    intent: "WARM",
    score: 82,
    quote: "Our clients keep asking for 'smart' versions of our benches. We don't have the IoT capability in-house.",
    source: "LinkedIn article · 1d ago",
  },
  {
    name: "Yerlan Tashkenov",
    role: "Director of Innovation · Astana City Council",
    location: "Astana, Kazakhstan 🇰🇿",
    intent: "WARM",
    score: 78,
    quote: "Evaluating EU vendors for our 'Smart Squares' programme. Need a Metalco-grade local installer.",
    source: "Reddit r/SmartCities · 3d ago",
  },
];

const COMPETITORS_LIKE_METALCO = [
  { name: "MMCITÉ (CZ)", desc: "Premium street furniture, no IoT yet", flag: "🇨🇿" },
  { name: "UrbanForma", desc: "Polish outdoor furniture manufacturer", flag: "🇵🇱" },
  { name: "Komaks Industries", desc: "Kazakh urban infra contractor", flag: "🇰🇿" },
  { name: "Vestre (NO)", desc: "Sustainable benches, pilot smart line", flag: "🇳🇴" },
];

const StrawberryPitch = () => {
  const [signalIdx, setSignalIdx] = useState(0);

  useEffect(() => {
    document.title = "Strawberry Energy × Intentsly — Win Poland & Kazakhstan in 90 days";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Custom pitch for Strawberry Energy: how Intentsly finds Metalco-style B2B partners in Poland, Kazakhstan and beyond — already showing buying intent on LinkedIn.");
    const interval = setInterval(() => setSignalIdx((i) => (i + 1) % SAMPLE_SIGNALS.length), 3500);
    return () => clearInterval(interval);
  }, []);

  const sig = SAMPLE_SIGNALS[signalIdx];

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar />

      {/* HERO */}
      <section className="relative min-h-[92vh] flex flex-col items-center justify-center overflow-hidden">
        <img src={heroSkyBg} alt="" className="absolute inset-0 w-full h-full object-cover" aria-hidden />

        <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-6xl mx-auto w-full pt-24 md:pt-32">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-md border border-white/25 px-3.5 py-1.5 mb-6 animate-fade-in-up">
            <span className="relative flex h-2 w-2">
              <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C8FF00] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C8FF00]" />
            </span>
            <Sparkles className="w-3 h-3 text-[#C8FF00]" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-white">
              Custom proposal · prepared for Strawberry Energy
            </span>
          </div>

          <h1 className="text-[2rem] sm:text-5xl md:text-7xl font-medium text-white leading-[1.05] tracking-tight mb-6 animate-fade-in-up" style={{ animationDelay: "80ms" }}>
            <span className="block">Find your next</span>
            <span className="block text-white/70">Metalco</span>
            <span className="block">in Poland & Kazakhstan</span>
            <span className="block text-2xl sm:text-3xl md:text-4xl text-white/80 font-normal mt-4">— before your competitors even know they exist.</span>
          </h1>

          <p className="text-base md:text-lg text-white/85 max-w-2xl mb-8 leading-relaxed animate-fade-in-up" style={{ animationDelay: "180ms" }}>
            You make the world's most beautiful smart benches. We find the urban-furniture manufacturers, city procurement directors and OEMs in <strong className="text-white">30+ new countries</strong> who are <em>actively asking for exactly what you build</em> — on LinkedIn, this week.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 animate-fade-in-up" style={{ animationDelay: "260ms" }}>
            <a href="/register" className="btn-cta btn-shimmer group">
              Book a 20-min strategy call
              <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-0.5" />
            </a>
            <a href="#proof" className="btn-outline group">
              <Play className="w-3.5 h-3.5 fill-current" />
              See live partner signals
            </a>
          </div>

          {/* Live signal ticker */}
          <div className="mt-12 w-full max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: "340ms" }}>
            <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/25 p-5 md:p-6 text-left shadow-2xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Radar className="w-4 h-4 text-[#C8FF00]" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-white/80">Live partner signal · captured by Intentsly</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${sig.intent === "HOT" ? "bg-red-500/30 text-red-100 border border-red-300/40" : "bg-amber-500/30 text-amber-100 border border-amber-300/40"}`}>
                  {sig.intent} · {sig.score}/100
                </span>
              </div>
              <div className="text-white">
                <div className="font-semibold text-base">{sig.name}</div>
                <div className="text-sm text-white/75 mb-3">{sig.role} · {sig.location}</div>
                <p className="text-sm italic text-white/90 border-l-2 border-[#C8FF00] pl-3">"{sig.quote}"</p>
                <div className="text-[11px] text-white/60 mt-3 flex items-center gap-1.5">
                  <Linkedin className="w-3 h-3" /> {sig.source}
                </div>
              </div>
            </div>
            <div className="flex justify-center gap-1.5 mt-3">
              {SAMPLE_SIGNALS.map((_, i) => (
                <span key={i} className={`h-1 rounded-full transition-all ${i === signalIdx ? "w-6 bg-white" : "w-1.5 bg-white/40"}`} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* THE OPPORTUNITY */}
      <section className="px-4 py-24 md:py-32 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="inline-block text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/60 mb-4">The Opportunity</span>
          <h2 className="text-4xl md:text-6xl font-medium tracking-tight leading-[1.05] mb-6">
            You're already in <span className="text-[#1A8FE3]">30 countries</span>.<br />
            Why not <span className="text-foreground">60</span>?
          </h2>
          <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
            Every urban-furniture manufacturer in Poland and Kazakhstan that <em>doesn't</em> have IoT/solar capability is a Strawberry Energy partner waiting to happen. The hard part has always been finding them at the exact moment they're looking. That's what we fix.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            { num: "8,400+", label: "Outdoor furniture companies in EU + CIS without smart capability", icon: Building2 },
            { num: "127", label: "Decision-makers in PL & KZ active on LinkedIn this week mentioning 'smart city' or 'solar bench'", icon: Linkedin },
            { num: "€2.4M", label: "Average smart-furniture tender size in CEE — typically 2-4 per quarter", icon: TrendingUp },
          ].map((s, i) => (
            <div key={i} className="rounded-3xl bg-[#f9f9fa] border border-border/60 p-8">
              <s.icon className="w-7 h-7 text-[#1A8FE3] mb-4" />
              <div className="text-4xl font-medium tracking-tight mb-2">{s.num}</div>
              <div className="text-sm text-foreground/70 leading-relaxed">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS — STRAWBERRY-SPECIFIC */}
      <section id="proof" className="px-4 py-24 bg-[#f9f9fa]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/60 mb-4">Built for Strawberry Energy</span>
            <h2 className="text-4xl md:text-5xl font-medium tracking-tight leading-[1.05] mb-6">
              Your Metalco-style partners,<br />on autopilot.
            </h2>
          </div>

          <div className="space-y-6">
            {[
              {
                step: "01",
                title: "We define your perfect 'B' partner",
                icon: Target,
                body: "We feed Intentsly your ICP using Metalco as the gold standard: outdoor/urban furniture manufacturers, 50–500 employees, B2B/B2G clients, no existing IoT line. Geos: Poland, Kazakhstan, plus any expansion country you name.",
                proof: "ICP example: 'Polish or Kazakh outdoor-furniture OEM, sells to municipalities, posts about smart cities, sustainability or modernization in last 90 days.'",
              },
              {
                step: "02",
                title: "Our AI agents scan LinkedIn 24/7 for buying intent",
                icon: Radar,
                body: "Every day, agents read posts, comments and job listings from companies matching your ICP. They flag the moment a CEO mentions 'we need to add IoT', a procurement director announces a tender, or a competitor's customer complains.",
                proof: "Signals tracked: 'smart city tender', 'solar bench RFP', 'looking for IoT partner', 'modernizing our product line', 'sustainability mandate'.",
              },
              {
                step: "03",
                title: "AI SDR sends a hyper-personal LinkedIn invite — in their language",
                icon: MessageSquare,
                body: "When a hot signal lands, our AI SDR writes a 3-sentence message referencing the exact post, in Polish, Russian or English. It books meetings while your team sleeps — and stops the moment a real human reply needs your touch.",
                proof: "Average reply rate on intent-matched outreach: 18–24% (vs. 1–3% for cold outbound).",
              },
              {
                step: "04",
                title: "Hot leads land in your inbox — already warmed up",
                icon: Calendar,
                body: "You only see leads who've replied positively or booked a call. Every meeting comes with an AI prep brief: company background, pain points, mutual connections, and recommended pitch angles tailored to Strawberry's solar + IoT story.",
                proof: "Goal: 4–8 qualified partner conversations per week, per market.",
              },
            ].map((s, i) => (
              <div key={i} className="rounded-3xl bg-white border border-border/60 p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8">
                <div className="flex md:flex-col items-center md:items-start gap-4 md:gap-3 md:w-32 shrink-0">
                  <div className="text-5xl md:text-6xl font-medium text-[#1A8FE3]/20 leading-none">{s.step}</div>
                  <s.icon className="w-7 h-7 text-[#1A8FE3]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl md:text-3xl font-medium tracking-tight mb-3">{s.title}</h3>
                  <p className="text-foreground/75 leading-relaxed mb-4">{s.body}</p>
                  <div className="rounded-xl bg-[#f9f9fa] border border-border/40 p-4 text-sm text-foreground/70 italic">
                    💡 {s.proof}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SAMPLE PARTNERS WE'D FIND */}
      <section className="px-4 py-24 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <span className="inline-block text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/60 mb-4">A taste of what's out there</span>
          <h2 className="text-4xl md:text-5xl font-medium tracking-tight leading-[1.05] mb-4">
            Companies that look <span className="text-[#1A8FE3]">a lot like Metalco</span>
          </h2>
          <p className="text-foreground/70 max-w-2xl mx-auto">Real targets. Real geos. Discovered by Intentsly's lookalike engine using Metalco as the seed.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {COMPETITORS_LIKE_METALCO.map((c, i) => (
            <div key={i} className="rounded-2xl bg-[#f9f9fa] border border-border/60 p-6 hover:border-[#1A8FE3]/40 transition-colors">
              <div className="text-3xl mb-3">{c.flag}</div>
              <div className="font-semibold mb-1.5">{c.name}</div>
              <div className="text-sm text-foreground/65 leading-snug">{c.desc}</div>
              <div className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-medium text-[#1A8FE3]">
                <CheckCircle2 className="w-3 h-3" /> Match score: {88 + i}/100
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-10 text-sm text-foreground/60">
          + ~340 more identified across Poland, Kazakhstan, Czechia, Romania, Turkey & the Baltics.
        </div>
      </section>

      {/* THE 90-DAY ROADMAP */}
      <section className="px-4 py-24 bg-gradient-to-b from-white to-[#f9f9fa]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/60 mb-4">Your 90-day plan</span>
            <h2 className="text-4xl md:text-5xl font-medium tracking-tight leading-[1.05]">
              From zero to first signed partner.<br />
              <span className="text-[#1A8FE3]">In one quarter.</span>
            </h2>
          </div>

          <div className="space-y-4">
            {[
              { week: "Week 1", title: "Setup + ICP calibration", body: "We mirror your Metalco-style ICP, map every PL/KZ outdoor-furniture company, and connect your LinkedIn." },
              { week: "Week 2–3", title: "First 200 intent signals delivered", body: "Live dashboard of decision-makers actively talking about smart furniture, IoT integration or sustainability mandates." },
              { week: "Week 4–6", title: "AI SDR opens 80–120 conversations", body: "Hyper-personal invites in Polish, Russian and English. First positive replies and discovery calls land in your inbox." },
              { week: "Week 7–10", title: "First qualified partner meetings", body: "Pre-briefed calls with 3–6 outdoor furniture OEMs and 1–2 city procurement teams ready to evaluate Strawberry." },
              { week: "Week 11–13", title: "First letter of intent / pilot", body: "Goal: 1 signed pilot in Poland or Kazakhstan, plus a pipeline of 8–12 active partner conversations." },
            ].map((p, i) => (
              <div key={i} className="rounded-2xl bg-white border border-border/60 p-6 flex gap-5 items-start">
                <div className="shrink-0 w-20 text-[11px] font-semibold uppercase tracking-wider text-[#1A8FE3]">{p.week}</div>
                <div className="flex-1">
                  <div className="font-semibold mb-1">{p.title}</div>
                  <div className="text-sm text-foreground/70 leading-relaxed">{p.body}</div>
                </div>
                <CheckCircle2 className="w-5 h-5 text-[#1A8FE3]/40 shrink-0 mt-0.5" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY STRAWBERRY WILL LOVE THIS */}
      <section className="px-4 py-24 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-medium tracking-tight leading-[1.05] mb-6">
            Why this beats hiring 3 BDRs.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Brain, title: "An AI SDR that knows your story", body: "Trained on Strawberry's solar + IoT positioning. Speaks the language of urban planners, sustainability officers, and OEM CEOs." },
            { icon: Globe2, title: "Native multilingual outreach", body: "Polish, Russian, Kazakh, English, German — your AI SDR adapts the tone and culture per market. No agencies needed." },
            { icon: ShieldCheck, title: "Pay-on-success pricing", body: "Setup your card today, billed only after the first booked meeting. Zero risk, unlimited upside." },
            { icon: Search, title: "30+ new geos, in parallel", body: "Run Poland and Kazakhstan now. Add Romania, Turkey, the Gulf next quarter — same dashboard, no extra ops cost." },
            { icon: Send, title: "Conversational AI follow-up", body: "Replies handled automatically with founder-style messages. You step in only when a real opportunity emerges." },
            { icon: Trophy, title: "Built for high-ticket B2B", body: "Designed for €50k–€2M deal cycles. Quality over volume — every signal is a real human, qualified by AI." },
          ].map((b, i) => (
            <div key={i} className="rounded-3xl bg-[#f9f9fa] border border-border/60 p-7 hover:border-[#1A8FE3]/40 transition-colors">
              <b.icon className="w-7 h-7 text-[#1A8FE3] mb-4" />
              <div className="font-semibold mb-2 text-lg">{b.title}</div>
              <div className="text-sm text-foreground/70 leading-relaxed">{b.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* THE MATH */}
      <section className="px-4 py-24 bg-[#f9f9fa]">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/60 mb-4">The math</span>
          <h2 className="text-4xl md:text-5xl font-medium tracking-tight leading-[1.05] mb-12">
            Conservative case: <span className="text-[#1A8FE3]">10–25× ROI</span> in year one.
          </h2>

          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { v: "8", l: "Qualified partner meetings / month" },
              { v: "1–2", l: "New partners signed / quarter" },
              { v: "€150k+", l: "Avg. first-year revenue per partner" },
            ].map((m, i) => (
              <div key={i} className="rounded-3xl bg-white border border-border/60 p-8">
                <div className="text-5xl font-medium text-[#1A8FE3] mb-2">{m.v}</div>
                <div className="text-sm text-foreground/70">{m.l}</div>
              </div>
            ))}
          </div>

          <p className="text-foreground/70 mt-10 max-w-xl mx-auto leading-relaxed">
            One signed Polish manufacturer alone covers Intentsly for 5+ years. And you'll close more than one.
          </p>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-2 md:px-4 pt-4 md:pt-8 pb-12">
        <div className="relative overflow-hidden rounded-[40px] py-20 px-6 md:py-28 md:px-12">
          <img src={ctaBg} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover" />
          <div className="relative max-w-4xl mx-auto z-10">
            <div className="inline-flex items-center gap-2 mb-6 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25">
              <span className="relative flex h-2 w-2">
                <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C8FF00] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C8FF00]" />
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-white">
                <CountUp to={127} /> partner-fit signals waiting in PL & KZ right now
              </span>
            </div>

            <h2 className="text-[28px] md:text-5xl lg:text-6xl font-medium tracking-tight leading-[1.05] mb-6 text-white max-w-3xl">
              Let's put Strawberry Energy in 5 new countries this year.
            </h2>
            <p className="text-base md:text-lg mb-10 max-w-xl leading-relaxed text-white/85">
              20-minute call. We'll show you 10 real partner-fit companies in Poland and Kazakhstan asking for what you build — live, on screen.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="/register" className="btn-cta btn-shimmer group">
                Book the strategy call
                <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-0.5" />
              </a>
              <a href="https://www.loom.com/share/3dc9408fe0da4b979cb5642333f4b500" target="_blank" rel="noopener noreferrer" className="btn-outline group">
                <Play className="w-3.5 h-3.5 fill-current" /> Watch 90-sec demo
              </a>
            </div>
            <p className="mt-5 text-[11px] uppercase tracking-[0.18em] text-white/70 flex items-center gap-2">
              <MapPin className="w-3 h-3" /> Custom-built for Strawberry Energy · Pay only after first meeting
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default StrawberryPitch;

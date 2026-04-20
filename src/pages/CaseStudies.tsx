import { useEffect } from "react";
import { ArrowUpRight, TrendingUp, Calendar, Sparkles, Target, Zap, Users } from "lucide-react";
import Navbar from "@/components/Navbar";
import { CTASection, Footer } from "@/components/CTAFooter";
import heroSkyBg from "@/assets/hero-sky-bg.webp";
import { ttqViewContent } from "@/lib/tiktok-pixel";

interface CaseStudy {
  slug: string;
  company: string;
  domain: string;
  industry: string;
  headline: string;
  result: string;
  resultLabel: string;
  timeframe: string;
  meetings: number;
  challenge: string;
  solution: string;
  outcome: string;
  bgClass: string;
  accentText: string;
  accentBg: string;
}

const caseStudies: CaseStudy[] = [
  {
    slug: "intentsly",
    company: "Intentsly",
    domain: "intentsly.com",
    industry: "AI Sales Platform",
    headline: "How we used our own platform to book 14 meetings in 2 weeks",
    result: "14",
    resultLabel: "meetings booked",
    timeframe: "2 weeks",
    meetings: 14,
    challenge:
      "Launching a new AI sales platform in a noisy market — competing against established outreach tools with massive budgets and existing brand awareness.",
    solution:
      "We deployed our own intent signals + AI SDR on LinkedIn. Targeted founders complaining about cold outreach burnout, ran conversational AI replies, and let the system book demos automatically.",
    outcome:
      "14 qualified demos in 14 days. Zero manual outreach. Reply rate 4× our previous cold campaigns. Most leads came from intent signals we caught in real-time.",
    bgClass: "bg-[#1A8FE3]",
    accentText: "text-[#1A8FE3]",
    accentBg: "bg-[#1A8FE3]/10",
  },
  {
    slug: "massoftind",
    company: "Massoftind",
    domain: "massoftind.com",
    industry: "Software Development Agency",
    headline: "A dev agency booked 3 qualified meetings in less than a week",
    result: "3",
    resultLabel: "meetings booked",
    timeframe: "< 1 week",
    meetings: 3,
    challenge:
      "A boutique software agency tired of low-conversion cold email and unreliable referrals. They needed a predictable channel for inbound-quality conversations without hiring an SDR.",
    solution:
      "We set up a Conversational AI campaign targeting startup founders and CTOs actively posting about engineering bottlenecks. Each invite was personalized off the lead's actual signal.",
    outcome:
      "3 demo calls in their first 6 days live — all founders with active hiring or build-vs-buy posts. Two converted to scoping calls within the same week.",
    bgClass: "bg-[#0F172A]",
    accentText: "text-[#1A1A2E]",
    accentBg: "bg-[#EDEEFC]",
  },
  {
    slug: "logicmelon",
    company: "LogicMelon",
    domain: "logicmelon.com",
    industry: "HR Tech / Recruitment Software",
    headline: "An enterprise recruitment platform booked a meeting in 2 days",
    result: "1",
    resultLabel: "meeting in 48h",
    timeframe: "2 days",
    meetings: 1,
    challenge:
      "Selling enterprise recruitment software requires reaching busy HR directors and TA leaders — a notoriously hard audience to break into via cold channels.",
    solution:
      "We launched a high-precision agent surfacing TA leaders engaging with hiring-pain content on LinkedIn. AI SDR opened with the lead's specific signal — not a generic pitch.",
    outcome:
      "First qualified meeting booked within 48 hours of going live, with an HR Director at a 500+ employee org. Pipeline started compounding from week one.",
    bgClass: "bg-[#C8FF00]",
    accentText: "text-[#1A1A2E]",
    accentBg: "bg-[#C8FF00]/30",
  },
];

const totalMeetings = caseStudies.reduce((sum, c) => sum + c.meetings, 0);

const CaseStudies = () => {
  useEffect(() => {
    ttqViewContent("Case Studies", "case-studies");
    document.title = "Case Studies — Real customers booking real meetings | Intentsly";
  }, []);

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar />

      {/* HERO — split layout inspired by Aeline */}
      <section className="px-2 md:px-4 pt-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 md:gap-4 min-h-[calc(100vh-6rem)]">
          {/* Left: copy */}
          <div className="bg-[#f4f4f5] rounded-[32px] p-8 md:p-16 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full bg-white border border-border/60 w-fit">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#16A34A] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#16A34A]" />
              </span>
              <span className="text-sm font-medium text-foreground">Avg. time to first booked call: <span className="text-[#16A34A]">under 48h</span> ⚡</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-medium leading-[1.05] tracking-tight text-foreground mb-6">
              Real teams.<br />
              Real meetings.<br />
              <span className="text-foreground/40">Real fast.</span>
            </h1>

            <p className="text-base md:text-lg text-foreground/60 max-w-md leading-relaxed mb-10">
              See how founders and sales teams are using Intentsly to turn LinkedIn intent signals into booked demos — in days, not quarters.
            </p>

            <a href="/register" className="btn-cta">
              Get Started
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>

          {/* Right: sky image with floating stat cards */}
          <div className="relative rounded-[32px] overflow-hidden bg-gradient-to-br from-[#1A8FE3] to-[#7CC5F5] min-h-[500px]">
            <img src={heroSkyBg} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover" />

            {/* Floating card 1 — dark */}
            <div className="absolute top-[18%] left-[12%] md:left-[18%] w-[58%] md:w-[55%] bg-[#1A1A2E] text-white rounded-2xl p-5 shadow-2xl rotate-[-6deg]">
              <div className="text-xs uppercase tracking-wider text-white/50 mb-1">Total meetings booked</div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl md:text-5xl font-medium">{totalMeetings}+</span>
                <span className="text-sm text-[#C8FF00]">across 3 case studies</span>
              </div>
              <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-[#C8FF00] rounded-full" style={{ width: "78%" }} />
              </div>
            </div>

            {/* Floating card 2 — white */}
            <div className="absolute top-[44%] right-[8%] md:right-[12%] w-[60%] md:w-[55%] bg-white rounded-2xl p-4 shadow-2xl rotate-[4deg]">
              {caseStudies.map((c, i) => (
                <div key={c.slug} className={`flex items-center justify-between py-2 ${i < caseStudies.length - 1 ? "border-b border-border/60" : ""}`}>
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-7 h-7 rounded-lg ${c.accentBg} flex items-center justify-center flex-shrink-0`}>
                      <span className={`text-[10px] font-semibold ${c.accentText}`}>{c.company.slice(0, 2).toUpperCase()}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-foreground truncate">{c.company}</div>
                      <div className="text-[10px] text-foreground/50">{c.timeframe}</div>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-foreground">{c.result}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* INTRO STRIP */}
      <section className="max-w-6xl mx-auto px-6 py-24 md:py-32">
        <div className="text-xs uppercase tracking-[0.2em] text-foreground/50 mb-6">Case studies</div>
        <h2 className="text-4xl md:text-6xl font-medium tracking-tight leading-[1.05] text-foreground max-w-4xl">
          A handful of teams.<br />
          <span className="text-foreground/40">Hundreds of warm conversations.</span>
        </h2>
        <p className="mt-8 text-lg text-foreground/60 max-w-2xl leading-relaxed">
          Every campaign below was launched in under an hour. Every meeting was booked off a real intent signal — not a list scrape, not a generic blast.
        </p>
      </section>

      {/* STUDIES — alternating layout */}
      <section className="px-2 md:px-4 space-y-2 md:space-y-4">
        {caseStudies.map((study, idx) => (
          <article
            key={study.slug}
            className="grid grid-cols-1 lg:grid-cols-12 gap-2 md:gap-4 items-stretch"
          >
            {/* Visual side */}
            <div
              className={`lg:col-span-5 ${idx % 2 === 1 ? "lg:order-2" : ""} relative rounded-[28px] overflow-hidden min-h-[340px] ${study.bgClass} flex items-center justify-center p-10`}
            >
              {/* Decorative grid */}
              <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)",
                backgroundSize: "24px 24px"
              }} />

              <div className="relative text-center">
                <div className={`text-[8rem] md:text-[10rem] leading-none font-medium ${study.bgClass === "bg-[#C8FF00]" ? "text-[#1A1A2E]" : "text-white"}`}>
                  {study.result}
                </div>
                <div className={`text-sm uppercase tracking-wider mt-2 ${study.bgClass === "bg-[#C8FF00]" ? "text-[#1A1A2E]/70" : "text-white/70"}`}>
                  {study.resultLabel}
                </div>
                <div className={`mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs ${study.bgClass === "bg-[#C8FF00]" ? "bg-[#1A1A2E]/10 text-[#1A1A2E]" : "bg-white/10 text-white border border-white/20"}`}>
                  <Calendar className="w-3.5 h-3.5" />
                  in {study.timeframe}
                </div>
              </div>
            </div>

            {/* Copy side */}
            <div className={`lg:col-span-7 ${idx % 2 === 1 ? "lg:order-1" : ""} bg-[#f9f9fa] rounded-[28px] p-8 md:p-12 flex flex-col justify-center`}>
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 rounded-xl ${study.accentBg} flex items-center justify-center`}>
                  <span className={`text-xs font-semibold ${study.accentText}`}>{String(idx + 1).padStart(2, "0")}</span>
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">{study.company}</div>
                  <div className="text-xs text-foreground/50">{study.industry} · {study.domain}</div>
                </div>
              </div>

              <h3 className="text-3xl md:text-4xl lg:text-5xl font-medium tracking-tight leading-[1.1] text-foreground mb-8">
                {study.headline}
              </h3>

              <div className="grid sm:grid-cols-3 gap-3 mb-8">
                <DetailBlock icon={Target} label="Challenge" body={study.challenge} />
                <DetailBlock icon={Zap} label="What we did" body={study.solution} />
                <DetailBlock icon={TrendingUp} label="Outcome" body={study.outcome} />
              </div>

              <div className="flex items-center gap-2 text-xs text-foreground/50">
                <Sparkles className="w-3.5 h-3.5" />
                Powered by Intentsly intent signals + Conversational AI SDR
              </div>
            </div>
          </article>
        ))}
      </section>

      {/* STATS BAND */}
      <section className="max-w-6xl mx-auto px-6 py-28">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 border-t border-border pt-12">
          <Stat value={`${totalMeetings}+`} label="Meetings booked" />
          <Stat value="48h" label="Avg. time to first meeting" />
          <Stat value="4×" label="Higher reply rate" />
          <Stat value="0" label="SDRs hired" />
        </div>
      </section>

      <CTASection />
      <Footer />
    </div>
  );
};

const DetailBlock = ({ icon: Icon, label, body }: { icon: typeof Target; label: string; body: string }) => (
  <div className="bg-white rounded-2xl p-5">
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-3.5 h-3.5 text-foreground/40" />
      <span className="text-[10px] uppercase tracking-wider text-foreground/50 font-medium">{label}</span>
    </div>
    <p className="text-sm text-foreground/80 leading-relaxed">{body}</p>
  </div>
);

const Stat = ({ value, label }: { value: string; label: string }) => (
  <div>
    <div className="text-4xl md:text-5xl font-medium tracking-tight text-foreground">{value}</div>
    <div className="text-sm text-foreground/50 mt-2">{label}</div>
  </div>
);

export default CaseStudies;

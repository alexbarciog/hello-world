import { useEffect, useRef } from "react";
import { Search, Heart, UserPlus, MessageCircle, Zap, Flame, TrendingUp, Eye } from "lucide-react";

const useReveal = () => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.classList.add("revealed"); obs.disconnect(); }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
};

const tags1 = ["Signal-Based", "AI Outreach", "Intent-Driven", "Hyper-Personalized"];
const tags2 = ["Warm Leads", "Auto-Pilot", "LinkedIn Native", "Real-Time"];

/* ── Signal 1: Posting About Keywords ── */
const KeywordPostVisual = () => (
  <div className="relative w-full h-64 flex items-center justify-center">
    <div className="absolute left-8 top-4 w-40 rounded-2xl bg-[#1a1a2e] text-white p-4 shadow-xl -rotate-3 z-10">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium opacity-80">Keyword hits</span>
        <Search className="w-4 h-4 text-[#C8FF00]" />
      </div>
      <p className="text-[10px] opacity-40 mb-2">Last 24 hours</p>
      <div className="text-3xl font-bold mb-0.5">34</div>
      <p className="text-[10px] opacity-40">Posts matched</p>
    </div>
    <div className="absolute left-[7.25rem] top-5 w-44 rounded-2xl bg-white shadow-lg p-3 rotate-2 z-20 border border-border/50">
      <p className="text-xs font-medium mb-2" style={{ color: "hsl(var(--aeline-dark))" }}>Tracked keywords</p>
      <div className="space-y-1.5">
        {[
          { keyword: "\"sales automation\"", posts: 12 },
          { keyword: "\"lead generation\"", posts: 9 },
          { keyword: "\"outbound tools\"", posts: 13 },
        ].map((k, i) => (
          <div key={i} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-1.5 h-1.5 rounded-full bg-[#C8FF00]" />
              <span className="text-[10px] font-medium truncate" style={{ color: "hsl(var(--aeline-dark))" }}>{k.keyword}</span>
            </div>
            <span className="text-[8px] shrink-0 text-muted-foreground">{k.posts} posts</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/* ── Signal 2: Likes Competitor Posts ── */
const CompetitorLikesVisual = () => (
  <div className="relative w-full h-64 flex items-center justify-center">
    <div className="absolute left-8 top-4 w-36 rounded-2xl bg-[#1a1a2e] text-white p-4 shadow-xl -rotate-2 z-10">
      <p className="text-[10px] opacity-50 mb-1">Competitor engagers</p>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold">58</span>
        <span className="text-xs font-semibold text-[#C8FF00]">today</span>
      </div>
      <p className="text-[10px] opacity-40 mt-1">Liked competitor content</p>
    </div>
    <div className="absolute left-[6.75rem] top-5 w-44 rounded-2xl bg-white shadow-lg p-3 rotate-2 z-20 border border-border/50">
      <p className="text-xs font-medium mb-2" style={{ color: "hsl(var(--aeline-dark))" }}>Recent likes detected</p>
      <div className="space-y-1.5">
        {[
          { name: "Sarah K.", action: "Liked competitor post", icon: "❤️" },
          { name: "Mike R.", action: "Reacted to announcement", icon: "👍" },
          { name: "James L.", action: "Liked product update", icon: "❤️" },
        ].map((l, i) => (
          <div key={i} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <Heart className="w-3 h-3 shrink-0 text-red-400" />
              <div className="min-w-0">
                <p className="text-[10px] font-medium truncate" style={{ color: "hsl(var(--aeline-dark))" }}>{l.name}</p>
                <p className="text-[8px] truncate text-muted-foreground">{l.action}</p>
              </div>
            </div>
            <span className="text-[10px] shrink-0">{l.icon}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/* ── Signal 3: Follows Competitor Page ── */
const CompetitorFollowVisual = () => (
  <div className="relative w-full h-64 flex items-center justify-center">
    <div className="absolute left-8 top-4 w-40 rounded-2xl bg-[#1a1a2e] text-white p-4 shadow-xl rotate-2 z-10">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium opacity-80">New followers</span>
        <UserPlus className="w-4 h-4 text-[#C8FF00]" />
      </div>
      <p className="text-[10px] opacity-40 mb-2">On competitor pages</p>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold">23</span>
        <span className="text-xs font-semibold text-[#C8FF00]">this week</span>
      </div>
      <p className="text-[10px] opacity-40 mt-1">Prospects to intercept</p>
    </div>
    <div className="absolute left-[7rem] top-[4.4rem] w-40 rounded-2xl bg-white shadow-lg p-3 -rotate-1 z-20 border border-border/50">
      <p className="text-[9px] font-medium mb-2" style={{ color: "hsl(var(--aeline-dark))" }}>Competitor pages tracked</p>
      <div className="space-y-1.5">
        {[
          { page: "Competitor A", followers: "+8" },
          { page: "Competitor B", followers: "+11" },
          { page: "Competitor C", followers: "+4" },
        ].map((c, i) => (
          <div key={i} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-5 h-5 rounded-full bg-[#f0f0f0] flex items-center justify-center shrink-0">
                <Eye className="w-3 h-3 text-muted-foreground" />
              </div>
              <span className="text-[10px] font-medium truncate" style={{ color: "hsl(var(--aeline-dark))" }}>{c.page}</span>
            </div>
            <span className="text-[9px] shrink-0 font-semibold text-[#22c55e]">{c.followers}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/* ── Signal 4: Comments/Likes on Topic Posts ── */
const TopicEngagementVisual = () => (
  <div className="relative w-full h-64 flex items-center justify-center">
    <div className="w-12 h-12 rounded-2xl bg-[#1a1a2e] flex items-center justify-center shadow-xl z-10">
      <MessageCircle className="w-5 h-5 text-white" />
    </div>
    <div className="absolute w-28 h-28 rounded-full border border-border/40" />
    <div className="absolute w-40 h-40 rounded-full border border-border/30" />
    <div className="absolute top-6 right-[4.25rem] flex items-center gap-1.5 bg-white rounded-full pl-1.5 pr-2 py-1 shadow-md border border-border/50 z-20">
      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-[7px] font-bold text-white">SK</div>
      <span className="text-[9px] font-medium" style={{ color: "hsl(var(--aeline-dark))" }}>Commented</span>
      <span className="text-[9px] font-semibold text-[#22c55e]">🔥</span>
    </div>
    <div className="absolute bottom-9 left-[3.75rem] flex items-center gap-1.5 bg-white rounded-full pl-1.5 pr-2 py-1 shadow-md border border-border/50 z-20">
      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-[7px] font-bold text-white">JM</div>
      <span className="text-[9px] font-medium" style={{ color: "hsl(var(--aeline-dark))" }}>Liked post</span>
      <span className="text-[9px] font-semibold text-[#1A8FE3]">👍</span>
    </div>
    <div className="absolute bottom-6 right-[4rem] flex items-center gap-1.5 bg-white rounded-full pl-1.5 pr-2 py-1 shadow-md border border-border/50 z-20">
      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-[7px] font-bold text-white">AR</div>
      <span className="text-[9px] font-medium" style={{ color: "hsl(var(--aeline-dark))" }}>Reacted</span>
      <span className="text-[9px] font-semibold text-[#22c55e]">💬</span>
    </div>
  </div>
);

const features = [
  {
    title: "Posting About Your Keywords",
    desc: "Detect prospects actively posting about topics you track — they're already talking about what you solve.",
    Visual: KeywordPostVisual,
  },
  {
    title: "Likes Your Competitor's Posts",
    desc: "Catch prospects engaging with your competitors' content — they're in-market and ready to hear your pitch.",
    Visual: CompetitorLikesVisual,
  },
  {
    title: "Follows Your Competitor's Page",
    desc: "Spot prospects following competitor pages — intercept them before they commit to someone else.",
    Visual: CompetitorFollowVisual,
  },
  {
    title: "Engages on Topic Posts",
    desc: "Find people commenting and liking posts about your niche — the strongest signal of buying intent.",
    Visual: TopicEngagementVisual,
  },
];

const ExpertiseSection = () => {
  const ref = useReveal();

  return (
    <section className="py-20 md:py-32 px-6 bg-background overflow-hidden">
      <div ref={ref} className="reveal-up max-w-6xl mx-auto">
        <span className="section-label mb-6 block">Signals We Track</span>

        <h2 className="text-4xl md:text-5xl font-medium tracking-tight leading-[1.1] max-w-3xl mb-6" style={{ color: "hsl(var(--aeline-dark))" }}>
          Every signal is a sales opportunity
        </h2>
        <p className="text-base text-muted-foreground max-w-2xl mb-14 leading-relaxed">
          We monitor LinkedIn, Reddit, and X in real-time to detect buying signals — so you reach prospects the moment they show intent.
        </p>

        <div className="rounded-[28px] bg-[#F2F2F2] p-6 md:p-10">
        <div className="grid md:grid-cols-2 gap-6">
          {features.map((f, i) => (
            <div key={i} <div key={i} className="rounded-3xl bg-[#FFFFFF] p-10 pb-8 flex flex-col group hover:shadow-lg transition-shadow duration-300 min-h-[420px]">>
              <f.Visual />
              <h3 className="text-xl font-semibold mb-2 text-center mt-2" style={{ color: "hsl(var(--aeline-dark))" }}>{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed text-center">{f.desc}</p>
            </div>
          ))}
        </div>
        </div>

        <div className="space-y-3 overflow-hidden">
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none bg-gradient-to-r from-background to-transparent" />
            <div className="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none bg-gradient-to-l from-background to-transparent" />
            <div className="animate-tag-scroll gap-3">
              {[...tags1, ...tags1, ...tags1, ...tags1].map((tag, i) => (
                <span key={i} className="shrink-0 px-5 py-2 rounded-full border border-border text-sm font-medium" style={{ color: "hsl(var(--aeline-dark))" }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none bg-gradient-to-r from-background to-transparent" />
            <div className="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none bg-gradient-to-l from-background to-transparent" />
            <div className="animate-marquee-reverse gap-3">
              {[...tags2, ...tags2, ...tags2, ...tags2].map((tag, i) => (
                <span key={i} className="shrink-0 px-5 py-2 rounded-full border border-border text-sm font-medium" style={{ color: "hsl(var(--aeline-dark))" }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExpertiseSection;

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Ghost, Linkedin, Facebook, Globe, Zap, Users, MessageCircle, ChevronRight } from "lucide-react";

// ── Scroll-reveal hook ──────────────────────────────────────────────────────
function useInView(threshold = 0.18) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

// ── CTA button ──────────────────────────────────────────────────────────────
function CtaButton({ children }: { children: React.ReactNode }) {
  return (
    <button className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-background text-sm font-medium text-foreground shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200">
      {children}
      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-200" />
    </button>
  );
}

// ── VISUAL 1: Find fresh leads ──────────────────────────────────────────────
function Visual1() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep(s => (s + 1) % 5), 900);
    return () => clearInterval(t);
  }, []);

  const platforms = [
    { label: "LinkedIn", color: "#0A66C2", icon: <Linkedin className="w-4 h-4 text-white" /> },
    { label: "Facebook", color: "#1877F2", icon: <Facebook className="w-4 h-4 text-white" /> },
    { label: "Google", color: "#EA4335", icon: <Globe className="w-4 h-4 text-white" /> },
    { label: "HubSpot", color: "#FF7A59", icon: <Zap className="w-4 h-4 text-white" /> },
  ];

  return (
    <div className="rounded-[28px] overflow-hidden relative" style={{ background: "linear-gradient(145deg, #c7d2fe 0%, #a5b4fc 30%, #ddd6fe 60%, #fef3c7 100%)", minHeight: 320 }}>
      {/* Noise overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")" }} />

      <div className="relative p-8 flex flex-col items-center gap-6">
        {/* Floating ghost icon */}
        <div className="w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center"
          style={{ animation: "featureFloat 3s ease-in-out infinite" }}>
          <Ghost className="w-10 h-10 text-indigo-400" />
        </div>

        {/* Animated arrows */}
        <div className="flex flex-col items-center gap-1">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-0.5 h-3 rounded-full bg-indigo-300"
              style={{ opacity: step % 3 === i ? 1 : 0.3, transition: "opacity 0.3s" }} />
          ))}
          <div className="w-2 h-2 border-r-2 border-b-2 border-indigo-400 rotate-45 -mt-1" />
        </div>

        {/* Platform tiles */}
        <div className="flex gap-3 flex-wrap justify-center">
          {platforms.map((p, i) => (
            <div key={p.label}
              className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl shadow-sm text-sm font-medium text-foreground"
              style={{
                opacity: step > i ? 1 : 0.3,
                transform: step > i ? "translateY(0)" : "translateY(6px)",
                transition: "all 0.4s cubic-bezier(0.34,1.56,0.64,1)",
                transitionDelay: `${i * 80}ms`
              }}>
              <span className="w-5 h-5 rounded flex items-center justify-center" style={{ background: p.color }}>
                {p.icon}
              </span>
              {p.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── VISUAL 2: Build smarter lists ───────────────────────────────────────────
function Visual2() {
  const [dotPos, setDotPos] = useState(0);
  const [cardsVisible, setCardsVisible] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setCardsVisible(true), 600);
    const t2 = setInterval(() => setDotPos(p => (p + 1) % 3), 1400);
    return () => { clearTimeout(t1); clearInterval(t2); };
  }, []);

  const contacts = [
    { initials: "LO", name: "Liam O'Connor", label: "Liked", tag: "Engagement", color: "#6366f1" },
    { initials: "ST", name: "Sally Thompson", label: "VP Operations", tag: "ICP fit", color: "#f59e0b" },
    { initials: "MR", name: "Mike Roberts", label: "CTO", tag: "Engagement", color: "#10b981" },
  ];

  return (
    <div className="rounded-[28px] overflow-hidden relative" style={{ background: "linear-gradient(145deg, #fef9c3 0%, #fef08a 30%, #fde68a 60%, #fcd34d 100%)", minHeight: 320 }}>
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")" }} />

      <div className="relative p-6 flex flex-col gap-4">
        {/* Timeline */}
        <div className="relative flex items-center gap-0">
          <div className="flex-1 h-px border-t-2 border-dashed border-amber-400/60" />
          {/* Warm dot */}
          <div className="absolute left-[20%] top-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-foreground ring-2 ring-amber-300 shadow"
              style={{ transform: `translateX(${dotPos === 0 ? 4 : 0}px)`, transition: "transform 0.6s cubic-bezier(0.34,1.56,0.64,1)" }} />
            <span className="px-3 py-1 bg-foreground text-background text-[11px] font-semibold rounded-full shadow-md whitespace-nowrap">Warm Leads</span>
          </div>
          {/* Cold dot */}
          <div className="absolute left-[60%] top-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-indigo-500 ring-2 ring-indigo-200 shadow"
              style={{ transform: `translateX(${dotPos === 1 ? 4 : 0}px)`, transition: "transform 0.6s cubic-bezier(0.34,1.56,0.64,1)" }} />
            <span className="px-3 py-1 bg-foreground text-background text-[11px] font-semibold rounded-full shadow-md whitespace-nowrap">Cold Leads</span>
          </div>
          <div className="w-full" style={{ minHeight: 48 }} />
        </div>

        {/* Cards */}
        <div className="mt-6 space-y-2">
          {contacts.map((c, i) => (
            <div key={c.name}
              className="flex items-center justify-between bg-white rounded-xl px-3 py-2.5 shadow-sm"
              style={{
                opacity: cardsVisible ? 1 : 0,
                transform: cardsVisible ? "translateY(0)" : "translateY(12px)",
                transition: `all 0.45s cubic-bezier(0.34,1.56,0.64,1) ${i * 120}ms`
              }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ background: c.color }}>{c.initials}</div>
                <span className="text-xs font-medium text-foreground">{c.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">{c.label}</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{c.tag}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── VISUAL 3: LinkedIn messages ─────────────────────────────────────────────
function Visual3() {
  const [showNotif, setShowNotif] = useState(false);
  const [showArrow, setShowArrow] = useState(false);
  const [typedText, setTypedText] = useState("");
  const fullMsg = "Hey John, I noticed your comment on evaluating lead gen tools — happy to share some ideas!";

  useEffect(() => {
    const t1 = setTimeout(() => setShowNotif(true), 400);
    const t2 = setTimeout(() => setShowArrow(true), 1000);
    let i = 0;
    const t3 = setTimeout(() => {
      const iv = setInterval(() => {
        i++;
        setTypedText(fullMsg.slice(0, i));
        if (i >= fullMsg.length) clearInterval(iv);
      }, 28);
      return () => clearInterval(iv);
    }, 1600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div className="rounded-[28px] overflow-hidden relative" style={{ background: "linear-gradient(145deg, #fed7aa 0%, #fdba74 30%, #fb923c 70%, #f97316 100%)", minHeight: 320 }}>
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")" }} />

      <div className="relative p-6 flex flex-col items-center gap-3">
        {/* Notification bubble */}
        <div className="w-full max-w-xs bg-white rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3"
          style={{
            opacity: showNotif ? 1 : 0,
            transform: showNotif ? "translateY(0) scale(1)" : "translateY(-10px) scale(0.95)",
            transition: "all 0.45s cubic-bezier(0.34,1.56,0.64,1)"
          }}>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0">J</div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold text-foreground">John</span>
            <span className="text-xs text-muted-foreground"> commented on your post</span>
          </div>
          <span className="text-[10px] text-muted-foreground shrink-0">2h</span>
        </div>

        {/* Animated arrow */}
        <div className="flex flex-col items-center gap-0.5"
          style={{ opacity: showArrow ? 1 : 0, transition: "opacity 0.3s" }}>
          {[0, 1, 2].map(i => (
            <div key={i} className="w-0.5 h-3 rounded-full bg-white/60"
              style={{ animation: `featurePulseDown 1s ease-in-out ${i * 200}ms infinite` }} />
          ))}
          <div className="w-2 h-2 border-r-2 border-b-2 border-white/70 rotate-45 -mt-0.5" />
        </div>

        {/* AI message card */}
        <div className="w-full max-w-xs bg-white rounded-2xl shadow-lg px-4 py-3"
          style={{
            opacity: showArrow ? 1 : 0,
            transform: showArrow ? "translateY(0)" : "translateY(8px)",
            transition: "all 0.4s ease 0.2s"
          }}>
          <div className="flex items-center gap-1.5 mb-2">
            <Zap className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-[11px] font-semibold text-muted-foreground">AI message</span>
          </div>
          <p className="text-xs text-foreground leading-relaxed">
            {typedText}
            {typedText.length < fullMsg.length && (
              <span className="inline-block w-0.5 h-3 bg-foreground ml-0.5 align-middle"
                style={{ animation: "featureBlink 0.7s step-end infinite" }} />
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Feature row ─────────────────────────────────────────────────────────────
interface FeatureRowProps {
  tag: string;
  title: string;
  description: string;
  cta: string;
  visual: React.ReactNode;
  reversed?: boolean;
  delay?: number;
}

function FeatureRow({ tag, title, description, cta, visual, reversed = false, delay = 0 }: FeatureRowProps) {
  const { ref, visible } = useInView();

  const textCol = (
    <div className="flex flex-col justify-center gap-5"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: `all 0.65s cubic-bezier(0.25,0.46,0.45,0.94) ${delay}ms`
      }}>
      <span className="inline-flex self-start text-xs font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full border border-border bg-secondary text-muted-foreground">
        {tag}
      </span>
      <h3 className="text-3xl md:text-4xl font-bold text-foreground leading-tight tracking-tight">
        {title}
      </h3>
      <p className="text-base text-muted-foreground leading-relaxed max-w-md">
        {description}
      </p>
      <CtaButton>{cta}</CtaButton>
    </div>
  );

  const visualCol = (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(28px)",
      transition: `all 0.65s cubic-bezier(0.25,0.46,0.45,0.94) ${delay + 120}ms`
    }}>
      {visual}
    </div>
  );

  return (
    <div ref={ref} className={`grid md:grid-cols-2 gap-12 md:gap-16 items-center ${reversed ? "md:[&>*:first-child]:order-2 md:[&>*:last-child]:order-1" : ""}`}>
      {reversed ? <>{visualCol}{textCol}</> : <>{textCol}{visualCol}</>}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
const Features = () => {
  return (
    <>
      {/* Keyframe styles */}
      <style>{`
        @keyframes featureFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes featurePulseDown {
          0%, 100% { opacity: 0.4; transform: scaleY(1); }
          50% { opacity: 1; transform: scaleY(1.2); }
        }
        @keyframes featureBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>

      <section id="features" className="py-24 px-4" style={{ background: "hsl(220 20% 98%)" }}>
        <div className="max-w-5xl mx-auto space-y-24">

          <FeatureRow
            tag="Lead discovery"
            title="Find fresh and unique leads"
            description="Scan and extract live data from 15+ platforms to capture niche signals, monitor real-time activity, and surface leads in context, not from stale databases."
            cta="See scraping automations"
            visual={<Visual1 />}
            delay={0}
          />

          <FeatureRow
            tag="List building"
            title="Build smarter lists, not just bigger ones"
            description="Segment and enrich lists with 1,000+ live data points, from job changes to profile activity. Each lead matches your ICP and comes with a clear reason to engage."
            cta="See enrichment solutions"
            visual={<Visual2 />}
            reversed
            delay={60}
          />

          <FeatureRow
            tag="AI outreach"
            title="Send personalized LinkedIn messages with AI"
            description="Feed your AI writer unique data to craft personalized messages that convert. Then trigger outreach flows including DMs, connection requests, likes, or event invites."
            cta="See outreach automations"
            visual={<Visual3 />}
            delay={0}
          />

        </div>
      </section>
    </>
  );
};

export default Features;

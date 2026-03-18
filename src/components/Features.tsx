import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";

// ── Scroll-reveal hook ──────────────────────────────────────────────────────
function useInView(threshold = 0.15) {
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
    <button
      className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground transition-all duration-200 hover:brightness-95 w-fit"
      style={{ background: "linear-gradient(90deg, hsl(0 0% 100%) 0%, hsl(220 13% 95%) 100%)" }}
    >
      {children}
      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-200" />
    </button>
  );
}

// ── Video placeholder container ─────────────────────────────────────────────
interface VideoContainerProps {
  gradient: string;
  videoSrc?: string;
}

function VideoContainer({ gradient, videoSrc }: VideoContainerProps) {
  if (videoSrc) {
    return (
      <video
        src={videoSrc}
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-auto block rounded-[28px] overflow-hidden"
      />
    );
  }
  return (
    <div
      className="rounded-[28px] w-full flex items-center justify-center"
      style={{ background: gradient, minHeight: 240 }}
    >
      <span className="text-white/50 text-sm">Video placeholder</span>
    </div>
  );
}

// ── Feature row ─────────────────────────────────────────────────────────────
interface FeatureRowProps {
  title: string;
  description: string;
  cta: string;
  gradient: string;
  videoSrc?: string;
  reversed?: boolean;
  delay?: number;
}

function FeatureRow({ title, description, cta, gradient, videoSrc, reversed = false, delay = 0 }: FeatureRowProps) {
  const { ref, visible } = useInView();

  const textCol = (
    <div
      className="flex flex-col justify-center gap-6 py-16"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: `all 0.65s cubic-bezier(0.25,0.46,0.45,0.94) ${delay}ms`,
      }}
    >
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
    <div
      className="h-full flex items-stretch"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: `all 0.65s cubic-bezier(0.25,0.46,0.45,0.94) ${delay + 100}ms`,
      }}
    >
      <VideoContainer gradient={gradient} videoSrc={videoSrc} />
    </div>
  );

  return (
    <div
      ref={ref}
      className="grid md:grid-cols-2 gap-12 md:gap-16 items-stretch min-h-screen"
    >
      {reversed ? <>{visualCol}{textCol}</> : <>{textCol}{visualCol}</>}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
const Features = () => {
  const { ref: headingRef, visible: headingVisible } = useInView(0.2);

  return (
    <section id="features" className="px-8 md:px-16" style={{ background: "hsl(0 0% 100%)" }}>
      <div className="max-w-6xl mx-auto">

        {/* Section heading — full viewport height centered */}
        <div
          ref={headingRef}
          className="flex items-center justify-center min-h-screen text-center"
          style={{
            opacity: headingVisible ? 1 : 0,
            transform: headingVisible ? "translateY(0)" : "translateY(24px)",
            transition: "all 0.6s cubic-bezier(0.25,0.46,0.45,0.94)",
          }}
        >
          <h2 className="text-5xl md:text-6xl font-bold text-foreground leading-tight tracking-tight max-w-2xl mx-auto">
            A better way to build<br />your sales pipeline
          </h2>
        </div>

        {/* Row 1 — Lead discovery */}
        <FeatureRow
          title="Find fresh and unique leads"
          description="Scan and extract live data from 15+ platforms to capture niche signals, monitor real-time activity, and surface leads in context, not from stale databases."
          cta="See scraping automations"
          gradient="linear-gradient(145deg, #c7d2fe 0%, #a5b4fc 30%, #ddd6fe 60%, #fef9c3 100%)"
          videoSrc="/videos/feature-1.mp4"
          delay={0}
        />

        {/* Row 2 — List building (reversed) */}
        <FeatureRow
          title="Build smarter lists, not just bigger ones"
          description="Segment and enrich lists with 1,000+ live data points, from job changes to profile activity. Each lead matches your ICP and comes with a clear reason to engage."
          cta="See enrichment solutions"
          gradient="linear-gradient(145deg, #fef9c3 0%, #fef08a 35%, #fde68a 70%, #fcd34d 100%)"
          videoSrc="/videos/feature-2.webm"
          reversed
          delay={60}
        />

        {/* Row 3 — AI outreach */}
        <FeatureRow
          title="Send personalized LinkedIn messages with AI."
          description="Feed your AI writer unique data to craft personalized messages that convert. Then trigger outreach flows including DMs, connection requests, likes, or event invites, all based on the signals each lead has shown."
          cta="See outreach automations"
          gradient="linear-gradient(145deg, #fed7aa 0%, #fdba74 30%, #fb923c 65%, #f97316 100%)"
          videoSrc="/videos/feature-3.webm"
          delay={0}
        />

      </div>
    </section>
  );
};

export default Features;

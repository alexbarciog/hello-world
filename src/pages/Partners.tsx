import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  Handshake,
  UserPlus,
  Send,
  DollarSign,
  Gift,
  LayoutDashboard,
  Infinity as InfinityIcon,
  Briefcase,
  Target,
  Users,
  Megaphone,
  Compass,
  UserCog,
  ChevronDown,
} from "lucide-react";
import featureHeroBg from "@/assets/feature-hero-sky.png";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/CTAFooter";

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

const steps = [
  {
    icon: UserPlus,
    title: "Sign up as an Intentsly partner",
    desc: "Free, self-serve, and takes 2 minutes. No approval calls or sales gatekeeping.",
  },
  {
    icon: Send,
    title: "Refer your clients",
    desc: "Send clients to Intentsly, or use it directly as part of your own lead-gen stack.",
  },
  {
    icon: DollarSign,
    title: "Earn $29/month — forever",
    desc: "Get paid recurring commission for every paying customer you refer, for as long as they stay.",
  },
];

const benefits = [
  {
    icon: DollarSign,
    title: "$29/month recurring",
    desc: "Earn $29 per referred user, every month, paid out monthly. Recurring for the full lifetime of the customer.",
  },
  {
    icon: Gift,
    title: "Free Intentsly account",
    desc: "Once your first client activates, you unlock a free Intentsly account to generate leads for your own agency.",
  },
  {
    icon: LayoutDashboard,
    title: "Dedicated agency dashboard",
    desc: "Manage all your clients from one place. Separate signal feeds per client and easy account switching.",
  },
  {
    icon: InfinityIcon,
    title: "No referral limits",
    desc: "Refer as many clients as you want. There's no cap on how much recurring revenue you can build.",
  },
];

const audience = [
  { icon: Target, label: "Lead-gen agencies" },
  { icon: Briefcase, label: "Sales agencies" },
  { icon: Megaphone, label: "B2B marketing agencies" },
  { icon: Users, label: "Outbound consultants" },
  { icon: Compass, label: "GTM consultants" },
  { icon: UserCog, label: "Freelance sales specialists" },
];

const faqs = [
  {
    q: "How does the commission work?",
    a: "You earn 30% of every $97/month subscription — that's $29/month per client, recurring for as long as they stay subscribed.",
  },
  {
    q: "Do I get a free account?",
    a: "Yes — once your first referred client activates their paid subscription, you get a free Intentsly account to use for your own agency lead generation.",
  },
  {
    q: "Can I manage my clients inside Intentsly?",
    a: "Yes — you get a dedicated agency dashboard with separate client accounts, separate signal feeds per client, and easy account switching.",
  },
  {
    q: "Is there a limit on referrals?",
    a: "No limit. Refer as many clients as you want.",
  },
  {
    q: "Can I white-label Intentsly?",
    a: "Not currently. Intentsly is always branded as Intentsly.",
  },
];

const PARTNER_SIGNUP_URL = "/register?ref=partner";

const PartnerCTA = ({ children = "Become a Partner" }: { children?: React.ReactNode }) => (
  <a href={PARTNER_SIGNUP_URL} className="btn-cta text-base">
    {children}
    <ArrowUpRight className="w-4 h-4" />
  </a>
);

const FaqItem = ({ q, a, index }: { q: string; a: string; index: number }) => {
  const [open, setOpen] = useState(index === 0);
  return (
    <div className="rounded-[20px] bg-[#f5f5f5] overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-6 text-left p-6 md:p-7"
      >
        <span
          className="text-base md:text-lg font-medium tracking-tight"
          style={{ color: "hsl(var(--aeline-dark))" }}
        >
          {q}
        </span>
        <ChevronDown
          className="w-5 h-5 shrink-0 transition-transform"
          style={{
            color: "hsl(var(--aeline-dark))",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>
      {open && (
        <div className="px-6 md:px-7 pb-6 md:pb-7 -mt-2">
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
};

export default function Partners() {
  const heroRef = useInView(0.2);
  const stepsRef = useInView(0.15);
  const benefitsRef = useInView(0.15);
  const audienceRef = useInView(0.15);
  const faqRef = useInView(0.15);

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-[80vh] flex flex-col items-center justify-center overflow-hidden">
        <img
          src={featureHeroBg}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover blur-sm scale-105"
        />
        <div className="cloud-overlay" style={{ opacity: 0.15 }} />
        <div
          ref={heroRef.ref}
          className="relative z-10 flex flex-col items-center text-center px-4 max-w-4xl mx-auto"
          style={{
            opacity: heroRef.visible ? 1 : 0,
            transform: heroRef.visible ? "translateY(0)" : "translateY(24px)",
            transition: "all 0.7s cubic-bezier(0.25,0.46,0.45,0.94)",
          }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm text-sm font-medium text-white mb-8">
            <Handshake className="w-4 h-4" />
            Partner Program
          </div>
          <h1 className="text-5xl md:text-7xl font-medium text-white leading-[1.05] tracking-tight mb-6">
            Grow your agency.
            <br />
            <span className="text-white/70">Earn recurring revenue.</span>
          </h1>
          <p className="text-base md:text-lg text-white/80 max-w-2xl mb-10 leading-relaxed">
            Partner with Intentsly and earn $29 per month for every client you refer — forever.
          </p>
          <a href="#apply" className="btn-cta text-base">
            Become a Partner
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-24 md:py-32 bg-background">
        <div className="max-w-6xl mx-auto">
          <div
            ref={stepsRef.ref}
            className="text-center mb-16"
            style={{
              opacity: stepsRef.visible ? 1 : 0,
              transform: stepsRef.visible ? "translateY(0)" : "translateY(24px)",
              transition: "all 0.6s cubic-bezier(0.25,0.46,0.45,0.94)",
            }}
          >
            <span className="section-label mb-6 block justify-center mx-auto w-fit">How it works</span>
            <h2
              className="text-4xl md:text-5xl font-medium tracking-tight leading-[1.1] mb-4"
              style={{ color: "hsl(var(--aeline-dark))" }}
            >
              Three steps to recurring revenue
            </h2>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Sign up, refer, and get paid. The simplest agency partner program in B2B.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mx-2 md:mx-3">
            {steps.map((s, i) => (
              <div
                key={i}
                className="rounded-[20px] bg-[#f5f5f5] p-8 flex flex-col relative"
              >
                <div className="absolute top-6 right-7 text-5xl font-medium opacity-10" style={{ color: "hsl(var(--aeline-dark))" }}>
                  0{i + 1}
                </div>
                <div className="w-12 h-12 rounded-2xl bg-[#C8FF00] flex items-center justify-center mb-6">
                  <s.icon className="w-5 h-5 text-[#1a1a2e]" />
                </div>
                <h3
                  className="text-xl md:text-2xl font-medium tracking-tight mb-3"
                  style={{ color: "hsl(var(--aeline-dark))" }}
                >
                  {s.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What you get */}
      <section className="px-6 py-24 md:py-32 bg-background">
        <div className="max-w-6xl mx-auto">
          <div
            ref={benefitsRef.ref}
            className="text-center mb-16"
            style={{
              opacity: benefitsRef.visible ? 1 : 0,
              transform: benefitsRef.visible ? "translateY(0)" : "translateY(24px)",
              transition: "all 0.6s cubic-bezier(0.25,0.46,0.45,0.94)",
            }}
          >
            <span className="section-label mb-6 block justify-center mx-auto w-fit">What you get</span>
            <h2
              className="text-4xl md:text-5xl font-medium tracking-tight leading-[1.1] mb-4"
              style={{ color: "hsl(var(--aeline-dark))" }}
            >
              Built for agencies, not affiliates
            </h2>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Real recurring commissions, real tools to manage your clients, and a free account to grow your own pipeline.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mx-2 md:mx-3">
            {benefits.map((b, i) => (
              <div
                key={i}
                className="rounded-[20px] bg-[#f5f5f5] p-8 flex flex-col"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#C8FF00] flex items-center justify-center mb-6">
                  <b.icon className="w-5 h-5 text-[#1a1a2e]" />
                </div>
                <h3
                  className="text-xl md:text-2xl font-medium tracking-tight mb-3"
                  style={{ color: "hsl(var(--aeline-dark))" }}
                >
                  {b.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who this is for */}
      <section className="px-6 py-24 md:py-32 bg-background">
        <div className="max-w-6xl mx-auto">
          <div
            ref={audienceRef.ref}
            className="text-center mb-16"
            style={{
              opacity: audienceRef.visible ? 1 : 0,
              transform: audienceRef.visible ? "translateY(0)" : "translateY(24px)",
              transition: "all 0.6s cubic-bezier(0.25,0.46,0.45,0.94)",
            }}
          >
            <span className="section-label mb-6 block justify-center mx-auto w-fit">Who this is for</span>
            <h2
              className="text-4xl md:text-5xl font-medium tracking-tight leading-[1.1] mb-4"
              style={{ color: "hsl(var(--aeline-dark))" }}
            >
              Made for the people who do outbound
            </h2>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              If you help businesses generate pipeline, the partner program was built for you.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mx-2 md:mx-3">
            {audience.map((a, i) => (
              <div
                key={i}
                className="rounded-[20px] bg-[#f5f5f5] p-6 flex items-center gap-4"
              >
                <div className="w-11 h-11 rounded-2xl bg-[#C8FF00] flex items-center justify-center shrink-0">
                  <a.icon className="w-5 h-5 text-[#1a1a2e]" />
                </div>
                <span
                  className="text-sm md:text-base font-medium tracking-tight"
                  style={{ color: "hsl(var(--aeline-dark))" }}
                >
                  {a.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-24 md:py-32 bg-background">
        <div className="max-w-3xl mx-auto">
          <div
            ref={faqRef.ref}
            className="text-center mb-12"
            style={{
              opacity: faqRef.visible ? 1 : 0,
              transform: faqRef.visible ? "translateY(0)" : "translateY(24px)",
              transition: "all 0.6s cubic-bezier(0.25,0.46,0.45,0.94)",
            }}
          >
            <span className="section-label mb-6 block justify-center mx-auto w-fit">FAQ</span>
            <h2
              className="text-4xl md:text-5xl font-medium tracking-tight leading-[1.1] mb-4"
              style={{ color: "hsl(var(--aeline-dark))" }}
            >
              Common questions
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((f, i) => (
              <FaqItem key={i} q={f.q} a={f.a} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section id="apply" className="px-2 md:px-4 pt-4 md:pt-8">
        <div className="relative overflow-hidden rounded-[40px] py-28 px-8 md:px-12">
          <img
            src={featureHeroBg}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="cloud-overlay" style={{ opacity: 0.15 }} />
          <div className="relative max-w-4xl mx-auto z-10 text-center">
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-medium tracking-tight leading-[1.08] mb-6 text-white">
              Ready to start?
            </h2>
            <p className="text-base md:text-lg mb-10 max-w-xl mx-auto leading-relaxed text-white/80">
              Become an Intentsly partner today and start earning $29/month per client — forever.
            </p>
            <div className="flex justify-center">
              <PartnerCTA />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

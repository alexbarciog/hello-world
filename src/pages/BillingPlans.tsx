import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, ChevronDown, ChevronUp, MessageSquare, Zap, Clock } from "lucide-react";
import gojiIcon from "@/assets/gojiberry-icon.png";

// ─── Billing Period Toggle ───────────────────────────────────────────────────
type Period = "monthly" | "quarterly" | "annually";

const PRICES: Record<Period, number> = { monthly: 99, quarterly: 89, annually: 79 };

// ─── FAQ Item ────────────────────────────────────────────────────────────────
const faqs = [
  {
    q: "What happens after the 7-day trial?",
    a: "After your trial ends, your subscription automatically continues at $99/month. You can cancel anytime with one click inside your dashboard — no hidden fees.",
  },
  {
    q: "Can I cancel before the trial ends?",
    a: "Yes. If you cancel before the 7 days are over, you don't pay anything.",
  },
  {
    q: "Will I actually get leads during the trial?",
    a: "Absolutely. As soon as you sign up, your GojiBerry agent starts running and finds warm leads that match your ICP. You'll start seeing results within hours.",
  },
  {
    q: "Are the leads verified?",
    a: "Yes. Every lead is enriched and verified (email/LinkedIn) to ensure they fit your ideal customer profile. No fake data.",
  },
  {
    q: "What kind of results can I expect?",
    a: "Most users receive their first qualified leads within 24 hours. Many book their first meetings while still on the trial.",
  },
  {
    q: "Do I need to create campaigns myself?",
    a: "No. Our AI automatically creates smart outreach campaigns for you. You just review, tweak if you want, and launch.",
  },
  {
    q: "Can I customize my campaigns?",
    a: "Yes. You can fully edit the messaging, number of steps, and targeting. The AI gives you a ready-to-go campaign, but you stay in control.",
  },
  {
    q: "Is there any long-term commitment?",
    a: "No. It's a monthly subscription, and you can cancel at any time without penalties. We also provide discounts on quarter and annual payments.",
  },
  {
    q: "How does billing work?",
    a: "You'll be charged nothing today for the 7-day trial. If you continue, billing automatically switches to $99/month (you can cancel anytime).",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="bg-white border border-gray-200 rounded-xl overflow-hidden transition-shadow hover:shadow-sm cursor-pointer"
      onClick={() => setOpen((o) => !o)}
    >
      <div className="flex items-center justify-between px-5 py-4">
        <p className="text-sm font-semibold text-gray-900">{q}</p>
        {open ? (
          <ChevronUp className="w-4 h-4 text-gray-400 shrink-0 ml-4" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 ml-4" />
        )}
      </div>
      {open && (
        <div className="px-5 pb-4 animate-fade-in">
          <p className="text-sm text-blue-500 leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

const features = [
  "Unlimited Leads",
  "Track 30+ intent signals",
  "Connect 2 LinkedIn accounts",
  "Run unlimited LinkedIn campaigns",
  "AI-powered outreach with smart lead scoring",
  "CRM & API integrations (HubSpot, Pipedrive…)",
  "Unlimited imports + exports",
  "100 verified emails included per month",
  "Priority support",
  "Advanced analytics & reporting",
];

const testimonials = [
  {
    name: "Stuart Brent",
    role: "Founder @ SaasyDB (B2B SaaS)",
    initials: "SB",
    color: "hsl(220 20% 35%)",
    quote: '"We made our money back 6× already, and our week is now fully booked with leads GojiberryAI found for us."',
  },
  {
    name: "Alessandro Paladin",
    role: "Co-Founder @ KubaLabs (B2B SaaS)",
    initials: "AP",
    color: "hsl(200 70% 40%)",
    quote: '"We booked 5 demos from just 30 leads found by our AI Agent. Gojiberry gave us direct founder\'s contact info."',
  },
  {
    name: "Maxime Le Morillon",
    role: "Head of Sales (Marketing Agency)",
    initials: "ML",
    color: "hsl(260 60% 45%)",
    quote: '"We used to waste hours prospecting, now we get warm leads with buying intent, every morning in our inbox."',
  },
];

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function BillingPlans() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<Period>("monthly");
  const price = PRICES[period];

  return (
    <div className="min-h-screen" style={{ background: "hsl(220 20% 97%)" }}>
      <div className="max-w-4xl mx-auto px-6 py-14">
        {/* ─── Hero ───────────────────────────────────────────── */}
        <div className="text-center mb-10 animate-fade-in">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-3">
            Grow Your Sales on{" "}
            <span
              style={{
                background: "linear-gradient(135deg, hsl(280 80% 60%), hsl(330 80% 60%))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Auto-Pilot
            </span>
          </h1>
          <p className="text-base text-gray-500 max-w-lg mx-auto leading-relaxed">
            Gojiberry AI tracks intent signals, scores leads, and launches outreach while you focus on closing deals.
          </p>

          {/* Billing toggle */}
          <div className="mt-7 inline-flex items-center gap-1 border border-gray-200 rounded-full px-1.5 py-1.5 bg-white shadow-sm">
            {(["monthly", "quarterly", "annually"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
                  period === p
                    ? "text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                style={
                  period === p
                    ? { background: "linear-gradient(135deg, hsl(5 90% 60%), hsl(330 80% 60%))" }
                    : {}
                }
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
                {p === "quarterly" && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "hsl(50 90% 90%)", color: "hsl(40 80% 35%)" }}>
                    -10%
                  </span>
                )}
                {p === "annually" && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "hsl(50 90% 90%)", color: "hsl(40 80% 35%)" }}>
                    -20%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ─── Pricing Card ───────────────────────────────────── */}
        <div
          className="rounded-2xl overflow-hidden flex shadow-lg animate-fade-in mb-4"
          style={{ animationDelay: "0.1s" }}
        >
          {/* Left – price */}
          <div
            className="w-[260px] shrink-0 flex flex-col items-center justify-center px-8 py-10"
            style={{ background: "hsl(5 85% 96%)" }}
          >
            {/* Badge */}
            <div
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold text-white mb-6 shadow-sm"
              style={{
                background: "linear-gradient(135deg, hsl(5 90% 60%), hsl(330 80% 60%))",
              }}
            >
              ⭐ Most Popular Choice
            </div>

            {/* Price */}
            <div className="flex items-end gap-1 mb-1">
              <span className="text-5xl font-extrabold text-gray-900 leading-none">${price}</span>
              <span className="text-base text-gray-500 mb-1">/ month</span>
            </div>
            <p className="text-sm text-gray-400 mb-8">per user</p>

            {/* View invoices */}
            <button
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all hover:brightness-95"
              style={{ background: "hsl(142 60% 87%)", color: "hsl(142 60% 30%)" }}
            >
              ✓ View invoices
            </button>
            <button className="mt-3 text-xs font-medium text-blue-500 hover:underline transition-colors">
              Cancel Subscription
            </button>
          </div>

          {/* Right – features */}
          <div className="flex-1 bg-white px-8 py-8">
            <h2 className="text-xl font-extrabold text-gray-900 mb-1">
              Everything You Need to Scale Your Business
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Join thousands of businesses already generating warm leads with GojiberryAI
            </p>

            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              {features.map((f) => (
                <div key={f} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "hsl(142 60% 45%)" }} />
                  <span className="text-sm text-gray-700">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 5+ seats note */}
        <p className="text-center text-sm text-gray-400 mb-16">
          5+ seats or custom needs?{" "}
          <a href="mailto:hello@gojiberry.ai" className="font-medium hover:underline" style={{ color: "hsl(var(--goji-coral))" }}>
            Contact us now!
          </a>
        </p>

        {/* ─── Testimonials ────────────────────────────────────── */}
        <div className="mb-16 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <h2 className="text-2xl font-extrabold text-gray-900 text-center mb-2">What Our Customers Say</h2>
          <p className="text-sm text-gray-500 text-center mb-8 max-w-md mx-auto">
            Join hundreds of businesses that have transformed their lead generation with Gojiberry
          </p>

          {/* Decorative blobs */}
          <div className="relative">
            <div className="absolute top-0 left-1/4 w-40 h-40 rounded-full opacity-20 pointer-events-none" style={{ background: "hsl(5 85% 75%)", filter: "blur(60px)" }} />
            <div className="absolute bottom-0 right-1/4 w-32 h-32 rounded-full opacity-15 pointer-events-none" style={{ background: "hsl(260 70% 70%)", filter: "blur(50px)" }} />

            <div className="grid grid-cols-3 gap-4 relative">
              {testimonials.map((t, i) => (
                <div
                  key={t.name}
                  className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm animate-fade-in hover:shadow-md transition-shadow"
                  style={{ animationDelay: `${0.1 * i + 0.2}s` }}
                >
                  {/* Quote mark */}
                  <div
                    className="text-4xl font-serif leading-none mb-3"
                    style={{ color: "hsl(5 85% 85%)" }}
                  >
                    "
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ background: t.color }}
                    >
                      {t.initials}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{t.name}</p>
                      <p className="text-xs text-gray-500">{t.role}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed italic mb-4">{t.quote}</p>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} viewBox="0 0 24 24" fill="hsl(45 93% 57%)" className="w-4 h-4">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Feature Highlights ──────────────────────────────── */}
        <div className="grid grid-cols-3 gap-8 mb-16 animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "hsl(210 90% 92%)" }}>
              <Zap className="w-6 h-6" style={{ color: "hsl(210 80% 50%)" }} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">AI-Powered</p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">Advanced AI algorithms find your perfect customers automatically</p>
            </div>
          </div>
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "hsl(142 60% 90%)" }}>
              <CheckCircle2 className="w-6 h-6" style={{ color: "hsl(142 60% 40%)" }} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Quality Guaranteed</p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">Every lead is verified and matches your ideal customer profile</p>
            </div>
          </div>
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "hsl(270 60% 92%)" }}>
              <Clock className="w-6 h-6" style={{ color: "hsl(270 60% 50%)" }} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Time Saving</p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">Automated lead generation runs 24/7 while you focus on closing deals</p>
            </div>
          </div>
        </div>

        {/* ─── Enterprise Section ──────────────────────────────── */}
        <div
          className="rounded-2xl text-center px-10 py-12 mb-16 animate-fade-in"
          style={{ background: "hsl(220 20% 97%)", border: "1px solid hsl(220 15% 90%)" }}
        >
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Need 5+ seats?</h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto mb-6 leading-relaxed">
            Get custom pricing for high-volume credit packages, dedicated support, and enterprise features.
          </p>
          <div className="flex items-center justify-center gap-8 mb-8">
            {["Volume discounts available", "Dedicated account manager", "Custom integrations"].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "hsl(142 60% 45%)" }} />
                <span className="text-sm text-gray-600">{item}</span>
              </div>
            ))}
          </div>
          <button
            className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 shadow-md hover:shadow-lg"
            style={{ background: "hsl(222 35% 18%)" }}
          >
            <MessageSquare className="w-4 h-4" />
            Contact Sales Team
          </button>
        </div>

        {/* ─── FAQ ─────────────────────────────────────────────── */}
        <div className="animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <h2 className="text-2xl font-extrabold text-gray-900 text-center mb-2">Frequently Asked Questions</h2>
          <p className="text-sm text-gray-500 text-center mb-8">Everything you need to know about our trial and service</p>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { ArrowUpRight, CheckCircle2, BookOpen, Mail, Zap } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/CTAFooter";
import heroSkyBg from "@/assets/hero-sky-bg.webp";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Playbook() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error("Please enter a valid email");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-playbook", {
        body: { email: trimmed, name: name.trim() },
      });
      if (error) throw error;
      if (data && (data as any).success === false) throw new Error((data as any).error || "Send failed");
      setSent(true);
      toast.success("Playbook sent — check your inbox");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Could not send playbook. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero with sky background */}
      <section className="relative min-h-[88vh] flex flex-col items-center justify-center overflow-hidden">
        <img
          src={heroSkyBg}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          aria-hidden="true"
        />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 pt-28 md:pt-36 pb-16">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-16 items-center">
            {/* Left: Pitch */}
            <div className="text-center lg:text-left">
              <div
                className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-md border border-white/25 px-3.5 py-1.5 mb-6 animate-fade-in-up"
              >
                <span className="relative flex h-2 w-2">
                  <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C8FF00] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C8FF00]" />
                </span>
                <Zap className="w-3 h-3 text-[#C8FF00]" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-white">
                  Free Playbook · 90 Days
                </span>
              </div>

              <h1
                className="text-[2rem] sm:text-5xl md:text-6xl lg:text-[4.25rem] font-medium text-white leading-[1.05] tracking-tight mb-5 animate-fade-in-up"
                style={{ animationDelay: "80ms" }}
              >
                0 to 100 customers
                <span className="block text-white/70">in 90 days.</span>
              </h1>

              <p
                className="text-base md:text-lg text-white/80 max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed animate-fade-in-up"
                style={{ animationDelay: "180ms" }}
              >
                The exact tactics, scripts and intent signals we use to take B2B startups from cold start to their first 100 paying customers. No fluff — built from real campaigns.
              </p>

              <ul
                className="space-y-2.5 max-w-md mx-auto lg:mx-0 mb-8 animate-fade-in-up"
                style={{ animationDelay: "240ms" }}
              >
                {[
                  "Week-by-week 90-day execution roadmap",
                  "ICP & intent signal frameworks that convert",
                  "Outreach scripts (LinkedIn + email) with reply rates",
                  "Pricing & first-100 customer pipeline math",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-white/90 text-sm md:text-base text-left">
                    <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-[#C8FF00] mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <p
                className="text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-white/70 animate-fade-in-up"
                style={{ animationDelay: "320ms" }}
              >
                Free · Sent instantly · No credit card
              </p>
            </div>

            {/* Right: Glassmorphism form card */}
            <div className="animate-fade-in-up" style={{ animationDelay: "360ms" }}>
              <div className="rounded-3xl bg-white/15 backdrop-blur-xl border border-white/25 shadow-2xl p-7 md:p-9">
                {sent ? (
                  <div className="text-center py-6">
                    <div className="w-14 h-14 mx-auto rounded-full bg-[#C8FF00] flex items-center justify-center mb-5">
                      <Mail className="w-7 h-7 text-[#0B2545]" />
                    </div>
                    <h2 className="text-2xl font-medium text-white mb-2">Check your inbox</h2>
                    <p className="text-white/80 text-sm">
                      We just sent the playbook to{" "}
                      <span className="font-semibold text-white">{email}</span>. It usually arrives within a minute.
                    </p>
                    <button
                      onClick={() => {
                        setSent(false);
                        setEmail("");
                        setName("");
                      }}
                      className="mt-6 text-sm text-[#C8FF00] hover:text-white font-semibold transition-colors"
                    >
                      Send to another email →
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="mb-2">
                      <div className="inline-flex items-center gap-2 mb-3">
                        <BookOpen className="w-4 h-4 text-[#C8FF00]" />
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-white/80">
                          The Playbook
                        </span>
                      </div>
                      <h2 className="text-2xl font-medium text-white mb-1">Get it free.</h2>
                      <p className="text-sm text-white/75">Sent to your inbox instantly.</p>
                    </div>

                    <div>
                      <label htmlFor="name" className="block text-[11px] font-semibold uppercase tracking-wider text-white/80 mb-1.5">
                        First name <span className="text-white/50 font-normal normal-case tracking-normal">(optional)</span>
                      </label>
                      <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={80}
                        placeholder="Alex"
                        className="w-full px-4 py-3 rounded-xl bg-white/15 backdrop-blur-md border border-white/25 text-white placeholder-white/50 text-sm focus:outline-none focus:border-[#C8FF00] focus:bg-white/20 transition-colors"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-[11px] font-semibold uppercase tracking-wider text-white/80 mb-1.5">
                        Work email
                      </label>
                      <input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        maxLength={255}
                        placeholder="alex@company.com"
                        className="w-full px-4 py-3 rounded-xl bg-white/15 backdrop-blur-md border border-white/25 text-white placeholder-white/50 text-sm focus:outline-none focus:border-[#C8FF00] focus:bg-white/20 transition-colors"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-cta btn-shimmer group w-full justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loading ? "Sending..." : (
                        <>
                          Get Playbook
                          <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-0.5" />
                        </>
                      )}
                    </button>

                    <p className="text-[10px] text-white/60 text-center leading-relaxed">
                      By submitting, you agree to receive the playbook and occasional follow-ups. Unsubscribe anytime.
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

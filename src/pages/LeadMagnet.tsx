import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { ArrowUpRight, BookOpen, CheckCircle2, ExternalLink, Mail, Zap } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/CTAFooter";
import heroSkyBg from "@/assets/hero-sky-bg.webp";
import { toast } from "sonner";
import NotFound from "./NotFound";
import { applySeo } from "@/lib/seo";
import { leadMagnetUrl, requestLeadMagnet, signupSource, useLeadMagnet } from "@/lib/leadMagnets";
import { ttqSubmitForm, ttqViewContent } from "@/lib/tiktok-pixel";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** A free guide at /free/:slug, read from the `lead_magnets` table. Same layout as /signal-playbook. */
export default function LeadMagnet() {
  const { slug } = useParams<{ slug: string }>();
  const { search } = useLocation();
  const { data: magnet, isLoading } = useLeadMagnet(slug);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  // Set once the guide is on its way (or the email failed but the link works).
  const [done, setDone] = useState<{ assetUrl: string; emailed: boolean } | null>(null);

  useEffect(() => {
    if (magnet) {
      ttqViewContent(`Lead magnet: ${magnet.title}`, `lead-magnet-${magnet.slug}`);
      return applySeo({
        title: `${magnet.title} | Intentsly`,
        description: magnet.subtitle || magnet.title,
        url: leadMagnetUrl(magnet.slug),
      });
    }
    if (!isLoading && slug) {
      // The SPA fallback answers 200 for unknown slugs, so keep them out of the index.
      return applySeo({
        title: "Guide not found | Intentsly",
        description: "This guide does not exist or is no longer available.",
        url: leadMagnetUrl(slug),
        noindex: true,
      });
    }
  }, [magnet, isLoading, slug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!magnet) return;
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      toast.error("Please enter a valid email");
      return;
    }
    setLoading(true);
    try {
      const result = await requestLeadMagnet({
        slug: magnet.slug,
        email: trimmed,
        name: name.trim(),
        source: signupSource(search),
      });
      if (result.status === "error") {
        toast.error(result.message);
        return;
      }
      setDone({ assetUrl: result.assetUrl, emailed: result.status === "sent" });
      ttqSubmitForm(`Lead magnet: ${magnet.title}`, `lead-magnet-${magnet.slug}`);
    } finally {
      setLoading(false);
    }
  }

  if (!magnet) {
    // Keep the hero background while the row loads; unknown slugs get the 404 page.
    return isLoading ? <div className="min-h-screen bg-white"><Navbar /></div> : <NotFound />;
  }

  const bullets = Array.isArray(magnet.bullets) ? magnet.bullets.filter((b) => typeof b === "string" && b.trim()) : [];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="relative min-h-[88vh] flex flex-col items-center justify-center overflow-hidden">
        <img
          src={heroSkyBg}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
          style={{
            background:
              "linear-gradient(90deg, rgba(8,18,40,0.55) 0%, rgba(8,18,40,0.35) 40%, rgba(8,18,40,0.1) 75%, rgba(8,18,40,0) 100%)",
          }}
        />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 pt-28 md:pt-36 pb-16">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-16 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-md border border-white/25 px-3.5 py-1.5 mb-6 animate-fade-in-up">
                <span className="relative flex h-2 w-2">
                  <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C8FF00] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C8FF00]" />
                </span>
                <Zap className="w-3 h-3 text-[#C8FF00]" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-white">
                  Free guide
                </span>
              </div>

              <h1
                className="text-[2rem] sm:text-5xl md:text-6xl lg:text-[4.25rem] font-medium text-white leading-[1.05] tracking-tight mb-5 animate-fade-in-up"
                style={{ animationDelay: "80ms" }}
              >
                {magnet.title}
              </h1>

              {magnet.subtitle && (
                <p
                  className="text-base md:text-lg text-white/80 max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed animate-fade-in-up"
                  style={{ animationDelay: "180ms" }}
                >
                  {magnet.subtitle}
                </p>
              )}

              {bullets.length > 0 && (
                <ul
                  className="space-y-2.5 max-w-md mx-auto lg:mx-0 mb-8 animate-fade-in-up"
                  style={{ animationDelay: "240ms" }}
                >
                  {bullets.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-white/90 text-sm md:text-base text-left">
                      <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-[#C8FF00] mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}

              <p
                className="text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-white/70 animate-fade-in-up"
                style={{ animationDelay: "320ms" }}
              >
                Free · Sent instantly · No credit card
              </p>
            </div>

            <div className="animate-fade-in-up" style={{ animationDelay: "360ms" }}>
              <div className="rounded-3xl bg-white/15 backdrop-blur-xl border border-white/25 shadow-2xl p-7 md:p-9">
                {done ? (
                  <div className="text-center py-6">
                    <div className="w-14 h-14 mx-auto rounded-full bg-[#C8FF00] flex items-center justify-center mb-5">
                      <Mail className="w-7 h-7 text-[#0B2545]" />
                    </div>
                    {done.emailed ? (
                      <>
                        <h2 className="text-2xl font-medium text-white mb-2">Check your inbox</h2>
                        <p className="text-white/80 text-sm">
                          We just sent the guide to <span className="font-semibold text-white">{email}</span>. It
                          usually arrives within a minute.
                        </p>
                      </>
                    ) : (
                      <>
                        <h2 className="text-2xl font-medium text-white mb-2">Your guide is ready</h2>
                        <p className="text-white/80 text-sm">
                          We couldn't send the email just now, so open the guide here.
                        </p>
                      </>
                    )}
                    <div className="mt-6">
                      <a
                        href={done.assetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-cta group justify-center"
                      >
                        Open it now
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                    <button
                      onClick={() => {
                        setDone(null);
                        setEmail("");
                        setName("");
                      }}
                      className="block mx-auto mt-6 text-sm text-[#C8FF00] hover:text-white font-semibold transition-colors"
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
                          The guide
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
                        autoComplete="given-name"
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
                        autoComplete="email"
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
                          Send it to me
                          <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-0.5" />
                        </>
                      )}
                    </button>

                    <p className="text-[10px] text-white/60 text-center leading-relaxed">
                      By submitting, you agree to receive the guide and occasional follow-ups. Unsubscribe anytime.
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

import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { ArrowRight, Check, Mail } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/CTAFooter";
import heroGradient from "@/assets/hero-gradient-right.png";
import NotFound from "./NotFound";
import { applySeo } from "@/lib/seo";
import { leadMagnetPath, leadMagnetSeo, leadMagnetUrl, requestLeadMagnet, signupSource, useLeadMagnet } from "@/lib/leadMagnets";
import { LEAD_MAGNET_EXTRAS, coverFor } from "@/data/leadMagnetExtras";
import { ttqSubmitForm, ttqViewContent } from "@/lib/tiktok-pixel";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BLUE = "#1A8FE3";

// The homepage's light grid, faded out towards the edges.
const gridStyle: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(to right, rgba(10,10,10,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(10,10,10,0.05) 1px, transparent 1px)",
  backgroundSize: "56px 56px",
  maskImage: "radial-gradient(ellipse 80% 70% at 50% 30%, #000 40%, transparent 100%)",
  WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 50% 30%, #000 40%, transparent 100%)",
};

type Done = { assetUrl: string; emailed: boolean; email: string };

/** A free guide at /free/:slug, read from the `lead_magnets` table. */
export default function LeadMagnet() {
  const { slug } = useParams<{ slug: string }>();
  const { search } = useLocation();
  const { data: magnet, isLoading } = useLeadMagnet(slug);
  const extras = slug ? LEAD_MAGNET_EXTRAS[slug] : undefined;
  const cover = slug ? coverFor(slug) : null;
  // A guide without a cover file yet falls back to the drawn card.
  const [coverFailed, setCoverFailed] = useState(false);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Done | null>(null);

  useEffect(() => {
    if (magnet) {
      ttqViewContent(`Lead magnet: ${magnet.title}`, `lead-magnet-${magnet.slug}`);
      return applySeo({ ...leadMagnetSeo(magnet), url: leadMagnetUrl(magnet.slug) });
    }
    if (!isLoading && slug) {
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
    if (!magnet || loading) return;
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setError("Please enter a valid work email.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await requestLeadMagnet({
        slug: magnet.slug,
        email: trimmed,
        name: name.trim(),
        source: signupSource(search, typeof document !== "undefined" ? document.referrer : ""),
      });
      if (result.status === "error") {
        setError(result.message);
        return;
      }
      setDone({ assetUrl: result.assetUrl, emailed: result.status === "sent", email: trimmed });
      ttqSubmitForm(`Lead magnet: ${magnet.title}`, `lead-magnet-${magnet.slug}`);
    } finally {
      setLoading(false);
    }
  }

  if (!magnet) {
    return isLoading ? <div className="min-h-screen bg-white"><Navbar /></div> : <NotFound />;
  }

  const bullets = Array.isArray(magnet.bullets) ? magnet.bullets.filter((b) => typeof b === "string" && b.trim()) : [];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="relative overflow-hidden bg-white">
        <div className="absolute inset-0 pointer-events-none" style={gridStyle} aria-hidden="true" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-5 md:px-8 pt-24 md:pt-32 pb-14 md:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-12 items-center">
            {/* Copy + form */}
            <div>
              <span className="inline-flex items-center rounded-full bg-[#C8FF00] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#0a0a0a] mb-5">
                Free guide
              </span>
              <h1
                className="font-semibold tracking-[-0.03em] leading-[1.04] text-[#0a0a0a] mb-4"
                style={{ fontSize: "clamp(2.1rem, 5vw, 4rem)" }}
              >
                {magnet.title}
              </h1>
              {magnet.subtitle && (
                <p className="text-base md:text-lg text-neutral-500 leading-relaxed max-w-xl mb-6">{magnet.subtitle}</p>
              )}
              {bullets.length > 0 && (
                <ul className="space-y-2.5 mb-8 max-w-xl">
                  {bullets.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-[15px] text-neutral-800">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: `${BLUE}1A` }}>
                        <Check className="h-3.5 w-3.5" style={{ color: BLUE }} strokeWidth={3} />
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="max-w-md rounded-2xl border border-neutral-200 bg-white/90 backdrop-blur p-5 md:p-6 shadow-sm">
                {done ? (
                  <div aria-live="polite">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#C8FF00] mb-4">
                      <Mail className="h-5 w-5 text-[#0a0a0a]" />
                    </div>
                    {done.emailed ? (
                      <p className="text-[15px] text-neutral-800 leading-relaxed">
                        <span className="font-semibold text-[#0a0a0a]">Check your inbox.</span> The guide is on its way to{" "}
                        <span className="font-semibold text-[#0a0a0a] break-all">{done.email}</span>.
                      </p>
                    ) : (
                      <p className="text-[15px] text-neutral-800 leading-relaxed">
                        We couldn't send the email, but here's your guide:
                      </p>
                    )}
                    <a
                      href={done.assetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1 text-sm font-semibold hover:underline"
                      style={{ color: BLUE }}
                    >
                      {done.emailed ? "Or open it now" : "Open the guide"} <ArrowRight className="h-4 w-4" />
                    </a>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} noValidate className="space-y-3">
                    <div>
                      <label htmlFor="lm-name" className="block text-sm font-medium text-neutral-800 mb-1.5">
                        First name <span className="font-normal text-neutral-400">(optional)</span>
                      </label>
                      <input
                        id="lm-name"
                        type="text"
                        autoComplete="given-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={80}
                        className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-[15px] text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#1A8FE3] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label htmlFor="lm-email" className="block text-sm font-medium text-neutral-800 mb-1.5">
                        Work email
                      </label>
                      <input
                        id="lm-email"
                        type="email"
                        required
                        autoComplete="email"
                        inputMode="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (error) setError(null);
                        }}
                        maxLength={255}
                        placeholder="you@company.com"
                        aria-invalid={Boolean(error)}
                        aria-describedby={error ? "lm-error" : undefined}
                        className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-[15px] text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#1A8FE3] focus:border-transparent aria-[invalid=true]:border-red-400"
                      />
                    </div>
                    {error && (
                      <p id="lm-error" role="alert" className="text-sm text-red-600">{error}</p>
                    )}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#C8FF00] px-6 py-3.5 text-[15px] font-semibold text-[#0a0a0a] hover:brightness-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loading ? "Sending…" : "Send me the guide"}
                      {!loading && <ArrowRight className="h-4 w-4" />}
                    </button>
                    <p className="text-xs text-neutral-500 text-center">Free. We'll email you the PDF. Unsubscribe anytime.</p>
                  </form>
                )}
              </div>
              {extras?.crossLink && (
                <a
                  href={leadMagnetPath(extras.crossLink.slug)}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-semibold hover:underline"
                  style={{ color: BLUE }}
                >
                  {extras.crossLink.text} <ArrowRight className="h-4 w-4" />
                </a>
              )}
            </div>

            {/* Cover on the gradient panel */}
            <div className="relative overflow-hidden rounded-3xl min-h-[380px] sm:min-h-[480px] lg:min-h-[600px] flex items-center justify-center p-8 sm:p-12">
              <img src={heroGradient} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
              {cover && !coverFailed ? (
                <img
                  src={cover}
                  onError={() => setCoverFailed(true)}
                  alt={`Cover of ${magnet.title}`}
                  width={900}
                  height={1274}
                  className="relative w-[62%] sm:w-[55%] lg:w-[64%] max-w-[380px] h-auto rounded-lg rotate-[4deg] shadow-[0_30px_60px_-15px_rgba(10,20,40,0.45)]"
                />
              ) : (
                <div className="relative w-[60%] max-w-[340px] aspect-[1/1.414] rounded-lg bg-white rotate-[4deg] shadow-[0_30px_60px_-15px_rgba(10,20,40,0.45)] p-6 flex flex-col">
                  <span className="text-xs font-semibold" style={{ color: BLUE }}>Intentsly</span>
                  <span className="mt-auto text-2xl font-semibold tracking-tight text-[#0a0a0a] leading-tight">{magnet.title}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {(extras?.inside || extras?.tagline) && (
        <section className="px-4 sm:px-5 md:px-8 pb-16 md:pb-24">
          <div className="max-w-7xl mx-auto">
            {extras.inside && (
              <>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em] text-[#0a0a0a] mb-6 md:mb-8">
                {extras.inside.heading}
              </h2>
              <ol className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {extras.inside.items.map((item, i) => (
                  <li key={item} className="rounded-2xl border border-neutral-200 bg-white p-4 md:p-5">
                    <span className="block text-xs font-semibold mb-1.5" style={{ color: BLUE }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="block text-sm md:text-[15px] font-medium text-neutral-900 leading-snug">{item}</span>
                  </li>
                ))}
              </ol>
              </>
            )}

            {extras.tagline && (
              <p
                className="mt-12 md:mt-16 text-center font-semibold tracking-[-0.02em] text-[#0a0a0a]"
                style={{ fontSize: "clamp(1.6rem, 4vw, 2.75rem)" }}
              >
                <span
                  className="px-2 box-decoration-clone"
                  style={{ backgroundImage: "linear-gradient(transparent 55%, #C8FF00 55%, #C8FF00 92%, transparent 92%)" }}
                >
                  {extras.tagline}
                </span>
              </p>
            )}

            <div className="mt-10 md:mt-14 rounded-3xl bg-neutral-50 border border-neutral-200 p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-[#0a0a0a]">
                  Intentsly watches for these signals for you
                </h2>
                <p className="mt-1 text-sm md:text-[15px] text-neutral-500">
                  Ask our AI who in your market is showing these signals right now.
                </p>
              </div>
              <a
                href="/try-ai"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0a0a0a] px-5 py-3 text-sm font-semibold text-white hover:bg-neutral-800 transition-colors shrink-0"
              >
                Try Intentsly AI <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}

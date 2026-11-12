import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/CTAFooter";
import { applySeo } from "@/lib/seo";
import { SITE_URL } from "@/lib/blog";
import { LEAD_MAGNET_INDEX, leadMagnetPath, useLeadMagnets, type LeadMagnet } from "@/lib/leadMagnets";
import { coverFor } from "@/data/leadMagnetExtras";

const gridStyle: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(to right, rgba(10,10,10,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(10,10,10,0.05) 1px, transparent 1px)",
  backgroundSize: "56px 56px",
  maskImage: "radial-gradient(ellipse 80% 70% at 50% 0%, #000 40%, transparent 100%)",
  WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 50% 0%, #000 40%, transparent 100%)",
};

function GuideCard({ guide }: { guide: LeadMagnet }) {
  const cover = coverFor(guide.slug);
  const [coverFailed, setCoverFailed] = useState(false);
  return (
    <a
      href={leadMagnetPath(guide.slug)}
      className="group flex flex-col rounded-3xl border border-neutral-200 bg-white overflow-hidden hover:border-neutral-300 hover:shadow-sm transition"
    >
      <div className="relative aspect-[4/3] bg-gradient-to-br from-[#E6FF8A] via-[#9BE8D8] to-[#5AA9F0] flex items-center justify-center overflow-hidden">
        {cover && !coverFailed ? (
          <img
            src={cover}
            onError={() => setCoverFailed(true)}
            alt=""
            loading="lazy"
            className="w-[46%] h-auto rounded-md rotate-[4deg] shadow-[0_20px_40px_-12px_rgba(10,20,40,0.45)] transition-transform group-hover:rotate-[2deg]"
          />
        ) : (
          <span className="px-6 text-center text-xl font-semibold tracking-tight text-[#0a0a0a]">{guide.title}</span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5 md:p-6">
        <span className="inline-flex w-fit items-center rounded-full bg-[#C8FF00] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#0a0a0a] mb-3">
          Free guide
        </span>
        <h2 className="text-xl font-semibold tracking-tight text-[#0a0a0a]">{guide.title}</h2>
        {guide.subtitle && <p className="mt-2 text-sm text-neutral-500 leading-relaxed">{guide.subtitle}</p>}
        <span className="mt-auto pt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#1A8FE3]">
          Get the guide <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </a>
  );
}

/** /free — every active guide from `lead_magnets`. */
export default function LeadMagnetIndex() {
  const { data: guides } = useLeadMagnets();

  useEffect(
    () => applySeo({ title: LEAD_MAGNET_INDEX.title, description: LEAD_MAGNET_INDEX.description, url: `${SITE_URL}${LEAD_MAGNET_INDEX.path}` }),
    [],
  );

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={gridStyle} aria-hidden="true" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-5 md:px-8 pt-24 md:pt-32 pb-16 md:pb-24">
          <span className="inline-flex items-center rounded-full bg-[#C8FF00] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#0a0a0a] mb-5">
            Free guides
          </span>
          <h1
            className="font-semibold tracking-[-0.03em] leading-[1.04] text-[#0a0a0a] mb-4"
            style={{ fontSize: "clamp(2.1rem, 5vw, 3.5rem)" }}
          >
            Find the buyers already asking
          </h1>
          <p className="text-base md:text-lg text-neutral-500 leading-relaxed max-w-2xl mb-10 md:mb-14">
            Free guides on spotting B2B buying intent on LinkedIn and what to say to the people showing it. Enter your
            email and we send you the guide.
          </p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {(guides ?? []).map((g) => (
              <GuideCard key={g.slug} guide={g} />
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}

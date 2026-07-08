import { ArrowRight, Play } from "lucide-react";
import HeroFloatingCards from "./HeroFloatingCards";
import heroGradient from "@/assets/hero-gradient-right.png";
import { CountUp } from "@/lib/motion";

const Hero = () => {
  return (
    <section className="relative w-full bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-8 pt-16 md:pt-24 pb-16 md:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-8 items-center">
          {/* LEFT — copy */}
          <div className="relative z-10">
            {/* Urgency badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 mb-8 shadow-sm animate-fade-in-up">
              <span className="text-base leading-none">🔥</span>
              <span className="text-[13px] font-semibold text-neutral-900">
                <CountUp to={127} /> buyers showed intent in the last hour
              </span>
            </div>

            <h1
              className="font-medium tracking-[-0.03em] leading-[1.02] text-[#0a0a0a] animate-fade-in-up"
              style={{ animationDelay: "80ms", fontSize: "clamp(2.75rem, 6.2vw, 5.25rem)" }}
            >
              Find people already looking for what you offer on{" "}
              <span className="text-[#3B82F6]">LinkedIn</span>
            </h1>

            <p
              className="mt-7 text-lg md:text-xl text-neutral-500 leading-relaxed max-w-xl animate-fade-in-up"
              style={{ animationDelay: "180ms" }}
            >
              AI agents detect intent signals on LinkedIn — so you reach the right people at the right moment, before your competitors do.
            </p>

            <div
              className="mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 animate-fade-in-up"
              style={{ animationDelay: "260ms" }}
            >
              <a
                href="/register"
                className="inline-flex items-center justify-center gap-2 bg-[#0a0a0a] text-white text-[15px] font-semibold rounded-xl px-6 py-4 hover:bg-neutral-800 transition-colors"
              >
                Start for $97
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="https://www.loom.com/share/3dc9408fe0da4b979cb5642333f4b500"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-white text-[#0a0a0a] text-[15px] font-semibold rounded-xl px-6 py-4 border border-neutral-200 hover:bg-neutral-50 transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Watch demo
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            <p
              className="mt-5 text-xs uppercase tracking-[0.14em] text-neutral-400 animate-fade-in-up"
              style={{ animationDelay: "340ms" }}
            >
              No contract · Cancel anytime · 5-min setup
            </p>
          </div>

          {/* RIGHT — gradient + floating cards */}
          <div className="relative">
            <div className="relative rounded-[28px] overflow-hidden aspect-[4/5] lg:aspect-auto lg:min-h-[620px]">
              <img
                src={heroGradient}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* Cards overlay */}
              <div className="absolute inset-0 p-4 lg:p-6">
                <HeroFloatingCards />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

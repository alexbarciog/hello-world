import { ArrowUpRight, Star, Play, ChevronDown, Zap } from "lucide-react";
import HeroCards from "./HeroCards";
import heroSkyBg from "@/assets/hero-sky-bg.webp";
import { CountUp } from "@/lib/motion";

const Hero = () => {
  return (
    <section className="relative min-h-[88vh] md:min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Sky background image */}
      <img
        src={heroSkyBg}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-7xl mx-auto w-full pt-24 md:pt-36">
        {/* Urgency badge */}
        <div
          className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-md border border-white/25 px-3.5 py-1.5 mb-6 animate-fade-in-up motion-safe:animate-float"
          style={{ animationDelay: "0ms" }}
        >
          <span className="relative flex h-2 w-2">
            <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C8FF00] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C8FF00]" />
          </span>
          <Zap className="w-3 h-3 text-[#C8FF00]" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-white">
            <CountUp to={127} />
            <span className="sm:hidden"> buyers showed intent today</span>
            <span className="hidden sm:inline"> buyers showed intent in the last hour</span>
          </span>
        </div>

        <h1 className="text-[2rem] sm:text-5xl md:text-7xl lg:text-[5.5rem] font-medium text-white leading-[1.1] md:leading-[1.05] tracking-tight mb-6 text-center animate-fade-in-up" style={{ animationDelay: "80ms" }}>
          <span className="block">Find people already</span>
          <span className="block">looking for what</span>
          <span className="flex items-center justify-center gap-2 md:gap-3 flex-wrap">
            <span>you offer</span>
            <span className="text-white/70 inline-flex items-center gap-2 md:gap-3">
              <span>on</span>
              <span className="inline-flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16">
                <svg viewBox="0 0 24 24" className="w-full h-full text-white" fill="currentColor" aria-label="LinkedIn">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </span>
            </span>
          </span>
        </h1>

        <p className="text-base md:text-lg text-white/80 max-w-xl mb-8 leading-relaxed animate-fade-in-up" style={{ animationDelay: "180ms" }}>
          AI agents detect intent signals on LinkedIn — so you reach the right people at the right moment, before your competitors do.
        </p>

        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto animate-fade-in-up" style={{ animationDelay: "260ms" }}>
          <a href="/register" className="btn-cta btn-shimmer group w-full sm:w-auto justify-center">
            Start for $97
            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-0.5" />
          </a>
          <a href="#how-it-works" className="btn-outline group w-full sm:w-auto justify-center">
            <Play className="w-3.5 h-3.5 fill-current" />
            Watch 60-sec demo
          </a>
        </div>

        {/* Micro-trust line */}
        <p
          className="mt-5 text-[10px] sm:text-[11px] uppercase tracking-[0.12em] sm:tracking-[0.18em] text-white/70 animate-fade-in-up"
          style={{ animationDelay: "340ms" }}
        >
          No contract · Cancel anytime · 5-min setup
        </p>

        {/* Tilted card carousel */}
        <div className="mt-8 md:mt-12 w-full max-w-6xl mx-auto animate-fade-in-up" style={{ animationDelay: "420ms" }}>
          <div className="card-carousel animate-tilt-in">
            <div className="overflow-hidden md:motion-safe:animate-float" style={{ animationDuration: "8s" }}>
              <HeroCards />
            </div>
          </div>
        </div>

        {/* Rating — single line on mobile */}
        <div className="mt-8 mb-6 flex items-center gap-3 animate-fade-in-up" style={{ animationDelay: "520ms" }}>
          {/* Avatar stack */}
          <div className="flex -space-x-2">
            {[
              "from-pink-400 to-orange-400",
              "from-sky-400 to-indigo-500",
              "from-emerald-400 to-teal-500",
            ].map((g, i) => (
              <div
                key={i}
                className={`w-6 h-6 rounded-full bg-gradient-to-br ${g} ring-2 ring-white/80`}
                aria-hidden
              />
            ))}
          </div>
          <p className="text-xs sm:text-sm text-white/80 flex items-center gap-1.5">
            <span className="font-semibold text-white">500+ teams</span>
            <span className="text-white/40">·</span>
            <span className="inline-flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              4.9/5
            </span>
          </p>
        </div>

        {/* Scroll cue — desktop only */}
        <a
          href="#problem"
          className="mb-10 hidden sm:flex flex-col items-center gap-1 text-white/70 hover:text-white transition-colors animate-fade-in-up"
          style={{ animationDelay: "640ms" }}
        >
          <span className="text-[10px] uppercase tracking-[0.2em]">Scroll to see how</span>
          <ChevronDown className="w-4 h-4 motion-safe:animate-slow-bounce" />
        </a>
      </div>
    </section>
  );
};

export default Hero;

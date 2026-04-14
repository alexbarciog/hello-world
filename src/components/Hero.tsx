import { ArrowUpRight, Star } from "lucide-react";
import HeroCards from "./HeroCards";
import { LinkedInIcon } from "./contacts/LinkedInIcon";
import heroSkyBg from "@/assets/hero-sky-bg.webp";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Sky background image */}
      <img
        src={heroSkyBg}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-7xl mx-auto w-full pt-28 md:pt-36">
        <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-medium text-white leading-[1.05] tracking-tight mb-6 animate-fade-in-up" style={{ animationDelay: "0ms" }}>
          Find People Looking For
          <br />
          <span className="text-white/70 inline-flex items-center gap-2">What You Offer On <span className="inline-block w-12 h-12 md:w-16 md:h-16 align-middle"><svg viewBox="0 0 24 24" className="w-full h-full text-white" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg></span></span>
        </h1>

        <p className="text-base md:text-lg text-white/80 max-w-xl mb-10 leading-relaxed animate-fade-in-up" style={{ animationDelay: "120ms" }}>
          Our AI detects intent signals, scores prospects based on your ideal customers,
          starts relevant conversations on LinkedIn, and books more demos, on autopilot.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: "240ms" }}>
          <a href="https://cal.com/alex-ydvmvi/15-min-meeting" target="_blank" rel="noopener noreferrer" className="btn-outline">
            View Demo
          </a>
          <a href="/register" className="btn-cta">
            Get Started
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>

        {/* Tilted card carousel */}
        <div className="mt-12 w-full max-w-6xl mx-auto animate-fade-in-up" style={{ animationDelay: "360ms" }}>
          <div className="card-carousel">
            <div className="overflow-hidden">
              <HeroCards />
            </div>
          </div>
        </div>

        {/* Rating */}
        <div className="mt-8 mb-12 flex flex-col items-center gap-2 animate-fade-in-up" style={{ animationDelay: "480ms" }}>
          <p className="text-sm text-white/70">Rated 4.9/5 by 500+ clients</p>
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

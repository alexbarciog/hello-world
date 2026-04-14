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
          <span className="text-white/70">What You Offer</span>
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

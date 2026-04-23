import { ArrowUpRight } from "lucide-react";
import ctaBg from "@/assets/cta-bg.avif";

const FinalCTA = () => {
  return (
    <section className="px-2 md:px-4 pt-4 md:pt-8">
      <div className="relative overflow-hidden rounded-[40px] py-28 px-8 md:px-12">
        <img src={ctaBg} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover" />

        <div className="relative max-w-4xl mx-auto z-10 pl-4 md:pl-8">
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-medium tracking-tight leading-[1.08] mb-6 text-white max-w-2xl">
            Spot likely buyers on LinkedIn before everyone else does.
          </h2>
          <p className="text-base md:text-lg mb-10 max-w-xl leading-relaxed text-white/80">
            Stop relying on broad prospect lists and start focusing on the people already showing movement.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <a href="/register" className="btn-cta">
              Start for $97
              <ArrowUpRight className="w-4 h-4" />
            </a>
            <a href="#how-it-works" className="text-sm font-medium text-white/80 hover:text-white transition-colors underline-offset-4 hover:underline">
              See how it works
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;

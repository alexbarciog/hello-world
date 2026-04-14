import { ArrowUpRight } from "lucide-react";
import intentslyIcon from "@/assets/intentsly-icon.png";
import ctaBg from "@/assets/cta-bg.avif";

const CTASection = () => {
  return (
    <section className="px-2 md:px-4 pt-4 md:pt-8">
      <div className="relative overflow-hidden rounded-[40px] py-28 px-8 md:px-12">
        <img src={ctaBg} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover" />

        <div className="relative max-w-4xl mx-auto z-10 pl-4 md:pl-8">
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-medium tracking-tight leading-[1.08] mb-6 text-white max-w-2xl">
            Stop chasing cold leads. Start closing warm ones.
          </h2>
          <p className="text-base md:text-lg mb-10 max-w-xl leading-relaxed text-white/80">
            Your next best customers are already showing buying signals. Let AI find them, reach out, and book meetings — while you focus on selling.
          </p>
          <a href="/register" className="btn-cta">
            Get Started
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="bg-background px-2 md:px-4 pb-4 md:pb-8 pt-4 md:pt-8">
      <div className="mx-auto bg-[#111113] text-white rounded-[40px] px-8 md:px-12 pt-14 pb-8">
        {/* Top section */}
        <div className="flex flex-col lg:flex-row justify-between gap-12 mb-14">
          {/* Left: Logo + description + newsletter */}
          <div className="max-w-md">
            <a href="/" className="flex items-center gap-2.5 mb-6">
              <img alt="Intentsly" className="h-8 object-contain" src={intentslyIcon} />
              <span className="text-lg font-medium tracking-tight text-white">Intentsly</span>
            </a>
            <p className="text-sm text-white/50 leading-relaxed mb-8">
              Detect high-intent buying signals and automate personalized outreach — so you reach warm prospects before your competitors do.
            </p>
            <p className="text-sm text-white mb-4">Subscribe our newsletter</p>
            <div className="flex items-center bg-[#1a1a1e] rounded-full p-1.5 border border-white/10 max-w-sm">
              <input
                type="email"
                placeholder="Enter your email"
                className="bg-transparent text-sm text-white placeholder:text-white/30 px-4 py-2.5 flex-1 focus:outline-none"
              />
              <button className="flex items-center gap-2 bg-[#C8FF00] text-[#111113] text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-full hover:bg-[#d4ff33] transition-colors shrink-0">
                Submit
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right: Link columns */}
          <div className="flex gap-20">
            <div className="flex flex-col gap-4">
              <a href="/#services" className="text-sm text-white/60 hover:text-white transition-colors">Services</a>
              <a href="/#expertise" className="text-sm text-white/60 hover:text-white transition-colors">Expertise</a>
              <a href="/#pricing" className="text-sm text-white/60 hover:text-white transition-colors">Pricing</a>
              <a href="/#testimonials" className="text-sm text-white/60 hover:text-white transition-colors">Testimonials</a>
            </div>
            <div className="flex flex-col gap-4">
              <a href="/privacy" className="text-sm text-white/60 hover:text-white transition-colors">Privacy</a>
              <a href="/terms" className="text-sm text-white/60 hover:text-white transition-colors">Terms</a>
              <a href="/help" className="text-sm text-white/60 hover:text-white transition-colors">Help Center</a>
              <a href="/support" className="text-sm text-white/60 hover:text-white transition-colors">Support</a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <a href="/privacy" className="text-xs text-white/30 hover:text-white/60 transition-colors">Privacy Policy</a>
            <a href="/terms" className="text-xs text-white/30 hover:text-white/60 transition-colors">Terms of Service</a>
          </div>
          <p className="text-xs text-white/30">
            © {new Date().getFullYear()} Intentsly. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export { CTASection, Footer };

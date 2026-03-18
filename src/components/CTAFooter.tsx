import { ArrowUpRight } from "lucide-react";
import gojiIcon from "@/assets/gojiberry-icon.png";

const CTASection = () => {
  return (
    <section
      className="py-28 px-4 relative overflow-hidden"
      style={{
        background: "linear-gradient(180deg, hsl(228 38% 8%) 0%, hsl(228 38% 14%) 100%)",
      }}
    >
      {/* Animated orbs */}
      <div
        className="absolute -top-20 -left-20 w-[600px] h-[400px] rounded-full blur-[120px] opacity-100 animate-[float1_8s_ease-in-out_infinite]"
        style={{ background: "hsl(5 90% 65% / 0.35)" }}
      />
      <div
        className="absolute -bottom-20 -right-20 w-[500px] h-[350px] rounded-full blur-[100px] opacity-100 animate-[float2_10s_ease-in-out_infinite_1s]"
        style={{ background: "hsl(18 95% 58% / 0.25)" }}
      />

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(to right, hsl(0 0% 100% / 0.5) 1px, transparent 1px), linear-gradient(to bottom, hsl(0 0% 100% / 0.5) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      <div className="relative max-w-3xl mx-auto text-center z-10">
        <h2 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-tight mb-6">
          More High-Intent Leads = Your New Growth Engine.
        </h2>
        <p className="text-base md:text-lg text-white/60 mb-10 max-w-xl mx-auto leading-relaxed">
          Start Now and Get New High Intent Leads Delivered Straight to Slack or Your Inbox.
        </p>
        <a
          href="https://app.gojiberry.ai/registration"
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full backdrop-blur-md bg-white/10 border border-white/20 text-white font-medium text-base hover:bg-white/20 hover:shadow-[0_0_40px_rgba(255,255,255,0.12)] transition-all duration-300 hover:scale-[1.02]"
        >
          Launch your AI Agent for free
          <ArrowUpRight className="w-5 h-5" />
        </a>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="border-t border-border bg-background">
      <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <a href="#" className="flex items-center gap-2">
          <img src={gojiIcon} alt="Gojiberry" className="w-6 h-6 object-contain" />
          <span className="font-bold text-base text-goji-dark">gojiberry</span>
        </a>
        <div className="flex items-center gap-8 text-sm text-goji-text-muted">
          <a href="#features" className="hover:text-goji-dark transition-colors">Features</a>
          <a href="#pricing" className="hover:text-goji-dark transition-colors">Pricing</a>
          <a href="#faq" className="hover:text-goji-dark transition-colors">FAQ</a>
          <a href="https://gojiberry.ai/privacy-policy" className="hover:text-goji-dark transition-colors">Privacy</a>
        </div>
        <p className="text-xs text-goji-text-muted">
          © {new Date().getFullYear()} Gojiberry. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export { CTASection, Footer };

import { ArrowUpRight } from "lucide-react";
import gojiIcon from "@/assets/gojiberry-icon.png";

const CTASection = () => {
  return (
    <section
      className="py-28 px-4 relative overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 50% 110%, hsl(5 85% 93%) 0%, hsl(20 90% 95%) 40%, hsl(0 0% 100%) 80%)",
      }}
    >
      {/* Background grid */}
      <div className="absolute inset-0 hero-grid-bg opacity-50" />

      <div className="relative max-w-3xl mx-auto text-center">
        <h2 className="text-4xl md:text-6xl font-extrabold text-goji-dark tracking-tight leading-tight mb-6">
          More High-Intent Leads = Your New Growth Engine.
        </h2>
        <p className="text-base md:text-lg text-goji-text-muted mb-10 max-w-xl mx-auto leading-relaxed">
          Start Now and Get New High Intent Leads Delivered Straight to Slack or Your Inbox.
        </p>
        <a
          href="https://app.gojiberry.ai/registration"
          className="btn-cta text-base"
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

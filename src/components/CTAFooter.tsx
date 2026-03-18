import { ArrowUpRight } from "lucide-react";
import gojiIcon from "@/assets/gojiberry-icon.png";
import footerGradient from "@/assets/footer-gradient.svg";

const CTASection = () => {
  return (
    <section className="py-28 px-4 relative overflow-hidden bg-[#A0BBFF]">
      {/* SVG gradient background */}
      <img
        src={footerGradient}
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
      />

      <div className="relative max-w-3xl mx-auto text-center z-10">
        <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight mb-6"
          style={{ color: "hsl(228 60% 18%)" }}>
          More High-Intent Leads = Your New Growth Engine.
        </h2>
        <p className="text-base md:text-lg mb-10 max-w-xl mx-auto leading-relaxed"
          style={{ color: "hsl(228 40% 30%)" }}>
          Start Now and Get New High Intent Leads Delivered Straight to Slack or Your Inbox.
        </p>
        <a
          href="https://app.gojiberry.ai/registration"
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full backdrop-blur-md border font-medium text-base transition-all duration-300 hover:scale-[1.02]"
          style={{
            background: "rgba(255,255,255,0.25)",
            borderColor: "rgba(255,255,255,0.5)",
            color: "hsl(228 60% 18%)",
            boxShadow: "0 4px 24px 0 rgba(61,71,238,0.15)",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.4)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.25)")}
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

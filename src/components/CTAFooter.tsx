import { ArrowUpRight } from "lucide-react";
import intentslyIcon from "@/assets/intentsly-icon.png";

const CTASection = () => {
  return (
    <section className="py-28 px-4 relative overflow-hidden hero-sky-gradient">
      <div className="cloud-overlay" style={{ opacity: 0.3 }} />

      <div className="relative max-w-4xl mx-auto text-center z-10">
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-medium tracking-tight leading-[1.08] mb-6 text-white">
          We combine human insight with artificial intelligence
        </h2>
        <p className="text-base md:text-lg mb-10 max-w-xl mx-auto leading-relaxed text-white/80">
          Our platform bridges strategic thinking and advanced AI technologies to help companies streamline processes, improve decision-making, and create intelligent outreach.
        </p>
        <a href="/register" className="btn-cta mx-auto">
          Get Started
          <ArrowUpRight className="w-4 h-4" />
        </a>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="border-t border-border bg-background">
      <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <a href="/" className="flex items-center gap-2">
          <img alt="Intentsly" className="h-9 object-contain" src={intentslyIcon} />
        </a>
        <div className="flex items-center gap-8 text-sm text-muted-foreground">
          <a href="#services" className="hover:text-foreground transition-colors uppercase tracking-wider text-xs font-medium">Services</a>
          <a href="#pricing" className="hover:text-foreground transition-colors uppercase tracking-wider text-xs font-medium">Pricing</a>
          <a href="#testimonials" className="hover:text-foreground transition-colors uppercase tracking-wider text-xs font-medium">Testimonials</a>
          <a href="/privacy" className="hover:text-foreground transition-colors uppercase tracking-wider text-xs font-medium">Privacy</a>
        </div>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Intentsly. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export { CTASection, Footer };

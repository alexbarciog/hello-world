import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import intentslyLogo from "@/assets/intentsly-logo.png";

const Navbar = ({ showCampaigns = false }: { showCampaigns?: boolean }) => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-background/95 backdrop-blur-md shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2">
          <img src={intentslyLogo} alt="Intentsly" className="h-8 object-contain" />
        </a>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm font-medium text-goji-dark hover:opacity-70 transition-opacity">
            Solution
          </a>
          <a href="#features" className="text-sm font-medium text-goji-dark hover:opacity-70 transition-opacity">
            Features
          </a>
          <a href="#pricing" className="text-sm font-medium text-goji-dark hover:opacity-70 transition-opacity">
            Pricing
          </a>
          <button onClick={() => navigate("/dashboard")} className="text-sm font-medium text-goji-dark hover:opacity-70 transition-opacity">
            Dashboard
          </button>
          <button
            onClick={(e) => { e.preventDefault(); navigate("/help"); }}
            className="text-sm font-medium text-goji-dark hover:opacity-70 transition-opacity"
          >
            Help Center
          </button>
        </div>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => navigate("/login")}
            className="text-sm font-medium text-goji-dark border border-border rounded-full px-5 py-2 hover:bg-muted transition-colors"
          >
            Log in
          </button>
          <button
            onClick={() => navigate("/register")}
            className="btn-cta text-sm"
          >
            Start for Free
          </button>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 text-goji-dark"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-background border-t border-border px-6 py-4 flex flex-col gap-4">
          <a href="#features" className="text-sm font-medium text-goji-text-muted" onClick={() => setMenuOpen(false)}>Solution</a>
          <a href="#features" className="text-sm font-medium text-goji-text-muted" onClick={() => setMenuOpen(false)}>Features</a>
          <a href="#pricing" className="text-sm font-medium text-goji-text-muted" onClick={() => setMenuOpen(false)}>Pricing</a>
          <button className="text-sm font-medium text-goji-text-muted text-left" onClick={() => { setMenuOpen(false); navigate("/help"); }}>Help Center</button>
          <div className="flex gap-3 pt-2">
            <button onClick={() => { setMenuOpen(false); navigate("/login"); }} className="text-sm font-medium text-goji-dark border border-border rounded-full px-5 py-2">Log in</button>
            <button onClick={() => { setMenuOpen(false); navigate("/register"); }} className="text-sm font-semibold text-primary-foreground bg-goji-berry rounded-full px-5 py-2">Start for Free</button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

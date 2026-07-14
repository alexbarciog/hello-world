import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import intentslyIcon from "@/assets/intentsly-icon.png";

const navLinks = [
  { label: "How it Works", href: "#how-it-works" },
  { label: "Use Cases", href: "#use-cases" },
  { label: "Case Studies", href: "/case-studies" },
  { label: "Compare", href: "#comparison" },
  { label: "Pricing", href: "#pricing" },
  { label: "Partners", href: "/partners" },
  { label: "FAQ", href: "#faq" },
];

type NavbarProps = {
  showCampaigns?: boolean;
  forceDark?: boolean;
  variant?: "default" | "light";
};

const Navbar = ({ showCampaigns = false, forceDark = false, variant = "default" }: NavbarProps) => {
  const [scrolled, setScrolled] = useState(forceDark);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const y = window.scrollY;
        setScrolled(forceDark || y > 20);
        const delta = y - lastY;
        // Hide when scrolling down past threshold, show when scrolling up
        if (y > 120 && delta > 6) setHidden(true);
        else if (delta < -6 || y < 80) setHidden(false);
        lastY = y;
        ticking = false;
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [forceDark]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const close = () => setMenuOpen(false);

  // ── Light (Montera-style) variant ────────────────────────────────
  if (variant === "light") {
    return (
      <>
        {/* Desktop xl+ */}
        <nav className="w-full bg-white border-b border-neutral-100 hidden xl:block">
          <div className="max-w-7xl mx-auto px-8 h-[72px] flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <img alt="Intentsly" className="h-9 object-contain" src={intentslyIcon} />
              <span className="text-lg font-bold tracking-tight text-[#0a0a0a]">Intentsly<span className="text-[#0a0a0a]">.</span></span>
            </a>

            <div className="flex items-center gap-7">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-[15px] font-medium tracking-tight text-neutral-700 hover:text-[#0a0a0a] transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>

            <div className="flex items-center gap-6">
              <button
                onClick={() => navigate("/login")}
                className="text-[15px] font-medium tracking-tight text-neutral-700 hover:text-[#0a0a0a] transition-colors"
              >
                Sign in
              </button>
              <button
                onClick={() => navigate("/register")}
                className="inline-flex items-center gap-2 bg-[#0a0a0a] text-white text-[14px] font-semibold tracking-tight rounded-xl px-4 py-2.5 hover:bg-neutral-800 transition-colors"
              >
                Sign up
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </nav>

        {/* Compact desktop lg-xl */}
        <nav className="w-full bg-white border-b border-neutral-100 hidden lg:block xl:hidden">
          <div className="max-w-7xl mx-auto px-5 h-[64px] flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <img alt="Intentsly" className="h-8 object-contain" src={intentslyIcon} />
              <span className="text-base font-bold tracking-tight text-[#0a0a0a]">Intentsly.</span>
            </a>

            <div className="flex items-center gap-5">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-[13px] font-medium tracking-tight text-neutral-700 hover:text-[#0a0a0a] transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/login")}
                className="text-[13px] font-medium tracking-tight text-neutral-700 hover:text-[#0a0a0a] transition-colors"
              >
                Sign in
              </button>
              <button
                onClick={() => navigate("/register")}
                className="inline-flex items-center gap-1.5 bg-[#0a0a0a] text-white text-[13px] font-semibold tracking-tight rounded-xl px-3.5 py-2 hover:bg-neutral-800 transition-colors"
              >
                Sign up
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile + tablet */}
        <nav className="lg:hidden w-full bg-white border-b border-neutral-100">
          <div className="px-5 h-14 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <img alt="Intentsly" className="h-8 object-contain" src={intentslyIcon} />
              <span className="text-base font-bold tracking-tight text-[#0a0a0a]">Intentsly.</span>
            </a>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/register")}
                className="inline-flex items-center gap-1.5 bg-[#0a0a0a] text-white text-[13px] font-semibold rounded-lg px-3.5 py-2"
              >
                Sign up <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setMenuOpen(true)}
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-neutral-200"
                aria-label="Menu"
              >
                <svg className="w-5 h-5 text-[#0a0a0a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </nav>

        <AnimatePresence>
          {menuOpen && (
            <>
              <motion.div key="overlay" className="fixed inset-0 z-[60] md:hidden bg-black/30 backdrop-blur-sm"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }} onClick={close} />
              <motion.div key="menu" className="fixed top-4 right-5 z-[70] md:hidden origin-top-right w-[280px] rounded-[22px] bg-white border border-border/40 shadow-xl"
                initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }}
                transition={{ type: "spring", stiffness: 380, damping: 30, mass: 0.8 }}>
                <div className="flex justify-end px-4 pt-4">
                  <button onClick={close} className="w-8 h-8 rounded-full flex items-center justify-center bg-muted">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="px-4 pb-1 flex flex-col">
                  {navLinks.map((link) => (
                    <a key={link.href} href={link.href} onClick={close}
                      className="flex items-center text-sm font-medium py-3 text-[#0a0a0a]">
                      {link.label}
                    </a>
                  ))}
                </div>
                <div className="mx-4 h-px bg-border" />
                <div className="px-4 pt-3 pb-5 flex flex-col gap-2">
                  <button onClick={() => { close(); navigate("/login"); }} className="w-full text-sm font-medium rounded-xl py-3 bg-muted text-[#0a0a0a]">Sign in</button>
                  <button onClick={() => { close(); navigate("/register"); }} className="w-full inline-flex items-center justify-center gap-2 bg-[#0a0a0a] text-white text-sm font-semibold rounded-xl py-3">
                    Sign up <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  // ── Default (existing floating-pill) variant ─────────────────────
  return (
    <>
      {/* Desktop navbar xl+ */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 px-6 pt-4 hidden xl:flex"
        initial={false}
        animate={{ y: hidden ? -120 : 0, opacity: hidden ? 0 : 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className={`mx-auto px-6 py-3 flex items-center justify-between rounded-full transition-all duration-300 ${
            scrolled
              ? "max-w-4xl bg-white/90 backdrop-blur-md border border-border/40 shadow-lg shadow-black/5"
              : "max-w-5xl bg-white/20 backdrop-blur-md border border-white/20"
          }`}
        >
          <a href="/" className="flex items-center gap-2">
            <img alt="Intentsly" className="h-10 object-contain" src={intentslyIcon} />
            <span className={`text-sm font-semibold tracking-tight ${scrolled ? "text-foreground" : "text-white"}`}>
              Intentsly
            </span>
          </a>

          <div className="flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`text-xs font-medium uppercase tracking-wider transition-opacity hover:opacity-70 ${scrolled ? "text-foreground" : "text-white"}`}
              >
                {link.label}
              </a>
            ))}
            <button
              onClick={() => navigate("/login")}
              className={`text-xs font-medium uppercase tracking-wider transition-opacity hover:opacity-70 ${scrolled ? "text-foreground" : "text-white"}`}
            >
              Login
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/register")} className="btn-cta text-xs !py-2 !px-5">
              Start for $97
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      </motion.nav>

      {/* Compact desktop navbar lg-xl */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 px-4 pt-3 hidden lg:flex xl:hidden"
        initial={false}
        animate={{ y: hidden ? -120 : 0, opacity: hidden ? 0 : 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className={`mx-auto px-4 py-2.5 flex items-center justify-between rounded-full transition-all duration-300 ${
            scrolled
              ? "max-w-3xl bg-white/90 backdrop-blur-md border border-border/40 shadow-lg shadow-black/5"
              : "max-w-4xl bg-white/20 backdrop-blur-md border border-white/20"
          }`}
        >
          <a href="/" className="flex items-center gap-2">
            <img alt="Intentsly" className="h-9 object-contain" src={intentslyIcon} />
            <span className={`text-xs font-semibold tracking-tight ${scrolled ? "text-foreground" : "text-white"}`}>
              Intentsly
            </span>
          </a>

          <div className="flex items-center gap-5">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`text-[11px] font-medium uppercase tracking-wider transition-opacity hover:opacity-70 ${scrolled ? "text-foreground" : "text-white"}`}
              >
                {link.label}
              </a>
            ))}
            <button
              onClick={() => navigate("/login")}
              className={`text-[11px] font-medium uppercase tracking-wider transition-opacity hover:opacity-70 ${scrolled ? "text-foreground" : "text-white"}`}
            >
              Login
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/register")} className="btn-cta text-[11px] !py-1.5 !px-4">
              Start for $97
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </motion.div>
      </motion.nav>

      {/* Mobile + tablet floating pill navbar */}
      <motion.div
        className="fixed top-3 left-3 right-3 z-50 lg:hidden"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: hidden ? 0 : 1, y: hidden ? -80 : 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <div
          className={`flex items-center justify-between rounded-full pl-3 pr-1.5 py-1.5 transition-all duration-300 ${
            scrolled
              ? "bg-white/95 backdrop-blur-xl border border-border/40 shadow-lg shadow-black/10"
              : "bg-white/15 backdrop-blur-xl border border-white/25"
          }`}
        >
          <a href="/" className="flex items-center gap-1.5">
            <img alt="Intentsly" className="h-7 object-contain" src={intentslyIcon} />
            <span className={`text-sm font-semibold tracking-tight ${scrolled ? "text-foreground" : "text-white"}`}>
              Intentsly
            </span>
          </a>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => navigate("/register")}
              className="text-[12px] font-semibold rounded-full px-3.5 py-2 bg-[#0a0a0a] text-white inline-flex items-center gap-1"
            >
              Start <ArrowUpRight className="w-3 h-3" />
            </button>
            <button
              onClick={() => setMenuOpen(true)}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                scrolled ? "bg-black/5" : "bg-white/20"
              }`}
              aria-label="Menu"
            >
              <svg className={`w-4 h-4 ${scrolled ? "text-foreground" : "text-white"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Mobile overlay */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div key="overlay" className="fixed inset-0 z-[60] md:hidden bg-black/30 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }} onClick={close} />

            <motion.div key="menu" className="fixed top-4 right-5 z-[70] md:hidden origin-top-right w-[280px] rounded-[22px] bg-white/95 backdrop-blur-xl border border-border/40 shadow-xl"
              initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }}
              transition={{ type: "spring", stiffness: 380, damping: 30, mass: 0.8 }}>
              <div className="flex justify-end px-4 pt-4">
                <button onClick={close} className="w-8 h-8 rounded-full flex items-center justify-center bg-muted hover:bg-muted/80 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="px-4 pb-1 flex flex-col">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={close}
                    className="flex items-center text-sm font-medium hover:text-foreground transition-colors py-3 uppercase tracking-wider text-xs"
                    style={{ color: "hsl(var(--aeline-dark))" }}
                  >
                    {link.label}
                  </a>
                ))}
              </div>

              <div className="mx-4 h-px bg-border" />

              <div className="px-4 pt-3 pb-5 flex flex-col gap-2">
                <button onClick={() => { close(); navigate("/login"); }} className="w-full text-sm font-medium rounded-2xl py-3 bg-muted transition-colors" style={{ color: "hsl(var(--aeline-dark))" }}>Login</button>
                <button onClick={() => { close(); navigate("/register"); }} className="btn-cta w-full justify-center text-sm !py-3">
                  Start for $97 <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Sparkles, Linkedin, Globe, ChevronDown } from "lucide-react";
import intentslyIcon from "@/assets/intentsly-icon.png";

const featureItems = [
  {
    icon: Bot,
    label: "AI SDR & Outreach",
    desc: "Automated LinkedIn outreach campaigns",
    href: "/features/ai-sdr",
  },
  {
    icon: Sparkles,
    label: "Conversational AI",
    desc: "Smart replies that book meetings",
    href: "/features/conversational-ai",
  },
  {
    icon: Linkedin,
    label: "LinkedIn Intent Signals",
    desc: "Find high-intent leads from engagement",
    href: "/features/linkedin-signals",
  },
  {
    icon: Globe,
    label: "Reddit & X Monitoring",
    desc: "Cross-platform buying signal detection",
    href: "/features/reddit-x-signals",
  },
];

const navLinks = [
  { label: "Solution", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Help Center", href: "/help", isRoute: true },
];

const Navbar = ({ showCampaigns = false }: { showCampaigns?: boolean }) => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [showLogo, setShowLogo] = useState(true);
  const navigate = useNavigate();
  const featuresRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setShowLogo(false), 1600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const close = () => setMenuOpen(false);

  const handleFeaturesEnter = () => {
    clearTimeout(timeoutRef.current);
    setFeaturesOpen(true);
  };

  const handleFeaturesLeave = () => {
    timeoutRef.current = setTimeout(() => setFeaturesOpen(false), 150);
  };

  return (
    <>
      {/* ── Desktop navbar ──────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 pt-4 hidden md:block">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between rounded-full bg-white/50 backdrop-blur-md border border-border/40 shadow-sm"
        >
          <a href="/" className="flex items-center gap-2">
            <img alt="Intentsly" className="h-11 object-contain" src={intentslyIcon} />
          </a>

          <div className="flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-goji-dark hover:opacity-70 transition-opacity">Solution</a>

            {/* Features with mega menu */}
            <div
              ref={featuresRef}
              className="relative"
              onMouseEnter={handleFeaturesEnter}
              onMouseLeave={handleFeaturesLeave}
            >
              <button className="flex items-center gap-1 text-sm font-medium text-goji-dark hover:opacity-70 transition-opacity">
                Features
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${featuresOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {featuresOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[420px] rounded-2xl bg-white/95 backdrop-blur-xl border border-border/40 shadow-xl p-2"
                  >
                    {featureItems.map((item, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setFeaturesOpen(false);
                          navigate(item.href);
                        }}
                        className="w-full flex items-start gap-3.5 px-4 py-3 rounded-xl hover:bg-muted/60 transition-colors text-left group"
                      >
                        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mt-0.5 group-hover:bg-primary/15 transition-colors">
                          <item.icon className="w-4.5 h-4.5 text-primary" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">{item.label}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{item.desc}</div>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <a href="#pricing" className="text-sm font-medium text-goji-dark hover:opacity-70 transition-opacity">Pricing</a>
            <button onClick={() => navigate("/dashboard")} className="text-sm font-medium text-goji-dark hover:opacity-70 transition-opacity">Dashboard</button>
            <button onClick={(e) => { e.preventDefault(); navigate("/help"); }} className="text-sm font-medium text-goji-dark hover:opacity-70 transition-opacity">Help Center</button>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/login")} className="text-sm font-medium text-goji-dark border border-border rounded-full px-5 py-2 hover:bg-muted transition-colors">Log in</button>
            <button onClick={() => navigate("/register")} className="btn-cta text-sm">Start for Free</button>
          </div>
        </motion.div>
      </nav>

      {/* ── Mobile floating bubble ──────────────────────────────────────── */}
      <motion.button
        className="fixed top-4 right-5 z-50 md:hidden w-11 h-11 rounded-full flex items-center justify-center overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.28)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          border: "1px solid rgba(255,255,255,0.55)",
          boxShadow: "0 2px 16px rgba(0,0,0,0.1)",
        }}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        onClick={() => setMenuOpen(true)}
        whileTap={{ scale: 0.88 }}
      >
        <AnimatePresence mode="wait">
          {showLogo ? (
            <motion.img
              key="logo"
              src={intentslyIcon}
              alt="Intentsly"
              className="w-7 h-7 object-contain"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            />
          ) : (
            <motion.svg
              key="hamburger"
              className="w-5 h-5 text-goji-dark"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </motion.svg>
          )}
        </AnimatePresence>
      </motion.button>

      {/* ── Mobile overlay + popup menu ─────────────────────────────────── */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              key="overlay"
              className="fixed inset-0 z-[60] md:hidden"
              style={{ background: "rgba(20,20,30,0.35)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              onClick={close}
            />

            <motion.div
              key="menu"
              className="fixed top-4 right-5 z-[70] md:hidden origin-top-right w-[280px] rounded-[22px]"
              style={{
                background: "rgba(255,253,245,0.92)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.7)",
                boxShadow: "0 8px 40px rgba(0,0,0,0.14)",
              }}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ type: "spring", stiffness: 380, damping: 30, mass: 0.8 }}
            >
              <div className="flex justify-end px-4 pt-4">
                <motion.button
                  onClick={close}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-foreground/60 hover:text-foreground transition-colors"
                  style={{ background: "rgba(0,0,0,0.06)" }}
                  whileTap={{ scale: 0.9 }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.18 }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              </div>

              <div className="px-4 pb-1 flex flex-col">
                <motion.a
                  href="#features"
                  onClick={close}
                  className="flex items-center text-sm font-medium text-goji-dark hover:text-foreground transition-colors"
                  style={{ minHeight: "44px" }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12, duration: 0.26 }}
                >
                  Solution
                </motion.a>

                {/* Mobile feature items */}
                <motion.div
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-0 pt-2 pb-1"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.16, duration: 0.26 }}
                >
                  Features
                </motion.div>
                {featureItems.map((item, i) => (
                  <motion.button
                    key={i}
                    onClick={() => { close(); navigate(item.href); }}
                    className="flex items-center gap-3 text-sm font-medium text-goji-dark hover:text-foreground transition-colors text-left"
                    style={{ minHeight: "40px" }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.18 + i * 0.05, duration: 0.26 }}
                  >
                    <item.icon className="w-4 h-4 text-primary" />
                    {item.label}
                  </motion.button>
                ))}

                {navLinks.filter(l => l.label !== "Solution").map((link, i) => (
                  <motion.a
                    key={link.label}
                    href={link.isRoute ? undefined : link.href}
                    onClick={(e) => {
                      if (link.isRoute) { e.preventDefault(); navigate(link.href); }
                      close();
                    }}
                    className="flex items-center text-sm font-medium text-goji-dark hover:text-foreground transition-colors"
                    style={{ minHeight: "44px" }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.36 + i * 0.055, duration: 0.26 }}
                  >
                    {link.label}
                  </motion.a>
                ))}
              </div>

              <motion.div className="mx-4 h-px" style={{ background: "rgba(0,0,0,0.07)" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} />

              <div className="px-4 pt-3 pb-5 flex flex-col gap-2">
                <motion.button
                  onClick={() => { close(); navigate("/login"); }}
                  className="w-full text-sm font-medium rounded-2xl transition-colors"
                  style={{ minHeight: "44px", background: "rgba(0,0,0,0.05)", color: "hsl(var(--goji-dark))" }}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.26 }}
                  whileHover={{ background: "rgba(0,0,0,0.09)" } as never}
                  whileTap={{ scale: 0.97 }}
                >
                  Log in
                </motion.button>
                <motion.button
                  onClick={() => { close(); navigate("/register"); }}
                  className="w-full text-sm font-medium rounded-2xl text-white transition-all"
                  style={{ minHeight: "44px", background: "linear-gradient(135deg, #7C93E6 0%, #F7C459 100%)", boxShadow: "0 4px 16px rgba(124,147,230,0.35)" }}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.46, duration: 0.26 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Start for Free →
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
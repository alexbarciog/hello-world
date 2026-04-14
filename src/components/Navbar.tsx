import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Sparkles, Linkedin, Globe, ChevronDown, ArrowUpRight } from "lucide-react";
import intentslyIcon from "@/assets/intentsly-icon.png";

const featureItems = [
  { icon: Bot, label: "AI SDR & Outreach", desc: "Automated LinkedIn outreach campaigns", href: "/features/ai-sdr" },
  { icon: Sparkles, label: "Conversational AI", desc: "Smart replies that book meetings", href: "/features/conversational-ai" },
  { icon: Linkedin, label: "LinkedIn Intent Signals", desc: "Find high-intent leads from engagement", href: "/features/linkedin-signals" },
  { icon: Globe, label: "Reddit & X Monitoring", desc: "Cross-platform buying signal detection", href: "/features/reddit-x-signals" },
];

const Navbar = ({ showCampaigns = false, forceDark = false }: { showCampaigns?: boolean; forceDark?: boolean }) => {
  const [scrolled, setScrolled] = useState(forceDark);
  const [menuOpen, setMenuOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const navigate = useNavigate();
  const featuresRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const handleScroll = () => setScrolled(forceDark || window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const close = () => setMenuOpen(false);

  const handleFeaturesEnter = () => { clearTimeout(timeoutRef.current); setFeaturesOpen(true); };
  const handleFeaturesLeave = () => { timeoutRef.current = setTimeout(() => setFeaturesOpen(false), 150); };

  return (
    <>
      {/* Desktop navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 pt-4 hidden md:block">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className={`max-w-5xl mx-auto px-6 py-3 flex items-center justify-between rounded-full transition-all duration-300 ${
            scrolled
              ? "bg-white/90 backdrop-blur-md border border-border/40 shadow-sm"
              : "bg-white/20 backdrop-blur-md border border-white/20"
          }`}
        >
          <a href="/" className="flex items-center gap-2">
            <img alt="Intentsly" className="h-10 object-contain" src={intentslyIcon} />
            <span className={`text-sm font-semibold tracking-tight ${scrolled ? "text-foreground" : "text-white"}`}>
              Intentsly
            </span>
          </a>

          <div className="flex items-center gap-8">
            <a href="#services" className={`text-xs font-medium uppercase tracking-wider transition-opacity hover:opacity-70 ${scrolled ? "text-foreground" : "text-white"}`}>
              Services
            </a>

            <div ref={featuresRef} className="relative" onMouseEnter={handleFeaturesEnter} onMouseLeave={handleFeaturesLeave}>
              <button className={`flex items-center gap-1 text-xs font-medium uppercase tracking-wider transition-opacity hover:opacity-70 ${scrolled ? "text-foreground" : "text-white"}`}>
                Features
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${featuresOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {featuresOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[420px] rounded-2xl bg-white/95 backdrop-blur-xl border border-border/40 shadow-xl p-2"
                  >
                    {featureItems.map((item, i) => (
                      <button key={i} onClick={() => { setFeaturesOpen(false); navigate(item.href); }}
                        className="w-full flex items-start gap-3.5 px-4 py-3 rounded-xl hover:bg-muted/60 transition-colors text-left group">
                        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-[#1A8FE3]/10 flex items-center justify-center mt-0.5">
                          <item.icon className="w-4.5 h-4.5 text-[#1A8FE3]" />
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

            <button onClick={() => navigate("/pricing")} className={`text-xs font-medium uppercase tracking-wider transition-opacity hover:opacity-70 ${scrolled ? "text-foreground" : "text-white"}`}>Pricing</button>
            <button onClick={() => navigate("/dashboard")} className={`text-xs font-medium uppercase tracking-wider transition-opacity hover:opacity-70 ${scrolled ? "text-foreground" : "text-white"}`}>Dashboard</button>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/login")} className={`text-xs font-medium uppercase tracking-wider border rounded-full px-5 py-2 transition-colors ${
              scrolled ? "text-foreground border-border hover:bg-muted" : "text-white border-white/40 hover:bg-white/15"
            }`}>Log in</button>
            <button onClick={() => navigate("/register")} className="btn-cta text-xs !py-2 !px-5">
              Get Started
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      </nav>

      {/* Mobile burger */}
      <motion.button
        className="fixed top-4 right-5 z-50 md:hidden w-11 h-11 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-md border border-white/30"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        onClick={() => setMenuOpen(true)}
        whileTap={{ scale: 0.88 }}
      >
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </motion.button>

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
                <a href="#services" onClick={close} className="flex items-center text-sm font-medium hover:text-foreground transition-colors py-3 uppercase tracking-wider text-xs" style={{ color: "hsl(var(--aeline-dark))" }}>Services</a>

                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground pt-2 pb-1">Features</p>
                {featureItems.map((item, i) => (
                  <button key={i} onClick={() => { close(); navigate(item.href); }}
                    className="flex items-center gap-3 text-sm font-medium py-2.5 text-left" style={{ color: "hsl(var(--aeline-dark))" }}>
                    <item.icon className="w-4 h-4 text-[#1A8FE3]" /> {item.label}
                  </button>
                ))}

                <a href="#pricing" onClick={close} className="flex items-center text-sm font-medium hover:text-foreground transition-colors py-3 uppercase tracking-wider text-xs" style={{ color: "hsl(var(--aeline-dark))" }}>Pricing</a>
              </div>

              <div className="mx-4 h-px bg-border" />

              <div className="px-4 pt-3 pb-5 flex flex-col gap-2">
                <button onClick={() => { close(); navigate("/login"); }} className="w-full text-sm font-medium rounded-2xl py-3 bg-muted transition-colors" style={{ color: "hsl(var(--aeline-dark))" }}>Log in</button>
                <button onClick={() => { close(); navigate("/register"); }} className="btn-cta w-full justify-center text-sm !py-3">
                  Get Started <ArrowUpRight className="w-4 h-4" />
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

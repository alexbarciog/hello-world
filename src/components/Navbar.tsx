import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion, type Variants } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import intentslyIcon from "@/assets/intentsly-icon.png";

const navLinks = [
  { label: "How it Works", href: "#how-it-works" },
  { label: "Use Cases", href: "#use-cases" },
  { label: "Compare", href: "#comparison" },
  { label: "Pricing", href: "#pricing" },
  { label: "Partners", href: "/partners" },
  { label: "FAQ", href: "#faq" },
];

const EASE = [0.22, 1, 0.36, 1] as const;

const Navbar = ({ showCampaigns = false, forceDark = false }: { showCampaigns?: boolean; forceDark?: boolean }) => {
  const [scrolled, setScrolled] = useState(forceDark);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const reduce = useReducedMotion();

  useEffect(() => {
    const handleScroll = () => setScrolled(forceDark || window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [forceDark]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const close = () => setMenuOpen(false);

  const container: Variants = {
    hidden: { opacity: 0, y: -12 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: EASE,
        staggerChildren: reduce ? 0 : 0.06,
        delayChildren: 0.05,
      },
    },
  };

  const child: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : -8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE } },
  };

  const linkColor = scrolled ? "text-foreground" : "text-white";

  return (
    <>
      {/* Desktop navbar */}
      <nav className="fixed top-[42px] left-0 right-0 z-50 px-6 pt-4 hidden md:block">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          layout
          transition={{ layout: { duration: 0.35, ease: EASE } }}
          className={`mx-auto flex items-center justify-between gap-6 rounded-full transition-all duration-300 ease-out ${
            scrolled
              ? "max-w-5xl px-5 py-2 bg-white/90 backdrop-blur-md border border-border/40 shadow-md"
              : "max-w-6xl px-6 py-3 bg-white/20 backdrop-blur-md border border-white/20 shadow-sm"
          }`}
        >
          <motion.a variants={child} href="/" className="flex items-center gap-2 shrink-0">
            <img
              alt="Intentsly"
              src={intentslyIcon}
              className={`object-contain transition-all duration-300 ${scrolled ? "h-8" : "h-10"}`}
            />
            <span className={`text-sm font-semibold tracking-tight ${linkColor}`}>
              Intentsly
            </span>
          </motion.a>

          <div className={`flex items-center transition-all duration-300 ${scrolled ? "gap-5" : "gap-7"}`}>
            {navLinks.map((link) => (
              <motion.a
                key={link.href}
                variants={child}
                href={link.href}
                whileHover={reduce ? undefined : { y: -1 }}
                transition={{ type: "spring", stiffness: 400, damping: 22 }}
                className={`group relative whitespace-nowrap text-xs font-medium uppercase tracking-wider transition-opacity hover:opacity-80 ${linkColor}`}
              >
                {link.label}
                <span
                  aria-hidden
                  className="pointer-events-none absolute left-0 -bottom-1 h-[1.5px] w-full bg-current origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100"
                />
              </motion.a>
            ))}
            <motion.button
              variants={child}
              onClick={() => navigate("/login")}
              whileHover={reduce ? undefined : { y: -1 }}
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
              className={`group relative whitespace-nowrap text-xs font-medium uppercase tracking-wider transition-opacity hover:opacity-80 ${linkColor}`}
            >
              Login
              <span
                aria-hidden
                className="pointer-events-none absolute left-0 -bottom-1 h-[1.5px] w-full bg-current origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100"
              />
            </motion.button>
          </div>


          <motion.div variants={child} className="flex items-center gap-3 shrink-0">
            <motion.button
              onClick={() => navigate("/register")}
              whileHover={reduce ? undefined : { scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 380, damping: 22 }}
              className={`group btn-cta relative text-xs !py-2 ${scrolled ? "!px-4" : "!px-5"}
                after:content-[''] after:absolute after:inset-0 after:rounded-full after:bg-[#C8FF3B] after:blur-xl after:opacity-40 after:-z-10
                ${reduce ? "" : "after:animate-pulse"}`}
            >
              Start for $97
              <span className="inline-flex transition-transform duration-300 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </motion.button>
          </motion.div>
        </motion.div>
      </nav>

      {/* Mobile burger */}
      <motion.button
        className="fixed top-[54px] right-5 z-50 md:hidden w-11 h-11 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-md border border-white/30"
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
                <motion.button
                  onClick={() => { close(); navigate("/register"); }}
                  whileHover={reduce ? undefined : { scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="group btn-cta w-full justify-center text-sm !py-3"
                >
                  Start for $97
                  <span className="inline-flex transition-transform duration-300 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                    <ArrowUpRight className="w-4 h-4" />
                  </span>
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

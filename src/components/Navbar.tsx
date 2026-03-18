import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import intentslyIcon from "@/assets/intentsly-icon.png";

const navLinks = [
  { label: "Solution", href: "#features" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Help Center", href: "/help", isRoute: true },
];

const Navbar = ({ showCampaigns = false }: { showCampaigns?: boolean }) => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const close = () => setMenuOpen(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 pt-4">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between rounded-full bg-white/50 backdrop-blur-md border border-border/40 shadow-sm">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2">
            <img alt="Intentsly" className="h-11 object-contain" src={intentslyIcon} />
          </a>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-goji-dark hover:opacity-70 transition-opacity">Solution</a>
            <a href="#features" className="text-sm font-medium text-goji-dark hover:opacity-70 transition-opacity">Features</a>
            <a href="#pricing" className="text-sm font-medium text-goji-dark hover:opacity-70 transition-opacity">Pricing</a>
            <button onClick={() => navigate("/dashboard")} className="text-sm font-medium text-goji-dark hover:opacity-70 transition-opacity">Dashboard</button>
            <button onClick={(e) => { e.preventDefault(); navigate("/help"); }} className="text-sm font-medium text-goji-dark hover:opacity-70 transition-opacity">Help Center</button>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <button onClick={() => navigate("/login")} className="text-sm font-medium text-goji-dark border border-border rounded-full px-5 py-2 hover:bg-muted transition-colors">Log in</button>
            <button onClick={() => navigate("/register")} className="btn-cta text-sm">Start for Free</button>
          </div>

          {/* Mobile bubble button */}
          <motion.button
            className="md:hidden relative w-11 h-11 rounded-full flex items-center justify-center"
            style={{
              background: "rgba(255,255,255,0.25)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.5)",
              boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
            }}
            onClick={() => setMenuOpen(true)}
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
            whileTap={{ scale: 0.92 }}
          >
            <img alt="Intentsly" className="w-7 h-7 object-contain rounded-full" src={intentslyIcon} />
          </motion.button>
        </div>
      </nav>

      {/* Mobile overlay + popup menu — only on md: */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="overlay"
              className="fixed inset-0 z-[60] md:hidden"
              style={{ background: "rgba(20,20,30,0.35)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={close}
            />

            {/* Popup panel — morphs from top-right circle to rounded rectangle */}
            <motion.div
              key="menu"
              className="fixed top-4 right-6 z-[70] md:hidden origin-top-right"
              style={{
                background: "rgba(255,253,245,0.82)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.7)",
                boxShadow: "0 8px 40px rgba(0,0,0,0.14), 0 1px 0 rgba(255,255,255,0.6) inset",
              }}
              initial={{ opacity: 0, scale: 0.3, borderRadius: "9999px", width: "44px", height: "44px" }}
              animate={{ opacity: 1, scale: 1, borderRadius: "24px", width: "260px", height: "auto" }}
              exit={{ opacity: 0, scale: 0.3, borderRadius: "9999px", width: "44px", height: "44px" }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
            >
              {/* Close button */}
              <div className="flex justify-end px-4 pt-4">
                <motion.button
                  onClick={close}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-foreground/60 hover:text-foreground transition-colors"
                  style={{ background: "rgba(0,0,0,0.06)" }}
                  whileTap={{ scale: 0.9 }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.15 }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              </div>

              {/* Nav links */}
              <div className="px-4 pb-2 flex flex-col">
                {navLinks.map((link, i) => (
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
                    transition={{ delay: 0.12 + i * 0.06, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {link.label}
                  </motion.a>
                ))}
              </div>

              {/* Divider */}
              <motion.div
                className="mx-4 h-px"
                style={{ background: "rgba(0,0,0,0.07)" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.32 }}
              />

              {/* Buttons */}
              <div className="px-4 pt-3 pb-5 flex flex-col gap-2.5">
                <motion.button
                  onClick={() => { close(); navigate("/login"); }}
                  className="w-full text-sm font-medium text-goji-dark border border-border/60 rounded-full hover:bg-muted transition-colors"
                  style={{ minHeight: "44px" }}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.36, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  whileTap={{ scale: 0.97 }}
                >
                  Log in
                </motion.button>
                <motion.button
                  onClick={() => { close(); navigate("/register"); }}
                  className="btn-cta w-full justify-center text-sm"
                  style={{ minHeight: "44px" }}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.42, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  whileTap={{ scale: 0.97 }}
                >
                  Start for Free
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

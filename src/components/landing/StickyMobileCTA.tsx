import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const HIDDEN_PATHS = ["/register", "/login", "/forgot-password"];

const StickyMobileCTA = () => {
  const [show, setShow] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => {
      setShow(window.scrollY > window.innerHeight * 0.9);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (HIDDEN_PATHS.some((p) => location.pathname.startsWith(p))) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="md:hidden fixed bottom-3 inset-x-3 z-40 rounded-full bg-white/95 backdrop-blur shadow-[0_12px_40px_-8px_rgba(15,23,42,0.25)] border border-black/5 px-4 py-2.5 flex items-center justify-between gap-3"
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: "hsl(var(--aeline-dark))" }}>
              $97/month
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Cancel anytime</p>
          </div>
          <Link
            to="/register"
            className="inline-flex items-center gap-1.5 bg-[#C8FF00] px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider shrink-0"
            style={{ color: "hsl(var(--aeline-dark))" }}
          >
            Start
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StickyMobileCTA;

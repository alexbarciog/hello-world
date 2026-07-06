import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useScroll,
  useTransform,
  useMotionTemplate,
  type Variants,
} from "framer-motion";
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

  // Smooth scroll-driven motion values
  const { scrollY } = useScroll();
  const range = [0, 220];
  const maxWidth = useTransform(scrollY, range, [1200, 780]);
  const padY = useTransform(scrollY, range, [14, 8]);
  const padX = useTransform(scrollY, range, [28, 20]);
  const gap = useTransform(scrollY, range, [28, 18]);
  const logoH = useTransform(scrollY, range, [40, 30]);
  const bgAlpha = useTransform(scrollY, range, [0.15, 0.92]);
  const bgR = useTransform(scrollY, range, [255, 10]);
  const bgG = useTransform(scrollY, range, [255, 10]);
  const bgB = useTransform(scrollY, range, [255, 10]);
  const background = useMotionTemplate`rgba(${bgR}, ${bgG}, ${bgB}, ${bgAlpha})`;
  const borderAlpha = useTransform(scrollY, range, [0.25, 0.12]);
  const borderColor = useMotionTemplate`rgba(255, 255, 255, ${borderAlpha})`;
  const shadowOpacity = useTransform(scrollY, range, [0.05, 0.35]);
  const shadowBlur = useTransform(scrollY, range, [10, 30]);
  const boxShadow = useMotionTemplate`0 ${shadowBlur}px ${shadowBlur}px -${useTransform(shadowBlur, (v) => v / 2)}px rgba(0, 0, 0, ${shadowOpacity})`;
  // Text color: dark (forceDark) or white → white as we scroll darker pill
  const textR = useTransform(scrollY, range, [forceDark ? 10 : 255, 255]);
  const textG = useTransform(scrollY, range, [forceDark ? 10 : 255, 255]);
  const textB = useTransform(scrollY, range, [forceDark ? 10 : 255, 255]);
  const textColor = useMotionTemplate`rgb(${textR}, ${textG}, ${textB})`;

  return (
    <>
      {/* Desktop navbar */}
      <nav className="fixed top-[42px] left-0 right-0 z-50 px-6 pt-4 hidden md:block">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          style={{
            maxWidth: reduce ? undefined : maxWidth,
            paddingTop: reduce ? undefined : padY,
            paddingBottom: reduce ? undefined : padY,
            paddingLeft: reduce ? undefined : padX,
            paddingRight: reduce ? undefined : padX,
            background: reduce ? undefined : background,
            borderColor: reduce ? undefined : borderColor,
            boxShadow: reduce ? undefined : boxShadow,
            color: reduce ? undefined : textColor,
          }}
          className="mx-auto flex items-center justify-between gap-6 rounded-full border backdrop-blur-md"
        >
          <motion.a variants={child} href="/" className="flex items-center gap-2 shrink-0">
            <motion.img
              alt="Intentsly"
              src={intentslyIcon}
              style={{ height: reduce ? undefined : logoH }}
              className="object-contain"
            />
            <span className="text-sm font-semibold tracking-tight" style={{ color: "inherit" }}>
              Intentsly
            </span>
          </motion.a>

          <motion.div
            style={{ gap: reduce ? undefined : gap }}
            className="flex items-center"
          >
            {navLinks.map((link) => (
              <motion.a
                key={link.href}
                variants={child}
                href={link.href}
                whileHover={reduce ? undefined : { y: -1 }}
                transition={{ type: "spring", stiffness: 400, damping: 22 }}
                style={{ color: "inherit" }}
                className="group relative whitespace-nowrap text-xs font-medium uppercase tracking-wider transition-opacity hover:opacity-80"
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
              style={{ color: "inherit" }}
              className="group relative whitespace-nowrap text-xs font-medium uppercase tracking-wider transition-opacity hover:opacity-80"
            >
              Login
              <span
                aria-hidden
                className="pointer-events-none absolute left-0 -bottom-1 h-[1.5px] w-full bg-current origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100"
              />
            </motion.button>
          </motion.div>

          <motion.div variants={child} className="flex items-center gap-3 shrink-0">
            <div className="relative">
              <span
                aria-hidden
                className={`pointer-events-none absolute -inset-1 rounded-full bg-[#C8FF3B] blur-lg opacity-60 ${reduce ? "" : "animate-pulse"}`}
              />
              <motion.button
                onClick={() => navigate("/register")}
                whileHover={reduce ? undefined : { scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 380, damping: 22 }}
                className="group btn-cta relative text-xs whitespace-nowrap !py-2 !px-4"
              >
                Start for $97
                <span className="inline-flex transition-transform duration-300 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </motion.button>
            </div>
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

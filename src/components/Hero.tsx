import { ArrowRight, Play } from "lucide-react";
import { motion } from "framer-motion";
import HeroFloatingCards from "./HeroFloatingCards";
import heroGradient from "@/assets/hero-gradient-right.png";
import { CountUp } from "@/lib/motion";

const EASE = [0.22, 1, 0.36, 1] as const;

const headline = "Find people already looking for what you offer on";

const Hero = () => {
  const words = headline.split(" ");

  return (
    <section className="relative w-full bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 md:px-8 pt-10 md:pt-24 pb-12 md:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-8 items-center">
          {/* LEFT — copy */}
          <div className="relative z-10">
            {/* Urgency badge */}
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, ease: EASE }}
              className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 md:px-4 md:py-2 mb-5 md:mb-8 shadow-sm"
            >
              <motion.span
                animate={{ scale: [1, 1.15, 1], rotate: [0, -8, 8, 0] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                className="text-sm md:text-base leading-none inline-block"
              >
                🔥
              </motion.span>
              <span className="text-[12px] md:text-[13px] font-semibold text-neutral-900">
                <CountUp to={127} /> buyers showed intent in the last hour
              </span>
            </motion.div>

            {/* Word-by-word stagger headline */}
            <motion.h1
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.06, delayChildren: 0.15 } },
              }}
              className="font-medium tracking-[-0.03em] leading-[1.05] md:leading-[1.02] text-[#0a0a0a]"
              style={{ fontSize: "clamp(2rem, 5.6vw, 4.75rem)" }}
            >
              {words.map((w, i) => (
                <span key={i} className="inline-block overflow-hidden pb-[0.05em] mr-[0.25em]">
                  <motion.span
                    className="inline-block"
                    variants={{
                      hidden: { y: "110%", opacity: 0 },
                      visible: { y: 0, opacity: 1, transition: { duration: 0.7, ease: EASE } },
                    }}
                  >
                    {w}
                  </motion.span>
                </span>
              ))}
              <span className="inline-block overflow-hidden pb-[0.05em]">
                <motion.span
                  className="inline-block text-[#3B82F6]"
                  variants={{
                    hidden: { y: "110%", opacity: 0 },
                    visible: { y: 0, opacity: 1, transition: { duration: 0.7, ease: EASE } },
                  }}
                >
                  LinkedIn
                </motion.span>
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.75, ease: EASE }}
              className="mt-5 md:mt-7 text-base md:text-xl text-neutral-500 leading-relaxed max-w-xl"
            >
              AI agents detect intent signals on LinkedIn — so you reach the right people at the right moment, before your competitors do.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.9, ease: EASE }}
              className="mt-7 md:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4"
            >
              <motion.a
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                href="/register"
                className="inline-flex items-center justify-center gap-2 bg-[#0a0a0a] text-white text-[15px] font-semibold rounded-xl px-6 py-3.5 md:py-4 hover:bg-neutral-800 transition-colors"
              >
                Start for $97
                <ArrowRight className="w-4 h-4" />
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                href="https://www.loom.com/share/3dc9408fe0da4b979cb5642333f4b500"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-white text-[#0a0a0a] text-[15px] font-semibold rounded-xl px-6 py-3.5 md:py-4 border border-neutral-200 hover:bg-neutral-50 transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Watch demo
                <ArrowRight className="w-4 h-4" />
              </motion.a>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.05, ease: EASE }}
              className="mt-3 flex items-center gap-1.5 text-[13px] font-semibold text-[hsl(var(--aeline-lime))]"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[hsl(var(--aeline-lime))] opacity-80" />
                <span className="relative inline-flex h-full w-full rounded-full bg-[hsl(var(--aeline-lime))]" />
              </span>
              14 spots left at this price
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.1, ease: EASE }}
              className="mt-5 text-xs uppercase tracking-[0.14em] text-neutral-400"
            >
              No contract · Cancel anytime · 5-min setup
            </motion.p>
          </div>

          {/* RIGHT — gradient + floating cards */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: EASE }}
            className="relative"
          >
            <div className="relative overflow-hidden aspect-[4/5] lg:aspect-auto lg:min-h-[620px]">
              <img
                src={heroGradient}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* Cards overlay */}
              <div className="absolute inset-0 p-4 lg:p-6">
                <HeroFloatingCards />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

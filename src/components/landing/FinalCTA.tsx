import { useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import ctaBg from "@/assets/cta-bg.avif";
import { CountUp } from "@/lib/motion";

const FinalCTA = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);

  return (
    <section className="px-2 md:px-4 pt-4 md:pt-8">
      <div ref={ref} className="relative overflow-hidden rounded-[40px] py-20 px-6 md:py-28 md:px-12">
        <motion.img
          src={ctaBg}
          alt=""
          aria-hidden="true"
          style={{ y: bgY }}
          className="absolute inset-0 w-full h-[120%] object-cover"
        />

        <div className="relative max-w-4xl mx-auto z-10 pl-2 md:pl-8">
          {/* Live counter chip */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2 mb-6 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25"
          >
            <span className="relative flex h-2 w-2">
              <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-white">
              <CountUp to={127} /> buyers showing intent right now
            </span>
          </motion.div>

          <h2 className="text-[28px] md:text-5xl lg:text-6xl font-medium tracking-tight leading-[1.08] mb-6 text-white max-w-2xl">
            Spot likely buyers on LinkedIn before everyone else does.
          </h2>
          <p className="text-base md:text-lg mb-10 max-w-xl leading-relaxed text-white/80">
            Stop relying on broad prospect lists and start focusing on the people already showing movement.
          </p>
          <div className="flex flex-col items-start sm:flex-row sm:flex-wrap sm:items-center gap-4">
            <a href="/register" className="btn-cta btn-shimmer group w-full sm:w-auto justify-center">
              Start for $97
              <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-0.5" />
            </a>
            <a href="#how-it-works" className="text-sm font-medium text-white/80 hover:text-white transition-colors underline-offset-4 hover:underline">
              See how it works
            </a>
          </div>

          {/* Microtrust */}
          <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-white/70">
            No contract · Cancel anytime · 5-min setup
          </p>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;

import { ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import intentslyIcon from "@/assets/intentsly-icon.png";
import ctaBg from "@/assets/cta-bg.avif";
import { FOOTER_COLUMNS, LEGAL_LINKS } from "@/data/siteNav";

const EASE = [0.22, 1, 0.36, 1] as const;

const CTASection = () => {
  return (
    <section className="px-2 md:px-4 pt-4 md:pt-8">
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.98 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.9, ease: EASE }}
        className="relative overflow-hidden rounded-[40px] py-28 px-8 md:px-12"
      >
        <motion.img
          src={ctaBg}
          alt=""
          aria-hidden="true"
          initial={{ scale: 1.15 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 2, ease: EASE }}
          className="absolute inset-0 w-full h-full object-cover"
        />

        <div className="relative max-w-4xl mx-auto z-10 pl-4 md:pl-8">
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, delay: 0.15, ease: EASE }}
            className="text-3xl md:text-5xl lg:text-6xl font-medium tracking-tight leading-[1.08] mb-6 text-white max-w-2xl"
          >
            Spot likely buyers on LinkedIn before everyone else does.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, delay: 0.3, ease: EASE }}
            className="text-base md:text-lg mb-10 max-w-xl leading-relaxed text-white/80"
          >
            Stop relying on broad prospect lists and start focusing on the people already showing movement.
          </motion.p>
          <motion.a
            href="/register"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 18 }}
            className="btn-cta"
          >
            Start for $97
            <ArrowUpRight className="w-4 h-4" />
          </motion.a>
        </div>
      </motion.div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="bg-background px-2 md:px-4 pb-4 md:pb-8 pt-4 md:pt-8">
      <div className="mx-auto bg-[#111113] text-white rounded-[40px] px-8 md:px-12 pt-14 pb-8">
        {/* Top section */}
        <div className="grid gap-12 lg:grid-cols-[minmax(0,320px)_1fr] mb-14">
          {/* Left: logo, description, calls to action */}
          <div>
            <a href="/" className="flex items-center gap-2.5 mb-6">
              <img alt="Intentsly" className="h-8 object-contain" src={intentslyIcon} />
              <span className="text-lg font-medium tracking-tight text-white">Intentsly</span>
            </a>
            <p className="text-sm text-white/50 leading-relaxed mb-8">
              Detect high-intent buying signals and automate personalized outreach — so you reach warm prospects before your competitors do.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="/register"
                className="inline-flex items-center gap-2 bg-[#C8FF00] text-[#111113] text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-full hover:bg-[#d4ff33] transition-colors"
              >
                Start for $97
                <ArrowUpRight className="w-4 h-4" />
              </a>
              <a
                href="/book"
                className="inline-flex items-center gap-2 border border-white/15 text-white text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-full hover:bg-white/10 transition-colors"
              >
                Book a call
              </a>
            </div>
          </div>

          {/* Right: link columns */}
          <nav aria-label="Footer" className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-x-8 gap-y-10">
            {FOOTER_COLUMNS.map((column) => (
              <div key={column.title}>
                <p className="text-xs font-semibold uppercase tracking-wider text-white mb-4">{column.title}</p>
                <ul className="flex flex-col gap-3">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <a href={link.href} className="text-sm text-white/60 hover:text-white transition-colors">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            {LEGAL_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="text-xs text-white/30 hover:text-white/60 transition-colors">
                {link.label}
              </a>
            ))}
          </div>
          <p className="text-xs text-white/30">
            © {new Date().getFullYear()} Intentsly. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export { CTASection, Footer };

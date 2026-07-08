import { useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { CountUp } from "@/lib/motion";

const FinalCTA = () => {
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [website, setWebsite] = useState("");

  const handleFindBuyers = (e: React.FormEvent) => {
    e.preventDefault();
    const url = website.trim();
    if (url) {
      navigate(`/register?website=${encodeURIComponent(url)}`);
    } else {
      navigate("/register");
    }
  };

  return (
    <section className="px-2 md:px-4 pt-4 md:pt-8">
      <div ref={ref} className="relative overflow-hidden rounded-[40px] py-20 px-6 md:py-28 md:px-12 bg-[#050505]">
        {/* Small lime green gradient glow */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[280px]"
          style={{
            background:
              "radial-gradient(50% 100% at 50% 0%, rgba(200,255,0,0.16) 0%, rgba(200,255,0,0.04) 45%, transparent 80%)",
          }}
          aria-hidden
        />

        <div className="relative max-w-4xl mx-auto z-10 text-center">
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

          <h2 className="text-[28px] md:text-5xl lg:text-6xl font-medium tracking-tight leading-[1.08] mb-6 text-white max-w-2xl mx-auto">
            Your next 10 customers are already out there
          </h2>
          <p className="text-base md:text-lg mb-10 max-w-xl leading-relaxed text-white/80 mx-auto">
            Let your agent find them
          </p>
          <form onSubmit={handleFindBuyers} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full max-w-md">
            <input
              type="url"
              placeholder="yourcompany.com"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="flex-1 min-w-0 rounded-full px-5 py-3 text-sm bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:border-lime-400/60 focus:ring-1 focus:ring-lime-400/60 transition-colors"
              required
            />
            <button type="submit" className="btn-cta btn-shimmer group whitespace-nowrap justify-center">
              Find buyers
              <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-0.5" />
            </button>
          </form>

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

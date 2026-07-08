import { useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { CountUp } from "@/lib/motion";
import finalCtaBg from "@/assets/finalcta-bg.png.asset.json";

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
      <div ref={ref} className="relative overflow-hidden rounded-[28px] md:rounded-[40px] py-14 px-5 md:py-28 md:px-12 bg-white">
        {/* Background image */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `url(${finalCtaBg.url})`,
            backgroundSize: "cover",
            backgroundPosition: "center bottom",
            backgroundRepeat: "no-repeat",
          }}
          aria-hidden
        />

        {/* Animated color blobs */}
        <motion.div
          aria-hidden
          animate={{ x: [0, 40, -20, 0], y: [0, -30, 20, 0], scale: [1, 1.15, 0.95, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="pointer-events-none absolute -top-24 -left-24 w-[380px] h-[380px] rounded-full blur-3xl opacity-60"
          style={{ background: "radial-gradient(circle, rgba(200,255,0,0.55), transparent 70%)" }}
        />
        <motion.div
          aria-hidden
          animate={{ x: [0, -30, 25, 0], y: [0, 25, -20, 0], scale: [1, 0.95, 1.1, 1] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          className="pointer-events-none absolute -bottom-24 -right-24 w-[420px] h-[420px] rounded-full blur-3xl opacity-50"
          style={{ background: "radial-gradient(circle, rgba(26,143,227,0.55), transparent 70%)" }}
        />

        <div className="relative max-w-4xl mx-auto z-10 text-center">
          {/* Live counter chip */}
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2 mb-6 px-3.5 py-1.5 rounded-full bg-black/5 backdrop-blur-md border border-black/10"
          >
            <span className="relative flex h-2 w-2">
              <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-900">
              <CountUp to={127} /> buyers showing intent right now
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-[28px] md:text-5xl lg:text-6xl font-medium tracking-tight leading-[1.08] mb-6 text-neutral-900 max-w-2xl mx-auto"
          >
            Your next <span className="font-medium text-[#1A8FE3]">10 customers</span> are already out there
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="text-base md:text-lg mb-10 max-w-xl leading-relaxed text-neutral-700 mx-auto"
          >
            Let your agent find them
          </motion.p>
          <form onSubmit={handleFindBuyers} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full max-w-md mx-auto">
            <input
              type="url"
              placeholder="yourcompany.com"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="flex-1 min-w-0 rounded-full px-5 py-3 text-sm bg-white/70 backdrop-blur border border-black/10 text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:border-[#1A8FE3]/60 focus:ring-1 focus:ring-[#1A8FE3]/60 transition-colors"
              required
            />
            <button type="submit" className="btn-cta btn-shimmer group whitespace-nowrap justify-center">
              Find buyers
              <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-0.5" />
            </button>
          </form>

          {/* Microtrust */}
          <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-neutral-600">
            No contract · Cancel anytime · 5-min setup
          </p>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;

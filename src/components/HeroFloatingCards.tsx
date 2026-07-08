import { TrendingUp, Heart, UserPlus, Sparkles, Check } from "lucide-react";
import { motion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;

const cardBase =
  "absolute bg-white rounded-lg shadow-[0_12px_40px_-10px_rgba(0,0,0,0.2)] px-3.5 py-2.5 flex items-center gap-2.5 z-20";

const HeroFloatingCards = () => {
  return (
    <div className="relative w-full h-full min-h-[560px]">
      {/* Main lead card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.4, ease: EASE }}
        whileHover={{ scale: 1.03, rotate: -0.6, transition: { type: "spring", stiffness: 250, damping: 18 } }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[340px] bg-white rounded-xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.25)] p-5 z-10 cursor-default"
      >
        {/* Pulse ring */}
        <motion.div
          aria-hidden
          animate={{ scale: [1, 1.04, 1], opacity: [0.35, 0, 0.35] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="pointer-events-none absolute inset-0 rounded-xl ring-2 ring-[#3B82F6]/40"
        />
        <div className="flex items-start justify-between mb-4 relative">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ rotate: [0, -6, 6, 0] }}
              transition={{ duration: 0.5 }}
              className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-300 to-amber-600 flex items-center justify-center text-sm font-bold text-white ring-2 ring-white"
            >
              MC
            </motion.div>
            <div>
              <div className="text-[15px] font-semibold text-neutral-900 leading-tight">Michael Chang</div>
              <div className="text-[12px] text-neutral-500">VP Sales · InnovateIQ</div>
            </div>
          </div>
          <motion.span
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            className="text-[10px] font-semibold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100"
          >
            2nd
          </motion.span>
        </div>

        <div className="rounded-lg bg-neutral-50 p-3 mb-3 relative overflow-hidden">
          <motion.div
            aria-hidden
            animate={{ x: ["-120%", "220%"] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.6 }}
            className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/70 to-transparent"
          />
          <div className="flex items-center gap-1.5 mb-1.5 relative">
            <motion.div
              animate={{ rotate: [0, 12, -12, 0], scale: [1, 1.15, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#3B82F6]" />
            </motion.div>
            <span className="text-[11px] font-semibold text-neutral-900 uppercase tracking-wider">Intent detected</span>
          </div>
          <p className="text-[13px] text-neutral-700 leading-snug relative">
            Liked 3 posts about sales automation this week
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Match score</div>
            <div className="text-xl font-bold text-neutral-900">
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                94
              </motion.span>
              <span className="text-sm text-neutral-500">/100</span>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.06, y: -1 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 18 }}
            className="bg-[#0a0a0a] text-white text-[12px] font-semibold rounded-lg px-4 py-2 hover:bg-neutral-800 transition-colors"
          >
            Reach out
          </motion.button>
        </div>
      </motion.div>

      {/* Floating cards */}
      {[
        {
          pos: "top-[6%] left-[-4%] sm:left-[-2%]",
          delay: 0.6,
          float: 0,
          icon: <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />,
          iconBg: "bg-rose-50",
          label: "New signal",
          title: "Liked your post",
          from: { x: -30, y: -20 },
        },
        {
          pos: "top-[18%] right-[-2%] sm:right-[0%]",
          delay: 0.8,
          float: 1,
          icon: <UserPlus className="w-4 h-4 text-neutral-900" />,
          iconBg: "bg-[#C8FF00]",
          label: "+ Followed you",
          title: "Danielle H.",
          from: { x: 30, y: -20 },
        },
        {
          pos: "bottom-[14%] left-[0%] sm:left-[2%]",
          delay: 1.0,
          float: 2,
          icon: (
            <div className="text-[10px] font-bold text-white">RB</div>
          ),
          iconBg: "bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg",
          label: (
            <span className="flex items-center gap-1">
              <TrendingUp className="w-2.5 h-2.5" /> Raised $12M
            </span>
          ),
          title: "RevBoost",
          from: { x: -30, y: 20 },
        },
        {
          pos: "bottom-[6%] right-[-2%] sm:right-[2%]",
          delay: 1.2,
          float: 3,
          icon: <Check className="w-4 h-4 text-white" strokeWidth={3} />,
          iconBg: "bg-emerald-500",
          label: "Meeting booked",
          title: "Tue · 2:00 PM",
          from: { x: 30, y: 20 },
        },
      ].map((c, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: c.from.x, y: c.from.y, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: c.delay, ease: EASE }}
          whileHover={{ scale: 1.08, y: -4, transition: { type: "spring", stiffness: 300, damping: 16 } }}
          className={`${cardBase} ${c.pos} cursor-default`}
          style={{ animationDelay: `${c.float}s` }}
        >
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4 + c.float * 0.4, repeat: Infinity, ease: "easeInOut", delay: c.float * 0.3 }}
            className="flex items-center gap-2.5"
          >
            <div className={`w-8 h-8 ${c.iconBg} ${c.iconBg.includes("rounded") ? "" : "rounded-full"} flex items-center justify-center shrink-0`}>
              {c.icon}
            </div>
            <div>
              <div className="text-[10px] font-medium text-neutral-500 leading-none mb-0.5">{c.label}</div>
              <div className="text-[12px] font-semibold text-neutral-900 leading-tight">{c.title}</div>
            </div>
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
};

export default HeroFloatingCards;

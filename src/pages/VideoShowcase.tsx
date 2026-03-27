import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase, MessageCircle, Send, UserPlus, Radar, Target,
  Zap, TrendingUp, Bot, Flame, Search, ArrowRight
} from "lucide-react";
import avatar1 from "@/assets/video/avatar1.png";
import avatar2 from "@/assets/video/avatar2.png";
import avatar3 from "@/assets/video/avatar3.png";
import avatar4 from "@/assets/video/avatar4.png";
import avatar5 from "@/assets/video/avatar5.png";

const avatars = [avatar1, avatar2, avatar3, avatar4, avatar5];

// ── Scene timing (ms) ─────────────────────────────────
const SCENE_DURATIONS = [
  4000, // 0: LinkedIn feed + "Mmh.."
  3500, // 1: "After a hundred reach-outs today..."
  4500, // 2: Spammy message + angry reply
  4000, // 3: "It's spending hours building lists"
  4000, // 4: "and hoping volume will fix the problem"
  5000, // 5: Radar - detects high-intent people
  5000, // 6: Engages them with personalized outreach
  4500, // 7: "Our AI understands your offer"
  5000, // 8: "Monitors buying signals in real time"
  4000, // 9: Signal cards (job changes, competitor interactions)
  5000, // 10: "AI agents score and prioritize"
  5000, // 11: "personalized outreach campaigns"
  4000, // 12: "replies" celebration
  6000, // 13: Final CTA - Intentsly logo
];

const TOTAL_SCENES = SCENE_DURATIONS.length;

// ── Grid background ────────────────────────────────────
const GridBg = ({ pink = false }: { pink?: boolean }) => (
  <div
    className="absolute inset-0 opacity-20"
    style={{
      backgroundSize: "80px 80px",
      backgroundImage: `
        linear-gradient(to right, ${pink ? "hsl(0 60% 80% / 0.3)" : "hsl(0 0% 80% / 0.3)"} 1px, transparent 1px),
        linear-gradient(to bottom, ${pink ? "hsl(0 60% 80% / 0.3)" : "hsl(0 0% 80% / 0.3)"} 1px, transparent 1px)
      `,
    }}
  />
);

// ── Avatar circle ──────────────────────────────────────
const Avatar = ({ src, size = 64, delay = 0 }: { src: string; size?: number; delay?: number }) => (
  <motion.div
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ type: "spring", damping: 15, delay }}
    className="rounded-full overflow-hidden border-2 border-white shadow-lg"
    style={{ width: size, height: size }}
  >
    <img src={src} alt="" className="w-full h-full object-cover" />
  </motion.div>
);

// ── Animated text with highlighted word ────────────────
const AnimatedHeading = ({
  text,
  highlight,
  delay = 0,
}: {
  text: string;
  highlight?: string;
  delay?: number;
}) => {
  const parts = highlight ? text.split(highlight) : [text];
  return (
    <motion.h2
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="text-4xl md:text-6xl font-bold text-foreground text-center leading-tight tracking-tight"
    >
      {parts[0]}
      {highlight && (
        <span
          className="bg-gradient-to-r from-red-500 to-orange-400 bg-clip-text text-transparent"
        >
          {highlight}
        </span>
      )}
      {parts[1] || ""}
    </motion.h2>
  );
};

// ── Scene 0: LinkedIn Feed + "Mmh.." ──────────────────
const Scene0 = () => (
  <div className="relative w-full h-full flex flex-col items-center justify-center">
    <GridBg />
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-5xl md:text-7xl font-bold text-foreground mb-12"
    >
      Mmh..
    </motion.div>
    <motion.div
      initial={{ opacity: 0, y: 60, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.3 }}
      className="w-[700px] max-w-[90vw] bg-white rounded-2xl shadow-2xl border border-border overflow-hidden"
    >
      {/* LinkedIn top bar */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-border/50">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <div className="w-6 h-6 text-blue-600 font-bold">in</div>
        <div className="flex-1 h-8 bg-muted rounded-full" />
      </div>
      {/* Feed content */}
      <div className="flex gap-4 p-5">
        <div className="w-32 space-y-3">
          <div className="h-20 bg-gradient-to-br from-blue-900 to-blue-600 rounded-lg" />
          <div className="space-y-2">
            <div className="h-3 bg-muted rounded w-full" />
            <div className="h-3 bg-muted rounded w-3/4" />
          </div>
        </div>
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden">
              <img src={avatar1} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 h-4 bg-muted rounded" />
          </div>
          <div className="h-32 bg-muted rounded-lg" />
        </div>
        <div className="w-40 space-y-3">
          <div className="h-3 bg-muted rounded w-full" />
          <div className="h-3 bg-muted rounded w-4/5" />
          <div className="h-3 bg-muted rounded w-3/5" />
        </div>
      </div>
    </motion.div>
  </div>
);

// ── Scene 1: "After a hundred reach-outs today..." ────
const Scene1 = () => (
  <div className="relative w-full h-full flex items-center justify-center">
    <GridBg />
    <AnimatedHeading text="After a hundred reach-outs today..." />
  </div>
);

// ── Scene 2: Spammy message + angry reply ─────────────
const Scene2 = () => (
  <div className="relative w-full h-full flex items-center justify-center">
    <GridBg />
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="w-[500px] max-w-[90vw] bg-white rounded-2xl shadow-2xl p-6 space-y-5"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
          <img src={avatar2} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground italic">
            Dear Ethan Carter,<br />
            I'm about to send you a LinkedIn message you didn't ask for.<br /><br />
            If now is a bad time, I fully deserve to be ignored 😅<br /><br />
            But if you need more clients I can make a call with you.
          </p>
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        className="flex items-start gap-3"
      >
        <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
          <img src={avatar4} alt="" className="w-full h-full object-cover" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            F*CK YOU<br />
            <span className="font-normal text-muted-foreground">Best regards</span>
          </p>
        </div>
      </motion.div>
    </motion.div>
  </div>
);

// ── Scene 3: "It's spending hours building lists" ─────
const Scene3 = () => (
  <div className="relative w-full h-full flex flex-col items-center justify-center gap-8">
    <GridBg />
    <AnimatedHeading text="It's spending hours building lists" highlight="building lists" />
    <motion.div
      initial={{ opacity: 0, y: 50, rotateX: 10 }}
      animate={{ opacity: 1, y: 0, rotateX: 5 }}
      transition={{ delay: 0.4, duration: 0.8 }}
      className="w-[700px] max-w-[90vw] bg-white rounded-2xl shadow-2xl border border-border overflow-hidden"
      style={{ perspective: 1000, transform: "perspective(1000px) rotateX(5deg)" }}
    >
      {/* Green header bar */}
      <div className="bg-green-600 px-4 py-2 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-white/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-white/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-white/50" />
        </div>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-2 bg-green-400/50 rounded w-10" />
        ))}
      </div>
      {/* Spreadsheet rows */}
      <div className="p-1">
        {[...Array(12)].map((_, row) => (
          <div key={row} className="flex border-b border-border/30">
            <div className="w-8 text-[10px] text-muted-foreground text-center py-1">{row + 1}</div>
            {[...Array(8)].map((_, col) => (
              <div key={col} className="flex-1 border-l border-border/20 py-1 px-2">
                {Math.random() > 0.3 && (
                  <div
                    className="h-2 bg-muted rounded"
                    style={{ width: `${30 + Math.random() * 60}%` }}
                  />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </motion.div>
  </div>
);

// ── Scene 4: "hoping volume will fix the problem" ─────
const Scene4 = () => (
  <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
    <GridBg />
    {/* Scattered message cards in background */}
    {[...Array(8)].map((_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.15 + Math.random() * 0.25, scale: 1 }}
        transition={{ delay: i * 0.1, duration: 0.5 }}
        className="absolute bg-white rounded-xl shadow-lg p-3 w-48"
        style={{
          left: `${10 + (i % 4) * 22}%`,
          top: `${10 + Math.floor(i / 4) * 45}%`,
          transform: `rotate(${-5 + Math.random() * 10}deg)`,
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full overflow-hidden">
            <img src={avatars[i % 5]} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="h-2 bg-muted rounded flex-1" />
        </div>
        <div className="space-y-1">
          <div className="h-2 bg-muted rounded w-full" />
          <div className="h-2 bg-muted rounded w-3/4" />
        </div>
      </motion.div>
    ))}
    <AnimatedHeading
      text="and hoping volume will fix the problem"
      highlight="fix the problem"
      delay={0.3}
    />
  </div>
);

// ── Scene 5: Radar - "detects high-intent people" ─────
const Scene5 = () => (
  <div className="relative w-full h-full flex flex-col items-center justify-center"
    style={{ background: "linear-gradient(180deg, hsl(0 0% 98%) 0%, hsl(15 80% 95%) 100%)" }}
  >
    <GridBg pink />
    <AnimatedHeading text="detects high-intent people" highlight="high-intent" />
    <div className="relative mt-12" style={{ width: 400, height: 400 }}>
      {/* Concentric circles */}
      {[1, 0.75, 0.5, 0.3].map((scale, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale, opacity: 0.15 + i * 0.1 }}
          transition={{ delay: 0.3 + i * 0.15, duration: 0.8, type: "spring" }}
          className="absolute inset-0 rounded-full"
          style={{ background: "radial-gradient(circle, hsl(10 70% 80%) 0%, hsl(10 70% 85% / 0) 70%)" }}
        />
      ))}
      {/* Center logo */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.8, type: "spring", damping: 12 }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full shadow-xl flex items-center justify-center"
      >
        <Flame className="w-8 h-8 text-orange-500" />
      </motion.div>
      {/* Avatars positioned on rings */}
      {[
        { x: -120, y: -80, delay: 1.0 },
        { x: 100, y: -60, delay: 1.2 },
        { x: 0, y: -130, delay: 1.1 },
        { x: -80, y: 100, delay: 1.3 },
        { x: 120, y: 80, delay: 1.4 },
      ].map((pos, i) => (
        <div
          key={i}
          className="absolute left-1/2 top-1/2"
          style={{ transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))` }}
        >
          <Avatar src={avatars[i]} size={56} delay={pos.delay} />
        </div>
      ))}
    </div>
  </div>
);

// ── Scene 6: "engages with personalized outreach" ─────
const Scene6 = () => (
  <div className="relative w-full h-full flex flex-col items-center justify-center gap-10"
    style={{ background: "linear-gradient(180deg, hsl(0 0% 98%) 0%, hsl(15 80% 95%) 100%)" }}
  >
    <GridBg pink />
    <AnimatedHeading
      text="engages them at the right moment with personalized LinkedIn outreach"
      highlight="personalized LinkedIn outreach"
    />
    <div className="flex gap-6 mt-4">
      {[
        { icon: UserPlus, title: "Send Invitation", step: 1, color: "bg-blue-600" },
        { icon: Send, title: "Send Message", step: 2, color: "bg-blue-500" },
      ].map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 40, x: i === 0 ? -30 : 30 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          transition={{ delay: 0.5 + i * 0.2, duration: 0.6, type: "spring" }}
          className="w-64 bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          <div className={`${item.color} px-4 py-3 flex items-center gap-3`}>
            <item.icon className="w-5 h-5 text-white" />
            <div>
              <div className="text-white font-semibold text-sm">{item.title}</div>
              <div className="text-white/70 text-xs">Step {item.step}</div>
            </div>
          </div>
          <div className="p-4 space-y-2">
            <div className="h-2.5 bg-muted rounded w-full" />
            <div className="h-2.5 bg-muted rounded w-4/5" />
            <div className="h-2.5 bg-muted rounded w-3/5" />
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

// ── Scene 7: "Our AI understands your offer" ──────────
const Scene7 = () => (
  <div className="relative w-full h-full flex flex-col items-center justify-center gap-8"
    style={{ background: "linear-gradient(180deg, hsl(0 0% 98%) 0%, hsl(15 80% 95%) 100%)" }}
  >
    <GridBg pink />
    <AnimatedHeading text="Our AI understands your offer" highlight="offer" />
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.7 }}
      className="w-[600px] max-w-[90vw] bg-white rounded-2xl shadow-2xl p-6 space-y-4"
    >
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Website</div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-10 bg-muted rounded-lg px-3 flex items-center">
            <span className="text-sm text-muted-foreground">yourcompany.com</span>
          </div>
          <motion.button
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1, type: "spring" }}
            className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium"
          >
            Analyze
          </motion.button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {["Industry", "Pain Points"].map((label, i) => (
          <div key={i} className="space-y-1.5">
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</div>
            <div className="h-16 bg-muted/50 rounded-lg" />
          </div>
        ))}
      </div>
    </motion.div>
  </div>
);

// ── Scene 8: "monitors buying signals in real time" ───
const Scene8 = () => (
  <div className="relative w-full h-full flex flex-col items-center justify-center gap-8"
    style={{ background: "linear-gradient(180deg, hsl(0 0% 98%) 0%, hsl(15 80% 95%) 100%)" }}
  >
    <GridBg pink />
    <AnimatedHeading text="It then monitors buying signals in real time" highlight="in real time" />
    <motion.div
      initial={{ opacity: 0, y: 50, rotateX: 10 }}
      animate={{ opacity: 1, y: 0, rotateX: 5 }}
      transition={{ delay: 0.4, duration: 0.8 }}
      className="w-[650px] max-w-[90vw] bg-white rounded-2xl shadow-2xl p-5"
      style={{ perspective: 1000, transform: "perspective(1000px) rotateX(3deg)" }}
    >
      {/* AI Agent badge */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.8, type: "spring" }}
        className="flex items-center gap-3 mb-4 bg-muted/30 rounded-xl px-4 py-3 w-fit"
      >
        <Bot className="w-6 h-6 text-foreground" />
        <span className="font-semibold">AI Agent</span>
        <span className="text-green-500 text-sm font-medium">Active</span>
        <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
      </motion.div>
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { val: "582", label: "Leads tracked" },
          { val: "235", label: "Signals found" },
          { val: "98", label: "High intent" },
          { val: "$782", label: "Pipeline value" },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 + i * 0.1 }}
            className="bg-muted/30 rounded-lg p-3 text-center"
          >
            <div className="text-lg font-bold text-foreground">{stat.val}</div>
            <div className="text-[10px] text-muted-foreground">{stat.label}</div>
          </motion.div>
        ))}
      </div>
      {/* Chart placeholder */}
      <div className="h-24 flex items-end gap-1">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: 15 + Math.random() * 70 }}
            transition={{ delay: 1.2 + i * 0.05, duration: 0.4 }}
            className="flex-1 bg-gradient-to-t from-orange-400 to-red-400 rounded-t-sm opacity-60"
          />
        ))}
      </div>
    </motion.div>
  </div>
);

// ── Scene 9: Signal cards ─────────────────────────────
const Scene9 = () => (
  <div className="relative w-full h-full flex items-center justify-center gap-8"
    style={{ background: "linear-gradient(180deg, hsl(15 80% 95%) 0%, hsl(15 70% 92%) 100%)" }}
  >
    <GridBg pink />
    {[
      { icon: Briefcase, label: "job changes" },
      { icon: MessageCircle, label: "competitor interactions" },
      { icon: TrendingUp, label: "funding rounds" },
    ].map((card, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, scale: 0.8, rotate: -5 + i * 5 }}
        animate={{ opacity: 1, scale: 1, rotate: -5 + i * 5 }}
        transition={{ delay: 0.2 + i * 0.2, type: "spring", damping: 15 }}
        className="bg-white rounded-2xl shadow-xl p-6 w-52 flex flex-col items-center gap-4"
      >
        <div className="w-20 h-20 bg-muted/30 rounded-xl flex items-center justify-center border border-border">
          <card.icon className="w-8 h-8 text-foreground/60" />
        </div>
        <span className="font-bold text-sm text-foreground">{card.label}</span>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.8 + i * 0.15, type: "spring" }}
          className="w-3 h-3 bg-red-500 rounded-full absolute -top-1 -right-1"
        />
      </motion.div>
    ))}
  </div>
);

// ── Scene 10: "AI agents score and prioritize" ────────
const Scene10 = () => {
  const leads = [
    { name: "Camille Fournier", title: "Brand Strategist", company: "BETC", fire: 3 },
    { name: "Sophie Lambert", title: "Growth Lead", company: "Doctolib", fire: 2 },
    { name: "Élodie Martin", title: "Digital Marketing", company: "Decathlon", fire: 3 },
    { name: "Thomas Gilbert", title: "Product Marketing", company: "Qonto", fire: 1 },
  ];

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center gap-8"
      style={{ background: "linear-gradient(180deg, hsl(0 0% 98%) 0%, hsl(15 80% 95%) 100%)" }}
    >
      <GridBg pink />
      <AnimatedHeading
        text="AI agents score and prioritize the most active prospects"
        highlight="active prospects"
      />
      <motion.div
        initial={{ opacity: 0, y: 50, rotateX: 8 }}
        animate={{ opacity: 1, y: 0, rotateX: 4 }}
        transition={{ delay: 0.4, duration: 0.7 }}
        className="w-[700px] max-w-[90vw] bg-white rounded-2xl shadow-2xl overflow-hidden"
        style={{ transform: "perspective(1000px) rotateX(4deg)" }}
      >
        {leads.map((lead, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + i * 0.15 }}
            className="flex items-center gap-4 px-5 py-3 border-b border-border/30"
          >
            <div className="w-4 h-4 border-2 border-border rounded" />
            <div className="w-9 h-9 rounded-full overflow-hidden">
              <img src={avatars[i]} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">{lead.name}</span>
                <span className="text-blue-600 text-xs font-bold">in</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {lead.title} · {lead.company}
              </div>
            </div>
            <div className="flex gap-0.5">
              {[...Array(lead.fire)].map((_, j) => (
                <span key={j} className="text-sm">🔥</span>
              ))}
            </div>
            <div className="flex gap-1">
              <div className="w-8 h-3 bg-green-400 rounded-full" />
              <div className="w-8 h-3 bg-orange-300 rounded-full" />
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

// ── Scene 11: "personalized outreach campaigns" ───────
const Scene11 = () => (
  <div className="relative w-full h-full flex flex-col items-center justify-center gap-8"
    style={{ background: "linear-gradient(180deg, hsl(15 80% 95%) 0%, hsl(15 70% 92%) 100%)" }}
  >
    <GridBg pink />
    <AnimatedHeading text="personalized outreach campaigns" highlight="outreach campaigns" />
    <div className="flex gap-6 items-start mt-4">
      {[1, 2, 3, 4].map((step, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 + i * 0.15, type: "spring" }}
          className="relative"
        >
          <div className="w-48 bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-400 px-3 py-2 flex items-center gap-2">
              <Send className="w-3.5 h-3.5 text-white" />
              <span className="text-white text-xs font-semibold">Send Message</span>
              <span className="text-white/70 text-[10px] ml-auto">Step {step}</span>
            </div>
            <div className="p-3 space-y-2">
              <div className="text-[10px] text-muted-foreground font-medium">MESSAGE:</div>
              <div className="space-y-1">
                <div className="h-1.5 bg-muted rounded w-full" />
                <div className="h-1.5 bg-muted rounded w-4/5" />
              </div>
              <div className="flex gap-1.5 mt-2">
                <div className="text-[9px] px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                  {20 + i * 18} contact(s)
                </div>
                <div className="text-[9px] px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                  {3 + i * 4} answer(s)
                </div>
              </div>
            </div>
          </div>
          {/* Dashed connector */}
          {i < 3 && (
            <div className="absolute right-0 top-1/2 w-6 border-t-2 border-dashed border-blue-300 translate-x-full" />
          )}
        </motion.div>
      ))}
    </div>
  </div>
);

// ── Scene 12: "replies" celebration ───────────────────
const Scene12 = () => (
  <div className="relative w-full h-full flex items-center justify-center overflow-hidden"
    style={{ background: "linear-gradient(180deg, hsl(15 80% 95%) 0%, hsl(15 70% 90%) 100%)" }}
  >
    <GridBg pink />
    {/* Floating reply badges */}
    {[...Array(6)].map((_, i) => (
      <motion.div
        key={i}
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: [0, 1.2, 1],
          opacity: [0, 1, 0.8],
          y: [0, -20, 10],
        }}
        transition={{ delay: 0.3 + i * 0.2, duration: 0.8 }}
        className="absolute bg-red-500 text-white font-bold px-6 py-3 rounded-full text-lg shadow-xl"
        style={{
          left: `${15 + (i % 3) * 30}%`,
          top: `${25 + Math.floor(i / 3) * 35}%`,
        }}
      >
        replies 🎉
      </motion.div>
    ))}
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.8, type: "spring", damping: 10 }}
      className="text-6xl md:text-8xl font-bold text-center z-10"
    >
      <span className="text-foreground">and </span>
      <span className="bg-gradient-to-r from-red-500 to-orange-400 bg-clip-text text-transparent">
        replies!
      </span>
      <span className="text-4xl ml-2">🎉</span>
    </motion.div>
  </div>
);

// ── Scene 13: Final CTA ───────────────────────────────
const Scene13 = () => (
  <div className="relative w-full h-full flex flex-col items-center justify-center gap-8"
    style={{ background: "linear-gradient(135deg, hsl(15 70% 92%) 0%, hsl(30 60% 90%) 50%, hsl(15 80% 95%) 100%)" }}
  >
    <GridBg pink />
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", damping: 12 }}
      className="text-5xl md:text-7xl font-bold text-foreground tracking-tight"
    >
      Intentsly
    </motion.div>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.6 }}
    >
      <AnimatedHeading
        text="Reach buyers when they are ready"
        highlight="ready"
        delay={0.5}
      />
    </motion.div>
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1.2, type: "spring" }}
      className="px-10 py-4 bg-red-500 text-white font-semibold text-lg rounded-full shadow-xl hover:bg-red-600 transition-colors"
    >
      Try now
    </motion.button>
    {/* Cursor animation */}
    <motion.div
      initial={{ opacity: 0, x: -50, y: 50 }}
      animate={{ opacity: 1, x: -20, y: 20 }}
      transition={{ delay: 1.8, duration: 0.8 }}
      className="absolute"
      style={{ bottom: "28%", left: "52%" }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M5 3L19 12L12 13L9 20L5 3Z" fill="#333" stroke="#fff" strokeWidth="1" />
      </svg>
    </motion.div>
  </div>
);

const SCENES = [
  Scene0, Scene1, Scene2, Scene3, Scene4, Scene5,
  Scene6, Scene7, Scene8, Scene9, Scene10, Scene11,
  Scene12, Scene13,
];

// ── Main Video Showcase Page ──────────────────────────
const VideoShowcase = () => {
  const [currentScene, setCurrentScene] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setTimeout(() => {
      setCurrentScene((prev) => (prev + 1) % TOTAL_SCENES);
    }, SCENE_DURATIONS[currentScene]);
    return () => clearTimeout(timer);
  }, [currentScene, isPlaying]);

  const CurrentSceneComponent = SCENES[currentScene];

  return (
    <div className="w-screen h-screen overflow-hidden relative bg-background">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScene}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          <CurrentSceneComponent />
        </motion.div>
      </AnimatePresence>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/30 z-50">
        <motion.div
          key={currentScene}
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: SCENE_DURATIONS[currentScene] / 1000, ease: "linear" }}
          className="h-full bg-gradient-to-r from-red-500 to-orange-400"
        />
      </div>

      {/* Controls */}
      <div className="absolute bottom-4 right-4 flex gap-2 z-50">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="px-3 py-1.5 bg-white/80 rounded-lg text-xs font-medium shadow-sm backdrop-blur-sm"
        >
          {isPlaying ? "⏸ Pause" : "▶ Play"}
        </button>
        <button
          onClick={() => setCurrentScene((prev) => (prev + 1) % TOTAL_SCENES)}
          className="px-3 py-1.5 bg-white/80 rounded-lg text-xs font-medium shadow-sm backdrop-blur-sm"
        >
          Next →
        </button>
      </div>

      {/* Scene counter */}
      <div className="absolute top-4 right-4 z-50 px-3 py-1.5 bg-white/60 rounded-lg text-xs font-mono backdrop-blur-sm">
        {currentScene + 1} / {TOTAL_SCENES}
      </div>
    </div>
  );
};

export default VideoShowcase;

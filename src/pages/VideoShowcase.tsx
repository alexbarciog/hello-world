import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import {
  Briefcase, MessageCircle, Send, UserPlus, Radar, Target,
  Zap, TrendingUp, Bot, Flame, Search, ArrowRight, X
} from "lucide-react";
import avatar1 from "@/assets/video/avatar1.png";
import avatar2 from "@/assets/video/avatar2.png";
import avatar3 from "@/assets/video/avatar3.png";
import avatar4 from "@/assets/video/avatar4.png";
import avatar5 from "@/assets/video/avatar5.png";

const avatars = [avatar1, avatar2, avatar3, avatar4, avatar5];

// ── Scene timing (ms) ─────────────────────────────────
const SCENE_DURATIONS = [
  7000, // 0: LinkedIn feed + "Mmh.." + message card + cursor
  5000, // 1: Zoom into message → cursor clicks Envoyer
  4000, // 2: Angry reply "F*CK YOU"
  4500, // 3: "It's spending hours building lists"
  4000, // 4: "hoping volume will fix the problem"
  5500, // 5: Radar - detects high-intent people
  5500, // 6: Engages them with personalized outreach
  5000, // 7: "Our AI understands your offer"
  5500, // 8: "Monitors buying signals in real time"
  4500, // 9: Signal cards (job changes, competitor interactions)
  5500, // 10: "AI agents score and prioritize"
  5500, // 11: "personalized outreach campaigns"
  4500, // 12: "replies" celebration
  6000, // 13: Final CTA - Intentsly logo
];

const TOTAL_SCENES = SCENE_DURATIONS.length;

// ── Animated Cursor ────────────────────────────────────
const AnimatedCursor = ({
  positions,
  clicking = false,
  clickAt,
}: {
  positions: { x: number; y: number; delay: number; duration?: number }[];
  clicking?: boolean;
  clickAt?: number; // index of position where click happens
}) => {
  return (
    <motion.div
      className="absolute z-50 pointer-events-none"
      initial={{ x: positions[0]?.x ?? 0, y: positions[0]?.y ?? 0, opacity: 0 }}
      animate={{
        x: positions.map((p) => p.x),
        y: positions.map((p) => p.y),
        opacity: [0, 1, ...positions.slice(2).map(() => 1)],
      }}
      transition={{
        x: { times: positions.map((p, i) => p.delay / (positions[positions.length - 1]?.delay || 1)), duration: positions[positions.length - 1]?.delay || 2, ease: "easeInOut" },
        y: { times: positions.map((p, i) => p.delay / (positions[positions.length - 1]?.delay || 1)), duration: positions[positions.length - 1]?.delay || 2, ease: "easeInOut" },
        opacity: { duration: 0.3 },
      }}
    >
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="drop-shadow-lg">
        <path d="M8 4L24 16L16 17.5L12 26L8 4Z" fill="#1a1a1a" stroke="#ffffff" strokeWidth="1.5" />
      </svg>
      {clicking && clickAt !== undefined && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.5, 0], opacity: [0, 0.4, 0] }}
          transition={{ delay: positions[clickAt]?.delay || 0, duration: 0.4 }}
          className="absolute top-0 left-0 w-8 h-8 rounded-full bg-foreground/20"
        />
      )}
    </motion.div>
  );
};

// ── Typewriter Text ────────────────────────────────────
const TypewriterText = ({
  text,
  delay = 0,
  speed = 0.08,
  className = "",
}: {
  text: string;
  delay?: number;
  speed?: number;
  className?: string;
}) => {
  const [displayed, setDisplayed] = useState("");
  
  useEffect(() => {
    const timeout = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        if (i < text.length) {
          setDisplayed(text.slice(0, i + 1));
          i++;
        } else {
          clearInterval(interval);
        }
      }, speed * 1000);
      return () => clearInterval(interval);
    }, delay * 1000);
    return () => clearTimeout(timeout);
  }, [text, delay, speed]);
  
  return (
    <span className={className}>
      {displayed}
      {displayed.length < text.length && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ repeat: Infinity, duration: 0.5 }}
          className="inline-block w-[3px] h-[1em] bg-foreground ml-0.5 align-middle"
        />
      )}
    </span>
  );
};

// ── Grid background ────────────────────────────────────
const GridBg = ({ pink = false }: { pink?: boolean }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 0.25 }}
    transition={{ duration: 1.5 }}
    className="absolute inset-0"
    style={{
      backgroundSize: "80px 80px",
      backgroundImage: `
        linear-gradient(to right, ${pink ? "hsl(0 60% 80% / 0.3)" : "hsl(0 0% 80% / 0.3)"} 1px, transparent 1px),
        linear-gradient(to bottom, ${pink ? "hsl(0 60% 80% / 0.3)" : "hsl(0 0% 80% / 0.3)"} 1px, transparent 1px)
      `,
    }}
  />
);

// ── Floating Particles ─────────────────────────────────
const FloatingParticles = ({ count = 6, color = "bg-foreground/5" }: { count?: number; color?: string }) => (
  <>
    {[...Array(count)].map((_, i) => (
      <motion.div
        key={i}
        className={`absolute ${color} rounded-full`}
        style={{
          width: 4 + Math.random() * 8,
          height: 4 + Math.random() * 8,
          left: `${10 + Math.random() * 80}%`,
          top: `${10 + Math.random() * 80}%`,
        }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{
          opacity: [0, 0.6, 0],
          scale: [0, 1, 0.5],
          y: [0, -30 - Math.random() * 40, -60],
        }}
        transition={{
          duration: 3 + Math.random() * 2,
          delay: i * 0.3,
          repeat: Infinity,
          repeatDelay: 1,
        }}
      />
    ))}
  </>
);

// ── Avatar circle ──────────────────────────────────────
const AvatarCircle = ({ src, size = 64, delay = 0 }: { src: string; size?: number; delay?: number }) => (
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

// ── Animated Heading ───────────────────────────────────
const AnimatedHeading = ({
  text,
  highlight,
  delay = 0,
  size = "text-4xl md:text-6xl",
}: {
  text: string;
  highlight?: string;
  delay?: number;
  size?: string;
}) => {
  const parts = highlight ? text.split(highlight) : [text];
  return (
    <motion.h2
      initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.8, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`${size} font-bold text-foreground text-center leading-tight tracking-tight max-w-4xl px-8`}
    >
      {parts[0]}
      {highlight && (
        <span className="bg-gradient-to-r from-red-500 to-orange-400 bg-clip-text text-transparent">
          {highlight}
        </span>
      )}
      {parts[1] || ""}
    </motion.h2>
  );
};

// ── LinkedIn Browser Mock ──────────────────────────────
const LinkedInBrowser = ({ scale = 1, className = "" }: { scale?: number; className?: string }) => (
  <div className={`w-[800px] max-w-[95vw] bg-[#f3f2ee] rounded-2xl shadow-2xl border border-black/5 overflow-hidden ${className}`}>
    {/* Top bar */}
    <div className="flex items-center gap-3 px-5 py-3 bg-white border-b border-black/5">
      <div className="flex gap-1.5">
        <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
        <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
        <div className="w-3 h-3 rounded-full bg-[#28c840]" />
      </div>
      <div className="text-blue-700 font-bold text-lg ml-3 tracking-tight">in</div>
      <div className="flex-1 flex items-center">
        <div className="flex-1 h-8 bg-[#eef3f8] rounded-md flex items-center px-3">
          <Search className="w-3.5 h-3.5 text-muted-foreground/50" />
        </div>
      </div>
      <div className="flex gap-3 ml-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="w-6 h-6 bg-muted/40 rounded" />
        ))}
        <div className="w-7 h-7 rounded-full overflow-hidden">
          <img src={avatar1} alt="" className="w-full h-full object-cover" />
        </div>
      </div>
    </div>
    
    {/* Content area */}
    <div className="flex gap-4 p-4">
      {/* Left sidebar */}
      <div className="w-[180px] shrink-0 space-y-3">
        <div className="bg-white rounded-lg overflow-hidden shadow-sm">
          <div className="h-16 bg-gradient-to-br from-blue-900 to-blue-500 relative">
            <div className="absolute -bottom-5 left-4 w-12 h-12 rounded-full border-2 border-white overflow-hidden">
              <img src={avatar1} alt="" className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="pt-7 pb-3 px-3 space-y-1">
            <div className="h-2.5 bg-muted rounded w-3/4" />
            <div className="h-2 bg-muted/60 rounded w-full" />
            <div className="h-2 bg-muted/40 rounded w-2/3" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm space-y-2">
          <div className="h-2 bg-muted rounded w-full" />
          <div className="h-2 bg-muted/60 rounded w-4/5" />
          <div className="h-2 bg-muted/40 rounded w-3/5" />
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <div className="w-8 h-8 bg-blue-600 rounded-md mb-2 flex items-center justify-center">
            <span className="text-white text-xs font-bold">in</span>
          </div>
          <div className="space-y-1.5">
            <div className="h-2 bg-muted rounded w-full" />
            <div className="h-2 bg-muted/60 rounded w-3/4" />
          </div>
        </div>
      </div>
      
      {/* Main feed */}
      <div className="flex-1 space-y-3">
        {/* Create post */}
        <div className="bg-white rounded-lg p-3 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
            <img src={avatar2} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 h-9 bg-[#eef3f8] rounded-full" />
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 bg-green-500 rounded-sm" />
            <div className="h-2 bg-muted rounded w-12" />
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 bg-blue-500 rounded-sm" />
            <div className="h-2 bg-muted rounded w-10" />
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 bg-red-400 rounded-sm" />
            <div className="h-2 bg-muted rounded w-14" />
          </div>
        </div>
        
        {/* Post */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-3 flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
              <img src={avatar3} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="h-2.5 bg-muted rounded w-32" />
              <div className="h-2 bg-muted/50 rounded w-20" />
            </div>
          </div>
          <div className="px-3 pb-2 space-y-1.5">
            <div className="h-2 bg-muted/60 rounded w-full" />
            <div className="h-2 bg-muted/40 rounded w-4/5" />
          </div>
          <div className="mx-3 mb-3 h-44 bg-gradient-to-br from-muted/30 to-muted/60 rounded-lg overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=300&fit=crop" 
              alt="" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
      
      {/* Right sidebar */}
      <div className="w-[200px] shrink-0 space-y-3">
        <div className="bg-white rounded-lg p-3 shadow-sm space-y-2">
          <div className="h-2.5 bg-muted rounded w-3/4" />
          <div className="h-2 bg-muted/50 rounded w-full" />
          <div className="h-2 bg-muted/50 rounded w-4/5" />
          <div className="h-2 bg-muted/40 rounded w-3/5" />
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm space-y-2">
          <div className="h-2.5 bg-muted rounded w-2/3" />
          <div className="h-2 bg-muted/50 rounded w-full" />
          <div className="h-2 bg-muted/40 rounded w-4/5" />
        </div>
      </div>
    </div>
  </div>
);

// ── Message Card (LinkedIn DM style) ───────────────────
const MessageCard = ({ 
  animateIn = true, 
  delay = 0,
  showFull = false,
}: { 
  animateIn?: boolean; 
  delay?: number;
  showFull?: boolean;
}) => (
  <motion.div
    initial={animateIn ? { opacity: 0, y: 40, scale: 0.9 } : false}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ delay, duration: 0.6, type: "spring", damping: 20 }}
    className={`bg-white rounded-xl shadow-2xl border border-black/5 overflow-hidden ${showFull ? 'w-[500px]' : 'w-[280px]'}`}
  >
    {/* Header */}
    <div className="flex items-center gap-3 p-4 border-b border-black/5">
      <div className="w-12 h-12 rounded-full overflow-hidden relative">
        <img src={avatar1} alt="" className="w-full h-full object-cover" />
        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
      </div>
      <div className="flex-1 space-y-1">
        <div className="h-2.5 bg-muted rounded w-24" />
        <div className="h-2 bg-muted/50 rounded w-16" />
      </div>
      <X className="w-4 h-4 text-muted-foreground/40" />
    </div>
    
    {/* Message body */}
    <div className="p-4">
      <div className="bg-[#f3f2ee] rounded-lg p-4 space-y-3">
        <p className={`text-foreground/80 leading-relaxed ${showFull ? 'text-base' : 'text-sm'}`}>
          Dear Ethan Carter,
        </p>
        <p className={`text-foreground/80 leading-relaxed ${showFull ? 'text-base' : 'text-sm'}`}>
          I'm about to send you a LinkedIn message you didn't ask for.
        </p>
        <p className={`text-foreground/80 leading-relaxed ${showFull ? 'text-base' : 'text-sm'}`}>
          If now is a bad time, I fully deserve to be ignored 😅
        </p>
        <p className={`text-foreground/80 leading-relaxed ${showFull ? 'text-base' : 'text-sm'}`}>
          But if you need more clients I can make a call with you.
        </p>
      </div>
    </div>
    
    {/* Footer */}
    <div className="px-4 pb-4 flex items-center justify-between">
      <div className="flex gap-1.5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="w-6 h-6 bg-muted/40 rounded" />
        ))}
      </div>
      <motion.button
        className="px-5 py-2 bg-[#0a66c2] text-white text-sm font-semibold rounded-full"
        whileHover={{ scale: 1.05 }}
      >
        Envoyer
      </motion.button>
    </div>
  </motion.div>
);

// ══════════════════════════════════════════════════════
// SCENE 0: LinkedIn feed + "Mmh..." + message popup + cursor
// ══════════════════════════════════════════════════════
const Scene0 = () => {
  const [phase, setPhase] = useState(0);
  
  useEffect(() => {
    // Phase 0: grid appears (instant)
    // Phase 1: "Mmh..." starts typing at 0.3s
    const t1 = setTimeout(() => setPhase(1), 300);
    // Phase 2: LinkedIn window slides up at 1.5s
    const t2 = setTimeout(() => setPhase(2), 1500);
    // Phase 3: Message card appears at 3.5s  
    const t3 = setTimeout(() => setPhase(3), 3500);
    // Phase 4: Cursor appears at 4.5s
    const t4 = setTimeout(() => setPhase(4), 4500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);
  
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-start overflow-hidden">
      <GridBg />
      <FloatingParticles count={8} />
      
      {/* "Mmh..." typewriter */}
      <motion.div 
        className="mt-[8vh] mb-6 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {phase >= 1 && (
          <h1 className="text-5xl md:text-7xl font-bold text-foreground tracking-tight">
            <TypewriterText text="Mmh..." delay={0} speed={0.12} />
          </h1>
        )}
      </motion.div>
      
      {/* LinkedIn browser — slides up from below */}
      <motion.div
        className="relative z-10"
        initial={{ y: 600, opacity: 0, scale: 0.85 }}
        animate={phase >= 2 ? { 
          y: 20, 
          opacity: 1, 
          scale: 1,
        } : {}}
        transition={{ 
          duration: 1.2, 
          ease: [0.16, 1, 0.3, 1],
          opacity: { duration: 0.6 },
        }}
      >
        <LinkedInBrowser />
        
        {/* Message card overlaid on right side */}
        {phase >= 3 && (
          <motion.div
            className="absolute -right-4 bottom-4 z-20"
            initial={{ opacity: 0, x: 60, y: 30, scale: 0.85 }}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            transition={{ 
              duration: 0.8,
              type: "spring",
              damping: 18,
              stiffness: 120,
            }}
          >
            <MessageCard delay={0} />
          </motion.div>
        )}
      </motion.div>
      
      {/* Animated cursor */}
      {phase >= 4 && (
        <motion.div
          className="absolute z-50 pointer-events-none"
          initial={{ x: "10%", y: "15%", opacity: 0 }}
          animate={{
            x: ["10%", "25%", "65%", "72%"],
            y: ["15%", "35%", "55%", "70%"],
            opacity: [0, 1, 1, 1],
          }}
          transition={{
            duration: 2.5,
            times: [0, 0.2, 0.6, 1],
            ease: "easeInOut",
          }}
        >
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none" className="drop-shadow-md">
            <path d="M8 4L24 16L16 17.5L12 26L8 4Z" fill="#1a1a1a" stroke="#ffffff" strokeWidth="1.5" />
          </svg>
        </motion.div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════
// SCENE 1: Zoom into message card + cursor → Envoyer
// ══════════════════════════════════════════════════════
const Scene1 = () => {
  const [phase, setPhase] = useState(0);
  
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 800);  // cursor moves to Envoyer
    const t2 = setTimeout(() => setPhase(2), 2500); // cursor clicks
    const t3 = setTimeout(() => setPhase(3), 3200); // button press effect
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);
  
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <GridBg />
      
      {/* Zoomed-in message card */}
      <motion.div
        initial={{ scale: 0.7, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-black/5 overflow-hidden w-[520px] max-w-[95vw]">
          {/* Header */}
          <div className="flex items-center gap-3 p-5 border-b border-black/5">
            <div className="w-14 h-14 rounded-full overflow-hidden relative">
              <img src={avatar1} alt="" className="w-full h-full object-cover" />
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
            </div>
            <div className="flex-1 space-y-1.5">
              <div className="h-3 bg-muted rounded w-28" />
              <div className="h-2.5 bg-muted/50 rounded w-20" />
            </div>
            <X className="w-5 h-5 text-muted-foreground/40" />
          </div>
          
          {/* Message */}
          <div className="p-5">
            <div className="bg-[#f3f2ee] rounded-xl p-5 space-y-3">
              <p className="text-foreground/80 text-[15px] leading-relaxed">Dear Ethan Carter,</p>
              <p className="text-foreground/80 text-[15px] leading-relaxed">
                I'm about to send you a LinkedIn message you didn't ask for.
              </p>
              <p className="text-foreground/80 text-[15px] leading-relaxed">
                If now is a bad time, I fully deserve to be ignored 😅
              </p>
              <p className="text-foreground/80 text-[15px] leading-relaxed">
                But if you need more clients I can make a call with you.
              </p>
            </div>
          </div>
          
          {/* Footer */}
          <div className="px-5 pb-5 flex items-center justify-between">
            <div className="flex gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-7 h-7 bg-muted/40 rounded" />
              ))}
            </div>
            <motion.button
              className="px-6 py-2.5 bg-[#0a66c2] text-white text-sm font-semibold rounded-full relative overflow-hidden"
              animate={phase >= 3 ? { scale: [1, 0.92, 1.05, 1] } : {}}
              transition={{ duration: 0.4 }}
            >
              Envoyer
              {/* Click ripple */}
              {phase >= 3 && (
                <motion.div
                  initial={{ scale: 0, opacity: 0.5 }}
                  animate={{ scale: 3, opacity: 0 }}
                  transition={{ duration: 0.6 }}
                  className="absolute inset-0 bg-white rounded-full"
                  style={{ transformOrigin: "center" }}
                />
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
      
      {/* Animated cursor moving toward Envoyer button */}
      <motion.div
        className="absolute z-50 pointer-events-none"
        initial={{ x: "35%", y: "30%", opacity: 0 }}
        animate={{
          x: phase >= 1 ? ["35%", "62%", "64%"] : "35%",
          y: phase >= 1 ? ["30%", "68%", "72%"] : "30%",
          opacity: [0, 1, 1],
          scale: phase >= 2 ? [1, 0.85, 1] : 1,
        }}
        transition={{
          x: { duration: 1.5, ease: [0.4, 0, 0.2, 1] },
          y: { duration: 1.5, ease: [0.4, 0, 0.2, 1] },
          opacity: { duration: 0.3 },
          scale: { delay: 1.7, duration: 0.3 },
        }}
      >
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none" className="drop-shadow-md">
          <path d="M8 4L24 16L16 17.5L12 26L8 4Z" fill="#1a1a1a" stroke="#ffffff" strokeWidth="1.5" />
        </svg>
        {/* Click indicator */}
        {phase >= 2 && (
          <motion.div
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: [0, 2, 0], opacity: [0.5, 0.2, 0] }}
            transition={{ duration: 0.5 }}
            className="absolute -top-2 -left-2 w-10 h-10 rounded-full bg-foreground/20"
          />
        )}
      </motion.div>
    </div>
  );
};

// ══════════════════════════════════════════════════════
// SCENE 2: Angry reply "F*CK YOU"
// ══════════════════════════════════════════════════════
const Scene2 = () => (
  <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
    <GridBg />
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.6, type: "spring", damping: 18 }}
      className="w-[480px] max-w-[90vw] bg-white rounded-2xl shadow-2xl border border-black/5 p-6 space-y-5"
    >
      {/* Original message (faded) */}
      <div className="flex items-start gap-3 opacity-50">
        <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
          <img src={avatar2} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="bg-[#f3f2ee] rounded-lg p-3 flex-1">
          <p className="text-xs text-foreground/60 leading-relaxed">
            Dear Ethan Carter, I'm about to send you a LinkedIn message you didn't ask for...
          </p>
        </div>
      </div>
      
      {/* Angry reply */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 1, duration: 0.5, type: "spring", damping: 14 }}
        className="flex items-start gap-3"
      >
        <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
          <img src={avatar4} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="bg-red-50 border border-red-200/60 rounded-lg p-3 flex-1">
          <motion.p 
            className="text-base font-bold text-red-600"
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ delay: 1.3, duration: 0.4 }}
          >
            F*CK YOU
          </motion.p>
          <p className="text-sm text-foreground/50 mt-1 font-normal">Best regards</p>
        </div>
      </motion.div>
      
      {/* Shake the whole card */}
      <motion.div
        className="absolute inset-0"
        animate={{ x: [0, -4, 4, -3, 3, 0] }}
        transition={{ delay: 1.2, duration: 0.4 }}
      />
    </motion.div>
    
    {/* Red flash overlay */}
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 0.08, 0] }}
      transition={{ delay: 1, duration: 0.6 }}
      className="absolute inset-0 bg-red-500 z-0"
    />
  </div>
);

// ══════════════════════════════════════════════════════
// SCENE 3: "It's spending hours building lists"
// ══════════════════════════════════════════════════════
const Scene3 = () => (
  <div className="relative w-full h-full flex flex-col items-center justify-center gap-8 overflow-hidden">
    <GridBg />
    <FloatingParticles />
    <AnimatedHeading text="It's spending hours building lists" highlight="building lists" />
    <motion.div
      initial={{ opacity: 0, y: 80, rotateX: 15 }}
      animate={{ opacity: 1, y: 0, rotateX: 5 }}
      transition={{ delay: 0.4, duration: 1, ease: [0.16, 1, 0.3, 1] }}
      className="w-[700px] max-w-[90vw]"
      style={{ perspective: 1200 }}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-black/5 overflow-hidden"
        style={{ transform: "perspective(1200px) rotateX(5deg)" }}
      >
        {/* Green spreadsheet header */}
        <div className="bg-[#0f9d58] px-4 py-2.5 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-white/40" />
            <div className="w-2.5 h-2.5 rounded-full bg-white/40" />
            <div className="w-2.5 h-2.5 rounded-full bg-white/40" />
          </div>
          <div className="text-white/90 text-xs font-medium ml-2">leads_list_march.xlsx</div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-2 bg-white/20 rounded w-10 ml-2" />
          ))}
        </div>
        {/* Rows that populate staggered */}
        <div className="p-1">
          {[...Array(10)].map((_, row) => (
            <motion.div
              key={row}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + row * 0.07 }}
              className="flex border-b border-border/20"
            >
              <div className="w-8 text-[10px] text-muted-foreground text-center py-1.5 bg-muted/20">
                {row + 1}
              </div>
              {[...Array(7)].map((_, col) => (
                <div key={col} className="flex-1 border-l border-border/10 py-1.5 px-2">
                  {Math.random() > 0.25 && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${30 + Math.random() * 60}%` }}
                      transition={{ delay: 0.7 + row * 0.07 + col * 0.03, duration: 0.4 }}
                      className="h-2 bg-muted/60 rounded"
                    />
                  )}
                </div>
              ))}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  </div>
);

// ══════════════════════════════════════════════════════
// SCENE 4: "hoping volume will fix the problem"
// ══════════════════════════════════════════════════════
const Scene4 = () => (
  <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
    <GridBg />
    {/* Scattered message cards with continuous float */}
    {[...Array(10)].map((_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, scale: 0.7, rotate: -8 + Math.random() * 16 }}
        animate={{ 
          opacity: [0, 0.12 + Math.random() * 0.2, 0.12 + Math.random() * 0.15],
          scale: 1,
          y: [0, -10 + Math.random() * 20, 0],
        }}
        transition={{ 
          delay: i * 0.08,
          duration: 3,
          y: { repeat: Infinity, duration: 2 + Math.random() * 2, ease: "easeInOut" },
        }}
        className="absolute bg-white rounded-xl shadow-lg p-3 w-44 border border-black/5"
        style={{
          left: `${5 + (i % 5) * 19}%`,
          top: `${8 + Math.floor(i / 5) * 42}%`,
          transform: `rotate(${-6 + Math.random() * 12}deg)`,
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full overflow-hidden">
            <img src={avatars[i % 5]} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="h-2 bg-muted rounded flex-1" />
        </div>
        <div className="space-y-1">
          <div className="h-1.5 bg-muted/60 rounded w-full" />
          <div className="h-1.5 bg-muted/40 rounded w-3/4" />
        </div>
      </motion.div>
    ))}
    <motion.div className="z-10 relative">
      <AnimatedHeading
        text="and hoping volume will fix the problem"
        highlight="fix the problem"
        delay={0.3}
      />
    </motion.div>
  </div>
);

// ══════════════════════════════════════════════════════
// SCENE 5: Radar — "detects high-intent people"
// ══════════════════════════════════════════════════════
const Scene5 = () => (
  <div
    className="relative w-full h-full flex flex-col items-center justify-center"
    style={{ background: "linear-gradient(180deg, hsl(0 0% 98%) 0%, hsl(15 80% 96%) 100%)" }}
  >
    <GridBg pink />
    <FloatingParticles color="bg-orange-300/20" />
    <AnimatedHeading text="detects high-intent people" highlight="high-intent" />
    <div className="relative mt-10" style={{ width: 380, height: 380 }}>
      {/* Radar sweep */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: "conic-gradient(from 0deg, transparent 0deg, hsl(10 80% 70% / 0.15) 60deg, transparent 120deg)",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />
      {/* Concentric rings */}
      {[1, 0.72, 0.48, 0.28].map((s, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: s, opacity: 0.2 + i * 0.08 }}
          transition={{ delay: 0.3 + i * 0.12, duration: 0.8, type: "spring" }}
          className="absolute inset-0 rounded-full border border-orange-300/30"
        />
      ))}
      {/* Center pulse */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.8, type: "spring", damping: 12 }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full shadow-xl flex items-center justify-center"
      >
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <Flame className="w-8 h-8 text-orange-500" />
        </motion.div>
      </motion.div>
      {/* Avatars on rings with glow */}
      {[
        { x: -120, y: -80, delay: 1.0 },
        { x: 100, y: -60, delay: 1.2 },
        { x: 0, y: -130, delay: 1.1 },
        { x: -80, y: 100, delay: 1.3 },
        { x: 120, y: 80, delay: 1.4 },
      ].map((pos, i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 top-1/2"
          style={{ transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))` }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: pos.delay, type: "spring", damping: 14 }}
        >
          <div className="relative">
            <motion.div
              className="absolute -inset-2 bg-orange-400/20 rounded-full"
              animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ repeat: Infinity, duration: 2, delay: i * 0.3 }}
            />
            <AvatarCircle src={avatars[i]} size={52} delay={0} />
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

// ══════════════════════════════════════════════════════
// SCENE 6: "engages with personalized outreach"
// ══════════════════════════════════════════════════════
const Scene6 = () => (
  <div
    className="relative w-full h-full flex flex-col items-center justify-center gap-10"
    style={{ background: "linear-gradient(180deg, hsl(0 0% 98%) 0%, hsl(15 80% 96%) 100%)" }}
  >
    <GridBg pink />
    <AnimatedHeading
      text="engages them at the right moment with personalized LinkedIn outreach"
      highlight="personalized LinkedIn outreach"
      size="text-3xl md:text-5xl"
    />
    <div className="flex gap-6 mt-4">
      {[
        { icon: UserPlus, title: "Send Invitation", step: 1, color: "from-blue-600 to-blue-500" },
        { icon: Send, title: "Send Message", step: 2, color: "from-blue-500 to-cyan-500" },
      ].map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 50, x: i === 0 ? -40 : 40, rotateY: i === 0 ? 8 : -8 }}
          animate={{ opacity: 1, y: 0, x: 0, rotateY: 0 }}
          transition={{ delay: 0.5 + i * 0.25, duration: 0.7, type: "spring", damping: 16 }}
          className="w-64 bg-white rounded-2xl shadow-xl overflow-hidden border border-black/5"
          style={{ perspective: 800 }}
        >
          <div className={`bg-gradient-to-r ${item.color} px-4 py-3 flex items-center gap-3`}>
            <item.icon className="w-5 h-5 text-white" />
            <div>
              <div className="text-white font-semibold text-sm">{item.title}</div>
              <div className="text-white/70 text-xs">Step {item.step}</div>
            </div>
          </div>
          <div className="p-4 space-y-2">
            {[1, 0.85, 0.65].map((w, j) => (
              <motion.div
                key={j}
                initial={{ width: 0 }}
                animate={{ width: `${w * 100}%` }}
                transition={{ delay: 0.8 + i * 0.25 + j * 0.1, duration: 0.5 }}
                className="h-2.5 bg-muted/50 rounded"
              />
            ))}
          </div>
        </motion.div>
      ))}
    </div>
    {/* Connection line */}
    <motion.div
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ delay: 1.2, duration: 0.6 }}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 w-20 h-0.5 bg-gradient-to-r from-blue-300 to-cyan-300"
      style={{ marginTop: 60 }}
    />
  </div>
);

// ══════════════════════════════════════════════════════
// SCENE 7: "Our AI understands your offer"
// ══════════════════════════════════════════════════════
const Scene7 = () => (
  <div
    className="relative w-full h-full flex flex-col items-center justify-center gap-8"
    style={{ background: "linear-gradient(180deg, hsl(0 0% 98%) 0%, hsl(15 80% 96%) 100%)" }}
  >
    <GridBg pink />
    <AnimatedHeading text="Our AI understands your offer" highlight="offer" />
    <motion.div
      initial={{ opacity: 0, y: 60, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.4, duration: 0.8, type: "spring", damping: 18 }}
      className="w-[580px] max-w-[90vw] bg-white rounded-2xl shadow-2xl border border-black/5 p-6 space-y-5"
    >
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Website</div>
        <div className="flex items-center gap-2">
          <motion.div 
            className="flex-1 h-11 bg-muted/30 rounded-lg px-4 flex items-center border border-border/50"
            initial={{ borderColor: "transparent" }}
            animate={{ borderColor: ["transparent", "hsl(15 80% 60%)", "transparent"] }}
            transition={{ delay: 0.8, duration: 1.5 }}
          >
            <span className="text-sm text-muted-foreground">yourcompany.com</span>
          </motion.div>
          <motion.button
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1, type: "spring" }}
            className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg text-sm font-semibold shadow-lg"
          >
            Analyze
          </motion.button>
        </div>
      </div>
      {/* Loading shimmer for AI analysis */}
      <div className="grid grid-cols-2 gap-4">
        {["Industry", "Pain Points", "Target Audience", "Value Prop"].map((label, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 + i * 0.15 }}
            className="space-y-1.5"
          >
            <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{label}</div>
            <div className="h-14 bg-gradient-to-r from-muted/30 via-muted/50 to-muted/30 rounded-lg overflow-hidden relative">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ repeat: Infinity, duration: 1.5, delay: 1.5 + i * 0.2 }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  </div>
);

// ══════════════════════════════════════════════════════
// SCENE 8: "monitors buying signals in real time"
// ══════════════════════════════════════════════════════
const Scene8 = () => (
  <div
    className="relative w-full h-full flex flex-col items-center justify-center gap-8"
    style={{ background: "linear-gradient(180deg, hsl(0 0% 98%) 0%, hsl(15 80% 96%) 100%)" }}
  >
    <GridBg pink />
    <AnimatedHeading text="monitors buying signals in real time" highlight="in real time" />
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="w-[650px] max-w-[90vw] bg-white rounded-2xl shadow-2xl border border-black/5 p-5"
      style={{ transform: "perspective(1200px) rotateX(3deg)" }}
    >
      {/* AI Agent badge */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.8, type: "spring", damping: 14 }}
        className="flex items-center gap-3 mb-5 bg-muted/20 rounded-xl px-4 py-3 w-fit border border-border/30"
      >
        <Bot className="w-6 h-6 text-foreground" />
        <span className="font-semibold text-foreground">AI Agent</span>
        <span className="text-green-600 text-sm font-medium">Active</span>
        <motion.div
          className="w-2.5 h-2.5 bg-green-500 rounded-full"
          animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
        />
      </motion.div>
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { val: "582", label: "Leads tracked" },
          { val: "235", label: "Signals found" },
          { val: "98", label: "High intent" },
          { val: "$782K", label: "Pipeline value" },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 1 + i * 0.12, type: "spring" }}
            className="bg-muted/20 rounded-lg p-3 text-center border border-border/20"
          >
            <div className="text-lg font-bold text-foreground">{stat.val}</div>
            <div className="text-[10px] text-muted-foreground">{stat.label}</div>
          </motion.div>
        ))}
      </div>
      {/* Animated bar chart */}
      <div className="h-24 flex items-end gap-1">
        {[...Array(24)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: 12 + Math.random() * 75 }}
            transition={{ delay: 1.3 + i * 0.04, duration: 0.5, ease: "backOut" }}
            className="flex-1 bg-gradient-to-t from-orange-400 to-red-400 rounded-t opacity-70"
          />
        ))}
      </div>
    </motion.div>
  </div>
);

// ══════════════════════════════════════════════════════
// SCENE 9: Signal cards
// ══════════════════════════════════════════════════════
const Scene9 = () => (
  <div
    className="relative w-full h-full flex items-center justify-center gap-8"
    style={{ background: "linear-gradient(180deg, hsl(15 80% 96%) 0%, hsl(15 70% 93%) 100%)" }}
  >
    <GridBg pink />
    <FloatingParticles color="bg-orange-300/15" />
    {[
      { icon: Briefcase, label: "Job Changes", desc: "VP → CRO transition", color: "from-blue-500 to-blue-600" },
      { icon: MessageCircle, label: "Competitor Chats", desc: "Engaged with rival", color: "from-purple-500 to-violet-600" },
      { icon: TrendingUp, label: "Funding Rounds", desc: "Series B · $12M", color: "from-green-500 to-emerald-600" },
    ].map((card, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, scale: 0.7, y: 50, rotate: -5 + i * 5 }}
        animate={{ opacity: 1, scale: 1, y: 0, rotate: -3 + i * 3 }}
        transition={{ delay: 0.15 + i * 0.2, type: "spring", damping: 14, stiffness: 100 }}
        className="relative bg-white rounded-2xl shadow-xl p-5 w-56 flex flex-col items-center gap-3 border border-black/5"
      >
        <motion.div 
          className={`w-16 h-16 bg-gradient-to-br ${card.color} rounded-xl flex items-center justify-center shadow-lg`}
          animate={{ y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 2, delay: i * 0.4 }}
        >
          <card.icon className="w-7 h-7 text-white" />
        </motion.div>
        <span className="font-bold text-sm text-foreground">{card.label}</span>
        <span className="text-xs text-muted-foreground">{card.desc}</span>
        {/* Notification dot */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.8 + i * 0.15, type: "spring" }}
          className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-sm"
        />
      </motion.div>
    ))}
  </div>
);

// ══════════════════════════════════════════════════════
// SCENE 10: "AI agents score and prioritize"
// ══════════════════════════════════════════════════════
const Scene10 = () => {
  const leads = [
    { name: "Camille Fournier", title: "Brand Strategist", company: "BETC", fire: 3, score: 94 },
    { name: "Sophie Lambert", title: "Growth Lead", company: "Doctolib", fire: 2, score: 87 },
    { name: "Élodie Martin", title: "Digital Marketing", company: "Decathlon", fire: 3, score: 91 },
    { name: "Thomas Gilbert", title: "Product Marketing", company: "Qonto", fire: 1, score: 72 },
  ];

  return (
    <div
      className="relative w-full h-full flex flex-col items-center justify-center gap-8"
      style={{ background: "linear-gradient(180deg, hsl(0 0% 98%) 0%, hsl(15 80% 96%) 100%)" }}
    >
      <GridBg pink />
      <AnimatedHeading
        text="AI agents score and prioritize the most active prospects"
        highlight="active prospects"
      />
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="w-[700px] max-w-[90vw] bg-white rounded-2xl shadow-2xl border border-black/5 overflow-hidden"
        style={{ transform: "perspective(1200px) rotateX(3deg)" }}
      >
        {/* Header row */}
        <div className="flex items-center gap-4 px-5 py-2.5 bg-muted/20 border-b border-border/30 text-xs text-muted-foreground font-medium">
          <div className="w-4" />
          <div className="w-9" />
          <div className="flex-1">Contact</div>
          <div className="w-16 text-center">Score</div>
          <div className="w-20 text-center">Signals</div>
        </div>
        {leads.map((lead, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + i * 0.15, type: "spring", damping: 20 }}
            className="flex items-center gap-4 px-5 py-3.5 border-b border-border/20 hover:bg-muted/10 transition-colors"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1 + i * 0.1, type: "spring" }}
              className="w-4 h-4 border-2 border-green-500 rounded bg-green-500/10 flex items-center justify-center"
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 + i * 0.1 }}
                className="w-2 h-2 bg-green-500 rounded-sm"
              />
            </motion.div>
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
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.3 + i * 0.1, type: "spring" }}
              className={`w-16 text-center font-bold text-sm ${lead.score >= 90 ? 'text-green-600' : lead.score >= 80 ? 'text-orange-500' : 'text-muted-foreground'}`}
            >
              {lead.score}
            </motion.div>
            <div className="w-20 flex justify-center gap-0.5">
              {[...Array(lead.fire)].map((_, j) => (
                <motion.span
                  key={j}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1.4 + i * 0.1 + j * 0.08, type: "spring" }}
                  className="text-sm"
                >
                  🔥
                </motion.span>
              ))}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

// ══════════════════════════════════════════════════════
// SCENE 11: "personalized outreach campaigns"
// ══════════════════════════════════════════════════════
const Scene11 = () => (
  <div
    className="relative w-full h-full flex flex-col items-center justify-center gap-8"
    style={{ background: "linear-gradient(180deg, hsl(15 80% 96%) 0%, hsl(15 70% 93%) 100%)" }}
  >
    <GridBg pink />
    <AnimatedHeading text="personalized outreach campaigns" highlight="outreach campaigns" />
    <div className="flex gap-5 items-start mt-2">
      {[1, 2, 3, 4].map((step, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 40, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.4 + i * 0.18, type: "spring", damping: 16 }}
          className="relative"
        >
          <div className="w-48 bg-white rounded-xl shadow-lg overflow-hidden border border-black/5">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-400 px-3 py-2.5 flex items-center gap-2">
              <Send className="w-3.5 h-3.5 text-white" />
              <span className="text-white text-xs font-semibold">Send Message</span>
              <span className="text-white/60 text-[10px] ml-auto">Step {step}</span>
            </div>
            <div className="p-3 space-y-2">
              <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Message:</div>
              <div className="space-y-1">
                {[1, 0.8, 0.55].map((w, j) => (
                  <motion.div
                    key={j}
                    initial={{ width: 0 }}
                    animate={{ width: `${w * 100}%` }}
                    transition={{ delay: 0.7 + i * 0.18 + j * 0.08, duration: 0.4 }}
                    className="h-1.5 bg-muted/50 rounded"
                  />
                ))}
              </div>
              <div className="flex gap-1.5 mt-2">
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1 + i * 0.15, type: "spring" }}
                  className="text-[9px] px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium"
                >
                  {20 + i * 18} contacts
                </motion.div>
              </div>
            </div>
          </div>
          {/* Animated dashed connector */}
          {i < 3 && (
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.8 + i * 0.2, duration: 0.4 }}
              className="absolute right-0 top-1/2 w-5 border-t-2 border-dashed border-blue-300 translate-x-full origin-left"
            />
          )}
        </motion.div>
      ))}
    </div>
  </div>
);

// ══════════════════════════════════════════════════════
// SCENE 12: "replies" celebration
// ══════════════════════════════════════════════════════
const Scene12 = () => (
  <div
    className="relative w-full h-full flex items-center justify-center overflow-hidden"
    style={{ background: "linear-gradient(180deg, hsl(15 80% 96%) 0%, hsl(15 70% 91%) 100%)" }}
  >
    <GridBg pink />
    {/* Floating reply badges */}
    {[...Array(8)].map((_, i) => (
      <motion.div
        key={i}
        initial={{ scale: 0, opacity: 0, rotate: -10 + Math.random() * 20 }}
        animate={{
          scale: [0, 1.15, 1],
          opacity: [0, 1, 0.75],
          y: [20, -10, 5],
        }}
        transition={{ delay: 0.2 + i * 0.15, duration: 0.7, type: "spring" }}
        className="absolute bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold px-5 py-2.5 rounded-full text-base shadow-xl"
        style={{
          left: `${10 + (i % 4) * 22}%`,
          top: `${20 + Math.floor(i / 4) * 35}%`,
        }}
      >
        <motion.span
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 1, delay: i * 0.1 }}
        >
          replies 🎉
        </motion.span>
      </motion.div>
    ))}
    <motion.div
      initial={{ scale: 0, filter: "blur(15px)" }}
      animate={{ scale: 1, filter: "blur(0px)" }}
      transition={{ delay: 0.5, type: "spring", damping: 10 }}
      className="text-6xl md:text-8xl font-bold text-center z-10"
    >
      <span className="text-foreground">and </span>
      <span className="bg-gradient-to-r from-red-500 to-orange-400 bg-clip-text text-transparent">
        replies!
      </span>
      <motion.span
        className="text-4xl ml-2 inline-block"
        animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
        transition={{ delay: 1, duration: 0.6 }}
      >
        🎉
      </motion.span>
    </motion.div>
  </div>
);

// ══════════════════════════════════════════════════════
// SCENE 13: Final CTA
// ══════════════════════════════════════════════════════
const Scene13 = () => {
  const [phase, setPhase] = useState(0);
  
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 1200);
    const t2 = setTimeout(() => setPhase(2), 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
  
  return (
    <div
      className="relative w-full h-full flex flex-col items-center justify-center gap-6 overflow-hidden"
      style={{ background: "linear-gradient(135deg, hsl(15 70% 93%) 0%, hsl(30 60% 91%) 50%, hsl(15 80% 95%) 100%)" }}
    >
      <GridBg pink />
      
      {/* Radial glow */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1.5, opacity: 0.15 }}
        transition={{ duration: 2, ease: "easeOut" }}
        className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-r from-orange-300 to-red-300"
        style={{ filter: "blur(100px)" }}
      />
      
      <motion.div
        initial={{ scale: 0, opacity: 0, filter: "blur(20px)" }}
        animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
        transition={{ type: "spring", damping: 12, stiffness: 80 }}
        className="text-5xl md:text-7xl font-bold text-foreground tracking-tight z-10"
      >
        Intentsly
      </motion.div>
      
      {phase >= 1 && (
        <motion.div
          initial={{ opacity: 0, y: 25, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.7 }}
          className="z-10"
        >
          <AnimatedHeading
            text="Reach buyers when they are ready"
            highlight="ready"
            size="text-2xl md:text-4xl"
          />
        </motion.div>
      )}
      
      {phase >= 2 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", damping: 14 }}
          className="relative z-10"
        >
          <button className="px-10 py-4 bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold text-lg rounded-full shadow-xl">
            Try now
          </button>
          {/* Cursor pointing at button */}
          <motion.div
            initial={{ x: -40, y: 40, opacity: 0 }}
            animate={{ x: 20, y: 15, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            className="absolute -bottom-6 right-0"
          >
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none" className="drop-shadow-md">
              <path d="M8 4L24 16L16 17.5L12 26L8 4Z" fill="#1a1a1a" stroke="#ffffff" strokeWidth="1.5" />
            </svg>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

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
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0"
        >
          <CurrentSceneComponent />
        </motion.div>
      </AnimatePresence>

      {/* Smooth progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/20 z-50">
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
          className="px-3 py-1.5 bg-white/80 rounded-lg text-xs font-medium shadow-sm backdrop-blur-sm border border-black/5"
        >
          {isPlaying ? "⏸ Pause" : "▶ Play"}
        </button>
        <button
          onClick={() => setCurrentScene((prev) => (prev + 1) % TOTAL_SCENES)}
          className="px-3 py-1.5 bg-white/80 rounded-lg text-xs font-medium shadow-sm backdrop-blur-sm border border-black/5"
        >
          Next →
        </button>
      </div>

      {/* Scene counter */}
      <div className="absolute top-4 right-4 z-50 px-3 py-1.5 bg-white/60 rounded-lg text-xs font-mono backdrop-blur-sm border border-black/5">
        {currentScene + 1} / {TOTAL_SCENES}
      </div>
    </div>
  );
};

export default VideoShowcase;

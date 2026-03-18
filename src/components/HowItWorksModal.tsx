import { motion, AnimatePresence } from "framer-motion";
import {
  X, Target, Zap, Users, Bot, RefreshCw, Clock, Filter, UserX,
  Building2, Briefcase, TrendingUp, MessageSquare, Globe, Swords,
  Lightbulb, List, Download, Mail, Sparkles,
} from "lucide-react";

interface HowItWorksModalProps {
  open: boolean;
  onClose: () => void;
}

const backdrop = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const panel = {
  hidden: { opacity: 0, scale: 0.92, y: 30 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring" as const, stiffness: 340, damping: 30, mass: 0.8 } },
  exit: { opacity: 0, scale: 0.94, y: 20, transition: { duration: 0.2 } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

/* ── Glassmorphism card ─────────────────────────────────────────────── */
function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      variants={fadeUp}
      className={`rounded-2xl p-5 ${className}`}
      style={{
        background: "rgba(255,255,255,0.55)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid rgba(255,255,255,0.7)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
      }}
    >
      {children}
    </motion.div>
  );
}

/* ── Section header ─────────────────────────────────────────────────── */
function SectionTitle({ icon: Icon, title, color }: { icon: React.ElementType; title: string; color: string }) {
  return (
    <motion.div variants={fadeUp} className="flex items-center gap-2.5 mb-4">
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: color }}
      >
        <Icon className="w-4 h-4 text-white" />
      </div>
      <h3 className="text-base font-bold text-foreground">{title}</h3>
    </motion.div>
  );
}

/* ── Bullet item ────────────────────────────────────────────────────── */
function Bullet({ icon: Icon, title, desc, color }: { icon: React.ElementType; title: string; desc: string; color: string }) {
  return (
    <div className="flex items-start gap-3 mb-3 last:mb-0">
      <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${color}18` }}>
        <Icon className="w-3.5 h-3.5" style={{ color }} />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

/* ── Signal line ────────────────────────────────────────────────────── */
function SignalLine({ icon: Icon, label, desc, color }: { icon: React.ElementType; label: string; desc: string; color: string }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}14` }}>
        <Icon className="w-3.5 h-3.5" style={{ color }} />
      </div>
      <div>
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-xs text-muted-foreground ml-1.5">— {desc}</span>
      </div>
    </div>
  );
}

export default function HowItWorksModal({ open, onClose }: HowItWorksModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto py-8 px-4"
          variants={backdrop}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0"
            style={{ background: "rgba(15,15,25,0.45)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            variants={panel}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-3xl rounded-3xl overflow-hidden z-10"
            style={{
              background: "linear-gradient(145deg, hsl(220 30% 97%) 0%, hsl(35 60% 96%) 40%, hsl(220 30% 97%) 100%)",
              boxShadow: "0 24px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.5) inset",
            }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full flex items-center justify-center text-foreground/50 hover:text-foreground transition-colors"
              style={{ background: "rgba(0,0,0,0.06)" }}
            >
              <X className="w-4 h-4" />
            </button>

            {/* Content */}
            <motion.div className="p-6 md:p-8 space-y-6" variants={stagger} initial="hidden" animate="visible">

              {/* Hero header */}
              <motion.div variants={fadeUp} className="text-center pt-2 pb-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold text-foreground/60 mb-3" style={{ background: "rgba(0,0,0,0.05)" }}>
                  <Sparkles className="w-3.5 h-3.5" /> Your complete guide
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">How AI Agents Work</h2>
                <p className="text-sm text-muted-foreground max-w-lg mx-auto">
                  Intentsly helps you find and engage with high-intent prospects on LinkedIn by automating signal detection and lead qualification.
                </p>
              </motion.div>

              {/* The Flow — 3 steps */}
              <motion.div variants={fadeUp}>
                <p className="text-[10px] font-bold tracking-widest text-muted-foreground mb-3 uppercase">The Flow</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { num: 1, title: "Define Your ICP", desc: "Set criteria for your ideal customer: job titles, company size, industry, location.", color: "#3B82F6" },
                    { num: 2, title: "Choose Signals", desc: "Pick the LinkedIn activities that indicate buying intent for your product.", color: "hsl(var(--goji-orange))" },
                    { num: 3, title: "Get Qualified Leads", desc: "Leads flow automatically into your inbox, ready for outreach or export.", color: "#22C55E" },
                  ].map((s) => (
                    <GlassCard key={s.num}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-bold text-white mb-3" style={{ background: s.color }}>
                        {s.num}
                      </div>
                      <p className="text-sm font-bold text-foreground mb-1">{s.title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
                    </GlassCard>
                  ))}
                </div>
              </motion.div>

              {/* Two column: AI Agents + ICP Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <GlassCard>
                  <SectionTitle icon={Bot} title="AI Agents" color="#7C3AED" />
                  <p className="text-xs text-muted-foreground mb-4">Automated lead collection that runs for you</p>
                  <Bullet icon={RefreshCw} title="Runs 2–3 times daily" desc="Each agent checks up to 4 of your selected signals every day" color="#7C3AED" />
                  <Bullet icon={Zap} title="Automatic collection" desc="New leads matching your criteria are added directly to your inbox" color="#7C3AED" />
                  <Bullet icon={Clock} title="Always fresh" desc="Only the latest activity, so you reach people at the right moment" color="#7C3AED" />
                </GlassCard>

                <GlassCard>
                  <SectionTitle icon={Filter} title="ICP Filters" color="#3B82F6" />
                  <p className="text-xs text-muted-foreground mb-4">Focus on the right prospects only</p>
                  <Bullet icon={Target} title="Define your ICP" desc="Job titles, company size, industry, location, and more" color="#3B82F6" />
                  <Bullet icon={Users} title="Automatic filtering" desc="Only leads matching your ICP criteria make it through" color="#3B82F6" />
                  <Bullet icon={UserX} title="Smart exclusions" desc="Remove unwanted profiles like students or competitors" color="#3B82F6" />
                </GlassCard>
              </div>

              {/* Intent Signals — full width */}
              <GlassCard>
                <SectionTitle icon={Zap} title="Intent Signals" color="hsl(var(--goji-orange))" />
                <p className="text-xs text-muted-foreground mb-4">Track the LinkedIn activities that indicate buying intent</p>
                <div className="space-y-0">
                  <SignalLine icon={Building2} label="Your Company" desc="People engaging with your team or page" color="#3B82F6" />
                  <SignalLine icon={MessageSquare} label="Engagement & Interest" desc="Interacting with industry content" color="#7C3AED" />
                  <SignalLine icon={Globe} label="Experts & Creators" desc="Following thought leaders in your niche" color="#22C55E" />
                  <SignalLine icon={TrendingUp} label="Change & Trigger Events" desc="Job changes, new hires, or funding" color="#F59E0B" />
                  <SignalLine icon={Briefcase} label="Community & Events" desc="Members of key groups or event attendees" color="#EC4899" />
                  <SignalLine icon={Swords} label="Competitor Engagement" desc="Engaging with your competitors" color="#EF4444" />
                </div>
                <motion.div variants={fadeUp} className="mt-4 flex items-start gap-2 rounded-xl px-3 py-2.5" style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)" }}>
                  <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">
                    <strong>Pro Tip:</strong> Choose the mix of signals that fits your Ideal Customer Profile. Maximum of 15 signals per agent.
                  </p>
                </motion.div>
              </GlassCard>

              {/* Lists & Exports */}
              <GlassCard>
                <SectionTitle icon={List} title="Lists & Exports" color="#22C55E" />
                <p className="text-xs text-muted-foreground mb-4">Turn signals into actionable pipeline</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Bullet icon={List} title="Organize by lists" desc="Group leads by campaign, ICP, or priority" color="#22C55E" />
                  <Bullet icon={Download} title="Export anywhere" desc="Send to your CRM, outreach campaign, or download as CSV" color="#22C55E" />
                  <Bullet icon={Mail} title="Smart enrichment" desc="Add verified emails to maximize reach" color="#22C55E" />
                </div>
              </GlassCard>

              {/* CTA */}
              <motion.div variants={fadeUp} className="text-center pb-2">
                <button onClick={onClose} className="btn-cta text-sm mx-auto">
                  Got it, let's go! →
                </button>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

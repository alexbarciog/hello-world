import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  open: boolean;
  onClose: () => void;
}

function ConfettiPiece({ index }: { index: number }) {
  const colors = [
    "hsl(var(--primary))",
    "hsl(142 71% 45%)",
    "hsl(47 95% 55%)",
    "hsl(280 65% 60%)",
    "hsl(var(--goji-coral))",
    "hsl(200 80% 55%)",
  ];
  const left = Math.random() * 100;
  const delay = Math.random() * 0.6;
  const duration = 1.5 + Math.random() * 1.5;
  const size = 6 + Math.random() * 6;
  const rotation = Math.random() * 720 - 360;
  const color = colors[index % colors.length];

  return (
    <motion.div
      initial={{ y: -20, x: 0, opacity: 1, rotate: 0 }}
      animate={{ y: 400, x: (Math.random() - 0.5) * 120, opacity: 0, rotate: rotation }}
      transition={{ delay, duration, ease: "easeIn" }}
      className="absolute rounded-sm"
      style={{
        left: `${left}%`,
        top: 0,
        width: size,
        height: size * 0.6,
        background: color,
      }}
    />
  );
}

export default function PaymentSuccessDialog({ open, onClose }: Props) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (open) {
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 3500);
      return () => clearTimeout(t);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md text-center overflow-hidden">
        {/* Confetti layer */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <AnimatePresence>
            {showConfetti &&
              Array.from({ length: 40 }).map((_, i) => (
                <ConfettiPiece key={i} index={i} />
              ))}
          </AnimatePresence>
        </div>

        <div className="relative z-10 py-6 flex flex-col items-center gap-4">
          {/* Checkmark circle */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: "hsl(142 71% 45%)" }}
          >
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <motion.path
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-2xl font-bold text-foreground"
          >
            Payment Successful!
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="text-muted-foreground text-sm max-w-xs"
          >
            You can enjoy <span className="font-semibold text-foreground">Intentsly Plus</span> now. You've also received <span className="font-semibold text-foreground">100 credits</span> to get started!
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            onClick={onClose}
            className="mt-2 px-8 py-2.5 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "hsl(142 71% 45%)" }}
          >
            Let's go! 🚀
          </motion.button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

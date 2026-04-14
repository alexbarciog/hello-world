import { CreditCard, Zap, CalendarCheck, Shield } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface AddCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  loading?: boolean;
}

const benefits = [
  {
    icon: Zap,
    title: "Your AI agent starts hunting for leads",
    desc: "Monitors LinkedIn signals 24/7 and finds your ideal prospects.",
  },
  {
    icon: CalendarCheck,
    title: "You only pay when it works",
    desc: "Once your first meeting is booked, you'll be auto-enrolled on the Starter plan ($59/mo).",
  },
  {
    icon: Shield,
    title: "No risk, cancel anytime",
    desc: "If the agent doesn't book meetings, you'll never be charged.",
  },
];

export function AddCardDialog({ open, onOpenChange, onConfirm, loading }: AddCardDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-[20px] border border-snow-white-300 bg-white shadow-xl p-0 gap-0 overflow-hidden">
        <div className="p-6 pb-0 space-y-5">
          {/* Icon */}
          <div className="w-11 h-11 rounded-[12px] bg-snow-black flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-white" />
          </div>

          <DialogHeader className="text-left sm:text-left space-y-2">
            <DialogTitle className="text-2xl font-semibold tracking-tight text-snow-black">
              Activate your AI Agent
            </DialogTitle>
            <DialogDescription className="text-sm text-snow-black-100 leading-relaxed">
              Intentsly is <strong className="text-snow-black font-medium">free until your first meeting is booked</strong>. 
              We just need a card on file to get started — you won't be charged today.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Benefits */}
        <div className="px-6 py-5 space-y-2">
          {benefits.map((b, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-3 rounded-[14px] bg-[#f6f7f9]"
            >
              <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 mt-0.5 border-accent bg-black border-solid border-0">
                <b.icon className="w-4 h-4 text-accent" />
              </div>
              <div>
                <p className="text-snow-black font-sans text-base font-medium tracking-tight">{b.title}</p>
                <p className="text-xs mt-0.5 text-[#858585]">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex flex-col gap-2">
          <button
            onClick={onConfirm}
            disabled={loading}
            className="w-full h-11 flex items-center justify-center gap-2 rounded-[12px] text-sm font-medium text-white shadow-md transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: 'linear-gradient(to top, #212121, #444A4A)' }}
          >
            <CreditCard className="w-4 h-4" />
            {loading ? "Redirecting..." : "Add card & activate"}
            <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-md bg-accent text-black font-bold">
              $0 today
            </span>
          </button>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full text-snow-black-100">
            Maybe later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

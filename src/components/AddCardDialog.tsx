import { CreditCard, Zap, CalendarCheck, Shield } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
      <DialogContent className="sm:max-w-lg rounded-2xl border-none shadow-lg p-0 gap-0 overflow-hidden">
        {/* Gradient banner */}
        <div className="bg-gradient-to-r from-[#0057bd] to-[#4647d3] h-24 flex items-center justify-center relative">
          <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-md">
            <CreditCard className="w-7 h-7 text-[#4647d3]" />
          </div>
        </div>

        <div className="px-6 pb-6 pt-5 space-y-5">
          <DialogHeader className="text-center sm:text-center space-y-1.5">
            <DialogTitle className="text-xl font-semibold text-snow-black">
              Activate your AI Agent
            </DialogTitle>
            <DialogDescription className="text-sm text-snow-black-100 leading-relaxed">
              Intentsly is <strong className="text-snow-black font-medium">free until your first meeting is booked</strong>. 
              We just need a card on file to get started — you won't be charged today.
            </DialogDescription>
          </DialogHeader>

          {/* Benefits card */}
          <div className="bg-snow-white-100 rounded-xl p-4 space-y-0">
            {benefits.map((b, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 py-3 ${i < benefits.length - 1 ? "border-b border-snow-white-300" : ""}`}
              >
                <div className="w-9 h-9 rounded-lg bg-white border border-snow-white-300 flex items-center justify-center shrink-0 mt-0.5">
                  <b.icon className="w-4 h-4 text-snow-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-snow-black">{b.title}</p>
                  <p className="text-xs text-snow-black-100">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex flex-col gap-2 items-center">
            <Button
              onClick={onConfirm}
              disabled={loading}
              className="w-full gap-2 rounded-xl py-2.5 h-auto bg-gradient-to-r from-[#0057bd] to-[#4647d3] text-white hover:opacity-90 transition-opacity"
            >
              <CreditCard className="w-4 h-4" />
              {loading ? "Redirecting..." : "Add card & activate"}
              <Badge className="ml-1 bg-white/20 text-white border-none text-[10px] px-1.5 py-0 hover:bg-white/20">
                $0 today
              </Badge>
            </Button>
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full text-snow-black-100">
              Maybe later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

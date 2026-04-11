import { useState } from "react";
import { CreditCard, Zap, CalendarCheck, Shield } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface AddCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  loading?: boolean;
}

export function AddCardDialog({ open, onOpenChange, onConfirm, loading }: AddCardDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Activate your AI Agent</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Intentsly is <strong className="text-foreground">free until your first meeting is booked</strong>. 
            We just need a card on file to get started — you won't be charged today.
          </p>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-green-50 border border-green-200 flex items-center justify-center shrink-0 mt-0.5">
                <Zap className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Your AI agent starts hunting for leads</p>
                <p className="text-xs text-muted-foreground">Monitors LinkedIn signals 24/7 and finds your ideal prospects.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0 mt-0.5">
                <CalendarCheck className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">You only pay when it works</p>
                <p className="text-xs text-muted-foreground">Once your first meeting is booked, you'll be auto-enrolled on the Starter plan ($59/mo).</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-50 border border-purple-200 flex items-center justify-center shrink-0 mt-0.5">
                <Shield className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">No risk, cancel anytime</p>
                <p className="text-xs text-muted-foreground">If the agent doesn't book meetings, you'll never be charged.</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="sm:w-auto w-full">
            Maybe later
          </Button>
          <Button onClick={onConfirm} disabled={loading} className="sm:w-auto w-full gap-2">
            <CreditCard className="w-4 h-4" />
            {loading ? "Redirecting..." : "Add card & activate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PlanPicker } from "@/components/billing/PlanPicker";
import { PICK_PLAN_COPY, type PlanKey } from "@/lib/plans";

/** The in-app plan picker as a dialog (sidebar Upgrade, out-of-credits banner, paywall). */
export function PlanPickerDialog({
  open, onOpenChange, title = "Pick a plan", description = `${PICK_PLAN_COPY}.`, selected, source,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  selected?: PlanKey | null;
  source?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-1.5rem)] md:max-w-4xl max-h-[calc(100dvh-1.5rem)] overflow-y-auto rounded-3xl border-[#E7E7EA] bg-[#F7F7F8] p-5 md:p-7">
        <DialogHeader className="text-left sm:text-left pr-6">
          <DialogTitle className="text-xl md:text-2xl font-semibold tracking-tight">{title}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">{description}</DialogDescription>
        </DialogHeader>
        <PlanPicker variant="compact" selected={selected} source={source} onChanged={() => onOpenChange(false)} className="pt-3" />
        <p className="text-center text-xs text-muted-foreground">
          Credits reset at each renewal. Cancel anytime from Settings.{" "}
          <Link to="/pricing" className="underline underline-offset-2" onClick={() => onOpenChange(false)}>
            How credits work
          </Link>
        </p>
      </DialogContent>
    </Dialog>
  );
}

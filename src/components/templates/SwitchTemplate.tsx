import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Loader2, Layers } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TemplateCard } from "./TemplateCard";
import { applyTemplate, usePublicTemplates, type AgentTemplate } from "@/lib/agentTemplates";

/** Settings: replace the current agent + sequence with a template's setup. */
export function SwitchTemplate() {
  const { data: templates } = usePublicTemplates();
  const qc = useQueryClient();
  const [confirming, setConfirming] = useState<AgentTemplate | null>(null);
  const [busy, setBusy] = useState(false);

  if (!templates?.length) return null;

  const apply = async () => {
    if (!confirming) return;
    setBusy(true);
    try {
      await applyTemplate(confirming.id, "replace");
      toast.success(`Switched to the ${confirming.business_type} template.`);
      qc.invalidateQueries();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
      setConfirming(null);
    }
  };

  return (
    <section className="mt-6 rounded-2xl border border-[#E7E7EA] bg-white p-5">
      <div className="flex items-center gap-2 mb-1">
        <Layers className="w-4 h-4" />
        <h3 className="text-sm font-semibold">Switch template</h3>
      </div>
      <p className="text-[13px] text-neutral-500 mb-4">
        Start over from a ready-made setup for your type of business. This replaces your current agent's targeting and signals and your campaign's sequence.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {templates.map((t) => (
          <TemplateCard key={t.id} template={t} onSelect={() => setConfirming(t)} />
        ))}
      </div>

      <AlertDialog open={!!confirming} onOpenChange={(open) => !open && !busy && setConfirming(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Replace your current setup?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Your agent's job titles, filters and signals and your campaign's messages and settings will be replaced by the{" "}
              <strong>{confirming?.business_type}</strong> template. Leads you already found, conversations and stats stay. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); apply(); }} disabled={busy}>
              {busy && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />} Replace setup
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

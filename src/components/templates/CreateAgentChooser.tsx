import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Layers, Loader2, PenLine } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { adminTemplates, applyTemplate, useAllTemplates, usePublicTemplates, type AgentTemplate } from "@/lib/agentTemplates";
import { TemplateCard } from "./TemplateCard";

type Applied = Awaited<ReturnType<typeof applyTemplate>>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** "Configure your own": opens the agent form. */
  onCustom: () => void;
  onApplied: (template: AgentTemplate, result: Applied) => void;
};

/** Signal Agents → Create agent: configure your own, or start from a template. */
export function CreateAgentChooser({ open, onOpenChange, onCustom, onApplied }: Props) {
  const { data: publicTemplates } = usePublicTemplates();
  const { data: isAdmin } = useAdminCheck();
  const { data: allTemplates } = useAllTemplates(Boolean(isAdmin));
  // Admins also see private templates, and manage them here.
  const templates = isAdmin ? allTemplates?.filter((t) => !t.archived_at) : publicTemplates;
  const qc = useQueryClient();
  const [view, setView] = useState<"choose" | "templates">("choose");
  const [selected, setSelected] = useState<AgentTemplate | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setView("choose");
      setSelected(null);
    }
  }, [open]);

  const useTemplate = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      onApplied(selected, await applyTemplate(selected.id, "create"));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const manage = async (body: Record<string, unknown>) => {
    setBusy(true);
    try {
      await adminTemplates(body);
      if (body.action === "archive" && selected?.id === body.id) setSelected(null);
      await qc.invalidateQueries({ queryKey: ["agent-templates"] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent className={`w-[calc(100vw-2rem)] rounded-2xl sm:rounded-2xl ${view === "templates" ? "max-w-3xl" : "max-w-xl"}`}>
        {view === "choose" ? (
          <>
            <DialogHeader>
              <DialogTitle>Create a Signal agent</DialogTitle>
              <DialogDescription>How do you want to start?</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setView("templates")}
                className="flex flex-col items-start text-left rounded-2xl border border-[#E7E7EA] bg-white p-4 hover:border-neutral-300 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-[#F4F4F5] flex items-center justify-center mb-3">
                  <Layers className="w-5 h-5 text-[#0a0a0a]" />
                </div>
                <p className="text-[15px] font-semibold text-[#0a0a0a]">Use a ready template</p>
                <p className="text-[13px] text-neutral-500 mt-1 leading-snug">
                  Start from a setup made for your type of business. You can change anything later.
                </p>
              </button>
              <button
                type="button"
                onClick={onCustom}
                className="flex flex-col items-start text-left rounded-2xl border border-[#E7E7EA] bg-white p-4 hover:border-neutral-300 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-[#F4F4F5] flex items-center justify-center mb-3">
                  <PenLine className="w-5 h-5 text-[#0a0a0a]" />
                </div>
                <p className="text-[15px] font-semibold text-[#0a0a0a]">Configure your own</p>
                <p className="text-[13px] text-neutral-500 mt-1 leading-snug">
                  Choose your own targeting, signals and leads list step by step.
                </p>
              </button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <button
                type="button"
                onClick={() => setView("choose")}
                disabled={busy}
                className="inline-flex items-center gap-1 self-start text-xs text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              <DialogTitle>Agent templates</DialogTitle>
              <DialogDescription>Pick the closest match. You get a signal agent and a LinkedIn sequence, and the campaign stays paused until you turn it on.</DialogDescription>
            </DialogHeader>

            {templates?.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto p-px">
                {templates.map((t) => (
                  <div key={t.id} className="flex flex-col gap-1.5">
                    <TemplateCard template={t} selected={selected?.id === t.id} onSelect={() => setSelected(t)} />
                    {isAdmin && (
                      <div className="flex items-center justify-between gap-2 px-1 text-xs text-muted-foreground">
                        <label className="inline-flex items-center gap-1.5">
                          <Switch
                            checked={t.is_public}
                            disabled={busy}
                            onCheckedChange={(is_public) => manage({ action: "update", id: t.id, is_public })}
                            aria-label={`Make ${t.business_type} public`}
                          />
                          {t.is_public ? "Public" : "Private"}
                        </label>
                        <span className="inline-flex items-center gap-3">
                          <Link to="/admin/templates" className="underline">Edit sequence</Link>
                          <button type="button" disabled={busy} onClick={() => manage({ action: "archive", id: t.id })} className="underline">Archive</button>
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-2xl border border-dashed border-[#E7E7EA] p-6 text-center text-sm text-muted-foreground">
                No templates published yet.
                {isAdmin && (
                  <>
                    {" "}
                    To add one, open an agent and click Save as template.
                  </>
                )}
              </p>
            )}

            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-border">
              <div className="text-[13px]">
                <span className="text-neutral-500">Don't find what you're looking for?</span>{" "}
                <button type="button" onClick={onCustom} disabled={busy} className="font-semibold text-[#0a0a0a] underline underline-offset-2">
                  Build your custom Signal agent
                </button>
              </div>
              <button
                type="button"
                onClick={useTemplate}
                disabled={!selected || busy}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#0a0a0a] text-white px-4 py-2 text-sm shrink-0 disabled:opacity-40"
              >
                {busy && <Loader2 className="w-4 h-4 animate-spin" />} Use this template
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

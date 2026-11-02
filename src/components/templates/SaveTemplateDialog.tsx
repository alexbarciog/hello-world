import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { adminTemplates, DEFAULT_TEMPLATE_CAMPAIGN, type AgentTemplateConfig } from "@/lib/agentTemplates";
import { TEMPLATE_ICONS } from "./TemplateCard";

const input = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Saved agent to copy the campaign sequence from; null for a new agent. */
  agentId: string | null;
  /** What's in the agent form right now. */
  agent: AgentTemplateConfig["agent"];
};

/** Agent form (admins): save what's in the form as a template, public or private. */
export function SaveTemplateDialog({ open, onOpenChange, agentId, agent }: Props) {
  const qc = useQueryClient();
  const [businessType, setBusinessType] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("sparkles");
  const [isPublic, setIsPublic] = useState(false);
  const [config, setConfig] = useState<AgentTemplateConfig | null>(null);
  const [copiedSequence, setCopiedSequence] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  // The server cleans the setup (no list names or competitor URLs) and adds the sequence.
  useEffect(() => {
    if (!open) return;
    setBusinessType("");
    setDescription("");
    setIcon("sparkles");
    setIsPublic(false);
    setConfig(null);
    setErrors([]);
    let stale = false;
    adminTemplates({ action: "from_agent", agent_id: agentId, overrides: agent })
      .then((res) => {
        if (stale) return;
        const parsed = res.config as AgentTemplateConfig;
        const steps = parsed.campaign.workflow_steps ?? [];
        const hasSequence = Boolean(res.had_campaign) && steps.length > 0;
        setCopiedSequence(hasSequence);
        setConfig(hasSequence ? parsed : { ...parsed, campaign: DEFAULT_TEMPLATE_CAMPAIGN });
      })
      .catch((e: Error) => {
        if (!stale) setErrors([e.message]);
      });
    return () => { stale = true; };
    // `agent` is rebuilt on every render of the form; the dialog copies it once on open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const save = async () => {
    if (!config) return;
    if (!businessType.trim()) {
      setErrors(["Add a business type. It's the title customers see on the card."]);
      return;
    }
    setBusy(true);
    setErrors([]);
    try {
      await adminTemplates({
        action: "create",
        name: config.agent.name || businessType,
        business_type: businessType,
        description,
        icon,
        is_public: isPublic,
        sort_order: 0,
        config,
      });
      await qc.invalidateQueries({ queryKey: ["agent-templates"] });
      toast.success(isPublic ? "Template saved. Customers can pick it now." : "Template saved as private. Only admins can see it.");
      onOpenChange(false);
    } catch (e) {
      const err = e as Error & { errors?: string[] };
      setErrors(err.errors?.length ? err.errors : [err.message]);
    } finally {
      setBusy(false);
    }
  };

  const steps = config?.campaign.workflow_steps ?? [];

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-lg rounded-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Save as template</DialogTitle>
          <DialogDescription>Uses the targeting and signals in this form. This agent isn't changed.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <label className="block">
            <span className="block text-xs font-semibold mb-1">Business type (card title)</span>
            <input className={input} placeholder="e.g. Recruiter" value={businessType} onChange={(e) => setBusinessType(e.target.value)} />
          </label>
          <label className="block">
            <span className="block text-xs font-semibold mb-1">Description (card text)</span>
            <textarea className={`${input} min-h-[60px]`} value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <label className="block">
            <span className="block text-xs font-semibold mb-1">Icon</span>
            <select className={input} value={icon} onChange={(e) => setIcon(e.target.value)}>
              {Object.keys(TEMPLATE_ICONS).map((k) => <option key={k}>{k}</option>)}
            </select>
          </label>

          <div className="rounded-xl border border-border p-3">
            <p className="text-xs font-semibold">LinkedIn sequence</p>
            {!config && !errors.length ? (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground mt-2" />
            ) : (
              <>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {copiedSequence
                    ? "Copied from this agent's campaign. Customers get this exact text, so check it mentions nothing specific to you."
                    : "This agent has no campaign yet, so the template uses a connection request plus an AI opening message."}
                </p>
                <ol className="mt-2 space-y-1 text-xs text-foreground/80 list-decimal pl-4 max-h-32 overflow-y-auto">
                  {steps.map((s, i) => (
                    <li key={i}>
                      <span className="font-medium">{s.type}</span>
                      {s.message?.trim() ? `: ${s.message.trim()}` : s.ai_icebreaker ? ": AI opening message" : ""}
                    </li>
                  ))}
                </ol>
              </>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
            <div>
              <p className="text-sm font-semibold">{isPublic ? "Public" : "Private"}</p>
              <p className="text-xs text-muted-foreground">
                {isPublic ? "Customers can pick it when they create an agent." : "Only admins can see it."}
              </p>
            </div>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} aria-label="Make this template public" />
          </div>

          {errors.length > 0 && (
            <ul className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-800 list-disc pl-6">
              {errors.map((e) => <li key={e}>{e}</li>)}
            </ul>
          )}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => onOpenChange(false)} disabled={busy} className="rounded-lg border border-border px-4 py-2 text-sm">Cancel</button>
            <button
              type="button"
              onClick={save}
              disabled={busy || !config}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0a0a0a] text-white px-4 py-2 text-sm disabled:opacity-60"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />} Save template
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

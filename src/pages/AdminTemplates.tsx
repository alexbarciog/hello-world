import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Archive, ArchiveRestore, Copy, Eye, Loader2, Pencil, Plus, Save, Wand2 } from "lucide-react";
import { toast } from "sonner";
import CreateAgentWizard from "@/components/CreateAgentWizard";
import { CampaignTemplateForm } from "@/components/templates/CampaignTemplateForm";
import { TEMPLATE_ICONS, TemplateCard } from "@/components/templates/TemplateCard";
import { adminTemplates, useAllTemplates, type AgentTemplate, type AgentTemplateConfig } from "@/lib/agentTemplates";

const BLANK_CONFIG: AgentTemplateConfig = {
  schema_version: 1,
  agent: {
    name: "",
    icp_job_titles: [],
    icp_locations: [],
    icp_industries: [],
    icp_company_types: [],
    icp_company_sizes: [],
    icp_exclude_keywords: [],
    icp_restricted_countries: [],
    icp_restricted_roles: [],
    ideal_lead_description: null,
    precision_mode: "discovery",
    signals_config: { enabled: ["keyword_posts", "job_changes"], keywords: {} },
    manual_approval: false,
  },
  campaign: {
    value_proposition: "",
    pain_points: [],
    campaign_goal: "conversations",
    message_tone: "professional",
    language: "English",
    custom_training: "",
    workflow_steps: [
      { type: "invitation", delay_days: 0 },
      { type: "message", delay_days: 1, ai_icebreaker: true, message: "" },
    ],
    daily_connect_limit: 25,
    timezone: "UTC",
    exclude_first_degree: true,
    conversational_ai: false,
    max_ai_replies: 5,
  },
};

interface Draft {
  id?: string;
  name: string;
  business_type: string;
  description: string;
  icon: string;
  is_public: boolean;
  sort_order: number;
  config: AgentTemplateConfig;
}

const toDraft = (t: AgentTemplate): Draft => ({
  id: t.id, name: t.name, business_type: t.business_type, description: t.description,
  icon: t.icon, is_public: t.is_public, sort_order: t.sort_order, config: t.config,
});

const input = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

export default function AdminTemplates() {
  const qc = useQueryClient();
  const { data: templates, isLoading } = useAllTemplates(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [agentEditorOpen, setAgentEditorOpen] = useState(false);
  const [preview, setPreview] = useState(false);
  const [pickAgent, setPickAgent] = useState<Array<{ id: string; name: string; created_at: string; results_count: number | null }> | null>(null);

  const refresh = () => qc.invalidateQueries({ queryKey: ["agent-templates"] });

  const run = async (label: string, body: Record<string, unknown>) => {
    setBusy(true);
    setErrors([]);
    try {
      const res = await adminTemplates(body);
      toast.success(label);
      await refresh();
      return res;
    } catch (e) {
      const err = e as Error & { errors?: string[] };
      setErrors(err.errors ?? []);
      toast.error(err.message);
      return null;
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!draft) return;
    const { id, ...fields } = draft;
    const res = await run(id ? "Template saved" : "Template created", id ? { action: "update", id, ...fields } : { action: "create", ...fields });
    if (res?.template) setDraft(toDraft(res.template));
  };

  const startFromAgent = async () => {
    const res = await run("Pick an agent", { action: "list_agents" });
    if (res?.agents) setPickAgent(res.agents);
  };

  const fromAgent = async (agentId: string) => {
    setPickAgent(null);
    const res = await run("Copied the agent's setup. Review it, then save.", { action: "from_agent", agent_id: agentId });
    if (!res?.config) return;
    const config = res.config as AgentTemplateConfig;
    setDraft({ name: config.agent.name || "New template", business_type: "", description: "", icon: "sparkles", is_public: false, sort_order: 0, config });
    setErrors(res.errors ?? []);
  };

  const sorted = useMemo(() => [...(templates ?? [])].sort((a, b) => Number(!!a.archived_at) - Number(!!b.archived_at)), [templates]);

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Agent templates</h1>
          <p className="text-sm text-muted-foreground">Public templates appear in onboarding ("What kind of business are you?") and in Settings → Switch template.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={startFromAgent} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted">
            <Wand2 className="w-4 h-4" /> Save an agent as template
          </button>
          <button onClick={() => { setErrors([]); setDraft({ name: "", business_type: "", description: "", icon: "sparkles", is_public: false, sort_order: 0, config: BLANK_CONFIG }); }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0a0a0a] text-white px-3 py-2 text-sm">
            <Plus className="w-4 h-4" /> New template
          </button>
        </div>
      </div>

      {pickAgent && (
        <div className="mb-6 rounded-2xl border border-border p-4">
          <p className="text-sm font-semibold mb-2">Which agent? Its signal setup and its campaign's sequence are copied; the customer's list, company and competitor/influencer URLs are left out.</p>
          <div className="max-h-64 overflow-y-auto divide-y divide-border">
            {pickAgent.map((a) => (
              <button key={a.id} onClick={() => fromAgent(a.id)} className="w-full text-left px-2 py-2 text-sm hover:bg-muted flex justify-between">
                <span>{a.name}</span>
                <span className="text-xs text-muted-foreground">{a.results_count ?? 0} leads · {new Date(a.created_at).toLocaleDateString()}</span>
              </button>
            ))}
          </div>
          <button onClick={() => setPickAgent(null)} className="mt-2 text-xs text-muted-foreground underline">Cancel</button>
        </div>
      )}

      {draft ? (
        <div className="rounded-2xl border border-border p-5 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{draft.id ? `Edit: ${draft.name}` : "New template"}</h2>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={preview} onChange={(e) => setPreview(e.target.checked)} />
              <Eye className="w-4 h-4" /> Preview as customer
            </label>
          </div>

          {preview && (
            <div className="rounded-xl bg-[#fafafa] p-4">
              <p className="text-xs text-muted-foreground mb-2">Onboarding card:</p>
              <div className="max-w-md"><TemplateCard template={draft} selected /></div>
            </div>
          )}

          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="block text-xs font-semibold mb-1">Template name (internal)</span>
              <input className={input} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </div>
            <div>
              <span className="block text-xs font-semibold mb-1">Business type (card title)</span>
              <input className={input} placeholder="e.g. Recruiter" value={draft.business_type} onChange={(e) => setDraft({ ...draft, business_type: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <span className="block text-xs font-semibold mb-1">Description (card text)</span>
              <textarea className={`${input} min-h-[60px]`} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            </div>
            <div>
              <span className="block text-xs font-semibold mb-1">Icon</span>
              <select className={input} value={draft.icon} onChange={(e) => setDraft({ ...draft, icon: e.target.value })}>
                {Object.keys(TEMPLATE_ICONS).map((k) => <option key={k}>{k}</option>)}
              </select>
            </div>
            <div>
              <span className="block text-xs font-semibold mb-1">Sort order (lower first)</span>
              <input type="number" className={input} value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={draft.is_public} onChange={(e) => setDraft({ ...draft, is_public: e.target.checked })} />
              Public (customers can pick it)
            </label>
          </section>

          <section className="rounded-xl border border-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Signal agent</h3>
                <p className="text-xs text-muted-foreground">
                  {draft.config.agent.name || "Unnamed"} · {draft.config.agent.icp_job_titles.length} job titles ·{" "}
                  {draft.config.agent.signals_config.enabled.join(", ") || "no signals"} · {draft.config.agent.precision_mode}
                </p>
              </div>
              <button onClick={() => setAgentEditorOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted">
                <Pencil className="w-4 h-4" /> Edit in the agent form
              </button>
            </div>
          </section>

          <section className="rounded-xl border border-border p-4">
            <h3 className="text-sm font-semibold mb-3">Campaign and sequence</h3>
            <CampaignTemplateForm value={draft.config.campaign} onChange={(campaign) => setDraft({ ...draft, config: { ...draft.config, campaign } })} />
          </section>

          {errors.length > 0 && (
            <ul className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-800 list-disc pl-6">
              {errors.map((e) => <li key={e}>{e}</li>)}
            </ul>
          )}

          <div className="flex justify-end gap-2">
            <button onClick={() => { setDraft(null); setErrors([]); }} className="rounded-lg border border-border px-4 py-2 text-sm">Close</button>
            <button onClick={save} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg bg-[#0a0a0a] text-white px-4 py-2 text-sm disabled:opacity-60">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save template
            </button>
          </div>

          {agentEditorOpen && (
            <CreateAgentWizard
              onClose={() => setAgentEditorOpen(false)}
              onCreated={() => undefined}
              templateMode={{
                initial: draft.config.agent,
                onSave: (agent) => {
                  setDraft({ ...draft, config: { ...draft.config, agent } });
                  setAgentEditorOpen(false);
                  toast.success("Agent setup updated in the template (not saved yet)");
                },
              }}
            />
          )}
        </div>
      ) : isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="rounded-2xl border border-border divide-y divide-border">
          {sorted.length === 0 && <p className="p-6 text-sm text-muted-foreground">No templates yet.</p>}
          {sorted.map((t) => (
            <div key={t.id} className={`flex flex-wrap items-center gap-3 p-4 ${t.archived_at ? "opacity-50" : ""}`}>
              <div className="flex-1 min-w-[200px]">
                <p className="text-sm font-semibold">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.business_type} · v{t.version} · {t.archived_at ? "archived" : t.is_public ? "public" : "private"}</p>
              </div>
              <button onClick={() => { setErrors([]); setDraft(toDraft(t)); }} className="inline-flex items-center gap-1 text-sm px-2 py-1 rounded hover:bg-muted"><Pencil className="w-4 h-4" /> Edit</button>
              <button disabled={busy} onClick={() => run("Duplicated", { action: "duplicate", id: t.id })} className="inline-flex items-center gap-1 text-sm px-2 py-1 rounded hover:bg-muted"><Copy className="w-4 h-4" /> Duplicate</button>
              {t.archived_at ? (
                <button disabled={busy} onClick={() => run("Restored", { action: "unarchive", id: t.id })} className="inline-flex items-center gap-1 text-sm px-2 py-1 rounded hover:bg-muted"><ArchiveRestore className="w-4 h-4" /> Restore</button>
              ) : (
                <button disabled={busy} onClick={() => run("Archived", { action: "archive", id: t.id })} className="inline-flex items-center gap-1 text-sm px-2 py-1 rounded hover:bg-muted"><Archive className="w-4 h-4" /> Archive</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

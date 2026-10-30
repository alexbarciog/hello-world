import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import type { AgentTemplateConfig } from "@/lib/agentTemplates";

type Campaign = AgentTemplateConfig["campaign"];
type Step = Campaign["workflow_steps"][number];

// Same choices as CampaignDetail's settings tab.
const LANGUAGES = ["English", "Romanian", "German", "Dutch"];
const TIMEZONES = ["UTC", "Europe/London", "Europe/Bucharest", "Europe/Berlin", "Europe/Amsterdam", "Europe/Paris", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "Asia/Dubai", "Asia/Kolkata", "Asia/Singapore", "Australia/Sydney"];
const STEP_LABELS: Record<Step["type"], string> = {
  invitation: "Connection request",
  message: "LinkedIn message",
  email: "Email",
  comment: "Comment on post",
  like: "Like post",
  visit_profile: "Visit profile",
};
const PLACEHOLDERS = ["{{first_name}}", "{{last_name}}", "{{company}}", "{{title}}", "{{signal}}", "{{my_company}}", "{{demo_link}}"];

const input = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";
const label = "block text-xs font-semibold text-foreground mb-1";

/** The campaign half of a template: settings + the outreach sequence. */
export function CampaignTemplateForm({ value, onChange }: { value: Campaign; onChange: (next: Campaign) => void }) {
  const set = <K extends keyof Campaign>(key: K, v: Campaign[K]) => onChange({ ...value, [key]: v });
  const setStep = (i: number, patch: Partial<Step>) =>
    set("workflow_steps", value.workflow_steps.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const moveStep = (i: number, dir: -1 | 1) => {
    const steps = [...value.workflow_steps];
    const j = i + dir;
    if (j < 0 || j >= steps.length) return;
    [steps[i], steps[j]] = [steps[j], steps[i]];
    set("workflow_steps", steps);
  };
  const addStep = (type: Step["type"]) =>
    set("workflow_steps", [...value.workflow_steps, type === "comment" || type === "like"
      ? { type, delay_hours: 24, post_filter: "authored_only" }
      : { type, delay_days: type === "invitation" ? 0 : 2, message: "" }]);

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <span className={label}>Pain points this sequence speaks to (one per line)</span>
          <textarea className={`${input} min-h-[80px]`} value={value.pain_points.join("\n")}
            onChange={(e) => set("pain_points", e.target.value.split("\n").map((l) => l.replace(/^-\s*/, "")).filter((l) => l.trim()))} />
        </div>
        <div>
          <span className={label}>Goal</span>
          <select className={input} value={value.campaign_goal} onChange={(e) => set("campaign_goal", e.target.value as Campaign["campaign_goal"])}>
            <option value="conversations">Start conversations</option>
            <option value="demos">Book demos</option>
          </select>
        </div>
        <div>
          <span className={label}>Tone</span>
          <select className={input} value={value.message_tone} onChange={(e) => set("message_tone", e.target.value as Campaign["message_tone"])}>
            <option value="professional">Professional</option>
            <option value="conversational">Conversational</option>
            <option value="direct">Direct</option>
          </select>
        </div>
        <div>
          <span className={label}>Language</span>
          <select className={input} value={value.language} onChange={(e) => set("language", e.target.value)}>
            {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
          </select>
        </div>
        <div>
          <span className={label}>Send window time zone (invites go out 08:00–18:00)</span>
          <select className={input} value={value.timezone} onChange={(e) => set("timezone", e.target.value)}>
            {TIMEZONES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <span className={label}>Daily connection requests (1–100; the account's safety cap still applies)</span>
          <input type="number" min={1} max={100} className={input} value={value.daily_connect_limit}
            onChange={(e) => set("daily_connect_limit", Number(e.target.value))} />
        </div>
        <div>
          <span className={label}>AI replies per conversation</span>
          <select className={input} value={value.max_ai_replies} onChange={(e) => set("max_ai_replies", Number(e.target.value))}>
            {[3, 5, 7, 10].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={value.conversational_ai} onChange={(e) => set("conversational_ai", e.target.checked)} />
          AI SDR replies to leads (conversational AI)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={value.exclude_first_degree} onChange={(e) => set("exclude_first_degree", e.target.checked)} />
          Skip people already connected (1st degree)
        </label>
        <div className="md:col-span-2">
          <span className={label}>Reply handling rules and stop conditions for the AI SDR</span>
          <textarea className={`${input} min-h-[80px]`} value={value.custom_training}
            placeholder="e.g. Never quote prices. Stop if they say they already have an agency. Offer {{demo_link}} once they ask how it works."
            onChange={(e) => set("custom_training", e.target.value)} />
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold">Sequence</h3>
          <p className="text-[11px] text-muted-foreground">Placeholders: {PLACEHOLDERS.join(" ")}</p>
        </div>
        <ol className="space-y-3">
          {value.workflow_steps.map((step, i) => (
            <li key={i} className="rounded-xl border border-border p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground w-5">{i + 1}.</span>
                <select className={`${input} !w-auto`} value={step.type} onChange={(e) => setStep(i, { type: e.target.value as Step["type"] })}>
                  {Object.entries(STEP_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <span className="text-xs text-muted-foreground ml-2">after</span>
                <input type="number" min={0} className={`${input} !w-20`}
                  value={step.delay_hours !== undefined ? step.delay_hours : (step.delay_days ?? 0) * 24}
                  onChange={(e) => setStep(i, { delay_hours: Number(e.target.value), delay_days: undefined })} />
                <span className="text-xs text-muted-foreground">hours</span>
                <div className="ml-auto flex items-center gap-1">
                  <button type="button" aria-label="Move up" onClick={() => moveStep(i, -1)} className="p-1 text-muted-foreground hover:text-foreground"><ArrowUp className="w-4 h-4" /></button>
                  <button type="button" aria-label="Move down" onClick={() => moveStep(i, 1)} className="p-1 text-muted-foreground hover:text-foreground"><ArrowDown className="w-4 h-4" /></button>
                  <button type="button" aria-label="Remove step" onClick={() => set("workflow_steps", value.workflow_steps.filter((_, j) => j !== i))} className="p-1 text-muted-foreground hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>

              {step.type === "email" && (
                <input className={input} placeholder="Subject" value={step.subject ?? ""} onChange={(e) => setStep(i, { subject: e.target.value })} />
              )}
              {(step.type === "message" || step.type === "email") && (
                <textarea className={`${input} min-h-[80px]`} placeholder={step.ai_icebreaker || step.ai_sdr ? "Optional: the AI writes this step" : "Message text"}
                  value={step.message ?? ""} onChange={(e) => setStep(i, { message: e.target.value })} />
              )}
              {step.type === "invitation" && (
                <input className={input} placeholder="Connection note (optional)" value={step.connect_note ?? ""} onChange={(e) => setStep(i, { connect_note: e.target.value || null })} />
              )}
              {(step.type === "message" || step.type === "email") && (
                <div className="flex flex-wrap items-center gap-4">
                  {step.type === "message" && (
                    <label className="flex items-center gap-2 text-xs">
                      <input type="checkbox" checked={step.ai_icebreaker === true} onChange={(e) => setStep(i, { ai_icebreaker: e.target.checked || undefined })} />
                      AI writes a personalised version
                    </label>
                  )}
                  {step.type === "email" && (
                    <label className="flex items-center gap-2 text-xs">
                      <input type="checkbox" checked={step.ai_sdr === true} onChange={(e) => setStep(i, { ai_sdr: e.target.checked || undefined })} />
                      AI writes the email
                    </label>
                  )}
                  <input className={`${input} flex-1 min-w-[200px]`} placeholder="Instructions for the AI (optional)"
                    value={step.step_instructions ?? ""} onChange={(e) => setStep(i, { step_instructions: e.target.value || undefined })} />
                </div>
              )}
              {(step.type === "comment" || step.type === "like") && (
                <div className="flex flex-wrap items-center gap-3">
                  <select className={`${input} !w-auto`} value={step.post_filter ?? "authored_only"} onChange={(e) => setStep(i, { post_filter: e.target.value as Step["post_filter"] })}>
                    <option value="authored_only">Only posts the lead wrote</option>
                    <option value="all_signals">Any post from the signal</option>
                  </select>
                  <label className="flex items-center gap-2 text-xs">
                    <input type="checkbox" checked={step.before_invitation === true} onChange={(e) => setStep(i, { before_invitation: e.target.checked || undefined })} />
                    Before the connection request
                  </label>
                  {step.type === "comment" && (
                    <input className={`${input} flex-1 min-w-[200px]`} placeholder="Comment instructions for the AI"
                      value={step.ai_instructions ?? ""} onChange={(e) => setStep(i, { ai_instructions: e.target.value || undefined })} />
                  )}
                </div>
              )}
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap gap-2 mt-3">
          {(Object.keys(STEP_LABELS) as Step["type"][]).filter((t) => t !== "visit_profile").map((t) => (
            <button key={t} type="button" onClick={() => addStep(t)}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs hover:bg-muted">
              <Plus className="w-3.5 h-3.5" /> {STEP_LABELS[t]}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

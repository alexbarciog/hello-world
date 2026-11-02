import { Briefcase, Check, Code, Megaphone, Palette, Sparkles, Users, Calculator, type LucideIcon } from "lucide-react";
import type { AgentTemplate } from "@/lib/agentTemplates";

// Icons an admin can pick for a template card.
export const TEMPLATE_ICONS: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  palette: Palette,
  users: Users,
  calculator: Calculator,
  code: Code,
  megaphone: Megaphone,
  briefcase: Briefcase,
};

/** The card a customer sees in onboarding ("What kind of business are you?"). */
export function TemplateCard({
  template,
  selected,
  onSelect,
}: {
  template: Pick<AgentTemplate, "name" | "business_type" | "description" | "icon" | "config">;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const Icon = TEMPLATE_ICONS[template.icon] ?? Sparkles;
  const signals = template.config?.agent?.signals_config?.enabled?.length ?? 0;
  const steps = template.config?.campaign?.workflow_steps?.length ?? 0;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative w-full text-left rounded-2xl border p-4 transition-colors ${
        selected ? "border-[#0a0a0a] bg-[#fafafa] ring-1 ring-[#0a0a0a]" : "border-[#E7E7EA] bg-white hover:border-neutral-300"
      }`}
    >
      {selected && (
        <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#0a0a0a] text-white flex items-center justify-center">
          <Check className="w-3 h-3" />
        </span>
      )}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#F4F4F5] flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-[#0a0a0a]" />
        </div>
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-[#0a0a0a] leading-tight">{template.business_type}</p>
          <p className="text-[13px] text-neutral-500 mt-1 leading-snug">{template.description}</p>
          <p className="text-[11.5px] text-neutral-400 mt-2">
            {signals} signal{signals === 1 ? "" : "s"} · {steps}-step LinkedIn sequence
          </p>
        </div>
      </div>
    </button>
  );
}

import {
  Briefcase, Calculator, Check, Clapperboard, Code, Megaphone, Palette, PenLine, Server, ShieldCheck, Sparkles, Target, Users,
  type LucideIcon,
} from "lucide-react";
import type { AgentTemplate } from "@/lib/agentTemplates";
import { COLOR_TILE, colorOf, liveSignals, pluralize, sequenceSteps } from "@/lib/templateMarketplace";

// Icons an admin can pick for a template card.
export const TEMPLATE_ICONS: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  palette: Palette,
  users: Users,
  calculator: Calculator,
  code: Code,
  megaphone: Megaphone,
  briefcase: Briefcase,
  server: Server,
  video: Clapperboard,
  pen: PenLine,
  shield: ShieldCheck,
  target: Target,
};

type TileTemplate = Pick<AgentTemplate, "icon"> & Partial<Pick<AgentTemplate, "category" | "color">>;

/** The coloured rounded square with the template's icon. */
export function TemplateIconTile({ template, size = "md" }: { template: TileTemplate; size?: "sm" | "md" | "lg" }) {
  const Icon = TEMPLATE_ICONS[template.icon] ?? Sparkles;
  const box = size === "lg" ? "w-14 h-14 rounded-2xl" : size === "sm" ? "w-9 h-9 rounded-xl" : "w-11 h-11 rounded-xl";
  const icon = size === "lg" ? "w-6 h-6" : size === "sm" ? "w-4 h-4" : "w-5 h-5";
  return (
    <div className={`${box} ${COLOR_TILE[colorOf(template)]} ring-1 flex items-center justify-center shrink-0`}>
      <Icon className={icon} strokeWidth={1.9} />
    </div>
  );
}

/** Selectable card: onboarding ("What kind of business are you?"), the Create agent dialog and Switch template. */
export function TemplateCard({
  template,
  selected,
  onSelect,
}: {
  template: Pick<AgentTemplate, "name" | "business_type" | "description" | "icon" | "config"> & Partial<Pick<AgentTemplate, "tagline" | "category" | "color">>;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const signals = liveSignals(template).length;
  const steps = sequenceSteps(template).length;
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
        <TemplateIconTile template={template} size="sm" />
        <div className="min-w-0 pr-5">
          <p className="text-[15px] font-semibold text-[#0a0a0a] leading-tight">{template.business_type}</p>
          <p className="text-[13px] text-neutral-500 mt-1 leading-snug line-clamp-2">{template.tagline || template.description}</p>
          <p className="text-[11.5px] text-neutral-400 mt-2">
            {pluralize(signals, "signal")} · {steps}-step LinkedIn sequence
          </p>
        </div>
      </div>
    </button>
  );
}

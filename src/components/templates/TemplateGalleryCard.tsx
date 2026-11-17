import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import intentslyIcon from "@/assets/intentsly-icon.png";
import type { AgentTemplate } from "@/lib/agentTemplates";
import { SIGNAL_INFO, liveSignals, pluralize, sequenceSteps, usedByLabel } from "@/lib/templateMarketplace";
import { SIGNAL_ICONS } from "./signalIcons";
import { TemplateIconTile } from "./TemplateCard";

export type GalleryTemplate = Pick<AgentTemplate, "name" | "description" | "icon" | "config"> &
  Partial<Pick<AgentTemplate, "slug" | "tagline" | "category" | "color" | "uses_count">>;

type Props = {
  template: GalleryTemplate;
  /** Larger card for the featured row. */
  featured?: boolean;
  /** Link target; without it (and without onClick) the card is a static preview. */
  to?: string;
  onClick?: () => void;
  /** Hover label, "Preview" by default. */
  cta?: string;
};

/** A template as it appears in the gallery. Also used by the admin "Preview card". */
export function TemplateGalleryCard({ template, featured, to, onClick, cta = "Preview" }: Props) {
  const signals = liveSignals(template);
  const steps = sequenceSteps(template).length;
  // Competitor followers and engagers share an icon: show it once.
  const icons = [...new Set(signals.map((id) => SIGNAL_ICONS[id]).filter(Boolean))];
  const usedBy = usedByLabel(template.uses_count);
  const interactive = !!(to || onClick);

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <TemplateIconTile template={template} size={featured ? "lg" : "md"} />
        {icons.length > 0 && (
          <div className="flex items-center gap-1 pt-1" aria-label={`Signals: ${signals.map((id) => SIGNAL_INFO[id]?.label).join(", ")}`}>
            {icons.map((Icon, i) => (
              <span key={i} className="w-6 h-6 rounded-md bg-[#F4F4F5] text-neutral-500 flex items-center justify-center">
                <Icon className="w-3.5 h-3.5" strokeWidth={1.9} />
              </span>
            ))}
          </div>
        )}
      </div>

      <h3 className={`mt-4 font-semibold text-[#0a0a0a] leading-snug ${featured ? "text-[17px]" : "text-[15px]"}`}>{template.name}</h3>
      <p className={`mt-1.5 text-neutral-500 leading-snug line-clamp-2 ${featured ? "text-[14px]" : "text-[13px]"}`}>
        {template.tagline || template.description}
      </p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        <span className="inline-flex items-center rounded-full bg-[#F4F4F5] px-2.5 py-1 text-[11.5px] font-medium text-neutral-600">
          {pluralize(signals.length, "signal")}
        </span>
        {steps > 0 && (
          <span className="inline-flex items-center rounded-full bg-[#F4F4F5] px-2.5 py-1 text-[11.5px] font-medium text-neutral-600">
            {steps}-step LinkedIn sequence
          </span>
        )}
      </div>

      <div className="mt-auto pt-4 flex items-center justify-between gap-2 text-[12px] text-neutral-500">
        <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 min-w-0">
          <img src={intentslyIcon} alt="" className="w-4 h-4 rounded-[4px] shrink-0" />
          <span>Made by Intentsly</span>
          {usedBy && <span className="text-neutral-400">· {usedBy}</span>}
        </span>
        {interactive && (
          <span className="hidden sm:inline-flex items-center gap-1 font-medium text-[#1A8FE3] sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-visible:opacity-100 transition-opacity shrink-0">
            {cta} <ArrowRight className="w-3.5 h-3.5" />
          </span>
        )}
      </div>
    </>
  );

  const cls = `group flex flex-col h-full text-left rounded-2xl border border-[#E7E7EA] bg-white ${featured ? "p-5 md:p-6" : "p-5"} shadow-[0_1px_2px_rgba(10,10,10,0.04)] ${
    interactive
      ? "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-12px_rgba(10,10,10,0.18)] hover:border-neutral-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1A8FE3]/40"
      : ""
  }`;

  if (to) return <Link to={to} className={cls}>{body}</Link>;
  if (onClick) return <button type="button" onClick={onClick} className={`${cls} w-full`}>{body}</button>;
  return <div className={cls}>{body}</div>;
}

import { ExternalLink, MapPin, Building2, Sparkles, Check, X, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LeadResult } from "./types";

interface Props {
  lead: LeadResult;
  status: "review" | "saved" | "skipped";
  onSave: () => void;
  onSkip: () => void;
}

export function LeadCard({ lead, status, onSave, onSkip }: Props) {
  const initials = `${lead.first_name?.[0] ?? ""}${lead.last_name?.[0] ?? ""}`.toUpperCase() || "?";
  const scoreColor =
    lead.match_score >= 80 ? "text-emerald-600 bg-emerald-50" :
    lead.match_score >= 60 ? "text-amber-600 bg-amber-50" :
    "text-foreground/60 bg-foreground/5";

  return (
    <div className="rounded-xl border border-border bg-white p-4 flex flex-col gap-3 transition-shadow hover:shadow-sm">
      <div className="flex items-start gap-3">
        {lead.avatar_url ? (
          <img src={lead.avatar_url} alt={lead.full_name} className="w-11 h-11 rounded-full object-cover shrink-0" />
        ) : (
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[hsl(var(--md-secondary))] to-[hsl(var(--md-primary))] text-white flex items-center justify-center text-sm font-bold shrink-0">
            {initials}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground truncate">{lead.full_name}</p>
            {lead.linkedin_url && (
              <a href={lead.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-foreground/40 hover:text-[hsl(var(--md-secondary))]">
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
          {lead.title && <p className="text-xs text-foreground/70 truncate">{lead.title}</p>}
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-[11px] text-foreground/50">
            {lead.company && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{lead.company}</span>}
            {lead.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{lead.location}</span>}
          </div>
        </div>
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${scoreColor}`}>{lead.match_score}</span>
      </div>

      {lead.reasons && lead.reasons.length > 0 && (
        <div className="bg-foreground/[0.02] rounded-lg p-2.5 border border-border/50">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-foreground/60 mb-1.5">
            <Sparkles className="w-3 h-3 text-[hsl(var(--md-secondary))]" />
            Why this lead
          </div>
          <ul className="space-y-0.5">
            {lead.reasons.slice(0, 3).map((r, i) => (
              <li key={i} className="text-[11px] text-foreground/70 leading-snug">• {r}</li>
            ))}
          </ul>
        </div>
      )}

      {status === "review" ? (
        <div className="flex items-center gap-2">
          <Button
            onClick={onSave}
            size="sm"
            className="flex-1 bg-[hsl(72_100%_50%)] hover:bg-[hsl(72_100%_45%)] text-foreground font-semibold gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            Add to Outreach
          </Button>
          <Button onClick={onSkip} variant="ghost" size="sm" className="gap-1.5 text-foreground/60">
            <X className="w-3.5 h-3.5" />
            Skip
          </Button>
        </div>
      ) : (
        <div className="text-[11px] font-medium text-foreground/40 flex items-center gap-1.5">
          {status === "saved" ? <><Check className="w-3 h-3 text-emerald-500" /> Added to outreach</> : <><X className="w-3 h-3" /> Skipped</>}
        </div>
      )}
    </div>
  );
}

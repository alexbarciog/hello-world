import { ExternalLink, MapPin, Building2, Sparkles, Check, X, Crown, Globe2, ThumbsUp, MessageCircle, Repeat2, Send, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { LeadResult } from "./types";

interface Props {
  lead: LeadResult;
  status: "review" | "saved" | "skipped";
  onSave: () => void;
  onSkip: () => void;
}

// LinkedIn-style brand color
const LI_BLUE = "#0A66C2";

export function LeadCard({ lead, status, onSave, onSkip }: Props) {
  const initials = `${lead.first_name?.[0] ?? ""}${lead.last_name?.[0] ?? ""}`.toUpperCase() || "?";

  const intent = lead.match_score;
  const intentTier =
    intent >= 80 ? "hot" :
    intent >= 60 ? "warm" :
    "cold";

  const intentColor =
    intentTier === "hot" ? "text-rose-600 bg-rose-50 border-rose-200" :
    intentTier === "warm" ? "text-amber-600 bg-amber-50 border-amber-200" :
    "text-foreground/60 bg-foreground/5 border-border";

  const flareColor =
    intentTier === "hot" ? "bg-rose-500" :
    intentTier === "warm" ? "bg-amber-400" :
    null;

  const decisioner = lead.decisioner_score ?? 0;
  const decisionerColor =
    decisioner >= 85 ? "text-purple-600 bg-purple-50 border-purple-200" :
    decisioner >= 70 ? "text-indigo-600 bg-indigo-50 border-indigo-200" :
    "text-foreground/60 bg-foreground/5 border-border";

  return (
    <TooltipProvider delayDuration={150}>
      <div className="rounded-xl border border-border bg-white p-4 flex flex-col gap-3 transition-all hover:shadow-md hover:-translate-y-0.5">
        {/* Header */}
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

          {/* Scores with tooltips + flare */}
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative">
                  {flareColor && (
                    <>
                      <span className={`absolute inset-0 rounded-full ${flareColor} opacity-40 animate-ping`} />
                      <span
                        className={`absolute inset-0 rounded-full ${flareColor} opacity-20 blur-md`}
                        style={{ transform: "scale(1.6)" }}
                      />
                    </>
                  )}
                  <span className={`relative cursor-help text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${intentColor}`}>
                    {intent}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-[240px]">
                <p className="font-semibold mb-1">Buying Intent (0–100)</p>
                <p className="text-[11px] opacity-80">How strongly this person's recent activity signals they're ready to buy.</p>
                <p className="text-[11px] opacity-80 mt-1">≥80 Hot · 60–79 Warm · &lt;60 Cold</p>
              </TooltipContent>
            </Tooltip>

            {decisioner > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className={`cursor-help text-[10px] font-semibold px-1.5 py-0.5 rounded-full border flex items-center gap-0.5 ${decisionerColor}`}>
                    <Crown className="w-2.5 h-2.5" />{decisioner}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-[240px]">
                  <p className="font-semibold mb-1">Decision-Maker Score (0–100)</p>
                  <p className="text-[11px] opacity-80">Likelihood this person has budget authority based on title and seniority.</p>
                  <p className="text-[11px] opacity-80 mt-1">≥85 Executive · 70–84 Senior</p>
                </TooltipContent>
              </Tooltip>
            )}

            {intentTier === "hot" && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500 text-white flex items-center gap-0.5 uppercase tracking-wide">
                <Flame className="w-2.5 h-2.5" /> Hot
              </span>
            )}
          </div>
        </div>

        {/* LinkedIn-style post mockup */}
        {lead.signal_post_excerpt && (
          <a
            href={lead.signal_post_url || lead.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-lg border border-gray-200 bg-white hover:shadow-sm transition-shadow overflow-hidden group"
          >
            {/* LinkedIn post header */}
            <div className="flex items-start gap-2 px-3 pt-2.5 pb-1.5">
              {lead.avatar_url ? (
                <img src={lead.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[hsl(var(--md-secondary))] to-[hsl(var(--md-primary))] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                  {initials}
                </div>
              )}
              <div className="flex-1 min-w-0 leading-tight">
                <p className="text-[12px] font-semibold text-gray-900 truncate">{lead.full_name}</p>
                {lead.title && <p className="text-[10px] text-gray-500 truncate">{lead.title}</p>}
                <p className="text-[10px] text-gray-500 flex items-center gap-1">
                  <span>Recent post</span>
                  <span>·</span>
                  <Globe2 className="w-2.5 h-2.5" />
                </p>
              </div>
              <span
                className="text-[9px] font-bold text-white rounded-sm px-1 py-0.5 shrink-0"
                style={{ background: LI_BLUE }}
                title="From LinkedIn"
              >
                in
              </span>
            </div>

            {/* Post body */}
            <div className="px-3 pb-2">
              <p className="text-[12px] text-gray-800 leading-relaxed line-clamp-4 whitespace-pre-line">
                {lead.signal_post_excerpt}
              </p>
            </div>

            {/* Faux engagement footer */}
            <div className="border-t border-gray-100 px-3 py-1.5 flex items-center justify-between text-gray-500">
              <div className="flex items-center gap-3 text-[10px]">
                <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> Like</span>
                <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> Comment</span>
                <span className="flex items-center gap-1"><Repeat2 className="w-3 h-3" /> Repost</span>
                <span className="flex items-center gap-1"><Send className="w-3 h-3" /> Send</span>
              </div>
              <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
            </div>
          </a>
        )}

        {/* AI Insight block */}
        {lead.reasons && lead.reasons.length > 0 && (
          <div
            className="relative rounded-lg p-[1px] animate-fade-in overflow-hidden"
            style={{
              background:
                "conic-gradient(from var(--ai-angle, 0deg), #BC82F3, #F5B9EA, #8D99FF, #AA6EEE, #FF6778, #FFBA71, #C686FF, #BC82F3)",
              animation: "rotate-border 8s linear infinite",
            }}
          >
            <div className="rounded-[7px] bg-gradient-to-br from-purple-50/70 via-white to-pink-50/40 p-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                  <Sparkles className="w-3 h-3 text-[#AA6EEE] animate-pulse" />
                  <span className="bg-gradient-to-r from-[#AA6EEE] via-[#FF6778] to-[#FFBA71] bg-clip-text text-transparent">
                    AI Insight
                  </span>
                </div>
                <span className="text-[9px] uppercase tracking-wider text-foreground/40 font-medium">Why this lead</span>
              </div>
              <ul className="space-y-1">
                {lead.reasons.slice(0, 3).map((r, i) => (
                  <li key={i} className="text-[11px] text-foreground/75 leading-snug flex gap-1.5">
                    <span
                      className="mt-1 w-1 h-1 rounded-full shrink-0"
                      style={{
                        background:
                          "linear-gradient(135deg, #AA6EEE, #FF6778)",
                      }}
                    />
                    <span className="flex-1">{r}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-1.5 text-[9px] text-foreground/35 italic">Generated by Intentsly AI</p>
            </div>
          </div>
        )}

        {/* Actions */}
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
    </TooltipProvider>
  );
}

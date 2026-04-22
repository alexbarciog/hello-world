import { ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { StageData } from "./FunnelTemplates";

interface Props {
  stage: StageData | null;
  diagnostics: Record<string, unknown> | null | undefined;
  rejectedSample?: unknown[];
  onClose: () => void;
}

function getSamples(
  stage: StageData,
  diagnostics: Record<string, unknown> | null | undefined,
  rejectedSample?: unknown[],
): unknown[] {
  if (!diagnostics && !rejectedSample) return [];
  // Prefer specific sampleKey
  if (stage.sampleKey && diagnostics) {
    const v = diagnostics[stage.sampleKey];
    if (Array.isArray(v) && v.length > 0) return v;
  }
  // Fallback search by label tone
  if (stage.tone === "reject" && diagnostics) {
    for (const k of Object.keys(diagnostics)) {
      if (k.startsWith("sample_") && (k.includes("reject") || k.includes("rejection"))) {
        const v = diagnostics[k];
        if (Array.isArray(v) && v.length > 0) return v;
      }
    }
    if (Array.isArray(rejectedSample) && rejectedSample.length > 0) return rejectedSample;
  }
  if (stage.tone === "success" && diagnostics) {
    const v = diagnostics["sample_inserted"];
    if (Array.isArray(v) && v.length > 0) return v;
  }
  return [];
}

function SampleItem({ item }: { item: unknown }) {
  if (typeof item === "string") {
    return <div className="text-xs text-muted-foreground break-all">{item}</div>;
  }
  if (!item || typeof item !== "object") {
    return <div className="text-xs">{String(item)}</div>;
  }
  const obj = item as Record<string, unknown>;
  const name =
    (obj.name as string) ||
    (obj.full_name as string) ||
    (obj.headline as string) ||
    (obj.title as string) ||
    (obj.author as string) ||
    "—";
  const role = (obj.role as string) || (obj.title as string) || (obj.headline as string);
  const company = (obj.company as string) || (obj.company_name as string);
  const companyUrl = (obj.company_url as string) || (obj.company_linkedin_url as string);
  const industry = (obj.industry as string) || (obj.matched_industry as string);
  const matchedKeyword = obj.matched_keyword as string | undefined;
  const verdict = (obj.icp_verdict as string) || (obj.verdict as string);
  const intentScore = (obj.intent_score as number | undefined) ?? (obj.intentScore as number | undefined);
  const isBuyer = obj.is_buyer as boolean | undefined;
  const reason =
    (obj.reason as string) ||
    (obj.rejection_reason as string) ||
    (obj.ai_reason as string) ||
    (obj.icp_reason as string);
  const profileUrl =
    (obj.linkedin_url as string) ||
    (obj.url as string) ||
    (obj.profile_url as string);
  const postUrl = obj.postUrl as string | undefined;
  const postSample = obj.postSample as string | undefined;

  const knownKeys = new Set([
    "name", "full_name", "headline", "title", "author", "role",
    "company", "company_name", "company_url", "company_linkedin_url",
    "industry", "matched_industry", "matched_keyword",
    "icp_verdict", "verdict", "intentScore", "intent_score", "is_buyer",
    "reason", "rejection_reason", "ai_reason", "icp_reason",
    "linkedin_url", "url", "profile_url",
    "postUrl", "postSample",
  ]);
  const hasAnyKnown =
    role || company || companyUrl || industry || matchedKeyword ||
    verdict || intentScore !== undefined || isBuyer !== undefined ||
    reason || profileUrl || postUrl || postSample;

  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <div className="text-sm font-medium text-foreground truncate">{name}</div>
        {profileUrl && (
          <a
            href={profileUrl}
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground hover:text-primary shrink-0"
            title="Open LinkedIn profile"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
      {role && (
        <div className="text-xs text-muted-foreground leading-snug">{role}</div>
      )}
      {(company || companyUrl) && (
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-muted-foreground">Company:</span>
          {companyUrl ? (
            <a
              href={companyUrl}
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1 truncate"
            >
              {company || companyUrl}
              <ExternalLink className="w-3 h-3 shrink-0" />
            </a>
          ) : (
            <span className="text-foreground truncate">{company}</span>
          )}
        </div>
      )}
      {industry && (
        <div className="text-xs">
          <span className="text-muted-foreground">Industry:</span>{" "}
          <span className="text-foreground">{industry}</span>
        </div>
      )}
      {matchedKeyword && (
        <div className="text-xs">
          <span className="text-muted-foreground">Matched keyword:</span>{" "}
          <span className="text-foreground font-medium">"{matchedKeyword}"</span>
        </div>
      )}
      {verdict && (
        <div className="text-xs">
          <span className="text-muted-foreground">ICP verdict:</span>{" "}
          <span className="text-foreground font-medium">{verdict}</span>
        </div>
      )}
      {intentScore !== undefined && (
        <div className="text-xs">
          <span className="text-muted-foreground">Intent score:</span>{" "}
          <span className="text-foreground font-medium tabular-nums">{intentScore}</span>
        </div>
      )}
      {reason && (
        <div className="text-xs italic text-foreground/70 mt-1 leading-snug">
          "{reason}"
        </div>
      )}
      {!hasAnyKnown && (
        <pre className="text-[10px] text-muted-foreground mt-1 overflow-x-auto whitespace-pre-wrap break-all">
          {JSON.stringify(obj, null, 2).slice(0, 500)}
        </pre>
      )}
    </div>
  );
}

export function NodeDetailPanel({ stage, diagnostics, rejectedSample, onClose }: Props) {
  if (!stage) return null;
  const samples = getSamples(stage, diagnostics, rejectedSample);

  return (
    <div className="absolute top-3 right-3 bottom-3 w-[340px] rounded-xl border border-border bg-background shadow-lg flex flex-col z-10">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {stage.label}
          </div>
          <div className="text-lg font-semibold tabular-nums">{stage.count}</div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1 p-3">
        {samples.length === 0 ? (
          <div className="text-sm text-muted-foreground italic px-2 py-8 text-center">
            No sample data captured for this stage.
          </div>
        ) : (
          <div className="space-y-2">
            {samples.map((s, i) => (
              <SampleItem key={i} item={s} />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

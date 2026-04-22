import type { Node, Edge } from "@xyflow/react";

export interface StageData {
  label: string;
  count: number | string;
  tone?: "neutral" | "pass" | "reject" | "skip" | "success";
  sampleKey?: string; // key in diagnostics for sample_* array
  sublabel?: string;
  [key: string]: unknown; // index signature for React Flow compatibility
}

export type StageNode = Node<StageData>;

interface BuildResult {
  nodes: StageNode[];
  edges: Edge[];
}

const X_GAP = 220;
const Y_MAIN = 0;
const Y_REJECT = 130;

function makeStage(
  id: string,
  x: number,
  y: number,
  data: StageData,
): StageNode {
  return {
    id,
    type: "stage",
    position: { x, y },
    data,
  };
}

function passEdge(source: string, target: string): Edge {
  return {
    id: `${source}->${target}`,
    source,
    target,
    type: "smoothstep",
    style: { stroke: "hsl(142 76% 36%)", strokeWidth: 2 },
    animated: false,
  };
}

function rejectEdge(source: string, target: string, label?: string): Edge {
  return {
    id: `${source}->${target}`,
    source,
    target,
    type: "smoothstep",
    label,
    labelStyle: { fontSize: 10, fill: "hsl(0 70% 45%)" },
    style: { stroke: "hsl(0 70% 55%)", strokeWidth: 1.5, strokeDasharray: "4 4" },
  };
}

function skipEdge(source: string, target: string, label?: string): Edge {
  return {
    id: `${source}->${target}`,
    source,
    target,
    type: "smoothstep",
    label,
    labelStyle: { fontSize: 10, fill: "hsl(220 9% 46%)" },
    style: { stroke: "hsl(220 9% 60%)", strokeWidth: 1.5, strokeDasharray: "2 4" },
  };
}

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * keyword_posts / hashtag_engagement / post_engagers / competitor
 * all share enough counters to use a unified LinkedIn-style template.
 *
 * NEW ORDER (lead-first): Fetched → Dedup → [legacy phrase match if present]
 *   → Company/ICP → Competitor/Seller → AI buyer intent → Inserted
 */
function buildLinkedInFunnel(d: Record<string, unknown>): BuildResult {
  const nodes: StageNode[] = [];
  const edges: Edge[] = [];

  const fetched =
    num(d.total_posts_fetched) ||
    num(d.profile_posts_scanned) ||
    num(d.total_engagers_raw) ||
    num(d.followers_fetched) ||
    num(d.posts_fetched) ||
    0;

  const skippedDedup = num(d.skipped_already_processed);
  const dupRemoved = num(d.duplicates_removed);
  const afterDedup =
    num(d.posts_after_dedup) ||
    Math.max(0, fetched - skippedDedup - dupRemoved);

  // Legacy "phrase match" stage — only render if older runs still have rejections here.
  const rejectedNoMatch = num(d.rejected_no_phrase_match);
  const showLegacyPrefilter = rejectedNoMatch > 0;
  const passedPrefilter =
    num(d.passed_prefilter) ||
    Math.max(0, afterDedup - rejectedNoMatch);

  // Company / ICP stage
  const rejectedOwnCompany = num(d.rejected_own_company);
  const rejectedWrongCountry = num(d.rejected_wrong_country) + num(d.rejected_wrong_country_post_profile);
  const rejectedWrongIndustry = num(d.rejected_wrong_industry);
  const companyIcpMismatch = num(d.company_icp_mismatch);
  const icpRejected =
    rejectedOwnCompany + rejectedWrongCountry + rejectedWrongIndustry + companyIcpMismatch;

  // Competitor / seller stage (post-ICP)
  const rejectedCompetitorSeller = num(d.rejected_competitor_seller);
  const rejectedCompetitor = num(d.rejected_competitor);
  const rejectedSeller = num(d.rejected_seller);
  const competitorRejected = rejectedCompetitorSeller + rejectedCompetitor + rejectedSeller;

  // AI buying-intent stage
  const sentToAi = num(d.sent_to_ai);
  const passedAi = num(d.passed_ai);
  const rejectedAiNotBuyer = num(d.rejected_ai_not_buyer);
  const rejectedAiLowScore = num(d.rejected_ai_low_score);
  const aiRejectedTotal = rejectedAiNotBuyer + rejectedAiLowScore;

  const inserted = num(d.inserted) || num(d.leads_inserted) || 0;

  let x = 0;
  let prev = "fetched";

  // 1. Fetched
  nodes.push(makeStage("fetched", x, Y_MAIN, {
    label: "Posts fetched",
    count: fetched,
    tone: "neutral",
  }));

  // 2. Dedup
  x += X_GAP;
  nodes.push(makeStage("dedup", x, Y_MAIN, {
    label: "After dedup",
    count: afterDedup,
    tone: "neutral",
    sublabel: skippedDedup > 0 ? `−${skippedDedup} already seen` : undefined,
  }));
  edges.push(passEdge(prev, "dedup"));
  if (skippedDedup > 0 || dupRemoved > 0) {
    nodes.push(makeStage("dedup_skip", x, Y_REJECT, {
      label: "Skipped",
      count: skippedDedup + dupRemoved,
      tone: "skip",
      sampleKey: "sample_skipped",
    }));
    edges.push(skipEdge(prev, "dedup_skip", "already processed"));
  }
  prev = "dedup";

  // 3. (Legacy) Match keywords — only for old runs that still have phrase-match rejections.
  if (showLegacyPrefilter) {
    x += X_GAP;
    nodes.push(makeStage("prefilter", x, Y_MAIN, {
      label: "Match keywords",
      count: passedPrefilter,
      tone: "pass",
      sampleKey: "sample_prefilter_passed",
      sublabel: "legacy",
    }));
    edges.push(passEdge(prev, "prefilter"));
    nodes.push(makeStage("prefilter_reject", x, Y_REJECT, {
      label: "No phrase match",
      count: rejectedNoMatch,
      tone: "reject",
      sampleKey: "sample_prefilter_rejections",
    }));
    edges.push(rejectEdge(prev, "prefilter_reject", "missing"));
    prev = "prefilter";
  }

  // 4. Company / ICP gate (now ALWAYS before AI, in both precision modes)
  const passedCompanyIcp =
    num(d.passed_company_icp) ||
    Math.max(passedAi + competitorRejected + aiRejectedTotal, inserted);
  x += X_GAP;
  nodes.push(makeStage("icp", x, Y_MAIN, {
    label: "Company / ICP",
    count: passedCompanyIcp,
    tone: "pass",
    sampleKey: "sample_icp_passed",
  }));
  edges.push(passEdge(prev, "icp"));
  if (icpRejected > 0) {
    nodes.push(makeStage("icp_reject", x, Y_REJECT, {
      label: "ICP mismatch",
      count: icpRejected,
      tone: "reject",
      sampleKey: "sample_icp_rejections",
      sublabel:
        rejectedOwnCompany > 0
          ? `${rejectedOwnCompany} own co.`
          : rejectedWrongCountry > 0
            ? `${rejectedWrongCountry} wrong country`
            : companyIcpMismatch > 0
              ? `${companyIcpMismatch} ICP mismatch`
              : undefined,
    }));
    edges.push(rejectEdge(prev, "icp_reject"));
  }
  prev = "icp";

  // 5. Competitor / Seller (post-ICP)
  if (competitorRejected > 0 || passedCompanyIcp > 0) {
    x += X_GAP;
    const passedCompetitor = Math.max(passedCompanyIcp - competitorRejected, passedAi, inserted);
    nodes.push(makeStage("competitor", x, Y_MAIN, {
      label: "Not a competitor",
      count: passedCompetitor,
      tone: "pass",
    }));
    edges.push(passEdge(prev, "competitor"));
    if (competitorRejected > 0) {
      nodes.push(makeStage("competitor_reject", x, Y_REJECT, {
        label: "Competitor / seller",
        count: competitorRejected,
        tone: "reject",
        sampleKey: "sample_competitor_rejections",
      }));
      edges.push(rejectEdge(prev, "competitor_reject", "sells similar"));
    }
    prev = "competitor";
  }

  // 6. AI buyer intent (now LAST gate before insert)
  x += X_GAP;
  nodes.push(makeStage("ai", x, Y_MAIN, {
    label: "AI buyer intent",
    count: passedAi,
    tone: "pass",
    sampleKey: "sample_ai_passed",
    sublabel: sentToAi > 0 ? `${sentToAi} sent to AI` : undefined,
  }));
  edges.push(passEdge(prev, "ai"));
  if (aiRejectedTotal > 0) {
    nodes.push(makeStage("ai_reject", x, Y_REJECT, {
      label: "Rejected by AI",
      count: aiRejectedTotal,
      tone: "reject",
      sampleKey: "sample_ai_rejections",
      sublabel:
        rejectedAiNotBuyer > 0
          ? `${rejectedAiNotBuyer} not buyer`
          : rejectedAiLowScore > 0
            ? `${rejectedAiLowScore} low score`
            : undefined,
    }));
    edges.push(rejectEdge(prev, "ai_reject", "not buyer"));
  }
  prev = "ai";

  // 7. Inserted
  x += X_GAP;
  nodes.push(makeStage("inserted", x, Y_MAIN, {
    label: "✓ Lead inserted",
    count: inserted,
    tone: "success",
    sampleKey: "sample_inserted",
  }));
  edges.push(passEdge(prev, "inserted"));

  return { nodes, edges };
}

/**
 * Reddit / X templates use a smaller funnel.
 */
function buildSocialMentionFunnel(d: Record<string, unknown>): BuildResult {
  const nodes: StageNode[] = [];
  const edges: Edge[] = [];

  const fetched =
    num(d.total_posts_fetched) || num(d.posts_fetched) || num(d.mentions_fetched);
  const dedupSkip = num(d.skipped_already_processed) + num(d.duplicates_removed);
  const afterDedup = num(d.posts_after_dedup) || Math.max(0, fetched - dedupSkip);
  const relevant = num(d.relevant_count) || num(d.passed_relevance) || afterDedup;
  const inserted = num(d.inserted) || num(d.mentions_inserted) || 0;

  let x = 0;
  nodes.push(makeStage("fetched", x, Y_MAIN, {
    label: "Posts fetched",
    count: fetched,
    tone: "neutral",
  }));

  x += X_GAP;
  nodes.push(makeStage("dedup", x, Y_MAIN, {
    label: "After dedup",
    count: afterDedup,
    tone: "neutral",
  }));
  edges.push(passEdge("fetched", "dedup"));
  if (dedupSkip > 0) {
    nodes.push(makeStage("dedup_skip", x, Y_REJECT, {
      label: "Already seen",
      count: dedupSkip,
      tone: "skip",
    }));
    edges.push(skipEdge("fetched", "dedup_skip"));
  }

  x += X_GAP;
  nodes.push(makeStage("relevance", x, Y_MAIN, {
    label: "Relevant",
    count: relevant,
    tone: "pass",
    sampleKey: "sample_relevant",
  }));
  edges.push(passEdge("dedup", "relevance"));

  x += X_GAP;
  nodes.push(makeStage("inserted", x, Y_MAIN, {
    label: "✓ Mention saved",
    count: inserted,
    tone: "success",
    sampleKey: "sample_inserted",
  }));
  edges.push(passEdge("relevance", "inserted"));

  return { nodes, edges };
}

export function buildFunnel(
  signalType: string,
  diagnostics: Record<string, unknown> | null | undefined,
): BuildResult {
  const d = diagnostics ?? {};
  if (signalType === "reddit" || signalType === "x") {
    return buildSocialMentionFunnel(d);
  }
  // keyword_posts, hashtag_engagement, post_engagers, competitor, default
  return buildLinkedInFunnel(d);
}

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

  const rejectedNoMatch = num(d.rejected_no_phrase_match);
  const passedPrefilter =
    num(d.passed_prefilter) || Math.max(0, afterDedup - rejectedNoMatch);

  const sentToAi = num(d.sent_to_ai) || passedPrefilter;
  const passedAi = num(d.passed_ai);
  const rejectedAiNotBuyer = num(d.rejected_ai_not_buyer);
  const rejectedAiLowScore = num(d.rejected_ai_low_score);
  const rejectedCompetitor = num(d.rejected_competitor);
  const rejectedSeller = num(d.rejected_seller);
  const aiRejectedTotal =
    rejectedAiNotBuyer + rejectedAiLowScore + rejectedCompetitor + rejectedSeller;

  const rejectedOwnCompany = num(d.rejected_own_company);
  const rejectedWrongCountry = num(d.rejected_wrong_country);
  const rejectedWrongIndustry = num(d.rejected_wrong_industry);
  const icpRejected =
    rejectedOwnCompany + rejectedWrongCountry + rejectedWrongIndustry +
    num(d.company_icp_mismatch);

  const inserted = num(d.inserted) || num(d.leads_inserted) || 0;

  let x = 0;

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
  edges.push(passEdge("fetched", "dedup"));
  if (skippedDedup > 0 || dupRemoved > 0) {
    nodes.push(makeStage("dedup_skip", x, Y_REJECT, {
      label: "Skipped",
      count: skippedDedup + dupRemoved,
      tone: "skip",
      sampleKey: "sample_skipped",
    }));
    edges.push(skipEdge("fetched", "dedup_skip", "already processed"));
  }

  // 3. Phrase / pre-filter match
  x += X_GAP;
  nodes.push(makeStage("prefilter", x, Y_MAIN, {
    label: "Match keywords",
    count: passedPrefilter,
    tone: "pass",
    sampleKey: "sample_prefilter_passed",
  }));
  edges.push(passEdge("dedup", "prefilter"));
  if (rejectedNoMatch > 0) {
    nodes.push(makeStage("prefilter_reject", x, Y_REJECT, {
      label: "No phrase match",
      count: rejectedNoMatch,
      tone: "reject",
      sampleKey: "sample_prefilter_rejections",
    }));
    edges.push(rejectEdge("dedup", "prefilter_reject", "missing"));
  }

  // 4. AI buying intent
  x += X_GAP;
  nodes.push(makeStage("ai", x, Y_MAIN, {
    label: "AI buyer intent",
    count: passedAi,
    tone: "pass",
    sampleKey: "sample_ai_passed",
    sublabel: sentToAi > 0 ? `${sentToAi} sent to AI` : undefined,
  }));
  edges.push(passEdge("prefilter", "ai"));
  if (aiRejectedTotal > 0) {
    nodes.push(makeStage("ai_reject", x, Y_REJECT, {
      label: "Rejected by AI",
      count: aiRejectedTotal,
      tone: "reject",
      sampleKey: "sample_ai_rejections",
      sublabel:
        rejectedCompetitor > 0
          ? `${rejectedCompetitor} competitor`
          : rejectedAiNotBuyer > 0
            ? `${rejectedAiNotBuyer} not buyer`
            : undefined,
    }));
    edges.push(rejectEdge("prefilter", "ai_reject", "not buyer"));
  }

  // 5. ICP / company gates
  if (icpRejected > 0 || inserted > 0 || passedAi > 0) {
    x += X_GAP;
    const passedIcp = Math.max(passedAi - icpRejected, inserted);
    nodes.push(makeStage("icp", x, Y_MAIN, {
      label: "Company / ICP",
      count: passedIcp,
      tone: "pass",
      sampleKey: "sample_icp_passed",
    }));
    edges.push(passEdge("ai", "icp"));
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
              : undefined,
      }));
      edges.push(rejectEdge("ai", "icp_reject"));
    }

    // 6. Inserted
    x += X_GAP;
    nodes.push(makeStage("inserted", x, Y_MAIN, {
      label: "✓ Lead inserted",
      count: inserted,
      tone: "success",
      sampleKey: "sample_inserted",
    }));
    edges.push(passEdge("icp", "inserted"));
  }

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

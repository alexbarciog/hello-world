

# Admin Run Diagnostics Diagrams

Add a global **"Agent Runs"** view in the admin panel that lists every recent run across all agents/orgs, with a drill-in **flow-diagram debugger** for each run mirroring the funnel in the user's screenshot.

## What you'll see

**Level 1 — Global runs list** (new admin tab "Runs"):
A sortable, filterable table of every `signal_agent_runs` row across the platform.
Columns: Started · Org · Agent name · Type · Status · Tasks (done/total) · Leads · Duration · Error.
Filters: status (running/done/failed), agent type (keyword_posts / hashtag_engagement / post_engagers / competitor / reddit / x), date range, org, search by agent name.

**Level 2 — Single run diagram** (drawer opens from row click):
Top header: agent name, run id, started/completed, totals.
Below: one funnel diagram per task in the run, laid out left-to-right exactly like the reference image:

```text
RUN
 └─ Keyword #1 ──┬─ Post 1 ─ keyword check ─┬─ valid ─ buying intent ─┬─ valid ─ competitor? ─┬─ no ─ company ICP ─┬─ valid ─ ✓ Lead
                 │                          └─ missing                └─ missing             └─ yes              └─ missing
                 ├─ Post 2 …
                 └─ Post 3 …
 └─ Keyword #2 …
```

Each node shows the **count** that flowed through it (e.g. "Posts fetched: 119 → after dedup: 13 → phrase match: 2 → AI buyer: 1 → not competitor: 1 → ICP match: 1 → inserted: 1"). Rejection branches expand to reveal sample rejected profiles (already stored in `rejected_profiles_sample`) and the rejection reason. Color-coded edges (green = passed, red = rejected, gray = skipped/dedup).

**Level 3 — Per-node detail** (click any funnel node):
Side panel listing the actual sample items at that stage, taken from the `sample_*` arrays in `diagnostics` (e.g. `sample_ai_rejections`, `sample_prefilter_rejections`, `sample_inserted`). Each item shows headline, role, company, the AI's reason for the verdict, and a link to the LinkedIn URL.

## What we already have (no new logging needed for v1)

`signal_agent_tasks.diagnostics` JSONB already tracks the full funnel per task. Confirmed counters available today:
`total_posts_fetched`, `skipped_already_processed`, `duplicates_removed`, `posts_after_dedup`, `rejected_no_phrase_match`, `passed_prefilter`, `sent_to_ai`, `passed_ai`, `rejected_ai_not_buyer`, `rejected_ai_low_score`, `rejected_competitor`, `rejected_seller`, `rejected_own_company`, `rejected_wrong_country`, `rejected_wrong_industry`, `company_industry_matched`, `company_icp_mismatch`, `inserted`, plus `sample_*` arrays and `rejected_profiles_sample`.

Each signal type (keyword_posts, hashtag_engagement, post_engagers, competitor, reddit, x) gets a **type-specific diagram template** that maps its actual stages — e.g. `post_engagers` shows `profile_urls_scanned → profile_posts_scanned → reactions_fetched → engagers_raw → ICP filters → inserted`.

## v1.1 — Improve logging where the funnel is currently blind

Audit each signal edge function and add the few missing counters that would close gaps:
- **post_engagers**: `slug_resolution_failed`, `slug_resolution_succeeded` (currently we can't tell why 0 posts returned).
- **keyword_posts**: per-keyword breakdown (today the diagnostics are aggregated across the batch — we'll store a `per_keyword: [{keyword, fetched, dedup, matched, ai_passed, inserted}]` array so the diagram can render one branch per keyword as in the reference).
- **All types**: ensure every rejection bucket also pushes 1 item into a matching `sample_*` array (capped at 5) so node-detail panel never shows an empty list when count > 0.

## Technical breakdown

**Routing & access**
- New tab `"runs"` registered in `AdminDashboard.tsx` tabs array, gated by existing `useAdminCheck()`.

**New components (under `src/components/admin/runs/`)**
- `RunsTable.tsx` — fetches `signal_agent_runs` joined with `signal_agents(name, agent_type, organization_id)` and `organizations(name)`; paginated 50/page; React Query.
- `RunDiagramDrawer.tsx` — Sheet/Drawer triggered by row click; loads tasks via `signal_agent_tasks` filtered by `run_id`.
- `TaskFunnel.tsx` — renders the per-task flow. Uses **React Flow** (`@xyflow/react`, already common in the stack) for the node/edge graph with custom node components (`StageNode`, `RejectionBranch`).
- `FunnelTemplates.ts` — pure mapping module: given `(signal_type, diagnostics)` returns `{nodes, edges}`. One template function per signal type.
- `NodeDetailPanel.tsx` — right-side panel showing `sample_*` items for the selected node.

**Data flow**
- All reads, no writes. Admin RLS on `signal_agent_runs` / `signal_agent_tasks` already permits read (verify and add admin SELECT policy via `has_role(auth.uid(),'admin')` if missing).
- Heavy `diagnostics` payloads are only fetched when a run drawer opens (lazy by run_id).

**Edge function changes (v1.1, separate follow-up commit)**
- `signal-keyword-posts/index.ts`: emit `per_keyword` array; add slug/profile resolution counters.
- `signal-post-engagers/index.ts`: add `slug_resolution_*` counters and a sample array of slugs that returned 0 posts.
- `signal-hashtag-engagement/index.ts`, `signal-competitor/index.ts`, `poll-reddit-signals/index.ts`, `poll-x-signals/index.ts`: confirm parity of counter set; backfill any missing `sample_*` arrays.

**Dependencies**
- Add `@xyflow/react` if not already installed (lightweight, MIT, ~70KB gz).

## Out of scope (not in this plan)

- Replaying a run with different settings.
- Editing diagnostics or re-classifying leads from the diagram.
- Real-time streaming of an in-progress run (v1 polls every 5s while drawer is open on a `running` run; full SSE comes later).


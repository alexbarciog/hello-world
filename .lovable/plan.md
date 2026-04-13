

## Plan: Dashboard Real Data Integration

### Summary
Replace all static/mock data in the dashboard with real Supabase queries, update the Lead Velocity chart to show two real series, replace the two placeholder analytics panels, and fix bugs (duplicate LatestReplies, LatestReplies missing `snow-card` styling).

---

### 1. Lead Velocity Chart — Two Real Series

**Current**: Single `leads` count from `contacts.imported_at`, plus a fake "last year" sine wave.

**Change**: Pass two data series from Dashboard to PerformanceChart:
- **Leads Found** — count of `contacts` imported per day (existing query, already works)
- **Contacted** — count of `campaign_connection_requests` sent per day (new query on `sent_at`)

Update `PerformanceChartProps` to `Array<{ date: string; leadsFound: number; contacted: number }>`.

Update legend labels to "Leads Found" (solid black area) and "Contacted" (dashed gray line). Remove the fake `lastYear` calculation.

**Files**: `Dashboard.tsx` (add query for `campaign_connection_requests.sent_at`), `PerformanceChart.tsx` (update props/legend/dataKeys).

---

### 2. Replace Traffic by Device → **Leads by Source**

Replace the hardcoded bar chart with a real breakdown of where leads came from:
- Query `contacts` grouped by `source_campaign_id IS NOT NULL` vs signal agent sourced leads
- Actually: simpler — query `campaigns` table to count contacts per campaign (top 5), show as a bar chart with campaign names.

**Rename** component to `LeadsBySource`. Bar chart shows top campaigns by contact count. Data comes from a new query joining `contacts.source_campaign_id` to `campaigns.company_name`.

**Files**: Rename `TrafficByDevice.tsx` → `LeadsBySource.tsx`, update `Dashboard.tsx`.

---

### 3. Replace Traffic by Location → **Leads by Tier**

Replace the hardcoded donut chart with a real breakdown of lead quality tiers:
- Query `contacts` grouped by `relevance_tier` (hot / warm / cold)
- Show as the same donut chart style with real percentages.

Colors: hot = emerald, warm = amber, cold = gray.

**Files**: Rename `TrafficByLocation.tsx` → `LeadsByTier.tsx`, update `Dashboard.tsx`.

---

### 4. Bug Fixes

| Issue | Fix |
|---|---|
| **Duplicate LatestReplies** — rendered twice (lines 267 and 271) | Remove the second grid block (lines 270-272) |
| **LatestReplies uses `snow-card`** class instead of `bg-snow-bg-2 rounded-[20px]` | Update to match other panels' styling |
| **MetricCard "Leads Engaged"** shows `invitations_sent` from campaigns table (may be stale) | Query `campaign_connection_requests` count for accurate "Leads Engaged" |
| **MetricCard "Conversations"** shows `messages_sent` from campaigns (stale counter) | Query `campaign_connection_requests` where `last_incoming_message_at IS NOT NULL` for real conversation count |

---

### Technical Details

**New queries in Dashboard.tsx**:
1. `campaign_connection_requests` with `sent_at` for chart contacted series
2. `campaign_connection_requests` count for Leads Engaged metric
3. `campaign_connection_requests` where `last_incoming_message_at IS NOT NULL` for Conversations metric
4. `contacts` grouped by `relevance_tier` for Leads by Tier donut
5. `contacts` with `source_campaign_id` joined to campaign names for Leads by Source bar chart

**Files changed**:
- `src/pages/Dashboard.tsx` — new queries, remove duplicate LatestReplies, wire new components
- `src/components/dashboard/PerformanceChart.tsx` — new props with two real data series
- `src/components/dashboard/TrafficByDevice.tsx` → rewrite as `LeadsBySource.tsx`
- `src/components/dashboard/TrafficByLocation.tsx` → rewrite as `LeadsByTier.tsx`
- `src/components/dashboard/LatestReplies.tsx` — fix card styling
- `src/components/dashboard/MetricCard.tsx` — no changes needed (props-driven)


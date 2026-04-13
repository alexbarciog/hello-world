

# Dashboard UI/UX Improvement Plan

## Current State

The dashboard is a single 731-line component with:
- A welcome header with status pills and CTA button
- 3 metric cards (Hot Opportunities, Leads Engaged, Conversations)
- A large area chart ("Performance Velocity") + Quick Start Guide side panel
- Hot Leads list + Latest Replies list
- A collapsible "Get Started" checklist at the bottom

**Issues identified:**

1. **Redundancy**: "Quick Start Guide" (right column) and "Get Started" (bottom accordion) show nearly identical onboarding steps -- confusing and wasteful of space
2. **Fake data**: Hardcoded trend percentages ("12.4%", "8.1%", "24%") and "AI Prediction: Lead quality up 15%" are static/fake -- erodes trust
3. **Empty states are weak**: Just an icon + one line of text; no clear CTA to guide the user
4. **Chart dominates**: Takes 2/3 width but shows minimal value when data is sparse
5. **Information hierarchy**: All cards compete visually -- nothing draws focus to the most important next action
6. **No subscription/billing status**: User has no visibility into their plan state (free trial, card on file, active, canceled)
7. **Header is cluttered**: Status pills + CTA all in one row, wraps awkwardly on medium screens
8. **Component is monolithic**: 731 lines in one file, hard to maintain

## Proposed Changes

### 1. Remove duplicate onboarding sections
- **Remove** the bottom "Get Started" accordion entirely
- **Keep** the Quick Start Guide in the right column but make it actionable (each incomplete step becomes a clickable link to the relevant page)

### 2. Remove fake/static data
- Remove hardcoded trend percentages from metric cards (show trend only when real historical data exists to compare)
- Remove the "AI Prediction: Lead quality up 15%" floating badge from the chart
- Show "No data yet" or a subtle empty state when metrics are zero instead of "0" with fake "+12.4%"

### 3. Improve empty states
- **Hot Leads empty**: Show a card with illustration + "Your AI agents will surface hot leads here" + "Go to Signals" CTA button
- **Replies empty**: "Replies from prospects will appear here" + "Set up a campaign" CTA button
- **Chart empty**: Show a subtle placeholder message instead of a flat line at zero

### 4. Add subscription status banner
- Show a contextual banner below the header:
  - **No card**: "Add your payment method to activate AI agents" + Add Card button
  - **Card on file, no subscription**: "Free until your first meeting -- card on file" (subtle green badge)
  - **Canceled**: "Your subscription has been canceled" + Resubscribe CTA (warning style)
  - **Active**: No banner (clean dashboard)

### 5. Rebalance the layout
- Make the chart and Quick Start equal columns (1:1) on large screens instead of 2:1
- Move the Quick Start above the chart when all steps are incomplete (prioritize onboarding)
- Once all steps are complete, collapse Quick Start into a small "Setup complete" badge

### 6. Clean up the header
- Move status pills (Active Signals, LinkedIn Connected) into a subtle status bar below the welcome text
- Keep only the "Start a campaign" CTA button aligned right in the header

### 7. Extract sub-components
Split Dashboard.tsx into:
- `src/components/dashboard/MetricCard.tsx`
- `src/components/dashboard/PerformanceChart.tsx`
- `src/components/dashboard/QuickStartPanel.tsx`
- `src/components/dashboard/HotLeadsList.tsx`
- `src/components/dashboard/LatestReplies.tsx`
- `src/components/dashboard/SubscriptionBanner.tsx`

The main `Dashboard.tsx` becomes a clean layout orchestrator (~150 lines).

## Files Changed

| File | Change |
|------|--------|
| `src/pages/Dashboard.tsx` | Refactor into layout shell, remove duplicate Get Started, remove fake data, add subscription banner |
| `src/components/dashboard/MetricCard.tsx` | **New** -- extracted metric card component |
| `src/components/dashboard/PerformanceChart.tsx` | **New** -- extracted chart with improved empty state |
| `src/components/dashboard/QuickStartPanel.tsx` | **New** -- actionable quick start with navigation links |
| `src/components/dashboard/HotLeadsList.tsx` | **New** -- extracted with improved empty state |
| `src/components/dashboard/LatestReplies.tsx` | **New** -- extracted with improved empty state |
| `src/components/dashboard/SubscriptionBanner.tsx` | **New** -- contextual billing status banner using `useSubscription` |

## Summary of UX Improvements

- Remove confusion from duplicate onboarding widgets
- Remove fake metrics that erode user trust
- Give users clear next-action guidance in every empty state
- Surface billing/subscription status directly on the dashboard
- Cleaner visual hierarchy with less clutter
- Better maintainability through component extraction


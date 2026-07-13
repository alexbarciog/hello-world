## Plan

### Goal
Make “Get leads from LinkedIn post” reliably import many real engagers from large LinkedIn posts, with valid profile links and far better relevance filtering.

### Problems to fix
- The function only requests one page of reactions/comments with `limit=100`, so posts with 500+ engagers can return a tiny subset depending on API pagination.
- Profile links are built from `provider_id`/internal IDs when no public LinkedIn slug exists, causing invalid `/in/...` URLs even though names are correct.
- Filtering/scoring currently relies on sparse reaction/comment payload fields (`headline`, `company`) that may be missing or partial, so irrelevant people and competitors slip through.
- The UI toast only says how many were imported, not how many were fetched/skipped, making failures look mysterious.

### Implementation
1. **Add robust Unipile pagination**
   - Fetch reactions and comments in pages using returned cursors (`cursor`, `next_cursor`, `paging.cursor`, etc.) until exhausted or a safe cap is reached.
   - Increase the extraction cap enough for large posts, e.g. up to 1,000 raw engagers per run.
   - Log and return fetched/page counts for diagnostics.

2. **Normalize engager identity safely**
   - Split “profile ID” from “public LinkedIn slug”.
   - Only generate `https://www.linkedin.com/in/{slug}` from real public identifiers, never from internal `provider_id`/URN/account IDs.
   - Store `linkedin_profile_id` separately for dedupe and future profile lookups.
   - If a valid profile URL cannot be produced, still use the provider/profile ID for enrichment, but don’t create fake invalid links.

3. **Enrich profiles before scoring**
   - For raw engagers with missing or weak data, call Unipile profile lookup by provider/profile ID in controlled batches.
   - Use enriched fields: headline, current company, public identifier, profile URL, location if available.
   - De-dupe by provider ID first, then public URL/name fallback.

4. **Improve competitor and relevance filtering**
   - Add deterministic keyword checks for obvious sellers/agencies/consultants in the same space before AI scoring.
   - Feed the AI classifier richer enriched profile fields and business/ICP context.
   - Keep warm/hot leads, reject competitors and true low-fit leads, but avoid over-filtering when profile data is incomplete.

5. **Improve insertion and duplicate handling**
   - Dedupe existing contacts by both `linkedin_profile_id` and valid `linkedin_url`.
   - Insert `linkedin_profile_id` on contacts so future imports don’t duplicate the same person.
   - Preserve list assignment and optional campaign enrollment behavior.

6. **Improve user feedback**
   - Update the success toast/message to include fetched, imported, skipped competitors, skipped low-fit, and duplicate counts.
   - Return clearer diagnostics from the edge function so we can see whether the issue is API access, pagination, enrichment, or scoring.

### Validation
- Use edge function logs after a run to confirm raw reactions/comments/page counts are much higher than 3 on large posts.
- Confirm imported contacts have valid LinkedIn URLs only when a public URL/slug exists.
- Confirm irrelevant competitors are skipped and relevant buyer-like profiles survive scoring.


## Plan: Fix Acceptance Detection for New LinkedIn Connections

### Problem
The `process-campaign-followups` function checks 21 pending invitations but detects 0 acceptances. The Unipile API profile lookup either fails silently or returns data in a format that doesn't match the `isFirstDegree` checks.

### Root Cause Analysis
The acceptance detection relies on `fetchUserProfile` → `isFirstDegree`, which checks 5 field variants (`network_distance`, `is_connection`, `relation_type`, `distance`, `connection_degree`). If Unipile returns the connection status under a different field name, all checks fail silently. Additionally, each contact takes ~2-3s (API call + delays), so 21 contacts = ~50s, risking timeout without logging which fields Unipile actually returns.

### Plan

**1. Add diagnostic logging to `fetchUserProfile` (process-campaign-followups)**
- Log the actual Unipile response fields for each profile lookup so we can see exactly what Unipile returns (e.g., `network_distance`, `relation_type`, etc.)
- Log specifically the connection-related fields: `JSON.stringify({ network_distance, is_connection, relation_type, distance, connection_degree, network, connections_count })` from the response
- This will immediately reveal if Unipile uses a different field name

**2. Expand `isFirstDegree` to cover more Unipile response formats**
- Add checks for additional possible field names: `network` (e.g., `"FIRST"`), `degree`, `relationship`, `connected`, `is_first_degree`
- Add string-based checks: `network_distance === "1"`, `distance === 1` (number variant)
- Check nested objects: `profileData.network?.distance`, `profileData.connection?.type`

**3. Add a fallback acceptance method: check Unipile invitations API**
- After the profile check fails, query `GET /api/v1/users/invitations?account_id={id}` to check if the invitation status changed to "accepted"
- This provides a second independent signal that doesn't rely on profile field parsing

**4. Reduce delays to process more contacts within timeout**
- Reduce the inter-request delay from 800ms + 1000-2000ms to 300ms + 500ms
- This allows processing all 21 contacts comfortably within the 110s Edge Function limit

**5. Add error-level logging for failed lookups**
- If `fetchUserProfile` returns null, log the HTTP status and response body so we can debug API failures
- If the profile returns successfully but `isFirstDegree` is false, log the relevant fields at warn level

### Files to Change
- `supabase/functions/process-campaign-followups/index.ts` — all changes above

### Technical Details
```text
Current flow:
  fetchUserProfile(publicId) → isFirstDegree(data) → true/false
  
Enhanced flow:
  fetchUserProfile(publicId) → LOG raw fields
    → isFirstDegree(data) with expanded checks
    → if false: checkInvitationStatus(providerId) as fallback
    → LOG result either way
```


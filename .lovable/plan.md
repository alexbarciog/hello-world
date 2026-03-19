

# Anti-Detection for Reddit RSS Polling

## Problem
Reddit detects and blocks automated RSS/JSON scraping via consistent User-Agent strings, predictable timing, and rapid sequential requests from the same IP.

## Strategy
Mimic organic browser behavior across multiple dimensions:

### 1. Rotate User-Agent strings
Replace the static `Intentsly:v1.0.0 (intent-monitoring-bot)` with a pool of 10-15 real browser User-Agent strings (Chrome, Firefox, Safari on Windows/Mac/Linux). Pick one randomly per request.

### 2. Randomize request delays
Replace the fixed `500ms` delay with a random delay between **1500ms and 4500ms** between subreddit requests. Add a longer random pause (5-15s) every 5-8 requests to simulate human browsing patterns.

### 3. Randomize request order
Shuffle the subreddits array before iterating, so the request pattern is never predictable.

### 4. Vary the URL parameters
Randomly alternate between:
- `old.reddit.com` vs `www.reddit.com`
- `t=week` vs `t=month` (for RSS)
- `sort=new` vs `sort=relevance`
- `limit=25` to `limit=100` (random)

### 5. Add realistic browser headers
Include headers that real browsers send: `Accept-Language`, `Accept-Encoding`, `Cache-Control`, `Connection`, `Sec-Fetch-*` headers to make requests look like they come from a real browser tab.

### 6. Stagger polling across users
When processing multiple users (cron mode), shuffle the keyword list and add random inter-user delays (2-8s) so all requests don't fire in a burst.

## Technical Details

**File to modify:** `supabase/functions/poll-reddit-signals/index.ts`

**Changes:**
- Add a `BROWSER_USER_AGENTS` array constant with ~12 real UA strings
- Add a `getRandomHeaders()` function that returns randomized browser-like headers
- Add a `randomDelay(min, max)` utility
- Modify `pollViaRSS()` and `pollViaJSON()` to use randomized headers and URL variants
- Modify the main loop to shuffle subreddits and use variable delays
- Remove the bot-identifying User-Agent entirely


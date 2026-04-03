

# Plan: AI-Powered Post Relevance Filter + Better Keyword Generation

## Problem
Signal agents find posts via hashtags/keywords, but many matched posts are personal/lifestyle content (e.g., "took a break with family" tagged #sales). The agents then harvest engagers from these irrelevant posts as leads -- producing low-quality, non-buying-intent contacts.

## Solution: Two-Part Fix

### Part 1: Post Content Relevance Filter (AI-powered)

Add an AI relevance check that scores each post's **text content** before harvesting its engagers. This runs inside the edge functions before the engager-scanning phase.

**New shared helper `isPostBusinessRelevant()`** added to both `signal-keyword-posts` and `signal-hashtag-engagement`:

- Extract the post text (`post.text || post.commentary || post.description`)
- Call Lovable AI (Gemini Flash) with a focused prompt:
  - "Is this LinkedIn post about a genuine business topic, professional problem, or buying intent? Or is it personal/lifestyle content that happens to use business hashtags?"
  - Use tool calling to return `{ relevant: boolean, reason: string }`
- Posts scored as **not relevant** are skipped entirely -- no engagers are harvested
- To stay within runtime limits, batch posts (send 5-10 post texts in one AI call) and cache results
- Posts with no text content are also skipped (hashtag-only posts with no substance)

**Implementation across 2 edge functions:**
- `signal-keyword-posts/index.ts` -- filter posts after Phase 1 search, before Phase 2 engager scan
- `signal-hashtag-engagement/index.ts` -- filter posts after hashtag search, before engager scan
- `signal-post-engagers/index.ts` -- no change needed (scans your own posts, which are inherently relevant)

### Part 2: Smarter Keyword & Hashtag Generation

Improve `generate-signal-keywords/index.ts` prompts to produce keywords that inherently filter for buying intent:

**For `keyword_posts`:**
- Strengthen the prompt to emphasize action-oriented buying language
- Add negative examples: "Do NOT generate broad industry terms like 'sales', 'marketing', 'growth'. These match personal posts. Instead generate phrases that ONLY appear in professional buying context."
- Add examples of what to avoid: single-word generic hashtags, motivational/lifestyle terms

**For `hashtag_engagement`:**
- Add guidance to avoid generic hashtags (#sales, #marketing, #leadership, #motivation)
- Instruct AI to prefer niche, tool-specific, or problem-specific hashtags that personal posts would never use
- Add a blacklist of overly broad hashtags that get filtered out automatically

**Blacklist of generic hashtags/keywords** hardcoded in both signal functions:
- `sales`, `marketing`, `leadership`, `motivation`, `success`, `growth`, `entrepreneur`, `business`, `innovation`, `networking`, `mindset`, `hustle`, `grateful`, `blessed`, `family`, `weekend`, `vacation`, `holiday`
- Any post found only via a blacklisted term gets extra scrutiny from the AI filter

## Technical Details

### AI Batch Relevance Check (new helper in edge functions)
```text
Input: Array of { postId, text } (up to 10 posts)
AI Prompt: "Score each post: is this professional/business content 
            with buying intent, or personal/lifestyle content?"
Output: { results: [{ postId, relevant: boolean }] }
Cost: ~1 AI call per 10 posts (fast, cheap with Gemini Flash)
Runtime: ~1-2 seconds per batch
```

### Files Modified
1. `supabase/functions/signal-keyword-posts/index.ts` -- add AI relevance filter before engager scan
2. `supabase/functions/signal-hashtag-engagement/index.ts` -- add AI relevance filter before engager scan
3. `supabase/functions/generate-signal-keywords/index.ts` -- improve prompts + add blacklist filtering

### Runtime Budget
Current functions have ~105s budget. The AI relevance check adds ~2-4 seconds total (1-2 batch calls). This is well within budget and saves significant time by not scanning engagers on irrelevant posts.


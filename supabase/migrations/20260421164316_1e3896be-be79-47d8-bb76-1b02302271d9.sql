
-- Update existing Signal Agent with OMG Commerce brief settings
UPDATE public.signal_agents
SET
  name = 'OMG Commerce — YouTube Growth Agent',
  status = 'paused',
  agent_type = 'signals',
  precision_mode = 'high_precision',
  leads_list_name = 'OMG Commerce — Qualified DTC Brands',
  icp_job_titles = ARRAY[
    'Founder','Co-Founder','CEO','President','Owner',
    'CMO','Chief Marketing Officer','VP Marketing','VP of Marketing','Head of Marketing','Director of Marketing','Marketing Director',
    'VP Growth','Head of Growth','Director of Growth','Growth Lead',
    'VP Ecommerce','Head of Ecommerce','Director of Ecommerce','Ecommerce Director','Ecommerce Manager',
    'Head of Performance Marketing','Director of Performance Marketing','Director of Paid Media','Head of Paid Media',
    'Head of Acquisition','Director of Acquisition','Director of Digital Marketing','VP Digital'
  ],
  icp_industries = ARRAY[
    'Consumer Goods','Retail','Apparel & Fashion','Cosmetics','Health, Wellness and Fitness',
    'Food & Beverages','Sporting Goods','Furniture','Consumer Electronics','Luxury Goods & Jewelry',
    'Internet','Marketing and Advertising'
  ],
  icp_company_types = ARRAY['Privately Held','Public Company','Self-Employed'],
  icp_company_sizes = ARRAY['11-50','51-200','201-500'],
  icp_locations = ARRAY['United States','Canada','United Kingdom','Australia'],
  icp_exclude_keywords = ARRAY[
    'agency','consultant','freelance','freelancer','student','intern',
    'B2B SaaS','crypto','web3','NFT','dropship','dropshipper','dropshipping',
    'real estate','recruiter','coach'
  ],
  icp_restricted_roles = ARRAY['agency','consultant','freelancer','student','intern','recruiter','sales rep','account executive','sdr','bdr'],
  icp_restricted_countries = ARRAY[]::text[],
  manual_approval = true,
  keywords = ARRAY[
    'YouTube ads not working',
    'YouTube ads scaling',
    'Meta CAC rising',
    'Facebook CAC too high',
    'Amazon ads plateau',
    'Google Ads plateau',
    'PMax not converting',
    'agency underperforming',
    'looking for new agency',
    'switching ad agency',
    'video ads ecommerce',
    'YouTube creative for DTC',
    'Amazon DSP',
    'Amazon brand store',
    'scaling DTC brand',
    'ecommerce growth plateau'
  ],
  signals_config = jsonb_build_object(
    'enabled', ARRAY['keyword_posts','hashtag_engagement','post_engagers'],
    'keywords', jsonb_build_object(
      'keyword_posts', ARRAY[
        'YouTube ads not working',
        'Meta CAC too high',
        'Facebook CAC eating margin',
        'Amazon ads plateau',
        'Google Ads not scaling',
        'PMax underperforming',
        'looking for new ad agency',
        'switching marketing agency',
        'scaling YouTube ads',
        'YouTube ads for ecommerce',
        'video ads for DTC',
        'Amazon DSP help',
        'Amazon agency recommendations',
        'ecommerce growth plateau'
      ],
      'hashtag_engagement', ARRAY[
        'dtc','ecommerce','shopify','amazonfba','amazonseller',
        'youtubeads','googleads','metaads','paidsocial','performancemarketing',
        'ecomgrowth','brandbuilding'
      ],
      'profile_engagers', ARRAY[
        'brettcurry',
        'ezralanger',
        'rabahrahil',
        'taylorholiday',
        'nikfriendskanaan',
        'savannahsanchez',
        'ronlinson'
      ],
      'competitor_followers', ARRAY[]::text[],
      'competitor_engagers', ARRAY[]::text[]
    ),
    'manual_approval', true,
    'brand_context', jsonb_build_object(
      'company','OMG Commerce',
      'positioning','Performance marketing agency for $10M-$100M DTC brands. YouTube + Amazon + Google specialists. Premier Partner. $100M+ annual ad spend managed.',
      'hero','Brett Curry — CEO, host of eCommerce Evolution (top-10 podcast)',
      'offer','Free Video Growth Audit personally reviewed by Brett Curry',
      'proof_points', ARRAY['193% total sales lift','$100M+ annual ad spend','Google Premier Partner']
    )
  ),
  updated_at = now()
WHERE id = '16a74b6b-5f6f-4f0c-b5b8-43cf72e2304d';

-- Update existing Campaign with OMG Commerce brief
UPDATE public.campaigns
SET
  company_name = 'OMG Commerce',
  website = 'https://www.omgcommerce.com',
  description = 'OMG Commerce is a performance marketing agency for $10M–$100M DTC brands. We balance Demand Generation (YouTube) with Demand Capture (Google, Amazon) to drive compounding growth. Google Premier Partner managing $100M+ in annual ad spend. CEO Brett Curry hosts the top-10 eCommerce Evolution podcast.',
  industry = 'Marketing and Advertising',
  language = 'English',
  country = 'United States',
  value_proposition = 'For $10M–$100M DTC brands stuck on Amazon/Google or bleeding margin on Meta — Brett Curry will personally audit your video creative and map a YouTube growth funnel. 193% total sales lift, ACoS held under target.',
  precision_mode = 'high_precision',
  status = 'paused',
  source_type = 'agent',
  source_agent_id = '16a74b6b-5f6f-4f0c-b5b8-43cf72e2304d',
  conversational_ai = true,
  exclude_first_degree = true,
  daily_connect_limit = 25,
  max_ai_replies = 5,
  current_step = 6,
  -- ICP mirrors the agent
  icp_job_titles = ARRAY[
    'Founder','Co-Founder','CEO','President','Owner',
    'CMO','VP Marketing','Head of Marketing','Director of Marketing',
    'VP Growth','Head of Growth','Director of Growth',
    'VP Ecommerce','Head of Ecommerce','Director of Ecommerce',
    'Head of Performance Marketing','Director of Paid Media','Head of Acquisition'
  ],
  icp_industries = ARRAY['Consumer Goods','Retail','Apparel & Fashion','Cosmetics','Health, Wellness and Fitness','Food & Beverages','Sporting Goods','Consumer Electronics','Luxury Goods & Jewelry'],
  icp_company_types = ARRAY['Privately Held','Public Company'],
  icp_company_sizes = ARRAY['11-50','51-200','201-500'],
  icp_locations = ARRAY['United States','Canada','United Kingdom','Australia'],
  icp_exclude_keywords = ARRAY['agency','consultant','freelancer','student','intern','B2B SaaS','crypto','web3','dropship','real estate','recruiter','coach'],
  icp_restricted_roles = ARRAY['agency','consultant','freelancer','student','intern','recruiter','sales rep','account executive','sdr','bdr'],
  -- Pain points (drives AI message angles 1-4)
  pain_points = ARRAY[
    'Growth has plateaued on Google/Amazon — hitting the demand-capture ceiling',
    'Over-reliant on Amazon — one algorithm shift could break the business',
    'Meta/Facebook CAC eating margins, paid social no longer profitable at scale',
    'Current agency is set-and-forget — no creative testing, generic reporting',
    'Sitting on video assets but not running YouTube ads at scale',
    'In-house team strong on execution but lacks YouTube ads expertise'
  ],
  campaign_goal = 'Book Video Growth Audit calls with Brett Curry — qualified DTC founders/marketing leaders at $10M–$100M brands spending $250K+/mo on ads.',
  message_tone = 'Direct, confident, human. Plain English, short sentences. No jargon, no fluff. Specific numbers over vague claims. Sound like a person, not a template.',
  custom_training = $TRAIN$
=== OMG COMMERCE OUTREACH PLAYBOOK ===

WHO WE ARE
OMG Commerce is a performance marketing agency for $10M-$100M DTC/ecommerce brands. We balance Demand Generation (YouTube) with Demand Capture (Google, Amazon). Google Premier Partner. $100M+ annual ad spend managed. CEO Brett Curry hosts eCommerce Evolution (top-10 podcast).

THE CORE OFFER (use as the CTA in message 2 or 3, never in the invite)
Free Video Growth Audit. Brett Curry personally reviews the prospect's existing video creative across YouTube, Meta, and paid social, and maps out exactly what a YouTube demand-gen funnel could do for their brand. Real value upfront. No templated deck.

KEY PROOF POINTS (use one, not all)
- 193% total sales lift adding YouTube to the mix, ACoS held under target
- $100M+ in annual ad spend managed
- Google Premier Partner status
- Brett Curry — host of eCommerce Evolution (top-10 e-commerce podcast)

MESSAGE ANGLES — pick the one that matches the lead's signal:

ANGLE 1 — THE DEMAND WALL
Use when: Lead is heavy on Google or Amazon, mentions plateau, slowed growth, ROAS pressure.
Hook: "Your current setup is probably great at capturing demand you already have. But if growth has slowed, you've likely hit the ceiling on people already searching for you. YouTube is how you build new demand and break through that ceiling."

ANGLE 2 — PLATFORM RISK
Use when: Lead is Amazon-heavy, FBA seller, Amazon-dependent.
Hook: "Relying on Amazon as your only growth channel is a real risk. One algorithm shift changes everything. Brands that build a Google + YouTube moat around Amazon are the ones that survive and scale."

ANGLE 3 — AGENCY NEGLECT
Use when: Lead complains about current agency, set-and-forget management, no creative testing.
Hook: "Most agencies build campaigns and move on. We optimize budgets and media mix daily — that's where the margin actually lives."

ANGLE 4 — RISING CAC
Use when: Meta/paid social is primary channel, margins under pressure, CAC complaints.
Hook: "If Facebook CAC is eating margin, YouTube is the channel worth testing. We've taken brands from Amazon-first to 193% total sales lift by adding YouTube demand gen — ACoS held under target."

VOICE & TONE — DO
- Lead with relevance. Reference something specific about their brand or signal in sentence 1.
- Plain English. Short sentences.
- Confident not pushy. Give a clean decision point.
- Specific numbers ("193% sales lift") over vague claims ("significant growth").
- Sound like a person.

VOICE & TONE — DON'T
- Never write "I hope this finds you well", "touching base", "circle back", "leverage", "synergy", "tech stack".
- No em dashes. No excessive punctuation.
- Don't ask for a call "to learn more" — ask for a session to uncover a specific opportunity.
- Don't bury the ask. One message, one CTA.
- Don't oversell or hype.

OBJECTION HANDLING (for conversational AI replies)
- "We have an agency" → "Most brands we work with do. We're usually brought in to fill a specific gap — most often YouTube or Amazon — that the current agency isn't covering well. Worth a quick conversation?"
- "Not the right time" → "Understood. The Video Growth Audit takes under 30 minutes and is useful regardless of timing. When would be better?"
- "We're in-house" → "In-house teams are usually excellent at execution. Where we add value is YouTube — different creative and bidding approach than what most in-house teams are built for."
- "Send more info" → "Happy to. The most useful thing I can send is a personalized audit of your specific creative and channel mix. Want me to set that up with Brett?"

INVITE NOTE (Step 1) — under 200 chars, NO LINKS, NO PITCH
Reference their signal/post, one sentence, end with a soft connect line. Do NOT mention the audit yet.

FOLLOW-UP MESSAGE (Step 2+) — 3 SENTENCES MAX
S1: Reference their specific signal/post.
S2: Tie it to the matching angle (Demand Wall / Platform Risk / Agency Neglect / Rising CAC) with one specific proof point.
S3: Soft pitch the Video Growth Audit with Brett — end with "Interested?" or "Worth exploring?"

NEVER mention "Brett" in the invite. Save him for the follow-up — that's where his name does the heavy lifting.
$TRAIN$,
  -- Workflow: Invite -> wait 2 days -> Message (audit pitch) -> wait 3 days -> Follow-up -> wait 4 days -> Final
  workflow_steps = $WF$[
    {"step": 1, "type": "invite", "delay_hours": 0, "label": "Connection Invite"},
    {"step": 2, "type": "message", "delay_hours": 48, "label": "Video Growth Audit Pitch"},
    {"step": 3, "type": "message", "delay_hours": 72, "label": "Angle-based Follow-up"},
    {"step": 4, "type": "message", "delay_hours": 96, "label": "Final — soft close"}
  ]$WF$::jsonb,
  updated_at = now()
WHERE id = 'e7845d19-511d-44b5-9cec-ccde9fb6d8de';

# Last run: 2026-10-28 (compare task; started 22:00 UTC, 00:00 Bucharest 29 Oct)

- Keyword: intentsly vs apollo (section compare, cluster intentsly-vs, type comparison, intent commercial,
  priority 2, difficulty medium). `blog_next.py --section compare` returned it directly. No PAUSE file, no
  draft waiting. Repository already cloned and in scope; `git pull origin main` was up to date at 9ebd579.
  `add_repo` was not available as a tool, as on previous runs. Supabase connector: one of the two
  configured servers reported a proxy tunnel error at session start, the other connected and ran a
  read-only count before any work began (4 posts on 28 Oct UTC, 25 in the last 7 days; caps 7 and 45 not
  reached; by Bucharest date it was the first post of 29 Oct).
- Published: "Intentsly vs Apollo: Database and Sequences or AI SDR?"
  https://intentsly.com/compare/intentsly-vs-apollo
  The gate failed once (meta description 164 chars, opening 100 words, and "21%" rejected because the
  proof.md row's status is "verified: say ..." rather than plain "verified", so the gate does not count
  it). Trimmed the meta description and opening and removed the 21% sentence; ready on the second run.
  8 H2, 6 FAQ, 8 internal links, 13 external, 2,907 words by the gate's count (the 12-row table carries a
  large share; prose is roughly 2,200).
- Database: a read-only select first confirmed no row existed for the slug. The generated SQL ran unchanged
  on project uwwajlezgeurnvvrvdvb and returned status published, published_at 2026-10-28 22:16:04 UTC. A
  second read-only select confirmed the stored content_md matches the draft body exactly (21,703 chars,
  md5 5c30ef5ca02d12c8ad6edbacbccda3a4), 6 FAQ entries, 5 secondary keywords, word_count 2907.
- Angle: nothing ranks for the pairing; Google reads it as "Instantly vs Apollo", and the rest is
  alternatives listicles (salesforge.ai updated 11 Oct 2026, leadfeeder, aisdr, abmatic, marketbetter,
  salesintel). None maps job by job, none says which of Apollo's four LinkedIn sequence steps are automated
  (its docs: Send Connection Request and Send Message yes; View Profile and Interact with Post are tasks
  you complete; Send Message only to existing connections and not with Sales Navigator), none contrasts
  company-level topic intent (Bombora/LeadSift, weekly) with person-level LinkedIn engagement, none says who
  answers the reply (Apollo: sequence rulesets; no AI reply on the pages opened). Brief in
  blog/briefs/intentsly-vs-apollo.md.
- Apollo sources opened 28 Oct 2026 (all apollo.io / knowledge.apollo.io): pricing page (FAQ text only; the
  plan table is client-rendered and returned no prices, so the page quotes plan descriptions, credit rules,
  billing terms and links to apollo.io/pricing instead of figures), What Are Credits, Access a Free Trial,
  Buying Intent Overview, Add and Complete LinkedIn Tasks in a Sequence, Use Apollo with LinkedIn to Send
  Personalized Messages, Sequences Overview, Prospect on LinkedIn with the Chrome Extension, Export Contacts
  to a CSV, Integrate HubSpot, /product/integrations, /personas/sellers, /ai/assistant,
  /product/sales-engagement, /product/intelligence, /solutions/small-businesses. Not opened: the
  gojiberry.ai Apollo review (redirect blocked) and the social-selling knowledge article (client error).
- Intentsly facts only from product.md (LinkedIn-only signals, ICP scoring, verified emails, export,
  HubSpot/Cal.com/Google Calendar/LinkedIn, AI SDR LinkedIn-only, 2 accounts, 30/30/day with 15
  recommended, EN/RO/DE/NL, 7-day trial, /try-ai, self-serve) and the dogfooding story (14 demos in 14
  days, 4x reply rate) plus the playbook row (12 signals, 8 to ignore). No price, no Reddit/X claim, no
  customer names.
- Links: /learn/what-is-intent-data, /features/ai-sdr, /features/linkedin-signals (contextual sentence),
  /signal-playbook, /pricing, /try-ai (closing CTA), /guides/set-up-signal-based-outbound, /compare.
- Queue: 5 `compare` keywords still queued (intentsly vs linkedin sales navigator, teamfluence, clay, 11x,
  heyreach); not below 5, so none added this run.
- For the founder: (1) the 21% reply rate, the ~1,000 leads/month per agent and the 2 to 4 meetings a week
  rows in proof.md carry a status of "verified: ..." with a phrasing note; the gate only accepts the exact
  word "verified", so these numbers cannot be used until the status cell is "verified" and the phrasing
  note moves into the claim cell. (2) Confirm whether Intentsly has an API or CSV export so comparisons can
  say so instead of "export". (3) Apollo's live prices could not be read by the fetch tool; if you want
  figures on the page, paste the current plan table and the date you read it.
- Live check (22:23 UTC, about six minutes after the push at 22:17): the page is live. Direct fetches of
  intentsly.com/sitemap.xml and the page URL asked for a permission nobody was there to grant, as on earlier
  runs, so the check went search result -> blog post footer -> /compare index -> page. The /compare index
  lists the Apollo page first (6 comparisons), and the page renders with the H1, the 12-row table, 6 FAQ
  entries and the /try-ai and /features/ai-sdr links. The sitemap itself could not be opened, so sitemap
  listing is unverified. Site note for the founder (website code, not touched by this task): the /compare
  index card prefixes "Intentsly vs " to titles that already start with "Intentsly vs", so cards read
  "Intentsly vs Intentsly vs Apollo: ...". Push note: `git push origin main` was rejected because the
  shallow clone's local `main` branch is stale; `git push origin HEAD:main` went through at 22:17 UTC.

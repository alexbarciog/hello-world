const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─── Shared types & helpers ───────────────────────────────────────────────────

interface ICPFilters { jobTitles: string[]; industries: string[]; locations: string[]; companySizes: string[]; companyTypes: string[]; excludeKeywords: string[]; competitorCompanies: string[]; }
interface MatchResult { titleMatch: boolean; industryMatch: boolean; locationMatch: boolean; score: number; matchedFields: string[]; }

const BUYING_INTENT_KEYWORDS = ['ceo','cto','coo','cfo','cmo','cro','cpo','cio','founder','co-founder','cofounder','owner','partner','president','principal','vp','vice president','director','head of','chief','general manager','managing director','svp','evp','avp'];
const REJECT_TITLES = ['software developer','software engineer','frontend developer','backend developer','full stack developer','fullstack developer','web developer','mobile developer','junior developer','senior developer','staff engineer','intern','data analyst','qa engineer','test engineer','devops engineer','graphic designer','ui designer','ux designer','student','fresher','trainee','apprentice','accountant','bookkeeper','cashier','clerk','receptionist','administrative assistant','office assistant'];

function normalizeText(v: string): string { return (v||'').toLowerCase().replace(/[^a-z0-9\s]/g,'').trim(); }
function fuzzyMatchList(v: string, c: string[]): boolean { const h=normalizeText(v); if(!h) return false; return c.some(x=>{const n=normalizeText(x); return n?(h.includes(n)||n.includes(h)):false;}); }
function collectCompanyFields(p: any): string[] {
  const companyFields: string[] = [];
  if (p.company) companyFields.push(p.company);
  if (p.current_company?.name) companyFields.push(p.current_company.name);
  if (p.headline) companyFields.push(p.headline);
  if (p.title) companyFields.push(p.title);
  const positions = p.current_positions || p.positions || p.experience || [];
  if (Array.isArray(positions)) {
    for (const pos of positions) {
      if (pos.company) companyFields.push(typeof pos.company === 'string' ? pos.company : pos.company.name || '');
      if (pos.company_name) companyFields.push(pos.company_name);
      if (pos.organization) companyFields.push(pos.organization);
    }
  }
  return companyFields.filter(Boolean);
}
function matchesCompanyName(value: string, companyName: string): boolean {
  const normalizedValue = normalizeText(value);
  const normalizedCompany = normalizeText(companyName);
  if (!normalizedValue || !normalizedCompany || normalizedCompany.length < 3) return false;
  // Only check if company name appears in the value (not the reverse — avoids false positives)
  return normalizedValue.includes(normalizedCompany);
}
function worksAtCompany(profile: any, companyName: string): boolean {
  if (!companyName?.trim()) return false;
  return collectCompanyFields(profile).some(field => matchesCompanyName(field, companyName));
}

function scoreProfileAgainstICP(p: any, icp: ICPFilters): MatchResult {
  const title=p.headline||p.title||p.role||''; const industry=p.industry||''; const location=p.location||p.country||'';
  const titleMatch=icp.jobTitles.length===0||fuzzyMatchList(title,icp.jobTitles);
  const industryMatch=icp.industries.length===0||fuzzyMatchList(industry,icp.industries);
  const locationMatch=icp.locations.length===0||fuzzyMatchList(location,icp.locations);
  const mf: string[]=[]; let score=0;
  if(icp.jobTitles.length>0&&titleMatch){score+=40;mf.push('title');}else if(icp.jobTitles.length===0)score+=20;
  if(icp.industries.length>0&&industryMatch){score+=30;mf.push('industry');}else if(icp.industries.length===0)score+=15;
  if(icp.locations.length>0&&locationMatch){score+=20;mf.push('location');}else if(icp.locations.length===0)score+=10;
  if(icp.companySizes.length>0){const cs=p.company_size||p.current_company?.employee_count||'';if(cs&&fuzzyMatchList(String(cs),icp.companySizes)){score+=10;mf.push('company_size');}}else score+=5;
  return{titleMatch,industryMatch,locationMatch,score:Math.min(100,score),matchedFields:mf};
}

function hasBuyingIntent(hl: string): boolean { return BUYING_INTENT_KEYWORDS.some(kw=>(hl||'').toLowerCase().includes(kw)); }
function isClearlyIrrelevant(hl: string): boolean { return REJECT_TITLES.some(kw=>(hl||'').toLowerCase().includes(kw)); }

function classifyCompetitorContact(m: MatchResult, icp: ICPFilters, hl?: string): 'hot'|'warm'|'cold'|null {
  const h=hl||'';
  if(isClearlyIrrelevant(h)) return null;
  if(icp.jobTitles.length>0&&m.titleMatch) return 'hot';
  if(hasBuyingIntent(h)&&(icp.industries.length===0||m.industryMatch)) return 'hot';
  if(hasBuyingIntent(h)) return 'warm';
  if(icp.industries.length>0&&m.industryMatch&&h.length>5) return 'warm';
  if(h.length>5) return 'warm';
  if(icp.jobTitles.length===0&&icp.industries.length===0) return 'warm';
  return null;
}

function isExcluded(p: any,ek: string[],cc: string[]=[]): boolean {
  const companyFields = collectCompanyFields(p);
  const profileUrl = (p.linkedin_url || p.public_url || p.profile_url || '').toLowerCase();
  if(cc.length>0){
    const allText = companyFields.map(f => f.toLowerCase()).join(' ') + ' ' + profileUrl;
    for(const c of cc){if(allText.includes(c)) return true;}
  }
  if(!ek.length) return false;
  const text=[...companyFields,p.industry].filter(Boolean).join(' ').toLowerCase();
  return ek.some(kw=>text.includes(kw));
}

function unipileGet(path: string,apiKey: string,dsn: string){return fetch(`https://${dsn}${path}`,{headers:{'X-API-KEY':apiKey}});}

// Fix 2: Sanitize LinkedIn URLs before sending to Unipile.
// Strips query strings (utm_*), fragments, trailing slashes, and Unicode diacritics
// that break Unipile's URL parser and silently return 0 results.
function sanitizeLinkedinUrl(raw: string): string {
  if (!raw) return raw;
  try {
    const url = new URL(raw.trim());
    url.search = '';
    url.hash = '';
    let clean = url.toString().replace(/\/+$/, '');
    clean = clean.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
    return clean.toLowerCase();
  } catch {
    return raw.trim().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }
}
function normalizeProfile(item: any): any {
  if (!item.first_name && item.name) { const parts = item.name.split(' '); item.first_name = parts[0]; item.last_name = parts.slice(1).join(' ') || ''; }
  return item;
}
function extractLinkedinProfileId(item: any): string | null {
  const directId = item?.public_id || item?.public_identifier || item?.provider_id || item?.author_id || item?.entity_urn || item?.tracking_id;
  if (directId) return String(directId);
  const linkedinUrl = item?.linkedin_url || item?.public_url || item?.profile_url || item?.url;
  if (linkedinUrl && typeof linkedinUrl === 'string') {
    const match = linkedinUrl.match(/linkedin\.com\/in\/([^/?#]+)/i);
    if (match?.[1]) return match[1];
  }
  // Fix 5: Fallback to numeric id or actor_id for reaction authors
  if (item?.actor_id) return String(item.actor_id);
  if (item?.id && typeof item.id === 'string' && !item.id.startsWith('urn:') && /^[A-Za-z0-9_-]+$/.test(item.id)) return item.id;
  if (item?.id && typeof item.id === 'number') return String(item.id);
  return null;
}
async function fetchFullProfile(item: any,accountId: string,apiKey: string,dsn: string): Promise<any|null>{
  const id=item.public_identifier||item.provider_id||item.public_id||item.author_id;
  const numericOrUrn=item.id;
  const fetchId=id||(numericOrUrn&&!String(numericOrUrn).startsWith('urn:')&&!String(numericOrUrn).startsWith('ACo')?numericOrUrn:null);
  if(!fetchId) return normalizeProfile({...item});
  try{
    const res=await unipileGet(`/api/v1/linkedin/profile/${fetchId}?account_id=${accountId}`,apiKey,dsn);
    if(!res.ok){await res.text();return normalizeProfile({...item});}
    return normalizeProfile(await res.json());
  }catch{return normalizeProfile({...item});}
}
function delay(ms: number){return new Promise(r=>setTimeout(r,ms));}

function extractLinkedInId(url: string): string|null { if(!url) return null; const m=url.match(/linkedin\.com\/(?:company|in)\/([^/?]+)/); if(m) return m[1]; return url.replace(/^https?:\/\//,'').replace(/\/$/,'')||null; }
function extractCompanyName(url: string): string|null { const id=extractLinkedInId(url); if(!id) return null; return id.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase()); }

// ─── Resolve company slug to numeric ID via Unipile ──────────────────────────
const companyIdCache = new Map<string, string | null>();

async function resolveCompanyId(slug: string, accountId: string, apiKey: string, dsn: string): Promise<string | null> {
  const cached = companyIdCache.get(slug);
  if (cached !== undefined) return cached;

  try {
    const res = await unipileGet(`/api/v1/linkedin/company/${encodeURIComponent(slug)}?account_id=${accountId}`, apiKey, dsn);
    if (!res.ok) {
      const errText = await res.text();
      console.error(`[COMP] resolveCompanyId("${slug}"): HTTP ${res.status} - ${errText.slice(0, 200)}`);
      companyIdCache.set(slug, null);
      return null;
    }
    const data = await res.json();
    const numericId = data.id || data.provider_id || data.company_id || null;
    if (numericId) {
      console.log(`[COMP] Resolved "${slug}" → numeric ID ${numericId}`);
    } else {
      console.warn(`[COMP] resolveCompanyId("${slug}"): response had no id field. Keys: ${Object.keys(data).join(', ')}`);
    }
    companyIdCache.set(slug, numericId ? String(numericId) : null);
    return numericId ? String(numericId) : null;
  } catch (err) {
    console.error(`[COMP] resolveCompanyId("${slug}") error:`, err);
    companyIdCache.set(slug, null);
    return null;
  }
}

async function ensureList(sb: any,uid: string,ln: string,aid: string): Promise<string|null>{
  const{data:e}=await sb.from('lists').select('id, source_agent_id').eq('user_id',uid).eq('name',ln).limit(1);
  if(e?.length>0) {
    if(!e[0].source_agent_id) await sb.from('lists').update({source_agent_id:aid}).eq('id',e[0].id);
    return e[0].id;
  }
  const{data:c,error}=await sb.from('lists').insert({user_id:uid,name:ln,source_agent_id:aid}).select('id').single();
  if(error){console.error(`Create list error: ${error.message}`);return null;} return c?.id||null;
}

async function insertContact(sb: any,p: any,uid: string,aid: string,ln: string,m: MatchResult,signal: string,spu: string|null,icp?: ICPFilters): Promise<'inserted' | 'duplicate' | 'rejected'>{
  const lpid=p.public_id||p.public_identifier||p.provider_id||p.id; if(!lpid) return 'rejected';
  const{data:ex}=await sb.from('contacts').select('id').eq('user_id',uid).eq('linkedin_profile_id',lpid).limit(1);
  if(ex?.length>0) return 'duplicate';
  const fn=p.first_name||p.name?.split(' ')[0]||'Unknown'; const lnn=p.last_name||p.name?.split(' ').slice(1).join(' ')||'';
  const hl=p.headline||p.title||'';
  const ei: ICPFilters={jobTitles:[],industries:[],locations:[],companySizes:[],companyTypes:[],excludeKeywords:[],competitorCompanies:[]};
  const rt=classifyCompetitorContact(m,icp||ei,hl)||'warm';
  const sa=true;const sb2=m.score>=60;const sc=m.score>=80;const as=Math.min(3,[sa,sb2,sc].filter(Boolean).length);
  const{data:ins,error}=await sb.from('contacts').insert({
    user_id:uid,first_name:fn,last_name:lnn,title:p.headline||p.title||null,
    company:p.company||p.current_company?.name||null,
    linkedin_url:p.linkedin_url||p.public_url||p.profile_url||(lpid?`https://www.linkedin.com/in/${lpid}`:null),
    linkedin_profile_id:lpid,source_campaign_id:null,signal,signal_post_url:spu,
    ai_score:as,signal_a_hit:sa,signal_b_hit:sb2,signal_c_hit:sc,email_enriched:false,list_name:ln,
    company_icon_color:['orange','blue','green','purple','pink','gray'][Math.floor(Math.random()*6)],
    relevance_tier:rt,
  }).select('id').single();
  if(error){console.error(`Insert contact error: ${error.message}`);return 'rejected';}
  if(ins?.id&&ln){const lid=await ensureList(sb,uid,ln,aid);if(lid) await sb.from('contact_lists').insert({contact_id:ins.id,list_id:lid});}
  return 'inserted';
}

// ─── Quick ICP headline check (before expensive profile fetch) ───────────────

const QUICK_REJECT_TITLES = ['student', 'intern', 'freelance', 'looking for work', 'job seeker', 'fresher', 'trainee', 'apprentice'];

// Mode-aware pre-filter.
//   isHighPrecision = true  → strict legacy behaviour (reject if no positive ICP signal)
//   isHighPrecision = false → relaxed Discovery (only reject hard never-buyers; let
//                              seniority + relevant departments + industry through)
function engagerPreFilter(
  headline: string | undefined,
  icp: ICPFilters,
  isHighPrecision: boolean,
): 'strong_pass' | 'pass' | 'reject' {
  const hl = (headline || '').toLowerCase();

  // Hard never-buyers — reject in BOTH modes
  const NEVER_BUYERS = [
    'intern', 'student', 'junior', 'trainee', 'apprentice',
    'graduate', 'assistant', 'coordinator', 'administrator',
    'receptionist', 'support agent', 'data entry',
  ];
  if (hl && NEVER_BUYERS.some(r => hl.includes(r))) return 'reject';

  if (!headline) return 'pass';

  // Buying-intent / seniority always wins
  if (hasBuyingIntent(hl)) return 'strong_pass';
  if (icp.jobTitles.length > 0) {
    const titleMatch = icp.jobTitles.some(t => {
      const needle = t.toLowerCase().trim();
      return needle.length >= 3 && hl.includes(needle);
    });
    if (titleMatch) return 'strong_pass';
  }

  if (isHighPrecision) {
    // Strict — same as before.
    if (QUICK_REJECT_TITLES.some(t => hl.includes(t))) return 'reject';
    if (isClearlyIrrelevant(hl)) return 'reject';
    if (icp.jobTitles.length > 0 && hl.length > 5) return 'reject';
    return 'pass';
  }

  // Discovery mode — let any plausible buyer through to AI / full ICP check.
  const SENIORITY_SIGNALS = [
    'founder', 'co-founder', 'owner', 'director', 'head of',
    'vp', 'vice president', 'chief', 'ceo', 'cto', 'cmo', 'coo',
    'president', 'partner', 'principal', 'lead', 'manager',
    'senior', 'sr.', 'general manager', 'managing director',
  ];
  if (SENIORITY_SIGNALS.some(s => hl.includes(s))) return 'pass';

  const RELEVANT_DEPARTMENTS = [
    'sales', 'revenue', 'growth', 'marketing', 'business development',
    'bd', 'account', 'partnerships', 'operations', 'product',
    'strategy', 'commercial', 'customer success', 'go-to-market',
  ];
  if (RELEVANT_DEPARTMENTS.some(d => hl.includes(d))) return 'pass';

  // Industry fallback — if any ICP industry shows up in the headline, allow.
  if (icp.industries.some(ind => ind && hl.includes(ind.toLowerCase()))) return 'pass';

  return 'reject';
}

// Backward-compat shim (still referenced in the file). Defaults to discovery mode.
function engagerPassesQuickIcpCheck(headline: string | undefined, icp: ICPFilters): boolean {
  return engagerPreFilter(headline, icp, false) !== 'reject';
}

// ─── Main Handler ────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { agent_id, account_id, user_id, list_name, signal_type, urls, icp: icpRaw, competitor_companies, user_company_name, precision_mode, run_id, task_key } = await req.json();
    const START = Date.now();
    const MAX_RUNTIME_MS = 105_000;
    const hasTime = () => Date.now() - START < MAX_RUNTIME_MS;

    if (!agent_id || !account_id || !urls?.length || !signal_type) {
      return new Response(JSON.stringify({ leads: 0, error: 'Missing required params' }), { status: 400, headers: corsHeaders });
    }

    // Fix 2: sanitize all incoming URLs ONCE before any Unipile call
    const sanitizedUrls: string[] = (urls as string[]).map(sanitizeLinkedinUrl).filter(Boolean);
    const urlSanitizationChanged = sanitizedUrls.filter((s, i) => s !== (urls as string[])[i]).length;
    if (urlSanitizationChanged > 0) {
      console.log(`[COMP] sanitized ${urlSanitizationChanged}/${urls.length} URLs (stripped query/fragment/diacritics)`);
    }

    // BRUTAL LOG: Step 1 — sanitized URL audit
    (urls as string[]).forEach((raw, i) => {
      const sanitized = sanitizedUrls[i];
      console.log('[URL_CHECK]', JSON.stringify({
        original: raw,
        sanitized,
        areTheyDifferent: raw !== sanitized,
        signal: signal_type,
      }));
    });

    // BRUTAL LOG: Step 5 — confirm OR-logic version is deployed
    console.log('[ICP_LOGIC_VERSION]', 'OR_LOGIC_V2');
    console.log('[FIX2_DEPLOYED]', { signal: signal_type, file: 'signal-competitor', sanitizedUrlCount: sanitizedUrls.length, urlSanitizationChanged });

    const UNIPILE_API_KEY = Deno.env.get('UNIPILE_API_KEY')!;
    const UNIPILE_DSN = Deno.env.get('UNIPILE_DSN')!;
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const ownCompanyLower = (user_company_name || '').toLowerCase().trim();
    const isHighPrecision = precision_mode === 'high_precision';

    const icp: ICPFilters = {
      jobTitles: icpRaw?.jobTitles||[], industries: icpRaw?.industries||[], locations: icpRaw?.locations||[],
      companySizes: icpRaw?.companySizes||[], companyTypes: icpRaw?.companyTypes||[],
      excludeKeywords: icpRaw?.excludeKeywords||[], competitorCompanies: competitor_companies||[],
    };

    // Lightweight rejected-profile collector for AI suggestions (capped at 200 / task)
    const rejectedProfiles: Array<{
      headline: string; industry: string; company: string;
      companyIndustry: string; rejectionReason: string; signalType: string;
    }> = [];
    function captureRejected(fp: any, reason: string) {
      if (rejectedProfiles.length >= 200) return;
      rejectedProfiles.push({
        headline: (fp?.headline || fp?.title || '').slice(0, 200),
        industry: (fp?.industry || '').slice(0, 100),
        company: (fp?.company || fp?.current_company?.name || '').slice(0, 100),
        companyIndustry: (fp?.current_company?.industry || fp?.company?.industry || '').slice(0, 100),
        rejectionReason: reason,
        signalType: signal_type,
      });
    }

    console.log(`[COMP] ═══════════════════════════════════════════`);
    console.log(`[COMP] Signal type: ${signal_type} | Agent: ${agent_id}`);
    console.log(`[COMP] Precision: ${precision_mode || 'discovery'} | Country filter: ${isHighPrecision ? 'ENABLED' : 'DISABLED'}`);
    console.log(`[COMP] ICP titles: [${icp.jobTitles.join(', ')}]`);
    console.log(`[COMP] ICP industries: [${icp.industries.join(', ')}]`);
    console.log(`[COMP] ICP locations: [${icp.locations.join(', ')}]`);
    console.log(`[COMP] URLs to process: ${urls.length}`);
    console.log(`[COMP] ═══════════════════════════════════════════`);

    // ── Cross-run dedup: only block IDs processed in the LAST 30 DAYS ──
    // Older entries get a second chance (ICP may have changed; lead may now qualify).
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: ppRows } = await supabase
      .from('processed_posts')
      .select('social_id')
      .eq('agent_id', agent_id)
      .gte('processed_at', thirtyDaysAgo);
    const alreadyProcessed = new Set((ppRows || []).map((r: any) => r.social_id));
    console.log(`[COMP] Cross-run dedup (30d window): ${alreadyProcessed.size} previously processed IDs loaded`);

    // Pipeline stats
    const pipelineStats: Record<string, number> = {
      competitors_processed: 0,
      posts_fetched: 0,
      reactions_fetched: 0,
      comments_fetched: 0,
      total_engagers_raw: 0,
      engagers_after_dedup: 0,
      skipped_already_processed: 0,
      failed_quick_icp: 0,
      strong_passes: 0,
      profiles_fetched: 0,
      // Mode tracking for AI suggestions
      precision_mode: (precision_mode || 'discovery') as any,
      discovery_passed: 0,
      discovery_rejected: 0,
      hp_passed: 0,
      hp_rejected: 0,
      excluded_own_company: 0,
      excluded_competitor_employee: 0,
      excluded_competitor_direct_employee: 0,
      excluded_irrelevant_title: 0,
      excluded_wrong_country: 0,
      excluded_no_icp_match: 0,
      duplicates: 0,
      skipped_no_id: 0,
      inserted: 0,
      rejected: 0,
      bytes_fetched_estimate: 0,
      // Rule 3: skipped because contact already exists in DB (no update — net-new only)
      already_in_contacts: 0,
      // Legacy alias kept for backwards compatibility with run-history UI
      already_in_pipeline: 0,
      // Fix 5: seller-detection counter
      rejected_seller: 0,
      // Fix 6: per-source ICP match breakdown
      icp_match_by_headline: 0,
      icp_match_by_structured_title: 0,
      icp_match_by_profile_industry: 0,
      icp_match_by_company_industry: 0,
      icp_match_failed: 0,
      // Fix 6: URL sanitization + zero-result tracking
      url_sanitization_changed: urlSanitizationChanged,
    };
    // Fix 6: list of URLs that returned 0 posts/followers from Unipile
    (pipelineStats as any).zero_post_urls = [] as any;

    const newlyProcessedIds: string[] = [];
    let inserted = 0;

    // ── Two-tier bandwidth budget ──
    // Per-task soft cap counts only "weak" pre-filter passes. Strong passes (positive
    // ICP keyword in headline) bypass the cap so we never starve high-quality leads.
    // The run-level hard ceiling is enforced via signal_agent_runs metadata below.
    const PROFILE_FETCH_CAP = 80;          // per task, weak-signal fetches only
    const RUN_PROFILE_FETCH_CAP = 200;     // hard ceiling across all comp tasks in this run
    let profileFetches = 0;
    let weakFetches = 0;

    // Load run-wide fetch counter (other comp tasks in the same run may have already used budget)
    let runFetchesSoFar = 0;
    if (run_id) {
      try {
        const { data: runTasks } = await supabase
          .from('signal_agent_tasks')
          .select('diagnostics')
          .eq('run_id', run_id)
          .in('signal_type', ['competitor_engagers', 'competitor_followers']);
        runFetchesSoFar = (runTasks || []).reduce((acc: number, t: any) => acc + (t?.diagnostics?.profiles_fetched || 0), 0);
        console.log(`[COMP] Run-wide budget: ${runFetchesSoFar}/${RUN_PROFILE_FETCH_CAP} profile fetches already used by sibling tasks`);
      } catch (_) { /* best-effort */ }
    }
    const hasProfileBudget = (preFilterResult: 'strong_pass' | 'pass') => {
      if (runFetchesSoFar + profileFetches >= RUN_PROFILE_FETCH_CAP) return false;
      if (preFilterResult === 'strong_pass') return true; // strong pass bypasses per-task cap
      return weakFetches < PROFILE_FETCH_CAP;
    };
    const trackFetch = (preFilterResult: 'strong_pass' | 'pass') => {
      profileFetches++;
      if (preFilterResult === 'pass') weakFetches++;
      // Estimate ~30KB per Unipile profile JSON
      pipelineStats.bytes_fetched_estimate += 30_000;
    };

    // ── Process engagers for a single competitor ──
    async function processCompetitorEngagers(url: string) {
      const companyId = extractLinkedInId(url);
      const companyName = extractCompanyName(url) || companyId || 'Unknown';
      const companyNameLower = companyName.toLowerCase();
      // Build multiple name variants for robust employee detection
      const competitorNameVariants: string[] = [companyNameLower];
      if (companyId) competitorNameVariants.push(companyId.toLowerCase().replace(/-/g, ' '));
      // Also add the raw slug (e.g., "bitdefender")
      if (companyId) competitorNameVariants.push(companyId.toLowerCase());
      // Deduplicate
      const uniqueVariants = [...new Set(competitorNameVariants)];

      const isCompany = url.includes('/company/');
      const isPersonUrl = url.includes('/in/');
      if (!companyId) return;

      const competitorStats = {
        posts_fetched: 0,
        engagers_found: 0,
        after_dedup: 0,
        failed_quick_icp: 0,
        profiles_fetched: 0,
        qualified: 0,
      };

      pipelineStats.competitors_processed++;

      // BRUTAL LOG: Step 1 — URL right before Unipile call (engagers path)
      console.log('[URL_CHECK]', JSON.stringify({
        original: url,
        sanitized: url,
        areTheyDifferent: false,
        signal: 'competitor_engagers',
        companyId,
        isCompany,
        isPersonUrl,
      }));

      // Step 1: Fetch posts (up to 20)
      let posts: any[] = [];

      if (isPersonUrl) {
        console.log(`[COMP] Fetching posts for person: ${companyId}`);
        const personPath = `/api/v1/users/${companyId}/posts?account_id=${account_id}&limit=20`;
        const postsRes = await unipileGet(personPath, UNIPILE_API_KEY, UNIPILE_DSN);
        if (postsRes.ok) {
          const postsData = await postsRes.json();
          posts = (postsData.items || postsData.posts || []).slice(0, 20);
          // BRUTAL LOG: Step 2 — zero response audit
          if (!postsData?.items?.length && !postsData?.posts?.length) {
            console.error('[UNIPILE_ZERO]', JSON.stringify({
              endpoint: personPath,
              status: postsRes.status,
              rawResponse: JSON.stringify(postsData).substring(0, 1000),
              params: JSON.stringify({ companyId, account_id, signal: 'competitor_engagers_person_posts' }),
            }));
          }
        } else {
          const errText = await postsRes.text();
          console.error(`[COMP] Posts fetch person "${companyId}": HTTP ${postsRes.status} - ${errText.slice(0, 200)}`);
        }
      }

      if (isCompany) {
        console.log(`[COMP] Fetching posts for company: ${companyId} (resolving numeric ID…)`);
        const numericId = await resolveCompanyId(companyId, account_id, UNIPILE_API_KEY, UNIPILE_DSN);
        if (!numericId) {
          console.error(`[COMP] Skipping company "${companyId}" — could not resolve to numeric ID`);
        } else {
          let cursor: string | null = null;
          for (let page = 0; page < 5 && hasTime(); page++) {
            let fetchUrl = `/api/v1/users/${numericId}/posts?account_id=${account_id}&is_company=true&limit=20`;
            if (cursor) fetchUrl += `&cursor=${encodeURIComponent(cursor)}`;
            const postsRes = await unipileGet(fetchUrl, UNIPILE_API_KEY, UNIPILE_DSN);
            if (!postsRes.ok) {
              const errText = await postsRes.text();
              console.error(`[COMP] Posts fetch company "${companyId}" (ID: ${numericId}) page ${page+1}: HTTP ${postsRes.status} - ${errText.slice(0, 200)}`);
              break;
            }
            const postsData = await postsRes.json();
            const items = postsData.items || postsData.posts || [];
            posts.push(...items);
            console.log(`[COMP] "${companyName}" page ${page+1}: ${items.length} posts (total: ${posts.length})`);
            // BRUTAL LOG: Step 2 — zero response audit (first page only)
            if (page === 0 && items.length === 0) {
              console.error('[UNIPILE_ZERO]', JSON.stringify({
                endpoint: fetchUrl,
                status: postsRes.status,
                rawResponse: JSON.stringify(postsData).substring(0, 1000),
                params: JSON.stringify({ companyId, numericId, account_id, signal: 'competitor_engagers_company_posts' }),
              }));
            }
            cursor = postsData.cursor || postsData.next_cursor || null;
            if (!cursor || items.length === 0) break;
            await delay(200);
          }
        }
      }

      // Sort by engagement and take top 20
      posts = posts
        .sort((a: any, b: any) => ((b.likes_count||0)+(b.comments_count||0)) - ((a.likes_count||0)+(a.comments_count||0)))
        .slice(0, 20);

      competitorStats.posts_fetched = posts.length;
      pipelineStats.posts_fetched += posts.length;
      console.log(`[COMP] "${companyName}": ${posts.length} posts to scan for engagers`);

      // Step 2: For each post, fetch ALL reactors AND commenters
      interface EngagerData {
        person: any;
        signalType: 'reaction' | 'comment';
        postUrl: string;
        postText: string;
      }
      const allEngagers: EngagerData[] = [];

      for (const post of posts) {
        if (!hasTime()) break;
        const postId = post.social_id || post.id || post.provider_id;
        if (!postId) continue;
        const postUrl = post.url || post.share_url || post.permalink || `https://www.linkedin.com/feed/update/${postId}`;
        const postText = (post.text || post.body || '').substring(0, 150);

        // Fetch reactions and comments in parallel (Fix 4: retry on HTTP 500)
        async function fetchWithSingleRetry(url: string, label: string): Promise<Response> {
          const res = await unipileGet(url, UNIPILE_API_KEY, UNIPILE_DSN);
          if (res.status === 500) {
            await res.text(); // drain
            console.log(`[COMP] ${label}: HTTP 500 — retrying in 2s`);
            await delay(2000);
            return unipileGet(url, UNIPILE_API_KEY, UNIPILE_DSN);
          }
          return res;
        }

        const [rr, cr] = await Promise.all([
          fetchWithSingleRetry(`/api/v1/posts/${postId}/reactions?account_id=${account_id}&limit=100`, `reactions ${postId}`),
          fetchWithSingleRetry(`/api/v1/posts/${postId}/comments?account_id=${account_id}&limit=100`, `comments ${postId}`),
        ]);

        let reactionCount = 0;
        let commentCount = 0;

        if (rr.ok) {
          const rd = await rr.json();
          const reactors = rd.items || [];
          reactionCount = reactors.length;
          // BRUTAL LOG: Step 2 — zero response audit
          if (reactors.length === 0) {
            console.error('[UNIPILE_ZERO]', JSON.stringify({
              endpoint: `/api/v1/posts/${postId}/reactions`,
              status: rr.status,
              rawResponse: JSON.stringify(rd).substring(0, 1000),
              params: JSON.stringify({ postId, account_id, signal: 'competitor_engagers_reactions' }),
            }));
          }
          for (const r of reactors) {
            allEngagers.push({
              person: r.author || r,
              signalType: 'reaction',
              postUrl,
              postText,
            });
          }
        } else { const t = await rr.text(); console.error(`[COMP] reactions ${postId}: HTTP ${rr.status} - ${t.slice(0, 200)}`); }

        if (cr.ok) {
          const cd = await cr.json();
          const commenters = cd.items || [];
          commentCount = commenters.length;
          // BRUTAL LOG: Step 2 — zero response audit
          if (commenters.length === 0) {
            console.error('[UNIPILE_ZERO]', JSON.stringify({
              endpoint: `/api/v1/posts/${postId}/comments`,
              status: cr.status,
              rawResponse: JSON.stringify(cd).substring(0, 1000),
              params: JSON.stringify({ postId, account_id, signal: 'competitor_engagers_comments' }),
            }));
          }
          for (const c of commenters) {
            allEngagers.push({
              person: c.author || c,
              signalType: 'comment',
              postUrl,
              postText: c.text ? `Commented: ${(c.text as string).substring(0, 150)}` : postText,
            });
          }
        } else { const t = await cr.text(); console.error(`[COMP] comments ${postId}: HTTP ${cr.status} - ${t.slice(0, 200)}`); }

        pipelineStats.reactions_fetched += reactionCount;
        pipelineStats.comments_fetched += commentCount;
        // Estimate ~25KB per reactions/comments page response
        pipelineStats.bytes_fetched_estimate += 25_000 * 2;

        console.log(`[COMP] Post ${postId}: ${reactionCount} reactions, ${commentCount} comments`);

        // Rate limit: 300ms between post engagement fetches
        await delay(300);
      }

      competitorStats.engagers_found = allEngagers.length;
      pipelineStats.total_engagers_raw += allEngagers.length;
      console.log(`[COMP] "${companyName}": ${allEngagers.length} raw engagers extracted`);

      // Step 3: Deduplicate engagers by LinkedIn ID
      const seenEngagerIds = new Set<string>();
      const uniqueEngagers = allEngagers.filter(e => {
        const id = extractLinkedinProfileId(e.person);
        if (!id) { pipelineStats.skipped_no_id++; return false; }
        if (seenEngagerIds.has(id)) return false;
        seenEngagerIds.add(id);
        return true;
      });

      competitorStats.after_dedup = uniqueEngagers.length;
      pipelineStats.engagers_after_dedup += uniqueEngagers.length;
      console.log(`[COMP] "${companyName}": ${uniqueEngagers.length} unique engagers after dedup`);

      // Step 4-5: Process each unique engager
      for (const engager of uniqueEngagers) {
        if (!hasTime()) break;

        const rawId = extractLinkedinProfileId(engager.person);

        // Step 4: Pre-filter on the lightweight engager payload BEFORE any expensive call
        const quickHeadline = engager.person.headline || engager.person.title || engager.person.description || '';
        const preFilter = engagerPreFilter(quickHeadline, icp, isHighPrecision);
        if (preFilter === 'reject') {
          pipelineStats.failed_quick_icp++;
          competitorStats.failed_quick_icp++;
          if (isHighPrecision) pipelineStats.hp_rejected++; else pipelineStats.discovery_rejected++;
          continue;
        }
        if (isHighPrecision) pipelineStats.hp_passed++; else pipelineStats.discovery_passed++;
        if (preFilter === 'strong_pass') pipelineStats.strong_passes++;

        // Budget check (strong passes bypass per-task cap, weak ones don't)
        if (!hasProfileBudget(preFilter)) {
          console.log(`[COMP] profile-fetch budget reached (weak=${weakFetches}/${PROFILE_FETCH_CAP}, run=${runFetchesSoFar + profileFetches}/${RUN_PROFILE_FETCH_CAP}) — stopping`);
          break;
        }

        // Cross-run dedup (30-day window already applied at load time)
        if (rawId && alreadyProcessed.has(rawId)) {
          pipelineStats.skipped_already_processed++;
          continue;
        }
        if (rawId) newlyProcessedIds.push(rawId);

        // Rule 3 (HARD SKIP): if contact already exists — skip entirely. No update.
        // Updating existing contacts inflates "activity" without producing pipeline.
        // The goal of each run is exclusively NET-NEW contacts.
        if (rawId) {
          const { data: existing } = await supabase.from('contacts').select('id').eq('user_id', user_id).eq('linkedin_profile_id', rawId).limit(1);
          if (existing && existing.length > 0) {
            pipelineStats.duplicates++;
            pipelineStats.already_in_contacts = (pipelineStats.already_in_contacts || 0) + 1;
            continue;
          }
        }

        // Step 5: Fetch full profile
        const fp = await fetchFullProfile(engager.person, account_id, UNIPILE_API_KEY, UNIPILE_DSN);
        pipelineStats.profiles_fetched++;
        trackFetch(preFilter);
        competitorStats.profiles_fetched++;

        if (!fp || !fp.first_name) { pipelineStats.skipped_no_id++; continue; }

        // Reject private profiles
        if ((fp.first_name||'').toLowerCase() === 'linkedin' && (fp.last_name||'').toLowerCase() === 'member') {
          pipelineStats.skipped_no_id++;
          continue;
        }

        const lpid = fp.public_id || fp.public_identifier || fp.provider_id || fp.id;

        // Rule 3 (HARD SKIP) — re-check with resolved ID. Skip if exists. No update.
        if (lpid && lpid !== rawId) {
          const { data: existing } = await supabase.from('contacts').select('id').eq('user_id', user_id).eq('linkedin_profile_id', lpid).limit(1);
          if (existing && existing.length > 0) {
            pipelineStats.duplicates++;
            pipelineStats.already_in_contacts = (pipelineStats.already_in_contacts || 0) + 1;
            continue;
          }
        }

        // Own-company exclusion
        if (ownCompanyLower && ownCompanyLower.length > 1 && worksAtCompany(fp, ownCompanyLower)) {
          pipelineStats.excluded_own_company++;
          continue;
        }

        // Competitor employee exclusion (global list)
        if (isExcluded(fp, icp.excludeKeywords, icp.competitorCompanies)) {
          pipelineStats.excluded_competitor_employee++;
          continue;
        }

        // ★ KEY FIX: Check if this person works at the SPECIFIC competitor whose posts they engaged with
        // Many employees have generic headlines like "Sr. Director, North America Channels"
        // that don't mention the company name, so the global check misses them.
        const worksAtThisCompetitor = uniqueVariants.some(variant => worksAtCompany(fp, variant));
        if (worksAtThisCompetitor) {
          console.log(`[COMP] ❌ EMPLOYEE of "${companyName}": ${lpid || rawId} | "${(fp.headline||fp.title||'').slice(0,60)}" | company: ${fp.company || fp.current_company?.name || 'N/A'}`);
          pipelineStats.excluded_competitor_employee++;
          continue;
        }

        // Clearly irrelevant titles
        const hl = fp.headline || fp.title || '';
        if (isClearlyIrrelevant(hl)) {
          pipelineStats.excluded_irrelevant_title++;
          continue;
        }

        // Country filter (only in high precision mode)
        if (isHighPrecision && icp.locations.length > 0) {
          const fullLocation = (fp.location || fp.country || '').toLowerCase();
          if (fullLocation) {
            const countryMatch = icp.locations.some(loc =>
              fullLocation.includes(loc.toLowerCase()) || loc.toLowerCase().includes(fullLocation)
            );
            if (!countryMatch) {
              pipelineStats.excluded_wrong_country++;
              continue;
            }
          }
        }

        // Fix 1: OR-logic ICP — any of headline / structured title / industry / company industry matching
        // is sufficient. Previously required a structured title re-match which killed 197/200 strong passes.
        if (icp.jobTitles.length > 0 || icp.industries.length > 0) {
          const exp0Title: string = (fp.experience?.[0]?.title || fp.positions?.[0]?.title || '');
          const profileIndustry: string = (fp.industry || '').toLowerCase();
          const companyIndustry: string = (fp.current_company?.industry || fp.company?.industry || '').toLowerCase();

          const results = {
            headlineMatch: icp.jobTitles.length > 0 && fuzzyMatchList(hl, icp.jobTitles),
            experienceMatch: icp.jobTitles.length > 0 && fuzzyMatchList(exp0Title, icp.jobTitles),
            industryMatch: icp.industries.length > 0 && fuzzyMatchList(profileIndustry, icp.industries),
            companyIndustryMatch: icp.industries.length > 0 && fuzzyMatchList(companyIndustry, icp.industries),
            headlineIndustryMatch: icp.industries.length > 0 && fuzzyMatchList(hl, icp.industries),
          };
          const passes = Object.values(results).some(Boolean)
            || (icp.jobTitles.length === 0 && icp.industries.length === 0);

          // Increment the right counter (every match contributes — not exclusive)
          if (results.headlineMatch) pipelineStats.icp_match_by_headline++;
          if (results.experienceMatch) pipelineStats.icp_match_by_structured_title++;
          if (results.industryMatch) pipelineStats.icp_match_by_profile_industry++;
          if (results.companyIndustryMatch) pipelineStats.icp_match_by_company_industry++;
          if (!passes) pipelineStats.icp_match_failed++;

          // BRUTAL LOG: per-profile ICP_RESULT (cap to first 30 to avoid log spam)
          const _icpLogged = (pipelineStats as any)._icp_log_count = ((pipelineStats as any)._icp_log_count || 0);
          if (_icpLogged < 30) {
            (pipelineStats as any)._icp_log_count = _icpLogged + 1;
            console.log('[ICP_RESULT]', JSON.stringify({
              profileId: fp.public_id || fp.public_identifier || fp.provider_id || fp.id,
              headline: hl,
              experienceTitle: exp0Title,
              profileIndustry,
              companyIndustry,
              icpTitles: icp.jobTitles,
              icpIndustries: icp.industries,
              results,
              passes,
              reason: passes ? 'inserted' : 'rejected_no_icp_match',
              source: 'competitor_engagers',
            }));
          }

          if (!passes) {
            pipelineStats.excluded_no_icp_match++;
            continue;
          }
        }

        const match = scoreProfileAgainstICP(fp, icp);
        const signal = engager.signalType === 'comment'
          ? `Commented on ${companyName}'s post`
          : `Reacted to ${companyName}'s post`;
        const result = await insertContact(supabase, fp, user_id, agent_id, list_name, match, signal, engager.postUrl, icp);

        if (result === 'inserted') {
          const tier = classifyCompetitorContact(match, icp, hl) || 'warm';
          console.log(`[COMP] ✅ ${lpid}: ${tier} | "${hl.slice(0, 50)}" | ${signal}`);
          pipelineStats.inserted++;
          competitorStats.qualified++;
          inserted++;
        } else if (result === 'duplicate') {
          pipelineStats.duplicates++;
        } else {
          pipelineStats.rejected++;
        }

        await delay(200);
      }

      console.log(`[COMPETITOR: ${companyName}] Posts: ${competitorStats.posts_fetched} | Engagers found: ${competitorStats.engagers_found} | After dedup: ${competitorStats.after_dedup} | Quick ICP fail: ${competitorStats.failed_quick_icp} | Profiles fetched: ${competitorStats.profiles_fetched} | Qualified: ${competitorStats.qualified}`);
    }

    // ── Helper: fetch with retry + exponential backoff for 429s (Fix 1: longer backoff) ──
    async function fetchWithRetry(fetchUrl: string, options: RequestInit, label: string, maxRetries = 2): Promise<Response> {
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const res = await fetch(fetchUrl, options);
        if (res.status !== 429 || attempt === maxRetries) return res;
        const backoffMs = (attempt + 1) * 8000; // 8s, 16s
        console.log(`[COMP] ${label}: HTTP 429 — retrying in ${backoffMs / 1000}s (attempt ${attempt + 1}/${maxRetries})`);
        await res.text(); // drain body
        await delay(backoffMs);
      }
      // unreachable but satisfies TS
      throw new Error('fetchWithRetry exhausted');
    }

    // ── Helper: flush processed IDs to DB (Fix 3: reusable for early flush) ──
    async function flushProcessedIds() {
      if (newlyProcessedIds.length === 0) return;
      const CHUNK = 500;
      for (let i = 0; i < newlyProcessedIds.length; i += CHUNK) {
        const chunk = newlyProcessedIds.slice(i, i + CHUNK);
        const rows = chunk.map(id => ({ social_id: id, agent_id }));
        await supabase.from('processed_posts').upsert(rows, { onConflict: 'social_id,agent_id', ignoreDuplicates: true });
      }
      console.log(`[COMP] Flushed ${newlyProcessedIds.length} processed IDs to DB`);
    }

    // ── Route by signal type ──
    if (signal_type === 'competitor_followers') {
      console.log(`[COMP] competitor_followers: received ${sanitizedUrls.length} URLs:`);
      sanitizedUrls.forEach((u: string, i: number) => console.log(`[COMP]   [${i}] ${u}`));

      for (let urlIdx = 0; urlIdx < sanitizedUrls.length; urlIdx++) {
        if (!hasTime()) break;
        const url = sanitizedUrls[urlIdx];
        const companyName = extractCompanyName(url);
        const isCompanyUrl = url.includes('/company/');

        if (!isCompanyUrl) {
          console.log(`[COMP] competitor_followers: skipping non-company URL "${url}" (followers API requires /company/ slug)`);
          continue;
        }

        // Inter-competitor delay (skip first)
        if (urlIdx > 0) {
          console.log(`[COMP] Waiting 5s before next competitor…`);
          await delay(5000);
        }

        if (isCompanyUrl && companyName) {
          // Count this competitor as processed regardless of resolution outcome (visibility)
          pipelineStats.competitors_processed++;
          const companyId = extractLinkedInId(url);

          // ── Strategy: Fetch real followers of the company page via Unipile followers API ──
          {
            // Resolve slug to numeric company ID
            const numericCompanyId = await resolveCompanyId(companyName, account_id, UNIPILE_API_KEY, UNIPILE_DSN);
            if (!numericCompanyId) {
              console.warn(`[COMP] competitor_followers: could not resolve "${companyName}" to numeric ID — skipping`);
              continue;
            }

            console.log(`[COMP] competitor_followers: fetching real followers of "${companyName}" (ID: ${numericCompanyId})`);
            // BRUTAL LOG: Step 1 — URL right before Unipile call (followers path)
            console.log('[URL_CHECK]', JSON.stringify({
              original: url,
              sanitized: url,
              areTheyDifferent: false,
              signal: 'competitor_followers',
              companyName,
              numericCompanyId,
            }));
            try {
              const allFollowers: any[] = [];
              let cursor: string | null = null;
              const MAX_PAGES = 3;

              for (let page = 0; page < MAX_PAGES && hasTime(); page++) {
                const followersUrl = new URL(`https://${UNIPILE_DSN}/api/v1/users/followers`);
                followersUrl.searchParams.set('user_id', numericCompanyId);
                followersUrl.searchParams.set('account_id', account_id);
                followersUrl.searchParams.set('limit', '100');
                if (cursor) followersUrl.searchParams.set('cursor', cursor);

                const res = await fetchWithRetry(
                  followersUrl.toString(),
                  {
                    method: 'GET',
                    headers: { 'X-API-KEY': UNIPILE_API_KEY, 'Accept': 'application/json' },
                  },
                  `followers "${companyName}" page ${page + 1}`
                );

                if (!res.ok) {
                  const errText = await res.text();
                  console.error(`[COMP] followers API "${companyName}" page ${page + 1}: HTTP ${res.status} - ${errText.slice(0, 200)}`);
                  break;
                }

                const data = await res.json();
                const followers = data.items || data.results || data.data || [];
                allFollowers.push(...followers);
                console.log(`[COMP] "${companyName}" followers page ${page + 1}: ${followers.length} followers (total: ${allFollowers.length})`);

                // Fix 6: surface zero-result responses with body preview so we can see why
                if (page === 0 && followers.length === 0) {
                  console.error('[UNIPILE_ZERO]', JSON.stringify({
                    endpoint: followersUrl.toString(),
                    status: res.status,
                    rawResponse: JSON.stringify(data).substring(0, 1000),
                    params: JSON.stringify({ companyName, numericCompanyId, account_id, signal: 'competitor_followers' }),
                  }));
                  (pipelineStats as any).zero_post_urls.push(url);
                }

                cursor = data.cursor || data.next_cursor || null;
                if (!cursor || followers.length === 0) break;
                await delay(1000);
              }

              console.log(`[COMP] "${companyName}": fetched ${allFollowers.length} total followers, processing…`);

              for (const person of allFollowers) {
                if (!hasTime()) break;
                const rawId = extractLinkedinProfileId(person);
                const quickHl = person.headline || person.title || '';
                const preFilter = engagerPreFilter(quickHl, icp, isHighPrecision);
                if (preFilter === 'reject') {
                  pipelineStats.failed_quick_icp++;
                  if (isHighPrecision) pipelineStats.hp_rejected++; else pipelineStats.discovery_rejected++;
                  continue;
                }
                if (isHighPrecision) pipelineStats.hp_passed++; else pipelineStats.discovery_passed++;
                if (preFilter === 'strong_pass') pipelineStats.strong_passes++;
                if (!hasProfileBudget(preFilter)) {
                  console.log(`[COMP] follower budget reached (weak=${weakFetches}/${PROFILE_FETCH_CAP}, run=${runFetchesSoFar + profileFetches}/${RUN_PROFILE_FETCH_CAP}) — stopping`);
                  break;
                }
                if (rawId && alreadyProcessed.has(rawId)) { pipelineStats.skipped_already_processed++; continue; }
                if (rawId) newlyProcessedIds.push(rawId);
                if (rawId) {
                  // Rule 3 (HARD SKIP): existing contact = skip, no update.
                  const { data: existing } = await supabase.from('contacts').select('id').eq('user_id', user_id).eq('linkedin_profile_id', rawId).limit(1);
                  if (existing && existing.length > 0) {
                    pipelineStats.duplicates++;
                    pipelineStats.already_in_contacts = (pipelineStats.already_in_contacts || 0) + 1;
                    continue;
                  }
                }
                const fp = await fetchFullProfile(person, account_id, UNIPILE_API_KEY, UNIPILE_DSN);
                pipelineStats.profiles_fetched++;
                trackFetch(preFilter);
                if (!fp || !fp.first_name) continue;
                if ((fp.first_name||'').toLowerCase() === 'linkedin' && (fp.last_name||'').toLowerCase() === 'member') continue;
                const lpid = fp.public_id || fp.public_identifier || fp.provider_id || fp.id;
                if (lpid && lpid !== rawId) {
                  // Rule 3 (HARD SKIP): existing contact = skip, no update.
                  const { data: existing } = await supabase.from('contacts').select('id').eq('user_id', user_id).eq('linkedin_profile_id', lpid).limit(1);
                  if (existing && existing.length > 0) {
                    pipelineStats.duplicates++;
                    pipelineStats.already_in_contacts = (pipelineStats.already_in_contacts || 0) + 1;
                    continue;
                  }
                }
                if (ownCompanyLower && ownCompanyLower.length > 1 && worksAtCompany(fp, ownCompanyLower)) { pipelineStats.excluded_own_company++; continue; }
                // Explicit competitor employee exclusion: skip people who work at THIS competitor
                if (worksAtCompany(fp, companyName)) { pipelineStats.excluded_competitor_direct_employee = (pipelineStats.excluded_competitor_direct_employee || 0) + 1; continue; }
                if (isExcluded(fp, icp.excludeKeywords, icp.competitorCompanies)) { pipelineStats.excluded_competitor_employee++; continue; }
                const hl = fp.headline || fp.title || '';
                if (isClearlyIrrelevant(hl)) { pipelineStats.excluded_irrelevant_title++; continue; }
                if (isHighPrecision && icp.locations.length > 0) {
                  const fullLocation = (fp.location || fp.country || '').toLowerCase();
                  if (fullLocation) {
                    const countryMatch = icp.locations.some(loc => fullLocation.includes(loc.toLowerCase()) || loc.toLowerCase().includes(fullLocation));
                    if (!countryMatch) { pipelineStats.excluded_wrong_country++; continue; }
                  }
                }
                if (icp.jobTitles.length > 0 || icp.industries.length > 0) {
                  const exp0Title: string = (fp.experience?.[0]?.title || fp.positions?.[0]?.title || '');
                  const profileIndustry: string = (fp.industry || '').toLowerCase();
                  const companyIndustry: string = (fp.current_company?.industry || fp.company?.industry || '').toLowerCase();

                  const results = {
                    headlineMatch: icp.jobTitles.length > 0 && fuzzyMatchList(hl, icp.jobTitles),
                    experienceMatch: icp.jobTitles.length > 0 && fuzzyMatchList(exp0Title, icp.jobTitles),
                    industryMatch: icp.industries.length > 0 && fuzzyMatchList(profileIndustry, icp.industries),
                    companyIndustryMatch: icp.industries.length > 0 && fuzzyMatchList(companyIndustry, icp.industries),
                    headlineIndustryMatch: icp.industries.length > 0 && fuzzyMatchList(hl, icp.industries),
                  };
                  const passes = Object.values(results).some(Boolean)
                    || (icp.jobTitles.length === 0 && icp.industries.length === 0);

                  if (results.headlineMatch) pipelineStats.icp_match_by_headline++;
                  if (results.experienceMatch) pipelineStats.icp_match_by_structured_title++;
                  if (results.industryMatch) pipelineStats.icp_match_by_profile_industry++;
                  if (results.companyIndustryMatch) pipelineStats.icp_match_by_company_industry++;
                  if (!passes) pipelineStats.icp_match_failed++;

                  const _icpLogged2 = (pipelineStats as any)._icp_log_count_followers = ((pipelineStats as any)._icp_log_count_followers || 0);
                  if (_icpLogged2 < 30) {
                    (pipelineStats as any)._icp_log_count_followers = _icpLogged2 + 1;
                    console.log('[ICP_RESULT]', JSON.stringify({
                      profileId: fp.public_id || fp.public_identifier || fp.provider_id || fp.id,
                      headline: hl,
                      experienceTitle: exp0Title,
                      profileIndustry,
                      companyIndustry,
                      icpTitles: icp.jobTitles,
                      icpIndustries: icp.industries,
                      results,
                      passes,
                      reason: passes ? 'inserted' : 'rejected_no_icp_match',
                      source: 'competitor_followers',
                    }));
                  }

                  if (!passes) { pipelineStats.excluded_no_icp_match++; continue; }
                }
                const match = scoreProfileAgainstICP(fp, icp);
                const result = await insertContact(supabase, fp, user_id, agent_id, list_name, match, `Follows ${companyName}`, url, icp);
                if (result === 'inserted') { pipelineStats.inserted++; inserted++; }
                else if (result === 'duplicate') { pipelineStats.duplicates++; }
                else { pipelineStats.rejected++; }
                await delay(200);
              }
            } catch (e) { console.error(`[COMP] Competitor followers ${url}:`, e); }
          }
        }

        // Person URLs in comp_followers: skip — comp_engagers handles them
        // if (url.includes('/in/')) { ... }
      }
    } else if (signal_type === 'competitor_engagers') {
      for (const url of sanitizedUrls) {
        if (!hasTime()) break;
        await processCompetitorEngagers(url);
      }
    }

    // ── Save cross-run dedup IDs (final flush for any remaining) ──
    await flushProcessedIds();

    // ── Final diagnostic summary ──
    console.log(`[COMP] =====================================`);
    console.log(`[COMP] COMPETITOR PIPELINE DIAGNOSTIC SUMMARY`);
    console.log(`[COMP] =====================================`);
    console.log(`[COMP] ${JSON.stringify(pipelineStats, null, 2)}`);
    console.log(`[COMP] Runtime: ${Math.round((Date.now()-START)/1000)}s`);
    console.log(`[COMP] =====================================`);

    // BRUTAL LOG: Step 6 — single-line task summary
    console.log('[TASK_FINAL_SUMMARY]', JSON.stringify({
      signal: signal_type,
      rawFetched: pipelineStats.total_engagers_raw,
      afterDedup: pipelineStats.engagers_after_dedup,
      passedPrefilter: pipelineStats.engagers_after_dedup - pipelineStats.failed_quick_icp,
      passedAI: 'N/A',
      profilesFetched: pipelineStats.profiles_fetched,
      passedICP: pipelineStats.inserted + pipelineStats.duplicates,
      inserted: pipelineStats.inserted,
      rejections: {
        urlBroken: ((pipelineStats as any).zero_post_urls || []).length,
        noIcpMatch: pipelineStats.excluded_no_icp_match,
        ownCompany: pipelineStats.excluded_own_company,
        irrelevantTitle: pipelineStats.excluded_irrelevant_title,
        dbDedup: pipelineStats.duplicates,
        aiRejected: 0,
        failedQuickIcp: pipelineStats.failed_quick_icp,
        excludedCompetitorEmployee: pipelineStats.excluded_competitor_employee,
        wrongCountry: pipelineStats.excluded_wrong_country,
        skippedNoId: pipelineStats.skipped_no_id,
        crossRunSkipped: pipelineStats.skipped_already_processed,
      },
    }));

    // Save diagnostics to task record if run_id/task_key provided
    if (run_id && task_key) {
      try {
        await supabase.from('signal_agent_tasks')
          .update({ diagnostics: pipelineStats } as any)
          .eq('run_id', run_id).eq('task_key', task_key);
        console.log(`[COMP] Diagnostics saved to task ${task_key}`);
      } catch (e) {
        console.warn(`[COMP] Failed to save diagnostics:`, e);
      }
    }

    return new Response(JSON.stringify({ leads: inserted }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('signal-competitor error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error', leads: 0 }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

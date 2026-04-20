const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─── Shared types & helpers ───────────────────────────────────────────────────

interface ICPFilters { jobTitles: string[]; industries: string[]; locations: string[]; companySizes: string[]; companyTypes: string[]; excludeKeywords: string[]; competitorCompanies: string[]; restrictedCountries: string[]; restrictedRoles: string[]; }
interface MatchResult { titleMatch: boolean; industryMatch: boolean; locationMatch: boolean; score: number; matchedFields: string[]; }

// Timer moved inside request handler (fixes warm isolate bug)

const BUYING_INTENT_KEYWORDS = ['ceo','cto','coo','cfo','cmo','cro','cpo','cio','founder','co-founder','cofounder','owner','partner','president','principal','vp','vice president','director','head of','chief','general manager','managing director','svp','evp','avp'];
const REJECT_TITLES = ['software developer','software engineer','frontend developer','backend developer','full stack developer','fullstack developer','web developer','mobile developer','junior developer','senior developer','staff engineer','intern','data analyst','qa engineer','test engineer','devops engineer','graphic designer','ui designer','ux designer','student','fresher','trainee','apprentice','accountant','bookkeeper','cashier','clerk','receptionist','administrative assistant','office assistant'];

function normalizeText(v: string): string { return (v||'').toLowerCase().replace(/[^a-z0-9\s]/g,'').trim(); }
function fuzzyMatchList(v: string, c: string[]): boolean { const h=normalizeText(v); if(!h) return false; return c.some(x=>{const n=normalizeText(x); return n?(h.includes(n)||n.includes(h)):false;}); }
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
function classifyContact(m: MatchResult,icp: ICPFilters,hl?:string): 'hot'|'warm'|'cold'|null {
  const h=hl||''; if(isClearlyIrrelevant(h)) return null;
  if(icp.jobTitles.length>0&&m.titleMatch) return 'hot';
  if(hasBuyingIntent(h)&&(icp.industries.length===0||m.industryMatch)) return 'hot';
  if(hasBuyingIntent(h)) return 'warm';
  if(icp.industries.length>0&&m.industryMatch&&h.length>5) return 'warm';
  if(h.length>5) return 'cold';
  if(icp.jobTitles.length===0&&icp.industries.length===0) return 'cold';
  return null;
}
function matchesTitleOrIndustry(m: MatchResult,icp: ICPFilters,hl?:string): boolean { return classifyContact(m,icp,hl)!==null; }
function isExcluded(p: any,ek: string[],cc: string[]=[]): boolean {
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

// Fix 5: Seller detection — reject engagers whose headline screams "I sell this".
// Sellers commonly engage with competitors' posts to fish for clients; they are NOT buyers.
const SELLER_PHRASES = [
  'we help', 'our agency', 'our services', 'book a call',
  'check out our', 'dm me for', 'link in bio', 'we offer',
  'our clients', 'free consultation', 'i help companies',
  'we specialize in', 'we work with', 'helping companies',
];
function isSeller(postText: string, authorHeadline: string): boolean {
  const text = ((postText || '') + ' ' + (authorHeadline || '')).toLowerCase();
  return SELLER_PHRASES.some(p => text.includes(p));
}
function normalizeProfile(item: any): any {
  if (!item.first_name && item.name) { const parts = item.name.split(' '); item.first_name = parts[0]; item.last_name = parts.slice(1).join(' ') || ''; }
  return item;
}
async function fetchProfileIfNeeded(item: any,accountId: string,apiKey: string,dsn: string): Promise<any|null>{
  const norm = normalizeProfile({ ...item });
  if(norm.first_name&&(norm.headline||norm.title)) return norm;
  const id=item.public_identifier||item.provider_id||item.public_id||item.author_id;
  const numericOrUrn=item.id;
  const fetchId=id||(numericOrUrn&&!String(numericOrUrn).startsWith('urn:')&&!String(numericOrUrn).startsWith('ACo')?numericOrUrn:null);
  if(!fetchId) return norm.first_name?norm:null;
  try{const res=await unipileGet(`/api/v1/linkedin/profile/${fetchId}?account_id=${accountId}`,apiKey,dsn);if(!res.ok){await res.text();return norm.first_name?norm:null;}return normalizeProfile(await res.json());}catch{return norm.first_name?norm:null;}
}
function delay(ms: number){return new Promise(r=>setTimeout(r,ms));}

async function ensureList(sb: any,uid: string,ln: string,aid: string): Promise<string|null>{
  const{data:e}=await sb.from('lists').select('id, source_agent_id').eq('user_id',uid).eq('name',ln).limit(1);
  if(e?.length>0) {
    if(!e[0].source_agent_id) await sb.from('lists').update({source_agent_id:aid}).eq('id',e[0].id);
    return e[0].id;
  }
  const{data:c,error}=await sb.from('lists').insert({user_id:uid,name:ln,source_agent_id:aid}).select('id').single();
  if(error){console.error(`Create list error: ${error.message}`);return null;} return c?.id||null;
}
// Rule 3 (Hard Skip): returns 'exists' if profile already in contacts, 'inserted' on success, 'failed' otherwise
async function insertContact(sb: any,p: any,uid: string,aid: string,ln: string,m: MatchResult,signal: string,spu: string|null,icp?: ICPFilters): Promise<'inserted'|'exists'|'failed'>{
  const lpid=p.public_id||p.public_identifier||p.provider_id||p.id; if(!lpid) return 'failed';
  const{data:ex}=await sb.from('contacts').select('id').eq('user_id',uid).eq('linkedin_profile_id',lpid).limit(1);
  if(ex?.length>0) return 'exists';
  const fn=p.first_name||p.name?.split(' ')[0]||'Unknown'; const lnn=p.last_name||p.name?.split(' ').slice(1).join(' ')||'';
  const hl=p.headline||p.title||'';
  const ei: ICPFilters={jobTitles:[],industries:[],locations:[],companySizes:[],companyTypes:[],excludeKeywords:[],competitorCompanies:[],restrictedCountries:[],restrictedRoles:[]};
  const rt=classifyContact(m,icp||ei,hl)||'cold';
  const sa=true;const sb2=m.score>=60;const sc=m.score>=80;const as=Math.min(3,[sa,sb2,sc].filter(Boolean).length);
  const{data:ins,error}=await sb.from('contacts').insert({
    user_id:uid,first_name:fn,last_name:lnn,title:p.headline||p.title||null,company:p.company||p.current_company?.name||null,
    linkedin_url:p.linkedin_url||p.public_url||p.profile_url||(lpid?`https://www.linkedin.com/in/${lpid}`:null),
    linkedin_profile_id:lpid,source_campaign_id:null,signal,signal_post_url:spu,ai_score:as,
    signal_a_hit:sa,signal_b_hit:sb2,signal_c_hit:sc,email_enriched:false,list_name:ln,
    company_icon_color:['orange','blue','green','purple','pink','gray'][Math.floor(Math.random()*6)],relevance_tier:rt,
  }).select('id').single();
  if(error){console.error(`Insert contact error: ${error.message}`);return 'failed';}
  if(ins?.id&&ln){const lid=await ensureList(sb,uid,ln,aid);if(lid) await sb.from('contact_lists').insert({contact_id:ins.id,list_id:lid});}
  return 'inserted';
}

// ─── Quick ICP headline pre-filter (saves Unipile profile bandwidth) ─────────

const QUICK_REJECT_TITLES = ['student','intern','freelance','looking for work','job seeker','fresher','trainee','apprentice'];

// Mode-aware pre-filter (mirrors signal-competitor).
function engagerPreFilter(headline: string | undefined, icp: ICPFilters, isHighPrecision: boolean): 'strong_pass' | 'pass' | 'reject' {
  const hl = (headline || '').toLowerCase();
  const NEVER_BUYERS = ['intern','student','junior','trainee','apprentice','graduate','assistant','coordinator','administrator','receptionist','support agent','data entry'];
  if (hl && NEVER_BUYERS.some(r => hl.includes(r))) return 'reject';
  if (!headline) return 'pass';

  if (hasBuyingIntent(hl)) return 'strong_pass';
  if (icp.jobTitles.length > 0) {
    const titleMatch = icp.jobTitles.some(t => { const n = t.toLowerCase().trim(); return n.length >= 3 && hl.includes(n); });
    if (titleMatch) return 'strong_pass';
  }

  if (isHighPrecision) {
    if (QUICK_REJECT_TITLES.some(t => hl.includes(t))) return 'reject';
    if (isClearlyIrrelevant(hl)) return 'reject';
    if (icp.jobTitles.length > 0 && hl.length > 5) return 'reject';
    return 'pass';
  }

  const SENIORITY = ['founder','co-founder','owner','director','head of','vp','vice president','chief','ceo','cto','cmo','coo','president','partner','principal','lead','manager','senior','sr.','general manager','managing director'];
  if (SENIORITY.some(s => hl.includes(s))) return 'pass';
  const DEPTS = ['sales','revenue','growth','marketing','business development','bd','account','partnerships','operations','product','strategy','commercial','customer success','go-to-market'];
  if (DEPTS.some(d => hl.includes(d))) return 'pass';
  if (icp.industries.some(ind => ind && hl.includes(ind.toLowerCase()))) return 'pass';
  return 'reject';
}

// ─── Main: scans engagers on your own LinkedIn posts ──────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const {
      agent_id,
      account_id,
      user_id,
      list_name,
      linkedin_id,
      icp: icpRaw,
      competitor_companies,
      profile_urls,
      run_own_posts = true,
      run_profile_engagers = true,
      run_id,
      task_key,
      signal_type = 'post_engagers',
      precision_mode,
    } = await req.json();
    const START = Date.now();
    const MAX_RUNTIME_MS = 105_000;
    const hasTime = () => Date.now() - START < MAX_RUNTIME_MS;

    if (!agent_id || !account_id) {
      return new Response(JSON.stringify({ leads: 0, error: 'Missing required params' }), { status: 400, headers: corsHeaders });
    }

    const UNIPILE_API_KEY = Deno.env.get('UNIPILE_API_KEY')!;
    const UNIPILE_DSN = Deno.env.get('UNIPILE_DSN')!;
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const icp: ICPFilters = {
      jobTitles: icpRaw?.jobTitles||[], industries: icpRaw?.industries||[], locations: icpRaw?.locations||[],
      companySizes: icpRaw?.companySizes||[], companyTypes: icpRaw?.companyTypes||[],
      excludeKeywords: icpRaw?.excludeKeywords||[], competitorCompanies: competitor_companies||[],
    };
    const isHighPrecision = precision_mode === 'high_precision';

    // Lightweight rejected-profile collector for AI suggestions (cap 200/task)
    const rejectedProfiles: Array<{ headline: string; industry: string; company: string; companyIndustry: string; rejectionReason: string; signalType: string; }> = [];
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

    let inserted = 0;
    let hotWarmCount = 0; let coldCount = 0;
    const COLD_CAP = 0.2;
    function canInsertCold() { const total = hotWarmCount + coldCount; return total === 0 || coldCount / (total + 1) < COLD_CAP; }

    const diag: Record<string, number> = {
      own_posts_scanned: 0, profile_urls_scanned: 0, profile_posts_scanned: 0,
      reactions_fetched: 0, comments_fetched: 0, total_engagers_raw: 0,
      failed_quick_icp: 0, strong_passes: 0, profiles_fetched: 0,
      excluded_no_icp_match: 0, excluded_competitor: 0, rejected_seller: 0,
      already_in_contacts: 0, cold_capped: 0, inserted: 0, bytes_fetched_estimate: 0,
      precision_mode: (precision_mode || 'discovery') as any,
      discovery_passed: 0, discovery_rejected: 0, hp_passed: 0, hp_rejected: 0,
    };

    // Bandwidth ceiling (matches competitor function for symmetry)
    const PROFILE_FETCH_CAP = 80;
    let weakFetches = 0;
    const hasBudget = (pf: 'strong_pass' | 'pass') => pf === 'strong_pass' || weakFetches < PROFILE_FETCH_CAP;
    const trackFetch = (pf: 'strong_pass' | 'pass') => {
      diag.profiles_fetched++;
      if (pf === 'pass') weakFetches++;
      diag.bytes_fetched_estimate += 30_000;
    };

    console.log(`[POST_ENG] run_own_posts=${run_own_posts}, run_profile_engagers=${run_profile_engagers}, profile_urls=${profile_urls?.length || 0}`);
    console.log('[ICP_LOGIC_VERSION]', 'OR_LOGIC_V2_post_engagers');
    console.log('[FIX2_DEPLOYED]', { signal: signal_type, file: 'signal-post-engagers', profileUrlCount: profile_urls?.length || 0 });

    // Fix 2: sanitize profile_urls ONCE before any Unipile call
    const rawProfileUrls: string[] = Array.isArray(profile_urls) ? profile_urls.filter(Boolean) : [];
    const sanitizedProfileUrls: string[] = rawProfileUrls.map(sanitizeLinkedinUrl).filter(Boolean);
    rawProfileUrls.forEach((raw, i) => {
      const sanitized = sanitizedProfileUrls[i];
      console.log('[URL_CHECK]', JSON.stringify({
        original: raw,
        sanitized,
        areTheyDifferent: raw !== sanitized,
        signal: 'post_engagers',
      }));
    });

    // Resolve user's LinkedIn ID if not provided
    let userLiId = linkedin_id;
    if (!userLiId) {
      try {
        const meEp = `/api/v1/users/me?account_id=${account_id}`;
        const res = await unipileGet(meEp, UNIPILE_API_KEY, UNIPILE_DSN);
        if (res.ok) { const d = await res.json(); userLiId = d.provider_id || d.public_id || d.id; }
        else {
          const me2Ep = `/api/v1/linkedin/profile/me?account_id=${account_id}`;
          const res2 = await unipileGet(me2Ep, UNIPILE_API_KEY, UNIPILE_DSN);
          if (res2.ok) { const d2 = await res2.json(); userLiId = d2.provider_id || d2.public_id || d2.id; }
          else {
            const txt = await res2.text();
            console.error('[UNIPILE_ZERO]', JSON.stringify({ endpoint: me2Ep, status: res2.status, rawResponse: txt.substring(0, 1000), params: '{}' }));
          }
        }
      } catch (e) { console.error('resolveUserLinkedInId:', e); }
    }

    if (run_own_posts && userLiId) {
      // Scan own posts
      const ownPostsEp = `/api/v1/users/${userLiId}/posts?account_id=${account_id}&limit=5`;
      const postsRes = await unipileGet(ownPostsEp, UNIPILE_API_KEY, UNIPILE_DSN);
      if (postsRes.ok) {
        const postsData = await postsRes.json();
        const posts = (postsData.items || postsData.posts || []).slice(0, 5);
        diag.own_posts_scanned = posts.length;
        diag.bytes_fetched_estimate += 20_000;
        console.log(`[POST_ENG] own_posts: ${posts.length}`);
        if (posts.length === 0) {
          console.error('[UNIPILE_ZERO]', JSON.stringify({
            endpoint: ownPostsEp,
            status: postsRes.status,
            rawResponse: JSON.stringify(postsData).substring(0, 1000),
            params: JSON.stringify({ userLiId, account_id, limit: 5 }),
          }));
        }

        for (const post of posts) {
          if (!hasTime()) break;
          await delay(150);
          const postId = post.social_id || post.id || post.provider_id;
          if (!postId) continue;
          const reactionsEp = `/api/v1/posts/${postId}/reactions?account_id=${account_id}&limit=25`;
          const rr = await unipileGet(reactionsEp, UNIPILE_API_KEY, UNIPILE_DSN);
          if (!rr.ok) {
            const txt = await rr.text();
            console.error('[UNIPILE_ZERO]', JSON.stringify({ endpoint: reactionsEp, status: rr.status, rawResponse: txt.substring(0, 1000), params: JSON.stringify({ postId }) }));
            continue;
          }
          const rd = await rr.json();
          const engagers = (rd.items || []).slice(0, 25);
          if (engagers.length === 0) {
            console.error('[UNIPILE_ZERO]', JSON.stringify({
              endpoint: reactionsEp, status: rr.status,
              rawResponse: JSON.stringify(rd).substring(0, 1000),
              params: JSON.stringify({ postId }),
            }));
          }
          diag.reactions_fetched += engagers.length;
          diag.total_engagers_raw += engagers.length;
          diag.bytes_fetched_estimate += 25_000;
          const postUrl = post.url || post.share_url || post.permalink || `https://www.linkedin.com/feed/update/${postId}`;
          const postText = post.text || post.commentary || '';
          const snippet = postText.length > 50 ? postText.slice(0, 47) + '...' : postText;

          for (const engager of engagers) {
            if (!hasTime()) break;
            const profile = engager.author || engager;
            const quickHl = profile.headline || profile.title || '';
            const pf = engagerPreFilter(quickHl, icp, isHighPrecision);
            if (pf === 'reject') { diag.failed_quick_icp++; if (isHighPrecision) diag.hp_rejected++; else diag.discovery_rejected++; continue; }
            if (isHighPrecision) diag.hp_passed++; else diag.discovery_passed++;
            if (pf === 'strong_pass') diag.strong_passes++;
            if (!hasBudget(pf)) { console.log(`[POST_ENG] own_posts budget reached`); break; }
            const fullProfile = await fetchProfileIfNeeded(profile, account_id, UNIPILE_API_KEY, UNIPILE_DSN);
            trackFetch(pf);
            if (!fullProfile) continue;
            const match = scoreProfileAgainstICP(fullProfile, icp);
            const hl = fullProfile.headline || fullProfile.title || '';
            if (!matchesTitleOrIndustry(match, icp, hl)) { diag.excluded_no_icp_match++; captureRejected(fullProfile, 'icp_match_failed'); continue; }
            if (isExcluded(fullProfile, icp.excludeKeywords, icp.competitorCompanies)) { diag.excluded_competitor++; continue; }
            // Fix 5: seller filter — reject engagers whose headline screams "I sell this"
            if (isSeller(postText, hl)) { diag.rejected_seller++; continue; }
            const cls = classifyContact(match, icp, hl);
            if (cls === 'cold' && !canInsertCold()) { diag.cold_capped++; continue; }
            const signal = snippet ? `Reacted to your post: "${snippet}"` : 'Reacted to your post';
            const result = await insertContact(supabase, fullProfile, user_id, agent_id, list_name, match, signal, postUrl, icp);
            if (result === 'exists') { diag.already_in_contacts++; continue; }
            if (result === 'inserted') { inserted++; diag.inserted++; if (cls === 'cold') coldCount++; else hotWarmCount++; }
          }
        }
      } else { await postsRes.text(); console.log('[POST_ENG] failed to fetch own posts'); }
    }

    // Also scan profile_engagers (influencer profiles) if provided — use SANITIZED urls (Fix 2)
    if (run_profile_engagers && sanitizedProfileUrls.length > 0) {
      function extractLinkedInId(url: string): string|null { if(!url) return null; const m=url.match(/linkedin\.com\/(?:company|in)\/([^/?]+)/); if(m) return m[1]; return url.replace(/^https?:\/\//,'').replace(/\/$/,'')||null; }
      function extractCompanyName(url: string): string|null { const id=extractLinkedInId(url); if(!id) return null; return id.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase()); }

      for (const url of sanitizedProfileUrls) {
        if (!hasTime()) break;
        await delay(150);
        const profileId = extractLinkedInId(url);
        if (!profileId) {
          console.error('[POST_ENG] Could not extract profileId from', url);
          continue;
        }
        diag.profile_urls_scanned++;
        const isCompany = url.includes('/company/');
        const ep = isCompany ? `/api/v1/users/${profileId}/posts?account_id=${account_id}&is_company=true&limit=10` : `/api/v1/users/${profileId}/posts?account_id=${account_id}&limit=10`;
        try {
          const pr = await unipileGet(ep, UNIPILE_API_KEY, UNIPILE_DSN);
          if (!pr.ok) {
            const txt = await pr.text();
            console.error('[UNIPILE_ZERO]', JSON.stringify({ endpoint: ep, status: pr.status, rawResponse: txt.substring(0, 1000), params: JSON.stringify({ profileId, isCompany, url }) }));
            continue;
          }
          const pd = await pr.json();
          const posts = (pd.items || pd.posts || []).slice(0, 10);
          if (posts.length === 0) {
            console.error('[UNIPILE_ZERO]', JSON.stringify({
              endpoint: ep, status: pr.status,
              rawResponse: JSON.stringify(pd).substring(0, 1000),
              params: JSON.stringify({ profileId, isCompany, url }),
            }));
          }
          diag.profile_posts_scanned += posts.length;
          diag.bytes_fetched_estimate += 20_000;
          let profileName = isCompany ? (extractCompanyName(url)||profileId) : profileId;
          if (!isCompany) { try { const r = await unipileGet(`/api/v1/linkedin/profile/${profileId}?account_id=${account_id}`, UNIPILE_API_KEY, UNIPILE_DSN); if(r.ok){const d=await r.json();profileName=[d.first_name,d.last_name].filter(Boolean).join(' ')||profileId;}else await r.text(); } catch(_){} }
          console.log(`[POST_ENG] profile_engagers "${profileName}" (${url}): ${posts.length} posts`);
          for (const post of posts) {
            if (!hasTime()) break;
            await delay(150);
            const postId = post.social_id||post.id||post.provider_id; if (!postId) continue;
            // Fetch both reactions AND comments
            const reactionsEp = `/api/v1/posts/${postId}/reactions?account_id=${account_id}&limit=50`;
            const commentsEp = `/api/v1/posts/${postId}/comments?account_id=${account_id}&limit=30`;
            const [rr, cr] = await Promise.all([
              unipileGet(reactionsEp, UNIPILE_API_KEY, UNIPILE_DSN),
              unipileGet(commentsEp, UNIPILE_API_KEY, UNIPILE_DSN),
            ]);
            const engagers: any[] = [];
            if (rr.ok) {
              const rd = await rr.json();
              const items = (rd.items||[]).slice(0, 50);
              if (items.length === 0) console.error('[UNIPILE_ZERO]', JSON.stringify({ endpoint: reactionsEp, status: rr.status, rawResponse: JSON.stringify(rd).substring(0, 1000), params: JSON.stringify({ postId }) }));
              engagers.push(...items);
              diag.reactions_fetched += items.length;
            } else {
              const txt = await rr.text();
              console.error('[UNIPILE_ZERO]', JSON.stringify({ endpoint: reactionsEp, status: rr.status, rawResponse: txt.substring(0, 1000), params: JSON.stringify({ postId }) }));
            }
            if (cr.ok) {
              const cd = await cr.json();
              const items = (cd.items||[]).slice(0, 30);
              if (items.length === 0) console.error('[UNIPILE_ZERO]', JSON.stringify({ endpoint: commentsEp, status: cr.status, rawResponse: JSON.stringify(cd).substring(0, 1000), params: JSON.stringify({ postId }) }));
              engagers.push(...items.map((c: any) => c.author || c));
              diag.comments_fetched += items.length;
            } else {
              const txt = await cr.text();
              console.error('[UNIPILE_ZERO]', JSON.stringify({ endpoint: commentsEp, status: cr.status, rawResponse: txt.substring(0, 1000), params: JSON.stringify({ postId }) }));
            }
            diag.total_engagers_raw += engagers.length;
            diag.bytes_fetched_estimate += 25_000 * 2;
            const postUrl = post.url||post.share_url||post.permalink||`https://www.linkedin.com/feed/update/${postId}`;
            const postText2 = post.text || post.commentary || '';
            for (const engager of engagers) {
              if (!hasTime()) break;
              const ep2 = engager.author||engager;
              const quickHl = ep2.headline || ep2.title || '';
              const pf = engagerPreFilter(quickHl, icp, isHighPrecision);
              if (pf === 'reject') { diag.failed_quick_icp++; if (isHighPrecision) diag.hp_rejected++; else diag.discovery_rejected++; continue; }
              if (isHighPrecision) diag.hp_passed++; else diag.discovery_passed++;
              if (pf === 'strong_pass') diag.strong_passes++;
              if (!hasBudget(pf)) { console.log(`[POST_ENG] profile_engagers budget reached`); break; }
              const fp = await fetchProfileIfNeeded(ep2, account_id, UNIPILE_API_KEY, UNIPILE_DSN);
              trackFetch(pf);
              if (!fp) continue;
              const match = scoreProfileAgainstICP(fp, icp);
              const hl = fp.headline||fp.title||'';
              if (!matchesTitleOrIndustry(match, icp, hl)) { diag.excluded_no_icp_match++; captureRejected(fp, 'icp_match_failed'); continue; }
              if (isExcluded(fp, icp.excludeKeywords, icp.competitorCompanies)) { diag.excluded_competitor++; continue; }
              // Fix 5: seller filter
              if (isSeller(postText2, hl)) { diag.rejected_seller++; continue; }
              const cls2 = classifyContact(match, icp, hl);
              if (cls2 === 'cold' && !canInsertCold()) { diag.cold_capped++; continue; }
              const result = await insertContact(supabase, fp, user_id, agent_id, list_name, match, `Engaged with ${profileName}'s post`, postUrl, icp);
              if (result === 'exists') { diag.already_in_contacts++; continue; }
              if (result === 'inserted') { inserted++; diag.inserted++; if (cls2 === 'cold') coldCount++; else hotWarmCount++; }
            }
          }
        } catch(e) { console.error(`[POST_ENG] Profile engagers ${url}:`, e); }
      }
    }

    console.log(`[POST_ENG] ${inserted} leads total (${Math.round((Date.now()-START)/1000)}s)`);
    console.log(`[POST_ENG] diag: ${JSON.stringify(diag)}`);
    console.log('[TASK_FINAL_SUMMARY]', JSON.stringify({
      signal: 'post_engagers',
      rawFetched: diag.total_engagers_raw,
      profilesFetched: diag.profiles_fetched,
      passedPrefilter: diag.strong_passes,
      passedICP: diag.inserted + diag.excluded_competitor + diag.cold_capped,
      inserted: diag.inserted,
      already_in_contacts: diag.already_in_contacts,
      rejected_seller: diag.rejected_seller,
      ownPostsScanned: diag.own_posts_scanned,
      profileUrlsScanned: diag.profile_urls_scanned,
      profilePostsScanned: diag.profile_posts_scanned,
      rejections: {
        failedQuickIcp: diag.failed_quick_icp,
        noIcpMatch: diag.excluded_no_icp_match,
        competitorOrExcluded: diag.excluded_competitor,
        rejectedSeller: diag.rejected_seller,
        alreadyInContacts: diag.already_in_contacts,
        coldCapped: diag.cold_capped,
      },
    }));

    // Save diagnostics to task record if run_id/task_key provided
    if (run_id && task_key) {
      try {
        await supabase.from('signal_agent_tasks')
          .update({ diagnostics: diag, rejected_profiles_sample: rejectedProfiles } as any)
          .eq('run_id', run_id).eq('task_key', task_key);
      } catch (e) { console.warn(`[POST_ENG] Failed to save diagnostics:`, e); }
    }

    return new Response(JSON.stringify({ leads: inserted }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('signal-post-engagers error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error', leads: 0 }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

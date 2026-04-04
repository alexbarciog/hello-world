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
  if (!normalizedValue || !normalizedCompany) return false;
  return normalizedValue.includes(normalizedCompany) || normalizedCompany.includes(normalizedValue);
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

// Signal-aware classification: competitor leads get "warm" minimum
function classifyContactWithSignalBoost(m: MatchResult, icp: ICPFilters, hl?: string, signalBoost?: 'warm' | null): 'hot'|'warm'|'cold'|null {
  const h=hl||''; if(isClearlyIrrelevant(h)) return null;
  if(icp.jobTitles.length>0&&m.titleMatch) return 'hot';
  if(hasBuyingIntent(h)&&(icp.industries.length===0||m.industryMatch)) return 'hot';
  if(hasBuyingIntent(h)) return 'warm';
  if(icp.industries.length>0&&m.industryMatch&&h.length>5) return 'warm';
  // Signal boost: competitor followers/engagers get minimum warm
  if (signalBoost === 'warm' && h.length > 5) return 'warm';
  if(h.length>5) return 'cold';
  if(icp.jobTitles.length===0&&icp.industries.length===0) return 'cold';
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

async function ensureList(sb: any,uid: string,ln: string,aid: string): Promise<string|null>{
  const{data:e}=await sb.from('lists').select('id, source_agent_id').eq('user_id',uid).eq('name',ln).limit(1);
  if(e?.length>0) {
    if(!e[0].source_agent_id) await sb.from('lists').update({source_agent_id:aid}).eq('id',e[0].id);
    return e[0].id;
  }
  const{data:c,error}=await sb.from('lists').insert({user_id:uid,name:ln,source_agent_id:aid}).select('id').single();
  if(error){console.error(`Create list error: ${error.message}`);return null;} return c?.id||null;
}

// Updated insertContact with signal boost support
async function insertContact(sb: any,p: any,uid: string,aid: string,ln: string,m: MatchResult,signal: string,spu: string|null,icp?: ICPFilters, signalBoost?: 'warm' | null): Promise<'inserted' | 'duplicate' | 'rejected'>{
  const lpid=p.public_id||p.public_identifier||p.provider_id||p.id; if(!lpid) return 'rejected';
  const{data:ex}=await sb.from('contacts').select('id').eq('user_id',uid).eq('linkedin_profile_id',lpid).limit(1);
  if(ex?.length>0) return 'duplicate';
  const fn=p.first_name||p.name?.split(' ')[0]||'Unknown'; const lnn=p.last_name||p.name?.split(' ').slice(1).join(' ')||'';
  const hl=p.headline||p.title||'';
  const ei: ICPFilters={jobTitles:[],industries:[],locations:[],companySizes:[],companyTypes:[],excludeKeywords:[],competitorCompanies:[]};
  const rt=classifyContactWithSignalBoost(m,icp||ei,hl,signalBoost)||'cold';
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

// ─── Main Handler: handles both competitor_followers and competitor_engagers ──

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { agent_id, account_id, user_id, list_name, signal_type, urls, icp: icpRaw, competitor_companies, user_company_name } = await req.json();
    const START = Date.now();
    const MAX_RUNTIME_MS = 105_000;
    const hasTime = () => Date.now() - START < MAX_RUNTIME_MS;

    if (!agent_id || !account_id || !urls?.length || !signal_type) {
      return new Response(JSON.stringify({ leads: 0, error: 'Missing required params' }), { status: 400, headers: corsHeaders });
    }

    const UNIPILE_API_KEY = Deno.env.get('UNIPILE_API_KEY')!;
    const UNIPILE_DSN = Deno.env.get('UNIPILE_DSN')!;
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const ownCompanyLower = (user_company_name || '').toLowerCase().trim();

    const icp: ICPFilters = {
      jobTitles: icpRaw?.jobTitles||[], industries: icpRaw?.industries||[], locations: icpRaw?.locations||[],
      companySizes: icpRaw?.companySizes||[], companyTypes: icpRaw?.companyTypes||[],
      excludeKeywords: icpRaw?.excludeKeywords||[], competitorCompanies: competitor_companies||[],
    };

    let inserted = 0;
    // NO cold cap — AI filter + exclusion logic are sufficient gatekeepers

    // Helper: process a single person (used by both followers and engagers)
    async function processPerson(person: any, signal: string, signalUrl: string): Promise<'inserted' | 'duplicate' | 'rejected' | 'excluded' | 'irrelevant' | 'skipped'> {
      // Extract ID for early dedup
      const rawId = extractLinkedinProfileId(person);

      // EARLY DEDUP: check contacts table BEFORE expensive profile fetch
      if (rawId) {
        const { data: existing } = await supabase.from('contacts').select('id').eq('user_id', user_id).eq('linkedin_profile_id', rawId).limit(1);
        if (existing && existing.length > 0) return 'duplicate';
      }

      // Now fetch full profile
      const fp = await fetchFullProfile(person, account_id, UNIPILE_API_KEY, UNIPILE_DSN);
      if (!fp || !fp.first_name) return 'skipped';

      // Reject LinkedIn Member (private profiles)
      if ((fp.first_name||'').toLowerCase() === 'linkedin' && (fp.last_name||'').toLowerCase() === 'member') return 'skipped';

      const lpid = fp.public_id || fp.public_identifier || fp.provider_id || fp.id;

      // Re-check dedup with resolved ID (may differ from raw ID)
      if (lpid && lpid !== rawId) {
        const { data: existing } = await supabase.from('contacts').select('id').eq('user_id', user_id).eq('linkedin_profile_id', lpid).limit(1);
        if (existing && existing.length > 0) return 'duplicate';
      }

      // Own-company exclusion
      if (ownCompanyLower && ownCompanyLower.length > 1 && worksAtCompany(fp, ownCompanyLower)) {
        console.log(`[PIPELINE] ⏭ ${lpid}: excluded (own company)`);
        return 'excluded';
      }

      // Competitor employee exclusion
      if (isExcluded(fp, icp.excludeKeywords, icp.competitorCompanies)) {
        console.log(`[PIPELINE] ⏭ ${lpid}: excluded (competitor employee)`);
        return 'excluded';
      }

      // Check clearly irrelevant titles (interns, students, devs)
      const hl = fp.headline || fp.title || '';
      if (isClearlyIrrelevant(hl)) {
        console.log(`[PIPELINE] ⏭ ${lpid}: irrelevant title "${hl.slice(0,50)}"`);
        return 'irrelevant';
      }

      // NO industry gate — competitor followers/engagers are inherently relevant
      // NO cold cap — signal boost ensures they're warm minimum

      const match = scoreProfileAgainstICP(fp, icp);
      // Signal boost: competitor signals get minimum "warm"
      const result = await insertContact(supabase, fp, user_id, agent_id, list_name, match, signal, signalUrl, icp, 'warm');
      if (result === 'inserted') {
        const tier = classifyContactWithSignalBoost(match, icp, hl, 'warm') || 'warm';
        console.log(`[PIPELINE] ✅ ${lpid}: inserted as ${tier}`);
      }
      return result;
    }

    if (signal_type === 'competitor_followers') {
      for (const url of urls) {
        if (!hasTime()) break;
        await delay(150);
        const companyName = extractCompanyName(url);
        const isCompanyUrl = url.includes('/company/');
        const isPersonUrl = url.includes('/in/');

        if (isCompanyUrl && companyName) {
          console.log(`competitor_followers: searching "${companyName}" with pagination`);
          try {
            const allPeople: any[] = [];
            let cursor: string | null = null;
            const MAX_PAGES = 3;
            for (let page = 0; page < MAX_PAGES && hasTime(); page++) {
              const searchBody: any = { api: 'classic', category: 'people', keywords: companyName, limit: 30 };
              if (cursor) searchBody.cursor = cursor;
              const res = await fetch(`https://${UNIPILE_DSN}/api/v1/linkedin/search?account_id=${account_id}`, {
                method: 'POST',
                headers: { 'X-API-KEY': UNIPILE_API_KEY, 'Content-Type': 'application/json' },
                body: JSON.stringify(searchBody),
              });
              if (!res.ok) {
                const errText = await res.text();
                console.error(`competitor_followers search "${companyName}" page ${page+1}: HTTP ${res.status} - ${errText.slice(0, 200)}`);
                break;
              }
              const data = await res.json();
              const people = data.items || data.results || [];
              allPeople.push(...people);
              console.log(`"${companyName}" page ${page+1}: ${people.length} people (total: ${allPeople.length})`);
              cursor = data.cursor || data.next_cursor || null;
              if (!cursor || people.length === 0) break;
              await delay(200);
            }
            console.log(`"${companyName}": ${allPeople.length} total people found`);

            let stats = { inserted: 0, duplicate: 0, excluded: 0, irrelevant: 0, skipped: 0, rejected: 0 };
            for (const person of allPeople) {
              if (!hasTime()) break;
              await delay(200);
              const result = await processPerson(person, `Follows ${companyName}`, url);
              stats[result]++;
              if (result === 'inserted') inserted++;
            }
            console.log(`competitor_followers "${companyName}": ${JSON.stringify(stats)}`);
          } catch (e) { console.error(`Competitor followers ${url}:`, e); }
        }

        if (isPersonUrl) {
          const profileId = extractLinkedInId(url);
          if (!profileId) continue;
          try {
            const postsRes = await unipileGet(`/api/v1/users/${profileId}/posts?account_id=${account_id}&limit=10`, UNIPILE_API_KEY, UNIPILE_DSN);
            if (!postsRes.ok) { await postsRes.text(); continue; }
            const postsData = await postsRes.json();
            const posts = (postsData.items || postsData.posts || []).slice(0, 10);
            let profileName = profileId;
            try { const pr = await unipileGet(`/api/v1/linkedin/profile/${profileId}?account_id=${account_id}`, UNIPILE_API_KEY, UNIPILE_DSN); if(pr.ok){ const pd=await pr.json(); profileName=[pd.first_name,pd.last_name].filter(Boolean).join(' ')||profileId; } else await pr.text(); } catch(_){}
            console.log(`competitor profile "${profileName}": ${posts.length} posts`);
            for (const post of posts) {
              if (!hasTime()) break;
              await delay(150);
              const postId = post.social_id||post.id||post.provider_id; if (!postId) continue;
              const [rr, cr] = await Promise.all([
                unipileGet(`/api/v1/posts/${postId}/reactions?account_id=${account_id}&limit=50`, UNIPILE_API_KEY, UNIPILE_DSN),
                unipileGet(`/api/v1/posts/${postId}/comments?account_id=${account_id}&limit=30`, UNIPILE_API_KEY, UNIPILE_DSN),
              ]);
              const engagers: any[] = [];
              if (rr.ok) { const rd = await rr.json(); engagers.push(...(rd.items||[]).slice(0, 50)); } else { await rr.text(); }
              if (cr.ok) { const cd = await cr.json(); engagers.push(...(cd.items||[]).slice(0, 30).map((c: any) => c.author || c)); } else { await cr.text(); }
              const postUrl = post.url||post.share_url||post.permalink||`https://www.linkedin.com/feed/update/${postId}`;
              for (const engager of engagers) {
                if (!hasTime()) break;
                const ep = engager.author||engager;
                const result = await processPerson(ep, `Engaged with ${profileName}'s content`, postUrl);
                if (result === 'inserted') inserted++;
              }
            }
          } catch(e) { console.error(`Profile engagers ${url}:`, e); }
        }
      }
    } else if (signal_type === 'competitor_engagers') {
      for (const url of urls) {
        if (!hasTime()) break;
        await delay(150);
        const companyId = extractLinkedInId(url);
        const companyName = extractCompanyName(url);
        const isCompany = url.includes('/company/');
        const isPersonUrl = url.includes('/in/');
        if (!companyId) continue;

        try {
          let posts: any[] = [];

          if (isPersonUrl) {
            console.log(`[DEBUG] competitor_engagers fetching posts for person: ${companyId}`);
            const postsRes = await unipileGet(`/api/v1/users/${companyId}/posts?account_id=${account_id}&limit=10`, UNIPILE_API_KEY, UNIPILE_DSN);
            if (postsRes.ok) {
              const postsData = await postsRes.json();
              posts = (postsData.items || postsData.posts || []).slice(0, 10);
            } else {
              const errText = await postsRes.text();
              console.error(`competitor_engagers person "${companyId}": HTTP ${postsRes.status} - ${errText.slice(0, 200)}`);
            }
          }

          if (isCompany) {
            console.log(`[DEBUG] competitor_engagers fetching posts from company page: ${companyId}`);
            let cursor: string | null = null;
            for (let page = 0; page < 3 && hasTime(); page++) {
              let fetchUrl = `/api/v1/users/${companyId}/posts?account_id=${account_id}&limit=20`;
              if (cursor) fetchUrl += `&cursor=${encodeURIComponent(cursor)}`;
              const postsRes = await unipileGet(fetchUrl, UNIPILE_API_KEY, UNIPILE_DSN);
              if (!postsRes.ok) {
                const errText = await postsRes.text();
                console.error(`competitor_engagers company "${companyId}" page ${page+1}: HTTP ${postsRes.status} - ${errText.slice(0, 200)}`);
                break;
              }
              const postsData = await postsRes.json();
              const items = postsData.items || postsData.posts || [];
              posts.push(...items);
              console.log(`competitor_engagers company "${companyId}" page ${page+1}: ${items.length} posts (total: ${posts.length})`);
              cursor = postsData.cursor || postsData.next_cursor || null;
              if (!cursor || items.length === 0) break;
              await delay(200);
            }
          }

          posts = posts
            .sort((a: any, b: any) => ((b.likes_count||0)+(b.comments_count||0)) - ((a.likes_count||0)+(a.comments_count||0)))
            .slice(0, 20);
          console.log(`competitor_engagers "${companyName||companyId}": processing ${posts.length} posts for engagers`);

          for (const post of posts) {
            if (!hasTime()) break;
            await delay(150);
            const postId = post.social_id||post.id||post.provider_id; if (!postId) { console.log(`[PIPELINE] ⏭ post skipped: no ID`); continue; }
            const [rr, cr2] = await Promise.all([
              unipileGet(`/api/v1/posts/${postId}/reactions?account_id=${account_id}&limit=50`, UNIPILE_API_KEY, UNIPILE_DSN),
              unipileGet(`/api/v1/posts/${postId}/comments?account_id=${account_id}&limit=30`, UNIPILE_API_KEY, UNIPILE_DSN),
            ]);
            const engagers: any[] = [];
            if (rr.ok) { const rd = await rr.json(); engagers.push(...(rd.items||[]).slice(0, 50)); } else { const t = await rr.text(); console.error(`reactions ${postId}: HTTP ${rr.status} - ${t.slice(0,200)}`); }
            if (cr2.ok) { const cd = await cr2.json(); engagers.push(...(cd.items||[]).slice(0, 30).map((c: any) => c.author || c)); } else { const t = await cr2.text(); console.error(`comments ${postId}: HTTP ${cr2.status} - ${t.slice(0,200)}`); }
            console.log(`competitor_engagers post ${postId}: ${engagers.length} engagers`);
            const postUrl = post.url||post.share_url||post.permalink||`https://www.linkedin.com/feed/update/${postId}`;

            for (const engager of engagers) {
              if (!hasTime()) break;
              const ep = engager.author||engager;
              const signal = `Engaged with ${companyName||companyId}'s post`;
              const result = await processPerson(ep, signal, postUrl);
              if (result === 'inserted') inserted++;
            }
          }
        } catch(e) { console.error(`Competitor engagers ${url}:`, e); }
      }
    }

    console.log(`signal-competitor (${signal_type}): ${inserted} leads total (${Math.round((Date.now()-START)/1000)}s)`);
    return new Response(JSON.stringify({ leads: inserted }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('signal-competitor error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error', leads: 0 }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

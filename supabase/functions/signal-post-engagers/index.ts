const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─── Shared types & helpers ───────────────────────────────────────────────────

interface ICPFilters { jobTitles: string[]; industries: string[]; locations: string[]; companySizes: string[]; companyTypes: string[]; excludeKeywords: string[]; competitorCompanies: string[]; }
interface MatchResult { titleMatch: boolean; industryMatch: boolean; locationMatch: boolean; score: number; matchedFields: string[]; }

const START = Date.now();
const MAX_RUNTIME_MS = 105_000;
function hasTime() { return Date.now() - START < MAX_RUNTIME_MS; }

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
  const co=(p.company||p.current_company?.name||'').toLowerCase().trim();
  const hl=(p.headline||p.title||'').toLowerCase();
  if(cc.length>0){const t=`${co} ${hl}`;for(const c of cc){if(t.includes(c)) return true;}}
  if(!ek.length) return false;
  const text=[p.headline,p.title,p.company,p.current_company?.name,p.industry].filter(Boolean).join(' ').toLowerCase();
  return ek.some(kw=>text.includes(kw));
}
function unipileGet(path: string,apiKey: string,dsn: string){return fetch(`https://${dsn}${path}`,{headers:{'X-API-KEY':apiKey}});}
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
  const{data:e}=await sb.from('lists').select('id').eq('user_id',uid).eq('name',ln).limit(1);
  if(e?.length>0) return e[0].id;
  const{data:c,error}=await sb.from('lists').insert({user_id:uid,name:ln,source_agent_id:aid}).select('id').single();
  if(error){console.error(`Create list error: ${error.message}`);return null;} return c?.id||null;
}
async function insertContact(sb: any,p: any,uid: string,aid: string,ln: string,m: MatchResult,signal: string,spu: string|null,icp?: ICPFilters): Promise<boolean>{
  const lpid=p.public_id||p.public_identifier||p.provider_id||p.id; if(!lpid) return false;
  const{data:ex}=await sb.from('contacts').select('id').eq('user_id',uid).eq('linkedin_profile_id',lpid).limit(1);
  if(ex?.length>0) return false;
  const fn=p.first_name||p.name?.split(' ')[0]||'Unknown'; const lnn=p.last_name||p.name?.split(' ').slice(1).join(' ')||'';
  const hl=p.headline||p.title||'';
  const ei: ICPFilters={jobTitles:[],industries:[],locations:[],companySizes:[],companyTypes:[],excludeKeywords:[],competitorCompanies:[]};
  const rt=classifyContact(m,icp||ei,hl)||'cold';
  const sa=true;const sb2=m.score>=60;const sc=m.score>=80;const as=Math.min(3,[sa,sb2,sc].filter(Boolean).length);
  const{data:ins,error}=await sb.from('contacts').insert({
    user_id:uid,first_name:fn,last_name:lnn,title:p.headline||p.title||null,company:p.company||p.current_company?.name||null,
    linkedin_url:p.linkedin_url||p.public_url||p.profile_url||(lpid?`https://www.linkedin.com/in/${lpid}`:null),
    linkedin_profile_id:lpid,source_campaign_id:null,signal,signal_post_url:spu,ai_score:as,
    signal_a_hit:sa,signal_b_hit:sb2,signal_c_hit:sc,email_enriched:false,list_name:ln,
    company_icon_color:['orange','blue','green','purple','pink','gray'][Math.floor(Math.random()*6)],relevance_tier:rt,
  }).select('id').single();
  if(error){console.error(`Insert contact error: ${error.message}`);return false;}
  if(ins?.id&&ln){const lid=await ensureList(sb,uid,ln,aid);if(lid) await sb.from('contact_lists').insert({contact_id:ins.id,list_id:lid});}
  return true;
}

// ─── Main: scans engagers on your own LinkedIn posts ──────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { agent_id, account_id, user_id, list_name, linkedin_id, icp: icpRaw, competitor_companies, profile_urls } = await req.json();
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

    let inserted = 0;
    let hotWarmCount = 0; let coldCount = 0;
    const COLD_CAP = 0.2;
    function canInsertCold() { const total = hotWarmCount + coldCount; return total === 0 || coldCount / (total + 1) < COLD_CAP; }

    // Resolve user's LinkedIn ID if not provided
    let userLiId = linkedin_id;
    if (!userLiId) {
      try {
        const res = await unipileGet(`/api/v1/users/me?account_id=${account_id}`, UNIPILE_API_KEY, UNIPILE_DSN);
        if (res.ok) { const d = await res.json(); userLiId = d.provider_id || d.public_id || d.id; }
        else {
          const res2 = await unipileGet(`/api/v1/linkedin/profile/me?account_id=${account_id}`, UNIPILE_API_KEY, UNIPILE_DSN);
          if (res2.ok) { const d2 = await res2.json(); userLiId = d2.provider_id || d2.public_id || d2.id; }
        }
      } catch (e) { console.error('resolveUserLinkedInId:', e); }
    }

    if (userLiId) {
      // Scan own posts
      const postsRes = await unipileGet(`/api/v1/users/${userLiId}/posts?account_id=${account_id}&limit=5`, UNIPILE_API_KEY, UNIPILE_DSN);
      if (postsRes.ok) {
        const postsData = await postsRes.json();
        const posts = (postsData.items || postsData.posts || []).slice(0, 5);
        console.log(`post_engagers: ${posts.length} own posts`);

        for (const post of posts) {
          if (!hasTime()) break;
          await delay(150);
          const postId = post.social_id || post.id || post.provider_id;
          if (!postId) continue;
          const rr = await unipileGet(`/api/v1/posts/${postId}/reactions?account_id=${account_id}&limit=25`, UNIPILE_API_KEY, UNIPILE_DSN);
          if (!rr.ok) { await rr.text(); continue; }
          const rd = await rr.json();
          const engagers = (rd.items || []).slice(0, 25);
          const postUrl = post.url || post.share_url || post.permalink || `https://www.linkedin.com/feed/update/${postId}`;
          const postText = post.text || post.commentary || '';
          const snippet = postText.length > 50 ? postText.slice(0, 47) + '...' : postText;

          for (const engager of engagers) {
            if (!hasTime()) break;
            const profile = engager.author || engager;
            const fullProfile = await fetchProfileIfNeeded(profile, account_id, UNIPILE_API_KEY, UNIPILE_DSN);
            if (!fullProfile) continue;
            const match = scoreProfileAgainstICP(fullProfile, icp);
            const hl = fullProfile.headline || fullProfile.title || '';
            if (!matchesTitleOrIndustry(match, icp, hl)) continue;
            if (isExcluded(fullProfile, icp.excludeKeywords, icp.competitorCompanies)) continue;
            const signal = snippet ? `Reacted to your post: "${snippet}"` : 'Reacted to your post';
            const ok = await insertContact(supabase, fullProfile, user_id, agent_id, list_name, match, signal, postUrl, icp);
            if (ok) { inserted++; console.log(`+1 "${fullProfile.first_name} ${fullProfile.last_name||''}" (${hl})`); }
          }
        }
      } else { await postsRes.text(); console.log('post_engagers: failed to fetch own posts'); }
    }

    // Also scan profile_engagers (influencer profiles) if provided
    if (profile_urls?.length > 0) {
      function extractLinkedInId(url: string): string|null { if(!url) return null; const m=url.match(/linkedin\.com\/(?:company|in)\/([^/?]+)/); if(m) return m[1]; return url.replace(/^https?:\/\//,'').replace(/\/$/,'')||null; }
      function extractCompanyName(url: string): string|null { const id=extractLinkedInId(url); if(!id) return null; return id.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase()); }

      for (const url of profile_urls) {
        if (!hasTime()) break;
        await delay(150);
        const profileId = extractLinkedInId(url);
        if (!profileId) continue;
        const isCompany = url.includes('/company/');
        const ep = isCompany ? `/api/v1/users/${profileId}/posts?account_id=${account_id}&is_company=true&limit=5` : `/api/v1/users/${profileId}/posts?account_id=${account_id}&limit=5`;
        try {
          const pr = await unipileGet(ep, UNIPILE_API_KEY, UNIPILE_DSN);
          if (!pr.ok) { await pr.text(); continue; }
          const pd = await pr.json();
          const posts = (pd.items || pd.posts || []).slice(0, 5);
          let profileName = isCompany ? (extractCompanyName(url)||profileId) : profileId;
          if (!isCompany) { try { const r = await unipileGet(`/api/v1/linkedin/profile/${profileId}?account_id=${account_id}`, UNIPILE_API_KEY, UNIPILE_DSN); if(r.ok){const d=await r.json();profileName=[d.first_name,d.last_name].filter(Boolean).join(' ')||profileId;}else await r.text(); } catch(_){} }
          console.log(`profile_engagers "${profileName}": ${posts.length} posts`);
          for (const post of posts) {
            if (!hasTime()) break;
            await delay(150);
            const postId = post.social_id||post.id||post.provider_id; if (!postId) continue;
            const rr = await unipileGet(`/api/v1/posts/${postId}/reactions?account_id=${account_id}&limit=25`, UNIPILE_API_KEY, UNIPILE_DSN);
            if (!rr.ok) { await rr.text(); continue; }
            const rd = await rr.json();
            const engagers = (rd.items||[]).slice(0, 25);
            const postUrl = post.url||post.share_url||post.permalink||`https://www.linkedin.com/feed/update/${postId}`;
            for (const engager of engagers) {
              if (!hasTime()) break;
              const ep2 = engager.author||engager;
              const fp = await fetchProfileIfNeeded(ep2, account_id, UNIPILE_API_KEY, UNIPILE_DSN);
              if (!fp) continue;
              const match = scoreProfileAgainstICP(fp, icp);
              const hl = fp.headline||fp.title||'';
              if (!matchesTitleOrIndustry(match, icp, hl)) continue;
              if (isExcluded(fp, icp.excludeKeywords, icp.competitorCompanies)) continue;
              const ok = await insertContact(supabase, fp, user_id, agent_id, list_name, match, `Engaged with ${profileName}'s post`, postUrl, icp);
              if (ok) { inserted++; console.log(`+1 "${fp.first_name} ${fp.last_name||''}" (${hl})`); }
            }
          }
        } catch(e) { console.error(`Profile engagers ${url}:`, e); }
      }
    }

    console.log(`signal-post-engagers: ${inserted} leads total (${Math.round((Date.now()-START)/1000)}s)`);
    return new Response(JSON.stringify({ leads: inserted }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('signal-post-engagers error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error', leads: 0 }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

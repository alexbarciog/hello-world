import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const UNIPILE_DSN = Deno.env.get("UNIPILE_DSN")!;
const UNIPILE_API_KEY = Deno.env.get("UNIPILE_API_KEY")!;

const AVATAR_COLORS = [
  "orange", "blue", "green", "purple", "pink", "teal", "red", "indigo",
];

function pickColor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = seed.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) return json({ error: "Unauthorized" }, 401);
    const userId = claimsData.claims.sub as string;

    const body = await req.json().catch(() => ({}));
    const search_url: string = (body.search_url || "").trim();
    const max_leads: number = Math.max(1, Math.min(500, Number(body.max_leads) || 100));
    const list_id: string | undefined = body.list_id || undefined;
    const new_list_name: string | undefined = body.new_list_name?.trim() || undefined;

    if (!/^https:\/\/www\.linkedin\.com\/sales\/search\//i.test(search_url)) {
      return json({ error: "Invalid Sales Navigator search URL" }, 400);
    }
    if (!list_id && !new_list_name) {
      return json({ error: "Provide list_id or new_list_name" }, 400);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Resolve org & unipile account
    const { data: profile } = await admin
      .from("profiles")
      .select("current_organization_id")
      .eq("user_id", userId)
      .maybeSingle();
    const orgId = profile?.current_organization_id;
    if (!orgId) return json({ error: "No active organization" }, 400);

    const { data: org } = await admin
      .from("organizations")
      .select("unipile_account_id")
      .eq("id", orgId)
      .maybeSingle();
    const accountId = org?.unipile_account_id;
    if (!accountId) {
      return json({ error: "LinkedIn account not connected for this workspace" }, 400);
    }

    // Resolve target list
    let targetListId = list_id;
    if (!targetListId && new_list_name) {
      const { data: created, error: listErr } = await admin
        .from("lists")
        .insert({
          name: new_list_name,
          user_id: userId,
          organization_id: orgId,
          description: "Imported from Sales Navigator",
        })
        .select("id")
        .single();
      if (listErr) return json({ error: `Failed to create list: ${listErr.message}` }, 500);
      targetListId = created.id;
    }

    // Page through Unipile Sales Navigator search
    let inserted = 0;
    let duplicates = 0;
    let cursor: string | null = null;
    const MAX_PAGES = 20;
    const PAGE_SIZE = 50;

    const controller = new AbortController();
    const overallTimeout = setTimeout(() => controller.abort(), 90_000);

    try {
      for (let page = 0; page < MAX_PAGES; page++) {
        if (inserted >= max_leads) break;

        const remaining = max_leads - inserted;
        const limit = Math.min(PAGE_SIZE, remaining);

        const url = `https://${UNIPILE_DSN}/api/v1/linkedin/search?account_id=${encodeURIComponent(accountId)}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`;
        const reqBody: Record<string, unknown> = {
          api: "sales_navigator",
          category: "people",
          url: search_url,
          limit,
        };

        const resp = await fetch(url, {
          method: "POST",
          headers: {
            "X-API-KEY": UNIPILE_API_KEY,
            "Content-Type": "application/json",
            accept: "application/json",
          },
          body: JSON.stringify(reqBody),
          signal: controller.signal,
        });

        const text = await resp.text();
        if (!resp.ok) {
          console.error("Unipile search failed", resp.status, text);
          if (page === 0) {
            return json({ error: `Sales Nav search failed (${resp.status}): ${text.slice(0, 500)}` }, 502);
          }
          break;
        }

        let payload: any;
        try { payload = JSON.parse(text); } catch { payload = {}; }
        const items: any[] = payload.items || payload.data || [];
        cursor = payload.cursor || payload.next_cursor || null;

        if (items.length === 0) break;

        // Build candidates
        const candidates = items
          .map((it) => {
            const profileId =
              it.id ||
              it.member_id ||
              it.profile_id ||
              it.entity_urn ||
              it.public_identifier ||
              it.public_id ||
              null;
            const publicId = it.public_identifier || it.public_id || null;
            const linkedinUrl = publicId
              ? `https://www.linkedin.com/in/${publicId}`
              : it.profile_url || it.url || null;
            const firstName = it.first_name || it.firstName || (it.name ? String(it.name).split(" ")[0] : "") || "";
            const lastNameRaw = it.last_name || it.lastName || (it.name ? String(it.name).split(" ").slice(1).join(" ") : "");
            const headline = it.headline || it.title || it.occupation || null;
            const company =
              it.current_company?.name ||
              it.company?.name ||
              it.company_name ||
              (Array.isArray(it.work_experience) && it.work_experience[0]?.company) ||
              null;
            const industry = it.industry || it.industry_name || null;
            return {
              linkedin_profile_id: profileId ? String(profileId) : null,
              linkedin_url: linkedinUrl,
              first_name: firstName || "Unknown",
              last_name: lastNameRaw || null,
              title: headline,
              company,
              industry,
            };
          })
          .filter((c) => c.linkedin_profile_id || c.linkedin_url);

        // Dedup against existing org contacts (by linkedin_profile_id OR linkedin_url)
        const profileIds = candidates.map((c) => c.linkedin_profile_id).filter(Boolean) as string[];
        const urls = candidates.map((c) => c.linkedin_url).filter(Boolean) as string[];

        const existingIds = new Set<string>();
        const existingUrls = new Set<string>();
        if (profileIds.length) {
          const { data: ex } = await admin
            .from("contacts")
            .select("linkedin_profile_id")
            .eq("organization_id", orgId)
            .in("linkedin_profile_id", profileIds);
          ex?.forEach((r: any) => r.linkedin_profile_id && existingIds.add(r.linkedin_profile_id));
        }
        if (urls.length) {
          const { data: exU } = await admin
            .from("contacts")
            .select("linkedin_url")
            .eq("organization_id", orgId)
            .in("linkedin_url", urls);
          exU?.forEach((r: any) => r.linkedin_url && existingUrls.add(r.linkedin_url));
        }

        const toInsert = candidates.filter((c) => {
          const dupId = c.linkedin_profile_id && existingIds.has(c.linkedin_profile_id);
          const dupUrl = c.linkedin_url && existingUrls.has(c.linkedin_url);
          if (dupId || dupUrl) {
            duplicates++;
            return false;
          }
          return true;
        });

        if (toInsert.length === 0) continue;

        const rows = toInsert.slice(0, max_leads - inserted).map((c) => ({
          user_id: userId,
          organization_id: orgId,
          first_name: c.first_name,
          last_name: c.last_name,
          title: c.title,
          company: c.company,
          industry: c.industry,
          linkedin_url: c.linkedin_url,
          linkedin_profile_id: c.linkedin_profile_id,
          relevance_tier: "cold",
          approval_status: "auto_approved",
          signal: "Imported from Sales Navigator",
          signal_a_hit: true,
          ai_score: 1,
          company_icon_color: pickColor(c.company || c.first_name),
          list_name: new_list_name || null,
        }));

        const { data: insertedRows, error: insErr } = await admin
          .from("contacts")
          .insert(rows)
          .select("id");

        if (insErr) {
          console.error("Insert contacts error", insErr);
          continue;
        }

        if (targetListId && insertedRows?.length) {
          const links = insertedRows.map((r: any) => ({
            list_id: targetListId,
            contact_id: r.id,
          }));
          await admin.from("contact_lists").insert(links);
        }

        inserted += insertedRows?.length || 0;

        if (!cursor) break;
        await new Promise((r) => setTimeout(r, 250));
      }
    } finally {
      clearTimeout(overallTimeout);
    }

    return json({ success: true, inserted, duplicates, list_id: targetListId });
  } catch (e) {
    console.error("import-sales-nav error", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return json({ error: msg }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

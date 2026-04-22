import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Validate JWT
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const contactIds: string[] = Array.isArray(body?.contact_ids) ? body.contact_ids : [];
    const expiresInDays: number = Number.isFinite(body?.expires_in_days) ? body.expires_in_days : 30;

    if (contactIds.length === 0) {
      return new Response(JSON.stringify({ error: "contact_ids required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (contactIds.length > 500) {
      return new Response(JSON.stringify({ error: "Too many contacts (max 500)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Resolve user's current org
    const { data: profile } = await admin
      .from("profiles")
      .select("current_organization_id")
      .eq("user_id", userId)
      .maybeSingle();

    const orgId = profile?.current_organization_id;
    if (!orgId) {
      return new Response(JSON.stringify({ error: "No organization" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller owns these contacts (org-scoped)
    const { data: ownedContacts, error: ownedErr } = await admin
      .from("contacts")
      .select("id")
      .eq("organization_id", orgId)
      .in("id", contactIds);

    if (ownedErr) {
      return new Response(JSON.stringify({ error: ownedErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const verifiedIds = (ownedContacts ?? []).map((c) => c.id);
    if (verifiedIds.length === 0) {
      return new Response(JSON.stringify({ error: "No accessible contacts" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get sharer's display name
    const { data: userInfo } = await admin.auth.admin.getUserById(userId);
    const meta = userInfo?.user?.user_metadata ?? {};
    const sharerName =
      [meta.first_name, meta.last_name].filter(Boolean).join(" ") ||
      meta.full_name ||
      meta.name ||
      userInfo?.user?.email ||
      "Someone";

    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();
    const linkName = `Shared by ${sharerName} · ${verifiedIds.length} lead${verifiedIds.length === 1 ? "" : "s"}`;

    const { data: linkRow, error: linkErr } = await admin
      .from("shared_lead_links")
      .insert({
        created_by: userId,
        organization_id: orgId,
        name: linkName,
        lead_count: verifiedIds.length,
        expires_at: expiresAt,
      })
      .select("id, token")
      .single();

    if (linkErr || !linkRow) {
      return new Response(JSON.stringify({ error: linkErr?.message ?? "Failed to create link" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rows = verifiedIds.map((cid) => ({ link_id: linkRow.id, contact_id: cid }));
    const { error: joinErr } = await admin.from("shared_lead_link_contacts").insert(rows);
    if (joinErr) {
      // Rollback the link if join inserts fail
      await admin.from("shared_lead_links").delete().eq("id", linkRow.id);
      return new Response(JSON.stringify({ error: joinErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const origin = req.headers.get("origin") ?? req.headers.get("referer") ?? "";
    let baseUrl = "";
    try {
      baseUrl = origin ? new URL(origin).origin : "";
    } catch {
      baseUrl = "";
    }
    const url = `${baseUrl}/shared/leads/${linkRow.token}`;

    return new Response(
      JSON.stringify({
        token: linkRow.token,
        url,
        lead_count: verifiedIds.length,
        name: linkName,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("create-shared-lead-link error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

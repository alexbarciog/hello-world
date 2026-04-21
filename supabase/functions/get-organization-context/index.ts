import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "Unauthorized" }, 401);

    const supa = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } },
    );
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: { user } } = await supa.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { data: profile } = await admin
      .from("profiles")
      .select("current_organization_id, referral_code, referral_balance")
      .eq("user_id", user.id)
      .maybeSingle();

    let currentOrgId = profile?.current_organization_id;

    // Get all orgs user is member of
    const { data: memberships } = await admin
      .from("organization_members")
      .select("role, organization_id, organizations(id, name, plan, owner_id)")
      .eq("user_id", user.id);

    const orgs = (memberships || []).map((m: any) => ({
      ...m.organizations,
      role: m.role,
    }));

    // If no current org but has memberships, set first one as current
    if (!currentOrgId && orgs.length > 0) {
      currentOrgId = orgs[0].id;
      await admin.from("profiles").update({ current_organization_id: currentOrgId }).eq("user_id", user.id);
    }

    const currentOrg = orgs.find((o: any) => o.id === currentOrgId) || orgs[0] || null;

    // Members of current org
    let members: any[] = [];
    let pendingInvitations: any[] = [];
    if (currentOrg) {
      const { data: m } = await admin
        .from("organization_members")
        .select("id, role, joined_at, user_id")
        .eq("organization_id", currentOrg.id);
      members = m || [];

      const { data: inv } = await admin
        .from("organization_invitations")
        .select("id, email, status, created_at")
        .eq("organization_id", currentOrg.id)
        .eq("status", "pending");
      pendingInvitations = inv || [];
    }

    return json({
      currentOrg,
      organizations: orgs,
      members,
      pendingInvitations,
      referralCode: profile?.referral_code,
      referralBalance: profile?.referral_balance || 0,
    });
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

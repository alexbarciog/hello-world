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

    const { token } = await req.json();
    if (!token) return json({ error: "Missing token" }, 400);

    const { data: invitation } = await admin
      .from("organization_invitations")
      .select("*")
      .eq("token", token)
      .maybeSingle();

    if (!invitation) return json({ error: "Invalid invitation" }, 404);
    if (invitation.status !== "pending") return json({ error: "Invitation already used" }, 400);
    if (new Date(invitation.expires_at) < new Date()) {
      await admin.from("organization_invitations").update({ status: "expired" }).eq("id", invitation.id);
      return json({ error: "Invitation expired" }, 400);
    }

    // Add to org members
    const { error: memberErr } = await admin
      .from("organization_members")
      .insert({
        organization_id: invitation.organization_id,
        user_id: user.id,
        role: "member",
      });

    if (memberErr && !memberErr.message.includes("duplicate")) {
      return json({ error: memberErr.message }, 400);
    }

    // Mark invitation accepted
    await admin
      .from("organization_invitations")
      .update({ status: "accepted" })
      .eq("id", invitation.id);

    // Switch to this org
    await admin
      .from("profiles")
      .update({ current_organization_id: invitation.organization_id })
      .eq("user_id", user.id);

    // Create referral if invitee is new (created within last 24h)
    const userCreated = new Date(user.created_at);
    const isNew = (Date.now() - userCreated.getTime()) < 24 * 60 * 60 * 1000;
    if (isNew) {
      await admin.from("referrals").insert({
        referrer_user_id: invitation.invited_by,
        referred_user_id: user.id,
        organization_id: invitation.organization_id,
        source: "invitation",
        status: "pending",
        reward_amount: 50,
      });
    }

    const { data: org } = await admin
      .from("organizations")
      .select("*")
      .eq("id", invitation.organization_id)
      .single();

    return json({ success: true, organization: org });
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

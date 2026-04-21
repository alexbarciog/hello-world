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

    const { organizationId, email } = await req.json();
    if (!organizationId || !email) return json({ error: "Missing fields" }, 400);

    // Verify user is admin/owner of org
    const { data: member } = await admin
      .from("organization_members")
      .select("role")
      .eq("organization_id", organizationId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!member || !["owner", "admin"].includes(member.role)) {
      return json({ error: "Forbidden" }, 403);
    }

    const { data: org } = await admin
      .from("organizations")
      .select("name")
      .eq("id", organizationId)
      .single();

    const { data: invitation, error: invErr } = await admin
      .from("organization_invitations")
      .insert({
        organization_id: organizationId,
        invited_by: user.id,
        email: email.toLowerCase().trim(),
        status: "pending",
      })
      .select()
      .single();

    if (invErr) return json({ error: invErr.message }, 400);

    const inviteUrl = `https://intentsly.com/invite/${invitation.token}`;
    const inviterName = user.user_metadata?.full_name || user.email || "A teammate";

    // Send email via Resend
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Intentsly <no-reply@intentsly.com>",
            to: email,
            subject: `You've been invited to join ${org?.name || "a workspace"} on Intentsly`,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px;">
                <h1 style="font-size: 22px; font-weight: 700; color: #111;">You're invited to ${org?.name || "a workspace"}</h1>
                <p style="color: #555; font-size: 15px; line-height: 1.6;">
                  ${inviterName} invited you to join <strong>${org?.name}</strong> on Intentsly.
                </p>
                <a href="${inviteUrl}" style="display: inline-block; margin-top: 16px; background: #111; color: white; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: 600;">
                  Accept invitation
                </a>
                <p style="color: #999; font-size: 13px; margin-top: 24px;">
                  Or paste this link: <br/><a href="${inviteUrl}" style="color: #1A8FE3;">${inviteUrl}</a>
                </p>
              </div>
            `,
          }),
        });
      } catch (e) {
        console.error("Email send failed:", e);
      }
    }

    return json({ success: true, token: invitation.token, url: inviteUrl });
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

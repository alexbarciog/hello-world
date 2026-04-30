import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing auth");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is admin
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) throw new Error("Not an admin");

    const { target_user_id } = await req.json();
    if (!target_user_id) throw new Error("Missing target_user_id");

    // Look up target user's email
    const { data: targetUser, error: getErr } = await adminClient.auth.admin.getUserById(target_user_id);
    if (getErr || !targetUser?.user?.email) throw new Error("Target user not found");

    const email = targetUser.user.email;

    // Generate a magic link to obtain a token_hash. We then exchange it server-side
    // for a real session so the admin's browser never has to touch the raw Supabase
    // hostname (which can be blocked by DNS/VPN/ISP for some admins).
    const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    if (linkErr) throw linkErr;

    const tokenHash = linkData.properties?.hashed_token;
    if (!tokenHash) throw new Error("No token hash returned");

    // Server-to-server: exchange the token_hash for a session.
    const verifyClient = createClient(supabaseUrl, anonKey);
    const { data: sessionData, error: verifyErr } = await verifyClient.auth.verifyOtp({
      type: "magiclink",
      token_hash: tokenHash,
    });
    if (verifyErr || !sessionData?.session) {
      throw new Error(`Failed to mint session: ${verifyErr?.message || "no session"}`);
    }

    return new Response(
      JSON.stringify({
        email,
        access_token: sessionData.session.access_token,
        refresh_token: sessionData.session.refresh_token,
        redirect_to: "https://intentsly.com/dashboard",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

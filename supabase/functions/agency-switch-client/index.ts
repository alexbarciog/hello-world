import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Mints a session for a client account that the calling agency owns.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing auth");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const admin = createClient(supabaseUrl, serviceKey);

    // Verify caller is an agency
    const { data: profile } = await admin
      .from("profiles")
      .select("account_type")
      .eq("user_id", user.id)
      .maybeSingle();
    if (profile?.account_type !== "agency") throw new Error("Not an agency account");

    const { client_id } = await req.json();
    if (!client_id) throw new Error("Missing client_id");

    // Verify the client belongs to this agency
    const { data: row, error: rowErr } = await admin
      .from("agency_clients")
      .select("client_user_id, client_email, client_name")
      .eq("id", client_id)
      .eq("agency_user_id", user.id)
      .maybeSingle();
    if (rowErr || !row) throw new Error("Client not found");
    if (!row.client_user_id) {
      // Try to resolve by email if it has since signed up
      const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const existing = list?.users?.find((u: any) => (u.email || "").toLowerCase() === row.client_email.toLowerCase());
      if (!existing) throw new Error("Client has not yet created their account");
      row.client_user_id = existing.id;
      await admin.from("agency_clients").update({
        client_user_id: existing.id,
        status: "active",
        activated_at: new Date().toISOString(),
      }).eq("id", client_id);
    }

    // Get the email
    const { data: targetUser, error: getErr } = await admin.auth.admin.getUserById(row.client_user_id);
    if (getErr || !targetUser?.user?.email) throw new Error("Client user not found");
    const email = targetUser.user.email;

    // Generate magic link, exchange to a session
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    if (linkErr) throw linkErr;
    const tokenHash = linkData.properties?.hashed_token;
    if (!tokenHash) throw new Error("No token hash returned");

    const verifyClient = createClient(supabaseUrl, anonKey);
    const { data: sessionData, error: verifyErr } = await verifyClient.auth.verifyOtp({
      type: "magiclink",
      token_hash: tokenHash,
    });
    if (verifyErr || !sessionData?.session) {
      throw new Error(`Failed to mint session: ${verifyErr?.message || "no session"}`);
    }

    return new Response(JSON.stringify({
      email,
      client_name: row.client_name,
      access_token: sessionData.session.access_token,
      refresh_token: sessionData.session.refresh_token,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

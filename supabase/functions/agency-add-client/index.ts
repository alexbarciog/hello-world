import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const { client_name, client_email, note } = await req.json();
    if (!client_name || !client_email) throw new Error("client_name and client_email are required");

    const email = String(client_email).trim().toLowerCase();

    // Try to find an existing user with this email
    let clientUserId: string | null = null;
    let status = "pending";
    try {
      // listUsers fallback — fetch first 1000 then search
      const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const existing = list?.users?.find((u: any) => (u.email || "").toLowerCase() === email);
      if (existing) {
        clientUserId = existing.id;
        status = "active";
      }
    } catch (_e) { /* ignore */ }

    // If no existing user, send an invite link so the client can sign up
    if (!clientUserId) {
      try {
        await admin.auth.admin.inviteUserByEmail(email, {
          data: { invited_by_agency: user.id, client_name },
          redirectTo: "https://intentsly.com/onboarding",
        });
        status = "pending";
      } catch (_e) { /* ignore — they may already exist or invites disabled */ }
    }

    const { data: inserted, error: insErr } = await admin
      .from("agency_clients")
      .insert({
        agency_user_id: user.id,
        client_user_id: clientUserId,
        client_name,
        client_email: email,
        note: note || null,
        status,
        activated_at: status === "active" ? new Date().toISOString() : null,
      })
      .select()
      .single();
    if (insErr) throw insErr;

    return new Response(JSON.stringify({ ok: true, client: inserted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

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

    // Check admin role
    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) throw new Error("Not an admin");

    // Fetch all data in parallel using service role (bypasses RLS)
    const [usersRes, profilesRes, campaignsRes] = await Promise.all([
      adminClient.auth.admin.listUsers({ perPage: 1000 }),
      adminClient.from("profiles").select("*"),
      adminClient.from("campaigns").select("user_id, website"),
    ]);

    if (usersRes.error) throw usersRes.error;

    const profiles = profilesRes.data ?? [];
    const campaignsList = campaignsRes.data ?? [];

    const safeUsers = (usersRes.data?.users ?? []).map((u) => {
      const profile = profiles.find((p: any) => p.user_id === u.id);
      const campaign = campaignsList.find((c: any) => c.user_id === u.id && c.website);
      return {
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        raw_user_meta_data: u.user_metadata,
        // Profile fields
        onboarding_complete: profile?.onboarding_complete ?? false,
        credits: profile?.credits ?? 0,
        daily_messages_limit: profile?.daily_messages_limit ?? null,
        daily_connections_limit: profile?.daily_connections_limit ?? null,
        unipile_account_id: profile?.unipile_account_id ?? null,
        // Website from campaigns
        website: campaign?.website ?? null,
      };
    });

    return new Response(JSON.stringify({ users: safeUsers }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

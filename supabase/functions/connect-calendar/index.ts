import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { provider, action, code, calendar_email } = await req.json();

    if (!provider || !["calendly", "google_calendar", "outlook_calendar", "cal_com"].includes(provider)) {
      return new Response(JSON.stringify({ error: "Invalid provider" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle OAuth callback (token exchange)
    if (action === "callback" && code) {
      // In a real implementation, exchange the code for tokens here
      // For now, store the integration with the provided info
      const { error: insertErr } = await supabase
        .from("calendar_integrations")
        .upsert({
          user_id: user.id,
          provider,
          access_token: code,
          calendar_email: calendar_email || null,
          is_active: true,
        }, { onConflict: "user_id,provider" });

      if (insertErr) throw insertErr;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate OAuth URL based on provider
    // These would use real OAuth endpoints once API keys are configured
    const baseUrl = Deno.env.get("SUPABASE_URL");
    const redirectUri = `${baseUrl}/functions/v1/connect-calendar`;

    let authUrl = "";
    switch (provider) {
      case "calendly":
        authUrl = `https://auth.calendly.com/oauth/authorize?client_id=CALENDLY_CLIENT_ID&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}`;
        break;
      case "google_calendar": {
        const googleClientId = Deno.env.get("GOOGLE_CLIENT_ID") || "GOOGLE_CLIENT_ID";
        authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&response_type=code&scope=https://www.googleapis.com/auth/calendar.readonly&redirect_uri=${encodeURIComponent(redirectUri)}&access_type=offline&prompt=consent`;
      }
        break;
      case "outlook_calendar":
        authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=OUTLOOK_CLIENT_ID&response_type=code&scope=Calendars.Read&redirect_uri=${encodeURIComponent(redirectUri)}`;
        break;
      case "cal_com":
        authUrl = `https://app.cal.com/auth/login?redirect_uri=${encodeURIComponent(redirectUri)}`;
        break;
    }

    return new Response(JSON.stringify({ url: authUrl, provider }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

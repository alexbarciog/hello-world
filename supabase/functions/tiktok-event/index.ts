import { corsHeaders } from "@supabase/supabase-js/cors";

const TIKTOK_PIXEL_ID = "D780ID3C77UCM5J7I8T0";
const TIKTOK_API_URL = "https://business-api.tiktok.com/open_api/v1.3/event/track/";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const token = Deno.env.get("TIKTOK_ACCESS_TOKEN");
    if (!token) {
      return new Response(JSON.stringify({ error: "Missing TikTok token" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const {
      event,
      event_id,
      url,
      user_agent,
      ip,
      email,
      phone,
      external_id,
      contents,
      value,
      currency,
      search_string,
      ttclid,
      ttp,
    } = body;

    if (!event) {
      return new Response(JSON.stringify({ error: "Missing event name" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const timestamp = new Date().toISOString();

    // Build user object
    const user: Record<string, unknown> = {};
    if (email) user.email = email;
    if (phone) user.phone_number = phone;
    if (external_id) user.external_id = external_id;
    if (ip) user.ip = ip;
    if (user_agent) user.user_agent = user_agent;
    if (ttclid) user.ttclid = ttclid;
    if (ttp) user.ttp = ttp;

    // Build properties
    const properties: Record<string, unknown> = {};
    if (contents) properties.contents = contents;
    if (value !== undefined) properties.value = value;
    if (currency) properties.currency = currency;
    if (search_string) properties.search_string = search_string;

    const payload = {
      pixel_code: TIKTOK_PIXEL_ID,
      event: event,
      event_id: event_id || crypto.randomUUID(),
      timestamp: timestamp,
      context: {
        user_agent: user_agent || "",
        ip: ip || "",
        page: { url: url || "" },
      },
      user: Object.keys(user).length > 0 ? user : undefined,
      properties: Object.keys(properties).length > 0 ? properties : undefined,
    };

    const response = await fetch(TIKTOK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Access-Token": token,
      },
      body: JSON.stringify({
        event_source: "web",
        event_source_id: TIKTOK_PIXEL_ID,
        data: [payload],
      }),
    });

    const result = await response.json();

    return new Response(JSON.stringify(result), {
      status: response.ok ? 200 : 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

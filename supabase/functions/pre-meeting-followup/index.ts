import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.49.1/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = new Date();
    const min45 = new Date(now.getTime() + 45 * 60 * 1000).toISOString();
    const min75 = new Date(now.getTime() + 75 * 60 * 1000).toISOString();

    // Find calendar events starting in 45-75 minutes that haven't had a follow-up
    const { data: events, error: eventsErr } = await supabase
      .from("calendar_events")
      .select("id, user_id, contact_id, event_title, event_start")
      .eq("pre_meeting_followup_sent", false)
      .not("contact_id", "is", null)
      .gte("event_start", min45)
      .lte("event_start", min75);

    if (eventsErr) throw eventsErr;
    if (!events || events.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let processed = 0;

    for (const event of events) {
      // Get user's Unipile account
      const { data: profile } = await supabase
        .from("profiles")
        .select("unipile_account_id")
        .eq("user_id", event.user_id)
        .single();

      if (!profile?.unipile_account_id) continue;

      // Get contact info
      const { data: contact } = await supabase
        .from("contacts")
        .select("first_name, last_name, linkedin_profile_id, company")
        .eq("id", event.contact_id)
        .single();

      if (!contact?.linkedin_profile_id) continue;

      // Find an active campaign connection request for this contact
      const { data: connReq } = await supabase
        .from("campaign_connection_requests")
        .select("chat_id, campaign_id")
        .eq("contact_id", event.contact_id)
        .eq("user_id", event.user_id)
        .eq("status", "accepted")
        .not("chat_id", "is", null)
        .limit(1)
        .maybeSingle();

      if (!connReq?.chat_id) continue;

      // Send LinkedIn message via Unipile
      const UNIPILE_DSN = Deno.env.get("UNIPILE_DSN") || "";
      const UNIPILE_API_KEY = Deno.env.get("UNIPILE_API_KEY") || "";

      const meetingTime = new Date(event.event_start).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      const message = `Hi ${contact.first_name}, looking forward to our call at ${meetingTime} today! Let me know if there's anything specific you'd like to discuss. 🙌`;

      try {
        const res = await fetch(`${UNIPILE_DSN}/api/v1/chats/${connReq.chat_id}/messages`, {
          method: "POST",
          headers: {
            "X-API-KEY": UNIPILE_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: message }),
        });

        if (res.ok) {
          // Mark as sent
          await supabase
            .from("calendar_events")
            .update({ pre_meeting_followup_sent: true })
            .eq("id", event.id);

          // Create notification
          await supabase.from("notifications").insert({
            user_id: event.user_id,
            title: "Pre-meeting follow-up sent",
            body: `Sent LinkedIn message to ${contact.first_name} ${contact.last_name || ""} before your meeting.`,
            type: "info",
          });

          processed++;
        }
      } catch (sendErr) {
        console.error(`Failed to send follow-up for event ${event.id}:`, sendErr);
      }
    }

    return new Response(JSON.stringify({ processed, total: events.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

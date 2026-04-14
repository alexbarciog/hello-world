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

    const body = await req.json();
    const { provider, event_id, attendee_email, event_title, event_start, event_end, user_id, integration_id } = body;

    if (!provider || !event_id || !event_start || !user_id || !integration_id) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Try to match attendee email to a contact
    let contactId = null;
    let matchedContact = null;
    if (attendee_email) {
      const { data: contact } = await supabase
        .from("contacts")
        .select("id, first_name, last_name, company")
        .eq("user_id", user_id)
        .eq("email", attendee_email)
        .limit(1)
        .maybeSingle();

      if (contact) {
        contactId = contact.id;
        matchedContact = contact;
      }
    }

    // Create calendar event
    const { data: calEvent, error: eventErr } = await supabase
      .from("calendar_events")
      .upsert({
        user_id,
        integration_id,
        provider_event_id: event_id,
        attendee_email,
        contact_id: contactId,
        event_title,
        event_start,
        event_end,
        pre_meeting_followup_sent: false,
      }, { onConflict: "user_id,provider_event_id" })
      .select()
      .single();

    if (eventErr) throw eventErr;

    // If we matched a contact, also create a meeting record
    if (contactId) {
      const { data: meeting } = await supabase
        .from("meetings")
        .insert({
          user_id,
          contact_id: contactId,
          scheduled_at: event_start,
          status: "scheduled",
          notes: `Auto-detected from ${provider}: ${event_title || "Meeting"}`,
        })
        .select("id")
        .single();

      if (meeting) {
        await supabase
          .from("calendar_events")
          .update({ meeting_id: meeting.id })
          .eq("id", calEvent.id);
      }

      // Create notification
      const contactName = matchedContact
        ? `${matchedContact.first_name} ${matchedContact.last_name || ""}`.trim()
        : attendee_email;

      await supabase.from("notifications").insert({
        user_id,
        title: "Meeting Booked",
        body: `${contactName} booked a meeting: ${event_title || "Meeting"} on ${new Date(event_start).toLocaleDateString()}`,
        type: "meeting",
        link: "/contacts",
      });

      // Update contact lead status
      await supabase
        .from("contacts")
        .update({ lead_status: "meeting_booked" })
        .eq("id", contactId);
    }

    return new Response(JSON.stringify({ success: true, matched_contact: !!contactId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

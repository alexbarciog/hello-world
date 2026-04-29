import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const { email, name } = await req.json();
    if (!email || typeof email !== "string" || !EMAIL_RE.test(email) || email.length > 255) {
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const safeName = typeof name === "string" ? name.trim().slice(0, 80) : "";
    const playbookUrl = `https://intentsly.com/downloads/b2b-100-playbook.html`;

    const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f9f9f7;font-family:Arial,Helvetica,sans-serif;color:#111110">
  <div style="max-width:560px;margin:0 auto;padding:48px 32px;background:#ffffff">
    <div style="font-family:'Syne',sans-serif;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#1a7a3c;margin-bottom:24px">Intentsly Playbook</div>
    <h1 style="font-family:Georgia,serif;font-size:28px;line-height:1.2;font-weight:500;margin:0 0 16px">${safeName ? `${safeName}, your` : "Your"} 90-Day B2B Playbook is ready.</h1>
    <p style="font-size:15px;line-height:1.6;color:#3a3a38;margin:0 0 28px">A field-tested playbook to take a B2B startup from 0 to 100 customers in 90 days. Tactics, templates, and the exact signals that actually convert.</p>
    <a href="${playbookUrl}" style="display:inline-block;background:#1a7a3c;color:#ffffff;font-family:'Syne',sans-serif;font-size:14px;font-weight:700;padding:14px 28px;border-radius:8px;text-decoration:none">Open the Playbook →</a>
    <p style="font-size:13px;color:#888884;margin:32px 0 0">Bookmark this email — the link doesn't expire. Reply if you want a 15-min walkthrough applied to your business.</p>
    <hr style="border:none;border-top:1px solid #e4e4e0;margin:36px 0">
    <p style="font-size:12px;color:#888884;margin:0">Sent by Intentsly · <a href="https://intentsly.com" style="color:#888884">intentsly.com</a></p>
  </div>
</body></html>`;

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Intentsly <playbook@intentsly.com>",
        to: [email],
        subject: "Your 90-Day B2B Playbook (0 → 100 customers)",
        html,
        reply_to: "hello@intentsly.com",
      }),
    });

    const data = await resp.json();
    if (!resp.ok) {
      console.error("Resend error", resp.status, data);
      throw new Error(`Resend [${resp.status}]: ${JSON.stringify(data)}`);
    }

    return new Response(JSON.stringify({ success: true, id: data.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-playbook error", e);
    return new Response(
      JSON.stringify({ success: false, error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

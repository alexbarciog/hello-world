import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Public unsubscribe endpoint — GET with ?token=UUID. Returns a simple confirmation HTML page.
Deno.serve(async (req) => {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || "";
  const html = (title: string, msg: string) => new Response(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f7fb;margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}.card{background:#fff;border-radius:20px;padding:40px;max-width:440px;text-align:center;box-shadow:0 4px 24px rgba(15,23,42,.06)}h1{font-size:22px;margin:0 0 8px;color:#0f172a}p{color:#475569;font-size:14px;line-height:1.6;margin:0 0 20px}a{display:inline-block;background:#0f172a;color:#fff;text-decoration:none;padding:10px 18px;border-radius:10px;font-size:13px;font-weight:600}</style></head><body><div class="card"><h1>${title}</h1><p>${msg}</p><a href="https://intentsly.com">Back to Intentsly</a></div></body></html>`,
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );

  if (!token || !/^[0-9a-f-]{36}$/i.test(token)) {
    return html("Invalid link", "This unsubscribe link isn't valid. If you keep receiving emails, contact support.");
  }

  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { error } = await admin
      .from("profile_analyzer_subscribers")
      .update({ enabled: false })
      .eq("unsubscribe_token", token);
    if (error) throw error;
    return html("You're unsubscribed", "You won't receive opportunity alerts anymore. You can re-enable them any time from your Intentsly settings.");
  } catch (e) {
    console.error("[analyzer-unsubscribe]", e);
    return html("Something went wrong", "We couldn't process the unsubscribe. Please try again in a moment.");
  }
});

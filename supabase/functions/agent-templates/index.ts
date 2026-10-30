// Admin-only writes for agent templates. Every config is validated against the
// shared schema (same rules as the customer forms) before it is stored.
// POST { action: "create" | "update" | "duplicate" | "archive" | "unarchive" | "from_agent", ... }
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { configFromAgent, validateTemplateConfig } from "../_shared/agent-template-schema.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "template";

const META_FIELDS = ["name", "business_type", "description", "icon", "is_public", "sort_order"] as const;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
  const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
  const { data: userData } = await db.auth.getUser(token);
  const user = userData?.user;
  if (!user) return json({ error: "Not signed in" }, 401);
  const { data: isAdmin } = await db.rpc("has_role", { _user_id: user.id, _role: "admin" });
  // Same answer as a missing route: non-admins learn nothing.
  if (!isAdmin) return json({ error: "Not found" }, 404);

  const body = await req.json().catch(() => ({}));

  const meta = (src: Record<string, unknown> | null | undefined) => {
    const out: Record<string, unknown> = {};
    for (const k of META_FIELDS) if (src?.[k] !== undefined) out[k] = src[k];
    if (typeof out.name === "string") out.name = (out.name as string).trim().slice(0, 80);
    if (typeof out.business_type === "string") out.business_type = (out.business_type as string).trim().slice(0, 80);
    if (typeof out.description === "string") out.description = (out.description as string).slice(0, 500);
    if (out.is_public !== undefined) out.is_public = out.is_public === true;
    if (out.sort_order !== undefined) out.sort_order = Number(out.sort_order) || 0;
    return out;
  };

  const uniqueSlug = async (base: string) => {
    const root = slugify(base);
    for (let i = 0; i < 50; i++) {
      const candidate = i === 0 ? root : `${root}-${i + 1}`;
      const { data } = await db.from("agent_templates").select("id").eq("slug", candidate).maybeSingle();
      if (!data) return candidate;
    }
    return `${root}-${crypto.randomUUID().slice(0, 8)}`;
  };

  switch (body.action) {
    case "create": {
      const v = validateTemplateConfig(body.config);
      if (!v.ok) return json({ error: "Template is not valid", errors: v.errors }, 422);
      const m = meta(body);
      if (!m.name || !m.business_type) return json({ error: "name and business type are required" }, 422);
      const { data, error } = await db.from("agent_templates").insert({
        ...m,
        slug: await uniqueSlug(String(body.slug || m.name)),
        config: v.value,
        schema_version: v.value.schema_version,
        created_by: user.id,
      }).select("*").single();
      return error ? json({ error: error.message }, 400) : json({ template: data });
    }
    case "update": {
      if (!body.id) return json({ error: "id is required" }, 400);
      const patch: Record<string, unknown> = meta(body);
      if (body.config !== undefined) {
        const v = validateTemplateConfig(body.config);
        if (!v.ok) return json({ error: "Template is not valid", errors: v.errors }, 422);
        patch.config = v.value;
        patch.schema_version = v.value.schema_version;
      }
      const { data, error } = await db.from("agent_templates").update(patch).eq("id", body.id).select("*").single();
      return error ? json({ error: error.message }, 400) : json({ template: data });
    }
    case "duplicate": {
      const { data: src } = await db.from("agent_templates").select("*").eq("id", body.id).maybeSingle();
      if (!src) return json({ error: "Template not found" }, 404);
      const { data, error } = await db.from("agent_templates").insert({
        name: `${src.name} (copy)`.slice(0, 80),
        slug: await uniqueSlug(`${src.slug}-copy`),
        business_type: src.business_type,
        description: src.description,
        icon: src.icon,
        is_public: false,
        sort_order: src.sort_order,
        config: src.config,
        schema_version: src.schema_version,
        created_by: user.id,
      }).select("*").single();
      return error ? json({ error: error.message }, 400) : json({ template: data });
    }
    case "archive":
    case "unarchive": {
      const { data, error } = await db.from("agent_templates")
        .update(body.action === "archive" ? { archived_at: new Date().toISOString(), is_public: false } : { archived_at: null })
        .eq("id", body.id).select("*").single();
      return error ? json({ error: error.message }, 400) : json({ template: data });
    }
    case "from_agent": {
      // Returns a draft for the editor; nothing is stored until "create".
      const { data: agent } = await db.from("signal_agents").select("*").eq("id", body.agent_id).maybeSingle();
      if (!agent) return json({ error: "Agent not found" }, 404);
      const { data: campaign } = await db.from("campaigns").select("*")
        .eq("source_agent_id", agent.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
      const config = configFromAgent(agent, campaign);
      const v = validateTemplateConfig(config);
      return json({ config, errors: v.ok ? [] : v.errors, had_campaign: Boolean(campaign) });
    }
    case "list_agents": {
      // For "Save as template": every customer agent, newest first.
      const { data } = await db.from("signal_agents").select("id, name, user_id, created_at, results_count")
        .order("created_at", { ascending: false }).limit(200);
      return json({ agents: data ?? [] });
    }
    default:
      return json({ error: "unknown action" }, 400);
  }
});

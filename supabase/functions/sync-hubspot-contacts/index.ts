import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const INTERESTED_TIERS = ["hot", "warm"];
const INTERESTED_STATUSES = ["replied", "positive_reply", "meeting_booked", "interested"];

const BATCH_SIZE = 100;
const MAX_CONTACTS = 500;

const CUSTOM_PROPS = [
  {
    name: "intentsly_lead_id",
    label: "Intentsly Lead ID",
    type: "string",
    fieldType: "text",
    hasUniqueValue: true,
    description: "Unique Intentsly lead identifier used to update synced contacts.",
  },
  {
    name: "intentsly_linkedin_url",
    label: "Intentsly LinkedIn URL",
    type: "string",
    fieldType: "text",
    description: "LinkedIn profile URL captured by Intentsly.",
  },
  {
    name: "intentsly_signal",
    label: "Intentsly Signal",
    type: "string",
    fieldType: "textarea",
    description: "Why Intentsly surfaced this lead.",
  },
  {
    name: "intentsly_signal_post",
    label: "Intentsly Signal Post",
    type: "string",
    fieldType: "textarea",
    description: "Post excerpt or signal context that triggered the lead.",
  },
  {
    name: "intentsly_signal_post_url",
    label: "Intentsly Signal Post URL",
    type: "string",
    fieldType: "text",
    description: "Link to the post that triggered the signal.",
  },
  {
    name: "intentsly_tier",
    label: "Intentsly Relevance Tier",
    type: "string",
    fieldType: "text",
    description: "Hot / warm / cold relevance from Intentsly.",
  },
];

type HubSpotProperty = {
  name: string;
  label?: string;
  type?: string;
  fieldType?: string;
};

type HubSpotPropertyTargets = {
  leadId: string[];
  linkedinUrl: string[];
  signal: string[];
  signalPost: string[];
  signalPostUrl: string[];
  tier: string[];
};

function normalizePropertyName(value?: string) {
  return (value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

async function hubspotFetch(apiKey: string, path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("Authorization", `Bearer ${apiKey}`);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  return fetch(`https://api.hubapi.com${path}`, { ...init, headers });
}

async function fetchHubSpotContactProperties(apiKey: string): Promise<HubSpotProperty[]> {
  const res = await hubspotFetch(apiKey, "/crm/v3/properties/contacts?archived=false");
  const text = await res.text();

  if (!res.ok) {
    console.error("HubSpot properties read failed", res.status, text.slice(0, 500));
    if (res.status === 401 || res.status === 403) {
      throw new Error(
        "HubSpot token is missing property permissions. Reconnect it with crm.objects.contacts.read, crm.objects.contacts.write, crm.schemas.contacts.read, and crm.schemas.contacts.write."
      );
    }
    throw new Error(`HubSpot properties read failed (${res.status}).`);
  }

  const parsed = JSON.parse(text);
  return Array.isArray(parsed?.results) ? parsed.results : [];
}

function resolveTargets(properties: HubSpotProperty[]): HubSpotPropertyTargets {
  const byName = new Map(properties.map((p) => [p.name, p]));

  const collect = (internalNames: string[], labels: string[]) => {
    const normalizedLabels = new Set(labels.map(normalizePropertyName));
    const names = new Set<string>();

    for (const name of internalNames) {
      if (byName.has(name)) names.add(name);
    }

    for (const property of properties) {
      if (normalizedLabels.has(normalizePropertyName(property.label))) names.add(property.name);
    }

    return Array.from(names);
  };

  return {
    leadId: collect(["intentsly_lead_id"], ["Intentsly Lead ID"]),
    linkedinUrl: collect(["intentsly_linkedin_url"], ["Intentsly LinkedIn URL"]),
    signal: collect(["intentsly_signal"], ["Intentsly Signal"]),
    signalPost: collect(["intentsly_signal_post"], ["Intentsly Signal Post"]),
    signalPostUrl: collect(["intentsly_signal_post_url"], ["Intentsly Signal Post URL"]),
    tier: collect(["intentsly_tier"], ["Intentsly Relevance Tier"]),
  };

}

async function ensureCustomProperties(apiKey: string): Promise<HubSpotPropertyTargets> {
  let properties = await fetchHubSpotContactProperties(apiKey);

  for (const p of CUSTOM_PROPS) {
    const exists = properties.some((prop) => prop.name === p.name);
    const path = exists ? `/crm/v3/properties/contacts/${p.name}` : "/crm/v3/properties/contacts";
    const body = exists
      ? { label: p.label, description: p.description }
      : { ...p, groupName: "contactinformation" };

    const res = await hubspotFetch(apiKey, path, {
      method: exists ? "PATCH" : "POST",
      body: JSON.stringify(body),
    });

    const text = await res.text();
    const isDuplicateLabel = res.status === 400 && /NON_UNIQUE_PROPERTY_LABEL|same label/i.test(text);
    if (!res.ok && res.status !== 409 && !isDuplicateLabel) {
      console.error(`ensureCustomProperties ${p.name} failed`, res.status, text.slice(0, 500));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          "HubSpot token is missing property permissions. Reconnect it with crm.objects.contacts.read, crm.objects.contacts.write, crm.schemas.contacts.read, and crm.schemas.contacts.write."
        );
      }
      throw new Error(`HubSpot could not create the ${p.label} field (${res.status}).`);
    }
  }

  properties = await fetchHubSpotContactProperties(apiKey);
  const targets = resolveTargets(properties);

  if (!targets.leadId.length || !targets.linkedinUrl.length || !targets.signal.length || !targets.signalPostUrl.length) {
    throw new Error(
      "HubSpot fields could not be prepared. Reconnect your token with crm.schemas.contacts.read and crm.schemas.contacts.write."
    );
  }

  return targets;
}

function assignToTargets(properties: Record<string, string>, targets: string[], value: unknown, maxLength = 65000) {
  if (value === null || value === undefined || value === "") return;
  const text = String(value).slice(0, maxLength);
  for (const target of targets) properties[target] = text;
}

function parseCompanyFromHeadline(headline?: string | null) {
  if (!headline) return null;
  const match = headline.match(/(?:\b(?:at|@)\s+)([^|,;·•–—-]{2,80})/i);
  return match?.[1]?.trim() || null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: integ, error: integErr } = await supabase
      .from("crm_integrations")
      .select("*")
      .eq("user_id", user.id)
      .eq("provider", "hubspot")
      .eq("is_active", true)
      .maybeSingle();

    if (integErr) throw integErr;
    if (!integ) {
      return new Response(JSON.stringify({ error: "HubSpot not connected" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const propertyTargets = await ensureCustomProperties(integ.api_key);

    let query = supabase
      .from("contacts")
      .select("id, first_name, last_name, title, company, linkedin_url, industry, relevance_tier, lead_status, signal, signal_post_excerpt, signal_post_url")
      .eq("user_id", user.id)
      .order("imported_at", { ascending: false })
      .limit(MAX_CONTACTS);

    if (integ.sync_mode === "interested") {
      query = query.or(
        `relevance_tier.in.(${INTERESTED_TIERS.join(",")}),lead_status.in.(${INTERESTED_STATUSES.join(",")})`
      );
    }

    const { data: contacts, error: cErr } = await query;
    if (cErr) throw cErr;

    const inputs = (contacts || [])
      .map((c: any) => {
        const properties: Record<string, string> = {};
        const company = c.company || parseCompanyFromHeadline(c.title);

        if (c.first_name) properties.firstname = String(c.first_name);
        if (c.last_name) properties.lastname = String(c.last_name);
        if (c.title) properties.jobtitle = String(c.title);
        if (company) properties.company = String(company);
        if (c.industry) properties.industry = String(c.industry);

        assignToTargets(properties, propertyTargets.leadId, c.id, 255);
        assignToTargets(properties, propertyTargets.linkedinUrl, c.linkedin_url, 1000);
        assignToTargets(properties, propertyTargets.signal, c.signal);
        assignToTargets(properties, propertyTargets.signalPost, c.signal_post_excerpt || c.signal);
        assignToTargets(properties, propertyTargets.signalPostUrl, c.signal_post_url, 1000);
        assignToTargets(properties, propertyTargets.tier, c.relevance_tier, 255);

        return { id: String(c.id), properties };
      })
      .filter((row) => Object.keys(row.properties).length > 0);

    let synced = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < inputs.length; i += BATCH_SIZE) {
      const batch = inputs.slice(i, i + BATCH_SIZE);
      try {
        const res = await hubspotFetch(integ.api_key, "/crm/v3/objects/contacts/batch/upsert", {
          method: "POST",
          body: JSON.stringify({
            inputs: batch.map((row) => ({
              idProperty: "intentsly_lead_id",
              id: row.id,
              properties: row.properties,
            })),
          }),
        });

        const bodyText = await res.text();

        if (res.ok || res.status === 207) {
          try {
            const parsed = JSON.parse(bodyText);
            const results = Array.isArray(parsed?.results) ? parsed.results.length : batch.length;
            const errorCount = Array.isArray(parsed?.errors) ? parsed.errors.length : 0;
            synced += results;
            failed += errorCount;
            if (errorCount && errors.length < 3) errors.push(JSON.stringify(parsed.errors[0]).slice(0, 300));
          } catch {
            synced += batch.length;
          }
        } else {
          failed += batch.length;
          if (errors.length < 3) errors.push(`${res.status}: ${bodyText.slice(0, 300)}`);
          console.error("HubSpot batch upsert failed", res.status, bodyText.slice(0, 500));
        }
      } catch (e: any) {
        failed += batch.length;
        if (errors.length < 3) errors.push(e.message);
        console.error("HubSpot batch exception", e);
      }
    }

    await supabase.from("crm_integrations")
      .update({ last_sync_at: new Date().toISOString(), last_sync_count: synced })
      .eq("id", integ.id);

    return new Response(JSON.stringify({
      success: true,
      synced,
      failed,
      total: inputs.length,
      errors,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err: any) {
    console.error("sync-hubspot-contacts error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
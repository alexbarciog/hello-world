import { useState, useEffect } from "react";
import { FunctionsHttpError } from "@supabase/supabase-js";
import calendlyLogo from "@/assets/calendly-logo.png";
import googleCalendarLogo from "@/assets/google-calendar-logo.png";
import outlookCalendarLogo from "@/assets/outlook-calendar-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Calendar, Check, ExternalLink, Key, Loader2, Plug, RefreshCw, Unplug } from "lucide-react";
import EmailAccountsSection from "@/components/integrations/EmailAccountsSection";

interface CalendarIntegration {
  id: string;
  provider: string;
  calendar_email: string | null;
  is_active: boolean;
  created_at: string;
}

interface CrmIntegration {
  id: string;
  provider: string;
  sync_mode: "all" | "interested";
  is_active: boolean;
  hubspot_portal_id: string | null;
  last_sync_at: string | null;
  last_sync_count: number | null;
}

const providers = [
  {
    id: "calendly",
    name: "Calendly",
    description: "Detect when leads book meetings through your Calendly links.",
    logo: calendlyLogo,
    authType: "oauth" as const,
  },
  {
    id: "google_calendar",
    name: "Google Calendar",
    description: "Sync meetings from your Google Calendar automatically.",
    logo: googleCalendarLogo,
    authType: "oauth" as const,
  },
  {
    id: "outlook_calendar",
    name: "Outlook Calendar",
    description: "Connect your Microsoft Outlook calendar for meeting tracking.",
    logo: outlookCalendarLogo,
    authType: "oauth" as const,
  },
  {
    id: "cal_com",
    name: "Cal.com",
    description: "Integrate with Cal.com for open-source scheduling.",
    logo: "https://cal.com/android-chrome-256x256.png",
    authType: "api_key" as const,
  },
];

const getFunctionErrorMessage = async (error: unknown) => {
  if (error instanceof FunctionsHttpError) {
    try {
      const details = await error.context.json();
      return details?.error || error.message;
    } catch {
      try {
        return await error.context.text();
      } catch {
        return error.message;
      }
    }
  }

  return error instanceof Error ? error.message : "Something went wrong.";
};

const Integrations = () => {
  const [integrations, setIntegrations] = useState<CalendarIntegration[]>([]);
  const [hubspot, setHubspot] = useState<CrmIntegration | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [apiKeyDialog, setApiKeyDialog] = useState(false);
  const [apiKeyValue, setApiKeyValue] = useState("");
  const [savingApiKey, setSavingApiKey] = useState(false);

  // HubSpot state
  const [hubspotDialog, setHubspotDialog] = useState(false);
  const [hsKey, setHsKey] = useState("");
  const [hsMode, setHsMode] = useState<"all" | "interested">("interested");
  const [hsSaving, setHsSaving] = useState(false);
  const [hsSyncing, setHsSyncing] = useState(false);

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    const [{ data: cal }, { data: crm }] = await Promise.all([
      supabase.from("calendar_integrations").select("id, provider, calendar_email, is_active, created_at"),
      supabase.from("crm_integrations").select("id, provider, sync_mode, is_active, hubspot_portal_id, last_sync_at, last_sync_count").eq("provider", "hubspot").maybeSingle(),
    ]);
    setIntegrations(cal || []);
    setHubspot((crm as any) || null);
    if (crm) setHsMode((crm as any).sync_mode);
    setLoading(false);
  };

  const handleConnect = async (providerId: string) => {
    const provider = providers.find((p) => p.id === providerId);
    if (provider?.authType === "api_key") {
      setApiKeyValue("");
      setApiKeyDialog(true);
      return;
    }

    setConnecting(providerId);
    try {
      const { data, error } = await supabase.functions.invoke("connect-calendar", {
        body: { provider: providerId, action: "connect", redirectTo: window.location.origin },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.assign(data.url);
      }
    } catch (err: any) {
      toast({ title: "Connection failed", description: err.message, variant: "destructive" });
    } finally {
      setConnecting(null);
    }
  };

  const handleSaveCalComApiKey = async () => {
    if (!apiKeyValue.trim()) {
      toast({ title: "API key required", description: "Please enter your Cal.com API key.", variant: "destructive" });
      return;
    }
    setSavingApiKey(true);
    try {
      const { data, error } = await supabase.functions.invoke("connect-calendar", {
        body: { provider: "cal_com", action: "api_key", api_key: apiKeyValue.trim() },
      });
      if (error) throw error;
      toast({ title: "Connected", description: "Cal.com has been connected successfully." });
      setApiKeyDialog(false);
      setApiKeyValue("");
      fetchIntegrations();
    } catch (err: any) {
      toast({ title: "Connection failed", description: err.message, variant: "destructive" });
    } finally {
      setSavingApiKey(false);
    }
  };

  const handleDisconnect = async (integration: CalendarIntegration) => {
    const { error } = await supabase
      .from("calendar_integrations")
      .delete()
      .eq("id", integration.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Disconnected", description: `${integration.provider} has been removed.` });
      fetchIntegrations();
    }
  };

  const handleToggle = async (integration: CalendarIntegration, checked: boolean) => {
    const { error } = await supabase
      .from("calendar_integrations")
      .update({ is_active: checked })
      .eq("id", integration.id);
    if (!error) {
      setIntegrations((prev) =>
        prev.map((i) => (i.id === integration.id ? { ...i, is_active: checked } : i))
      );
    }
  };

  const getIntegration = (providerId: string) =>
    integrations.find((i) => i.provider === providerId);

  // ============== HubSpot handlers ==============
  const openHubspot = () => {
    setHsKey("");
    setHsMode(hubspot?.sync_mode || "interested");
    setHubspotDialog(true);
  };

  const handleSaveHubspot = async () => {
    if (!hubspot && !hsKey.trim()) {
      toast({ title: "API key required", description: "Paste your HubSpot Private App token.", variant: "destructive" });
      return;
    }
    setHsSaving(true);
    try {
      if (!hubspot) {
        const { data, error } = await supabase.functions.invoke("connect-hubspot", {
          body: { api_key: hsKey.trim(), sync_mode: hsMode },
        });
        if (error) throw new Error((data as any)?.error || await getFunctionErrorMessage(error));
        toast({ title: "HubSpot connected", description: "You can now sync your leads." });
      } else {
        const { error } = await supabase.functions.invoke("connect-hubspot", {
          body: { action: "update_mode", sync_mode: hsMode },
        });
        if (error) throw new Error(await getFunctionErrorMessage(error));
        toast({ title: "Preferences saved" });
      }
      setHubspotDialog(false);
      fetchIntegrations();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setHsSaving(false);
    }
  };

  const handleDisconnectHubspot = async () => {
    try {
      const { error } = await supabase.functions.invoke("connect-hubspot", {
        body: { action: "disconnect" },
      });
      if (error) throw new Error(await getFunctionErrorMessage(error));
      toast({ title: "HubSpot disconnected" });
      fetchIntegrations();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleSyncHubspot = async () => {
    setHsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("sync-hubspot-contacts", { body: {} });
      if (error) throw new Error((data as any)?.error || await getFunctionErrorMessage(error));
      const d = data as any;
      toast({
        title: "Sync complete",
        description: d.errors?.length
          ? `${d.synced} sent, ${d.failed} skipped. ${d.errors[0]}`
          : `${d.synced} sent to HubSpot, ${d.failed} skipped (of ${d.total}).`,
      });
      fetchIntegrations();
    } catch (err: any) {
      toast({ title: "Sync failed", description: err.message, variant: "destructive" });
    } finally {
      setHsSyncing(false);
    }
  };

  return (
    <div className="flex gap-8 w-full max-w-[1400px] mx-auto px-6 py-6">
      <div className="flex-1 min-w-0 flex flex-col gap-5 rounded-[20px] p-6 border border-gray-200/60 shadow-sm bg-white">
        {/* Header */}
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[12px] flex items-center justify-center" style={{ background: 'linear-gradient(to top, #212121, #444A4A)' }}>
            <Plug className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl text-foreground font-medium">Integrations</h1>
            <p className="text-sm text-muted-foreground">
              Connect your calendars and CRM so the AI can detect booked meetings and push leads where you work.
            </p>
          </div>
        </div>

        {/* CRM section */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">CRM</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              className={`rounded-[12px] p-5 transition-all duration-200 ${
                hubspot
                  ? "border border-green-200 bg-green-50/30"
                  : "border-border border-0 shadow-none bg-[#f6f7f9]"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-[10px] p-2 flex items-center justify-center flex-shrink-0 bg-white">
                  <img
                    src="https://framerusercontent.com/images/8bd5ugDirBL7uvSlNwwiAypSGs.png"
                    alt="HubSpot"
                    className="w-7 h-7 object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-foreground">HubSpot</h3>
                    {hubspot && (
                      <Badge variant="outline" className="bg-green-50 border-green-200/60 text-green-700 text-[10px] px-1.5 py-0">
                        <Check className="w-3 h-3 mr-0.5" /> Connected
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Push your leads to HubSpot Contacts. Choose to sync everything or only interested leads.
                  </p>

                  {hubspot && (
                    <div className="mt-2 space-y-0.5">
                      <p className="text-xs text-muted-foreground">
                        Mode: <span className="font-medium text-foreground">{hubspot.sync_mode === "all" ? "All leads" : "Interested only"}</span>
                      </p>
                      {hubspot.last_sync_at && (
                        <p className="text-xs text-muted-foreground">
                          Last sync: {new Date(hubspot.last_sync_at).toLocaleString()} ({hubspot.last_sync_count} contacts)
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    {hubspot ? (
                      <>
                        <button
                          className="inline-flex items-center justify-center h-8 px-3 text-xs font-medium text-white rounded-[10px] shadow-md hover:opacity-90 disabled:opacity-50"
                          style={{ background: 'linear-gradient(to top, #212121, #444A4A)' }}
                          onClick={handleSyncHubspot}
                          disabled={hsSyncing}
                        >
                          {hsSyncing ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-1.5" />}
                          Sync now
                        </button>
                        <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={openHubspot}>
                          Settings
                        </Button>
                        <Button
                          variant="ghost" size="sm"
                          className="text-xs text-destructive hover:text-destructive h-7 px-2"
                          onClick={handleDisconnectHubspot}
                        >
                          <Unplug className="w-3.5 h-3.5 mr-1" />
                          Disconnect
                        </Button>
                      </>
                    ) : (
                      <button
                        className="inline-flex items-center justify-center h-8 px-4 text-xs font-medium text-white rounded-[12px] hover:opacity-90 shadow-md"
                        style={{ background: 'linear-gradient(to top, #212121, #444A4A)' }}
                        onClick={openHubspot}
                      >
                        <Key className="w-3.5 h-3.5 mr-1.5" />
                        Connect
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Email accounts section */}
        <EmailAccountsSection />

        {/* Calendars section */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Calendars</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {providers.map((provider) => {
            const integration = getIntegration(provider.id);
            const isConnected = !!integration;

            return (
              <div
                key={provider.id}
                className={`rounded-[12px] p-5 transition-all duration-200 ${
                  isConnected
                    ? "border border-green-200 bg-green-50/30"
                    : "border-border border-0 shadow-none bg-[#f6f7f9]"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-[10px] bg-snow-bg-2 border-border/50 p-2 flex items-center justify-center flex-shrink-0 border-0 bg-white">
                    <img
                      src={provider.logo}
                      alt={provider.name}
                      className="w-7 h-7 object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-foreground">{provider.name}</h3>
                      {isConnected && (
                        <Badge variant="outline" className="bg-green-50 border-green-200/60 text-green-700 text-[10px] px-1.5 py-0">
                          <Check className="w-3 h-3 mr-0.5" /> Connected
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {provider.description}
                    </p>

                    {isConnected && integration.calendar_email && (
                      <p className="text-xs text-muted-foreground mt-2 truncate">
                        📧 {integration.calendar_email}
                      </p>
                    )}

                    <div className="flex items-center gap-3 mt-3">
                      {isConnected ? (
                        <>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={integration.is_active}
                              onCheckedChange={(checked) => handleToggle(integration, checked)}
                            />
                            <span className="text-xs text-muted-foreground">
                              {integration.is_active ? "Active" : "Paused"}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-destructive hover:text-destructive h-7 px-2"
                            onClick={() => handleDisconnect(integration)}
                          >
                            <Unplug className="w-3.5 h-3.5 mr-1" />
                            Disconnect
                          </Button>
                        </>
                      ) : (
                        provider.id === "outlook_calendar" ? (
                          <button
                            className="inline-flex items-center justify-center h-8 px-4 text-xs font-medium text-white rounded-[12px] shadow-md opacity-50 cursor-not-allowed"
                            style={{ background: 'linear-gradient(to top, #212121, #444A4A)' }}
                            disabled
                          >
                            <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                            Coming soon
                          </button>
                        ) : (
                        <button
                          className="inline-flex items-center justify-center h-8 px-4 text-xs font-medium text-white rounded-[12px] transition-opacity duration-200 hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none shadow-md"
                          style={{ background: 'linear-gradient(to top, #212121, #444A4A)' }}
                          onClick={() => handleConnect(provider.id)}
                          disabled={connecting === provider.id}
                        >
                          {connecting === provider.id ? (
                            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                          ) : provider.authType === "api_key" ? (
                            <Key className="w-3.5 h-3.5 mr-1.5" />
                          ) : (
                            <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                          )}
                          Connect
                        </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        </div>

        {/* Cal.com API Key Dialog */}
        <Dialog open={apiKeyDialog} onOpenChange={setApiKeyDialog}>
          <DialogContent className="rounded-[12px]">
            <DialogHeader>
              <DialogTitle>Connect Cal.com</DialogTitle>
              <DialogDescription>
                Enter your Cal.com API key to connect. You can find it in your Cal.com dashboard under{" "}
                <a
                  href="https://app.cal.com/settings/developer/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Settings → Developer → API Keys
                </a>.
              </DialogDescription>
            </DialogHeader>
            <div className="py-2">
              <Input
                type="password"
                placeholder="cal_live_..."
                value={apiKeyValue}
                onChange={(e) => setApiKeyValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveCalComApiKey()}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setApiKeyDialog(false)}>
                Cancel
              </Button>
              <button
                className="inline-flex items-center justify-center h-10 px-5 text-sm font-medium text-white rounded-[12px] transition-opacity duration-200 hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none shadow-md"
                style={{ background: 'linear-gradient(to top, #212121, #444A4A)' }}
                onClick={handleSaveCalComApiKey}
                disabled={savingApiKey}
              >
                {savingApiKey && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                Connect
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* HubSpot Dialog */}
        <Dialog open={hubspotDialog} onOpenChange={setHubspotDialog}>
          <DialogContent className="rounded-[12px]">
            <DialogHeader>
              <DialogTitle>{hubspot ? "HubSpot settings" : "Connect HubSpot"}</DialogTitle>
              <DialogDescription>
                {hubspot
                  ? "Change which leads get pushed to your HubSpot account."
                  : (
                    <>
                      Paste a HubSpot Private App access token. Create one in{" "}
                      <a
                        href="https://app.hubspot.com/private-apps"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline"
                      >
                        HubSpot → Settings → Integrations → Private Apps
                      </a>
                      {" "}with scopes <code className="text-xs">crm.objects.contacts.read</code>, <code className="text-xs">crm.objects.contacts.write</code>, <code className="text-xs">crm.schemas.contacts.read</code>, and <code className="text-xs">crm.schemas.contacts.write</code>.
                    </>
                  )}
              </DialogDescription>
            </DialogHeader>

            <div className="py-2 space-y-4">
              {!hubspot && (
                <div>
                  <Label className="text-xs mb-1.5 block">Access token</Label>
                  <Input
                    type="password"
                    placeholder="pat-na1-..."
                    value={hsKey}
                    onChange={(e) => setHsKey(e.target.value)}
                  />
                </div>
              )}

              <div>
                <Label className="text-xs mb-2 block">Which leads should we send to HubSpot?</Label>
                <RadioGroup value={hsMode} onValueChange={(v) => setHsMode(v as "all" | "interested")} className="gap-2">
                  <label className="flex items-start gap-3 p-3 rounded-[10px] border border-border cursor-pointer hover:bg-muted/40">
                    <RadioGroupItem value="interested" className="mt-0.5" />
                    <div>
                      <div className="text-sm font-medium">Only interested leads</div>
                      <div className="text-xs text-muted-foreground">Hot & warm leads, replies, positive intent, meetings booked.</div>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 p-3 rounded-[10px] border border-border cursor-pointer hover:bg-muted/40">
                    <RadioGroupItem value="all" className="mt-0.5" />
                    <div>
                      <div className="text-sm font-medium">All leads</div>
                      <div className="text-xs text-muted-foreground">Every contact Intentsly discovers gets pushed to HubSpot.</div>
                    </div>
                  </label>
                </RadioGroup>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setHubspotDialog(false)}>Cancel</Button>
              <button
                className="inline-flex items-center justify-center h-10 px-5 text-sm font-medium text-white rounded-[12px] hover:opacity-90 disabled:opacity-50 shadow-md"
                style={{ background: 'linear-gradient(to top, #212121, #444A4A)' }}
                onClick={handleSaveHubspot}
                disabled={hsSaving}
              >
                {hsSaving && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                {hubspot ? "Save" : "Connect"}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Integrations;

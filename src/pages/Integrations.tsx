import { useState, useEffect } from "react";
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
import { Calendar, Check, ExternalLink, Key, Loader2, Plug, Unplug } from "lucide-react";

interface CalendarIntegration {
  id: string;
  provider: string;
  calendar_email: string | null;
  is_active: boolean;
  created_at: string;
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

const Integrations = () => {
  const [integrations, setIntegrations] = useState<CalendarIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [apiKeyDialog, setApiKeyDialog] = useState(false);
  const [apiKeyValue, setApiKeyValue] = useState("");
  const [savingApiKey, setSavingApiKey] = useState(false);

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    const { data } = await supabase
      .from("calendar_integrations")
      .select("id, provider, calendar_email, is_active, created_at");
    setIntegrations(data || []);
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
              Connect your calendars so the AI can detect booked meetings and send pre-meeting follow-ups.
            </p>
          </div>
        </div>


        {/* Provider cards */}
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
      </div>
    </div>
  );
};

export default Integrations;

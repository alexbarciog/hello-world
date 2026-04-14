import { useState, useEffect } from "react";
import calendlyLogo from "@/assets/calendly-logo.png";
import googleCalendarLogo from "@/assets/google-calendar-logo.png";
import outlookCalendarLogo from "@/assets/outlook-calendar-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
    color: "from-blue-500 to-blue-600",
    authType: "oauth" as const,
  },
  {
    id: "google_calendar",
    name: "Google Calendar",
    description: "Sync meetings from your Google Calendar automatically.",
    logo: googleCalendarLogo,
    color: "from-red-500 to-yellow-500",
    authType: "oauth" as const,
  },
  {
    id: "outlook_calendar",
    name: "Outlook Calendar",
    description: "Connect your Microsoft Outlook calendar for meeting tracking.",
    logo: outlookCalendarLogo,
    color: "from-blue-600 to-blue-700",
    authType: "oauth" as const,
  },
  {
    id: "cal_com",
    name: "Cal.com",
    description: "Integrate with Cal.com for open-source scheduling.",
    logo: "https://cal.com/android-chrome-256x256.png",
    color: "from-gray-800 to-gray-900",
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
    <div className="p-4 md:p-8 min-h-full rounded-2xl" style={{ background: "hsl(var(--muted))" }}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="relative w-12 h-12 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/30 flex items-center justify-center shadow-lg">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 to-[hsl(245,58%,51%)]/15 pointer-events-none" />
            <Plug className="w-5 h-5 relative z-10" style={{ color: "hsl(var(--primary))" }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-[Space_Grotesk]" style={{ color: "hsl(var(--foreground))" }}>
              Integrations
            </h1>
            <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
              Connect your calendars so the AI can detect booked meetings and send pre-meeting follow-ups.
            </p>
          </div>
        </div>
      </div>

      {/* Info banner — glassmorphism */}
      <div className="relative overflow-hidden rounded-2xl backdrop-blur-xl border border-white/30 mb-8" style={{ background: "rgba(255,255,255,0.6)" }}>
        {/* Dual glow orbs */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl pointer-events-none" style={{ background: "hsl(var(--primary) / 0.15)" }} />
        <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full blur-3xl pointer-events-none" style={{ background: "hsl(245 58% 51% / 0.1)" }} />
        {/* Accent stripe */}
        <div className="absolute top-0 left-0 w-1 h-full rounded-l-2xl bg-gradient-to-b" style={{ backgroundImage: "linear-gradient(to bottom, hsl(var(--primary)), hsl(245,58%,51%))" }} />
        <div className="relative z-10 flex items-center gap-4 px-6 py-5">
          <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br shadow-lg flex items-center justify-center" style={{ backgroundImage: "linear-gradient(135deg, hsl(var(--primary)), hsl(245,58%,51%))" }}>
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Automatic meeting detection</p>
            <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
              When a lead books a meeting, the AI sends a LinkedIn follow-up 1 hour before the call.
            </p>
          </div>
          <div className="shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold backdrop-blur-md border" style={{ background: "hsl(142 76% 36% / 0.08)", borderColor: "hsl(142 76% 36% / 0.2)", color: "hsl(142 71% 29%)" }}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "hsl(142 76% 36% / 0.6)" }} />
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "hsl(142 76% 36%)" }} />
            </span>
            Auto
          </div>
        </div>
      </div>

      {/* Provider cards — glassmorphism grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {providers.map((provider, index) => {
          const integration = getIntegration(provider.id);
          const isConnected = !!integration;

          return (
            <div
              key={provider.id}
              className="group relative overflow-hidden rounded-2xl backdrop-blur-lg border transition-all duration-300 hover:scale-[1.02]"
              style={{
                background: isConnected ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.7)",
                borderColor: isConnected ? "hsl(142 76% 36% / 0.25)" : "rgba(255,255,255,0.25)",
                boxShadow: isConnected
                  ? "0 4px 24px -4px hsl(142 76% 36% / 0.12), 0 1px 3px rgba(0,0,0,0.04)"
                  : "0 4px 24px -4px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)",
                animationDelay: `${index * 80}ms`,
              }}
            >
              {/* Hover glow */}
              <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-3xl pointer-events-none" style={{ background: "hsl(var(--primary) / 0.12)" }} />

              {isConnected && (
                <div className="absolute top-0 left-0 w-full h-[2px]" style={{ backgroundImage: "linear-gradient(to right, hsl(142 76% 36% / 0.5), hsl(152 68% 40% / 0.3), transparent)" }} />
              )}

              <div className="relative z-10 p-6">
                <div className="flex items-start gap-4">
                  {/* Logo — frosted container */}
                  <div className="w-12 h-12 rounded-xl backdrop-blur-md border flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.8)", borderColor: "rgba(0,0,0,0.06)", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06)" }}>
                    <img
                      src={provider.logo}
                      alt={provider.name}
                      className="w-7 h-7 object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="text-sm font-semibold font-[Space_Grotesk]" style={{ color: "hsl(var(--foreground))" }}>{provider.name}</h3>
                      {isConnected && (
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold backdrop-blur-md" style={{ background: "hsl(142 76% 36% / 0.08)", color: "hsl(142 71% 29%)" }}>
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "hsl(142 76% 36% / 0.6)" }} />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: "hsl(142 76% 36%)" }} />
                          </span>
                          Connected
                        </span>
                      )}
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
                      {provider.description}
                    </p>

                    {isConnected && integration.calendar_email && (
                      <p className="text-xs mt-2 truncate" style={{ color: "hsl(var(--muted-foreground))" }}>
                        📧 {integration.calendar_email}
                      </p>
                    )}

                    <div className="flex items-center gap-3 mt-4">
                      {isConnected ? (
                        <>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={integration.is_active}
                              onCheckedChange={(checked) => handleToggle(integration, checked)}
                            />
                            <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                              {integration.is_active ? "Active" : "Paused"}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7 px-2"
                            style={{ color: "hsl(var(--destructive))" }}
                            onClick={() => handleDisconnect(integration)}
                          >
                            <Unplug className="w-3.5 h-3.5 mr-1" />
                            Disconnect
                          </Button>
                        </>
                      ) : (
                        <button
                          className="inline-flex items-center justify-center h-9 px-5 text-xs font-semibold text-white rounded-lg transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:pointer-events-none"
                          style={{
                            backgroundImage: "linear-gradient(135deg, hsl(var(--primary)), hsl(245,58%,51%))",
                            boxShadow: "0 2px 12px -2px hsl(var(--primary) / 0.4)",
                          }}
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
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cal.com API Key Dialog — glassmorphism */}
      <Dialog open={apiKeyDialog} onOpenChange={setApiKeyDialog}>
        <DialogContent className="border-white/20 backdrop-blur-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.85)" }}>
          {/* Top gradient stripe */}
          <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundImage: "linear-gradient(to right, hsl(var(--primary)), hsl(245,58%,51%))" }} />
          <DialogHeader>
            <DialogTitle className="font-[Space_Grotesk]">Connect Cal.com</DialogTitle>
            <DialogDescription>
              Enter your Cal.com API key to connect. You can find it in your Cal.com dashboard under{" "}
              <a
                href="https://app.cal.com/settings/developer/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "hsl(var(--primary))" }}
                className="underline"
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
              className="border-white/30 backdrop-blur-md"
              style={{ background: "rgba(255,255,255,0.6)" }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApiKeyDialog(false)} className="border-white/30 backdrop-blur-md" style={{ background: "rgba(255,255,255,0.5)" }}>
              Cancel
            </Button>
            <button
              className="inline-flex items-center justify-center h-10 px-5 text-sm font-semibold text-white rounded-lg transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:pointer-events-none"
              style={{
                backgroundImage: "linear-gradient(135deg, hsl(var(--primary)), hsl(245,58%,51%))",
                boxShadow: "0 2px 12px -2px hsl(var(--primary) / 0.4)",
              }}
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
  );
};

export default Integrations;

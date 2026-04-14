import { useState, useEffect } from "react";
import calendlyLogo from "@/assets/calendly-logo.png";
import googleCalendarLogo from "@/assets/google-calendar-logo.png";
import outlookCalendarLogo from "@/assets/outlook-calendar-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Calendar, Check, ExternalLink, Loader2, Plug, Unplug } from "lucide-react";

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
  },
  {
    id: "google_calendar",
    name: "Google Calendar",
    description: "Sync meetings from your Google Calendar automatically.",
    logo: googleCalendarLogo,
    color: "from-red-500 to-yellow-500",
  },
  {
    id: "outlook_calendar",
    name: "Outlook Calendar",
    description: "Connect your Microsoft Outlook calendar for meeting tracking.",
    logo: outlookCalendarLogo,
    color: "from-blue-600 to-blue-700",
  },
  {
    id: "cal_com",
    name: "Cal.com",
    description: "Integrate with Cal.com for open-source scheduling.",
    logo: "https://cal.com/android-chrome-256x256.png",
    color: "from-gray-800 to-gray-900",
  },
];

const Integrations = () => {
  const [integrations, setIntegrations] = useState<CalendarIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

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
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-[hsl(245,58%,51%)] flex items-center justify-center shadow-md">
            <Plug className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Integrations</h1>
            <p className="text-sm text-muted-foreground">
              Connect your calendars so the AI can detect booked meetings and send pre-meeting follow-ups.
            </p>
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-border/50 mb-8">
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-gradient-to-br from-primary/15 to-[hsl(245,58%,51%)]/10 blur-2xl pointer-events-none" />
        <div className="absolute top-0 left-0 w-1 h-full rounded-l-2xl bg-gradient-to-b from-primary to-[hsl(245,58%,51%)]" />
        <div className="relative z-10 flex items-center gap-4 px-6 py-4">
          <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-[hsl(245,58%,51%)] shadow-md flex items-center justify-center">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Automatic meeting detection</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              When a lead books a meeting, the AI sends a LinkedIn follow-up 1 hour before the call.
            </p>
          </div>
          <Badge variant="outline" className="bg-green-50 border-green-200/60 text-green-700 text-xs gap-1.5 px-2.5 py-1 shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            Auto
          </Badge>
        </div>
      </div>

      {/* Provider cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {providers.map((provider) => {
          const integration = getIntegration(provider.id);
          const isConnected = !!integration;

          return (
            <Card
              key={provider.id}
              className={`relative overflow-hidden transition-all duration-200 hover:shadow-md ${
                isConnected ? "border-green-200/60 bg-green-50/30" : "border-border"
              }`}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <img
                    src={provider.logo}
                    alt={provider.name}
                    className="w-11 h-11 rounded-xl object-contain bg-white border border-border/50 p-1.5 shadow-sm"
                  />
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
                        <Button
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => handleConnect(provider.id)}
                          disabled={connecting === provider.id}
                        >
                          {connecting === provider.id ? (
                            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                          ) : (
                            <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                          )}
                          Connect
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Integrations;

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Check, Loader2, Mail, Send, Unplug } from "lucide-react";

interface EmailAccount {
  id: string;
  provider: "smtp" | "gmail";
  from_email: string;
  from_name: string | null;
  is_default: boolean;
  verified_at: string | null;
  smtp_host: string | null;
}

const PRESETS: Record<string, { host: string; port: number; secure: boolean; hint: string }> = {
  gmail: { host: "smtp.gmail.com", port: 465, secure: true, hint: "Use a Google App Password (myaccount.google.com/apppasswords) — not your normal Gmail password. 2-step verification must be on." },
  outlook: { host: "smtp.office365.com", port: 587, secure: false, hint: "Uses STARTTLS on port 587. Sign in with your Microsoft account email + password." },
  yahoo: { host: "smtp.mail.yahoo.com", port: 465, secure: true, hint: "Requires a Yahoo app password from account security settings." },
  custom: { host: "", port: 587, secure: false, hint: "Enter your provider's SMTP details. Most custom domain hosts use port 587 (STARTTLS) or 465 (SSL)." },
};

export default function EmailAccountsSection() {
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);

  const [preset, setPreset] = useState<keyof typeof PRESETS>("gmail");
  const [fromEmail, setFromEmail] = useState("");
  const [fromName, setFromName] = useState("");
  const [host, setHost] = useState(PRESETS.gmail.host);
  const [port, setPort] = useState<number>(PRESETS.gmail.port);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState<boolean>(PRESETS.gmail.secure);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("email_accounts")
      .select("id, provider, from_email, from_name, is_default, verified_at, smtp_host")
      .order("created_at", { ascending: false });
    setAccounts((data as EmailAccount[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openDialog = () => {
    setPreset("gmail");
    applyPreset("gmail");
    setFromEmail("");
    setFromName("");
    setUsername("");
    setPassword("");
    setDialogOpen(true);
  };

  const applyPreset = (p: keyof typeof PRESETS) => {
    setPreset(p);
    const cfg = PRESETS[p];
    setHost(cfg.host);
    setPort(cfg.port);
    setSecure(cfg.secure);
  };

  const handleSave = async () => {
    if (!fromEmail.trim() || !host.trim() || !username.trim() || !password.trim()) {
      toast({ title: "Missing details", description: "Fill in the from email, host, username and password.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("email-account-save-smtp", {
        body: {
          from_email: fromEmail.trim(),
          from_name: fromName.trim() || null,
          smtp_host: host.trim(),
          smtp_port: Number(port),
          smtp_username: username.trim(),
          smtp_password: password,
          smtp_secure: secure,
        },
      });
      if (error) throw new Error((data as any)?.error || error.message);
      toast({ title: "Inbox connected", description: `Test email delivered to ${fromEmail}. Campaign emails will now send from this address.` });
      setDialogOpen(false);
      load();
    } catch (e: any) {
      toast({ title: "Connection failed", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const sendTest = async (acct: EmailAccount) => {
    setTesting(acct.id);
    try {
      const { data, error } = await supabase.functions.invoke("email-account-send-test", { body: { account_id: acct.id } });
      if (error) throw new Error((data as any)?.error || error.message);
      toast({ title: "Test email sent", description: `Check ${acct.from_email}.` });
    } catch (e: any) {
      toast({ title: "Test failed", description: e.message, variant: "destructive" });
    } finally {
      setTesting(null);
    }
  };

  const disconnect = async (acct: EmailAccount) => {
    if (!confirm(`Disconnect ${acct.from_email}? Campaign emails will fall back to the default sender.`)) return;
    const { error } = await supabase.from("email_accounts").delete().eq("id", acct.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Disconnected" });
      load();
    }
  };

  const setDefault = async (acct: EmailAccount) => {
    await supabase.from("email_accounts").update({ is_default: false }).neq("id", acct.id);
    await supabase.from("email_accounts").update({ is_default: true }).eq("id", acct.id);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email accounts</h2>
        <button
          className="inline-flex items-center justify-center h-8 px-3 text-xs font-medium text-white rounded-[10px] hover:opacity-90 shadow-md"
          style={{ background: 'linear-gradient(to top, #212121, #444A4A)' }}
          onClick={openDialog}
        >
          <Mail className="w-3.5 h-3.5 mr-1.5" /> Connect inbox
        </button>
      </div>

      {loading ? (
        <div className="rounded-[12px] bg-[#f6f7f9] p-5 text-xs text-muted-foreground">Loading…</div>
      ) : accounts.length === 0 ? (
        <div className="rounded-[12px] bg-[#f6f7f9] p-5">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-[10px] bg-white flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground mb-1">Send campaign emails from your own inbox</h3>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                Connect Gmail, Google Workspace, Outlook, or any custom domain via SMTP. Emails will be sent from your real address instead of a shared sender — better deliverability, replies land in your inbox.
              </p>
              <button
                className="inline-flex items-center justify-center h-8 px-4 text-xs font-medium text-white rounded-[12px] hover:opacity-90 shadow-md"
                style={{ background: 'linear-gradient(to top, #212121, #444A4A)' }}
                onClick={openDialog}
              >
                <Mail className="w-3.5 h-3.5 mr-1.5" /> Connect inbox
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {accounts.map((a) => (
            <div key={a.id} className="rounded-[12px] p-5 border border-green-200 bg-green-50/30">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-[10px] bg-white flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-sm font-semibold text-foreground truncate">{a.from_email}</h3>
                    <Badge variant="outline" className="bg-green-50 border-green-200/60 text-green-700 text-[10px] px-1.5 py-0">
                      <Check className="w-3 h-3 mr-0.5" /> Connected
                    </Badge>
                    {a.is_default && (
                      <Badge variant="outline" className="bg-white border-border text-[10px] px-1.5 py-0">Default sender</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed truncate">
                    {a.provider === "smtp" ? `SMTP · ${a.smtp_host}` : "Gmail"}
                    {a.from_name ? ` · ${a.from_name}` : ""}
                  </p>
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <Button variant="outline" size="sm" className="text-xs h-7 px-2" onClick={() => sendTest(a)} disabled={testing === a.id}>
                      {testing === a.id ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Send className="w-3.5 h-3.5 mr-1" />}
                      Send test
                    </Button>
                    {!a.is_default && (
                      <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={() => setDefault(a)}>
                        Make default
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="text-xs text-destructive hover:text-destructive h-7 px-2" onClick={() => disconnect(a)}>
                      <Unplug className="w-3.5 h-3.5 mr-1" /> Disconnect
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-[12px] max-w-lg">
          <DialogHeader>
            <DialogTitle>Connect your inbox</DialogTitle>
            <DialogDescription>
              Send campaign emails from your own address — Gmail, Google Workspace, Outlook, or any custom domain via SMTP.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-4">
            <div>
              <Label className="text-xs mb-2 block">Provider</Label>
              <div className="grid grid-cols-4 gap-2">
                {(["gmail", "outlook", "yahoo", "custom"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className={`h-9 rounded-[10px] text-xs font-medium capitalize border ${preset === p ? "bg-foreground text-white border-foreground" : "bg-white border-border text-foreground"}`}
                  >
                    {p === "custom" ? "Custom" : p}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">{PRESETS[preset].hint}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1.5 block">From email</Label>
                <Input placeholder="you@yourdomain.com" value={fromEmail} onChange={(e) => { setFromEmail(e.target.value); if (!username) setUsername(e.target.value); }} />
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">From name (optional)</Label>
                <Input placeholder="Alex from Intentsly" value={fromName} onChange={(e) => setFromName(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Label className="text-xs mb-1.5 block">SMTP host</Label>
                <Input placeholder="smtp.gmail.com" value={host} onChange={(e) => setHost(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">Port</Label>
                <Input type="number" value={port} onChange={(e) => setPort(Number(e.target.value))} />
              </div>
            </div>

            <div>
              <Label className="text-xs mb-1.5 block">Username</Label>
              <Input placeholder="you@yourdomain.com" value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Password / App password</Label>
              <Input type="password" placeholder="••••••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>

            <div className="flex items-center gap-3 rounded-[10px] bg-[#f6f7f9] px-3 py-2">
              <Switch checked={secure} onCheckedChange={setSecure} />
              <div className="text-xs">
                <div className="font-medium">SSL/TLS on connect</div>
                <div className="text-muted-foreground">On for port 465. Off for 587/25 (STARTTLS).</div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <button
              className="inline-flex items-center justify-center h-10 px-5 text-sm font-medium text-white rounded-[12px] hover:opacity-90 disabled:opacity-50 shadow-md"
              style={{ background: 'linear-gradient(to top, #212121, #444A4A)' }}
              onClick={handleSave}
              disabled={saving}
            >
              {saving && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              Verify & connect
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

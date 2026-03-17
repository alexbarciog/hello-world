import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Users, Building2, User, Linkedin, Shield, MessageSquare,
  CreditCard, Key, Plus, ChevronDown, Info, Settings as SettingsIcon
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type Tab =
  | "organization"
  | "company"
  | "account"
  | "linkedin"
  | "security"
  | "ai-templates"
  | "billing"
  | "api";

const tabsList: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "organization", label: "Organization", icon: <Users className="w-3.5 h-3.5" /> },
  { id: "company", label: "Company", icon: <Building2 className="w-3.5 h-3.5" /> },
  { id: "account", label: "Account", icon: <User className="w-3.5 h-3.5" /> },
  { id: "linkedin", label: "LinkedIn Accounts", icon: <Linkedin className="w-3.5 h-3.5" /> },
  { id: "security", label: "Security", icon: <Shield className="w-3.5 h-3.5" /> },
  { id: "ai-templates", label: "AI LinkedIn Templates", icon: <MessageSquare className="w-3.5 h-3.5" /> },
  { id: "billing", label: "Billing", icon: <CreditCard className="w-3.5 h-3.5" /> },
  { id: "api", label: "API", icon: <Key className="w-3.5 h-3.5" /> },
];

// ─── Shared styles ────────────────────────────────────────────────────────────
const inputCls = "w-full border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[hsl(var(--goji-coral))] focus:border-[hsl(var(--goji-coral))] bg-white";
const labelCls = "block text-sm font-medium text-gray-700 mb-1";
const saveBtnCls = "px-5 py-2 rounded-md text-sm font-semibold text-white transition-opacity hover:opacity-90";

// ─── Organization Tab ─────────────────────────────────────────────────────────
function OrganizationTab({ userEmail, userName }: { userEmail: string; userName: string }) {
  const [email, setEmail] = useState("");
  const initials = userName ? userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "U";

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-base font-bold text-gray-900">{userName || "Your Organization"} - Members</h2>
        <p className="text-xs text-gray-500 mt-0.5">Manage who has access to your organization and their roles</p>
      </div>

      <div className="mb-6">
        <p className="text-sm font-semibold text-gray-700 mb-2">Invite New Member</p>
        <div className="flex gap-2">
          <input type="email" placeholder="Enter email address" value={email} onChange={(e) => setEmail(e.target.value)} className={`${inputCls} flex-1`} />
          <button className={saveBtnCls} style={{ background: "hsl(var(--goji-coral))" }} onClick={() => { toast.success("Invitation sent to " + email); setEmail(""); }}>Invite</button>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Member</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Role</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Joined</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-xs font-bold text-white">{initials}</div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{userName || "User"}</p>
                    <p className="text-xs text-gray-500">{userEmail}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-4">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 border border-yellow-200">
                  <Building2 className="w-3 h-3" /> Owner
                </span>
              </td>
              <td className="px-4 py-4"><span className="text-sm text-gray-600">{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span></td>
              <td className="px-4 py-4"><span className="text-sm text-gray-400">—</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Company Tab ──────────────────────────────────────────────────────────────
function CompanyTab({ campaignData, onSave }: { campaignData: any; onSave: (data: any) => void }) {
  const [form, setForm] = useState({
    name: "",
    website: "",
    industry: "",
    size: "",
    description: "",
    linkedin: "",
    autoEnrich: false,
    preventDuplication: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (campaignData) {
      setForm((prev) => ({
        ...prev,
        name: campaignData.company_name || prev.name,
        website: campaignData.website || prev.website,
        industry: campaignData.industry || prev.industry,
        description: campaignData.description || prev.description,
      }));
    }
  }, [campaignData]);

  async function handleSave() {
    setSaving(true);
    await onSave({
      company_name: form.name,
      website: form.website,
      industry: form.industry,
      description: form.description,
    });
    setSaving(false);
    toast.success("Company settings saved!");
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-base font-bold text-gray-900">Company Information</h2>
        <p className="text-xs text-blue-500 mt-0.5">Update your company details and business information</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className={labelCls}>Company Name <span className="text-red-400">*</span></label>
          <input className={inputCls} value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
        </div>
        <div>
          <label className={labelCls}>Website</label>
          <input className={inputCls} placeholder="https://yourcompany.com" value={form.website} onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className={labelCls}>Industry <span className="text-red-400">*</span></label>
          <div className="relative">
            <select className={`${inputCls} appearance-none`} value={form.industry} onChange={(e) => setForm((p) => ({ ...p, industry: e.target.value }))}>
              <option value="">Select your industry</option>
              <option>Technology</option><option>SaaS</option><option>Marketing</option><option>Finance</option><option>Healthcare</option><option>E-commerce</option><option>Hospitality</option><option>Retail</option><option>Manufacturing</option><option>Education</option><option>Real Estate</option><option>Consulting</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
        <div>
          <label className={labelCls}>Company Size <span className="text-red-400">*</span></label>
          <div className="relative">
            <select className={`${inputCls} appearance-none`} value={form.size} onChange={(e) => setForm((p) => ({ ...p, size: e.target.value }))}>
              <option value="">Select company size</option>
              <option>1-10</option><option>11-50</option><option>51-200</option><option>201-500</option><option>500+</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="mb-4">
        <label className={labelCls}>Company Description</label>
        <textarea className={`${inputCls} resize-none`} rows={4} placeholder="Brief description of what your company does..." value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
      </div>

      <div className="mb-8">
        <label className={labelCls}>LinkedIn Company Page</label>
        <input className={inputCls} placeholder="https://www.linkedin.com/company/yourcompany" value={form.linkedin} onChange={(e) => setForm((p) => ({ ...p, linkedin: e.target.value }))} />
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-bold text-gray-900 mb-3">Company Preferences</h3>
        <div className="space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" className="mt-0.5 w-4 h-4 rounded border-gray-300 accent-[hsl(var(--goji-coral))]" checked={form.autoEnrich} onChange={(e) => setForm((p) => ({ ...p, autoEnrich: e.target.checked }))} />
            <div>
              <p className="text-sm font-medium text-gray-700">Auto-enrich email addresses</p>
              <p className="text-xs text-gray-500">Automatically find and enrich email addresses for generated leads</p>
            </div>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" className="mt-0.5 w-4 h-4 rounded border-gray-300 accent-[hsl(var(--goji-coral))]" checked={form.preventDuplication} onChange={(e) => setForm((p) => ({ ...p, preventDuplication: e.target.checked }))} />
            <div>
              <p className="text-sm font-medium text-gray-700">Prevent contact duplication across team members</p>
              <p className="text-xs text-gray-500">When enabled, AI agents will ensure the same lead is not imported into multiple team members' contact lists</p>
            </div>
          </label>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} className={saveBtnCls} style={{ background: "hsl(var(--goji-coral))" }}>
        {saving ? "Saving..." : "Save Settings"}
      </button>
    </div>
  );
}

// ─── Account Tab ──────────────────────────────────────────────────────────────
function AccountTab({ userEmail, campaignData, onSave }: { userEmail: string; campaignData: any; onSave: (data: any) => void }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    language: "English (US)",
    timezone: "Europe/Bucharest",
    emailNotifications: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (campaignData) {
      // Try to extract name from company_name or use defaults
      const lang = campaignData.language || "English (US)";
      const country = campaignData.country || "";
      setForm((prev) => ({
        ...prev,
        language: lang,
        timezone: country.toLowerCase().includes("romania") ? "Europe/Bucharest" :
                  country.toLowerCase().includes("us") || country.toLowerCase().includes("united states") ? "America/New_York" :
                  country.toLowerCase().includes("uk") || country.toLowerCase().includes("united kingdom") ? "Europe/London" :
                  country.toLowerCase().includes("france") ? "Europe/Paris" :
                  country.toLowerCase().includes("germany") ? "Europe/Berlin" : prev.timezone,
      }));
    }
  }, [campaignData]);

  async function handleSave() {
    setSaving(true);
    await onSave({ language: form.language, country: form.timezone });
    setSaving(false);
    toast.success("Account settings saved!");
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-base font-bold text-gray-900">Account Settings</h2>
        <p className="text-xs text-gray-500 mt-0.5">Manage your personal account information and preferences</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className={labelCls}>First Name</label>
          <input className={inputCls} value={form.firstName} onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))} />
        </div>
        <div>
          <label className={labelCls}>Last Name</label>
          <input className={inputCls} value={form.lastName} onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))} />
        </div>
      </div>

      <div className="mb-4">
        <label className={labelCls}>Email</label>
        <input className={inputCls} value={userEmail} disabled />
        <p className="text-xs text-gray-400 mt-1">Email cannot be changed here</p>
      </div>

      <div className="mb-4">
        <label className={labelCls}>Preferred Language</label>
        <div className="relative">
          <select className={`${inputCls} appearance-none`} value={form.language} onChange={(e) => setForm((p) => ({ ...p, language: e.target.value }))}>
            <option>English (US)</option><option>Romanian</option><option>French</option><option>Spanish</option><option>German</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <p className="text-xs text-gray-400 mt-1">This language preference will be used for AI message generation</p>
      </div>

      <div className="mb-6">
        <label className={labelCls}>Timezone</label>
        <div className="relative">
          <select className={`${inputCls} appearance-none`} value={form.timezone} onChange={(e) => setForm((p) => ({ ...p, timezone: e.target.value }))}>
            <option>Europe/Bucharest</option><option>America/New_York</option><option>America/Los_Angeles</option><option>Europe/London</option><option>Europe/Paris</option><option>Europe/Berlin</option><option>Asia/Tokyo</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      <div className="mb-8">
        <p className="text-sm font-medium text-gray-700 mb-2">Email Notifications</p>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" className="w-4 h-4 rounded border-gray-300 accent-[hsl(var(--goji-coral))]" checked={form.emailNotifications} onChange={(e) => setForm((p) => ({ ...p, emailNotifications: e.target.checked }))} />
          <span className="text-sm text-gray-700">Receive a daily email summary of newly imported leads</span>
        </label>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving} className={saveBtnCls} style={{ background: "hsl(var(--goji-coral))" }}>
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}

// ─── LinkedIn Accounts Tab ────────────────────────────────────────────────────
function LinkedInTab({ onConnected }: { onConnected?: () => void }) {
  const [connecting, setConnecting] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    checkConnection();
  }, []);

  async function getAuthToken() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");
    return session.access_token;
  }

  async function callConnectLinkedin(body: Record<string, unknown>) {
    const token = await getAuthToken();
    const res = await fetch(
      `https://uwwajlezgeurnvvrvdvb.supabase.co/functions/v1/connect-linkedin`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      }
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
  }

  async function checkConnection() {
    setLoadingStatus(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("unipile_account_id")
        .eq("user_id", user.id)
        .single();
      if (profile?.unipile_account_id) {
        setAccountId(profile.unipile_account_id);
      }
    }
    setLoadingStatus(false);
  }

  async function handleConnect() {
    setConnecting(true);
    try {
      const data = await callConnectLinkedin({ action: "create_link" });

      if (data.status === "link_created" && data.url) {
        // Open Unipile hosted auth in a new tab
        window.open(data.url, "_blank", "noopener,noreferrer");
        // Start polling for connection
        startPolling();
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to initiate LinkedIn connection");
    } finally {
      setConnecting(false);
    }
  }

  function startPolling() {
    setPolling(true);
    let attempts = 0;
    const maxAttempts = 90; // 3 minutes

    const interval = setInterval(async () => {
      attempts++;
      if (attempts >= maxAttempts) {
        clearInterval(interval);
        setPolling(false);
        toast.error("Connection timed out. Please try again.");
        return;
      }
      try {
        const data = await callConnectLinkedin({ action: "check_status" });
        if (data.status === "connected") {
          clearInterval(interval);
          setPolling(false);
          setAccountId(data.account_id);
          toast.success("LinkedIn account connected successfully!");
          onConnected?.();
        }
      } catch {
        // Keep polling
      }
    }, 2000);
  }

  async function handleDisconnect() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("profiles")
      .update({ unipile_account_id: null } as any)
      .eq("user_id", user.id);
    setAccountId(null);
    toast.success("LinkedIn account disconnected");
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-base font-bold text-gray-900">LinkedIn Connection</h2>
        <p className="text-xs text-gray-500 mt-0.5">Connect your LinkedIn account to enable automated lead discovery</p>
      </div>

      {loadingStatus ? (
        <div className="text-sm text-gray-400 py-8 text-center">Checking connection status...</div>
      ) : accountId ? (
        <div className="border border-green-200 bg-green-50 rounded-lg p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Linkedin className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">LinkedIn Connected</p>
                <p className="text-xs text-gray-500">Account ID: {accountId.slice(0, 12)}...</p>
              </div>
            </div>
            <button
              onClick={handleDisconnect}
              className="text-xs font-medium text-red-500 border border-red-200 rounded-md px-3 py-1.5 hover:bg-red-50 transition-colors"
            >
              Disconnect
            </button>
          </div>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <Linkedin className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Connect your LinkedIn</p>
              <p className="text-xs text-gray-500">Securely link your account to start discovering and engaging leads</p>
            </div>
          </div>

          {polling ? (
            <div className="flex items-center gap-3 py-4">
              <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "hsl(var(--goji-coral))", borderTopColor: "transparent" }} />
              <span className="text-sm text-gray-600">Waiting for LinkedIn connection… Complete the process in the opened tab.</span>
            </div>
          ) : (
            <button
              onClick={handleConnect}
              disabled={connecting}
              className={`${saveBtnCls} flex items-center gap-2 disabled:opacity-50`}
              style={{ background: "hsl(var(--goji-coral))" }}
            >
              <Linkedin className="w-3.5 h-3.5" />
              {connecting ? "Opening..." : "Connect LinkedIn"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Security Tab ─────────────────────────────────────────────────────────────
function SecurityTab() {
  const [form, setForm] = useState({ newPw: "", confirm: "" });
  const [saving, setSaving] = useState(false);

  async function handleChangePassword() {
    if (form.newPw.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    if (form.newPw !== form.confirm) { toast.error("Passwords don't match"); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: form.newPw });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated successfully!");
    setForm({ newPw: "", confirm: "" });
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-base font-bold text-gray-900">Account Security</h2>
        <p className="text-xs text-gray-500 mt-0.5">Update your password and security settings</p>
      </div>
      <div className="space-y-4 mb-8">
        <div>
          <label className={labelCls}>New Password <span className="text-red-400">*</span></label>
          <input type="password" className={inputCls} placeholder="Enter your new password (min. 8 characters)" value={form.newPw} onChange={(e) => setForm((p) => ({ ...p, newPw: e.target.value }))} />
        </div>
        <div>
          <label className={labelCls}>Confirm New Password <span className="text-red-400">*</span></label>
          <input type="password" className={inputCls} placeholder="Confirm your new password" value={form.confirm} onChange={(e) => setForm((p) => ({ ...p, confirm: e.target.value }))} />
        </div>
      </div>
      <div className="flex justify-end">
        <button onClick={handleChangePassword} disabled={saving} className={saveBtnCls} style={{ background: "hsl(var(--goji-coral))" }}>
          {saving ? "Updating..." : "Change Password"}
        </button>
      </div>
    </div>
  );
}

// ─── AI LinkedIn Templates Tab ────────────────────────────────────────────────
function AITemplatesTab() {
  const [template, setTemplate] = useState("gojiberry-default");
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-base font-bold text-gray-900">AI LinkedIn Templates</h2>
        <p className="text-xs text-gray-500 mt-0.5">Define how your AI writes LinkedIn messages</p>
      </div>
      <div className="mb-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Current Template</p>
        <div className="relative">
          <select className={`${inputCls} appearance-none`} value={template} onChange={(e) => setTemplate(e.target.value)}>
            <option value="gojiberry-default">Gojiberry's default template</option>
            <option value="custom">Custom template</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>
      <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 mb-6">
        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <p className="text-xs text-gray-600">The AI will use <span className="font-semibold text-blue-500">Gojiberry's default template</span> as a base and personalize it with the lead's profile, company info, and detected signals.</p>
      </div>
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-bold text-gray-900">Your AI Templates</span>
            <span className="w-5 h-5 rounded-full bg-gray-100 text-xs font-semibold text-gray-500 flex items-center justify-center">0</span>
          </div>
          <button className={saveBtnCls} style={{ background: "hsl(var(--goji-coral))" }}><Plus className="w-3.5 h-3.5 inline mr-1" />Create New Template</button>
        </div>
        <p className="text-xs text-gray-400 px-5 py-2 border-b border-gray-50">Templates guide your AI. Messages are generated dynamically for each lead.</p>
        <div className="flex flex-col items-center justify-center py-14 gap-3">
          <p className="text-sm font-semibold text-gray-700">No custom templates yet</p>
          <p className="text-xs text-gray-400">Create your first template to customize your AI-generated LinkedIn messages</p>
          <button className={`${saveBtnCls} mt-1`} style={{ background: "hsl(var(--goji-coral))" }}><Plus className="w-3.5 h-3.5 inline mr-1" />Create Your First Template</button>
        </div>
      </div>
    </div>
  );
}

// ─── Billing Tab ──────────────────────────────────────────────────────────────
function BillingTab() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-base font-bold text-gray-900">Billing</h2>
        <p className="text-xs text-gray-500 mt-0.5">Manage your billing information and payment methods</p>
      </div>
      <div className="border border-gray-200 rounded-lg flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-12 h-12 rounded-lg border-2 border-gray-200 flex items-center justify-center"><CreditCard className="w-6 h-6 text-gray-300" /></div>
        <p className="text-sm font-bold text-gray-800">No Active Subscription</p>
        <p className="text-xs text-gray-400">Subscribe to a plan to unlock all features</p>
        <button className={`${saveBtnCls} mt-1 flex items-center gap-2`} style={{ background: "hsl(var(--goji-coral))" }}><CreditCard className="w-3.5 h-3.5" />View Pricing Plans</button>
      </div>
    </div>
  );
}

// ─── API Tab ──────────────────────────────────────────────────────────────────
function APITab() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-base font-bold text-gray-900">API Settings</h2>
        <p className="text-xs text-gray-500 mt-0.5">Manage your API keys and external integrations</p>
      </div>
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <p className="text-sm font-bold text-gray-900">API Keys</p>
            <p className="text-xs text-gray-400 mt-0.5">Use these keys to authenticate with our external API</p>
          </div>
          <button className={saveBtnCls} style={{ background: "hsl(var(--goji-coral))" }}><Plus className="w-3.5 h-3.5 inline mr-1" />Create API Key</button>
        </div>
        <div className="mx-5 my-4 flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
          <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <p className="text-xs text-gray-600">Need help getting started? Check out our comprehensive <button className="text-blue-500 font-semibold hover:underline">API documentation</button> for detailed guides and examples.</p>
        </div>
        <div className="flex flex-col items-center justify-center py-14 gap-3">
          <Key className="w-8 h-8 text-gray-300" />
          <p className="text-sm font-bold text-gray-700">No API Keys</p>
          <p className="text-xs text-gray-400">Create your first API key to start using our external API</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Settings Page ───────────────────────────────────────────────────────
export default function Settings() {
  const [activeTab, setActiveTab] = useState<Tab>("organization");
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [campaignData, setCampaignData] = useState<any>(null);
  const [campaignId, setCampaignId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    // Check for ?tab=linkedin query param
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab && tabsList.some((t) => t.id === tab)) {
      setActiveTab(tab as Tab);
    }
  }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setUserEmail(user.email || "");
    setUserName(user.user_metadata?.full_name || user.email?.split("@")[0] || "User");

    // Get the user's most recent campaign (created during onboarding)
    const { data } = await supabase
      .from("campaigns")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();

    if (data) {
      setCampaignData(data);
      setCampaignId(data.id);
    }
  }

  const saveCampaignFields = useCallback(async (fields: Record<string, any>) => {
    if (!campaignId) return;
    await supabase.from("campaigns").update(fields).eq("id", campaignId);
    setCampaignData((prev: any) => (prev ? { ...prev, ...fields } : prev));
  }, [campaignId]);

  const renderContent = () => {
    switch (activeTab) {
      case "organization": return <OrganizationTab userEmail={userEmail} userName={userName} />;
      case "company": return <CompanyTab campaignData={campaignData} onSave={saveCampaignFields} />;
      case "account": return <AccountTab userEmail={userEmail} campaignData={campaignData} onSave={saveCampaignFields} />;
      case "linkedin": return <LinkedInTab onConnected={async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        await supabase.from("campaigns").update({ status: "active" } as any).eq("user_id", user.id).eq("status", "pending_linkedin");
        await supabase.from("signal_agents").update({ status: "active" } as any).eq("user_id", user.id).eq("status", "pending_linkedin");
        toast.success("Your campaigns and AI agents are now active!");
      }} />;
      case "security": return <SecurityTab />;
      case "ai-templates": return <AITemplatesTab />;
      case "billing": return <BillingTab />;
      case "api": return <APITab />;
    }
  };

  return (
    <div className="min-h-full bg-[hsl(220_20%_97%)]">
      <div className="bg-white border-b border-gray-100 px-8 py-4">
        <div className="flex items-center gap-2">
          <SettingsIcon className="w-4 h-4" style={{ color: "hsl(var(--goji-coral))" }} />
          <h1 className="text-base font-bold text-gray-900">Account Settings</h1>
        </div>
        <p className="text-xs text-gray-400 mt-0.5 ml-6">Manage your company information and profile settings</p>
      </div>

      <div className="px-8 py-6 max-w-5xl">
        <div className="bg-white border border-gray-200 rounded-xl mb-4 px-2">
          <div className="flex items-center overflow-x-auto">
            {tabsList.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-3.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                    active ? "border-[hsl(var(--goji-coral))] text-[hsl(var(--goji-coral))]" : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

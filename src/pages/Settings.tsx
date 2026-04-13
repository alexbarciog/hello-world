import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Building2, User, Linkedin, Shield,
  CreditCard, Key, Plus, ChevronDown, Info, Settings as SettingsIcon, Trash2, Clock, Check, MessageSquare, UserPlus, Sparkles, Loader2,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";

// ─── Animation variants ────────────────────────────────────────────────────────
const easing = [0.22, 1, 0.36, 1] as [number, number, number, number];

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.38, ease: easing, delay: i * 0.07 },
  }),
};

const tabContent = {
  hidden: { opacity: 0, x: 10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: easing } },
  exit: { opacity: 0, x: -10, transition: { duration: 0.18 } },
};

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = "organization" | "company" | "account" | "linkedin" | "security" | "billing";

const tabsList: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "organization", label: "Organization", icon: <Users className="w-3.5 h-3.5" /> },
  { id: "company",      label: "Company",      icon: <Building2 className="w-3.5 h-3.5" /> },
  { id: "account",      label: "Account",      icon: <User className="w-3.5 h-3.5" /> },
  { id: "linkedin",     label: "LinkedIn",     icon: <Linkedin className="w-3.5 h-3.5" /> },
  { id: "security",     label: "Security",     icon: <Shield className="w-3.5 h-3.5" /> },
  { id: "billing",      label: "Billing",      icon: <CreditCard className="w-3.5 h-3.5" /> },
];

// ─── Shared styles ────────────────────────────────────────────────────────────
const inputCls =
  "w-full border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--goji-coral))/30] focus:border-[hsl(var(--goji-coral))] bg-background transition-all";
const labelCls = "block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider";

function SectionCard({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      custom={delay}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className={`rounded-2xl border border-border bg-card p-6 ${className}`}
    >
      {children}
    </motion.div>
  );
}

function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible" className="mb-8">
      <div className="flex items-center gap-2.5 mb-1">
        <span className="[&_svg]:fill-[url(#section-icon-gradient)] [&_svg]:stroke-[url(#section-icon-gradient)]">
          <svg width="0" height="0" className="absolute">
            <defs>
              <linearGradient id="section-icon-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#5C92FF" />
                <stop offset="100%" stopColor="#9FBDFB" />
              </linearGradient>
            </defs>
          </svg>
          {icon}
        </span>
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
      </div>
      <p className="text-sm text-muted-foreground ml-7">{subtitle}</p>
    </motion.div>
  );
}

function SaveButton({ saving, saved, onClick, label = "Save Settings" }: { saving: boolean; saved?: boolean; onClick: () => void; label?: string }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      disabled={saving}
      className={`btn-cta text-sm disabled:opacity-60 ${saved ? "!bg-[hsl(142,70%,45%)]" : ""}`}
    >
      {saving ? (
        <>
          <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
            <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Saving…
        </>
      ) : saved ? (
        <><Check className="w-3.5 h-3.5" /> Saved!</>
      ) : label}
    </motion.button>
  );
}

function lerpColor(val: number, min: number, max: number) {
  const t = Math.min(1, Math.max(0, (val - min) / (max - min)));
  // green (34,197,94) → orange (245,158,11)
  const r = Math.round(34 + t * (245 - 34));
  const g = Math.round(197 + t * (158 - 197));
  const b = Math.round(94 + t * (11 - 94));
  return `rgb(${r},${g},${b})`;
}

function LinkedInSlider({ label, value, onChange }: { label: string; value: number[]; onChange: (v: number[]) => void }) {
  const color = lerpColor(value[0], 5, 30);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xs font-semibold tabular-nums transition-colors duration-200" style={{ color }}>{value[0]}</span>
      </div>
      <div
        className="[&_[data-radix-slider-range]]:transition-[background-color] [&_[data-radix-slider-range]]:duration-200 [&_[data-radix-slider-thumb]]:transition-[border-color] [&_[data-radix-slider-thumb]]:duration-200"
        style={{ "--sc": color } as React.CSSProperties}
      >
        <Slider
          value={value}
          onValueChange={onChange}
          min={5}
          max={30}
          step={1}
          className="w-full [&_[data-radix-slider-range]]:!bg-[var(--sc)] [&_[data-radix-slider-thumb]]:!border-[var(--sc)]"
        />
      </div>
    </div>
  );
}

// ─── Invitation type ──────────────────────────────────────────────────────────
type Invitation = {
  id: string; email: string; accepted_at: string | null;
  expires_at: string; created_at: string; inviter_name: string | null;
};

const MAX_INVITATIONS = 2;

// ─── Organization Tab ─────────────────────────────────────────────────────────
function OrganizationTab({ userEmail, userName }: { userEmail: string; userName: string }) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const initials = userName ? userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "U";
  const atLimit = invitations.length >= MAX_INVITATIONS;

  useEffect(() => {
    async function load() {
      setLoadingInvites(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from("invitations")
        .select("id, email, accepted_at, expires_at, created_at, inviter_name")
        .eq("invited_by", user.id)
        .order("created_at", { ascending: false });
      if (!error && data) setInvitations(data as Invitation[]);
      setLoadingInvites(false);
    }
    load();
  }, []);

  async function handleInvite() {
    if (atLimit) { toast.error(`Max ${MAX_INVITATIONS} invitations.`); return; }
    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) { toast.error("Please enter a valid email"); return; }
    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      const res = await fetch(`https://uwwajlezgeurnvvrvdvb.supabase.co/functions/v1/send-invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to send invitation");
      toast.success(`Invitation sent to ${trimmed} ✉️`);
      setEmail("");
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: rows } = await supabase.from("invitations")
          .select("id, email, accepted_at, expires_at, created_at, inviter_name")
          .eq("invited_by", user.id).order("created_at", { ascending: false });
        if (rows) setInvitations(rows as Invitation[]);
      }
    } catch (e: any) { toast.error(e.message || "Failed to send invitation"); }
    finally { setSending(false); }
  }

  async function handleDelete(inviteId: string, inviteEmail: string) {
    setDeletingId(inviteId);
    const { error } = await supabase.from("invitations").delete().eq("id", inviteId);
    if (error) toast.error("Failed to revoke invitation");
    else { setInvitations((prev) => prev.filter((i) => i.id !== inviteId)); toast.success(`Invitation for ${inviteEmail} revoked`); }
    setDeletingId(null);
  }

  const pendingInvites = invitations.filter((i) => !i.accepted_at && new Date(i.expires_at) > new Date());
  const acceptedInvites = invitations.filter((i) => !!i.accepted_at);

  return (
    <div className="space-y-5">
      <SectionHeader icon={<Users className="w-4.5 h-4.5" />} title="Organization Members" subtitle="Manage who has access to your workspace and their roles" />

      {/* Invite card */}
      <SectionCard delay={1}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-sm font-semibold text-foreground">Invite New Member</p>
            <p className="text-xs text-muted-foreground mt-0.5">An invitation link will be sent to their email</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted rounded-full px-3 py-1">
            <Users className="w-3.5 h-3.5" />
            {invitations.length} / {MAX_INVITATIONS} used
          </div>
        </div>

        {atLimit ? (
          <div className="flex items-center gap-2 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
            <Info className="w-4 h-4 shrink-0" />
            <span>Limit reached — delete an invitation to invite someone new.</span>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row gap-2">
              <input type="email" placeholder="colleague@company.com" value={email}
                onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                className={`${inputCls} flex-1`} disabled={sending} />
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                className="btn-cta text-sm !py-2.5 !px-5 disabled:opacity-60 w-full sm:w-auto"
                onClick={handleInvite} disabled={sending}>
                {sending ? "Sending…" : "Invite"}
              </motion.button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">They'll receive a signup link via email.</p>
          </>
        )}
      </SectionCard>

      {/* Pending invitations */}
      {!loadingInvites && pendingInvites.length > 0 && (
        <SectionCard delay={2}>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-amber-500" />
            <p className="text-sm font-semibold text-foreground">Pending ({pendingInvites.length})</p>
          </div>
          <div className="space-y-2">
            {pendingInvites.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-muted/40 border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-xs text-amber-600 font-bold">{inv.email[0].toUpperCase()}</div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{inv.email}</p>
                    <p className="text-xs text-muted-foreground">Expires {new Date(inv.expires_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">Pending</span>
                  <button onClick={() => handleDelete(inv.id, inv.email)} disabled={deletingId === inv.id}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Accepted invitations */}
      {!loadingInvites && acceptedInvites.length > 0 && (
        <SectionCard delay={3}>
          <div className="flex items-center gap-2 mb-4">
            <Check className="w-4 h-4 text-green-500" />
            <p className="text-sm font-semibold text-foreground">Accepted ({acceptedInvites.length})</p>
          </div>
          <div className="space-y-2">
            {acceptedInvites.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-green-50 border border-green-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-xs text-green-600 font-bold">{inv.email[0].toUpperCase()}</div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{inv.email}</p>
                    <p className="text-xs text-muted-foreground">Joined {new Date(inv.accepted_at!).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Accepted</span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Members — responsive card on mobile, table on desktop */}
      <SectionCard delay={4}>
        <p className="text-sm font-semibold text-foreground mb-4">Members</p>

        {/* Mobile member card */}
        <div className="sm:hidden rounded-xl border border-border p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: "linear-gradient(135deg, #5C92FF, #9FBDFB)" }}>{initials}</div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{userName || "User"}</p>
              <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200 shrink-0">
            <Building2 className="w-3 h-3" /> Owner
          </span>
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Member", "Role", "Joined", "Actions"].map((h) => (
                  <th key={h} className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: "linear-gradient(135deg, #5C92FF, #9FBDFB)" }}>{initials}</div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{userName || "User"}</p>
                      <p className="text-xs text-muted-foreground">{userEmail}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                    <Building2 className="w-3 h-3" /> Owner
                  </span>
                </td>
                <td className="px-4 py-4"><span className="text-sm text-muted-foreground">{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span></td>
                <td className="px-4 py-4"><span className="text-sm text-muted-foreground">—</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Company Tab ──────────────────────────────────────────────────────────────
function CompanyTab({ campaignData, onSave }: { campaignData: any; onSave: (data: any) => Promise<void> }) {
  const [form, setForm] = useState({ name: "", website: "", industry: "", size: "", description: "", linkedin: "", autoEnrich: false, preventDuplication: false });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [generatingDesc, setGeneratingDesc] = useState(false);

  useEffect(() => {
    if (campaignData) setForm((p) => ({ ...p, name: campaignData.company_name || p.name, website: campaignData.website || p.website, industry: campaignData.industry || p.industry, description: campaignData.description || p.description }));
  }, [campaignData]);

  async function handleGenerateDescription() {
    if (!form.website.trim()) {
      toast.error("Add a website URL first");
      return;
    }
    setGeneratingDesc(true);
    try {
      // Step 1: Scrape website
      const { data: scrapeData, error: scrapeError } = await supabase.functions.invoke('firecrawl-scrape', {
        body: { url: form.website.trim(), options: { formats: ['summary', 'markdown'], onlyMainContent: true } },
      });
      if (scrapeError) throw scrapeError;

      const summary = scrapeData?.data?.summary || scrapeData?.summary || '';
      const markdown = scrapeData?.data?.markdown || scrapeData?.markdown || '';
      const pageContent = summary || (markdown ? markdown.slice(0, 2000) : '');

      if (!pageContent) {
        toast.error("Could not extract content from the website");
        return;
      }

      // Step 2: Generate description via AI
      const { data: aiData, error: aiError } = await supabase.functions.invoke('generate-company-description', {
        body: {
          websiteContent: pageContent,
          companyName: form.name.trim() || undefined,
          industry: form.industry || undefined,
        },
      });
      if (aiError) throw aiError;

      const description = aiData?.description || '';
      if (description) {
        setForm((p) => ({ ...p, description }));
        toast.success("Description generated!");
      } else {
        toast.error("AI returned an empty description");
      }
    } catch (e: any) {
      console.error('Generate description error:', e);
      toast.error(e?.message || "Failed to generate description");
    } finally {
      setGeneratingDesc(false);
    }
  }

  async function handleSave() {
    if (!form.name.trim()) { toast.error("Company name is required"); return; }
    setSaving(true); setSaved(false);
    try {
      await onSave({ company_name: form.name.trim(), website: form.website.trim(), industry: form.industry, description: form.description.trim() });
      setSaved(true); toast.success("Company settings saved!");
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) { toast.error(e?.message || "Failed to save"); }
    finally { setSaving(false); }
  }

  const fields = [
    { label: "Company Name *", key: "name", placeholder: "Your company name", type: "text" },
    { label: "Website", key: "website", placeholder: "https://yourcompany.com", type: "text" },
    { label: "LinkedIn Company Page", key: "linkedin", placeholder: "https://linkedin.com/company/...", type: "text" },
  ];

  return (
    <div className="space-y-5">
      <SectionHeader icon={<Building2 className="w-4.5 h-4.5" />} title="Company Information" subtitle="Update your company details used across campaigns" />

      <SectionCard delay={1}>
        <div className="grid grid-cols-2 gap-4 mb-4">
          {fields.slice(0, 2).map((f, i) => (
            <motion.div key={f.key} custom={i + 1} variants={fadeUp} initial="hidden" animate="visible">
              <label className={labelCls}>{f.label}</label>
              <input className={inputCls} placeholder={f.placeholder} value={(form as any)[f.key]}
                onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))} />
            </motion.div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible">
            <label className={labelCls}>Industry *</label>
            <div className="relative">
              <select className={`${inputCls} appearance-none`} value={form.industry} onChange={(e) => setForm((p) => ({ ...p, industry: e.target.value }))}>
                <option value="">Select industry</option>
                {["Technology","SaaS","Marketing","Finance","Healthcare","E-commerce","Retail","Manufacturing","Education","Consulting"].map((o) => <option key={o}>{o}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </motion.div>
          <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible">
            <label className={labelCls}>Company Size</label>
            <div className="relative">
              <select className={`${inputCls} appearance-none`} value={form.size} onChange={(e) => setForm((p) => ({ ...p, size: e.target.value }))}>
                <option value="">Select size</option>
                {["1-10","11-50","51-200","201-500","500+"].map((o) => <option key={o}>{o}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </motion.div>
        </div>
        <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible" className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</label>
            <button
              type="button"
              onClick={handleGenerateDescription}
              disabled={generatingDesc || !form.website.trim()}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-white bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              {generatingDesc ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              {generatingDesc ? "Generating…" : "Generate with AI"}
            </button>
          </div>
          <textarea className={`${inputCls} resize-none`} rows={3} placeholder="Brief description of what your company does…" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
        </motion.div>
        <motion.div custom={6} variants={fadeUp} initial="hidden" animate="visible" className="mb-6">
          <label className={labelCls}>LinkedIn Company Page</label>
          <input className={inputCls} placeholder="https://linkedin.com/company/yourcompany" value={form.linkedin} onChange={(e) => setForm((p) => ({ ...p, linkedin: e.target.value }))} />
        </motion.div>


        <div className="flex items-center gap-3">
          <SaveButton saving={saving} saved={saved} onClick={handleSave} />
          {!campaignData && <p className="text-xs text-amber-600">No active campaign — complete onboarding first.</p>}
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Account Tab ──────────────────────────────────────────────────────────────
function AccountTab({ userEmail, campaignData, onSave }: { userEmail: string; campaignData: any; onSave: (data: any) => void }) {
  const [form, setForm] = useState({ firstName: "", lastName: "", language: "English (US)", timezone: "Europe/Bucharest", emailNotifications: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (campaignData) {
      const lang = campaignData.language || "English (US)";
      const country = campaignData.country || "";
      setForm((p) => ({
        ...p, language: lang,
        timezone: country.toLowerCase().includes("romania") ? "Europe/Bucharest"
          : country.toLowerCase().includes("us") ? "America/New_York"
          : country.toLowerCase().includes("uk") ? "Europe/London"
          : country.toLowerCase().includes("france") ? "Europe/Paris"
          : country.toLowerCase().includes("germany") ? "Europe/Berlin"
          : p.timezone,
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
    <div className="space-y-5">
      <SectionHeader icon={<User className="w-4.5 h-4.5" />} title="Account Settings" subtitle="Manage your personal information and preferences" />

      <SectionCard delay={1}>
        <div className="grid grid-cols-2 gap-4 mb-4">
          {[["First Name", "firstName", "John"], ["Last Name", "lastName", "Doe"]].map(([label, key, ph], i) => (
            <motion.div key={key} custom={i + 1} variants={fadeUp} initial="hidden" animate="visible">
              <label className={labelCls}>{label}</label>
              <input className={inputCls} placeholder={ph} value={(form as any)[key]} onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))} />
            </motion.div>
          ))}
        </div>

        <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible" className="mb-4">
          <label className={labelCls}>Email</label>
          <input className={`${inputCls} opacity-60 cursor-not-allowed`} value={userEmail} disabled />
          <p className="text-xs text-muted-foreground mt-1">Email cannot be changed here</p>
        </motion.div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {[
            { label: "Preferred Language", key: "language", options: ["English (US)", "Romanian", "French", "Spanish", "German"] },
            { label: "Timezone", key: "timezone", options: ["Europe/Bucharest", "America/New_York", "America/Los_Angeles", "Europe/London", "Europe/Paris", "Europe/Berlin", "Asia/Tokyo"] },
          ].map((sel, i) => (
            <motion.div key={sel.key} custom={i + 4} variants={fadeUp} initial="hidden" animate="visible">
              <label className={labelCls}>{sel.label}</label>
              <div className="relative">
                <select className={`${inputCls} appearance-none`} value={(form as any)[sel.key]} onChange={(e) => setForm((p) => ({ ...p, [sel.key]: e.target.value }))}>
                  {sel.options.map((o) => <option key={o}>{o}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div custom={6} variants={fadeUp} initial="hidden" animate="visible" className="mb-6 rounded-xl bg-muted/40 border border-border p-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 rounded border-border accent-[hsl(var(--goji-coral))]"
              checked={form.emailNotifications} onChange={(e) => setForm((p) => ({ ...p, emailNotifications: e.target.checked }))} />
            <div>
              <p className="text-sm font-medium text-foreground">Email Notifications</p>
              <p className="text-xs text-muted-foreground">Receive a daily summary of newly imported leads</p>
            </div>
          </label>
        </motion.div>

        <div className="flex justify-end">
          <SaveButton saving={saving} onClick={handleSave} />
        </div>
      </SectionCard>
    </div>
  );
}

// ─── LinkedIn Tab ─────────────────────────────────────────────────────────────
function LinkedInTab({ onConnected }: { onConnected?: () => void }) {
  const [connecting, setConnecting] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [polling, setPolling] = useState(false);
  const [dailyMessages, setDailyMessages] = useState([15]);
  const [dailyConnections, setDailyConnections] = useState([15]);
  const [savingLimits, setSavingLimits] = useState(false);
  const [limitsUserId, setLimitsUserId] = useState<string | null>(null);

  // Load saved limits from profile
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setLimitsUserId(user.id);
      const { data: profile } = await supabase.from("profiles").select("daily_messages_limit, daily_connections_limit" as any).eq("user_id", user.id).single();
      if (profile) {
        setDailyMessages([(profile as any).daily_messages_limit ?? 15]);
        setDailyConnections([(profile as any).daily_connections_limit ?? 15]);
      }
    })();
  }, []);

  // Auto-save limits on change (debounced)
  useEffect(() => {
    if (!limitsUserId) return;
    const timeout = setTimeout(async () => {
      setSavingLimits(true);
      await supabase.from("profiles").update({
        daily_messages_limit: dailyMessages[0],
        daily_connections_limit: dailyConnections[0],
      } as any).eq("user_id", limitsUserId);
      setSavingLimits(false);
    }, 500);
    return () => clearTimeout(timeout);
  }, [dailyMessages, dailyConnections, limitsUserId]);

  function clearParam() {
    const url = new URL(window.location.href);
    url.searchParams.delete("linkedin");
    window.history.replaceState({}, "", url.toString());
  }

  useEffect(() => {
    const status = new URLSearchParams(window.location.search).get("linkedin");
    void (async () => {
      const isConnected = await checkConnection();
      if (isConnected) { clearParam(); return; }
      if (status === "success") { toast.success("LinkedIn connected. Finalizing…"); startPolling(); return; }
      if (status === "failed") { clearParam(); toast.error("LinkedIn connection cancelled or failed."); }
    })();
  }, []);

  async function getAuthToken() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");
    return session.access_token;
  }

  async function callAPI(body: Record<string, unknown>) {
    const token = await getAuthToken();
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/connect-linkedin`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
  }

  async function checkConnection(showLoader = true) {
    if (showLoader) setLoadingStatus(true);
    try {
      const data = await callAPI({ action: "check_status" });
      const isConnected = data.status === "connected" && Boolean(data.account_id);
      setAccountId(isConnected ? data.account_id : null);
      setDisplayName(isConnected && data.display_name ? data.display_name : null);
      return isConnected;
    } catch { return false; }
    finally { if (showLoader) setLoadingStatus(false); }
  }

  async function handleConnect() {
    setConnecting(true);
    try {
      const data = await callAPI({ action: "create_link", return_url: window.location.href });
      if (data.status === "link_created" && data.url) { window.open(data.url, "_blank", "noopener,noreferrer"); startPolling(); return; }
      throw new Error("Unable to open LinkedIn connection flow");
    } catch (e: any) { toast.error(e.message || "Failed to initiate LinkedIn connection"); setConnecting(false); }
  }

  function startPolling() {
    setPolling(true);
    let attempts = 0;
    const interval = window.setInterval(async () => {
      attempts++;
      const isConnected = await checkConnection(false);
      if (isConnected) { window.clearInterval(interval); setPolling(false); setConnecting(false); clearParam(); toast.success("LinkedIn connected!"); onConnected?.(); return; }
      if (attempts >= 90) { window.clearInterval(interval); setPolling(false); setConnecting(false); toast.error("Connection timed out. Please try again."); }
    }, 2000);
  }

  async function handleDisconnect() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("profiles").update({ unipile_account_id: null, linkedin_display_name: null } as any).eq("user_id", user.id);
    setAccountId(null);
    setDisplayName(null);
    toast.success("LinkedIn account disconnected");
  }

  return (
    <div className="space-y-5">
      <SectionHeader icon={<Linkedin className="w-4.5 h-4.5" />} title="LinkedIn Accounts" subtitle="Connect your LinkedIn to enable automated lead discovery and outreach" />

      <SectionCard delay={1}>
        {loadingStatus ? (
          <div className="flex items-center justify-center py-12 gap-3 text-muted-foreground">
            <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "hsl(var(--goji-coral))", borderTopColor: "transparent" }} />
            <span className="text-sm">Checking connection…</span>
          </div>
        ) : accountId ? (
          <>
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center justify-between p-4 rounded-xl bg-green-50 border border-green-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Linkedin className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">LinkedIn Connected ✓</p>
                  <p className="text-xs text-muted-foreground">{displayName || `Account ID: ${accountId.slice(0, 12)}…`}</p>
                </div>
              </div>
              <button onClick={handleDisconnect} className="text-xs font-medium text-destructive border border-destructive/30 rounded-lg px-3 py-1.5 hover:bg-destructive/10 transition-colors">
                Disconnect
              </button>
            </motion.div>

            {/* Daily limits sliders */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.35, ease: easing }}
              className="mt-4 space-y-4"
            >
              <LinkedInSlider label="Messages / day" value={dailyMessages} onChange={setDailyMessages} />
              <LinkedInSlider label="Connections / day" value={dailyConnections} onChange={setDailyConnections} />
              <p className="text-[10px] text-muted-foreground transition-opacity" style={{ opacity: savingLimits ? 1 : 0.5 }}>
                {savingLimits ? "Saving…" : "Auto-saved ✓"}
              </p>
            </motion.div>
          </>
        ) : (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-4 mb-6 p-4 rounded-xl bg-muted/40 border border-border">
              <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: "hsl(211 100% 96%)" }}>
                <Linkedin className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Connect your LinkedIn</p>
                <p className="text-xs text-muted-foreground">Securely link your account to start discovering and engaging leads</p>
              </div>
            </div>
            {polling ? (
              <div className="flex items-center gap-3 py-2">
                <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "hsl(var(--goji-coral))", borderTopColor: "transparent" }} />
                <span className="text-sm text-muted-foreground">Waiting for LinkedIn… Complete the flow in the opened tab.</span>
              </div>
            ) : (
              <SaveButton saving={connecting} onClick={handleConnect} label="Connect LinkedIn" />
            )}
          </motion.div>
        )}
      </SectionCard>
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
    toast.success("Password updated!");
    setForm({ newPw: "", confirm: "" });
  }

  return (
    <div className="space-y-5">
      <SectionHeader icon={<Shield className="w-4.5 h-4.5" />} title="Account Security" subtitle="Update your password and security settings" />

      <SectionCard delay={1}>
        <div className="space-y-4 mb-6">
          {[
            { key: "newPw", label: "New Password *", placeholder: "Enter your new password (min. 8 characters)" },
            { key: "confirm", label: "Confirm New Password *", placeholder: "Confirm your new password" },
          ].map((f, i) => (
            <motion.div key={f.key} custom={i + 1} variants={fadeUp} initial="hidden" animate="visible">
              <label className={labelCls}>{f.label}</label>
              <input type="password" className={inputCls} placeholder={f.placeholder}
                value={(form as any)[f.key]} onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))} />
            </motion.div>
          ))}
        </div>
        <div className="flex justify-end">
          <SaveButton saving={saving} onClick={handleChangePassword} label="Change Password" />
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Billing Tab ──────────────────────────────────────────────────────────────
function BillingTab() {
  const navigate = useNavigate();
  return (
    <div className="space-y-5">
      <SectionHeader icon={<CreditCard className="w-4.5 h-4.5" />} title="Billing & Plans" subtitle="Manage your subscription and payment information" />

      <SectionCard delay={1}>
        <div className="flex flex-col items-center justify-center py-16 gap-5 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.15 }}
            className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ background: "linear-gradient(135deg, hsl(25 95% 53%), hsl(330 85% 55%))" }}
          >
            <CreditCard className="w-7 h-7 text-white" />
          </motion.div>
          <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
            <p className="text-base font-bold text-foreground mb-1">No Active Subscription</p>
            <p className="text-sm text-muted-foreground max-w-xs">Start your 7-day free trial and unlock unlimited leads, AI campaigns, and more.</p>
          </motion.div>
          <motion.button
            custom={3} variants={fadeUp} initial="hidden" animate="visible"
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/billing")}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white shadow-md"
            style={{ background: "linear-gradient(135deg, hsl(5 90% 60%), hsl(330 80% 60%))" }}
          >
            <CreditCard className="w-4 h-4" /> View Pricing & Plans
          </motion.button>
        </div>
      </SectionCard>
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
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab && tabsList.some((t) => t.id === tab)) setActiveTab(tab as Tab);
  }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserEmail(user.email || "");
    const meta = user.user_metadata || {};
    const fullName = [meta.first_name, meta.last_name].filter(Boolean).join(" ") || meta.full_name || user.email?.split("@")[0] || "User";
    setUserName(fullName);
    const { data } = await supabase.from("campaigns").select("*").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(1).single();
    if (data) { setCampaignData(data); setCampaignId(data.id); }
  }

  const saveCampaignFields = useCallback(async (fields: Record<string, any>) => {
    if (!campaignId) throw new Error("No active campaign found. Please complete onboarding first.");
    const { error } = await supabase.from("campaigns").update(fields).eq("id", campaignId);
    if (error) throw new Error(error.message);
    setCampaignData((prev: any) => (prev ? { ...prev, ...fields } : prev));
  }, [campaignId]);

  const renderContent = () => {
    switch (activeTab) {
      case "organization": return <OrganizationTab userEmail={userEmail} userName={userName} />;
      case "company":      return <CompanyTab campaignData={campaignData} onSave={saveCampaignFields} />;
      case "account":      return <AccountTab userEmail={userEmail} campaignData={campaignData} onSave={saveCampaignFields} />;
      case "linkedin":     return <LinkedInTab onConnected={async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        await supabase.from("campaigns").update({ status: "active" } as any).eq("user_id", user.id).eq("status", "pending_linkedin");
        await supabase.from("signal_agents").update({ status: "active" } as any).eq("user_id", user.id).eq("status", "pending_linkedin");
        toast.success("Campaigns and AI agents are now active!");
      }} />;
      case "security": return <SecurityTab />;
      case "billing":  return <BillingTab />;
    }
  };

  return (
    <div className="min-h-full bg-card rounded-2xl m-3 md:m-4 overflow-hidden">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="border-b border-border px-4 md:px-8 py-4 md:py-5"
      >
        <div className="flex items-center gap-2.5">
          <span className="[&_svg]:stroke-[url(#section-icon-gradient)]">
            <SettingsIcon className="w-4.5 h-4.5 shrink-0" />
          </span>
          <h1 className="text-base md:text-lg font-bold text-foreground">Account Settings</h1>
        </div>
        <p className="text-xs md:text-sm text-muted-foreground mt-0.5 ml-7">Manage your company information and profile settings</p>
      </motion.div>

      {/* ── Mobile nav: pill grid (above content) ── */}
      <div className="md:hidden border-b border-border px-3 py-3">
        <div className="grid grid-cols-3 gap-1.5">
          {tabsList.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl text-[10px] font-semibold transition-all ${
                  active
                    ? "bg-foreground text-background"
                    : "text-muted-foreground bg-muted/40 hover:bg-muted"
                }`}
              >
                <span className="[&_svg]:w-4 [&_svg]:h-4">{tab.icon}</span>
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Body: sidebar nav (desktop) + content */}
      <div className="flex min-h-0">

        {/* ── Sidebar nav (desktop only) ── */}
        <motion.aside
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.08, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="hidden md:flex flex-col w-52 shrink-0 border-r border-border py-4 px-3 gap-0.5"
        >
          {tabsList.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left w-full ${
                  active
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                <span className="shrink-0">{tab.icon}</span>
                {tab.label}
              </button>
            );
          })}
        </motion.aside>

        {/* ── Tab content ── */}
        <div className="flex-1 min-w-0 w-full px-4 md:px-8 py-4 md:py-6 max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              variants={tabContent}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

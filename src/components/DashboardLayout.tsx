import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import intentslyIcon from "@/assets/intentsly-icon.png";
import NotificationsPanel from "@/components/NotificationsPanel";
import { useSubscription } from "@/hooks/useSubscription";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Progress } from "@/components/ui/progress";
import { OrgSwitcher } from "@/components/organizations/OrgSwitcher";

import {
  LayoutDashboard,
  Megaphone,
  Users,

  Radio,
  Mail,
  Plug,
  Settings,
  HelpCircle,
  LifeBuoy,
  ChevronLeft,
  ChevronRight,
  LogOut,
  AlertTriangle,
  CreditCard,
  ChevronDown,
  Menu,
  X,
  Shield,
  Briefcase,
  Flame,
  Rocket,
  Search,
  Bell,

  Crown,
  ArrowRight,
} from "lucide-react";
import { useAccountType } from "@/hooks/useAccountType";
import AgencyImpersonationBanner, { readImpersonation } from "@/components/agency/AgencyImpersonationBanner";

// Reddit icon component
const RedditIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
  </svg>
);

// X (Twitter) icon component
const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const baseNavItems = [
  { label: "Dashboard",      icon: LayoutDashboard, path: "/dashboard" },
  { label: "Campaigns",      icon: Megaphone,       path: "/campaigns" },
  { label: "Contacts",       icon: Users,           path: "/contacts" },
  { label: "Signals Agents", icon: Radio,           path: "/signals" },
  { label: "Unibox",         icon: Mail,            path: "/unibox" },
  { label: "Integrations",   icon: Plug,            path: "/integrations" },
  { label: "Settings",       icon: Settings,        path: "/settings" },
];

const engagementSpikesItem = { label: "Engagement Spikes", icon: Flame,  path: "/engagement-spikes", badge: "New" };
const superscaleItem       = { label: "SuperScale",        icon: Rocket, path: "/superscale",        badge: "New" };

const adminOnlyNavItems = [
  { label: "Reddit Signals", icon: RedditIcon,      path: "/reddit-signals", badge: "Beta" },
  { label: "X Signals",      icon: XIcon,           path: "/x-signals", badge: "Beta" },
];

// Bottom nav shows only the 5 most important items on mobile
const mobileNavItems = [
  { label: "Home",      icon: LayoutDashboard, path: "/dashboard" },
  { label: "Campaigns", icon: Megaphone,       path: "/campaigns" },
  { label: "Contacts",  icon: Users,           path: "/contacts" },
  { label: "Signals",   icon: Radio,           path: "/signals" },
  { label: "Settings",  icon: Settings,        path: "/settings" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLinkedInBanner, setShowLinkedInBanner] = useState(false);
  const [userDisplay, setUserDisplay] = useState({ name: "", email: "", initials: "" });
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const sub = useSubscription();
  const { data: isAdmin } = useAdminCheck();
  const { data: accountType } = useAccountType();
  const [showAgentTooltip, setShowAgentTooltip] = useState(false);
  const [featureFlags, setFeatureFlags] = useState<{ spikes: boolean; superscale: boolean }>({ spikes: false, superscale: false });
  const isImpersonating = !!readImpersonation();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("engagement_spikes_enabled, superscale_enabled")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      setFeatureFlags({
        spikes: Boolean(data?.engagement_spikes_enabled),
        superscale: Boolean(data?.superscale_enabled),
      });
    })();
    return () => { cancelled = true; };
  }, []);

  // Build base nav with conditional feature items inserted after Signals Agents (index 3)
  const navWithFeatures = (() => {
    const items = [...baseNavItems];
    const insertions: any[] = [];
    if (isAdmin || featureFlags.spikes) insertions.push(engagementSpikesItem);
    if (isAdmin || featureFlags.superscale) insertions.push(superscaleItem);
    if (insertions.length) items.splice(4, 0, ...insertions);
    return items;
  })();

  // Insert Client Accounts above Settings for agency partners (hidden while impersonating)
  const baseWithAgency = (accountType === "agency" && !isImpersonating)
    ? [
        ...navWithFeatures.slice(0, navWithFeatures.length - 1),
        { label: "Client Accounts", icon: Briefcase, path: "/dashboard/client-accounts" },
        navWithFeatures[navWithFeatures.length - 1],
      ]
    : navWithFeatures;

  const navItems = isAdmin
    ? [...baseWithAgency, ...adminOnlyNavItems, { label: "Admin", icon: Shield, path: "/admin" }]
    : baseWithAgency;

  const allNavItems = navItems;

  // Split nav into two groups for the sidebar
  const SETTINGS_PATHS = new Set<string>(["/integrations", "/settings", "/admin", "/dashboard/client-accounts"]);
  const filteredNavItems = allNavItems.filter((i) =>
    i.label.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const menuGroup = filteredNavItems.filter((i) => !SETTINGS_PATHS.has(i.path));
  const settingsGroup = filteredNavItems.filter((i) => SETTINGS_PATHS.has(i.path));

  // Breadcrumb label from active route
  const activeItem = allNavItems.find((i) => i.path === location.pathname) ?? allNavItems[0];
  const crumbLabel = activeItem?.label ?? "Dashboard";

  // 8-second auto-dismiss tooltip for free users
  useEffect(() => {
    if (!sub.loading && !sub.hasAccess) {
      setShowAgentTooltip(true);
      const timer = setTimeout(() => setShowAgentTooltip(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [sub.loading, sub.hasAccess]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ⌘K shortcut to focus search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "Escape") {
        searchInputRef.current?.blur();
        setSearchQuery("");
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    async function loadUser() {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;

      // Skip LinkedIn check entirely for free users — they should upgrade first
      if (!sub.loading && sub.hasAccess) {
        let linkedinConnected = false;
        try {
          const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/connect-linkedin`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
            body: JSON.stringify({ action: "check_status" }),
          });
          if (res.ok) {
            const data = await res.json();
            linkedinConnected = data.status === "connected" && Boolean(data.account_id);
          }
        } catch { /* fallback */ }

        if (!linkedinConnected) {
          const { data: profile } = await supabase.from("profiles").select("unipile_account_id").eq("user_id", user.id).single();
          linkedinConnected = Boolean(profile?.unipile_account_id);
        }
        setShowLinkedInBanner(!linkedinConnected);
      } else {
        setShowLinkedInBanner(false);
      }

      const email = user.email ?? "";
      const firstName = user.user_metadata?.first_name || "";
      const lastName  = user.user_metadata?.last_name  || "";
      const fullName  = [firstName, lastName].filter(Boolean).join(" ") || user.user_metadata?.full_name || user.user_metadata?.name || "";
      const initials  = firstName && lastName ? (firstName[0] + lastName[0]).toUpperCase() : fullName.slice(0, 2).toUpperCase() || email.slice(0, 2).toUpperCase();
      setUserDisplay({ name: fullName, email, initials });
    }
    loadUser();
  }, [sub.loading, sub.hasAccess]);

  return (
    <div className="flex h-screen overflow-hidden bg-white">

      {/* ── Desktop sidebar — soft grey panel against the white page ────── */}
      <aside
        className={`hidden md:flex flex-col shrink-0 transition-all duration-200 border-r border-[#ECECEE] ${collapsed ? "w-[72px]" : "w-[256px]"}`}
        style={{ background: "#F7F7F8" }}
      >
        {/* Logo row */}
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-2 min-w-0">
            <img src={intentslyIcon} alt="Intentsly" className="w-7 h-7 object-contain shrink-0" />
            {!collapsed && <span className="font-semibold text-[17px] tracking-tight text-neutral-900 truncate">Intentsly</span>}
          </div>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors text-neutral-400 hover:text-neutral-700 shrink-0"
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Search input */}
        {!collapsed && (
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search"
                className="w-full rounded-lg bg-white border border-[#E7E7EA] pl-9 pr-8 py-1.5 text-[13px] text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-300 transition-colors"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-[10px] text-neutral-400 font-medium bg-[#F7F7F8] border border-[#E7E7EA] rounded-md px-1.5 py-0.5">
                ⌘K
              </div>
            </div>
          </div>
        )}

        {/* Org Switcher */}
        <div className="px-3 pb-2">
          <OrgSwitcher collapsed={collapsed} />
        </div>

        {/* Nav — grouped */}
        <nav className="flex-1 px-3 py-1 overflow-y-auto relative">
          {!collapsed && (
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-neutral-400 px-2.5 pt-2 pb-1.5">
              Menu
            </p>
          )}
          <div className="space-y-0.5">
            {menuGroup.map((item) => {
              const active = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <div key={item.path} className="relative">
                  <button
                    onClick={() => navigate(item.path)}
                    title={collapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium border transition-colors ${
                      active
                        ? "bg-[#EFEFF1] text-[#0a0a0a] border-[#E7E7EA]"
                        : "text-neutral-500 border-transparent hover:bg-[#EFEFF1]/60 hover:text-neutral-900"
                    }`}
                  >
                    <span className="w-4 h-4 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" strokeWidth={active ? 2.1 : 1.8} />
                    </span>
                    {!collapsed && (
                      <span className="flex-1 text-left truncate flex items-center gap-1.5">
                        {item.label}
                        {(item as any).badge && (
                          <span className="text-[9px] font-semibold uppercase tracking-wider bg-orange-50 text-goji-orange px-1.5 py-0.5 rounded-full leading-none">
                            {(item as any).badge}
                          </span>
                        )}
                      </span>
                    )}
                  </button>
                  {item.path === "/signals" && !collapsed && showAgentTooltip && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 animate-in fade-in slide-in-from-left-2 duration-300">
                      <div className="bg-neutral-900 text-white text-[11px] font-medium px-3 py-2 rounded-lg shadow-lg whitespace-nowrap flex items-center gap-1.5">
                        <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                        AI agents are currently not running
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {settingsGroup.length > 0 && (
            <>
              {!collapsed && (
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-neutral-400 px-2.5 pt-4 pb-1.5">
                  Settings
                </p>
              )}
              {collapsed && <div className="h-px bg-[#EBEBED] my-3 mx-2" />}
              <div className="space-y-0.5">
                {settingsGroup.map((item) => {
                  const active = location.pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      title={collapsed ? item.label : undefined}
                      className={`w-full flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium border transition-colors ${
                        active
                          ? "bg-[#EFEFF1] text-[#0a0a0a] border-[#E7E7EA]"
                          : "text-neutral-500 border-transparent hover:bg-[#EFEFF1]/60 hover:text-neutral-900"
                      }`}
                    >
                      <span className="w-4 h-4 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4" strokeWidth={active ? 2.1 : 1.8} />
                      </span>
                      {!collapsed && <span className="flex-1 text-left truncate">{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {!collapsed && (
            <>
              <div className="h-px bg-[#EBEBED] my-3 mx-2" />
              <div className="space-y-0.5">
                <button
                  onClick={() => navigate("/help")}
                  className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-neutral-500 hover:bg-[#EFEFF1]/60 hover:text-neutral-900 transition-colors"
                >
                  <HelpCircle className="w-4 h-4 shrink-0" strokeWidth={1.8} />
                  <span className="truncate">Help Center</span>
                </button>
                <button
                  onClick={() => navigate("/support")}
                  className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-neutral-500 hover:bg-[#EFEFF1]/60 hover:text-neutral-900 transition-colors"
                >
                  <LifeBuoy className="w-4 h-4 shrink-0" strokeWidth={1.8} />
                  <span className="truncate">Support</span>
                </button>
              </div>
            </>
          )}
        </nav>

        {/* Bottom "Current Plan" card */}
        <div className="p-3">
          {collapsed ? (
            <button
              onClick={() => navigate("/billing")}
              className="w-full flex items-center justify-center rounded-xl bg-white border border-[#F0F0F2] p-2.5 hover:bg-neutral-50 transition-colors"
              title="Billing"
            >
              <Crown className="w-4 h-4 text-goji-orange" />
            </button>
          ) : (
            <div className="rounded-2xl bg-white border border-[#E7E7EA] p-4 flex flex-col items-center text-center">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center mb-2"
                style={{ background: "var(--gradient-brand)" }}
              >
                <Crown className="w-4 h-4 text-white" />
              </div>
              <p className="text-[13.5px] font-semibold text-[#0a0a0a]">
                Current Plan: <span className="text-goji-orange">{sub.subscribed ? "Plus" : "Basic"}</span>
              </p>
              <p className="text-[11.5px] text-neutral-500 mt-0.5">
                {sub.credits ?? 0} Credits Remaining
              </p>
              <button
                onClick={() => navigate("/billing")}
                className="mt-3 w-full inline-flex items-center justify-between gap-2 rounded-xl bg-[#0a0a0a] px-3.5 py-2 text-[12.5px] font-semibold text-white hover:bg-neutral-800 transition-colors"
              >
                {sub.subscribed ? "Manage Plan" : "Upgrade Pro Account"}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── Mobile slide-in menu overlay ───────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          {/* Panel */}
          <aside className="absolute left-0 top-0 bottom-0 w-64 flex flex-col" style={{ background: "#F7F7F8" }}>
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex items-center gap-2">
                <img src={intentslyIcon} alt="Intentsly" className="w-7 h-7 object-contain" />
                <span className="font-bold text-base tracking-tight text-foreground">Intentsly</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded hover:bg-foreground/10 transition-colors text-foreground/50">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Org Switcher - Mobile */}
            <div className="px-3 pb-2">
              <OrgSwitcher collapsed={false} />
            </div>

            <nav className="flex-1 px-2 py-1 space-y-0.5 overflow-y-auto">
              {allNavItems.map((item) => {
                const active = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => { navigate(item.path); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                      active ? "bg-white text-foreground shadow-sm" : "text-foreground/50 hover:bg-foreground/5 hover:text-foreground/80"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* User row at bottom of slide menu */}
            <div className="px-3 pb-4 pt-2 border-t border-foreground/10">
              <div className="flex items-center gap-2.5 px-2 py-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: "linear-gradient(135deg, #5C92FF, #9FBDFB)" }}>
                  {userDisplay.initials || "?"}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground/80 truncate">{userDisplay.name || userDisplay.email}</p>
                  <p className="text-[10px] text-foreground/40 truncate">{userDisplay.email}</p>
                </div>
              </div>
              <button onClick={async () => { await supabase.auth.signOut(); navigate("/login"); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-red-50 transition-colors mt-1" style={{ color: "hsl(var(--goji-coral))" }}>
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <AgencyImpersonationBanner />
        {/* Top navbar: breadcrumb + right utilities */}
        <header className="relative z-40 flex items-center justify-between px-4 md:px-8 py-3 shrink-0 bg-white border-b border-[#F0F0F2]">
          <div className="flex items-center gap-2 min-w-0">
            <button
              className="md:hidden p-1.5 rounded-md hover:bg-white/60 transition-colors text-neutral-600 mr-1"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              onClick={() => window.history.back()}
              className="hidden md:inline-flex w-9 h-9 rounded-lg items-center justify-center bg-white border border-[#F0F0F2] text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => window.history.forward()}
              className="hidden md:inline-flex w-9 h-9 rounded-lg items-center justify-center bg-white border border-[#F0F0F2] text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="hidden md:flex items-center gap-2 ml-3 text-[13.5px] min-w-0">
              <span className="text-neutral-500">Intentsly</span>
              <span className="text-neutral-300">›</span>
              <span className="text-neutral-900 font-medium truncate">{crumbLabel}</span>
            </div>
            <div className="md:hidden flex items-center gap-1.5 absolute left-1/2 -translate-x-1/2">
              <img src={intentslyIcon} alt="Intentsly" className="w-6 h-6 object-contain" />
              <span className="font-bold text-sm text-neutral-900">Intentsly</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">

              <NotificationsPanel />
            </div>
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen((o) => !o)}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-[11px] font-bold text-white shrink-0 bg-[#0a0a0a] hover:bg-neutral-800 transition-colors"
              >
                {userDisplay.initials || "?"}
              </button>
              {userMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 rounded-xl bg-white shadow-xl border border-neutral-200 overflow-hidden z-50">
                  <div className="flex items-center gap-3 px-4 py-4 border-b border-neutral-100">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 bg-[#0a0a0a]">
                      {userDisplay.initials || "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-neutral-900 truncate">{userDisplay.name || userDisplay.email}</p>
                      <p className="text-xs text-neutral-500 truncate">{userDisplay.email}</p>
                    </div>
                  </div>
                  <div className="py-1.5">
                    <button
                      onClick={() => { setUserMenuOpen(false); navigate("/billing"); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                    >
                      <CreditCard className="w-4 h-4 text-[#3B82F6]" />
                      Billing &amp; Plans
                    </button>
                    <button
                      onClick={async () => { await supabase.auth.signOut(); navigate("/login"); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">

          {!sub.loading && !sub.hasAccess && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 border-b" style={{ background: "hsl(48 100% 96%)", borderColor: "hsl(48 90% 85%)" }}>
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "hsl(38 92% 50%)" }} />
                <p className="text-sm font-medium" style={{ color: "hsl(28 60% 25%)" }}>
                  Upgrade your subscription to unlock LinkedIn outreach, campaigns, and AI SDR features.
                </p>
              </div>
              <button onClick={() => navigate("/billing")} className="shrink-0 px-3.5 py-1.5 rounded-md text-xs font-semibold text-white transition-opacity hover:opacity-90" style={{ background: "hsl(var(--goji-coral))" }}>
                Upgrade plan
              </button>
            </div>
          )}
          {showLinkedInBanner && sub.hasAccess && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 border-b" style={{ background: "hsl(25 95% 95%)", borderColor: "hsl(25 90% 85%)" }}>
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "hsl(25 95% 53%)" }} />
                <p className="text-sm font-medium" style={{ color: "hsl(25 60% 30%)" }}>
                  Connect your LinkedIn account to start discovering leads and running campaigns.
                </p>
              </div>
              <button onClick={() => navigate("/settings?tab=linkedin")} className="shrink-0 px-3.5 py-1.5 rounded-md text-xs font-semibold text-white transition-opacity hover:opacity-90" style={{ background: "hsl(var(--goji-coral))" }}>
                Connect LinkedIn
              </button>
            </div>
          )}
          {children}
        </main>

        {/* ── Mobile bottom navigation ──────────────────────────────────── */}
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around px-2 py-2 border-t bg-white"
          style={{ borderColor: "#EBEBED" }}
        >
          {mobileNavItems.map((item) => {
            const active = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all"
                style={active ? { background: "#F4F4F5" } : undefined}
              >
                <Icon className={`w-5 h-5 transition-colors ${active ? "text-foreground" : "text-foreground/40"}`} />
                <span className={`text-[10px] font-medium transition-colors ${active ? "text-foreground" : "text-foreground/40"}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

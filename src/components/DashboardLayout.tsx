import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import intentslyIcon from "@/assets/intentsly-icon.png";
import premiumBg from "@/assets/premium-gradient-bg.png";
import NotificationsPanel from "@/components/NotificationsPanel";
import {
  LayoutDashboard,
  Megaphone,
  Users,
  MessageCircle,
  Radio,
  Mail,
  Settings,
  HelpCircle,
  Gift,
  ChevronLeft,
  ChevronRight,
  LogOut,
  AlertTriangle,
  CreditCard,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { label: "Dashboard",      icon: LayoutDashboard, path: "/dashboard" },
  { label: "Campaigns",      icon: Megaphone,       path: "/campaigns" },
  { label: "Contacts",       icon: Users,           path: "/contacts" },
  { label: "Signals Agents", icon: Radio,           path: "/signals" },
  { label: "Unibox",         icon: Mail,            path: "/unibox" },
  { label: "Settings",       icon: Settings,        path: "/settings" },
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

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    async function loadUser() {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;

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

      const email = user.email ?? "";
      const firstName = user.user_metadata?.first_name || "";
      const lastName  = user.user_metadata?.last_name  || "";
      const fullName  = [firstName, lastName].filter(Boolean).join(" ") || user.user_metadata?.full_name || user.user_metadata?.name || "";
      const initials  = firstName && lastName ? (firstName[0] + lastName[0]).toUpperCase() : fullName.slice(0, 2).toUpperCase() || email.slice(0, 2).toUpperCase();
      setUserDisplay({ name: fullName, email, initials });
    }
    loadUser();
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-[hsl(195_14%_95%)]">

      {/* ── Desktop sidebar ─────────────────────────────────────────────── */}
      <aside
        className={`hidden md:flex flex-col shrink-0 transition-all duration-200 ${collapsed ? "w-[64px]" : "w-[200px]"}`}
        style={{ background: "hsl(195 14% 95%)" }}
      >
        {/* Logo row */}
        <div className="flex items-center justify-between px-3 py-4">
          <div className="flex items-center gap-2 min-w-0">
            <img src={intentslyIcon} alt="Intentsly" className="w-7 h-7 object-contain shrink-0" />
            {!collapsed && <span className="font-bold text-base tracking-tight text-foreground truncate">Intentsly</span>}
          </div>
          {!collapsed && (
            <button onClick={() => setCollapsed(true)} className="p-1 rounded hover:bg-foreground/10 transition-colors text-foreground/50 hover:text-foreground shrink-0">
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          {collapsed && (
            <button onClick={() => setCollapsed(false)} className="p-1 rounded hover:bg-foreground/10 transition-colors text-foreground/50 hover:text-foreground mx-auto">
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-2 py-1 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors group ${
                  active ? "bg-white text-foreground shadow-sm" : "text-foreground/50 hover:bg-foreground/5 hover:text-foreground/80"
                }`}
              >
                <span className="w-7 h-7 flex items-center justify-center rounded-md shrink-0">
                  <Icon className="w-4 h-4" />
                </span>
                {!collapsed && <span className="flex-1 text-left truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="px-2 pb-3 space-y-1">
          {!collapsed && (
            <div
              className="rounded-xl p-3 mb-2 overflow-hidden relative"
              style={{ backgroundImage: `url(${premiumBg})`, backgroundSize: "cover", backgroundPosition: "center" }}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs font-bold text-foreground">Go Premium</p>
                  <p className="text-[10px] text-foreground/60">Unlock all features</p>
                </div>
                <button onClick={() => navigate("/billing")} className="bg-foreground/10 hover:bg-foreground/15 rounded-full p-1 transition-colors">
                  <ChevronRight className="w-3 h-3 text-foreground" />
                </button>
              </div>
              <button onClick={() => navigate("/billing")} className="w-full flex items-center justify-center gap-1.5 text-[11px] font-semibold text-foreground/70 border border-foreground/15 rounded-md py-1 mb-1.5 hover:bg-foreground/5 transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                7 Days Trial
              </button>
              <button onClick={() => navigate("/billing")} className="w-full text-[11px] font-bold text-primary-foreground bg-foreground hover:bg-foreground/90 rounded-md py-1.5 transition-colors">
                Start Trial ✦
              </button>
            </div>
          )}

          <button onClick={() => navigate("/help")} className="w-full flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-foreground/50 hover:bg-foreground/5 hover:text-foreground/80 transition-colors">
            <HelpCircle className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="truncate">Help Center</span>}
          </button>

          <button className="w-full flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-foreground/50 hover:bg-foreground/5 hover:text-foreground/80 transition-colors">
            <Gift className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="truncate">Join Referral program</span>}
          </button>

          {!collapsed && (
            <p className="text-[10px] text-foreground/30 px-2.5 py-1">0 Credits left &nbsp;·&nbsp; ∞ Leads / Mo</p>
          )}

          <div className="relative" ref={userMenuRef}>
            <button onClick={() => setUserMenuOpen((o) => !o)} className="w-full flex items-center gap-2.5 rounded-md px-2.5 py-2 hover:bg-foreground/5 transition-colors">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: "linear-gradient(135deg, #5C92FF, #9FBDFB)" }}>
                {userDisplay.initials || "?"}
              </div>
              {!collapsed && (
                <>
                  <div className="min-w-0 text-left flex-1">
                    <p className="text-xs font-semibold text-foreground/80 truncate">{userDisplay.name || userDisplay.email}</p>
                    <p className="text-[10px] text-foreground/40 truncate">{userDisplay.email}</p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-foreground/40 shrink-0" />
                </>
              )}
            </button>

            {userMenuOpen && (
              <div className="absolute bottom-full left-0 mb-2 w-64 rounded-xl bg-white shadow-xl border border-gray-100 overflow-hidden z-50">
                <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: "hsl(var(--goji-coral))" }}>
                    {userDisplay.initials || "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{userDisplay.name || userDisplay.email}</p>
                    <p className="text-xs text-gray-500 truncate">{userDisplay.email}</p>
                  </div>
                </div>
                <div className="py-1.5">
                  <button onClick={() => { setUserMenuOpen(false); navigate("/billing"); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <CreditCard className="w-4 h-4 text-yellow-500" />
                    Billing &amp; Plans
                  </button>
                  <button onClick={async () => { await supabase.auth.signOut(); navigate("/login"); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-red-50" style={{ color: "hsl(var(--goji-coral))" }}>
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── Mobile slide-in menu overlay ───────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          {/* Panel */}
          <aside className="absolute left-0 top-0 bottom-0 w-64 flex flex-col" style={{ background: "hsl(195 14% 95%)" }}>
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex items-center gap-2">
                <img src={intentslyIcon} alt="Intentsly" className="w-7 h-7 object-contain" />
                <span className="font-bold text-base tracking-tight text-foreground">Intentsly</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded hover:bg-foreground/10 transition-colors text-foreground/50">
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 px-2 py-1 space-y-0.5 overflow-y-auto">
              {navItems.map((item) => {
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
        {/* Top navbar */}
        <header className="flex items-center justify-between px-4 md:px-6 py-3 shrink-0" style={{ background: "hsl(195 14% 95%)" }}>
          {/* Hamburger — mobile only */}
          <button
            className="md:hidden p-1.5 rounded-md hover:bg-foreground/10 transition-colors text-foreground/60"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          {/* Logo centred on mobile */}
          <div className="md:hidden flex items-center gap-1.5 absolute left-1/2 -translate-x-1/2">
            <img src={intentslyIcon} alt="Intentsly" className="w-6 h-6 object-contain" />
            <span className="font-bold text-sm text-foreground">Intentsly</span>
          </div>
          <div className="hidden md:block" />
          <NotificationsPanel />
        </header>

        <main className="flex-1 overflow-y-auto pb-20 md:pb-0" style={{ background: "hsl(195 14% 95%)" }}>
          {showLinkedInBanner && (
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
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around px-2 py-2 border-t"
          style={{
            background: "rgba(240,244,245,0.92)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderColor: "hsl(195 14% 88%)",
          }}
        >
          {mobileNavItems.map((item) => {
            const active = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all"
                style={active ? { background: "rgba(255,255,255,0.8)" } : undefined}
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

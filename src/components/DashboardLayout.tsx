import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import intentslyIcon from "@/assets/intentsly-icon.png";
import {
  LayoutDashboard,
  Sparkles,
  Megaphone,
  Users,
  Radio,
  Mail,
  BarChart2,
  Plug,
  Settings,
  HelpCircle,
  Gift,
  ChevronLeft,
  ChevronRight,
  Bell,
  LogOut,
  AlertTriangle,
  CreditCard,
  ChevronDown,
} from "lucide-react";

const navItems = [
  { label: "Dashboard",      icon: LayoutDashboard, path: "/dashboard" },
  { label: "Campaigns",      icon: Megaphone,         path: "/campaigns" },
  { label: "Contacts",       icon: Users,             path: "/contacts" },
  { label: "Signals Agents", icon: Radio,             path: "/signals" },
  { label: "Unibox",         icon: Mail,              path: "/unibox" },
  { label: "Settings",       icon: Settings,          path: "/settings" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
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
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ action: "check_status" }),
        });

        if (res.ok) {
          const data = await res.json();
          linkedinConnected = data.status === "connected" && Boolean(data.account_id);
        }
      } catch {
        // fallback to direct profile check below
      }

      if (!linkedinConnected) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("unipile_account_id")
          .eq("user_id", user.id)
          .single();
        linkedinConnected = Boolean(profile?.unipile_account_id);
      }

      setShowLinkedInBanner(!linkedinConnected);

      const email = user.email ?? "";
      const firstName = user.user_metadata?.first_name || "";
      const lastName = user.user_metadata?.last_name || "";
      const fullName = [firstName, lastName].filter(Boolean).join(" ") ||
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        "";
      const initials = firstName && lastName
        ? (firstName[0] + lastName[0]).toUpperCase()
        : fullName.slice(0, 2).toUpperCase() || email.slice(0, 2).toUpperCase();

      setUserDisplay({ name: fullName, email, initials });
    }
    loadUser();
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-[hsl(220_20%_97%)]">
      {/* Sidebar */}
      <aside
        className={`flex flex-col shrink-0 transition-all duration-200 ${
          collapsed ? "w-[64px]" : "w-[200px]"
        }`}
        style={{ background: "hsl(195 14% 95%)" }}
      >
        {/* Logo row */}
        <div className="flex items-center justify-between px-3 py-4">
          <div className="flex items-center gap-2 min-w-0">
            <img src={intentslyIcon} alt="Intentsly" className="w-7 h-7 object-contain shrink-0" />
            {!collapsed && (
              <span className="font-bold text-base tracking-tight text-foreground truncate">Intentsly</span>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="p-1 rounded hover:bg-foreground/10 transition-colors text-foreground/50 hover:text-foreground shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          {collapsed && (
            <button
              onClick={() => setCollapsed(false)}
              className="p-1 rounded hover:bg-foreground/10 transition-colors text-foreground/50 hover:text-foreground mx-auto"
            >
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
                  active
                    ? "bg-white text-foreground shadow-sm"
                    : "text-foreground/50 hover:bg-foreground/5 hover:text-foreground/80"
                }`}
              >
                <span className="w-7 h-7 flex items-center justify-center rounded-md shrink-0">
                  <Icon className="w-4 h-4" />
                </span>
                {!collapsed && (
                  <span className="flex-1 text-left truncate">{item.label}</span>
                )}
                {!collapsed && (item as any).badge && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-foreground text-background">
                    {(item as any).badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="px-2 pb-3 space-y-1">
          {/* Go Premium card */}
          {!collapsed && (
            <div
              className="rounded-xl p-3 mb-2"
              style={{
                background: "linear-gradient(135deg, hsl(25 95% 53%) 0%, hsl(330 85% 55%) 100%)",
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs font-bold text-white">Go Premium</p>
                  <p className="text-[10px] text-white/80">Unlock all features</p>
                </div>
                <button onClick={() => navigate("/billing")} className="bg-white/20 hover:bg-white/30 rounded-full p-1 transition-colors">
                  <ChevronRight className="w-3 h-3 text-white" />
                </button>
              </div>
              <button
                onClick={() => navigate("/billing")}
                className="w-full flex items-center justify-center gap-1.5 text-[11px] font-semibold text-white/80 border border-white/30 rounded-md py-1 mb-1.5 hover:bg-white/10 transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                7 Days Trial
              </button>
              <button
                onClick={() => navigate("/billing")}
                className="w-full text-[11px] font-bold text-white bg-white/20 hover:bg-white/30 rounded-md py-1.5 transition-colors"
              >
                Start Trial ✦
              </button>
            </div>
          )}

          {/* Help Center */}
          <button
            onClick={() => navigate("/help")}
            className="w-full flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-foreground/50 hover:bg-foreground/5 hover:text-foreground/80 transition-colors"
          >
            <HelpCircle className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="truncate">Help Center</span>}
          </button>

          {/* Referral */}
          <button className="w-full flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-foreground/50 hover:bg-foreground/5 hover:text-foreground/80 transition-colors">
            <Gift className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="truncate">Join Referral program</span>}
          </button>

          {/* Credits */}
          {!collapsed && (
            <p className="text-[10px] text-foreground/30 px-2.5 py-1">
              0 Credits left &nbsp;·&nbsp; ∞ Leads / Mo
            </p>
          )}

          {/* User dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen((o) => !o)}
              className="w-full flex items-center gap-2.5 rounded-md px-2.5 py-2 hover:bg-foreground/5 transition-colors"
            >
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: "hsl(var(--foreground))" }}>
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

            {/* Popup menu */}
            {userMenuOpen && (
              <div
                className="absolute bottom-full left-0 mb-2 w-64 rounded-xl bg-white shadow-xl border border-gray-100 overflow-hidden z-50"
              >
                {/* User info header */}
                <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: "hsl(var(--goji-coral))" }}>
                    {userDisplay.initials || "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{userDisplay.name || userDisplay.email}</p>
                    <p className="text-xs text-gray-500 truncate">{userDisplay.email}</p>
                  </div>
                </div>

                {/* Menu items */}
                <div className="py-1.5">
                  <button
                    onClick={() => { setUserMenuOpen(false); navigate("/billing"); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <CreditCard className="w-4 h-4 text-yellow-500" />
                    Billing &amp; Plans
                  </button>
                  <button
                    onClick={async () => { await supabase.auth.signOut(); navigate("/login"); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-red-50"
                    style={{ color: "hsl(var(--goji-coral))" }}
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top navbar */}
        <header
          className="flex items-center justify-between px-6 py-3 shrink-0"
          style={{ background: "hsl(195 14% 95%)" }}
        >
          <div />
          <button className="p-1.5 rounded-md hover:bg-foreground/10 transition-colors text-foreground/60 hover:text-foreground">
            <Bell className="w-5 h-5" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto" style={{ background: "hsl(195 14% 95%)" }}>
          {showLinkedInBanner && (
            <div className="flex items-center justify-between px-5 py-3 border-b" style={{ background: "hsl(25 95% 95%)", borderColor: "hsl(25 90% 85%)" }}>
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: "hsl(25 95% 53%)" }} />
                <p className="text-sm font-medium" style={{ color: "hsl(25 60% 30%)" }}>
                  Connect your LinkedIn account to start discovering leads and running campaigns.
                </p>
              </div>
              <button
                onClick={() => navigate("/settings?tab=linkedin")}
                className="shrink-0 px-3.5 py-1.5 rounded-md text-xs font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: "hsl(var(--goji-coral))" }}
              >
                Connect LinkedIn
              </button>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}

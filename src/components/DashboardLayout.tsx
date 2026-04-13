import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import intentslyIcon from "@/assets/intentsly-icon.png";
import NotificationsPanel from "@/components/NotificationsPanel";
import { useAdminCheck } from "@/hooks/useAdminCheck";

import {
  LayoutDashboard,
  Megaphone,
  Users,
  Radio,
  Mail,
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
} from "lucide-react";

const RedditIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
  </svg>
);

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
  { label: "Settings",       icon: Settings,        path: "/settings" },
];

const adminOnlyNavItems = [
  { label: "Reddit Signals", icon: RedditIcon,      path: "/reddit-signals", badge: "Beta" },
  { label: "X Signals",      icon: XIcon,           path: "/x-signals", badge: "Beta" },
];

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
  const [collapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLinkedInBanner, setShowLinkedInBanner] = useState(false);
  const [userDisplay, setUserDisplay] = useState({ name: "", email: "", initials: "" });
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const sub = useSubscription();
  const { data: isAdmin } = useAdminCheck();

  const navItems = isAdmin
    ? [...baseNavItems, ...adminOnlyNavItems, { label: "Admin", icon: Shield, path: "/admin" }]
    : baseNavItems;

  const allNavItems = navItems;

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
    <div className="flex h-screen overflow-hidden bg-white">

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex flex-col shrink-0 border-r border-gray-100 bg-white w-[240px]">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 pt-6 pb-5">
          <img src={intentslyIcon} alt="Intentsly" className="w-7 h-7 object-contain shrink-0" />
          <span className="font-semibold text-base tracking-tight text-gray-900">Intentsly</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {allNavItems.map((item) => {
            const active = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] transition-colors ${
                  active
                    ? "bg-gray-100 text-gray-900 font-medium"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div className="border-t border-gray-100 px-3 py-4" ref={userMenuRef}>
          <div className="relative">
            <button onClick={() => setUserMenuOpen((o) => !o)} className="w-full flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-gray-50 transition-colors">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0 bg-gray-900">
                {userDisplay.initials || "?"}
              </div>
              <div className="min-w-0 text-left flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">{userDisplay.name || userDisplay.email}</p>
                <p className="text-xs text-gray-400 truncate">{userDisplay.email}</p>
              </div>
            </button>

            {userMenuOpen && (
              <div className="absolute bottom-full left-0 mb-2 w-full rounded-xl bg-white shadow-lg border border-gray-200 overflow-hidden z-50">
                <div className="py-1">
                  <button onClick={() => { setUserMenuOpen(false); navigate("/settings"); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <Settings className="w-4 h-4 text-gray-400" />
                    Settings
                  </button>
                  <button onClick={() => { setUserMenuOpen(false); navigate("/billing"); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <CreditCard className="w-4 h-4 text-gray-400" />
                    Billing &amp; Plans
                  </button>
                  <button onClick={async () => { await supabase.auth.signOut(); navigate("/login"); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── Mobile slide-in menu ── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/20" onClick={() => setMobileMenuOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 flex flex-col bg-white border-r border-gray-200">
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex items-center gap-2">
                <img src={intentslyIcon} alt="Intentsly" className="w-7 h-7 object-contain" />
                <span className="font-semibold text-sm text-gray-900">Intentsly</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded-md hover:bg-gray-100 transition-colors text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 px-2 py-1 space-y-0.5 overflow-y-auto">
              {allNavItems.map((item) => {
                const active = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => { navigate(item.path); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      active ? "bg-gray-100 text-gray-900 font-medium" : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                    }`}
                  >
                    <Icon className="w-[18px] h-[18px] shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="px-3 pb-4 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-2.5 px-2 py-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0 bg-gray-900">
                  {userDisplay.initials || "?"}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate">{userDisplay.name || userDisplay.email}</p>
                  <p className="text-[10px] text-gray-400 truncate">{userDisplay.email}</p>
                </div>
              </div>
              <button onClick={async () => { await supabase.auth.signOut(); navigate("/login"); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50 transition-colors mt-1">
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 md:px-6 py-3 shrink-0 bg-white border-b border-gray-200">
          <button
            className="md:hidden p-1.5 rounded-md hover:bg-gray-100 transition-colors text-gray-500"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="md:hidden flex items-center gap-1.5 absolute left-1/2 -translate-x-1/2">
            <img src={intentslyIcon} alt="Intentsly" className="w-6 h-6 object-contain" />
            <span className="font-semibold text-sm text-gray-900">Intentsly</span>
          </div>
          <div className="hidden md:block" />
          <NotificationsPanel />
        </header>

        <main className="flex-1 overflow-y-auto pb-20 md:pb-0 bg-[#f7f8fa]">
          {showLinkedInBanner && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 bg-amber-50 border-b border-amber-100">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                <p className="text-sm font-medium text-amber-800">
                  Connect your LinkedIn account to start discovering leads and running campaigns.
                </p>
              </div>
              <button onClick={() => navigate("/settings?tab=linkedin")} className="shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-gray-900 hover:bg-gray-800 transition-colors">
                Connect LinkedIn
              </button>
            </div>
          )}
          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around px-2 py-2 bg-white border-t border-gray-200">
          {mobileNavItems.map((item) => {
            const active = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all"
              >
                <Icon className={`w-5 h-5 transition-colors ${active ? "text-gray-900" : "text-gray-400"}`} />
                <span className={`text-[10px] font-medium transition-colors ${active ? "text-gray-900" : "text-gray-400"}`}>
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

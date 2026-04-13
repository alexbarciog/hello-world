import { useState, useEffect, useRef, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import intentslyIcon from "@/assets/intentsly-icon.png";
import uniboxIcon from "@/assets/unibox-icon.png";
import contactsIcon from "@/assets/contacts-icon.png";
import NotificationsPanel from "@/components/NotificationsPanel";
import { useAdminCheck } from "@/hooks/useAdminCheck";

import {
  Megaphone,
  Radio,
  Settings,
  LogOut,
  AlertTriangle,
  CreditCard,
  Menu,
  X,
  Shield,
  ChevronRight,
  Plus,
  Flame,
  Thermometer,
  Snowflake,
  Calendar,
  ThumbsDown,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

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
const DashboardIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.81249 9.09609C7.90753 9.04123 7.98644 8.96231 8.04129 8.86727C8.09615 8.77223 8.12502 8.66442 8.12499 8.55469V2.92969C8.12443 2.83004 8.10006 2.73198 8.0539 2.64367C8.00774 2.55536 7.94113 2.47936 7.85964 2.42202C7.77814 2.36469 7.68412 2.32766 7.5854 2.31405C7.48669 2.30043 7.38616 2.31062 7.29218 2.34375C5.46794 2.98939 3.93383 4.26457 2.96563 5.94005C1.99743 7.61554 1.65863 9.58145 2.01015 11.4844C2.02837 11.5828 2.06995 11.6754 2.1314 11.7544C2.19285 11.8333 2.27237 11.8964 2.36327 11.9383C2.44519 11.9766 2.53456 11.9963 2.62499 11.9961C2.73469 11.9961 2.84247 11.9673 2.93749 11.9125L7.81249 9.09609ZM6.87499 3.87656V8.19375L3.13437 10.3523C3.12499 10.2344 3.12499 10.1156 3.12499 10C3.1261 8.73309 3.47678 7.49106 4.13843 6.41066C4.80007 5.33025 5.74701 4.45337 6.87499 3.87656ZM18.125 10C18.1256 11.7837 17.5393 13.518 16.4564 14.9354C15.3735 16.3528 13.8543 17.3745 12.1332 17.8428C10.4121 18.3111 8.58472 18.2 6.93298 17.5267C5.28125 16.8534 3.89698 15.6553 2.99374 14.1172C2.95164 14.0461 2.92403 13.9675 2.91251 13.8857C2.901 13.8039 2.9058 13.7207 2.92665 13.6407C2.9475 13.5608 2.98398 13.4859 3.03398 13.4201C3.08398 13.3544 3.14651 13.2992 3.21796 13.2578L9.37499 9.67422V2.5C9.37499 2.33424 9.44084 2.17527 9.55805 2.05806C9.67526 1.94085 9.83423 1.875 9.99999 1.875C11.4179 1.87572 12.8109 2.24729 14.0408 2.95282C15.2706 3.65834 16.2946 4.67328 17.0109 5.89688C17.0195 5.90938 17.0273 5.92188 17.0351 5.93516C17.043 5.94844 17.0508 5.96406 17.0578 5.97812C17.7588 7.20247 18.1268 8.58916 18.125 10Z" />
  </svg>
);

const baseNavItems = [
  { label: "Dashboard",      icon: DashboardIcon, path: "/dashboard" },
  { label: "Campaigns",      icon: Megaphone,       path: "/campaigns" },
  { label: "Contacts",       icon: ({ className }: { className?: string }) => <img src={contactsIcon} alt="Contacts" className={className} style={{ filter: "brightness(0) saturate(100%)" }} />, path: "/contacts" },
  { label: "Signals Agents", icon: Radio,           path: "/signals" },
  { label: "Unibox",         icon: ({ className }: { className?: string }) => <img src={uniboxIcon} alt="Unibox" className={className} style={{ filter: "brightness(0) saturate(100%)" }} />, path: "/unibox" },
  { label: "Settings",       icon: Settings,        path: "/settings" },
];

const adminOnlyNavItems = [
  { label: "Reddit Signals", icon: RedditIcon,      path: "/reddit-signals", badge: "Beta" },
  { label: "X Signals",      icon: XIcon,           path: "/x-signals", badge: "Beta" },
];

const mobileNavItems = [
  { label: "Home",      icon: DashboardIcon, path: "/dashboard" },
  { label: "Campaigns", icon: Megaphone,       path: "/campaigns" },
  { label: "Contacts",  icon: ({ className }: { className?: string }) => <img src={contactsIcon} alt="Contacts" className={className} style={{ filter: "brightness(0) saturate(100%)" }} />, path: "/contacts" },
  { label: "Signals",   icon: Radio,           path: "/signals" },
  { label: "Settings",  icon: Settings,        path: "/settings" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLinkedInBanner, setShowLinkedInBanner] = useState(false);
  const [userDisplay, setUserDisplay] = useState({ name: "", email: "", initials: "" });
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const userMenuRef = useRef<HTMLDivElement>(null);
  
  const { data: isAdmin } = useAdminCheck();

  const { data: campaignsList } = useQuery({
    queryKey: ["sidebar-campaigns"],
    queryFn: async () => {
      const { data } = await supabase.from("campaigns").select("id, description, status").order("created_at", { ascending: false }).limit(10);
      return data ?? [];
    },
    staleTime: 60_000,
  });

  const { data: signalAgentsList } = useQuery({
    queryKey: ["sidebar-signal-agents"],
    queryFn: async () => {
      const { data } = await supabase.from("signal_agents").select("id, name, status").order("created_at", { ascending: false }).limit(10);
      return data ?? [];
    },
    staleTime: 60_000,
  });

  const toggleSection = (label: string) => {
    setExpandedSections((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const expandableItems = useMemo(() => new Set(["Campaigns", "Contacts", "Signals Agents"]), []);

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
      <aside className="hidden md:flex flex-col shrink-0 border-r border-gray-100 bg-white w-[220px]">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 pt-6 pb-5">
          <img src={intentslyIcon} alt="Intentsly" className="w-7 h-7 object-contain shrink-0" />
          <span className="font-semibold text-base tracking-tight text-gray-900">Intentsly</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {allNavItems.map((item) => {
            const active = location.pathname === item.path;
            const Icon = item.icon;
            const isExpandable = expandableItems.has(item.label);
            const isExpanded = expandedSections[item.label] ?? false;

            return (
              <div key={item.path}>
                <div className="flex items-center">
                  <button
                    onClick={() => navigate(item.path)}
                    className={`w-[180px] h-9 flex items-center gap-3 rounded-lg px-3 text-[14px] text-gray-900 transition-colors ${
                      active
                        ? "bg-gray-100 font-medium"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    {isExpandable && (
                      <span
                        onClick={(e) => { e.stopPropagation(); toggleSection(item.label); }}
                        className="flex items-center justify-center shrink-0 text-black/20 transition-colors"
                      >
                        <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`} />
                      </span>
                    )}
                    <Icon className="w-[18px] h-[18px] shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                </div>

                {/* Sub-items */}
                {isExpandable && isExpanded && (
                  <div className="ml-5 pl-5 border-l border-gray-100 space-y-0.5 py-1">
                    {item.label === "Contacts" && (
                      <>
                        {[
                          { label: "Hot Leads", filter: "hot" },
                          { label: "Warm Leads", filter: "warm" },
                          { label: "Cold Leads", filter: "cold" },
                          { label: "Meeting", filter: "meeting" },
                          { label: "Not Interested", filter: "not_interested" },
                        ].map((sub) => (
                          <button
                            key={sub.filter}
                            onClick={() => navigate(`/contacts?filter=${sub.filter}`)}
                            className={`w-full flex items-center rounded-md px-2.5 py-1.5 text-[13px] text-gray-900 transition-colors ${
                              location.pathname === "/contacts" && new URLSearchParams(location.search).get("filter") === sub.filter
                                ? "font-medium bg-gray-50"
                                : "hover:bg-gray-50"
                            }`}
                          >
                            <span className="truncate">{sub.label}</span>
                          </button>
                        ))}
                      </>
                    )}

                    {item.label === "Campaigns" && (
                      <>
                        {(campaignsList ?? []).map((c) => (
                          <button
                            key={c.id}
                            onClick={() => navigate(`/campaigns/${c.id}`)}
                            className={`w-full flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] text-gray-900 transition-colors ${
                              location.pathname === `/campaigns/${c.id}`
                                ? "font-medium bg-gray-50"
                                : "hover:bg-gray-50"
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-gray-300" />
                            <span className="truncate">{c.description || "Untitled"}</span>
                          </button>
                        ))}
                        <button
                          onClick={() => navigate("/campaigns?autoStart=true")}
                          className="w-full flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px] text-gray-900 hover:bg-gray-50 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5 shrink-0" />
                          <span>New campaign</span>
                        </button>
                      </>
                    )}

                    {item.label === "Signals Agents" && (
                      <>
                        {(signalAgentsList ?? []).map((a) => (
                          <button
                            key={a.id}
                            onClick={() => navigate(`/signals`)}
                            className="w-full flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] text-gray-900 hover:bg-gray-50 transition-colors"
                          >
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${a.status === "active" ? "bg-green-400" : "bg-gray-300"}`} />
                            <span className="truncate">{a.name}</span>
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
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

import { useState } from "react";
import intentslyIcon from "@/assets/intentsly-icon.png";
import {
  LayoutDashboard,
  Megaphone,
  Users,
  Radio,
  Mail,
  MessageSquare,
  Plug,
  Settings,
  HelpCircle,
  LifeBuoy,
  ChevronLeft,
  ChevronRight,
  LogIn,
} from "lucide-react";
import { AuthPromptDialog } from "./AuthPromptDialog";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Campaigns", icon: Megaphone, path: "/campaigns" },
  { label: "Contacts", icon: Users, path: "/contacts", active: true },
  { label: "Signals Agents", icon: Radio, path: "/signals" },
  { label: "Unibox", icon: Mail, path: "/unibox" },
  { label: "AI Chat", icon: MessageSquare, path: "/ai-chat" },
  { label: "Integrations", icon: Plug, path: "/integrations" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

interface PublicDashboardLayoutProps {
  shareToken: string;
  children: React.ReactNode;
}

export default function PublicDashboardLayout({ shareToken, children }: PublicDashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  const requireAuth = () => setAuthOpen(true);

  return (
    <div className="flex h-screen overflow-hidden bg-[hsl(195_14%_95%)]">
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex flex-col shrink-0 transition-all duration-200 ${
          collapsed ? "w-[64px]" : "w-[230px]"
        }`}
        style={{ background: "hsl(195 14% 95%)" }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-3 py-4">
          <div className="flex items-center gap-2 min-w-0">
            <img src={intentslyIcon} alt="Intentsly" className="w-7 h-7 object-contain shrink-0" />
            {!collapsed && (
              <span className="font-bold text-base tracking-tight text-foreground truncate">Intentsly</span>
            )}
          </div>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="p-1 rounded hover:bg-foreground/10 transition-colors text-foreground/50 hover:text-foreground shrink-0"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Nav items - all gated */}
        <nav className="flex-1 px-2 py-1 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.active;
            return (
              <button
                key={item.path}
                onClick={requireAuth}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-white text-foreground shadow-sm"
                    : "text-foreground/50 hover:bg-foreground/5 hover:text-foreground/80"
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
            <div className="rounded-xl p-3 mb-2 bg-white border border-border">
              <p className="text-xs font-bold text-foreground mb-1">Shared with you</p>
              <p className="text-[10px] text-foreground/60 mb-2">
                Sign up to save these leads & unlock the full Intentsly platform.
              </p>
              <button
                onClick={requireAuth}
                className="w-full text-[11px] font-bold text-background bg-foreground hover:opacity-90 rounded-md py-1.5 transition-opacity"
              >
                Sign up free ✦
              </button>
            </div>
          )}

          <button
            onClick={requireAuth}
            className="w-full flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-foreground/50 hover:bg-foreground/5 hover:text-foreground/80 transition-colors"
          >
            <HelpCircle className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="truncate">Help Center</span>}
          </button>

          <button
            onClick={requireAuth}
            className="w-full flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-foreground/50 hover:bg-foreground/5 hover:text-foreground/80 transition-colors"
          >
            <LifeBuoy className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="truncate">Support</span>}
          </button>

          {/* Login / Sign up button - replaces user slot */}
          <button
            onClick={requireAuth}
            className="w-full flex items-center gap-2.5 rounded-md px-2.5 py-2.5 text-sm font-semibold text-background bg-foreground hover:opacity-90 transition-opacity"
          >
            <LogIn className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="truncate">Login / Sign up</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>

      <AuthPromptDialog
        open={authOpen}
        onOpenChange={setAuthOpen}
        shareToken={shareToken}
        message="Sign up free to access the full Intentsly dashboard — campaigns, AI outreach, signal agents and more."
      />
    </div>
  );
}

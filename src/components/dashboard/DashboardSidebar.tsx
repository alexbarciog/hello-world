import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Zap, UserPlus, Target, MessageSquare } from "lucide-react";

function formatTimeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getInitials(first?: string, last?: string) {
  return [(first?.[0] ?? ""), (last?.[0] ?? "")].join("").toUpperCase() || "?";
}

const avatarColors = [
  "bg-purple-100 text-purple-600",
  "bg-blue-100 text-blue-600",
  "bg-emerald-100 text-emerald-600",
  "bg-amber-100 text-amber-600",
  "bg-rose-100 text-rose-600",
  "bg-cyan-100 text-cyan-600",
];

export function DashboardSidebar() {
  // ── Notifications (from notifications table) ──
  const { data: notifications = [], isLoading: notifsLoading } = useQuery({
    queryKey: ["sidebar-notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id, title, body, type, created_at, read")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,
  });

  // ── Activities (recent leads + campaigns) ──
  const { data: activities = [], isLoading: activitiesLoading } = useQuery({
    queryKey: ["sidebar-activities"],
    queryFn: async () => {
      const items: { icon: string; text: string; time: string; date: number }[] = [];

      const { data: contacts } = await supabase
        .from("contacts")
        .select("first_name, last_name, imported_at")
        .order("imported_at", { ascending: false })
        .limit(3);

      (contacts ?? []).forEach((c) => {
        items.push({
          icon: "lead",
          text: `New lead: ${c.first_name} ${c.last_name || ""}`.trim(),
          time: formatTimeAgo(c.imported_at),
          date: new Date(c.imported_at).getTime(),
        });
      });

      const { data: campaigns } = await supabase
        .from("campaigns")
        .select("description, created_at, status")
        .order("created_at", { ascending: false })
        .limit(2);

      (campaigns ?? []).forEach((c) => {
        items.push({
          icon: c.status === "active" ? "active" : "campaign",
          text: c.status === "active" ? "Campaign launched" : "Campaign created",
          time: formatTimeAgo(c.created_at),
          date: new Date(c.created_at).getTime(),
        });
      });

      return items.sort((a, b) => b.date - a.date).slice(0, 5);
    },
    staleTime: 60_000,
  });

  // ── Contacts ──
  const { data: contacts = [], isLoading: contactsLoading } = useQuery({
    queryKey: ["sidebar-contacts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select("first_name, last_name, title, company, imported_at")
        .order("imported_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });

  const activityIcon = (type: string) => {
    switch (type) {
      case "lead": return <UserPlus className="w-4 h-4" />;
      case "active": return <Zap className="w-4 h-4" />;
      case "campaign": return <Target className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const activityIconBg = (type: string) => {
    switch (type) {
      case "lead": return "bg-blue-50 text-blue-500";
      case "active": return "bg-emerald-50 text-emerald-500";
      case "campaign": return "bg-purple-50 text-purple-500";
      default: return "bg-gray-50 text-gray-500";
    }
  };

  const notifIcon = (type: string) => {
    switch (type) {
      case "signal": return <Zap className="w-4 h-4" />;
      case "campaign": return <Target className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const SkeletonRows = ({ count = 3 }: { count?: number }) => (
    <div className="space-y-3">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-28 bg-gray-100 rounded animate-pulse" />
            <div className="h-2.5 w-16 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <aside className="w-[280px] shrink-0 space-y-6">
      {/* ── Notifications ── */}
      <div className="bg-[#F9F9FA] rounded-2xl border border-gray-200/60 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Notifications</h3>
        {notifsLoading ? (
          <SkeletonRows count={3} />
        ) : notifications.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">No notifications</p>
        ) : (
          <div className="space-y-3.5">
            {notifications.map((n) => (
              <div key={n.id} className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center shrink-0">
                  {notifIcon(n.type)}
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-gray-900 leading-snug truncate">{n.title}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{formatTimeAgo(n.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Activities ── */}
      <div className="bg-[#F9F9FA] rounded-2xl border border-gray-200/60 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Activities</h3>
        {activitiesLoading ? (
          <SkeletonRows count={3} />
        ) : activities.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">No recent activity</p>
        ) : (
          <div className="space-y-3.5">
            {activities.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${activityIconBg(item.icon)}`}>
                  {activityIcon(item.icon)}
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] text-gray-700 leading-snug">{item.text}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Contacts ── */}
      <div className="bg-[#F9F9FA] rounded-2xl border border-gray-200/60 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Contacts</h3>
        {contactsLoading ? (
          <SkeletonRows count={4} />
        ) : contacts.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">No contacts yet</p>
        ) : (
          <div className="space-y-3.5">
            {contacts.map((c, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold ${avatarColors[i % avatarColors.length]}`}>
                  {getInitials(c.first_name, c.last_name ?? undefined)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {[c.first_name, c.last_name].filter(Boolean).join(" ")}
                  </p>
                  <p className="text-[11px] text-gray-400 truncate">
                    {[c.title, c.company].filter(Boolean).join(" · ") || "No info"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

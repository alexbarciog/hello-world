import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Zap, Send, UserPlus, Target } from "lucide-react";

interface ActivityItem {
  icon: React.ReactNode;
  iconBg: string;
  text: string;
  time: string;
}

export function RecentActivity() {
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["dashboard-recent-activity"],
    queryFn: async () => {
      const items: ActivityItem[] = [];

      // Get recent contacts
      const { data: contacts } = await supabase
        .from("contacts")
        .select("first_name, last_name, imported_at")
        .order("imported_at", { ascending: false })
        .limit(3);

      (contacts ?? []).forEach((c) => {
        items.push({
          icon: <UserPlus className="w-3.5 h-3.5" />,
          iconBg: "bg-blue-50 text-blue-500",
          text: `New lead: ${c.first_name} ${c.last_name || ""}`.trim(),
          time: formatTimeAgo(c.imported_at),
        });
      });

      // Get recent campaigns
      const { data: campaigns } = await supabase
        .from("campaigns")
        .select("description, created_at, status")
        .order("created_at", { ascending: false })
        .limit(2);

      (campaigns ?? []).forEach((c) => {
        items.push({
          icon: c.status === "active" ? <Zap className="w-3.5 h-3.5" /> : <Target className="w-3.5 h-3.5" />,
          iconBg: c.status === "active" ? "bg-emerald-50 text-emerald-500" : "bg-purple-50 text-purple-500",
          text: c.status === "active" ? `Campaign launched` : `Campaign created`,
          time: formatTimeAgo(c.created_at),
        });
      });

      // Sort by recency (rough sort by time string)
      return items.slice(0, 5);
    },
    staleTime: 60_000,
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-6">
      <h2 className="text-sm font-semibold text-gray-900 mb-5">Activities</h2>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-gray-100 animate-pulse" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-32 bg-gray-100 rounded animate-pulse" />
                <div className="h-2 w-16 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-6">No recent activity</p>
      ) : (
        <div className="space-y-4">
          {activities.map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${item.iconBg}`}>
                {item.icon}
              </div>
              <div>
                <p className="text-[13px] text-gray-700 leading-snug">{item.text}</p>
                <p className="text-[11px] text-gray-400">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatTimeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

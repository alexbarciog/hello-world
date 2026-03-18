import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Bell, X, Users, Radio, Megaphone, Info, CheckCheck, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type NotificationType = "lead" | "signal" | "campaign" | "warning" | "info";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}

const typeConfig: Record<NotificationType, { icon: React.ReactNode; bg: string; dot: string }> = {
  lead: {
    icon: <Users className="w-3.5 h-3.5" />,
    bg: "hsl(215 100% 97%)",
    dot: "hsl(215 90% 60%)",
  },
  signal: {
    icon: <Radio className="w-3.5 h-3.5" />,
    bg: "hsl(25 100% 96%)",
    dot: "hsl(25 95% 53%)",
  },
  campaign: {
    icon: <Megaphone className="w-3.5 h-3.5" />,
    bg: "hsl(270 100% 97%)",
    dot: "hsl(270 80% 60%)",
  },
  warning: {
    icon: <Info className="w-3.5 h-3.5" />,
    bg: "hsl(45 100% 96%)",
    dot: "hsl(40 95% 50%)",
  },
  info: {
    icon: <Info className="w-3.5 h-3.5" />,
    bg: "hsl(150 60% 96%)",
    dot: "hsl(150 60% 45%)",
  },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationsPanel() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Load user & notifications
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) return;
      setUserId(session.user.id);
      fetchNotifications(session.user.id);
    });
  }, []);

  // Real-time subscription
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  async function fetchNotifications(uid: string) {
    const { data } = await db
      .from("notifications")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(30);
    if (data) setNotifications(data as Notification[]);
  }

  async function markAllRead() {
    if (!userId) return;
    await db
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  async function markRead(id: string) {
    await db.from("notifications").update({ read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  async function deleteNotification(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    await db.from("notifications").delete().eq("id", id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  function handleClickNotification(n: Notification) {
    if (!n.read) markRead(n.id);
    if (n.link) { setOpen(false); navigate(n.link); }
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-1.5 rounded-md hover:bg-foreground/10 transition-colors text-foreground/60 hover:text-foreground"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
            style={{ background: "hsl(var(--goji-coral))" }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-full mt-2 w-[360px] max-w-[calc(100vw-24px)] rounded-2xl border border-border bg-card shadow-2xl overflow-hidden z-50"
            style={{ boxShadow: "0 16px 48px hsl(220 14% 10% / 0.12)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: "hsl(var(--goji-coral))" }}>
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto max-h-[420px]">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Bell className="w-8 h-8 mb-3 opacity-30" />
                  <p className="text-sm font-medium">No notifications yet</p>
                  <p className="text-xs opacity-60 mt-0.5">We'll notify you when something happens</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map((n) => {
                    const cfg = typeConfig[n.type] || typeConfig.info;
                    return (
                      <div
                        key={n.id}
                        onClick={() => handleClickNotification(n)}
                        className={`group relative flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-colors hover:bg-muted/40 ${!n.read ? "bg-muted/20" : ""}`}
                      >
                        {/* Icon */}
                        <div
                          className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5"
                          style={{ background: cfg.bg, color: cfg.dot }}
                        >
                          {cfg.icon}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm leading-snug ${!n.read ? "font-semibold text-foreground" : "font-medium text-foreground/80"}`}>
                              {n.title}
                            </p>
                            <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">{timeAgo(n.created_at)}</span>
                          </div>
                          {n.body && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                          )}
                        </div>

                        {/* Unread dot */}
                        {!n.read && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
                        )}

                        {/* Delete on hover */}
                        <button
                          onClick={(e) => deleteNotification(n.id, e)}
                          className="absolute right-8 top-1/2 -translate-y-1/2 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all text-muted-foreground hover:text-red-500"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="border-t border-border px-4 py-2.5">
                <p className="text-[11px] text-muted-foreground text-center">
                  {notifications.length} notification{notifications.length !== 1 ? "s" : ""} total
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

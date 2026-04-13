import { useNavigate } from "react-router-dom";
import { MessageSquare, ArrowRight, Rocket } from "lucide-react";

function LeadAvatar({ initials, color }: { initials: string; color: string }) {
  return (
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-md"
      style={{ background: color }}
    >
      {initials}
    </div>
  );
}

const avatarColors = [
  "hsl(var(--md-primary))",
  "hsl(var(--md-secondary))",
  "hsl(var(--md-tertiary))",
];

interface Reply {
  name: string;
  avatar_url: string | null;
  text: string;
  timestamp: string;
  is_sender: boolean;
  chat_id: string;
}

interface LatestRepliesProps {
  replies: Reply[];
  loading: boolean;
}

export function LatestReplies({ replies, loading }: LatestRepliesProps) {
  const navigate = useNavigate();

  return (
    <div className="glass-card rounded-[2rem] p-6 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-md-on-surface tracking-tight">Latest Replies</h2>
        <button
          onClick={() => navigate("/unibox")}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-md-secondary/10 rounded-full cursor-pointer hover:bg-md-secondary/20 transition-colors group"
        >
          <span className="text-xs font-semibold text-md-secondary">Open Inbox</span>
          <ArrowRight className="w-3 h-3 text-md-secondary group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {loading ? (
        <div className="space-y-3 py-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <div className="w-10 h-10 rounded-xl bg-md-surface-container animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-32 bg-md-surface-container rounded animate-pulse" />
                <div className="h-2.5 w-48 bg-md-surface-container rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : replies.length > 0 ? (
        <div className="space-y-2">
          {replies.map((reply, i) => {
            const initials = reply.name.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase();
            const timeAgo = reply.timestamp
              ? (() => {
                  const diff = Math.floor((Date.now() - new Date(reply.timestamp).getTime()) / 1000);
                  if (diff < 60) return `${diff}s ago`;
                  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
                  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
                  return `${Math.floor(diff / 86400)}d ago`;
                })()
              : "";
            return (
              <div
                key={reply.chat_id || i}
                onClick={() => navigate("/unibox")}
                className="group flex items-center gap-3 p-3 rounded-xl bg-white/30 border border-transparent hover:border-white/60 hover:bg-white/60 transition-all duration-500 cursor-pointer"
              >
                {reply.avatar_url ? (
                  <img src={reply.avatar_url} alt={reply.name} className="w-10 h-10 rounded-xl object-cover shrink-0 shadow-md" />
                ) : (
                  <LeadAvatar initials={initials} color={avatarColors[i % avatarColors.length]} />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-md-on-surface text-sm">{reply.name}</span>
                    {timeAgo && <span className="text-[10px] text-md-on-surface-variant">{timeAgo}</span>}
                  </div>
                  <p className="text-xs font-light text-md-on-surface-variant truncate">{reply.text || "No message"}</p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <div className="w-14 h-14 rounded-2xl bg-md-secondary/10 flex items-center justify-center">
            <MessageSquare className="w-7 h-7 text-md-secondary" />
          </div>
          <p className="text-sm text-md-on-surface-variant text-center max-w-[220px]">
            Replies from prospects will appear here
          </p>
          <button
            onClick={() => navigate("/campaigns?autoStart=true")}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold text-md-secondary border border-md-secondary/30 hover:bg-md-secondary/5 transition-colors"
          >
            <Rocket className="w-4 h-4" />
            Set up a campaign
          </button>
        </div>
      )}
    </div>
  );
}

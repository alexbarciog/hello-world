import { useNavigate } from "react-router-dom";
import { MessageSquare, ArrowRight } from "lucide-react";

function ReplyAvatar({ name, url, color }: { name: string; url: string | null; color: string }) {
  const initials = name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  if (url) {
    return <img src={url} alt={name} className="w-9 h-9 rounded-lg object-cover shrink-0" />;
  }
  return (
    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[11px] font-semibold text-white shrink-0" style={{ background: color }}>
      {initials}
    </div>
  );
}

const avatarColors = ["#6366f1", "#8b5cf6", "#0ea5e9", "#14b8a6"];

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

  const timeAgo = (ts: string) => {
    if (!ts) return "";
    const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="bg-snow-bg-2 rounded-[20px] p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-gray-900">Latest Replies</h2>
        <button
          onClick={() => navigate("/unibox")}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Open Inbox
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-100 animate-pulse" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-28 bg-gray-100 rounded animate-pulse" />
                <div className="h-2.5 w-40 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : replies.length > 0 ? (
        <div className="divide-y divide-gray-100">
          {replies.map((reply, i) => (
            <div
              key={reply.chat_id || i}
              onClick={() => navigate("/unibox")}
              className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors cursor-pointer"
            >
              <ReplyAvatar name={reply.name} url={reply.avatar_url} color={avatarColors[i % avatarColors.length]} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-medium text-gray-900 truncate">{reply.name}</p>
                  <span className="text-[10px] text-gray-400 shrink-0 ml-2">{timeAgo(reply.timestamp)}</span>
                </div>
                <p className="text-[11px] text-gray-400 truncate">{reply.text || "No message"}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-gray-300" />
          </div>
          <p className="text-xs text-gray-400 text-center">
            Replies from prospects will appear here
          </p>
          <button
            onClick={() => navigate("/campaigns?autoStart=true")}
            className="text-xs font-medium text-gray-900 hover:underline mt-1"
          >
            Set up a campaign →
          </button>
        </div>
      )}
    </div>
  );
}

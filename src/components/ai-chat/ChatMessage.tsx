import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import intentslyIcon from "@/assets/intentsly-icon.png";
import type { ChatMessageData } from "./types";

interface Props {
  message: ChatMessageData;
  onQuickReply?: (text: string) => void;
  isLatest?: boolean;
}

export function ChatMessage({ message, onQuickReply, isLatest }: Props) {
  const isUser = message.role === "user";
  const [userName, setUserName] = useState("You");

  useEffect(() => {
    if (!isUser) return;
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      const name =
        (u?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ||
        (u?.user_metadata?.first_name as string | undefined) ||
        u?.email?.split("@")[0] ||
        "You";
      setUserName(name);
    });
  }, [isUser]);

  // Strip leaked JSON from AI message content
  const cleanContent = (() => {
    if (isUser) return message.content;
    let text = message.content;
    try {
      const trimmed = text.trim();
      if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
        const parsed = JSON.parse(trimmed);
        if (parsed.message && typeof parsed.message === "string") {
          text = parsed.message;
        }
      }
    } catch {
      // not valid JSON, continue with text cleanup
    }
    return text.replace(/\n?\s*\{["\s]*label["\s]*:.*?\}\s*/gs, "").trim();
  })();

  return (
    <div className={cn("flex gap-3 group", isUser && "flex-row-reverse")}>
      {/* Logo avatar for AI messages */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 overflow-hidden">
          <img src={intentslyIcon} alt="AI" className="w-6 h-6 object-contain" />
        </div>
      )}

      {/* Message Content */}
      <div className={cn("max-w-[85%] flex flex-col gap-1.5", isUser && "items-end")}>
        {/* Username for user messages */}
        {isUser && (
          <span className="text-xs font-medium text-foreground/60 px-1">{userName}</span>
        )}

        {/* Message bubble */}
        {isUser ? (
          <div className="rounded-2xl rounded-br-sm bg-foreground text-primary-foreground px-4 py-2.5 text-sm leading-relaxed">
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
        ) : (
          <div className="text-sm leading-relaxed text-foreground">
            <div className="prose prose-sm max-w-none prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0.5 prose-strong:text-foreground">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{cleanContent}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* Quick Replies — only on the latest assistant message */}
        {!isUser && isLatest && message.quick_replies && message.quick_replies.length > 0 && onQuickReply && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {message.quick_replies.map((q) => (
              <button
                key={q}
                onClick={() => onQuickReply(q)}
                className="text-xs px-3 py-1.5 rounded-full bg-white border border-border hover:border-[hsl(var(--md-secondary))] hover:text-[hsl(var(--md-secondary))] transition-colors text-foreground/70"
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

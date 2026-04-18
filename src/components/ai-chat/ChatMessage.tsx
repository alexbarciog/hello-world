import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import intentslyIcon from "@/assets/intentsly-icon.png";
import type { ChatMessageData } from "./types";

interface Props {
  message: ChatMessageData;
  onQuickReply?: (text: string) => void;
}

export function ChatMessage({ message, onQuickReply }: Props) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-3 group", isUser && "flex-row-reverse")}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center shrink-0">
          <img src={intentslyIcon} alt="AI" className="w-4 h-4 object-contain" />
        </div>
      )}
      <div className={cn("max-w-[85%] flex flex-col gap-2", isUser && "items-end")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
            isUser
              ? "bg-foreground text-primary-foreground rounded-br-sm"
              : "bg-white border border-border text-foreground rounded-bl-sm"
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-sm max-w-none prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0.5">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>
        {message.quick_replies && message.quick_replies.length > 0 && onQuickReply && (
          <div className="flex flex-wrap gap-1.5">
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

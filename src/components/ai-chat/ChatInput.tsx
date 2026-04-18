import { useRef, useEffect } from "react";
import { Send, Paperclip, Mic, Loader2 } from "lucide-react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
  size?: "default" | "lg";
}

export function ChatInput({
  value,
  onChange,
  onSend,
  disabled,
  placeholder = "Describe who you want to reach…",
  size = "default",
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, size === "lg" ? 180 : 150) + "px";
    }
  }, [value, size]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) onSend();
    }
  };

  const handleSend = () => {
    if (value.trim() && !disabled) onSend();
  };

  return (
    <div className="bg-card border border-border rounded-lg sm:rounded-xl shadow-lg overflow-hidden">
      {/* Input area */}
      <div className="p-3 sm:p-4">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full bg-transparent text-foreground placeholder:text-muted-foreground resize-none border-0 outline-none text-xs sm:text-sm min-h-[24px] max-h-[120px] sm:max-h-[150px]"
          rows={1}
        />
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between px-3 sm:px-4 pb-3 sm:pb-4">
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            disabled
            className="p-1.5 sm:p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
            title="Attach file (coming soon)"
          >
            <Paperclip className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <button
            disabled
            className="p-1.5 sm:p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
            title="Voice input (coming soon)"
          >
            <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
        <button
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          className="w-9 h-9 rounded-full text-white flex items-center justify-center transition-opacity disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #1a1a2e, #4a4a5a)" }}
        >
          {disabled ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

import { useRef, useEffect } from "react";
import { Send, Paperclip, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
  size?: "default" | "lg";
}

export function ChatInput({ value, onChange, onSend, disabled, placeholder = "Describe who you want to reach…", size = "default" }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = Math.min(ref.current.scrollHeight, 180) + "px";
    }
  }, [value]);

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) onSend();
    }
  };

  return (
    <div className={cn(
      "rounded-2xl border border-border bg-white shadow-sm transition-shadow focus-within:shadow-md",
      size === "lg" ? "p-3" : "p-2"
    )}>
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKey}
        placeholder={placeholder}
        rows={1}
        disabled={disabled}
        className={cn(
          "w-full resize-none bg-transparent outline-none placeholder:text-foreground/30 text-foreground",
          size === "lg" ? "px-3 py-2 text-base" : "px-2 py-1.5 text-sm"
        )}
      />
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1 text-foreground/30">
          <button disabled className="p-1.5 rounded-md hover:bg-foreground/5 transition-colors disabled:cursor-not-allowed">
            <Paperclip className="w-4 h-4" />
          </button>
          <button disabled className="p-1.5 rounded-md hover:bg-foreground/5 transition-colors disabled:cursor-not-allowed">
            <Mic className="w-4 h-4" />
          </button>
        </div>
        <Button
          onClick={onSend}
          disabled={disabled || !value.trim()}
          size={size === "lg" ? "default" : "sm"}
          className="bg-[hsl(var(--md-secondary))] hover:bg-[hsl(var(--md-secondary)/0.9)] text-white rounded-xl gap-1.5"
        >
          <Send className="w-4 h-4" />
          {size === "lg" ? "Search" : ""}
        </Button>
      </div>
    </div>
  );
}

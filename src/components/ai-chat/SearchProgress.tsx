import { Search, Loader2 } from "lucide-react";

export function SearchProgress({ label = "Searching LinkedIn for matching leads…" }: { label?: string }) {
  return (
    <div className="rounded-xl border border-border bg-white p-4 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-[hsl(var(--md-secondary)/0.1)] flex items-center justify-center text-[hsl(var(--md-secondary))]">
        <Search className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-foreground/50">This usually takes 10–30 seconds.</p>
      </div>
      <Loader2 className="w-4 h-4 animate-spin text-foreground/40" />
    </div>
  );
}

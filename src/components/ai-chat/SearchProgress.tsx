export function SearchProgress({ label = "Searching LinkedIn for matching leads…" }: { label?: string }) {
  return (
    <div className="flex gap-3 animate-fade-in">
      <div className="flex flex-col gap-1 max-w-[80%] items-start">
        <div className="px-1 py-1">
          <span className="thinking-text-shimmer text-sm font-medium">{label}</span>
        </div>
      </div>
    </div>
  );
}

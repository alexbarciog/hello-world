import { Play } from "lucide-react";

// Alex records the 3-minute product demo; set its URL here (an .mp4 in
// public/videos or a hosted file). Until then the poster shows a placeholder.
export const DEMO_VIDEO_URL: string | null = null;
export const DEMO_VIDEO_POSTER: string | null = null;

export function DemoVideo({ className = "" }: { className?: string }) {
  if (DEMO_VIDEO_URL) {
    return (
      <video
        className={`w-full rounded-2xl border border-black/5 bg-black ${className}`}
        src={DEMO_VIDEO_URL}
        poster={DEMO_VIDEO_POSTER ?? undefined}
        controls
        preload="metadata"
        playsInline
      />
    );
  }
  return (
    <div
      className={`relative w-full aspect-video rounded-2xl overflow-hidden border border-black/5 bg-gradient-to-br from-[#1A1A2E] to-[#2b2b4a] flex flex-col items-center justify-center text-white ${className}`}
      aria-label="Product demo video (coming soon)"
    >
      <div className="w-14 h-14 rounded-full bg-white/15 flex items-center justify-center mb-3">
        <Play className="w-6 h-6 fill-current" />
      </div>
      <p className="text-sm font-semibold">3-minute product demo</p>
      <p className="text-xs text-white/60 mt-1">Coming soon</p>
    </div>
  );
}

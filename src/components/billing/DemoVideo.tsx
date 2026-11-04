// The product demo is a Loom recording (7.5 minutes). The homepage's
// "Watch demo" button links to the same video.
export const DEMO_VIDEO_ID = "3dc9408fe0da4b979cb5642333f4b500";
export const DEMO_VIDEO_URL = `https://www.loom.com/share/${DEMO_VIDEO_ID}`;
const DEMO_EMBED_URL = `https://www.loom.com/embed/${DEMO_VIDEO_ID}?hide_owner=true&hide_share=true&hideEmbedTopBar=true`;

export function DemoVideo({ className = "" }: { className?: string }) {
  return (
    // Loom's player shows this recording at about 16:10.
    <div className={`relative w-full aspect-[16/10] rounded-2xl overflow-hidden border border-black/5 bg-black ${className}`}>
      <iframe
        src={DEMO_EMBED_URL}
        title="Intentsly product demo"
        className="absolute inset-0 h-full w-full"
        allow="fullscreen; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}

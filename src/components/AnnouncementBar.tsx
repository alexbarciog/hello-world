const AnnouncementBar = () => {
  return (
    <div className="w-full bg-[#0a0a0a] text-white py-2.5 px-4 text-center text-sm font-medium">
      <span className="inline-flex items-center gap-2 flex-wrap justify-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] uppercase tracking-wider font-semibold">
          <span>✨</span> Launch Deal
        </span>
        <span className="tracking-tight">
          Founder Pack{" "}
          <span className="line-through text-white/40 mx-1">$199</span>
          <span className="font-bold">$97/mo</span>
          <span className="text-white/50"> · only 14 spots left</span>
        </span>
      </span>
    </div>
  );
};

export default AnnouncementBar;

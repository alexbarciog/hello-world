const AnnouncementBar = () => {
  return (
    <div className="announcement-bar-glow relative w-full overflow-hidden bg-[#3B82F6] py-2.5 px-4 text-center text-sm font-medium text-white">
      <span className="relative z-10 inline-flex flex-wrap items-center justify-center gap-2 sm:gap-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--aeline-dark))] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-[0_0_14px_hsl(var(--aeline-dark)/0.35)]">
          <span>✨</span> Launch Deal
        </span>
        <span className="flex items-center gap-2 tracking-tight">
          <span className="text-white/80">Founder Pack</span>
          <span className="mx-1 line-through text-white/50">$199</span>
          <span className="text-base font-extrabold text-white">$97/mo</span>
        </span>
        <span className="hidden h-4 w-px bg-white/25 sm:block" />
        <span className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--aeline-dark))] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[hsl(var(--aeline-lime))] sm:text-xs">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[hsl(var(--aeline-lime))] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[hsl(var(--aeline-lime))]" />
          </span>
          only 14 spots left
        </span>
      </span>
    </div>
  );
};

export default AnnouncementBar;

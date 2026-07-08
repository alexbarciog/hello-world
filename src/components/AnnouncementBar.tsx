const AnnouncementBar = () => {
  return (
    <div className="announcement-bar-glow relative w-full overflow-hidden bg-[hsl(var(--aeline-lime))] py-2.5 px-4 text-center text-sm font-semibold text-[hsl(var(--aeline-dark))]">
      <span className="relative z-10 inline-flex flex-wrap items-center justify-center gap-2 sm:gap-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--aeline-dark))] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[hsl(var(--aeline-lime))] shadow-[0_0_18px_hsl(var(--aeline-dark)/0.35)]">
          <span className="animate-pulse">✨</span> Launch Deal
        </span>
        <span className="flex items-center gap-2 tracking-tight">
          <span className="text-[hsl(var(--aeline-dark))]/80">Founder Pack</span>
          <span className="mx-1 line-through text-[hsl(var(--aeline-dark))]/40">$199</span>
          <span className="text-base font-black text-[hsl(var(--aeline-dark))]">$97/mo</span>
        </span>
        <span className="hidden h-4 w-px bg-[hsl(var(--aeline-dark))]/20 sm:block" />
        <span className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--aeline-dark))] px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-[hsl(var(--aeline-lime))] shadow-[0_0_18px_hsl(var(--aeline-dark)/0.35)] sm:text-xs">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[hsl(var(--aeline-lime))] opacity-80" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[hsl(var(--aeline-lime))] shadow-[0_0_8px_hsl(var(--aeline-lime))]" />
          </span>
          only 14 spots left
        </span>
      </span>
    </div>
  );
};

export default AnnouncementBar;

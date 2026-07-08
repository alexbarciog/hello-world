const AnnouncementBar = () => {
  return (
    <div className="announcement-bar-glow relative w-full overflow-hidden bg-[hsl(var(--aeline-dark))] py-2.5 px-4 text-center text-sm font-medium text-white">
      <span className="relative z-10 inline-flex flex-wrap items-center justify-center gap-2 sm:gap-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--aeline-sky-start))] px-3 py-1 text-[10px] font-black uppercase tracking-widest shadow-[0_0_14px_hsl(var(--aeline-sky-start)/0.45)]">
          <span>✨</span> Launch Deal
        </span>
        <span className="flex items-center gap-2 tracking-tight">
          <span className="text-white/60">Founder Pack</span>
          <span className="mx-1 line-through text-white/40">$199</span>
          <span className="text-base font-bold">$97/mo</span>
        </span>
        <span className="hidden h-4 w-px bg-white/20 sm:block" />
        <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[hsl(var(--aeline-lime))] sm:text-xs">
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

const Arrow = ({ className }: { className: string }) => (
  <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638l-3.158-3.158a.75.75 0 111.06-1.06l4.5 4.5a.75.75 0 010 1.06l-4.5 4.5a.75.75 0 11-1.06-1.06l3.158-3.158H3.75A.75.75 0 013 10z" clipRule="evenodd" />
  </svg>
);

// Points to /pricing with neutral copy (credit plans from $29/month).
const AnnouncementBar = () => (
  <div className="announcement-bar-glow sticky top-0 z-50 w-full overflow-hidden bg-[hsl(var(--aeline-lime))] py-1.5 sm:py-2.5 px-3 sm:px-4 text-center text-[11px] sm:text-sm font-semibold text-[hsl(var(--aeline-dark))]">
    {/* Mobile: single row */}
    <span className="relative z-10 flex items-center justify-center gap-2 sm:hidden">
      <span className="text-[12px] font-black">Plans from $29/month</span>
      <a href="/pricing" className="inline-flex items-center gap-0.5 font-black underline underline-offset-2 text-[11px]">
        See pricing
        <Arrow className="h-3 w-3" />
      </a>
    </span>

    {/* Desktop / tablet */}
    <span className="relative z-10 hidden sm:inline-flex sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-4">
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--aeline-dark))] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[hsl(var(--aeline-lime))] shadow-[0_0_18px_hsl(var(--aeline-dark)/0.35)]">
          Pricing
        </span>
        <span className="tracking-tight">Plans from $29/month. Pay in credits for the leads and messages you use.</span>
      </span>
      <a href="/pricing" className="inline-flex items-center gap-1 font-black underline underline-offset-2 transition-opacity hover:opacity-70">
        See pricing
        <Arrow className="h-3.5 w-3.5" />
      </a>
    </span>
  </div>
);

export default AnnouncementBar;

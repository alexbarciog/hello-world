import { useCallback, useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, ChevronDown } from "lucide-react";
import { NAV_LINKS, NAV_MENUS, type NavGroup, type NavMenu } from "@/data/siteNav";

const CLOSE_DELAY_MS = 140;

/**
 * Desktop mega menu: one trigger per menu plus the plain links. Opens on mouse
 * hover or click, closes on Escape, outside click or leaving the menu.
 * `itemClassName` styles the triggers and links so each navbar keeps its look.
 */
export function DesktopMegaMenu({ itemClassName, gapClassName = "gap-7" }: { itemClassName: string; gapClassName?: string }) {
  const [open, setOpen] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number>();
  const openedByHover = useRef(false);
  const baseId = useId();

  const cancelClose = () => window.clearTimeout(closeTimer.current);
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setOpen(null), CLOSE_DELAY_MS);
  };
  const close = useCallback(() => {
    cancelClose();
    setOpen(null);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const trigger = rootRef.current?.querySelector<HTMLButtonElement>(`[data-menu="${open}"]`);
      close();
      trigger?.focus();
    };
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open, close]);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  const active = NAV_MENUS.find((m) => m.label === open);

  return (
    <div ref={rootRef} className={`relative flex items-center ${gapClassName}`} onPointerLeave={(e) => e.pointerType === "mouse" && scheduleClose()}>
      {NAV_MENUS.map((menu) => {
        const isOpen = open === menu.label;
        return (
          <button
            key={menu.label}
            type="button"
            data-menu={menu.label}
            aria-expanded={isOpen}
            aria-controls={`${baseId}-panel`}
            onPointerEnter={(e) => {
              if (e.pointerType !== "mouse") return;
              cancelClose();
              if (!isOpen) openedByHover.current = true;
              setOpen(menu.label);
            }}
            onClick={() => {
              // A click on a menu the mouse just opened keeps it open.
              if (isOpen && openedByHover.current) openedByHover.current = false;
              else {
                openedByHover.current = false;
                setOpen(isOpen ? null : menu.label);
              }
            }}
            className={`inline-flex items-center gap-1 ${itemClassName}`}
          >
            {menu.label}
            <ChevronDown className={`w-3.5 h-3.5 opacity-60 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} aria-hidden />
          </button>
        );
      })}
      {NAV_LINKS.map((link) => (
        <a key={link.href} href={link.href} className={itemClassName} onPointerEnter={() => scheduleClose()}>
          {link.label}
        </a>
      ))}

      <AnimatePresence>
        {active && (
          <motion.div
            key="panel"
            id={`${baseId}-panel`}
            className="absolute left-1/2 top-full z-[80] pt-4"
            style={{ x: "-50%" }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            onPointerEnter={cancelClose}
          >
            <MenuPanel menu={active} onNavigate={close} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuPanel({ menu, onNavigate }: { menu: NavMenu; onNavigate: () => void }) {
  const wide = menu.groups.length > 1;
  return (
    <div
      role="region"
      aria-label={menu.label}
      className={`grid gap-2 rounded-3xl bg-white p-2 text-left whitespace-normal shadow-2xl shadow-black/10 ring-1 ring-black/5 ${
        wide ? "w-[min(980px,calc(100vw-48px))] grid-cols-[1.25fr_1.1fr_0.9fr_230px]" : "w-[min(640px,calc(100vw-48px))] grid-cols-[1fr_230px]"
      }`}
    >
      {menu.groups.map((group) => (
        <GroupColumn key={group.title} group={group} onNavigate={onNavigate} />
      ))}
      <a
        href={menu.feature.href}
        onClick={onNavigate}
        className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-[#0a0a0a] p-5 text-white"
      >
        <div>
          <span className="inline-flex rounded-full bg-[#C8FF00] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#0a0a0a]">
            {menu.feature.eyebrow}
          </span>
          <p className="mt-4 text-[17px] font-medium leading-snug tracking-tight">{menu.feature.title}</p>
          <p className="mt-2 text-[13px] leading-relaxed text-white/65">{menu.feature.description}</p>
        </div>
        <span className="mt-6 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#C8FF00]">
          {menu.feature.cta}
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </span>
      </a>
    </div>
  );
}

function GroupColumn({ group, onNavigate }: { group: NavGroup; onNavigate: () => void }) {
  return (
    <div className="p-3">
      <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">{group.title}</p>
      <ul className="flex flex-col">
        {group.links.map((link) => {
          const Icon = link.icon;
          return (
            <li key={link.href}>
              <a
                href={link.href}
                onClick={onNavigate}
                className="flex items-start gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-neutral-100 focus-visible:bg-neutral-100 focus-visible:outline-none"
              >
                {Icon && (
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-[#0a0a0a]">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block text-[14px] font-medium leading-snug text-[#0a0a0a]">{link.label}</span>
                  {link.description && (
                    <span className="mt-0.5 block text-[12.5px] leading-snug text-neutral-500">{link.description}</span>
                  )}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
      {group.more && (
        <a
          href={group.more.href}
          onClick={onNavigate}
          className="mt-1 inline-flex items-center gap-1 px-2 py-1.5 text-[13px] font-semibold text-[#0a0a0a] hover:underline"
        >
          {group.more.label}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </a>
      )}
    </div>
  );
}

/** Phone and tablet menu: each mega menu becomes a section that expands in place. */
export function MobileMenuLinks({ onNavigate }: { onNavigate: () => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const baseId = useId();
  return (
    <div className="flex flex-col">
      {NAV_MENUS.map((menu) => {
        const isOpen = open === menu.label;
        const panelId = `${baseId}-${menu.label.replace(/\W+/g, "-")}`;
        return (
          <div key={menu.label} className="border-b border-neutral-100 last:border-0">
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpen(isOpen ? null : menu.label)}
              className="flex w-full items-center justify-between py-3 text-sm font-medium text-[#0a0a0a]"
            >
              {menu.label}
              <ChevronDown className={`h-4 w-4 text-neutral-400 transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden />
            </button>
            {isOpen && (
              <div id={panelId} className="pb-3">
                {menu.groups.map((group) => (
                  <div key={group.title} className="mb-2">
                    <p className="pb-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">{group.title}</p>
                    {[...group.links, ...(group.more ? [group.more] : [])].map((link) => (
                      <a
                        key={link.href}
                        href={link.href}
                        onClick={onNavigate}
                        className="block py-1.5 text-[13px] text-neutral-700 hover:text-[#0a0a0a]"
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
      {NAV_LINKS.map((link) => (
        <a key={link.href} href={link.href} onClick={onNavigate} className="py-3 text-sm font-medium text-[#0a0a0a]">
          {link.label}
        </a>
      ))}
    </div>
  );
}

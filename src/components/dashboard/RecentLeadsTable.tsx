import { motion } from "framer-motion";
import { Search, SlidersHorizontal, ChevronDown, ExternalLink, Flame, Linkedin, Check } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Lead {
  name: string;
  title?: string | null;
  company?: string | null;
  score?: number;
  relevance_tier?: string;
  linkedin_url?: string | null;
  signal?: string | null;
  signal_post_url?: string | null;
}

const tierChip: Record<string, string> = {
  hot: "bg-orange-50 text-orange-600",
  warm: "bg-amber-50 text-amber-700",
  cold: "bg-sky-50 text-sky-600",
};

const avatarPalette = [
  "bg-blue-50 text-blue-600",
  "bg-indigo-50 text-indigo-600",
  "bg-emerald-50 text-emerald-600",
  "bg-amber-50 text-amber-700",
  "bg-rose-50 text-rose-600",
  "bg-violet-50 text-violet-600",
];

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

type TierFilter = "all" | "hot" | "warm" | "cold";
type ExtraFilter = "all" | "linkedin" | "signal" | "high_score";

const TIER_OPTIONS: { value: TierFilter; label: string }[] = [
  { value: "all", label: "All tiers" },
  { value: "hot", label: "Hot" },
  { value: "warm", label: "Warm" },
  { value: "cold", label: "Cold" },
];

const EXTRA_OPTIONS: { value: ExtraFilter; label: string }[] = [
  { value: "all", label: "All leads" },
  { value: "linkedin", label: "Has LinkedIn" },
  { value: "signal", label: "Has signal" },
  { value: "high_score", label: "Score ≥ 70" },
];

export function RecentLeadsTable({ leads, loading }: { leads: Lead[]; loading?: boolean }) {
  const [q, setQ] = useState("");
  const [tierFilter, setTierFilter] = useState<TierFilter>("all");
  const [extraFilter, setExtraFilter] = useState<ExtraFilter>("all");

  const filtered = leads.filter((l) => {
    const matchesQuery =
      !q ||
      l.name.toLowerCase().includes(q.toLowerCase()) ||
      (l.company ?? "").toLowerCase().includes(q.toLowerCase()) ||
      (l.title ?? "").toLowerCase().includes(q.toLowerCase());
    const tier = (l.relevance_tier ?? "warm").toLowerCase();
    const matchesTier = tierFilter === "all" || tier === tierFilter;
    const matchesExtra =
      extraFilter === "all" ||
      (extraFilter === "linkedin" && !!l.linkedin_url) ||
      (extraFilter === "signal" && !!l.signal) ||
      (extraFilter === "high_score" && (l.score ?? 0) >= 70);
    return matchesQuery && matchesTier && matchesExtra;
  });

  const currentTierLabel = TIER_OPTIONS.find((o) => o.value === tierFilter)?.label ?? "All tiers";
  const currentExtraLabel = EXTRA_OPTIONS.find((o) => o.value === extraFilter)?.label ?? "Filter";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl bg-white border border-[#F0F0F2] overflow-hidden"
    >
      <div className="flex items-center justify-between gap-3 px-6 pt-6 pb-4 flex-wrap">
        <div>
          <h3 className="text-[15px] font-semibold text-neutral-900 tracking-tight">Latest Leads</h3>
          <p className="text-[12.5px] text-neutral-500 mt-0.5">
            You have {leads.length} new opportunities this cycle.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search"
              className="w-[180px] rounded-full bg-[#F9F9FA] border border-[#F0F0F2] pl-8 pr-3 py-2 text-[12.5px] text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:bg-white focus:border-neutral-300 transition-colors"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center gap-1.5 text-[12px] font-medium text-neutral-700 bg-white border border-[#F0F0F2] rounded-full px-3 py-2 hover:bg-neutral-50 transition-colors">
                {extraFilter === "all" ? "Filter" : currentExtraLabel}
                <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[170px]">
              <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-neutral-400 font-medium">
                Refine
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {EXTRA_OPTIONS.map((opt) => (
                <DropdownMenuItem
                  key={opt.value}
                  onSelect={() => setExtraFilter(opt.value)}
                  className="text-[12px] flex items-center justify-between"
                >
                  {opt.label}
                  {opt.value === extraFilter && <Check className="w-3.5 h-3.5 text-neutral-500" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center gap-1.5 text-[12px] font-medium text-neutral-700 bg-white border border-[#F0F0F2] rounded-full px-3 py-2 hover:bg-neutral-50 transition-colors">
                {currentTierLabel}
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[150px]">
              {TIER_OPTIONS.map((opt) => (
                <DropdownMenuItem
                  key={opt.value}
                  onSelect={() => setTierFilter(opt.value)}
                  className="text-[12px] flex items-center justify-between capitalize"
                >
                  {opt.label}
                  {opt.value === tierFilter && <Check className="w-3.5 h-3.5 text-neutral-500" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-[0.12em] text-neutral-400 border-t border-[#F4F4F5] bg-[#FAFAFB]">
              <th className="font-medium px-6 py-3">Lead</th>
              <th className="font-medium px-4 py-3">Title</th>
              <th className="font-medium px-4 py-3">Company</th>
              <th className="font-medium px-4 py-3">Signal</th>
              <th className="font-medium px-4 py-3">Score</th>
              <th className="font-medium px-4 py-3">Tier</th>
              <th className="font-medium px-6 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-t border-[#F4F4F5]">
                  <td className="px-6 py-4"><div className="h-4 w-40 bg-neutral-100 rounded animate-pulse" /></td>
                  <td className="px-4 py-4"><div className="h-4 w-24 bg-neutral-100 rounded animate-pulse" /></td>
                  <td className="px-4 py-4"><div className="h-4 w-28 bg-neutral-100 rounded animate-pulse" /></td>
                  <td className="px-4 py-4"><div className="h-4 w-20 bg-neutral-100 rounded animate-pulse" /></td>
                  <td className="px-4 py-4"><div className="h-4 w-10 bg-neutral-100 rounded animate-pulse" /></td>
                  <td className="px-4 py-4"><div className="h-4 w-12 bg-neutral-100 rounded animate-pulse" /></td>
                  <td className="px-6 py-4" />
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-sm text-neutral-400">
                  No leads yet — launch a campaign to start filling this feed.
                </td>
              </tr>
            ) : (
              filtered.map((l, i) => {
                const av = avatarPalette[i % avatarPalette.length];
                const tier = (l.relevance_tier ?? "warm").toLowerCase();
                return (
                  <motion.tr
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: i * 0.04 }}
                    className="border-t border-[#F4F4F5] hover:bg-[#F9F9FA] transition-colors"
                  >
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 ${av}`}>
                          {initials(l.name)}
                        </span>
                        {l.linkedin_url ? (
                          <a
                            href={l.linkedin_url}
                            target="_blank"
                            rel="noreferrer"
                            className="font-medium text-sky-600 underline hover:text-sky-700 truncate"
                          >
                            {l.name}
                          </a>
                        ) : (
                          <span className="font-medium text-neutral-900 truncate">{l.name}</span>
                        )}
                        {l.linkedin_url && (
                          <a
                            href={l.linkedin_url}
                            target="_blank"
                            rel="noreferrer"
                            aria-label="Open LinkedIn profile"
                            className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-sky-50 text-sky-600 hover:bg-sky-100 transition-colors shrink-0"
                          >
                            <Linkedin className="w-3.5 h-3.5" fill="currentColor" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-neutral-600 truncate max-w-[180px]">{l.title ?? "—"}</td>
                    <td className="px-4 py-3.5 text-neutral-600 truncate max-w-[160px]">{l.company ?? "—"}</td>
                    <td className="px-4 py-3.5 truncate max-w-[160px]">
                      {l.signal_post_url ? (
                        <a
                          href={l.signal_post_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sky-600 underline hover:text-sky-700 truncate"
                        >
                          {l.signal ?? "View signal"}
                        </a>
                      ) : (
                        <span className="text-neutral-500 truncate">{l.signal ?? "—"}</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-0.5">
                        {(() => {
                          const count = tier === "hot" ? 3 : tier === "warm" ? 2 : 1;
                          return [0, 1, 2].map((i) => (
                            <Flame key={i} className={`w-4 h-4 ${i < count ? "text-orange-500" : "text-neutral-300/60"}`} fill={i < count ? "currentColor" : "none"} />
                          ));
                        })()}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize ${tierChip[tier] ?? tierChip.warm}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                        {tier}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      {l.linkedin_url && (
                        <a href={l.linkedin_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[12px] text-neutral-500 hover:text-neutral-900 transition-colors">
                          Open <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </td>
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

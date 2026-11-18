// Pieces shared by the checker's teaser, the example card and the full report.
import { AlertTriangle, CheckCircle2, HelpCircle, ShieldAlert } from "lucide-react";
import { EXPLANATIONS, type RiskLevel, type Signal, type SignalStatus } from "../../../supabase/functions/_shared/fake-profile";

export const LEVEL_LABEL: Record<RiskLevel, string> = { low: "Low risk", medium: "Medium risk", high: "High risk" };
const LEVEL_COLOR: Record<RiskLevel, string> = { low: "#16a34a", medium: "#d97706", high: "#dc2626" };
const LEVEL_BG: Record<RiskLevel, string> = { low: "bg-emerald-50 text-emerald-700", medium: "bg-amber-50 text-amber-800", high: "bg-rose-50 text-rose-700" };

/** Half-circle gauge, 0–100 "fake risk". Pure SVG, no animation library. */
export function RiskGauge({ score, level, lowConfidence, size = "md" }: { score: number; level: RiskLevel; lowConfidence?: boolean; size?: "sm" | "md" }) {
  const r = 80;
  const len = Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const filled = pct * len;
  // Needle tip on the arc.
  const a = Math.PI * (1 - pct);
  const nx = 100 + r * Math.cos(a);
  const ny = 100 - r * Math.sin(a);
  const arc = "M20 100 A80 80 0 0 1 180 100";
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 116" className={size === "sm" ? "w-[180px] h-auto" : "w-[230px] h-auto"} role="img" aria-label={`${LEVEL_LABEL[level]}, risk score ${score} out of 100`}>
        <defs>
          <linearGradient id="fpc-track" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#16a34a" stopOpacity="0.18" />
            <stop offset="0.5" stopColor="#d97706" stopOpacity="0.18" />
            <stop offset="1" stopColor="#dc2626" stopOpacity="0.18" />
          </linearGradient>
        </defs>
        <path d={arc} fill="none" stroke="url(#fpc-track)" strokeWidth="18" strokeLinecap="round" />
        <path d={arc} fill="none" stroke={LEVEL_COLOR[level]} strokeWidth="18" strokeLinecap="round" strokeDasharray={`${filled} ${len}`} />
        <circle cx={nx} cy={ny} r="7" fill="white" stroke={LEVEL_COLOR[level]} strokeWidth="4" />
        <text x="100" y="90" textAnchor="middle" fill="#0a0a0a" style={{ fontSize: 38, fontWeight: 700, letterSpacing: "-0.02em" }}>{score}</text>
        <text x="100" y="110" textAnchor="middle" fill="#737373" style={{ fontSize: 10.5, fontWeight: 500 }}>RISK SCORE / 100</text>
      </svg>
      <span className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${LEVEL_BG[level]}`}>
        <span className="h-2 w-2 rounded-full" style={{ background: LEVEL_COLOR[level] }} aria-hidden />
        {LEVEL_LABEL[level]}
      </span>
      {lowConfidence && (
        <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600">
          <HelpCircle className="w-3.5 h-3.5" aria-hidden /> Low confidence
        </span>
      )}
    </div>
  );
}

const STATUS_UI: Record<SignalStatus, { label: string; chip: string; bar: string; tile: string; Icon: typeof ShieldAlert }> = {
  red: { label: "Red flag", chip: "bg-rose-50 text-rose-700 ring-rose-200", bar: "bg-rose-500", tile: "bg-rose-50 text-rose-600", Icon: ShieldAlert },
  caution: { label: "Caution", chip: "bg-amber-50 text-amber-800 ring-amber-200", bar: "bg-amber-500", tile: "bg-amber-50 text-amber-600", Icon: AlertTriangle },
  fine: { label: "Looks fine", chip: "bg-emerald-50 text-emerald-700 ring-emerald-200", bar: "bg-emerald-500", tile: "bg-emerald-50 text-emerald-600", Icon: CheckCircle2 },
  unknown: { label: "Couldn't check", chip: "bg-neutral-50 text-neutral-500 ring-neutral-200", bar: "bg-neutral-300", tile: "bg-neutral-100 text-neutral-400", Icon: HelpCircle },
};

export function StatusChip({ status }: { status: SignalStatus }) {
  const { label, chip } = STATUS_UI[status];
  return <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${chip}`}>{label}</span>;
}

export const explain = (s: Signal) =>
  s.status === "unknown" ? "" : s.status === "fine" ? EXPLANATIONS[s.key].fine : EXPLANATIONS[s.key].flag;

/** One signal as a card row: status tile, title, explanation, what we saw, weight. */
export function SignalRow({ signal, showWeight = true, compact = false }: { signal: Signal; showWeight?: boolean; compact?: boolean }) {
  const ui = STATUS_UI[signal.status];
  const text = compact ? "" : explain(signal);
  return (
    <li className="relative flex gap-3.5 rounded-2xl border border-neutral-200 bg-white p-4 overflow-hidden">
      <span className={`absolute left-0 top-0 bottom-0 w-1 ${ui.bar}`} aria-hidden />
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${ui.tile}`}>
        <ui.Icon className="h-[18px] w-[18px]" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-semibold text-[15px] leading-snug text-neutral-900">{signal.title}</span>
          <StatusChip status={signal.status} />
          {showWeight && <span className="ml-auto text-[11px] font-medium text-neutral-500 tabular-nums">Weight {signal.weight}</span>}
        </div>
        {text && <p className="mt-1 text-sm text-neutral-600 leading-relaxed">{text}</p>}
        {signal.observed && (
          <p className="mt-2 rounded-lg bg-neutral-50 px-2.5 py-1.5 text-[13px] text-neutral-600">
            <span className="font-semibold text-neutral-800">What we saw:</span> {signal.observed}
          </p>
        )}
      </div>
    </li>
  );
}

export const DISCLAIMER =
  "This is an automated estimate from public signals. It can be wrong in both directions. It doesn't prove that anyone is fake, and it isn't an accusation.";

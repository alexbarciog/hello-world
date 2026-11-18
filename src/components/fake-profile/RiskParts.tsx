// Pieces shared by the checker's teaser and the full report.
import { AlertTriangle, CheckCircle2, HelpCircle, ShieldAlert } from "lucide-react";
import { EXPLANATIONS, type RiskLevel, type Signal, type SignalStatus } from "../../../supabase/functions/_shared/fake-profile";

export const LEVEL_LABEL: Record<RiskLevel, string> = { low: "Low risk", medium: "Medium risk", high: "High risk" };
const LEVEL_COLOR: Record<RiskLevel, string> = { low: "#16a34a", medium: "#d97706", high: "#dc2626" };

/** Half-circle gauge, 0–100 "fake risk". Pure SVG, no animation library. */
export function RiskGauge({ score, level, lowConfidence }: { score: number; level: RiskLevel; lowConfidence?: boolean }) {
  const r = 80;
  const len = Math.PI * r;
  const filled = (Math.max(0, Math.min(100, score)) / 100) * len;
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 112" className="w-[220px] h-auto" role="img" aria-label={`${LEVEL_LABEL[level]}, risk score ${score} out of 100`}>
        <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="#e5e7eb" strokeWidth="16" strokeLinecap="round" />
        <path
          d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke={LEVEL_COLOR[level]} strokeWidth="16" strokeLinecap="round"
          strokeDasharray={`${filled} ${len}`}
        />
        <text x="100" y="88" textAnchor="middle" className="fill-neutral-900" style={{ fontSize: 34, fontWeight: 700 }}>{score}</text>
        <text x="100" y="106" textAnchor="middle" className="fill-neutral-500" style={{ fontSize: 11 }}>risk score out of 100</text>
      </svg>
      <p className="mt-1 text-lg font-semibold" style={{ color: LEVEL_COLOR[level] }}>{LEVEL_LABEL[level]}</p>
      {lowConfidence && (
        <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600">
          <HelpCircle className="w-3.5 h-3.5" /> Low confidence
        </span>
      )}
    </div>
  );
}

const STATUS_UI: Record<SignalStatus, { label: string; cls: string; Icon: typeof ShieldAlert }> = {
  red: { label: "Red flag", cls: "bg-rose-50 text-rose-700 border-rose-200", Icon: ShieldAlert },
  caution: { label: "Caution", cls: "bg-amber-50 text-amber-800 border-amber-200", Icon: AlertTriangle },
  fine: { label: "Looks fine", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", Icon: CheckCircle2 },
  unknown: { label: "Couldn't check", cls: "bg-neutral-50 text-neutral-500 border-neutral-200", Icon: HelpCircle },
};

export function StatusChip({ status }: { status: SignalStatus }) {
  const { label, cls, Icon } = STATUS_UI[status];
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${cls}`}>
      <Icon className="w-3.5 h-3.5" aria-hidden /> {label}
    </span>
  );
}

export const explain = (s: Signal) =>
  s.status === "unknown" ? "" : s.status === "fine" ? EXPLANATIONS[s.key].fine : EXPLANATIONS[s.key].flag;

export function SignalRow({ signal, showWeight = true }: { signal: Signal; showWeight?: boolean }) {
  const text = explain(signal);
  return (
    <li className="py-4 flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <StatusChip status={signal.status} />
        <span className="font-semibold text-[15px] text-neutral-900">{signal.title}</span>
        {showWeight && <span className="ml-auto text-xs text-neutral-500 tabular-nums">weight {signal.weight}</span>}
      </div>
      {text && <p className="text-sm text-neutral-600 leading-relaxed">{text}</p>}
      {signal.observed && (
        <p className="text-sm text-neutral-500"><span className="font-medium text-neutral-700">What we saw:</span> {signal.observed}</p>
      )}
    </li>
  );
}

export const DISCLAIMER =
  "This is an automated estimate from public signals. It can be wrong in both directions. It doesn't prove that anyone is fake, and it isn't an accusation.";

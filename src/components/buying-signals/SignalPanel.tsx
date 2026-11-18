// The Buying Signal Finder's right-hand panel: an example before use, the
// progress while the lookup runs, and the report. The example posts are
// illustrative and labelled as such: no names, photos, companies, dates or
// engagement numbers. The only number shown is the live signal count, and only
// when the server returns one.
import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Check, Link2, Loader2, Mail, Radar } from "lucide-react";
import { toast } from "sonner";
import { saveToolLead } from "@/lib/freeTools";
import { capitalise, linkedInSearchUrl, readSignal, roleInitials } from "@/lib/signalText";

const AVATAR_TONES = [
  "bg-blue-100 text-blue-800",
  "bg-[hsl(var(--aeline-lime))]/50 text-[#0a0a0a]",
  "bg-violet-100 text-violet-800",
  "bg-amber-100 text-amber-900",
  "bg-emerald-100 text-emerald-800",
];

export function PanelShell({ children, label }: { children: React.ReactNode; label?: string }) {
  return (
    <div className="relative">
      <div className="absolute -inset-3 rounded-[36px] bg-gradient-to-br from-[hsl(var(--aeline-lime))]/40 via-white/0 to-[#3B82F6]/25 blur-xl" aria-hidden />
      <div className="relative rounded-[28px] border border-neutral-200 bg-white p-4 sm:p-6 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.35)]">
        {label && (
          <span className="absolute right-4 top-4 sm:right-6 sm:top-6 rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-600">{label}</span>
        )}
        {children}
      </div>
    </div>
  );
}

function Avatar({ role, i, size = "md" }: { role: string; i: number; size?: "sm" | "md" }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${AVATAR_TONES[i % AVATAR_TONES.length]} ${size === "sm" ? "h-6 w-6 text-[10px]" : "h-10 w-10 text-[13px]"}`}
      aria-hidden
    >
      {roleInitials(role)}
    </span>
  );
}

export function RolePill({ role, i }: { role: string; i: number }) {
  return (
    <li className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white py-1 pl-1 pr-3 text-[13px] font-medium text-neutral-800">
      <Avatar role={role} i={i} size="sm" />
      {role}
    </li>
  );
}

/** One illustrative phrasing, laid out like a LinkedIn post. */
export function PostCard({ text, role, i, compact = false }: { text: string; role: string; i: number; compact?: boolean }) {
  const r = readSignal(text);
  return (
    <li className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="flex items-start gap-3">
        <Avatar role={role} i={i} />
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold leading-snug text-neutral-900">{role}</p>
          <p className="text-[12px] text-neutral-500">Illustrative example</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#0a0a0a] px-2.5 py-1 text-[11px] font-semibold text-white">
          <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--aeline-lime))]" aria-hidden /> Buying signal
        </span>
      </div>
      <p className="mt-3 text-[15px] leading-relaxed text-neutral-900">
        {r.before}
        {r.cue && <mark className="rounded bg-[hsl(var(--aeline-lime))]/60 px-0.5 text-[#0a0a0a]">{r.cue}</mark>}
        {r.after}
      </p>
      {!compact && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-neutral-100 pt-3 text-[12px]">
          <span className="font-medium text-neutral-600">{r.kind}</span>
          <a
            href={linkedInSearchUrl(text)} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-[#2563EB] hover:underline"
          >
            Search this on LinkedIn <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </div>
      )}
    </li>
  );
}

export function ExampleCard({ name, phrasings, roles }: { name: string; phrasings: string[]; roles: string[] }) {
  return (
    <PanelShell label="Example">
      <p className="text-[13px] font-semibold text-neutral-600">What you'll see</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900">{capitalise(name)}</p>
      <div className="mt-4 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-4 text-[13px] leading-relaxed text-neutral-600">
        <span className="font-semibold text-neutral-900">Signal count.</span> Shown when Intentsly has seen 10 or more matching signals in the last 30 days.
      </div>
      <ul className="mt-4 flex flex-wrap gap-2" aria-label="Roles">
        {roles.slice(0, 3).map((r, i) => <RolePill key={r} role={r} i={i} />)}
      </ul>
      <ul className="mt-4 space-y-3">
        {phrasings.slice(0, 2).map((p, i) => <PostCard key={p} text={p} role={roles[i % roles.length] ?? "Buyer"} i={i} compact />)}
      </ul>
      <p className="mt-4 text-center text-[12px] text-neutral-500">Illustration. Your report depends on the service you type.</p>
    </PanelShell>
  );
}

export const STAGES = [
  "Reading what you sell",
  "Writing example buyer phrasings",
  "Matching the roles that post them",
  "Counting recent signals",
];

export function Progress({ stage }: { stage: number }) {
  const pct = Math.min(100, Math.round((Math.min(stage, STAGES.length) / STAGES.length) * 100));
  return (
    <PanelShell>
      <p className="text-[13px] font-semibold text-neutral-600">Building your signal report</p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-100" aria-hidden>
        <div className="h-full rounded-full bg-[#0a0a0a] transition-[width] duration-700" style={{ width: `${Math.max(8, pct)}%` }} />
      </div>
      <ol className="mt-6 space-y-3">
        {STAGES.map((label, i) => {
          const done = i < stage;
          const active = i === stage;
          return (
            <li key={label} className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-[15px] transition-colors ${done ? "border-emerald-200 bg-emerald-50 text-neutral-900" : active ? "border-neutral-300 bg-white text-neutral-900" : "border-neutral-100 text-neutral-500"}`}>
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${done ? "bg-emerald-600 text-white" : "border border-neutral-300"}`}>
                {done ? <Check className="h-3.5 w-3.5" aria-hidden /> : active ? <Loader2 className="h-3.5 w-3.5 animate-spin text-neutral-700" aria-hidden /> : null}
              </span>
              {label}
            </li>
          );
        })}
      </ol>
      {/* Skeleton of the report that is on its way. */}
      <div className="mt-6 space-y-3" aria-hidden>
        {[0, 1].map((i) => (
          <div key={i} className="rounded-2xl border border-neutral-100 p-4">
            <div className="flex items-center gap-3">
              <span className="h-10 w-10 rounded-full bg-neutral-100 animate-pulse" />
              <span className="h-3 w-32 rounded-full bg-neutral-100 animate-pulse" />
            </div>
            <span className="mt-4 block h-3 w-full rounded-full bg-neutral-100 animate-pulse" />
            <span className="mt-2 block h-3 w-2/3 rounded-full bg-neutral-100 animate-pulse" />
          </div>
        ))}
      </div>
    </PanelShell>
  );
}

export interface ReportProps {
  service: string;
  phrasings: string[];
  /** Roles shown as pills: real, anonymised ones from the stats when there are any. */
  roles: string[];
  realRoles: boolean;
  /** Typical roles, used to label the illustrative posts (never the real ones). */
  postRoles: string[];
  count: number | null | undefined;
  sharePath: string;
  tool: "buying_signal_finder";
}

export function SignalReport({ service, phrasings, roles, realRoles, postRoles, count, sharePath, tool }: ReportProps) {
  return (
    <PanelShell>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-600">
            <span className="relative flex h-2 w-2" aria-hidden>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Signal report
          </p>
          <p className="mt-1 text-2xl sm:text-[28px] font-semibold tracking-tight leading-tight text-neutral-900 break-words">{capitalise(service)}</p>
        </div>
        <ShareButton text={`How people ask for ${service} on LinkedIn:`} path={sharePath} />
      </div>

      {count != null && (
        <div className="mt-5 flex items-center gap-4 rounded-2xl bg-[#0a0a0a] p-4 sm:p-5 text-white">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[hsl(var(--aeline-lime))]"><Radar className="h-5 w-5" aria-hidden /></span>
          <div className="min-w-0">
            <p className="text-[32px] font-semibold leading-none tracking-tight tabular-nums text-[hsl(var(--aeline-lime))]">{count}</p>
            <p className="mt-1.5 text-[13px] leading-snug text-neutral-300">
              matching signals Intentsly saw for {service} in the last 30 days, across customers' agents. Counted without names or post text.
            </p>
          </div>
        </div>
      )}

      {roles.length > 0 && (
        <div className="mt-6">
          <h2 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-600">{realRoles ? "Roles behind recent signals" : "Roles that typically post this"}</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {roles.map((r, i) => <RolePill key={r} role={r} i={i} />)}
          </ul>
        </div>
      )}

      <div className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-600">How people ask for {service}</h2>
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-900 ring-1 ring-inset ring-amber-200">Illustrative examples</span>
        </div>
        <p className="mt-1.5 text-[13px] text-neutral-600">Not real posts. Use the wording as LinkedIn search terms.</p>
        <ul className="mt-3 space-y-3">
          {phrasings.map((p, i) => <PostCard key={p} text={p} role={postRoles[i % postRoles.length] ?? "Buyer"} i={i} />)}
        </ul>
      </div>

      <div className="mt-6"><EmailCapture tool={tool} service={service} /></div>

      <div className="mt-4 rounded-2xl bg-[#1A1A2E] p-5 text-white">
        <p className="text-[15px] leading-relaxed text-neutral-200">
          These are the patterns. Intentsly finds the real people posting them on LinkedIn and scores each one against your ideal customer.
        </p>
        <Link
          to="/try-ai"
          className="mt-4 inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-[hsl(var(--aeline-lime))] px-5 py-3 text-[15px] font-semibold text-[#0a0a0a] hover:brightness-95"
        >
          See who's asking, free <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </PanelShell>
  );
}

/** Same behaviour as the shared email capture, styled for the report. Consent is explicit. */
function EmailCapture({ tool, service }: { tool: "buying_signal_finder"; service: string }) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) {
      toast.error("Please tick the box so we can email you.");
      return;
    }
    setBusy(true);
    const result = await saveToolLead({ email, tool, input_summary: service, input_text: service, consent_marketing: true });
    setBusy(false);
    if (result.ok) setDone(true);
    else toast.error(result.error);
  };

  if (done) {
    return (
      <p className="flex w-full items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
        <Check className="h-4 w-4 shrink-0" aria-hidden /> Saved. Watch your inbox.
      </p>
    );
  }
  return (
    <form onSubmit={submit} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
      <p className="inline-flex items-center gap-2 text-[14px] font-semibold text-neutral-900">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white ring-1 ring-neutral-200"><Mail className="h-3.5 w-3.5" aria-hidden /></span>
        Get the {service} signal report by email
      </p>
      <div className="mt-3 flex flex-col sm:flex-row gap-2">
        <label htmlFor="bsf-email" className="sr-only">Your email</label>
        <input
          id="bsf-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com"
          className="h-11 w-full min-w-0 shrink-0 sm:shrink sm:flex-1 rounded-xl border border-neutral-200 bg-white px-3.5 text-[15px] placeholder:text-neutral-500 focus:outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/10"
        />
        <button type="submit" disabled={busy} className="h-11 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#0a0a0a] px-4 text-[14px] font-semibold text-white hover:bg-neutral-800 disabled:opacity-60">
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Send it to me
        </button>
      </div>
      <label className="mt-3 flex items-start gap-2 text-[12px] leading-snug text-neutral-600">
        <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-[#0a0a0a]" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        Email me this and up to two related tips from Intentsly. Unsubscribe any time.
      </label>
    </form>
  );
}

function ShareButton({ text, path }: { text: string; path: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${text} https://intentsly.com${path}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy. Please copy the link from your address bar.");
    }
  };
  return (
    <button
      type="button" onClick={copy}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[13px] font-semibold text-neutral-800 hover:bg-neutral-50"
    >
      {copied ? <Check className="h-4 w-4 text-emerald-600" aria-hidden /> : <Link2 className="h-4 w-4" aria-hidden />}
      {copied ? "Copied" : "Share"}
      <span className="sr-only">{copied ? "" : ": copy a link to this report"}</span>
    </button>
  );
}

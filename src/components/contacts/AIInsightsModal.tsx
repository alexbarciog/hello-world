import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  X, BrainCircuit, Sparkles, Zap, Mail, MessageSquare, Check, RefreshCw,
  ExternalLink, Copy, Info, Linkedin,
} from "lucide-react";
import { Contact, avatarColor, getInitials } from "@/components/contacts/types";

interface Props {
  contact: Contact;
  insights: any | null;
  insightsLoading: boolean;
  onClose: () => void;
}

type Tab = "intent" | "personality";

interface Personality {
  disc_type: string;
  disc_label: string;
  primary_traits: string[];
  communication_style: string;
  how_to_approach: string[];
  what_energizes: string[];
  what_to_avoid: string[];
  email_tips: string[];
  best_hook: string;
  confidence: "high" | "medium" | "low";
}

export function AIInsightsModal({ contact, insights, insightsLoading, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("intent");
  const [personality, setPersonality] = useState<Personality | null>(null);
  const [personalityLoading, setPersonalityLoading] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  // Esc to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  // Fetch personality (uses cache)
  const fetchPersonality = async (force = false) => {
    setPersonalityLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-personality-prediction", {
        body: {
          contactId: contact.id,
          name: [contact.first_name, contact.last_name].filter(Boolean).join(" "),
          headline: contact.title || "",
          postText: contact.signal || "",
          jobTitle: contact.title || "",
          company: contact.company || "",
          force,
        },
      });
      if (error) throw error;
      if (data?.prediction) {
        setPersonality(data.prediction);
        setGeneratedAt(data.generated_at || null);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to load personality");
    } finally {
      setPersonalityLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonality(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contact.id]);

  const fullName = [contact.first_name, contact.last_name].filter(Boolean).join(" ");
  const canRegenerate = generatedAt
    ? (Date.now() - new Date(generatedAt).getTime()) > 7 * 24 * 60 * 60 * 1000
    : false;

  const confidenceColor = personality?.confidence === "high"
    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
    : personality?.confidence === "medium"
      ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
      : "bg-rose-500/10 text-rose-600 border-rose-500/20";

  const copyHook = () => {
    if (!personality?.best_hook) return;
    navigator.clipboard.writeText(personality.best_hook);
    toast.success("Copied to clipboard");
  };

  const modal = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full md:max-w-[720px] h-screen md:h-auto md:max-h-[90vh] bg-card md:rounded-2xl border-0 md:border md:border-border shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header with gradient */}
        <div className="relative shrink-0 border-b border-border bg-gradient-to-b from-violet-500/10 via-violet-500/5 to-transparent">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 rounded-lg hover:bg-foreground/5 text-muted-foreground hover:text-foreground transition-colors z-10"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="px-6 pt-6 pb-4 flex items-start gap-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-base font-bold text-white shrink-0 ${avatarColor(contact.first_name + (contact.last_name || ""))}`}>
              {getInitials(contact)}
            </div>
            <div className="min-w-0 flex-1 pr-8">
              <h2 className="text-lg font-semibold text-foreground truncate">{fullName}</h2>
              <p className="text-sm text-muted-foreground truncate">{contact.title || "—"}{contact.company ? ` · ${contact.company}` : ""}</p>
              <p className="text-xs text-violet-600 mt-1 font-medium flex items-center gap-1">
                <BrainCircuit className="w-3 h-3" /> AI Insights Report
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-6 flex items-center gap-1">
            {[
              { key: "intent" as const, label: "Intent Analysis" },
              { key: "personality" as const, label: "Personality" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                  tab === t.key
                    ? "text-foreground border-violet-500"
                    : "text-muted-foreground border-transparent hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {tab === "intent" ? (
            <IntentTab insights={insights} loading={insightsLoading} />
          ) : (
            <PersonalityTab
              personality={personality}
              loading={personalityLoading}
              confidenceColor={confidenceColor}
              onCopyHook={copyHook}
              onRegenerate={() => fetchPersonality(true)}
              canRegenerate={canRegenerate}
            />
          )}
        </div>

        {/* Sticky footer */}
        <div className="shrink-0 border-t border-border p-4 bg-card">
          <a
            href={contact.linkedin_url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center justify-center gap-2 w-full h-11 rounded-xl font-semibold text-sm transition-all ${
              contact.linkedin_url
                ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:opacity-90 shadow-lg shadow-violet-500/20"
                : "bg-muted text-muted-foreground cursor-not-allowed pointer-events-none"
            }`}
          >
            <Linkedin className="w-4 h-4" />
            Reach out on LinkedIn
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

/* ─── Intent Tab ─── */
function IntentTab({ insights, loading }: { insights: any; loading: boolean }) {
  if (loading || !insights) {
    return (
      <div className="space-y-3">
        <div className="h-16 bg-muted/50 rounded-xl animate-pulse" />
        <div className="h-12 bg-muted/50 rounded-xl animate-pulse" />
        <div className="h-12 bg-muted/50 rounded-xl animate-pulse" />
        <div className="h-20 bg-muted/50 rounded-xl animate-pulse" />
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {insights.summary && (
        <div className="rounded-xl border border-border bg-background/40 p-4">
          <p className="text-xs font-semibold text-violet-600 mb-1.5 uppercase tracking-wide">Summary</p>
          <p className="text-sm text-foreground leading-relaxed">{insights.summary}</p>
        </div>
      )}
      {(insights.insights || []).length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Key Insights</p>
          {insights.insights.map((ins: any, idx: number) => (
            <div key={idx} className="flex items-start gap-3 rounded-xl border border-border bg-background/40 p-3">
              <span className="text-base shrink-0">{ins.icon}</span>
              <p className="text-sm text-foreground leading-relaxed">{ins.text}</p>
            </div>
          ))}
        </div>
      )}
      {insights.suggested_action && (
        <div className="rounded-xl border-l-4 border-l-violet-500 border-y border-r border-border bg-violet-500/5 p-4">
          <p className="text-xs font-semibold text-violet-600 mb-1.5 uppercase tracking-wide">Suggested Action</p>
          <p className="text-sm text-foreground leading-relaxed">{insights.suggested_action}</p>
        </div>
      )}
    </div>
  );
}

/* ─── Personality Tab ─── */
function PersonalityTab({
  personality, loading, confidenceColor, onCopyHook, onRegenerate, canRegenerate,
}: {
  personality: Personality | null;
  loading: boolean;
  confidenceColor: string;
  onCopyHook: () => void;
  onRegenerate: () => void;
  canRegenerate: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-muted/50 rounded-2xl animate-pulse" />
        <div className="h-20 bg-muted/50 rounded-xl animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-32 bg-muted/50 rounded-xl animate-pulse" />
          <div className="h-32 bg-muted/50 rounded-xl animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="h-28 bg-muted/50 rounded-xl animate-pulse" />
          <div className="h-28 bg-muted/50 rounded-xl animate-pulse" />
          <div className="h-28 bg-muted/50 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }
  if (!personality) {
    return (
      <div className="py-12 text-center">
        <Sparkles className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No personality data available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Section header with regenerate */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-500" />
          <h3 className="text-sm font-semibold text-foreground">Personality Prediction</h3>
        </div>
        {canRegenerate && (
          <button
            onClick={onRegenerate}
            className="text-xs font-medium text-muted-foreground hover:text-violet-600 flex items-center gap-1 transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Regenerate
          </button>
        )}
      </div>

      {/* DISC Hero badge */}
      <div className="text-center py-5 rounded-2xl bg-gradient-to-br from-violet-500/10 via-indigo-500/5 to-transparent border border-violet-500/15">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white text-2xl font-bold shadow-lg shadow-violet-500/30 mb-3">
          {personality.disc_type}
        </div>
        <h4 className="text-xl font-semibold text-foreground">{personality.disc_label}</h4>
        <div className="flex items-center justify-center gap-2 flex-wrap mt-3 px-4">
          {personality.primary_traits.map((t, i) => (
            <span key={i} className="text-xs font-medium px-3 py-1 rounded-full border border-violet-500/30 text-violet-600 bg-violet-500/5">
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Communication style */}
      <div className="rounded-xl border-l-4 border-l-violet-500 border-y border-r border-border bg-violet-500/5 p-4">
        <p className="text-xs font-semibold text-violet-600 mb-1.5 uppercase tracking-wide">How to communicate</p>
        <p className="text-sm text-foreground leading-relaxed">{personality.communication_style}</p>
      </div>

      {/* Do / Don't columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-background/40 p-4">
          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" /> Do
          </p>
          <ul className="space-y-2">
            {personality.how_to_approach.map((it, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span className="leading-snug">{it}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-border bg-background/40 p-4">
          <p className="text-xs font-semibold text-rose-600 uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
            <X className="w-3.5 h-3.5" /> Don't
          </p>
          <ul className="space-y-2">
            {personality.what_to_avoid.map((it, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <X className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                <span className="leading-snug">{it}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Three info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <InfoCard icon={<Zap className="w-3.5 h-3.5" />} title="What energizes them">
          <ul className="space-y-1.5">
            {personality.what_energizes.map((it, i) => (
              <li key={i} className="text-xs text-foreground/80 leading-snug">• {it}</li>
            ))}
          </ul>
        </InfoCard>
        <InfoCard icon={<Mail className="w-3.5 h-3.5" />} title="Email tips">
          <ul className="space-y-1.5">
            {personality.email_tips.map((it, i) => (
              <li key={i} className="text-xs text-foreground/80 leading-snug">• {it}</li>
            ))}
          </ul>
        </InfoCard>
        <InfoCard
          icon={<MessageSquare className="w-3.5 h-3.5" />}
          title="Best opening line"
          action={
            <button onClick={onCopyHook} className="text-muted-foreground hover:text-violet-600 transition-colors" aria-label="Copy">
              <Copy className="w-3 h-3" />
            </button>
          }
        >
          <p className="text-xs italic text-foreground/80 leading-relaxed">"{personality.best_hook}"</p>
        </InfoCard>
      </div>

      {/* Confidence pill */}
      <div className="flex items-center justify-center gap-2 pt-1">
        <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full border ${confidenceColor}`}>
          Prediction confidence: {personality.confidence.charAt(0).toUpperCase() + personality.confidence.slice(1)}
        </span>
        <span className="group relative">
          <Info className="w-3 h-3 text-muted-foreground cursor-help" />
          <span className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-56 p-2 bg-popover border border-border rounded-lg shadow-lg text-[10px] text-foreground z-10">
            Based on available LinkedIn data. More data = higher accuracy.
          </span>
        </span>
      </div>
    </div>
  );
}

function InfoCard({
  icon, title, action, children,
}: { icon: React.ReactNode; title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-background/40 p-3.5 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-semibold text-violet-600 uppercase tracking-wide flex items-center gap-1.5">
          {icon} {title}
        </p>
        {action}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { ArrowRight, Loader2, Package, Target, Pencil } from "lucide-react";

type Props = {
  companyName: string;
  description: string;
  services: string[];
  painPoints: string[];
  onCompanyNameChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onContinue: () => Promise<void> | void;
  submitting: boolean;
};

export function Step2Preview({
  companyName,
  description,
  services,
  painPoints,
  onCompanyNameChange,
  onDescriptionChange,
  onContinue,
  submitting,
}: Props) {
  const [editingHeader, setEditingHeader] = useState(false);

  return (
    <div className="w-full animate-fade-in">
      {/* Company header card */}
      <div
        className="rounded-2xl p-5 mb-4"
        style={{
          background: "hsl(220 14% 97%)",
          border: "1px solid hsl(220 14% 92%)",
        }}
      >
        {editingHeader ? (
          <div className="space-y-3">
            <Input
              value={companyName}
              onChange={(e) => onCompanyNameChange(e.target.value)}
              placeholder="Company name"
              className="h-10 rounded-lg text-sm font-semibold"
            />
            <textarea
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="One-line description"
              rows={2}
              className="flex w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <button
              type="button"
              onClick={() => setEditingHeader(false)}
              className="text-xs font-medium text-primary hover:underline"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-foreground truncate">
                {companyName || "Your company"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {description || "Add a short description"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditingHeader(true)}
              className="p-2 rounded-lg text-muted-foreground hover:bg-background hover:text-foreground transition-colors shrink-0"
              aria-label="Edit company info"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Bento blocks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        {/* Services */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: "hsl(220 90% 56% / 0.05)",
            border: "1px solid hsl(220 90% 56% / 0.15)",
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "hsl(220 90% 56%)", color: "hsl(0 0% 100%)" }}
            >
              <Package className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">What you sell</h3>
          </div>
          <ul className="space-y-2">
            {services.length === 0 ? (
              <li className="text-xs text-muted-foreground italic">No services detected</li>
            ) : (
              services.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <span
                    className="w-1.5 h-1.5 rounded-full mt-2 shrink-0"
                    style={{ background: "hsl(220 90% 56%)" }}
                  />
                  <span className="leading-snug">{s}</span>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Pain points */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: "hsl(20 90% 56% / 0.05)",
            border: "1px solid hsl(20 90% 56% / 0.15)",
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "hsl(20 90% 56%)", color: "hsl(0 0% 100%)" }}
            >
              <Target className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Buyer pain points</h3>
          </div>
          <ul className="space-y-2">
            {painPoints.length === 0 ? (
              <li className="text-xs text-muted-foreground italic">No pain points detected</li>
            ) : (
              painPoints.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <span
                    className="w-1.5 h-1.5 rounded-full mt-2 shrink-0"
                    style={{ background: "hsl(20 90% 56%)" }}
                  />
                  <span className="leading-snug">{p}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={onContinue}
        disabled={submitting || !companyName}
        className="w-full h-14 rounded-2xl text-base font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        style={{
          background: submitting
            ? "hsl(220 14% 90%)"
            : "linear-gradient(135deg, #0057bd 0%, #4647d3 100%)",
          color: submitting ? "hsl(var(--muted-foreground))" : "hsl(0 0% 100%)",
          boxShadow: submitting ? "none" : "0 4px 14px rgba(0, 87, 189, 0.3)",
        }}
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Setting things up…
          </>
        ) : (
          <>
            Get Buyers
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      <p className="text-center text-xs text-muted-foreground mt-3">
        You can edit everything later in settings
      </p>
    </div>
  );
}

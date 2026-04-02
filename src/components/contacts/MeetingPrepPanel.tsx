import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Sparkles, Building2, User, MessageSquare, Shield, ListChecks, Loader2,
} from "lucide-react";

interface MeetingPrepPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meeting: {
    id: string;
    contact_id: string;
    contact_name: string;
    scheduled_at: string;
    prep_research: any;
  } | null;
  onUpdated?: () => void;
}

export function MeetingPrepPanel({ open, onOpenChange, meeting, onUpdated }: MeetingPrepPanelProps) {
  const [generating, setGenerating] = useState(false);
  const [research, setResearch] = useState<any>(meeting?.prep_research || null);

  const handleGenerate = async () => {
    if (!meeting) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-meeting-prep", {
        body: { contactId: meeting.contact_id, meetingId: meeting.id },
      });
      if (error) throw error;
      if (data?.research) {
        setResearch(data.research);
        toast.success("Meeting prep generated!");
        onUpdated?.();
      } else {
        throw new Error("No research data returned");
      }
    } catch (err: any) {
      console.error("Generate prep error:", err);
      toast.error(err.message || "Failed to generate meeting prep");
    } finally {
      setGenerating(false);
    }
  };

  // Sync research when meeting changes
  if (meeting?.prep_research && !research) {
    setResearch(meeting.prep_research);
  }

  const r = research;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setResearch(null); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Meeting Prep — {meeting?.contact_name}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {meeting?.scheduled_at ? new Date(meeting.scheduled_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : ""}
          </p>
        </DialogHeader>

        {!r ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">Generate AI-Powered Meeting Insights</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Our AI will research the lead, their company, and your conversation history to prepare you for the meeting.
              </p>
            </div>
            <Button onClick={handleGenerate} disabled={generating} className="gap-2">
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {generating ? "Generating..." : "Generate Insights"}
            </Button>
          </div>
        ) : (
          <div className="space-y-5 py-2">
            {/* Regenerate button */}
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={handleGenerate} disabled={generating} className="gap-1.5 text-xs">
                {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Regenerate
              </Button>
            </div>

            {/* Company Summary */}
            {r.company_summary && (
              <Section icon={Building2} title="Company Overview" color="text-blue-500">
                <p className="text-sm text-foreground leading-relaxed">{r.company_summary}</p>
              </Section>
            )}

            {/* Lead Bio */}
            {r.lead_bio && (
              <Section icon={User} title="Lead Background" color="text-violet-500">
                <p className="text-sm text-foreground leading-relaxed">{r.lead_bio}</p>
              </Section>
            )}

            {/* Conversation Summary */}
            {r.conversation_summary && (
              <Section icon={MessageSquare} title="Conversation Summary" color="text-emerald-500">
                <p className="text-sm text-foreground leading-relaxed">{r.conversation_summary}</p>
              </Section>
            )}

            {/* Talking Points */}
            {r.talking_points?.length > 0 && (
              <Section icon={ListChecks} title="Talking Points" color="text-amber-500">
                <ul className="space-y-2">
                  {r.talking_points.map((tp: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      {tp}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {/* Potential Objections */}
            {r.potential_objections?.length > 0 && (
              <Section icon={Shield} title="Potential Objections" color="text-red-500">
                <div className="space-y-3">
                  {r.potential_objections.map((obj: any, i: number) => (
                    <div key={i} className="rounded-lg border border-border p-3 space-y-1.5">
                      <p className="text-sm font-semibold text-destructive">❝ {typeof obj === 'string' ? obj : obj.objection}</p>
                      {typeof obj !== 'string' && obj.rebuttal && (
                        <p className="text-sm text-muted-foreground">→ {obj.rebuttal}</p>
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Recommended Agenda */}
            {r.recommended_agenda?.length > 0 && (
              <Section icon={ListChecks} title="Recommended Agenda" color="text-primary">
                <ol className="space-y-1.5">
                  {r.recommended_agenda.map((item: string, i: number) => (
                    <li key={i} className="text-sm text-foreground flex items-start gap-2">
                      <span className="text-muted-foreground font-mono text-xs mt-0.5">{i + 1}.</span>
                      {item}
                    </li>
                  ))}
                </ol>
              </Section>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Section({ icon: Icon, title, color, children }: { icon: any; title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${color}`} />
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );
}

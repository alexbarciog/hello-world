import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Flame, ChevronRight } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (spikeId: string) => void;
}

const TONES = [
  { v: "curious_peer", label: "Curious peer" },
  { v: "hot_take", label: "Hot take" },
  { v: "supportive", label: "Supportive" },
  { v: "playful", label: "Playful" },
];

function defaultDateTime() {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  d.setMinutes(0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function ScheduleSpikeWizard({ open, onOpenChange, onCreated }: Props) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [scheduledFor, setScheduledFor] = useState(defaultDateTime);
  const [targetCount, setTargetCount] = useState(10);
  const [windowMin, setWindowMin] = useState(25);
  const [spacingMin, setSpacingMin] = useState(120);
  const [spacingMax, setSpacingMax] = useState(180);
  const [keywords, setKeywords] = useState("");
  const [recency, setRecency] = useState("past-24h");
  const [tone, setTone] = useState("curious_peer");
  const [angle, setAngle] = useState("");
  const [requireApproval, setRequireApproval] = useState(true);
  const [defaultKeywords, setDefaultKeywords] = useState<string[]>([]);

  // Load account-level default keywords once when wizard opens (only pre-fill if user hasn't typed yet)
  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase
        .from("profiles")
        .select("default_spike_keywords")
        .eq("user_id", u.user.id)
        .maybeSingle();
      const defs = (((data as any)?.default_spike_keywords) || []) as string[];
      setDefaultKeywords(defs);
      setKeywords(prev => prev.trim() ? prev : defs.join("\n"));
    })();
  }, [open]);

  const reset = () => { setStep(1); };

  const submit = async () => {
    const typed = keywords.split(/[,\n]/).map(s => s.trim()).filter(Boolean);
    const kws = Array.from(new Set([...defaultKeywords, ...typed]));
    if (kws.length === 0) { toast.error("Add at least one keyword"); return; }
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke("schedule-engagement-spike", {
      body: {
        scheduled_for: new Date(scheduledFor).toISOString(),
        target_count: targetCount,
        drop_window_minutes: windowMin,
        spacing_min_seconds: spacingMin,
        spacing_max_seconds: spacingMax,
        keywords: kws,
        filters: { recency },
        tone,
        custom_angle: angle || null,
        require_approval: requireApproval,
      },
    });
    setSubmitting(false);
    if (error || (data as any)?.error) {
      toast.error((data as any)?.error || error?.message || "Failed to schedule spike");
      return;
    }
    toast.success("Spike scheduled. Drafting comments…");
    onOpenChange(false);
    reset();
    onCreated((data as any).spike_id);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            Schedule an engagement spike
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {[1, 2, 3].map(n => (
            <div key={n} className={`flex-1 h-1 rounded-full ${n <= step ? "bg-foreground" : "bg-muted"}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label>Spike time</Label>
              <Input type="datetime-local" value={scheduledFor} onChange={e => setScheduledFor(e.target.value)} />
              <p className="text-xs text-muted-foreground mt-1">Comments will land in the {windowMin} min before this time.</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Comments</Label>
                <Select value={String(targetCount)} onValueChange={v => setTargetCount(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[5, 7, 10, 12, 15, 20].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Drop window</Label>
                <Select value={String(windowMin)} onValueChange={v => setWindowMin(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 min</SelectItem>
                    <SelectItem value="25">25 min</SelectItem>
                    <SelectItem value="40">40 min</SelectItem>
                    <SelectItem value="60">60 min</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Spacing</Label>
                <Select value={`${spacingMin}-${spacingMax}`} onValueChange={v => {
                  const [a, b] = v.split("-").map(Number); setSpacingMin(a); setSpacingMax(b);
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="120-180">2–3 min</SelectItem>
                    <SelectItem value="180-300">3–5 min</SelectItem>
                    <SelectItem value="60-120">1–2 min</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label>Keywords or topics</Label>
              <Textarea
                rows={4}
                placeholder={"one per line — e.g.\noutbound sales\nsales engagement\nlinkedin automation"}
                value={keywords}
                onChange={e => setKeywords(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">We'll search LinkedIn posts for these.</p>
            </div>
            <div>
              <Label>Recency</Label>
              <Select value={recency} onValueChange={setRecency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="past-24h">Past 24 hours</SelectItem>
                  <SelectItem value="past-week">Past week</SelectItem>
                  <SelectItem value="past-month">Past month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <Label>Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TONES.map(t => <SelectItem key={t.v} value={t.v}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Personal angle (optional)</Label>
              <Textarea
                rows={3}
                placeholder="Something you'd naturally say or a perspective you want to weave in"
                value={angle}
                onChange={e => setAngle(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Require my approval before drop</p>
                <p className="text-xs text-muted-foreground">Review and edit each comment first.</p>
              </div>
              <Switch checked={requireApproval} onCheckedChange={setRequireApproval} />
            </div>
          </div>
        )}

        <DialogFooter className="flex justify-between sm:justify-between gap-2">
          <Button variant="ghost" onClick={() => step > 1 ? setStep(step - 1) : onOpenChange(false)}>
            {step > 1 ? "Back" : "Cancel"}
          </Button>
          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)}>
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={submit} disabled={submitting}>
              {submitting ? "Scheduling…" : "Schedule spike"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Contact } from "./types";

interface BookMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: Contact | null;
  campaignId?: string;
  onBooked: () => void;
}

export function BookMeetingDialog({ open, onOpenChange, contact, campaignId, onBooked }: BookMeetingDialogProps) {
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState("10:00");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!contact || !date) {
      toast.error("Please select a date");
      return;
    }

    setSaving(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("Not authenticated");

      const [hours, minutes] = time.split(":").map(Number);
      const scheduledAt = new Date(date);
      scheduledAt.setHours(hours, minutes, 0, 0);

      const { error: meetingError } = await supabase.from("meetings" as any).insert({
        user_id: user.id,
        contact_id: contact.id,
        campaign_id: campaignId || null,
        scheduled_at: scheduledAt.toISOString(),
        notes: notes || null,
        status: "scheduled",
      } as any);

      if (meetingError) throw meetingError;

      // Update contact lead_status
      await supabase.from("contacts").update({ lead_status: "meeting_booked" }).eq("id", contact.id);

      toast.success(`Meeting booked with ${contact.first_name}!`);
      onOpenChange(false);
      setDate(undefined);
      setTime("10:00");
      setNotes("");
      onBooked();
    } catch (err: any) {
      console.error("Book meeting error:", err);
      toast.error(err.message || "Failed to book meeting");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Book Meeting{contact ? ` with ${contact.first_name} ${contact.last_name || ""}` : ""}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Date picker */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time picker */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Time</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Notes (optional)</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Meeting agenda, topics to discuss..."
              className="resize-none"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !date}>
            {saving ? "Booking..." : "Book Meeting"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

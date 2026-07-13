import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { ContactList } from "./types";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  lists: ContactList[];
  onImported: () => void;
}

// Accept common LinkedIn post URL shapes
const URL_RE = /^https?:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\/(?:posts\/[^/]+|feed\/update\/urn:li:(?:activity|share|ugcPost):\d+)/i;

export function ExtractFromLinkedInPostDialog({ open, onOpenChange, lists, onImported }: Props) {
  const today = useMemo(
    () => new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
    []
  );
  const [postUrl, setPostUrl] = useState("");
  const [includeLikers, setIncludeLikers] = useState(true);
  const [includeCommenters, setIncludeCommenters] = useState(true);
  const [listChoice, setListChoice] = useState<string>("__new__");
  const [campaignChoice, setCampaignChoice] = useState<string>("__none__");
  const [campaigns, setCampaigns] = useState<{ id: string; company_name: string | null }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("");

  const valid = URL_RE.test(postUrl.trim()) && (includeLikers || includeCommenters);

  function reset() {
    setPostUrl("");
    setIncludeLikers(true);
    setIncludeCommenters(true);
    setListChoice("__new__");
    setCampaignChoice("__none__");
    setStatus("");
  }

  useEffect(() => {
    if (open) {
      supabase.from("campaigns").select("id, company_name").order("created_at", { ascending: false }).limit(10)
        .then(({ data }) => setCampaigns(data || []));
    } else {
      reset();
    }
  }, [open]);

  async function handleSubmit() {
    if (!valid || submitting) return;
    setSubmitting(true);
    setStatus("Fetching post & engagers…");

    let backgrounded = false;
    const invokePromise = supabase.functions.invoke("extract-linkedin-post-leads", {
      body: {
        post_url: postUrl.trim(),
        list_id: listChoice === "__new__" ? null : listChoice,
        campaign_id: campaignChoice === "__none__" ? null : campaignChoice,
        include_likers: includeLikers,
        include_commenters: includeCommenters,
      },
    });

    // Handle final result whether foreground or background
    const handleResult = ({ data, error }: any) => {
      if (error) {
        console.error(error);
        toast.error(error?.message || "Failed to extract leads");
        return;
      }
      const inserted = (data as any)?.inserted ?? 0;
      const rawUnique = (data as any)?.raw_unique ?? 0;
      const fetched = ((data as any)?.reactions_fetched ?? 0) + ((data as any)?.comments_fetched ?? 0);
      const skippedComp = (data as any)?.skipped_competitor ?? 0;
      const skippedLow = (data as any)?.skipped_low_fit ?? 0;
      const skippedDup = (data as any)?.skipped_duplicate ?? 0;
      const skipped = skippedComp + skippedLow + skippedDup;
      toast.success(
        `Imported ${inserted} lead${inserted === 1 ? "" : "s"} from ${rawUnique || fetched} engager${(rawUnique || fetched) === 1 ? "" : "s"}` +
          (skipped ? ` (skipped ${skippedComp} competitors, ${skippedLow} low-fit, ${skippedDup} duplicates)` : "")
      );
      onImported();
    };

    const timeoutId = window.setTimeout(() => {
      backgrounded = true;
      toast.info("Still extracting — we'll notify you when it's done. You can keep working.", { duration: 6000 });
      setSubmitting(false);
      setStatus("");
      onOpenChange(false);
      reset();
      // Continue in background
      invokePromise.then(handleResult).catch((e) => {
        console.error(e);
        toast.error(e?.message || "Failed to extract leads");
      });
    }, 15000);

    try {
      const result = await invokePromise;
      if (backgrounded) return; // background handler will take over
      window.clearTimeout(timeoutId);
      handleResult(result);
      if (!result.error) {
        onOpenChange(false);
        reset();
      }
    } catch (e: any) {
      if (backgrounded) return;
      window.clearTimeout(timeoutId);
      console.error(e);
      toast.error(e?.message || "Failed to extract leads");
    } finally {
      if (!backgrounded) {
        setSubmitting(false);
        setStatus("");
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] p-6 gap-0">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Sparkles className="w-4 h-4 text-sky-600" />
            Get leads from LinkedIn post
          </DialogTitle>
          <DialogDescription className="text-xs mt-1">
            Paste any LinkedIn post URL. We'll import everyone who liked or commented on it, skipping the post author and your listed competitors.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-5 space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground">Post URL</label>
            <Input
              value={postUrl}
              onChange={(e) => setPostUrl(e.target.value)}
              placeholder="https://www.linkedin.com/posts/username_slug-activity-1234567890"
              className="text-xs"
            />
            {postUrl && !URL_RE.test(postUrl.trim()) && (
              <p className="text-[10px] text-destructive">Expected a linkedin.com/posts/… or linkedin.com/feed/update/urn:li:activity:… URL</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground">What to pull</label>
            <div className="flex gap-2">
              <label className={`flex items-center gap-2 text-xs border rounded-lg px-3 py-2 cursor-pointer flex-1 ${includeLikers ? "border-sky-400 bg-sky-50" : "border-border"}`}>
                <input type="checkbox" checked={includeLikers} onChange={(e) => setIncludeLikers(e.target.checked)} />
                Likers
              </label>
              <label className={`flex items-center gap-2 text-xs border rounded-lg px-3 py-2 cursor-pointer flex-1 ${includeCommenters ? "border-sky-400 bg-sky-50" : "border-border"}`}>
                <input type="checkbox" checked={includeCommenters} onChange={(e) => setIncludeCommenters(e.target.checked)} />
                Commenters
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground">Add to list</label>
            <select
              value={listChoice}
              onChange={(e) => setListChoice(e.target.value)}
              className="w-full text-xs border border-border rounded-lg p-2 bg-background text-foreground"
            >
              <option value="__new__">➕ New list — "Extracted from LinkedIn post · {today}"</option>
              {lists.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground">Enroll in campaign (optional)</label>
            <select
              value={campaignChoice}
              onChange={(e) => setCampaignChoice(e.target.value)}
              className="w-full text-xs border border-border rounded-lg p-2 bg-background text-foreground"
            >
              <option value="__none__">Don't enroll — just add to contacts</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>{c.company_name || "Untitled campaign"}</option>
              ))}
            </select>
            <p className="text-[10px] text-muted-foreground">If a campaign is picked, we'll score the leads against its ICP.</p>
          </div>

          {status && (
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> {status}
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-6 justify-end">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
          <Button size="sm" onClick={handleSubmit} disabled={!valid || submitting} className="bg-sky-600 hover:bg-sky-700 text-white">
            {submitting ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> Extracting…</> : "Extract leads"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

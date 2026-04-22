import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, Check, Loader2, Share2 } from "lucide-react";

interface ShareLeadsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedContactIds: string[];
}

export function ShareLeadsDialog({ open, onOpenChange, selectedContactIds }: ShareLeadsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      setShareUrl(null);
      setCopied(false);
      void createLink();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function createLink() {
    if (selectedContactIds.length === 0) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-shared-lead-link", {
        body: { contact_ids: selectedContactIds },
      });
      if (error) throw error;
      const token = (data as any)?.token as string | undefined;
      if (!token) throw new Error("No token returned");
      const url = `${window.location.origin}/shared/leads/${token}`;
      setShareUrl(url);
    } catch (err: any) {
      toast.error(err?.message || "Failed to create share link");
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy to clipboard");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-1">
            <Share2 className="w-4 h-4 text-primary" />
          </div>
          <DialogTitle className="text-center">
            Share {selectedContactIds.length} lead{selectedContactIds.length === 1 ? "" : "s"}
          </DialogTitle>
          <DialogDescription className="text-center">
            Anyone with this link can view these leads. They'll need to sign up to save them or open the LinkedIn profiles.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating link...
            </div>
          ) : shareUrl ? (
            <div className="flex items-stretch gap-2">
              <input
                readOnly
                value={shareUrl}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                className="flex-1 min-w-0 px-3 py-2 border border-border rounded-lg text-xs bg-muted/40 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                onClick={handleCopy}
                className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          ) : null}

          <p className="text-[11px] text-muted-foreground mt-3 text-center">
            Link expires in 30 days. Emails and private notes are never shared.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

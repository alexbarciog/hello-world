import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import type { ContactList } from "./types";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  lists: ContactList[];
  onImported: () => void;
}

const SALES_NAV_REGEX = /^https:\/\/www\.linkedin\.com\/sales\/search\//i;

export function ImportSalesNavDialog({ open, onOpenChange, lists, onImported }: Props) {
  const today = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }, []);
  const [url, setUrl] = useState("");
  const [maxLeads, setMaxLeads] = useState(100);
  const [listChoice, setListChoice] = useState<string>("__new__");
  const [newListName, setNewListName] = useState(`Sales Nav — ${today}`);
  const [submitting, setSubmitting] = useState(false);

  const urlValid = !url || SALES_NAV_REGEX.test(url.trim());

  const reset = () => {
    setUrl("");
    setMaxLeads(100);
    setListChoice("__new__");
    setNewListName(`Sales Nav — ${today}`);
  };

  async function handleImport() {
    if (!url.trim() || !urlValid) {
      toast.error("Please paste a valid Sales Navigator search URL");
      return;
    }
    if (listChoice === "__new__" && !newListName.trim()) {
      toast.error("Please name the new list");
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("import-sales-nav", {
        body: {
          search_url: url.trim(),
          max_leads: maxLeads,
          ...(listChoice === "__new__"
            ? { new_list_name: newListName.trim() }
            : { list_id: listChoice }),
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      const inserted = (data as any)?.inserted ?? 0;
      const duplicates = (data as any)?.duplicates ?? 0;
      toast.success(
        `Imported ${inserted} lead${inserted === 1 ? "" : "s"}${
          duplicates ? ` (skipped ${duplicates} duplicate${duplicates === 1 ? "" : "s"})` : ""
        }`,
      );
      reset();
      onOpenChange(false);
      onImported();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Import failed";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !submitting && onOpenChange(v)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Import from Sales Navigator</DialogTitle>
          <DialogDescription>
            Paste a Sales Navigator lead search URL. We'll import leads from your search into the list of your choice.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">
              Sales Navigator search URL
            </label>
            <Textarea
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.linkedin.com/sales/search/people?..."
              className="min-h-[80px] text-xs font-mono"
              disabled={submitting}
            />
            {!urlValid && (
              <p className="text-xs text-destructive mt-1">
                URL must start with https://www.linkedin.com/sales/search/
              </p>
            )}
            <p className="text-[11px] text-muted-foreground mt-1">
              We'll import up to 500 leads from the first ~20 result pages.
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">
              Max leads to import
            </label>
            <select
              value={maxLeads}
              onChange={(e) => setMaxLeads(Number(e.target.value))}
              disabled={submitting}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
            >
              <option value={50}>50 leads</option>
              <option value={100}>100 leads</option>
              <option value={250}>250 leads</option>
              <option value={500}>500 leads</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">
              Destination list
            </label>
            <select
              value={listChoice}
              onChange={(e) => setListChoice(e.target.value)}
              disabled={submitting}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
            >
              <option value="__new__">+ Create new list…</option>
              {lists.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
            {listChoice === "__new__" && (
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="List name"
                disabled={submitting}
                className="mt-2 w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
              />
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={submitting || !url.trim() || !urlValid}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Importing…
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" /> Import
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

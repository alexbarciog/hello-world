import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { LeadResult } from "./types";
import { useOrganization } from "@/contexts/OrganizationContext";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  lead: LeadResult | null;
  onSaved: (lead: LeadResult) => void;
}

export function SaveLeadDialog({ open, onOpenChange, lead, onSaved }: Props) {
  const { currentOrg } = useOrganization();
  const [lists, setLists] = useState<{ id: string; name: string }[]>([]);
  const [selectedListId, setSelectedListId] = useState<string>("");
  const [newListName, setNewListName] = useState("");
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data } = await supabase.from("lists").select("id, name").order("created_at", { ascending: false });
      const arr = data ?? [];
      setLists(arr);
      if (arr.length > 0) {
        setMode("existing");
        setSelectedListId(arr[0].id);
      } else {
        setMode("new");
        setNewListName("AI Chat Leads");
      }
    })();
  }, [open]);

  const handleSave = async () => {
    if (!lead) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let listId = selectedListId;
      let listName = lists.find((l) => l.id === listId)?.name ?? "";

      if (mode === "new") {
        const name = newListName.trim() || "AI Chat Leads";
        const { data: created, error } = await supabase
          .from("lists")
          .insert({ user_id: user.id, organization_id: currentOrg?.id ?? null, name })
          .select("id, name")
          .single();
        if (error) throw error;
        listId = created.id;
        listName = created.name;
      }

      if (!listId) throw new Error("Pick a list");

      const tier = lead.match_score >= 80 ? "hot" : lead.match_score >= 60 ? "warm" : "cold";

      const { data: contact, error: cErr } = await supabase
        .from("contacts")
        .insert({
          user_id: user.id,
          organization_id: currentOrg?.id ?? null,
          first_name: lead.first_name || lead.full_name.split(" ")[0] || "Unknown",
          last_name: lead.last_name || lead.full_name.split(" ").slice(1).join(" ") || null,
          title: lead.title || null,
          company: lead.company || null,
          industry: lead.industry || null,
          linkedin_url: lead.linkedin_url || null,
          list_name: listName,
          relevance_tier: tier,
          ai_score: lead.match_score,
          signal: lead.reasons?.[0] ?? null,
        })
        .select("id")
        .single();
      if (cErr) throw cErr;

      const { error: linkErr } = await supabase
        .from("contact_lists")
        .insert({ contact_id: contact.id, list_id: listId });
      if (linkErr) throw linkErr;

      toast.success(`Added to ${listName}`);
      onSaved(lead);
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save lead");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add to outreach</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {lists.length > 0 && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode("existing")}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                  mode === "existing" ? "border-foreground bg-foreground/5" : "border-border text-foreground/60"
                }`}
              >
                Existing list
              </button>
              <button
                type="button"
                onClick={() => setMode("new")}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                  mode === "new" ? "border-foreground bg-foreground/5" : "border-border text-foreground/60"
                }`}
              >
                New list
              </button>
            </div>
          )}

          {mode === "existing" && lists.length > 0 ? (
            <div className="space-y-2">
              <Label>Choose list</Label>
              <select
                value={selectedListId}
                onChange={(e) => setSelectedListId(e.target.value)}
                className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm"
              >
                {lists.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>List name</Label>
              <Input value={newListName} onChange={(e) => setNewListName(e.target.value)} placeholder="e.g. AI Chat Leads" />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-[hsl(72_100%_50%)] hover:bg-[hsl(72_100%_45%)] text-foreground font-semibold">
            {saving ? "Saving…" : "Add to outreach"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

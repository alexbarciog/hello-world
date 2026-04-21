import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ContactList } from "./types";
import { Plus, FolderPlus } from "lucide-react";
import { useOrganization } from "@/contexts/OrganizationContext";

interface CreateListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedContactIds: Set<string>;
  existingLists: ContactList[];
  onCreated: () => void;
}

export function CreateListDialog({
  open, onOpenChange, selectedContactIds, existingLists, onCreated,
}: CreateListDialogProps) {
  const { currentOrg } = useOrganization();
  const [mode, setMode] = useState<"new" | "existing">("new");
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [selectedListId, setSelectedListId] = useState<string>("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (selectedContactIds.size === 0) return;
    setSaving(true);

    const user = (await supabase.auth.getUser()).data.user;
    if (!user) { setSaving(false); return; }

    let listId: string;

    if (mode === "new") {
      if (!newName.trim()) { setSaving(false); return; }
      const { data, error } = await (supabase.from("lists") as any)
        .insert({ user_id: user.id, organization_id: currentOrg?.id ?? null, name: newName.trim(), description: newDesc.trim() || null })
        .select("id")
        .single();
      if (error || !data) { console.error(error); setSaving(false); return; }
      listId = data.id;
    } else {
      if (!selectedListId) { setSaving(false); return; }
      listId = selectedListId;
    }

    // Insert contact_lists entries
    const entries = [...selectedContactIds].map((contactId) => ({
      contact_id: contactId,
      list_id: listId,
    }));

    const { error: linkError } = await (supabase.from("contact_lists") as any).insert(entries);
    if (linkError) console.error("Link error:", linkError);

    setSaving(false);
    setNewName("");
    setNewDesc("");
    setSelectedListId("");
    onOpenChange(false);
    onCreated();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <FolderPlus className="w-4.5 h-4.5" />
            Add {selectedContactIds.size} contact{selectedContactIds.size !== 1 ? "s" : ""} to list
          </DialogTitle>
        </DialogHeader>

        {/* Mode toggle */}
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => setMode("new")}
            className={`flex-1 text-xs font-semibold py-2.5 rounded-lg border transition-colors ${
              mode === "new"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-muted/50"
            }`}
          >
            <Plus className="w-3.5 h-3.5 inline mr-1" />
            New list
          </button>
          <button
            onClick={() => setMode("existing")}
            className={`flex-1 text-xs font-semibold py-2.5 rounded-lg border transition-colors ${
              mode === "existing"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-muted/50"
            }`}
          >
            Existing list
          </button>
        </div>

        {mode === "new" ? (
          <div className="flex flex-col gap-3 mt-2">
            <Input
              placeholder="List name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
            />
            <Input
              placeholder="Description (optional)"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-2 mt-2 max-h-48 overflow-y-auto">
            {existingLists.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No lists yet. Create one first.</p>
            ) : (
              existingLists.map((list) => (
                <button
                  key={list.id}
                  onClick={() => setSelectedListId(list.id)}
                  className={`text-left px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                    selectedListId === list.id
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border text-foreground hover:bg-muted/50"
                  }`}
                >
                  <span className="font-medium">{list.name}</span>
                  {list.description && (
                    <span className="text-xs text-muted-foreground ml-2">{list.description}</span>
                  )}
                </button>
              ))
            )}
          </div>
        )}

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} size="sm">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || (mode === "new" ? !newName.trim() : !selectedListId)}
            size="sm"
          >
            {saving ? "Saving..." : "Add to list"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useEffect, useRef, useState } from "react";
import { Mail, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EmailCellProps {
  contactId: string;
  email: string | null;
  onSaved: (email: string | null) => void;
}

export function EmailCell({ contactId, email, onSaved }: EmailCellProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(email || "");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(email || "");
  }, [email]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const save = async () => {
    const trimmed = value.trim();
    const newVal = trimmed === "" ? null : trimmed;
    if (newVal === (email || null)) {
      setEditing(false);
      return;
    }
    if (newVal && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newVal)) {
      toast.error("Invalid email address");
      setValue(email || "");
      setEditing(false);
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("contacts")
      .update({ email: newVal, email_enriched: !!newVal })
      .eq("id", contactId);
    setSaving(false);
    if (error) {
      toast.error("Failed to save email");
      setValue(email || "");
    } else {
      onSaved(newVal);
      toast.success("Email saved");
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="email"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); (e.target as HTMLInputElement).blur(); }
          if (e.key === "Escape") { setValue(email || ""); setEditing(false); }
        }}
        placeholder="name@company.com"
        className="w-full text-xs px-2 py-1 border border-border rounded-md bg-card outline-none focus:border-primary"
      />
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="group/email flex items-center gap-1.5 text-xs w-full text-left hover:bg-muted/50 rounded-md px-2 py-1 -mx-2 transition-colors min-h-[24px]"
      title={email || "Click to add email"}
    >
      {saving ? (
        <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
      ) : email ? (
        <span className="text-foreground truncate max-w-[180px]">{email}</span>
      ) : (
        <span className="flex items-center gap-1 text-muted-foreground group-hover/email:text-primary transition-colors">
          <Mail className="w-3 h-3" />
          <span>Add email</span>
        </span>
      )}
    </button>
  );
}

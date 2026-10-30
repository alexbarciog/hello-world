import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Account { id: string; email: string; status: string; opted_out: boolean }
interface Preview {
  to: string;
  timezone: string;
  programme_enabled: boolean;
  payload: { signals: number; messages: number; replies: number; meetings: number };
  email: { subject: string; text: string; template: string };
}

/** Admin: next Tuesday's digest for any account, from live data. Sends nothing. */
export default function AdminDigestPreview() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selected, setSelected] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.functions.invoke("email-digest-preview", { body: { action: "accounts" } }).then(({ data, error }) => {
      if (error) toast.error("Couldn't load accounts");
      else setAccounts(data?.accounts ?? []);
    });
  }, []);

  const load = async (id: string) => {
    setSelected(id);
    setPreview(null);
    if (!id) return;
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("email-digest-preview", { body: { action: "preview", account_id: id } });
    setBusy(false);
    if (error) toast.error("Couldn't build the preview");
    else setPreview(data);
  };

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold tracking-tight">Weekly digest preview</h1>
      <p className="text-sm text-muted-foreground mb-4">What this account would get next Tuesday at 09:00 their time. Nothing is sent from here.</p>
      <select aria-label="Account" value={selected} onChange={(e) => load(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
        <option value="">Choose an account…</option>
        {accounts.map((a) => <option key={a.id} value={a.id}>{a.email} · {a.status}{a.opted_out ? " · unsubscribed" : ""}</option>)}
      </select>

      {busy && <Loader2 className="w-5 h-5 animate-spin mt-6 text-muted-foreground" />}
      {preview && (
        <div className="mt-6 space-y-3">
          {!preview.programme_enabled && (
            <p className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">The digest is switched off (EMAIL_DIGEST_ENABLED isn't set), so nothing goes out yet.</p>
          )}
          <p className="text-xs text-muted-foreground">To {preview.to} · {preview.timezone} · {preview.email.template}</p>
          <p className="text-sm font-semibold">{preview.email.subject}</p>
          <pre className="rounded-xl border border-border p-4 text-sm whitespace-pre-wrap font-sans">{preview.email.text}</pre>
        </div>
      )}
    </div>
  );
}

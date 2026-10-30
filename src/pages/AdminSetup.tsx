import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAllTemplates } from "@/lib/agentTemplates";
import { setupOrders, type AdminSetupOrder } from "@/lib/setupOrders";

const BADGE: Record<string, string> = {
  ordered: "bg-sky-50 text-sky-700",
  scheduled: "bg-amber-50 text-amber-700",
  delivered: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-neutral-100 text-neutral-500",
};

/** Admin: done-for-you orders. Marking one delivered applies a template to the account. */
export default function AdminSetup() {
  const [orders, setOrders] = useState<AdminSetupOrder[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [delivering, setDelivering] = useState<string | null>(null);
  const [templateId, setTemplateId] = useState("");
  const { data: templates } = useAllTemplates(true);

  const load = useCallback(async () => {
    const r = await setupOrders<{ orders: AdminSetupOrder[] }>({ action: "list" });
    if (r.error) toast.error(r.error);
    setOrders(r.data?.orders ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const act = async (id: string, body: Record<string, unknown>, done: string) => {
    setBusy(id);
    const r = await setupOrders<{ emailed?: boolean }>({ order_id: id, ...body });
    setBusy(null);
    if (r.error) {
      toast.error(r.errors?.join(" ") || r.error);
      return false;
    }
    toast.success(done);
    if (r.data?.emailed === false) toast.warning("The delivered email didn't send. Email them by hand.");
    await load();
    return true;
  };

  if (!orders) return <div className="flex justify-center py-24"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold tracking-tight mb-1">Setup orders</h1>
      <p className="text-sm text-muted-foreground mb-6">Done-for-you setups. Refunds go through the Stripe dashboard and cancel the order automatically.</p>
      {orders.length === 0 && <p className="text-sm text-muted-foreground">No orders yet.</p>}
      <div className="space-y-4">
        {orders.map((o) => {
          const open = o.status === "ordered" || o.status === "scheduled";
          return (
            <article key={o.id} className="rounded-2xl border border-border p-5">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <span className={`text-xs font-semibold rounded-full px-2.5 py-1 ${BADGE[o.status]}`}>{o.status}</span>
                <span className="text-sm font-semibold">{o.email ?? o.account_id}</span>
                <span className="text-xs text-muted-foreground">
                  {o.amount ? `$${(o.amount / 100).toFixed(0)}` : "Founding: $0"} · {new Date(o.created_at).toLocaleDateString()}
                  {o.scheduled_at ? ` · call ${new Date(o.scheduled_at).toLocaleString()}` : ""}
                </span>
              </div>

              {o.intake ? (
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm mb-4">
                  {([["Business", o.intake.business], ["Ideal customer", o.intake.ideal_customer], ["Offer", o.intake.offer], ["Example clients", o.intake.example_clients?.join(", ")], ["LinkedIn", o.intake.linkedin_account], ["Tried", o.intake.tried]] as const).map(([k, v]) => (
                    <div key={k}><dt className="text-xs font-semibold text-muted-foreground">{k}</dt><dd className="whitespace-pre-wrap break-words">{v || "—"}</dd></div>
                  ))}
                </dl>
              ) : (
                <p className="text-sm text-muted-foreground mb-4">Intake form not filled in yet.</p>
              )}

              <label className="block text-xs font-semibold mb-1" htmlFor={`notes-${o.id}`}>Notes (only admins see these)</label>
              <textarea id={`notes-${o.id}`} defaultValue={o.notes_admin ?? ""} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm min-h-[50px] mb-3"
                onBlur={(e) => { if (e.target.value !== (o.notes_admin ?? "")) act(o.id, { action: "set_notes", notes: e.target.value }, "Notes saved"); }} />

              {open && (
                <div className="flex flex-wrap items-center gap-2">
                  {o.status === "ordered" && <button disabled={busy === o.id} onClick={() => act(o.id, { action: "set_status", status: "scheduled" }, "Marked scheduled")} className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted">Mark scheduled</button>}
                  {delivering === o.id ? (
                    <>
                      <select aria-label="Template to apply" value={templateId} onChange={(e) => setTemplateId(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm">
                        <option value="">Template to apply…</option>
                        {(templates ?? []).filter((t) => !t.archived_at).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                      <button disabled={!templateId || busy === o.id} onClick={async () => { if (await act(o.id, { action: "deliver", template_id: templateId }, "Delivered and applied")) setDelivering(null); }}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#0a0a0a] text-white px-3 py-1.5 text-sm disabled:opacity-50">
                        {busy === o.id && <Loader2 className="w-4 h-4 animate-spin" />} Apply and mark delivered
                      </button>
                      <button onClick={() => setDelivering(null)} className="text-sm text-muted-foreground underline">Cancel</button>
                    </>
                  ) : (
                    <button onClick={() => { setDelivering(o.id); setTemplateId(""); }} className="rounded-lg bg-[#0a0a0a] text-white px-3 py-1.5 text-sm">Mark delivered…</button>
                  )}
                  {delivering !== o.id && !o.stripe_payment_intent_id && (
                    <button disabled={busy === o.id} onClick={() => act(o.id, { action: "set_status", status: "cancelled" }, "Cancelled")} className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted">Cancel order</button>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Calendar, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";
import { CONTACT_EMAIL, SETUP_PRICE_USD } from "@/lib/billing";
import { SETUP_CALL_URL, setupOrders, type SetupIntake, type SetupOrder } from "@/lib/setupOrders";

const input = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";
const STATUS_COPY: Record<SetupOrder["status"], string> = {
  ordered: "Order received",
  scheduled: "Call scheduled",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const EMPTY: SetupIntake = { business: "", ideal_customer: "", offer: "", example_clients: ["", "", ""], linkedin_account: "", tried: "" };

export default function SetupService() {
  const sub = useSubscription();
  const [params, setParams] = useSearchParams();
  const [order, setOrder] = useState<SetupOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [intake, setIntake] = useState<SetupIntake>(EMPTY);
  const [editing, setEditing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const load = useCallback(async () => {
    const r = await setupOrders<{ order: SetupOrder | null }>({ action: "mine" });
    setOrder(r.data?.order ?? null);
    if (r.data?.order?.intake) setIntake(r.data.order.intake);
    setLoading(false);
    return r.data?.order ?? null;
  }, []);

  useEffect(() => { load(); }, [load]);

  // Back from Stripe: the webhook creates the order a moment later.
  useEffect(() => {
    if (params.get("paid") !== "1") return;
    let tries = 0;
    let stopped = false;
    const poll = async () => {
      const found = await load();
      if (stopped) return;
      if (found || tries++ > 10) {
        params.delete("paid");
        setParams(params, { replace: true });
        return;
      }
      setTimeout(poll, 2000);
    };
    poll();
    return () => { stopped = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buy = async () => {
    setBusy(true);
    const r = await setupOrders<{ url?: string; order?: SetupOrder }>({ action: "start" });
    setBusy(false);
    if (r.error) {
      toast.error(r.code === "payments_disabled" ? `Checkout is paused for a moment. Email ${CONTACT_EMAIL} and Alex will set you up today.` : r.error);
      return;
    }
    if (r.data?.url) window.location.href = r.data.url;
    else if (r.data?.order) setOrder(r.data.order);
  };

  const saveIntake = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrors([]);
    const r = await setupOrders<{ order: SetupOrder }>({ action: "save_intake", intake });
    setBusy(false);
    if (r.error) {
      setErrors(r.errors ?? [r.error]);
      return;
    }
    setOrder(r.data!.order);
    setEditing(false);
    toast.success("Thanks, that's everything Alex needs.");
  };

  if (loading || sub.loading) {
    return <div className="flex justify-center py-24"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  }

  const canBuy = sub.status === "trialing" || sub.status === "active";
  const showForm = order && order.status !== "delivered" && (!order.intake || editing);

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Done-for-you setup</h1>
        <p className="text-sm text-muted-foreground mt-1">A 30-minute call with Alex and a custom agent built for your business, so you don't have to configure anything.</p>
      </div>

      {!order && (
        <section className="rounded-2xl border border-border p-6">
          <h2 className="font-semibold mb-2">What you get</h2>
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1 mb-4">
            <li>A 30-minute call to go through your business and who you sell to</li>
            <li>A custom signal agent and LinkedIn sequence, built by Alex and applied to your account</li>
          </ul>
          <h2 className="font-semibold mb-2">What Alex needs from you</h2>
          <p className="text-sm text-muted-foreground mb-5">A short form: your business, ideal customer, offer, 3 example clients, the LinkedIn account to use, and what you've tried.</p>

          <div className="flex flex-wrap items-center gap-4">
            <p className="text-2xl font-bold">
              {sub.founding ? <span className="line-through text-muted-foreground font-medium">${SETUP_PRICE_USD}</span> : `$${SETUP_PRICE_USD}`}
              <span className="text-sm font-normal text-muted-foreground ml-2">{sub.founding ? "Included for founding customers" : "one-time"}</span>
            </p>
            {canBuy && sub.isBillingOwner ? (
              <button onClick={buy} disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-[#0a0a0a] text-white px-5 py-2.5 text-sm font-semibold disabled:opacity-60">
                {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                {sub.founding ? "Get my setup" : "Buy the setup"}
              </button>
            ) : (
              <p className="text-sm text-muted-foreground">
                {canBuy ? "Your workspace owner can order this." : "Available once your trial or subscription is running."}
              </p>
            )}
          </div>
        </section>
      )}

      {order && (
        <section className="rounded-2xl border border-border p-5 flex items-start gap-3">
          <CheckCircle2 className={`w-5 h-5 shrink-0 mt-0.5 ${order.status === "delivered" ? "text-emerald-600" : "text-sky-600"}`} />
          <div>
            <p className="font-semibold">{STATUS_COPY[order.status]}</p>
            <p className="text-sm text-muted-foreground">
              {order.status === "delivered"
                ? `Your custom agent was applied on ${new Date(order.delivered_at!).toLocaleDateString()}.`
                : order.status === "scheduled" && order.scheduled_at
                  ? `Your call is on ${new Date(order.scheduled_at).toLocaleString()}.`
                  : order.intake ? "Next step: book your call below." : "Next step: fill in the form below."}
            </p>
          </div>
        </section>
      )}

      {showForm && (
        <form onSubmit={saveIntake} className="rounded-2xl border border-border p-5 space-y-4">
          <h2 className="font-semibold">Tell Alex about your business</h2>
          {([
            ["business", "Your business", "What you do, and for whom"],
            ["ideal_customer", "Your ideal customer", "Role, company size, industry, location"],
            ["offer", "Your offer", "What you sell them, and why they buy it"],
          ] as const).map(([key, label, hint]) => (
            <div key={key}>
              <label htmlFor={key} className="block text-xs font-semibold mb-1">{label}</label>
              <textarea id={key} className={`${input} min-h-[70px]`} placeholder={hint} value={intake[key]} onChange={(e) => setIntake({ ...intake, [key]: e.target.value })} />
            </div>
          ))}
          <div>
            <span className="block text-xs font-semibold mb-1">3 example clients</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[0, 1, 2].map((i) => (
                <input key={i} aria-label={`Example client ${i + 1}`} className={input} value={intake.example_clients[i] ?? ""}
                  onChange={(e) => {
                    const next = [...intake.example_clients];
                    next[i] = e.target.value;
                    setIntake({ ...intake, example_clients: next });
                  }} />
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="linkedin_account" className="block text-xs font-semibold mb-1">The LinkedIn account to use</label>
            <input id="linkedin_account" className={input} placeholder="https://www.linkedin.com/in/you" value={intake.linkedin_account} onChange={(e) => setIntake({ ...intake, linkedin_account: e.target.value })} />
          </div>
          <div>
            <label htmlFor="tried" className="block text-xs font-semibold mb-1">What you've tried so far (optional)</label>
            <textarea id="tried" className={`${input} min-h-[60px]`} value={intake.tried} onChange={(e) => setIntake({ ...intake, tried: e.target.value })} />
          </div>
          {errors.length > 0 && (
            <ul className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-800 list-disc pl-6">
              {errors.map((e) => <li key={e}>{e}</li>)}
            </ul>
          )}
          <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-[#0a0a0a] text-white px-5 py-2.5 text-sm font-semibold disabled:opacity-60">
            {busy && <Loader2 className="w-4 h-4 animate-spin" />} Save
          </button>
        </form>
      )}

      {order && order.intake && !editing && order.status !== "delivered" && (
        <section className="rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold inline-flex items-center gap-2"><Calendar className="w-4 h-4" /> Book your 30-minute call</h2>
            <button onClick={() => setEditing(true)} className="text-sm underline text-muted-foreground">Edit my answers</button>
          </div>
          {SETUP_CALL_URL ? (
            <iframe title="Book your setup call" src={`${SETUP_CALL_URL}?embed=true`} className="w-full h-[640px] rounded-xl border border-border" />
          ) : (
            <p className="text-sm text-muted-foreground">Alex will email you a booking link within a day. Questions? <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p>
          )}
        </section>
      )}
    </div>
  );
}

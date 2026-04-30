import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAccountType } from "@/hooks/useAccountType";
import { writeImpersonation } from "@/components/agency/AgencyImpersonationBanner";
import { toast } from "sonner";
import { Plus, LogIn, Trash2, Users, DollarSign, TrendingUp, Wallet } from "lucide-react";

type Client = {
  id: string;
  client_name: string;
  client_email: string;
  status: string;
  note: string | null;
  monthly_commission: number;
  created_at: string;
  activated_at: string | null;
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    trial: "bg-blue-50 text-blue-700 border-blue-200",
    removed: "bg-gray-100 text-gray-500 border-gray-200",
  };
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${map[status] ?? map.pending}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
}

export default function ClientAccounts() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: accountType, isLoading: typeLoading } = useAccountType();
  const [tab, setTab] = useState<"clients" | "earnings">("clients");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ client_name: "", client_email: "", note: "" });
  const [switching, setSwitching] = useState<string | null>(null);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["agency-clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agency_clients" as any)
        .select("*")
        .is("removed_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Client[];
    },
    enabled: accountType === "agency",
  });

  const addClient = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("agency-add-client", { body: form });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data;
    },
    onSuccess: () => {
      toast.success("Client added");
      setOpen(false);
      setForm({ client_name: "", client_email: "", note: "" });
      qc.invalidateQueries({ queryKey: ["agency-clients"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to add client"),
  });

  const removeClient = async (id: string) => {
    if (!confirm("Remove this client from your agency?")) return;
    const { error } = await supabase
      .from("agency_clients" as any)
      .update({ removed_at: new Date().toISOString(), status: "removed" })
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Client removed");
      qc.invalidateQueries({ queryKey: ["agency-clients"] });
    }
  };

  const switchTo = async (c: Client) => {
    setSwitching(c.id);
    try {
      // Capture current session so we can return later
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) throw new Error("Not signed in");
      const agencyAccess = sess.session.access_token;
      const agencyRefresh = sess.session.refresh_token;

      const { data, error } = await supabase.functions.invoke("agency-switch-client", {
        body: { client_id: c.id },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      writeImpersonation({
        client_name: c.client_name,
        client_email: c.client_email,
        agency_access_token: agencyAccess,
        agency_refresh_token: agencyRefresh,
      });

      await supabase.auth.setSession({
        access_token: (data as any).access_token,
        refresh_token: (data as any).refresh_token,
      });

      window.location.href = "/dashboard";
    } catch (e: any) {
      toast.error(e.message || "Failed to switch");
    } finally {
      setSwitching(null);
    }
  };

  if (typeLoading) {
    return <div className="p-8 text-sm text-gray-500">Loading…</div>;
  }

  if (accountType !== "agency") {
    return (
      <div className="p-8">
        <div className="snow-card p-8 max-w-xl text-center">
          <h2 className="text-xl font-semibold mb-2">Agency partners only</h2>
          <p className="text-sm text-gray-500 mb-4">
            Client Accounts is available for users who selected "Agency" during onboarding.
          </p>
          <button onClick={() => navigate("/dashboard")} className="text-sm font-medium text-primary hover:underline">
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  // Earnings calculations
  const activeClients = clients.filter(c => c.status === "active");
  const monthlyEarn = activeClients.reduce((s, c) => s + Number(c.monthly_commission || 0), 0);
  const allTime = activeClients.reduce((s, c) => {
    if (!c.activated_at) return s;
    const months = Math.max(1, Math.floor((Date.now() - new Date(c.activated_at).getTime()) / (1000 * 60 * 60 * 24 * 30)));
    return s + months * Number(c.monthly_commission || 0);
  }, 0);

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">Client Accounts</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your clients and switch between their signal feeds</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 bg-foreground text-primary-foreground hover:bg-foreground/90 transition-colors rounded-full px-4 py-2 text-sm font-semibold"
        >
          <Plus className="w-4 h-4" />
          Add Client
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-gray-100">
        {[
          { id: "clients", label: "Clients", icon: Users },
          { id: "earnings", label: "Partner Earnings", icon: Wallet },
        ].map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                active ? "border-foreground text-gray-900" : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "clients" && (
        <>
          {isLoading ? (
            <div className="text-sm text-gray-500">Loading clients…</div>
          ) : clients.length === 0 ? (
            <div className="snow-card p-10 text-center">
              <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-gray-900 mb-1">No clients yet</h3>
              <p className="text-sm text-gray-500 mb-4">Add your first client to start earning $29/month per referral.</p>
              <button onClick={() => setOpen(true)} className="text-sm font-semibold text-primary hover:underline">
                + Add your first client
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {clients.map((c) => (
                <div key={c.id} className="snow-card p-5 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{c.client_name}</h3>
                      <p className="text-xs text-gray-500 truncate">{c.client_email}</p>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>
                  {c.note && <p className="text-xs text-gray-600 line-clamp-2">{c.note}</p>}
                  <p className="text-[11px] text-gray-400">
                    Added {new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => switchTo(c)}
                      disabled={switching === c.id || c.status === "pending"}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 bg-foreground text-primary-foreground hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-md px-3 py-2 text-xs font-semibold"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      {switching === c.id ? "Switching…" : "Switch to account"}
                    </button>
                    <button
                      onClick={() => removeClient(c.id)}
                      title="Remove client"
                      className="p-2 rounded-md text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "earnings" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <EarnCard label="Total referred clients" value={String(clients.length)} icon={<Users className="w-4 h-4" />} />
            <EarnCard label="Active paying clients" value={String(activeClients.length)} icon={<TrendingUp className="w-4 h-4" />} />
            <EarnCard label="Earned this month" value={`$${monthlyEarn}`} icon={<DollarSign className="w-4 h-4" />} />
            <EarnCard label="Earned all time" value={`$${allTime}`} icon={<Wallet className="w-4 h-4" />} />
          </div>

          <div className="snow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Referrals</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50/50 text-[11px] uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="text-left font-medium px-5 py-3">Client name</th>
                    <th className="text-left font-medium px-5 py-3">Status</th>
                    <th className="text-left font-medium px-5 py-3">Monthly commission</th>
                    <th className="text-left font-medium px-5 py-3">Date referred</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {clients.length === 0 ? (
                    <tr><td colSpan={4} className="px-5 py-8 text-center text-gray-400 text-sm">No referrals yet</td></tr>
                  ) : clients.map((c) => (
                    <tr key={c.id}>
                      <td className="px-5 py-3 font-medium text-gray-900">{c.client_name}</td>
                      <td className="px-5 py-3"><StatusBadge status={c.status} /></td>
                      <td className="px-5 py-3 text-gray-700">
                        {c.status === "active" ? `$${Number(c.monthly_commission)}/mo` : "—"}
                      </td>
                      <td className="px-5 py-3 text-gray-500">
                        {new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Add Client</h2>
            <p className="text-xs text-gray-500 mb-5">We'll send them an invite to set up their Intentsly account.</p>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1.5">Client name (company)</label>
                <input
                  value={form.client_name}
                  onChange={(e) => setForm((f) => ({ ...f, client_name: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400"
                  placeholder="Acme Co"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1.5">Client email</label>
                <input
                  type="email"
                  value={form.client_email}
                  onChange={(e) => setForm((f) => ({ ...f, client_email: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400"
                  placeholder="founder@acme.com"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1.5">Note (optional)</label>
                <textarea
                  value={form.note}
                  onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 resize-none"
                  placeholder="What are they using Intentsly for?"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-6">
              <button onClick={() => setOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">Cancel</button>
              <button
                onClick={() => addClient.mutate()}
                disabled={!form.client_name || !form.client_email || addClient.isPending}
                className="px-4 py-2 text-sm font-semibold rounded-full bg-foreground text-primary-foreground hover:bg-foreground/90 disabled:opacity-50"
              >
                {addClient.isPending ? "Adding…" : "Add Client"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EarnCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="snow-card p-4">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-gray-500 font-medium mb-2">
        <span className="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center text-gray-500">{icon}</span>
        {label}
      </div>
      <p className="text-2xl font-bold tracking-tight text-gray-900">{value}</p>
    </div>
  );
}

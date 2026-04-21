import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Plus, Send, Copy, Settings as SettingsIcon, UserPlus, Loader2 } from "lucide-react";
import { useOrganization } from "@/contexts/OrganizationContext";
import { getOrgColor, getOrgInitial } from "@/lib/orgColors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CreateWorkspaceModal } from "./CreateWorkspaceModal";
import { useNavigate } from "react-router-dom";

export function OrgSwitcher({ collapsed = false }: { collapsed?: boolean }) {
  const navigate = useNavigate();
  const {
    currentOrg,
    organizations,
    members,
    pendingInvitations,
    referralCode,
    referralBalance,
    loading,
    switchOrg,
    refresh,
  } = useOrganization();

  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOut(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOut);
    return () => document.removeEventListener("mousedown", onClickOut);
  }, []);

  const referralLink = referralCode ? `https://intentsly.com?ref=${referralCode}` : "";

  const handleSwitch = async (orgId: string) => {
    if (orgId === currentOrg?.id) return;
    setSwitching(orgId);
    try {
      await switchOrg(orgId);
      toast.success("Workspace switched");
      setOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to switch");
    } finally {
      setSwitching(null);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !currentOrg) return;
    setInviting(true);
    try {
      const { error } = await supabase.functions.invoke("send-organization-invitation", {
        body: { organizationId: currentOrg.id, email: inviteEmail.trim() },
      });
      if (error) throw error;
      toast.success(`Invite sent to ${inviteEmail}`);
      setInviteEmail("");
      setInviteOpen(false);
      await refresh();
    } catch (e: any) {
      toast.error(e.message || "Failed to send invite");
    } finally {
      setInviting(false);
    }
  };

  const copyReferral = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success("Referral link copied");
  };

  if (loading) {
    return (
      <div className="px-2 py-2 flex items-center gap-2">
        <div className="w-7 h-7 rounded-md bg-foreground/10 animate-pulse" />
        {!collapsed && <div className="flex-1 h-4 bg-foreground/10 rounded animate-pulse" />}
      </div>
    );
  }

  if (!currentOrg) return null;

  return (
    <>
      <div className="relative" ref={ref}>
        {/* Trigger */}
        <button
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-foreground/5 transition-colors"
          title={collapsed ? currentOrg.name : undefined}
        >
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ background: getOrgColor(currentOrg.name) }}
          >
            {getOrgInitial(currentOrg.name)}
          </div>
          {!collapsed && (
            <>
              <span className="flex-1 text-left text-sm font-semibold text-foreground truncate">
                {currentOrg.name}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-foreground/40 shrink-0" />
            </>
          )}
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute left-0 top-full mt-2 w-[320px] z-[60] rounded-2xl bg-card text-foreground shadow-xl border border-border overflow-hidden">
            {/* Section 1 — Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-lg flex items-center justify-center text-white text-base font-bold shrink-0"
                  style={{ background: getOrgColor(currentOrg.name) }}
                >
                  {getOrgInitial(currentOrg.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-[15px] truncate text-foreground">{currentOrg.name}</p>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                      currentOrg.plan === "free"
                        ? "bg-muted text-muted-foreground"
                        : "bg-primary/10 text-primary"
                    }`}>
                      {currentOrg.plan}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {members.length} {members.length === 1 ? "member" : "members"}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => { setOpen(false); navigate("/settings"); }}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-muted hover:bg-muted/70 text-foreground text-xs font-medium py-2 rounded-lg transition-colors"
                >
                  <SettingsIcon className="w-3.5 h-3.5" /> Settings
                </button>
                <button
                  onClick={() => setInviteOpen((o) => !o)}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-muted hover:bg-muted/70 text-foreground text-xs font-medium py-2 rounded-lg transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Invite members
                </button>
              </div>

              {inviteOpen && (
                <form onSubmit={handleInvite} className="mt-3 space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="email"
                      autoFocus
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="email@company.com"
                      className="flex-1 bg-background border border-border text-foreground text-xs rounded-lg px-3 py-2 placeholder:text-muted-foreground focus:outline-none focus:border-foreground/20"
                    />
                    <button
                      type="submit"
                      disabled={inviting || !inviteEmail.trim()}
                      className="bg-foreground text-background text-xs font-semibold px-3 rounded-lg hover:bg-foreground/90 disabled:opacity-50 flex items-center gap-1"
                    >
                      {inviting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                    </button>
                  </div>
                  {pendingInvitations.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Pending</p>
                      {pendingInvitations.map((inv) => (
                        <div key={inv.id} className="flex items-center justify-between text-[11px] text-foreground/70">
                          <span className="truncate">{inv.email}</span>
                          <span className="text-muted-foreground">pending</span>
                        </div>
                      ))}
                    </div>
                  )}
                </form>
              )}
            </div>

            {/* Section 2 — Referral */}
            <div className="p-4 border-b border-border">
              <div className="rounded-xl border border-border bg-muted/40 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Referral balance</p>
                    <p className="text-xl font-bold text-foreground mt-0.5">${referralBalance.toFixed(0)}</p>
                  </div>
                  <button
                    onClick={() => toast.info("Contact support to withdraw your balance")}
                    className="text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors"
                  >
                    Withdraw →
                  </button>
                </div>
                <div className="my-3 h-px bg-border" />
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">Your referral link</p>
                <div className="flex items-center gap-1.5 bg-background border border-border rounded-md px-2 py-1.5">
                  <span className="flex-1 text-[11px] text-foreground/70 truncate font-mono">{referralLink}</span>
                  <button onClick={copyReferral} className="text-muted-foreground hover:text-foreground shrink-0">
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
                  Earn $50 for every user you refer who subscribes
                </p>
              </div>
            </div>

            {/* Section 3 — All workspaces */}
            <div className="p-3 border-b border-border max-h-[200px] overflow-y-auto">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-2 mb-1.5">
                All workspaces
              </p>
              <div className="space-y-0.5">
                {organizations.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => handleSwitch(org.id)}
                    disabled={switching === org.id}
                    className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-muted transition-colors text-left"
                  >
                    <div
                      className="w-7 h-7 rounded-md flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ background: getOrgColor(org.name) }}
                    >
                      {getOrgInitial(org.name)}
                    </div>
                    <span className="flex-1 text-sm text-foreground truncate">{org.name}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                      org.plan === "free"
                        ? "bg-muted text-muted-foreground"
                        : "bg-primary/10 text-primary"
                    }`}>
                      {org.plan}
                    </span>
                    {switching === org.id ? (
                      <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin shrink-0" />
                    ) : org.id === currentOrg.id ? (
                      <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                    ) : (
                      <span className="w-3.5 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Section 4 — Actions */}
            <div className="p-2">
              <button
                onClick={() => { setOpen(false); setCreateOpen(true); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm text-foreground/80"
              >
                <Plus className="w-4 h-4" /> Create new workspace
              </button>
              <button
                onClick={() => setInviteOpen(true)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm text-foreground/80"
              >
                <UserPlus className="w-4 h-4" /> Invite to {currentOrg.name}
              </button>
            </div>
          </div>
        )}
      </div>

      <CreateWorkspaceModal open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}

import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Flame, Sparkles, Loader2, Users, Share2, AlertCircle } from "lucide-react";
import PublicDashboardLayout from "@/components/shared/PublicDashboardLayout";
import { AuthPromptDialog } from "@/components/shared/AuthPromptDialog";
import { LinkedInIcon } from "@/components/contacts/LinkedInIcon";
import { avatarColor, timeAgo } from "@/components/contacts/types";

interface SharedLead {
  id: string;
  first_name: string;
  last_name: string | null;
  title: string | null;
  company: string | null;
  industry: string | null;
  linkedin_url: string | null;
  signal: string | null;
  signal_post_url: string | null;
  ai_score: number | null;
  signal_a_hit: boolean | null;
  signal_b_hit: boolean | null;
  signal_c_hit: boolean | null;
  relevance_tier: string | null;
  lead_status: string | null;
  imported_at: string;
  list_name: string | null;
  share_name: string | null;
  shared_count: number | null;
}

function getInitials(first: string, last: string | null) {
  return ((first?.[0] ?? "") + (last?.[0] ?? "")).toUpperCase() || "?";
}

function tierBadge(tier: string | null) {
  switch ((tier || "").toLowerCase()) {
    case "hot":
      return "bg-rose-50 text-rose-600 border-rose-200";
    case "warm":
      return "bg-amber-50 text-amber-600 border-amber-200";
    default:
      return "bg-slate-50 text-slate-600 border-slate-200";
  }
}

export default function SharedLeads() {
  const { token } = useParams<{ token: string }>();
  const [leads, setLeads] = useState<SharedLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [invalid, setInvalid] = useState(false);
  const [shareName, setShareName] = useState<string | null>(null);
  const [isAuthed, setIsAuthed] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const fetchLeads = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_shared_leads", { _token: token });
      if (error) throw error;
      const rows = (data ?? []) as SharedLead[];
      if (rows.length === 0) {
        setInvalid(true);
      } else {
        setLeads(rows);
        setShareName(rows[0]?.share_name ?? null);
      }
    } catch (err: any) {
      console.error(err);
      setInvalid(true);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsAuthed(!!data.session?.user);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setIsAuthed(!!session?.user);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  function handleLinkedInClick(url: string | null) {
    if (!url) return;
    if (isAuthed) {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      setAuthOpen(true);
    }
  }

  function handleSignalClick(url: string | null) {
    if (!url) {
      if (!isAuthed) setAuthOpen(true);
      return;
    }
    if (isAuthed) {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      setAuthOpen(true);
    }
  }

  async function handleClaim() {
    if (!isAuthed) {
      setAuthOpen(true);
      return;
    }
    if (!token) return;
    setClaiming(true);
    try {
      const { data, error } = await supabase.functions.invoke("claim-shared-leads", {
        body: { token },
      });
      if (error) throw error;
      const inserted = (data as any)?.inserted ?? 0;
      const listName = (data as any)?.list_name ?? "Shared with me";
      toast.success(`Saved ${inserted} lead${inserted === 1 ? "" : "s"} to "${listName}"`);
    } catch (err: any) {
      toast.error(err?.message || "Could not save leads");
    } finally {
      setClaiming(false);
    }
  }

  // Invalid / expired state — no sidebar so users don't get tempted to sign up for nothing
  if (invalid && !loading) {
    return (
      <div className="min-h-screen bg-[hsl(195_14%_95%)] flex items-center justify-center px-4">
        <div className="bg-card rounded-2xl border border-border p-8 max-w-md w-full text-center">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-destructive" />
          </div>
          <h1 className="text-lg font-bold text-foreground mb-2">Link unavailable</h1>
          <p className="text-sm text-muted-foreground">
            This share link is invalid or has expired. Please ask the sender for a new link.
          </p>
        </div>
      </div>
    );
  }

  return (
    <PublicDashboardLayout shareToken={token ?? ""}>
      <div className="min-h-full bg-card rounded-2xl m-3 md:m-4 overflow-hidden">
        {/* Header */}
        <div className="border-b border-border px-4 md:px-6 py-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5 min-w-0">
              <Users className="w-4 h-4 text-muted-foreground shrink-0" />
              <h1 className="text-base font-bold text-foreground truncate">
                {shareName || "Shared leads"}
              </h1>
              <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full shrink-0">
                {leads.length}
              </span>
            </div>

            <button
              onClick={handleClaim}
              disabled={claiming || loading}
              className="flex items-center gap-1.5 text-xs font-semibold bg-foreground text-background rounded-lg px-3 py-2 hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {claiming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />}
              {isAuthed ? "Save to my Contacts" : "Sign up to save"}
            </button>
          </div>

          <div className="mt-2 px-3 py-2 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Shared with you</span> · {leads.length} lead
              {leads.length === 1 ? "" : "s"}.{" "}
              {isAuthed
                ? 'Click "Save to my Contacts" to copy them into your account.'
                : "Sign up free to open LinkedIn profiles, view signals, and save them to your account."}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : leads.length === 0 ? (
            <div className="py-20 text-center text-sm text-muted-foreground">No leads to display.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 md:px-6 py-3">
                    Name
                  </th>
                  <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-3">
                    Title
                  </th>
                  <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-3">
                    Company
                  </th>
                  <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-3">
                    Signal
                  </th>
                  <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-3">
                    Tier
                  </th>
                  <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-3">
                    List
                  </th>
                  <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-3 whitespace-nowrap">
                    Imported
                  </th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => {
                  const fullName = `${lead.first_name} ${lead.last_name ?? ""}`.trim();
                  return (
                    <tr key={lead.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-4 md:px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${avatarColor(
                              fullName,
                            )}`}
                          >
                            {getInitials(lead.first_name, lead.last_name)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-semibold text-foreground truncate">{fullName}</p>
                              {lead.linkedin_url && (
                                <button
                                  onClick={() => handleLinkedInClick(lead.linkedin_url)}
                                  className="shrink-0 hover:opacity-70 transition-opacity"
                                  title={isAuthed ? "Open LinkedIn profile" : "Sign up to view"}
                                >
                                  <LinkedInIcon className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-xs text-muted-foreground max-w-[200px] truncate">
                        {lead.title || "—"}
                      </td>
                      <td className="px-3 py-3 text-xs text-foreground max-w-[160px] truncate">
                        {lead.company || "—"}
                      </td>
                      <td className="px-3 py-3">
                        {lead.signal ? (
                          <button
                            onClick={() => handleSignalClick(lead.signal_post_url)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-medium hover:bg-primary/15 transition-colors max-w-[200px]"
                            title={isAuthed && lead.signal_post_url ? "Open source post" : "Sign up to view source"}
                          >
                            <Sparkles className="w-3 h-3 shrink-0" />
                            <span className="truncate">{lead.signal}</span>
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium capitalize ${tierBadge(
                            lead.relevance_tier,
                          )}`}
                        >
                          {lead.relevance_tier === "hot" && <Flame className="w-3 h-3" />}
                          {lead.relevance_tier || "cold"}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-muted-foreground max-w-[140px] truncate">
                        {lead.list_name || "—"}
                      </td>
                      <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {timeAgo(lead.imported_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <AuthPromptDialog open={authOpen} onOpenChange={setAuthOpen} shareToken={token ?? ""} />
    </PublicDashboardLayout>
  );
}

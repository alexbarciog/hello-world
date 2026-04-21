import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import intentslyLogo from "@/assets/intentsly-logo.png";
import { useOrganization } from "@/contexts/OrganizationContext";
import { toast } from "sonner";

interface Invitation {
  id: string;
  organization_id: string;
  email: string;
  status: string;
  expires_at: string;
  organizations: { name: string } | null;
}

export default function InviteAccept() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { refresh } = useOrganization();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authed, setAuthed] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    async function load() {
      if (!token) return;
      const { data: { session } } = await supabase.auth.getSession();
      setAuthed(!!session);

      const { data, error } = await supabase
        .from("organization_invitations")
        .select("id, organization_id, email, status, expires_at, organizations(name)")
        .eq("token", token)
        .maybeSingle();

      if (error || !data) {
        setError("This invitation link is invalid.");
      } else if (data.status !== "pending") {
        setError("This invitation has already been used or expired.");
      } else if (new Date(data.expires_at) < new Date()) {
        setError("This invitation has expired.");
      } else {
        setInvitation(data as any);
      }
      setLoading(false);
    }
    load();
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    setAccepting(true);
    try {
      const { error } = await supabase.functions.invoke("accept-organization-invitation", {
        body: { token },
      });
      if (error) throw error;
      await refresh();
      setDone(true);
      toast.success(`Joined ${invitation?.organizations?.name}`);
      setTimeout(() => navigate("/dashboard"), 1200);
    } catch (e: any) {
      toast.error(e.message || "Failed to accept invitation");
    } finally {
      setAccepting(false);
    }
  };

  const orgName = invitation?.organizations?.name || "this workspace";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(195_14%_95%)] px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <Link to="/" className="flex justify-center mb-6">
          <img src={intentslyLogo} alt="Intentsly" className="h-7" />
        </Link>

        {loading ? (
          <div className="flex flex-col items-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-foreground/40" />
            <p className="text-sm text-foreground/60 mt-3">Loading invitation…</p>
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="font-semibold text-gray-900">{error}</p>
            <Button onClick={() => navigate("/")} variant="ghost" className="mt-4">Go home</Button>
          </div>
        ) : done ? (
          <div className="text-center py-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <p className="font-semibold text-gray-900">You've joined {orgName}</p>
            <p className="text-sm text-foreground/60 mt-1">Redirecting to your dashboard…</p>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-bold text-center text-gray-900">
              You're invited to join <span className="text-primary">{orgName}</span>
            </h1>
            <p className="text-sm text-foreground/60 text-center mt-2">
              Invitation sent to <strong>{invitation?.email}</strong>
            </p>

            <div className="mt-6">
              {authed ? (
                <Button onClick={handleAccept} disabled={accepting} className="w-full">
                  {accepting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Accept invitation
                </Button>
              ) : (
                <div className="space-y-2">
                  <Button asChild className="w-full">
                    <Link to={`/register?invite_org=${token}&email=${encodeURIComponent(invitation?.email || "")}`}>
                      Create account to join
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" className="w-full">
                    <Link to={`/login?redirect=/invite/${token}`}>Log in to accept</Link>
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

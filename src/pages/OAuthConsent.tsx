import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import intentslyIcon from "@/assets/intentsly-icon.png";

// Consent screen for the Supabase OAuth 2.1 server: Claude (or another MCP
// client) sends the user here with ?authorization_id=… after they add the
// Intentsly connector. Approving returns them to the client with a code.

type Details = {
  authorization_id: string;
  redirect_uri: string;
  client: { id: string; name: string; uri: string; logo_uri: string };
  user: { id: string; email: string };
  scope: string;
};

const CAN_DO = [
  "See your leads, their buying signals, lists and signal agents",
  "See your campaigns, results, meetings and LinkedIn conversations",
  "Approve or reject leads and add them to campaigns",
  "Start or pause campaigns and signal agents",
  "Send LinkedIn messages from your connected account",
];

export default function OAuthConsent() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id");
  const [details, setDetails] = useState<Details | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"approve" | "deny" | null>(null);

  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex";
    document.head.appendChild(meta);
    const previousTitle = document.title;
    document.title = "Connect to Intentsly";
    return () => {
      meta.remove();
      document.title = previousTitle;
    };
  }, []);

  useEffect(() => {
    if (!authorizationId) {
      setError("This link is missing its authorization request. Start connecting again from Claude.");
      return;
    }
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const back = `/oauth/consent?authorization_id=${encodeURIComponent(authorizationId)}`;
        navigate(`/login?redirect=${encodeURIComponent(back)}`, { replace: true });
        return;
      }
      const { data, error: err } = await supabase.auth.oauth.getAuthorizationDetails(authorizationId);
      if (cancelled) return;
      if (err || !data) {
        setError(err?.message || "This authorization request is invalid or has expired. Start connecting again from Claude.");
        return;
      }
      // Already approved before: Supabase hands back the redirect straight away.
      if (!("authorization_id" in data)) {
        window.location.assign(data.redirect_url);
        return;
      }
      setDetails(data as Details);
    })();
    return () => { cancelled = true; };
  }, [authorizationId, navigate]);

  async function decide(decision: "approve" | "deny") {
    if (!authorizationId) return;
    setBusy(decision);
    const { data, error: err } = decision === "approve"
      ? await supabase.auth.oauth.approveAuthorization(authorizationId)
      : await supabase.auth.oauth.denyAuthorization(authorizationId);
    if (err || !data?.redirect_url) {
      setBusy(null);
      setError(err?.message || "Something went wrong. Start connecting again from Claude.");
      return;
    }
    window.location.assign(data.redirect_url);
  }

  async function switchAccount() {
    await supabase.auth.signOut();
    const back = `/oauth/consent?authorization_id=${encodeURIComponent(authorizationId ?? "")}`;
    navigate(`/login?redirect=${encodeURIComponent(back)}`, { replace: true });
  }

  const clientName = details?.client?.name || "This app";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="px-8 py-5">
        <Link to="/" className="flex items-center gap-2">
          <img src={intentslyIcon} alt="Intentsly" className="w-7 h-7 object-contain" />
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md">
          {error ? (
            <div className="text-center">
              <h1 className="text-2xl font-normal text-foreground tracking-tight mb-3">Can't connect</h1>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          ) : !details ? (
            <div className="flex justify-center py-16" aria-label="Loading">
              <svg className="w-6 h-6 animate-spin text-muted-foreground" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-normal text-foreground tracking-tight mb-2">
                  Allow {clientName} to use Intentsly?
                </h1>
                <p className="text-sm text-muted-foreground">
                  {clientName} will act as <span className="font-medium text-foreground">{details.user.email}</span> in your
                  current workspace.
                </p>
              </div>

              <div className="border border-border rounded-xl p-5 mb-4">
                <p className="text-sm font-medium text-foreground mb-3">It will be able to:</p>
                <ul className="space-y-2">
                  {CAN_DO.map((item) => (
                    <li key={item} className="flex gap-2.5 text-sm text-muted-foreground">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4 mt-0.5 shrink-0 text-foreground">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-xs text-muted-foreground mb-6">
                LinkedIn messages and campaign invitations count against your account's daily LinkedIn safety limits,
                the same as in the app. You can disconnect any time in Claude's connector settings.
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => decide("deny")}
                  disabled={busy !== null}
                  className="flex-1 py-2.5 rounded-lg border border-border bg-background hover:bg-muted/50 text-sm font-medium text-foreground transition-colors disabled:opacity-60"
                >
                  {busy === "deny" ? "Cancelling…" : "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={() => decide("approve")}
                  disabled={busy !== null}
                  className="flex-1 py-2.5 rounded-lg bg-foreground text-background hover:opacity-90 text-sm font-semibold transition-all disabled:opacity-60"
                >
                  {busy === "approve" ? "Connecting…" : "Allow"}
                </button>
              </div>

              <p className="text-center text-xs text-muted-foreground mt-6">
                Not you?{" "}
                <button type="button" onClick={switchAccount} className="font-medium text-foreground hover:underline">
                  Use another account
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

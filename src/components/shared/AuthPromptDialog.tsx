import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AuthPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareToken: string;
  message?: string;
}

const PENDING_KEY = "intentsly_pending_share_token";

export function AuthPromptDialog({ open, onOpenChange, shareToken, message }: AuthPromptDialogProps) {
  const navigate = useNavigate();

  function handleAuth(path: "/login" | "/register") {
    try {
      localStorage.setItem(PENDING_KEY, shareToken);
    } catch {
      /* ignore */
    }
    const redirect = encodeURIComponent(`/shared/leads/${shareToken}`);
    navigate(`${path}?redirect=${redirect}&claim=1`);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <DialogTitle className="text-center">Sign up to view this</DialogTitle>
          <DialogDescription className="text-center">
            {message ??
              "Create a free Intentsly account to see this lead's full profile, signal source, and save them to your contacts."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 mt-2">
          <button
            onClick={() => handleAuth("/register")}
            className="w-full py-2.5 rounded-lg bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Sign up free
          </button>
          <button
            onClick={() => handleAuth("/login")}
            className="w-full py-2.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
          >
            Log in
          </button>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-2">
          ✨ No credit card required · Leads will be saved to your account
        </p>
      </DialogContent>
    </Dialog>
  );
}

export const PENDING_SHARE_TOKEN_KEY = PENDING_KEY;

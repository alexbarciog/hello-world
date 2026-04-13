import { useNavigate } from "react-router-dom";
import { CreditCard, AlertTriangle, Check } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

export function SubscriptionBanner() {
  const navigate = useNavigate();
  const { subscribed, hadSubscription, hasCard, loading } = useSubscription();

  if (loading) return null;

  // Active subscription — no banner
  if (subscribed) return null;

  // Canceled subscription
  if (hadSubscription && !subscribed) {
    return (
      <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-amber-50/80 border border-amber-200/60 backdrop-blur-sm mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-amber-800">Your subscription has been canceled</p>
            <p className="text-xs text-amber-600">Your agents and campaigns are paused. Resubscribe to continue.</p>
          </div>
        </div>
        <button
          onClick={() => navigate("/billing")}
          className="shrink-0 px-5 py-2 rounded-full text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 transition-colors shadow-sm"
        >
          Resubscribe
        </button>
      </div>
    );
  }

  // Card on file, no subscription yet (free trial mode)
  if (hasCard && !subscribed) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/60 backdrop-blur-sm mb-8">
        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
          <Check className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-emerald-800">Free until your first meeting</p>
          <p className="text-xs text-emerald-600">Card on file — you won't be charged until a meeting is booked</p>
        </div>
      </div>
    );
  }

  // No card at all
  if (!hasCard) {
    return (
      <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-md-primary/5 border border-md-primary/15 backdrop-blur-sm mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-md-primary/10 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-md-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-md-on-surface">Add your payment method to activate AI agents</p>
            <p className="text-xs text-md-on-surface-variant">No charges until your first meeting is booked</p>
          </div>
        </div>
        <button
          onClick={() => navigate("/billing")}
          className="shrink-0 brand-gradient-button text-white px-5 py-2 rounded-full text-sm font-bold shadow-sm hover:scale-[1.02] transition-transform"
        >
          Add Card
        </button>
      </div>
    );
  }

  return null;
}

import { useNavigate } from "react-router-dom";
import { CreditCard, AlertTriangle, Check } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

export function SubscriptionBanner() {
  const navigate = useNavigate();
  const { subscribed, hadSubscription, hasCard, loading } = useSubscription();

  if (loading || subscribed) return null;

  if (hadSubscription && !subscribed) {
    return (
      <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-white border-l-[3px] border-l-amber-400 border border-gray-200/60 shadow-sm mb-6">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          <div>
            <p className="text-[13px] font-medium text-gray-900">Subscription canceled</p>
            <p className="text-[11px] text-gray-500">Agents and campaigns are paused</p>
          </div>
        </div>
        <button
          onClick={() => navigate("/billing")}
          className="shrink-0 px-4 py-1.5 rounded-lg text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 transition-colors"
        >
          Resubscribe
        </button>
      </div>
    );
  }

  if (hasCard && !subscribed) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-white border-l-[3px] border-l-emerald-400 border border-gray-200/60 shadow-sm mb-6">
        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
        <div>
          <p className="text-[13px] font-medium text-gray-900">Free until your first meeting</p>
          <p className="text-[11px] text-gray-500">Card on file — no charges until a meeting is booked</p>
        </div>
      </div>
    );
  }

  if (!hasCard) {
    return (
      <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-white border-l-[3px] border-l-blue-400 border border-gray-200/60 shadow-sm mb-6">
        <div className="flex items-center gap-3">
          <CreditCard className="w-4 h-4 text-blue-500 shrink-0" />
          <div>
            <p className="text-[13px] font-medium text-gray-900">Add payment method to activate AI agents</p>
            <p className="text-[11px] text-gray-500">No charges until your first meeting is booked</p>
          </div>
        </div>
        <button
          onClick={() => navigate("/billing")}
          className="shrink-0 px-4 py-1.5 rounded-lg text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 transition-colors"
        >
          Add Card
        </button>
      </div>
    );
  }

  return null;
}

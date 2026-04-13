import { useNavigate } from "react-router-dom";
import { Users, ArrowRight } from "lucide-react";

function LeadAvatar({ initials, color }: { initials: string; color: string }) {
  return (
    <div
      className="w-9 h-9 rounded-lg flex items-center justify-center text-[11px] font-semibold text-white shrink-0"
      style={{ background: color }}
    >
      {initials}
    </div>
  );
}

const avatarColors = ["#6366f1", "#8b5cf6", "#0ea5e9", "#14b8a6", "#f59e0b"];

function TierDot({ tier }: { tier: string }) {
  const color = tier === "hot" ? "bg-emerald-400" : tier === "warm" ? "bg-amber-400" : "bg-gray-300";
  return <span className={`w-2 h-2 rounded-full ${color} shrink-0`} />;
}

interface Lead {
  name: string;
  title: string | null;
  company: string | null;
  score: number;
  relevance_tier: string;
  linkedin_url: string | null;
  signal: string | null;
  signal_post_url: string | null;
}

interface HotLeadsListProps {
  leads: Lead[];
  loading: boolean;
}

export function HotLeadsList({ leads, loading }: HotLeadsListProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-snow-bg-2 rounded-[20px] p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-900">Hot Leads</h2>
        <button
          onClick={() => navigate("/contacts")}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          View all
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-100 animate-pulse" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-28 bg-gray-100 rounded animate-pulse" />
                <div className="h-2.5 w-20 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : leads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
            <Users className="w-5 h-5 text-gray-300" />
          </div>
          <p className="text-xs text-gray-400 text-center">
            AI agents will surface hot leads here
          </p>
          <button
            onClick={() => navigate("/signals")}
            className="text-xs font-medium text-gray-900 hover:underline mt-1"
          >
            Go to Signals →
          </button>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {leads.map((lead, i) => {
            const initials = lead.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
            return (
              <div
                key={i}
                className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors cursor-pointer"
                onClick={() => lead.linkedin_url && window.open(lead.linkedin_url, "_blank")}
              >
                <LeadAvatar initials={initials} color={avatarColors[i % avatarColors.length]} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-gray-900 truncate">{lead.name}</p>
                  <p className="text-[11px] text-gray-400 truncate">
                    {[lead.title, lead.company].filter(Boolean).join(" · ") || "No details"}
                  </p>
                </div>
                <TierDot tier={lead.relevance_tier} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

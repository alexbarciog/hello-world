import { useNavigate } from "react-router-dom";
import { Users, Zap, Rocket } from "lucide-react";

function HeatDots({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[0, 1, 2].map((i) => (
        <span key={i} className="text-sm" style={{ opacity: i < count ? 1 : 0.2 }}>🔥</span>
      ))}
    </div>
  );
}

function LeadAvatar({ initials, color }: { initials: string; color: string }) {
  return (
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-md"
      style={{ background: color }}
    >
      {initials}
    </div>
  );
}

const avatarColors = [
  "hsl(var(--md-primary))",
  "hsl(var(--md-secondary))",
  "hsl(var(--md-tertiary))",
];

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
    <div className="glass-card rounded-[2rem] p-6 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-md-on-surface tracking-tight">Latest Hot Leads</h2>
        <button onClick={() => navigate("/contacts")} className="text-sm font-bold text-md-primary hover:underline">
          View CRM
        </button>
      </div>
      <div className="space-y-2">
        {loading ? (
          <div className="space-y-3 py-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <div className="w-10 h-10 rounded-xl bg-md-surface-container animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-32 bg-md-surface-container rounded animate-pulse" />
                  <div className="h-2.5 w-24 bg-md-surface-container rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-md-primary/10 flex items-center justify-center">
              <Users className="w-7 h-7 text-md-primary" />
            </div>
            <p className="text-sm text-md-on-surface-variant text-center max-w-[220px]">
              Your AI agents will surface hot leads here
            </p>
            <button
              onClick={() => navigate("/signals")}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold text-md-primary border border-md-primary/30 hover:bg-md-primary/5 transition-colors"
            >
              <Rocket className="w-4 h-4" />
              Go to Signals
            </button>
          </div>
        ) : (
          leads.map((lead, i) => {
            const initials = lead.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
            const heat = lead.relevance_tier === "hot" ? 3 : lead.relevance_tier === "warm" ? 2 : 1;
            return (
              <div
                key={i}
                className="group flex items-start justify-between p-3 rounded-xl bg-white/30 border border-transparent hover:border-white/60 hover:bg-white/60 transition-all duration-500 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <LeadAvatar initials={initials} color={avatarColors[i % avatarColors.length]} />
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-green-500 border-2 border-white flex items-center justify-center shadow-sm">
                      <Zap className="w-2 h-2 text-white" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-md-on-surface text-sm">{lead.name}</span>
                      {lead.linkedin_url && (
                        <a href={lead.linkedin_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-[#0A66C2] hover:text-[#004182] transition-colors">
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                        </a>
                      )}
                    </div>
                    <div className="text-xs font-light text-md-on-surface-variant line-clamp-2">
                      {[lead.title, lead.company].filter(Boolean).join(" · ") || "No details"}
                    </div>
                    {lead.signal && (
                      lead.signal_post_url ? (
                        <a href={lead.signal_post_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-xs text-md-primary/80 line-clamp-1 mt-0.5 hover:underline">
                          ⚡ {lead.signal}
                        </a>
                      ) : (
                        <div className="text-xs text-md-primary/70 line-clamp-1 mt-0.5">
                          ⚡ {lead.signal}
                        </div>
                      )
                    )}
                  </div>
                </div>
                <HeatDots count={heat} />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

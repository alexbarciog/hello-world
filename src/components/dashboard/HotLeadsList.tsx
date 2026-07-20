import { useNavigate } from "react-router-dom";
import { openExternal } from "@/lib/openExternal";
import { Users, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;

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
  const color = tier === "hot" ? "bg-red-500" : tier === "warm" ? "bg-amber-400" : "bg-blue-300";
  return <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${color}`} />;
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
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="rounded-[20px] p-5 bg-white border border-neutral-200/70 shadow-[0_1px_2px_rgba(10,10,10,0.03)] hover:shadow-[0_10px_30px_-12px_rgba(10,10,10,0.15)] transition-shadow"
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-900">Hot Leads</h2>
        <motion.button
          whileHover={{ x: 2 }}
          onClick={() => navigate("/contacts")}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          View all
          <ArrowRight className="w-3 h-3" />
        </motion.button>
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
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05, ease: EASE }}
                whileHover={{ x: 2 }}
                className="group flex items-center gap-3 py-3 first:pt-0 last:pb-0 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors cursor-pointer"
                onClick={() => openExternal(lead.linkedin_url)}
              >
                <motion.div className="relative" whileHover={{ scale: 1.08 }} transition={{ type: "spring", stiffness: 300, damping: 18 }}>
                  <LeadAvatar initials={initials} color={avatarColors[i % avatarColors.length]} />
                  <TierDot tier={lead.relevance_tier} />
                </motion.div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-gray-900 truncate group-hover:text-black transition-colors">{lead.name}</p>
                  <p className="text-[11px] text-gray-400 truncate">
                    {[lead.title, lead.company].filter(Boolean).join(" · ") || "No details"}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

export interface Contact {
  id: string;
  first_name: string;
  last_name: string | null;
  linkedin_url: string | null;
  title: string | null;
  company: string | null;
  industry: string | null;
  company_icon_color: string | null;
  signal: string | null;
  signal_post_url: string | null;
  ai_score: number;
  signal_a_hit: boolean;
  signal_b_hit: boolean;
  signal_c_hit: boolean;
  email: string | null;
  email_enriched: boolean;
  list_name: string | null;
  imported_at: string;
  relevance_tier: 'hot' | 'warm' | 'cold';
  lead_status: string;
}

export interface ContactList {
  id: string;
  name: string;
  description: string | null;
  source_agent_id: string | null;
  created_at: string;
  contact_count?: number;
}

export const AVATAR_COLORS = [
  "bg-orange-500", "bg-blue-500", "bg-green-500",
  "bg-purple-500", "bg-pink-500", "bg-teal-500",
  "bg-red-500", "bg-indigo-500",
];

export function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function getInitials(c: Contact) {
  return (c.first_name[0] + (c.last_name?.[0] || "")).toUpperCase();
}

export function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export const DOT_COLORS: Record<string, string> = {
  orange: "bg-orange-400",
  green: "bg-green-400",
  blue: "bg-blue-400",
  purple: "bg-purple-400",
  pink: "bg-pink-400",
};

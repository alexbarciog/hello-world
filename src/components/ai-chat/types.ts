export interface SearchCriteria {
  role?: string;
  industries?: string[];
  locations?: string[];
  company_sizes?: string[];
  exclude_keywords?: string[];
  intent_keywords?: string[];
  /** Free-form description of the user's offering — used by the buyer-intent classifier */
  selling?: string;
}

export interface LeadResult {
  linkedin_url: string;
  first_name: string;
  last_name: string;
  full_name: string;
  title: string;
  company: string;
  location: string;
  avatar_url?: string;
  match_score: number;
  /** 0-100 — how likely this person personally has buying authority at their company */
  decisioner_score?: number;
  reasons: string[];
  signal_post_url?: string;
  signal_post_excerpt?: string;
}

export interface ChatMessageData {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  quick_replies?: string[] | null;
  attachment?: { type: "leads"; data: LeadResult[] } | null;
  criteria_snapshot?: SearchCriteria | null;
  created_at: string;
}

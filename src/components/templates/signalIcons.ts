import { Eye, Hash, MessageSquareText, Swords, ThumbsUp, UserPlus, UserRoundCheck, Users, type LucideIcon } from "lucide-react";

/** Tiny icon per signal type (only the ones a template enables are shown). */
export const SIGNAL_ICONS: Record<string, LucideIcon> = {
  keyword_posts: MessageSquareText,
  post_engagers: ThumbsUp,
  hashtag_engagement: Hash,
  profile_engagers: Users,
  competitor_followers: Swords,
  competitor_engagers: Swords,
  job_changes: UserRoundCheck,
  profile_viewers: Eye,
  company_followers: UserPlus,
};

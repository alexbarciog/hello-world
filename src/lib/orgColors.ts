const ORG_COLORS = [
  "#6366F1", "#8B5CF6", "#EC4899", "#EF4444",
  "#F59E0B", "#10B981", "#3B82F6", "#14B8A6",
];

export function getOrgColor(name: string): string {
  let hash = 0;
  for (const char of name || "") hash = char.charCodeAt(0) + ((hash << 5) - hash);
  return ORG_COLORS[Math.abs(hash) % ORG_COLORS.length];
}

export function getOrgInitial(name: string): string {
  return (name?.trim()?.[0] || "?").toUpperCase();
}

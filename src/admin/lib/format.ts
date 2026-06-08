const COMMUNITY_LABELS: Record<string, string> = {
  armenian: "Armenian",
  iranian: "Iranian",
  sikh: "Sikh",
};

export function formatCommunity(community: string): string {
  return COMMUNITY_LABELS[community] ?? community;
}

export function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString();
}

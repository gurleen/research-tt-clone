export function formatCount(count: number): string {
  if (count >= 1_000_000) {
    const val = count / 1_000_000;
    return val % 1 === 0 ? `${val}M` : `${val.toFixed(1)}M`;
  }
  if (count >= 1_000) {
    const val = count / 1_000;
    return val % 1 === 0 ? `${val}K` : `${val.toFixed(1)}K`;
  }
  return String(count);
}

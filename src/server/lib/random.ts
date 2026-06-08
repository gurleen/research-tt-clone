/** Pick n distinct items from array using Fisher-Yates partial shuffle. */
export function sampleWithoutReplacement<T>(items: T[], count: number): T[] {
  if (count > items.length) {
    throw new Error(
      `Not enough items to sample: need ${count}, have ${items.length}`,
    );
  }

  const pool = [...items];
  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(Math.random() * (pool.length - i));
    const tmp = pool[i]!;
    pool[i] = pool[j]!;
    pool[j] = tmp;
  }

  return pool.slice(0, count);
}

export function randomIntInclusive(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

export function shuffleInPlace<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = items[i]!;
    items[i] = items[j]!;
    items[j] = tmp;
  }
  return items;
}

export function calcNewPosition(
  sorted: { order: number }[],
  toIndex: number
): number {
  if (sorted.length === 0) return 1000;
  if (toIndex <= 0) return sorted[0].order / 2;
  if (toIndex >= sorted.length) return sorted[sorted.length - 1].order + 1000;
  return (sorted[toIndex - 1].order + sorted[toIndex].order) / 2;
}

export function needsRebalance(sorted: { order: number }[]): boolean {
  return sorted.some((item, i) =>
    i > 0 && item.order - sorted[i - 1].order < 0.001
  );
}
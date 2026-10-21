import type { Percentiles } from './types.ts';

/** Nearest-rank percentile on a copy of the input; null for empty input. */
export function percentile(values: number[], p: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.ceil((p / 100) * sorted.length);
  return sorted[Math.min(sorted.length - 1, Math.max(0, rank - 1))];
}

export function percentiles(values: number[]): Percentiles {
  return { p50: percentile(values, 50), p95: percentile(values, 95) };
}

export function round1(n: number | null): number | null {
  return n == null ? null : Math.round(n * 10) / 10;
}

export function mostCommon<T extends string>(values: (T | null | undefined)[]): T | null {
  const counts = new Map<T, number>();
  for (const v of values) if (v != null) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best: T | null = null;
  let bestN = 0;
  for (const [k, n] of counts) if (n > bestN) { best = k; bestN = n; }
  return best;
}

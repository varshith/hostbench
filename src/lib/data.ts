import latestJson from '../../data/rollups/latest.json';
import pipelineJson from '../../config/pipeline.json';
import type { LatestRollups, MonthlyReport, SeriesFile, TargetRollup, WindowStats } from '../../scripts/lib/types.ts';

export const latest = latestJson as unknown as LatestRollups;
export const pipeline = pipelineJson as unknown as { comparePairs: [string, string][]; cadence: string };

const seriesModules = import.meta.glob<SeriesFile>('../../data/series/*.json', { eager: true, import: 'default' });
const monthlyModules = import.meta.glob<MonthlyReport>('../../data/rollups/monthly/*.json', { eager: true, import: 'default' });

export const series: Record<string, SeriesFile> = Object.fromEntries(
  Object.values(seriesModules).map((s) => [s.slug, s]),
);

export const monthlyReports: MonthlyReport[] = Object.values(monthlyModules).sort((a, b) => b.month.localeCompare(a.month));

export function targetBySlug(slug: string): TargetRollup | undefined {
  return latest.targets.find((t) => t.slug === slug);
}

/** True when a target has at least one up sample in the window; otherwise pages show "collecting". */
export function hasData(stats: WindowStats | undefined): stats is WindowStats {
  return Boolean(stats && stats.up > 0);
}

/** Every counted sample failed. The narrower predicate keeps WindowStats in the false branch, so test it before hasData. */
export function isDown(stats: WindowStats | undefined): stats is WindowStats & { up: 0 } {
  return Boolean(stats && stats.up === 0 && stats.down > 0);
}

export const NO_SUCCESS = 'no successful samples';

/** Monthly report rows carry no up/down counts, so 0% availability over n > 0 samples is the down signal. */
export function isDownSummary(row: { availability: number | null; n: number }): boolean {
  return row.availability === 0 && row.n > 0;
}

export function fmtMs(v: number | null | undefined): string {
  return v == null ? 'collecting' : `${Math.round(v)} ms`;
}

export function fmtPct(v: number | null | undefined): string {
  return v == null ? 'collecting' : `${v.toFixed(1)}%`;
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return 'never';
  return new Date(iso).toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
}

export function regionLabel(id: string): string {
  return latest.regions.find((r) => r.id === id)?.label ?? id;
}

/** Leaderboard order: global 7d ttfb p50 ascending, targets without data last. */
export function leaderboard(): TargetRollup[] {
  return [...latest.targets].sort((a, b) => (a.global['7d']?.ttfb.p50 ?? Infinity) - (b.global['7d']?.ttfb.p50 ?? Infinity));
}

export function monthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

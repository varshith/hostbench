import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { RAW_DIR } from './config.ts';
import type { RawSample } from './types.ts';

export function rawFileFor(date: Date): string {
  return resolve(RAW_DIR, `${date.toISOString().slice(0, 10)}.jsonl`);
}

export function appendSamples(samples: RawSample[], date: Date): string {
  mkdirSync(RAW_DIR, { recursive: true });
  const file = rawFileFor(date);
  appendFileSync(file, samples.map((s) => JSON.stringify(s)).join('\n') + '\n');
  return file;
}

/** Loads samples from raw files whose date is on or after `since` (UTC date). */
export function loadSamplesSince(since: Date): RawSample[] {
  if (!existsSync(RAW_DIR)) return [];
  const sinceKey = since.toISOString().slice(0, 10);
  const out: RawSample[] = [];
  for (const f of readdirSync(RAW_DIR).sort()) {
    if (!f.endsWith('.jsonl') || f.slice(0, 10) < sinceKey) continue;
    for (const line of readFileSync(resolve(RAW_DIR, f), 'utf8').split('\n')) {
      if (!line.trim()) continue;
      try {
        out.push(JSON.parse(line) as RawSample);
      } catch {
        // A truncated line from an interrupted run must not poison the whole rollup.
      }
    }
  }
  return out;
}

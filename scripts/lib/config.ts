import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { MeasurementKind, PipelineConfig, RegionConfig, TargetConfig } from './types.ts';

export const ROOT = resolve(import.meta.dirname, '..', '..');
export const DATA_DIR = resolve(ROOT, 'data');
export const RAW_DIR = resolve(DATA_DIR, 'raw');
export const ROLLUP_DIR = resolve(DATA_DIR, 'rollups');
export const SERIES_DIR = resolve(DATA_DIR, 'series');
export const RUNS_FILE = resolve(DATA_DIR, 'runs.jsonl');

function readJson<T>(rel: string): T {
  return JSON.parse(readFileSync(resolve(ROOT, rel), 'utf8')) as T;
}

export function loadTargets(): TargetConfig[] {
  return readJson<{ targets: TargetConfig[] }>('config/targets.json').targets;
}

export function loadRegions(): RegionConfig[] {
  return readJson<{ regions: RegionConfig[] }>('config/regions.json').regions;
}

export function loadPipeline(): PipelineConfig {
  return readJson<PipelineConfig>('config/pipeline.json');
}

export function measurementKind(t: TargetConfig): MeasurementKind {
  return t.controlledUrl ? 'controlled' : 'reference';
}

export function probeUrl(t: TargetConfig): string {
  return t.controlledUrl ?? t.referenceUrl;
}

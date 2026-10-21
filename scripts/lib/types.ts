export type PlatformType = 'static' | 'paas' | 'edge';
export type MeasurementKind = 'controlled' | 'reference';
export type Http3Status = 'advertised' | 'not-advertised' | 'unknown';
export type Outcome = 'up' | 'down' | 'indeterminate';

export interface TargetConfig {
  slug: string;
  name: string;
  vendorUrl: string;
  platformType: PlatformType;
  deployRegion: string | null;
  controlledUrl: string | null;
  referenceUrl: string;
  referenceDescription: string;
  /** Per-target override of pipeline.globalping.protocol, e.g. HTTPS for hosts without HTTP/2. */
  protocol: 'HTTP' | 'HTTPS' | 'HTTP2' | null;
  hasAffiliate: boolean;
  affiliateUrl: string | null;
  affiliateProgram: string | null;
  notes: string | null;
}

export interface RegionConfig {
  id: string;
  label: string;
  country: string;
  location: { country: string; state?: string; limit: number };
}

export interface PipelineConfig {
  globalping: {
    apiBase: string;
    protocol: 'HTTP' | 'HTTPS' | 'HTTP2';
    method: 'GET' | 'HEAD' | 'OPTIONS';
    probeTimeoutSeconds: number;
    pollIntervalMs: number;
    pollTimeoutMs: number;
    delayBetweenTargetsMs: number;
    minRemainingTestsToStart: number;
  };
  cadence: string;
  rollupWindows: Record<string, number>;
  seriesDays: number;
  comparePairs: [string, string][];
}

export interface Timings {
  dns: number | null;
  tcp: number;
  tls: number | null;
  firstByte: number;
  download: number;
  total: number;
}

/** One line in data/raw/YYYY-MM-DD.jsonl. */
export interface RawSample {
  ts: string;
  runId: string;
  target: string;
  measurementKind: MeasurementKind;
  url: string;
  measurementId: string;
  region: string;
  probe: { continent: string; country: string; state: string | null; city: string; asn: number; network: string };
  requestedProtocol: string;
  status: 'finished' | 'failed' | 'offline';
  failureSource: 'target' | 'resolver' | 'internal' | null;
  statusCode: number | null;
  outcome: Outcome;
  timings: Timings | null;
  /** dns + tcp + tls + firstByte: request-level time to first byte. */
  ttfb: number | null;
  httpVersion: string | null;
  http3: Http3Status;
  altSvc: string | null;
  server: string | null;
  cacheStatus: string | null;
  tls: { protocol: string; cipherName: string; authorized: boolean } | null;
  resolvedAddress: string | null;
  error: string | null;
}

export interface Percentiles { p50: number | null; p95: number | null }

export interface WindowStats {
  n: number;
  up: number;
  down: number;
  indeterminate: number;
  availability: number | null;
  ttfb: Percentiles;
  firstByte: Percentiles;
  total: Percentiles;
  dns: Percentiles;
  tcp: Percentiles;
  tls: Percentiles;
  download: Percentiles;
}

export interface TargetRollup {
  slug: string;
  name: string;
  vendorUrl: string;
  platformType: PlatformType;
  measurementKind: MeasurementKind;
  probeUrl: string;
  referenceDescription: string | null;
  deployRegion: string | null;
  hasAffiliate: boolean;
  affiliateUrl: string | null;
  affiliateProgram: string | null;
  notes: string | null;
  requestedProtocol: string | null;
  httpVersion: string | null;
  http3: Http3Status;
  server: string | null;
  tlsProtocol: string | null;
  firstSeen: string | null;
  lastSeen: string | null;
  lastUp: string | null;
  kindHistory: { kind: MeasurementKind; from: string }[];
  global: Record<string, WindowStats>;
  regions: Record<string, Record<string, WindowStats>>;
}

export interface LatestRollups {
  schemaVersion: 1;
  generatedAt: string;
  cadence: string;
  windows: string[];
  regions: { id: string; label: string; country: string }[];
  metrics: Record<string, string>;
  runs: { total: number; first: string | null; last: string | null; lastRun: RunSummary | null };
  targets: TargetRollup[];
}

export interface SeriesFile {
  slug: string;
  generatedAt: string;
  metric: 'ttfb-p50';
  days: string[];
  global: (number | null)[];
  regions: Record<string, (number | null)[]>;
  availability: (number | null)[];
}

export interface MonthlyReport {
  month: string;
  generatedAt: string;
  periodStart: string;
  periodEnd: string;
  partial: boolean;
  sampleCount: number;
  hostCount: number;
  ranking: {
    slug: string;
    name: string;
    measurementKind: MeasurementKind;
    ttfbP50: number | null;
    ttfbP95: number | null;
    totalP50: number | null;
    availability: number | null;
    n: number;
    prevTtfbP50: number | null;
    deltaTtfbP50: number | null;
  }[];
  regionLeaders: { region: string; slug: string; name: string; ttfbP50: number }[];
  regionTables: Record<string, { slug: string; name: string; ttfbP50: number | null; ttfbP95: number | null; availability: number | null; n: number }[]>;
  biggestMover: { slug: string; name: string; deltaTtfbP50: number } | null;
  changes: string[];
}

export interface RunSummary {
  runId: string;
  startedAt: string;
  finishedAt: string;
  targetsAttempted: number;
  targetsMeasured: number;
  samples: number;
  testsConsumed: number;
  rateLimitRemaining: number | null;
  authenticated: boolean;
  stoppedEarly: string | null;
  errors: { target: string; error: string }[];
}

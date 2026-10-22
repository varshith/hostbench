import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { DATA_DIR, RUNS_FILE, loadPipeline, loadRegions, loadTargets, measurementKind, probeUrl } from './lib/config.ts';
import { GlobalpingClient, GlobalpingRateLimited, type GpHttpResult, type GpLocation, type GpProbe } from './lib/globalping.ts';
import { appendSamples } from './lib/raw.ts';
import type { Http3Status, MeasurementKind, Outcome, RawSample, RegionConfig, RunSummary, TargetConfig } from './lib/types.ts';

const pipeline = loadPipeline();
const regions = loadRegions();
const targets = loadTargets();
const gp = pipeline.globalping;
const client = new GlobalpingClient(gp.apiBase, process.env.GLOBALPING_TOKEN || undefined, 'HostBench/0.1 (+https://github.com/varshith/hostbench)');

const startedAt = new Date();
const runId = new Date(Date.UTC(startedAt.getUTCFullYear(), startedAt.getUTCMonth(), startedAt.getUTCDate(), startedAt.getUTCHours())).toISOString();
const log = (msg: string) => console.log(`[measure ${new Date().toISOString()}] ${msg}`);

function headerValue(headers: Record<string, string | string[]> | undefined, name: string): string | null {
  if (!headers) return null;
  const key = Object.keys(headers).find((k) => k.toLowerCase() === name);
  if (!key) return null;
  const v = headers[key];
  return Array.isArray(v) ? v.join(', ') : v;
}

function http3From(headers: Record<string, string | string[]> | undefined): { http3: Http3Status; altSvc: string | null } {
  if (!headers) return { http3: 'unknown', altSvc: null };
  const altSvc = headerValue(headers, 'alt-svc');
  if (altSvc && /\bh3(?:-\d+)?=/.test(altSvc)) return { http3: 'advertised', altSvc };
  return { http3: 'not-advertised', altSvc };
}

function httpVersionFrom(rawOutput: string): string | null {
  const m = /^HTTP\/(\d(?:\.\d)?)\s/m.exec(rawOutput);
  if (!m) return null;
  // The status line reads "HTTP/2.0"; normalize to the conventional "HTTP/2".
  return `HTTP/${m[1].replace(/\.0$/, '')}`;
}

function outcomeFor(r: GpHttpResult, kind: MeasurementKind): Outcome {
  if (r.status === 'finished') {
    const code = r.statusCode ?? 0;
    // A redirect means our controlled page was not served (e.g. a Pages custom-domain redirect); do not count it either way.
    if (kind === 'controlled' && code >= 300 && code < 400) return 'indeterminate';
    return code >= 200 && code < 400 ? 'up' : 'down';
  }
  if (r.status === 'failed') {
    // Resolver and Globalping-internal failures are not the host's fault; only target failures count as down.
    return r.failureSource === 'resolver' || r.failureSource === 'internal' ? 'indeterminate' : 'down';
  }
  return 'indeterminate';
}

function regionFor(probe: GpProbe): string {
  const match = regions.find((r: RegionConfig) =>
    r.location.country === probe.country && (!r.location.state || r.location.state === probe.state));
  return match ? match.id : `other-${probe.country.toLowerCase()}`;
}

function toSample(target: TargetConfig, url: string, measurementId: string, protocol: string, probe: GpProbe, r: GpHttpResult): RawSample {
  const { http3, altSvc } = http3From(r.headers);
  const t = r.timings ?? null;
  const ttfb = t ? (t.dns ?? 0) + t.tcp + (t.tls ?? 0) + t.firstByte : null;
  const kind = measurementKind(target);
  const error = r.status !== 'finished' ? (r.rawOutput || r.status).trim().split('\n').slice(-1)[0].slice(0, 200)
    : kind === 'controlled' && (r.statusCode ?? 0) >= 300 && (r.statusCode ?? 0) < 400 ? `controlled page redirected (${r.statusCode})` : null;
  return {
    ts: new Date().toISOString(),
    runId,
    target: target.slug,
    measurementKind: measurementKind(target),
    url,
    measurementId,
    region: regionFor(probe),
    probe: { continent: probe.continent, country: probe.country, state: probe.state ?? null, city: probe.city, asn: probe.asn, network: probe.network },
    requestedProtocol: protocol,
    status: r.status === 'in-progress' ? 'failed' : r.status,
    failureSource: r.failureSource ?? null,
    statusCode: r.statusCode ?? null,
    outcome: outcomeFor(r, measurementKind(target)),
    timings: t,
    ttfb,
    httpVersion: r.status === 'finished' ? httpVersionFrom(r.rawOutput ?? '') : null,
    http3,
    altSvc,
    server: headerValue(r.headers, 'server'),
    cacheStatus: headerValue(r.headers, 'cf-cache-status') ?? headerValue(r.headers, 'x-vercel-cache') ?? headerValue(r.headers, 'cache-status') ?? headerValue(r.headers, 'x-cache'),
    tls: r.tls ? { protocol: r.tls.protocol, cipherName: r.tls.cipherName, authorized: r.tls.authorized } : null,
    resolvedAddress: r.resolvedAddress ?? null,
    error,
  };
}

async function measureTarget(target: TargetConfig, locations: GpLocation[], onCreated: (tests: number, remaining: number | null) => void): Promise<RawSample[]> {
  const url = probeUrl(target);
  const u = new URL(url);
  const protocol = u.protocol === 'http:' ? 'HTTP' : (target.protocol ?? gp.protocol);
  const created = await client.create({
    type: 'http',
    target: u.hostname,
    locations,
    timeout: gp.probeTimeoutSeconds,
    measurementOptions: {
      request: { path: u.pathname, method: gp.method, ...(u.search.length > 1 ? { query: u.search.slice(1) } : {}) },
      protocol,
      ...(u.port ? { port: Number(u.port) } : {}),
    },
  });
  // Tests are spent once Globalping accepts the measurement, even if polling later fails.
  onCreated(created.probesCount, created.rateLimit.remaining);
  const m = await client.waitForFinished(created.id, gp.pollIntervalMs, gp.pollTimeoutMs);
  if (process.env.HOSTBENCH_DEBUG_RAW) console.log(JSON.stringify(m.results[0], null, 1).slice(0, 2500));
  return m.results.map(({ probe, result }) => toSample(target, url, created.id, protocol, probe, result));
}

function errorMessage(e: unknown): string {
  if (!(e instanceof Error)) return String(e);
  return e.cause instanceof Error ? `${e.message} (${e.cause.message})` : e.message;
}

function priorUsableRun(id: string): RunSummary | null {
  if (!existsSync(RUNS_FILE)) return null;
  for (const line of readFileSync(RUNS_FILE, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    let run: RunSummary;
    try {
      run = JSON.parse(line) as RunSummary;
    } catch {
      continue;
    }
    if (run?.runId === id && run.targetsMeasured > 0 && run.stoppedEarly == null) return run;
  }
  return null;
}

async function main() {
  const locations: GpLocation[] = regions.map((r) => r.location);
  const testsPerTarget = locations.reduce((n, l) => n + (l.limit ?? 1), 0);
  const summary: RunSummary = {
    runId, startedAt: startedAt.toISOString(), finishedAt: '', targetsAttempted: 0, targetsMeasured: 0, samples: 0,
    testsConsumed: 0, rateLimitRemaining: null, authenticated: client.authenticated, stoppedEarly: null, errors: [],
  };
  const only = process.env.HOSTBENCH_ONLY?.split(',').filter(Boolean);
  const todo = only ? targets.filter((t) => only.includes(t.slug)) : targets;

  let limits: Awaited<ReturnType<GlobalpingClient['limits']>>;
  try {
    limits = await client.limits();
  } catch (e) {
    // Globalping unreachable: measuring now would only record an outage of ours as host failures.
    console.error(`[measure] aborting run: Globalping limits check failed: ${errorMessage(e)}`);
    process.exitCode = 1;
    return;
  }
  if (limits) {
    log(`rate limit: ${limits.remaining}/${limits.limit} tests remaining (${limits.type}), resets in ${limits.reset}s`);
    summary.rateLimitRemaining = limits.remaining;
    if (limits.remaining < Math.max(testsPerTarget, gp.minRemainingTestsToStart)) {
      summary.stoppedEarly = `insufficient rate limit before start (${limits.remaining} remaining, need ${testsPerTarget} per target)`;
    }
  }

  const prior = process.env.HOSTBENCH_FORCE === '1' ? null : priorUsableRun(runId);
  if (prior) {
    // Schedule and external dispatch can both fire in one hour; a second run would double Globalping usage.
    console.log(`[measure] skipping: hour ${runId} already measured by run started ${prior.startedAt}`);
    return;
  }

  const all: RawSample[] = [];
  if (!summary.stoppedEarly) {
    for (const target of todo) {
      summary.targetsAttempted++;
      try {
        const samples = await measureTarget(target, locations, (tests, remaining) => {
          summary.testsConsumed += tests;
          summary.rateLimitRemaining = remaining;
        });
        all.push(...samples);
        summary.targetsMeasured++;
        const up = samples.filter((s) => s.outcome === 'up').length;
        log(`${target.slug}: ${samples.length} probes, ${up} up, remaining=${summary.rateLimitRemaining}`);
      } catch (e) {
        if (e instanceof GlobalpingRateLimited) {
          summary.stoppedEarly = e.message;
          summary.rateLimitRemaining = e.rateLimit.remaining;
          log(`stopping run: ${e.message}`);
          break;
        }
        const msg = errorMessage(e);
        summary.errors.push({ target: target.slug, error: msg });
        log(`${target.slug}: ERROR ${msg}`);
      }
      await new Promise((r) => setTimeout(r, gp.delayBetweenTargetsMs));
    }
  } else {
    log(`skipping run: ${summary.stoppedEarly}`);
  }

  summary.samples = all.length;
  summary.finishedAt = new Date().toISOString();
  if (all.length) {
    const file = appendSamples(all, startedAt);
    log(`appended ${all.length} samples to ${file}`);
  }
  mkdirSync(DATA_DIR, { recursive: true });
  appendFileSync(RUNS_FILE, JSON.stringify(summary) + '\n');
  log(`run ${runId} done: ${summary.targetsMeasured}/${summary.targetsAttempted} targets, ${summary.testsConsumed} tests, ${summary.errors.length} errors${summary.stoppedEarly ? ', stopped early' : ''}`);
}

main().catch((e) => {
  console.error(`[measure] fatal: ${errorMessage(e)}`);
  if (e instanceof Error && e.stack) console.error(e.stack);
  process.exitCode = 1;
});

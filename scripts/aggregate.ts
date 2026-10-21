import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ROLLUP_DIR, RUNS_FILE, SERIES_DIR, loadPipeline, loadRegions, loadTargets, measurementKind, probeUrl } from './lib/config.ts';
import { loadSamplesSince } from './lib/raw.ts';
import { mostCommon, percentiles, round1 } from './lib/stats.ts';
import type { LatestRollups, MonthlyReport, RawSample, RunSummary, SeriesFile, TargetRollup, WindowStats } from './lib/types.ts';

const pipeline = loadPipeline();
const regions = loadRegions();
const targets = loadTargets();
const now = new Date();
const DAY = 86_400_000;

const METRICS: Record<string, string> = {
  ttfb: 'Request-level time to first byte in ms: dns + tcp + tls + firstByte. Headline metric.',
  firstByte: "Globalping's firstByte in ms: established TCP/TLS connection to first response byte. Excludes dns, tcp, tls.",
  total: 'Full request time in ms, including download.',
  dns: 'DNS lookup time in ms (null when the target was an IP).',
  tcp: 'TCP connect time in ms, measured from the end of the DNS lookup.',
  tls: 'TLS handshake time in ms, measured from the open TCP connection.',
  download: 'Time from first byte to end of body in ms.',
  availability: 'Share of samples that returned a 2xx/3xx status, over up + down samples. Indeterminate samples (Globalping resolver/internal failures) are excluded.',
  p50: 'Median over up samples in the window.',
  p95: '95th percentile (nearest rank) over up samples in the window.',
  http3: "'advertised' if any Alt-Svc header in the last 7 days contained an h3 token; 'not-advertised' if headers were seen without one; 'unknown' otherwise. Globalping does not make HTTP/3 requests, so this is never a measured value.",
  httpVersion: 'HTTP version parsed from the response status line, most common in the last 7 days. Requests ask for HTTP2 over TLS; the server may negotiate HTTP/1.1.',
};

function windowStats(samples: RawSample[]): WindowStats {
  const up = samples.filter((s) => s.outcome === 'up');
  const down = samples.filter((s) => s.outcome === 'down').length;
  const indeterminate = samples.filter((s) => s.outcome === 'indeterminate').length;
  const denom = up.length + down;
  const pick = (f: (s: RawSample) => number | null | undefined) =>
    percentiles(up.map(f).filter((v): v is number => typeof v === 'number'));
  return {
    n: samples.length,
    up: up.length,
    down,
    indeterminate,
    availability: denom ? round1((up.length / denom) * 100) : null,
    ttfb: pick((s) => s.ttfb),
    firstByte: pick((s) => s.timings?.firstByte),
    total: pick((s) => s.timings?.total),
    dns: pick((s) => s.timings?.dns),
    tcp: pick((s) => s.timings?.tcp),
    tls: pick((s) => s.timings?.tls),
    download: pick((s) => s.timings?.download),
  };
}

function inWindow(samples: RawSample[], days: number): RawSample[] {
  const since = now.getTime() - days * DAY;
  return samples.filter((s) => Date.parse(s.ts) >= since);
}

function buildTarget(slug: string, samples: RawSample[]): TargetRollup {
  const cfg = targets.find((t) => t.slug === slug)!;
  const sorted = [...samples].sort((a, b) => a.ts.localeCompare(b.ts));
  const last7 = inWindow(sorted, 7);
  const kindHistory: TargetRollup['kindHistory'] = [];
  for (const s of sorted) {
    if (kindHistory.length === 0 || kindHistory[kindHistory.length - 1].kind !== s.measurementKind) {
      kindHistory.push({ kind: s.measurementKind, from: s.ts });
    }
  }
  const http3 = last7.some((s) => s.http3 === 'advertised') ? 'advertised'
    : last7.some((s) => s.http3 === 'not-advertised') ? 'not-advertised' : 'unknown';
  const global: Record<string, WindowStats> = {};
  const perRegion: Record<string, Record<string, WindowStats>> = {};
  for (const [w, days] of Object.entries(pipeline.rollupWindows)) {
    const ws = inWindow(sorted, days);
    global[w] = windowStats(ws);
    for (const r of regions) {
      perRegion[r.id] ??= {};
      perRegion[r.id][w] = windowStats(ws.filter((s) => s.region === r.id));
    }
  }
  const ups = sorted.filter((s) => s.outcome === 'up');
  return {
    slug,
    name: cfg.name,
    vendorUrl: cfg.vendorUrl,
    platformType: cfg.platformType,
    measurementKind: measurementKind(cfg),
    probeUrl: probeUrl(cfg),
    referenceDescription: cfg.controlledUrl ? null : cfg.referenceDescription,
    deployRegion: cfg.deployRegion,
    hasAffiliate: cfg.hasAffiliate,
    affiliateUrl: cfg.affiliateUrl,
    affiliateProgram: cfg.affiliateProgram,
    notes: cfg.notes,
    requestedProtocol: mostCommon(last7.map((s) => s.requestedProtocol)),
    httpVersion: mostCommon(last7.map((s) => s.httpVersion)),
    http3,
    server: mostCommon(last7.filter((s) => s.outcome === 'up').map((s) => s.server)),
    tlsProtocol: mostCommon(last7.map((s) => s.tls?.protocol)),
    firstSeen: sorted[0]?.ts ?? null,
    lastSeen: sorted[sorted.length - 1]?.ts ?? null,
    lastUp: ups[ups.length - 1]?.ts ?? null,
    kindHistory,
    global,
    regions: perRegion,
  };
}

function dayKey(ts: string): string {
  return ts.slice(0, 10);
}

function buildSeries(slug: string, samples: RawSample[]): SeriesFile {
  const todayKey = now.toISOString().slice(0, 10);
  const earliest = samples.length ? samples.map((s) => dayKey(s.ts)).sort()[0] : todayKey;
  const floor = new Date(now.getTime() - (pipeline.seriesDays - 1) * DAY).toISOString().slice(0, 10);
  const start = earliest > floor ? earliest : floor;
  const days: string[] = [];
  for (let d = Date.parse(start); d <= Date.parse(todayKey); d += DAY) days.push(new Date(d).toISOString().slice(0, 10));
  const byDay = new Map<string, RawSample[]>();
  for (const s of samples) {
    const k = dayKey(s.ts);
    if (!byDay.has(k)) byDay.set(k, []);
    byDay.get(k)!.push(s);
  }
  const p50 = (ss: RawSample[]) => percentiles(ss.filter((s) => s.outcome === 'up' && s.ttfb != null).map((s) => s.ttfb as number)).p50;
  const avail = (ss: RawSample[]) => windowStats(ss).availability;
  const perRegion: Record<string, (number | null)[]> = {};
  for (const r of regions) perRegion[r.id] = days.map((d) => p50((byDay.get(d) ?? []).filter((s) => s.region === r.id)));
  return {
    slug,
    generatedAt: now.toISOString(),
    metric: 'ttfb-p50',
    days,
    global: days.map((d) => p50(byDay.get(d) ?? [])),
    regions: perRegion,
    availability: days.map((d) => avail(byDay.get(d) ?? [])),
  };
}

function buildMonthly(month: string, all: RawSample[]): MonthlyReport {
  const inMonth = all.filter((s) => s.ts.slice(0, 7) === month);
  const [y, m] = month.split('-').map(Number);
  const prevMonth = new Date(Date.UTC(y, m - 2, 1)).toISOString().slice(0, 7);
  const inPrev = all.filter((s) => s.ts.slice(0, 7) === prevMonth);
  const monthEnd = new Date(Date.UTC(y, m, 0, 23, 59, 59));
  const partial = monthEnd.getTime() > now.getTime();
  const sortedTs = inMonth.map((s) => s.ts).sort();
  const ranking = targets.map((t) => {
    const ss = inMonth.filter((s) => s.target === t.slug);
    const st = windowStats(ss);
    const prev = windowStats(inPrev.filter((s) => s.target === t.slug));
    const delta = st.ttfb.p50 != null && prev.ttfb.p50 != null ? st.ttfb.p50 - prev.ttfb.p50 : null;
    return {
      slug: t.slug, name: t.name, measurementKind: measurementKind(t),
      ttfbP50: st.ttfb.p50, ttfbP95: st.ttfb.p95, totalP50: st.total.p50, availability: st.availability, n: st.n,
      prevTtfbP50: prev.ttfb.p50, deltaTtfbP50: delta,
    };
  }).filter((r) => r.n > 0).sort((a, b) => (a.ttfbP50 ?? Infinity) - (b.ttfbP50 ?? Infinity));
  const regionTables: MonthlyReport['regionTables'] = {};
  const regionLeaders: MonthlyReport['regionLeaders'] = [];
  for (const r of regions) {
    const rows = targets.map((t) => {
      const st = windowStats(inMonth.filter((s) => s.target === t.slug && s.region === r.id));
      return { slug: t.slug, name: t.name, ttfbP50: st.ttfb.p50, ttfbP95: st.ttfb.p95, availability: st.availability, n: st.n };
    }).filter((x) => x.n > 0).sort((a, b) => (a.ttfbP50 ?? Infinity) - (b.ttfbP50 ?? Infinity));
    regionTables[r.id] = rows;
    const lead = rows.find((x) => x.ttfbP50 != null);
    if (lead) regionLeaders.push({ region: r.id, slug: lead.slug, name: lead.name, ttfbP50: lead.ttfbP50! });
  }
  const movers = ranking.filter((r) => r.deltaTtfbP50 != null).sort((a, b) => Math.abs(b.deltaTtfbP50!) - Math.abs(a.deltaTtfbP50!));
  const changes: string[] = [];
  for (const t of targets) {
    const kinds = [...new Set(inMonth.filter((s) => s.target === t.slug).map((s) => s.measurementKind))];
    if (kinds.length > 1) changes.push(`${t.name} moved from reference to controlled measurement during ${month}.`);
    const firstEver = all.filter((s) => s.target === t.slug).map((s) => s.ts).sort()[0];
    if (firstEver && firstEver.slice(0, 7) === month) changes.push(`${t.name} was added on ${firstEver.slice(0, 10)}.`);
  }
  return {
    month,
    generatedAt: now.toISOString(),
    periodStart: sortedTs[0] ?? `${month}-01T00:00:00.000Z`,
    periodEnd: sortedTs[sortedTs.length - 1] ?? now.toISOString(),
    partial,
    sampleCount: inMonth.length,
    hostCount: ranking.length,
    ranking,
    regionLeaders,
    regionTables,
    biggestMover: movers[0] ? { slug: movers[0].slug, name: movers[0].name, deltaTtfbP50: movers[0].deltaTtfbP50! } : null,
    changes,
  };
}

function loadRuns(): RunSummary[] {
  if (!existsSync(RUNS_FILE)) return [];
  return readFileSync(RUNS_FILE, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l) as RunSummary);
}

function main() {
  const all = loadSamplesSince(new Date(now.getTime() - pipeline.seriesDays * DAY));
  const runs = loadRuns();
  mkdirSync(ROLLUP_DIR, { recursive: true });
  mkdirSync(SERIES_DIR, { recursive: true });
  mkdirSync(resolve(ROLLUP_DIR, 'monthly'), { recursive: true });

  const latest: LatestRollups = {
    schemaVersion: 1,
    generatedAt: now.toISOString(),
    cadence: pipeline.cadence,
    windows: Object.keys(pipeline.rollupWindows),
    regions: regions.map((r) => ({ id: r.id, label: r.label, country: r.country })),
    metrics: METRICS,
    runs: { total: runs.length, first: runs[0]?.startedAt ?? null, last: runs[runs.length - 1]?.startedAt ?? null, lastRun: runs[runs.length - 1] ?? null },
    targets: targets.map((t) => buildTarget(t.slug, all.filter((s) => s.target === t.slug))),
  };
  writeFileSync(resolve(ROLLUP_DIR, 'latest.json'), JSON.stringify(latest) + '\n');

  for (const t of targets) {
    writeFileSync(resolve(SERIES_DIR, `${t.slug}.json`), JSON.stringify(buildSeries(t.slug, all.filter((s) => s.target === t.slug))) + '\n');
  }

  const months = [...new Set(all.map((s) => s.ts.slice(0, 7)))].sort();
  const currentMonth = now.toISOString().slice(0, 7);
  if (!months.includes(currentMonth)) months.push(currentMonth);
  for (const month of months) {
    writeFileSync(resolve(ROLLUP_DIR, 'monthly', `${month}.json`), JSON.stringify(buildMonthly(month, all), null, 1) + '\n');
  }
  console.log(`[aggregate] ${all.length} samples, ${latest.targets.length} targets, ${runs.length} runs, months: ${months.join(', ')}`);
}

main();

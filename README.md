# HostBench

Continuous, multi-region benchmark of static, edge and PaaS hosting platforms. Every hour a GitHub
Actions cron asks [Globalping](https://globalping.io) probes in 8 regions to fetch a small page on
each platform, records DNS/TCP/TLS/first-byte/total timings and status, commits the samples to this
repo, recomputes rollups, and redeploys the static site.

Live site: https://varshith.github.io/hostbench/

## Architecture

```
config/targets.json   24 hosts: slug, URLs, platform type, affiliate info, per-target protocol
config/regions.json   8 Globalping location filters (one probe each per run)
config/pipeline.json  protocol, timeouts, rollup windows, compare pairs
scripts/measure.ts    one Globalping HTTP measurement per target -> data/raw/YYYY-MM-DD.jsonl
scripts/aggregate.ts  raw -> data/rollups/latest.json, data/series/<slug>.json, data/rollups/monthly/YYYY-MM.json
scripts/publish-data.ts  copies rollups into public/ at build time (/latest.json, /series/<slug>.json)
src/                  Astro 7 static site; every number is read from data/rollups at build time
test-page/            the controlled 1 KB test page + deploy/ configs for each platform
.github/workflows/    measure.yml (hourly cron, commits data, deploys), deploy.yml (push to main)
```

Flow: `measure` -> `aggregate` -> `git commit data/` -> `build` -> Pages deploy. No database.

## Commands

```
npm install
npm run measure      # one measurement run (uses ~8 Globalping tests per target)
npm run aggregate    # recompute rollups, series and monthly reports from data/raw
npm run build        # publish-data + astro build -> dist/ (Cloudflare Pages compatible)
npm run dev          # local site at http://localhost:4321
npm run check        # typecheck scripts + astro check
```

Environment: `GLOBALPING_TOKEN` (optional; raises the limit from 250 to 500 tests/hour),
`HOSTBENCH_ONLY=slug,slug` (measure a subset), `HOSTBENCH_DEBUG_RAW=1` (print one raw result),
`SITE_URL` / `BASE_PATH` (set by deploy.yml; default `http://localhost:4321` and `/`).

## Data contract

### `data/raw/YYYY-MM-DD.jsonl` (public, one JSON object per probe result)

`ts, runId, target, measurementKind, url, measurementId, region, probe{continent,country,state,city,asn,network},
requestedProtocol, status (finished|failed|offline), failureSource (target|resolver|internal|null), statusCode,
outcome (up|down|indeterminate), timings{dns,tcp,tls,firstByte,download,total}, ttfb, httpVersion, http3,
altSvc, server, cacheStatus, tls{protocol,cipherName,authorized}, resolvedAddress, error`

- `timings.firstByte` is Globalping's value: established TCP/TLS connection to first byte. It excludes dns, tcp and tls.
- `ttfb` = dns + tcp + tls + firstByte: request-level time to first byte. Rollups and the leaderboard use `ttfb`.
- `outcome`: `up` = 2xx/3xx; `down` = 4xx/5xx, timeout or connection error attributed to the target;
  `indeterminate` = Globalping resolver/internal failure, or a redirect on a controlled page (page not served).
  Only up + down count toward availability. A pipeline failure on our side writes no sample at all.
- `http3`: `advertised` (Alt-Svc header with an `h3` token), `not-advertised`, or `unknown`. Never measured.
- `httpVersion`: parsed from the response status line (e.g. `HTTP/2`, `HTTP/1.1`).

### `data/rollups/latest.json` (served at `/latest.json`)

```
{ schemaVersion: 1, generatedAt, cadence, windows: ["24h","7d","30d"],
  regions: [{id,label,country}], metrics: {name: description},
  runs: {total, first, last, lastRun},
  targets: [{ slug, name, vendorUrl, platformType, measurementKind, probeUrl, referenceDescription,
              deployRegion, hasAffiliate, affiliateUrl, affiliateProgram, notes,
              requestedProtocol, httpVersion, http3, server, tlsProtocol,
              firstSeen, lastSeen, lastUp, kindHistory: [{kind, from}],
              global:  { "24h": Stats, "7d": Stats, "30d": Stats },
              regions: { "<region-id>": { "24h": Stats, "7d": Stats, "30d": Stats } } }] }

Stats = { n, up, down, indeterminate, availability (% or null),
          ttfb:{p50,p95}, firstByte:{p50,p95}, total:{p50,p95}, dns:{p50,p95}, tcp:{p50,p95}, tls:{p50,p95}, download:{p50,p95} }
```

Percentiles are over `up` samples only; any p50/p95 is `null` when there are none ("collecting" in the UI).

### `data/series/<slug>.json` (served at `/series/<slug>.json`)

`{ slug, generatedAt, metric: "ttfb-p50", days: ["YYYY-MM-DD", ...], global: [ms|null], regions: {"<region-id>": [ms|null]}, availability: [%|null] }`
with one entry per day, capped at 90 days.

### `data/rollups/monthly/YYYY-MM.json`

Ranking, region leaders/tables, biggest mover and changes for the `/report/YYYY-MM/` page.

## Adding a host

1. Verify a small, stable, vendor-owned page on the platform's default domain returns 200 (`curl -I`).
2. Add an entry to `config/targets.json` (`controlledUrl: null`, `referenceUrl`, `referenceDescription`,
   `protocol: null` unless the host lacks HTTP/2, in which case `"HTTPS"`).
3. Optionally add pairs to `config/pipeline.json` `comparePairs`.
4. `npm run measure && npm run aggregate && npm run build`. Keep total tests per run under the
   Globalping budget: targets x 8 must stay below 250/hour (500 with a token). With 24 targets a run
   uses 192 tests, so at most 7 more hosts fit unauthenticated.

## Promoting a host from reference to controlled

1. Deploy `test-page/` (index.html + style.css, byte-identical) on the platform using the matching
   config in `test-page/deploy/` (see `test-page/deploy/README.md` for the account/token each needs).
2. Set `controlledUrl` for that host in `config/targets.json`. The pipeline switches on the next run;
   the sample's `measurementKind` flips, rollups record the switch in `kindHistory`, and the monthly
   report lists it.
3. GitHub Pages is controlled from launch via the separate repo
   https://github.com/varshith/hostbench-probe (deployed from its `main` branch so HostBench site
   rebuilds never affect the probe).

## Pages custom domain

The site and the controlled probe are served from `varshith.github.io`. A custom domain set on the
account's user site (`varshith/varshith.github.io`) applies to every project site on the account; a
stale one there once redirected both to a dead host, so keep that repo's custom domain empty unless its
DNS actually resolves. A dedicated HostBench domain, when chosen, goes on this repo (Settings > Pages) and
`SITE_URL`/`BASE_PATH` in `deploy.yml` change to match.

## Deploying elsewhere

`npm run build` produces a plain static `dist/`. For Cloudflare Pages set the build command to
`npm run build`, output `dist`, and `SITE_URL=https://<your-domain>` `BASE_PATH=/`.

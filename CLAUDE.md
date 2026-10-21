# HostBench

Continuous multi-region benchmark of 24 static/edge/PaaS hosting platforms. An hourly GitHub Actions
cron asks Globalping probes in 8 regions to fetch one page per host, commits the samples as JSONL to
this repo, recomputes rollups, and rebuilds an Astro 7 static site on GitHub Pages. No database, no
server. Passive-income project (disclosed affiliates + sponsor slots). State: launched 2026-10-21,
collecting data; see README.md for the full data contract and the business rationale in
`docs/research/`.

## Commands (verified 2026-10-21)
- Node: `nvm use` first. Astro 7 refuses Node < 22.23.4; the shell default here is 22.22.2 and
  `npm run check`/`build` fail with "Node.js v22.22.2 is not supported" until you switch.
- Install: `npm ci` (package-lock, npm)
- Typecheck: `npm run check` (tsc on scripts/ + `astro check`; 0 errors, 3 hints is the baseline)
- Aggregate: `npm run aggregate` (raw JSONL -> rollups/series/monthly; idempotent except `generatedAt`,
  so `git checkout -- data/` afterwards unless you intend to commit new data)
- Build: `npm run build` (publish-data + `astro build` -> `dist/`, 309 pages: 24 hosts, 276 compare, 9 other)
- Dev server: `npm run dev` (port 4321, up in ~2 s)
- Measure: `npm run measure` (unverified locally; runs hourly in CI). Consumes ~8 Globalping tests per
  target against a 250/h unauthenticated budget. Do not run it casually; use `HOSTBENCH_ONLY=slug` for a
  subset.
- No test suite exists.

## Architecture
```
config/targets.json    24 hosts: slug, controlledUrl|null, referenceUrl, platformType, affiliate fields, protocol override
config/regions.json    8 Globalping location filters, one probe each
config/pipeline.json   Globalping settings, rollup windows (24h/7d/30d), 90-day series, comparePairs
scripts/measure.ts     one Globalping HTTP measurement per target -> data/raw/YYYY-MM-DD.jsonl + data/runs.jsonl
scripts/aggregate.ts   raw -> data/rollups/latest.json, data/series/<slug>.json, data/rollups/monthly/YYYY-MM.json
scripts/publish-data.ts copies rollups into public/ (gitignored) so /latest.json and /series/*.json are served
scripts/lib/           types.ts (single source of truth for all shapes), globalping.ts, stats.ts, raw.ts, config.ts
src/lib/data.ts        imports data/rollups at build time; fmtMs/fmtPct/hasData helpers ("collecting" when null)
src/lib/site.ts        SITE_NAME, REPO_URL, withBase() for BASE_PATH-aware links
src/pages/             index, hosts/[slug], compare/[pair], report/[month], methodology, about, advertise, disclosure
src/components/        StatsTable, Sparkline (inline SVG), KindBadge
test-page/             the controlled 1 KB page + deploy/ configs per platform (human must deploy; see deploy/README.md)
.github/workflows/     measure.yml (hourly cron -> commit data/ -> deploy), deploy.yml (push to main, ignores data/**)
docs/copy/             approved site copy; docs/research/ the 2026 landscape + shortlist that justified the project
```
Flow: measure -> aggregate -> `git commit data/` -> build -> Pages deploy. Every number on the site is
read from `data/rollups` at build time; nothing is fetched client-side.

## Conventions
- TypeScript strict everywhere. Scripts are plain ESM run via `node --import tsx`; Astro side imports
  types from `scripts/lib/types.ts` with the explicit `.ts` extension. Change a shape there first.
- Astro components: typed `interface Props`, frontmatter logic, no client JS. New pages should look like
  `src/pages/hosts/[slug].astro`; new components like `src/components/KindBadge.astro`.
- Links always go through `withBase()`; the site is served under `/hostbench/` on Pages.
- Null means "not yet measured", never 0. Render it as "collecting" via the `src/lib/data.ts` helpers.
- Headline metric is `ttfb` (dns+tcp+tls+firstByte), not Globalping's `firstByte`. Percentiles are over
  `up` samples only. `indeterminate` samples never count toward availability.
- Comments: one-line "why" at the enforcement site only. The codebase has few comments; keep it so.
- Commits in `data/` are made by `hostbench-bot` from CI; `git pull --ff-only` before local work, and
  never force-push main.

## Gotchas
- Pages redirect trap (fixed 2026-10-21): the owner's user-site repo `varshith/varshith.github.io` carried a
  2014 custom domain `vinuvarshith.com` with no DNS, which made GitHub 301 every `varshith.github.io/*`
  URL to a dead host. It was cleared via the Pages API. If the site or the probe ever 301s again, check
  that repo's custom domain first.
- `GLOBALPING_TOKEN` is not set as a repo secret; runs are unauthenticated (250 tests/h, 192 used; 58 headroom, and runner IPs may be shared, so watch `stoppedEarly` in data/runs.jsonl).
- Only github-pages is `controlled`; the other 23 hosts measure vendor-owned reference pages. Promoting a
  host needs a human-created account/token per `test-page/deploy/README.md`.
- The hourly cron was moved to `23 * * * *` on 2026-10-21 after the :00 slot never fired; all runs that day were manual dispatches. If scheduled runs still do not appear, that is a real bug to investigate.
- `public/latest.json` and `public/series/` are build outputs and gitignored. Edit `data/`, not `public/`.
- `dist/` is committed to nothing but present locally; ignore it.
- DataForSEO MCP account has no credit (402); use Firecrawl SERP checks for keyword work.

## Definition of done
Before reporting any task complete in this repo:
- `nvm use && npm run check` passes with 0 errors.
- `npm run build` succeeds and `dist/` contains the pages you touched.
- If you touched the pipeline (`scripts/`, `config/`), `npm run aggregate` runs clean on the existing
  `data/raw` and the diff against `data/rollups` is only what you intended.
- `git status` is clean of regenerated `data/` noise (restore `generatedAt`-only diffs).
- No test suite exists; exercise the changed page in `npm run dev` and say what you looked at.

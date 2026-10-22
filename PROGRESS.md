# Progress — 2026-10-22

## Done this session
- Cleared the dead 2014 custom domain `vinuvarshith.com` from `varshith/varshith.github.io`; the site and probe now serve 200 at https://varshith.github.io/hostbench/ and github-pages samples are `up`.
- Wrote project CLAUDE.md (verified commands; Node 22.23.4 via `nvm use`).
- Moved the hourly cron from `0 * * * *` to `23 * * * *` after four :00 slots never fired.
- QA pass 1 (Raph): 131 live URLs all 200, data matches pages. Leo fixed 3 bugs: per-window host summary rows, fully-down hosts rendered as "no successful samples" instead of "collecting" (incl. monthly report), JSON-LD base URL; plus compare lede spacing. Raph re-tested: PASS.
- Added 10 hosts (Mike verified reference pages; Don added): heroku, google-cloud-run, azure-static-web-apps, cloudflare-workers, fastly-compute, appwrite-sites, northflank, wasmer-edge, codeberg-pages, upsun. 24 targets, 192 tests/run, 44 compare pairs, 309 pages. Raph: PASS. Live run: 24/24 measured, 79 s, all new hosts up.
- Hardened measure run (Don): 30 s request timeouts, tests counted on 202, fail fast on limits() throw, job `timeout-minutes: 75`. Raph: PASS after the cap was raised from 45.
- All commits pushed; last data run 2026-10-21T19:31Z (6 runs total).

## In flight / not working yet
- VERDICT on GitHub cron (2026-10-22 12:00 UTC): unreliable, fires in ~1 of 5 hourly slots (3 schedule runs in
  20 h: 00:00, 04:42, 10:10 UTC). Nothing is misconfigured (checked by Mike); the repo was created inside a GitHub
  Actions incident and the schedule never recovered to hourly. A fallback loop (dispatch when the last run is
  55+ min old) kept the data series hourly from 2026-10-21 20:50 UTC and runs until 18:00 UTC 2026-10-22 while
  this session is open; after that only the cron runs. The permanent fix is the external trigger in Next steps
  step 2 (needs a PAT from the human). Don is adding dedupe-by-hour to scripts/measure.ts so cron + external
  trigger cannot double a run.
- Reference-page fragility: heroku (2025 sample app), azure-static-web-apps (2023 content) and northflank (dashboard shell) are the least stable picks; swap rather than record downtime if one goes 404.
- Budget headroom is 58 tests/h; runner IPs may be shared. Watch `stoppedEarly` in data/runs.jsonl.

## Next steps (ordered)
1. Set up the external trigger (step 2). Until then, gaps in data/runs.jsonl are expected whenever no session is open.
2. Human, if cron still dead: create a fine-grained PAT (owner varshith, repo access: only hostbench, permission
   Actions: Read and write), then a free cron-job.org job: POST
   https://api.github.com/repos/varshith/hostbench/actions/workflows/391950001/dispatches hourly at :17, headers
   `Authorization: Bearer <PAT>`, `Accept: application/vnd.github+json`, `X-GitHub-Api-Version: 2022-11-28`,
   body `{"ref":"main"}`. Record the PAT expiry here. Then Don adds dedupe-by-hour in scripts/measure.ts (skip if
   data/runs.jsonl already has this runId) so cron + external trigger cannot double Globalping usage.
3. Human: link `vinu@gtechme.com` to the varshith GitHub account (Settings > Emails); commits currently show
   author: null on GitHub.
4. Human: join affiliate programs (DigitalOcean, Railway, Google Cloud via CJ, Cloudways, Kinsta, Hostinger,
   UptimeRobot, Better Stack) and fill `affiliateUrl` in config/targets.json.
5. Human: publish a sponsor contact address; src/pages/advertise.astro currently says "open a GitHub issue".
6. Human: pick a HostBench domain; set it on the hostbench repo (not the user site); update deploy.yml SITE_URL/BASE_PATH.
7. Human: accounts/tokens per test-page/deploy/README.md to promote hosts to controlled; optional GLOBALPING_TOKEN secret.
8. After 4+ weeks of data: first monthly report + Show HN (April drafts the post).
9. Low-priority pre-existing pipeline items: in-progress measurement at poll deadline counts as measured with 0
   probes; `HOSTBENCH_ONLY=""` selects 0 targets.

## Open decisions for the human
- Dedicated domain for HostBench, and whether to keep GitHub Pages or move to Cloudflare Pages.
- Sponsor contact address and whether to wire Revinel/Stripe now or after traffic.

## Resume commands
```
cd /home/vinu/projects/newproject5 && nvm use && git pull --ff-only
npm run check            # 0 errors expected
npm run build            # 309 pages
npm run dev              # http://localhost:4321
gh run list --workflow=measure.yml --limit 5
```

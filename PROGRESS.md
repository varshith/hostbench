# Progress — 2026-10-21

## Done this session
- Cleared the dead 2014 custom domain `vinuvarshith.com` from `varshith/varshith.github.io`; the site and probe now serve 200 at https://varshith.github.io/hostbench/ and github-pages samples are `up`.
- Wrote project CLAUDE.md (verified commands; Node 22.23.4 via `nvm use`).
- Moved the hourly cron from `0 * * * *` to `23 * * * *` after four :00 slots never fired.
- QA pass 1 (Raph): 131 live URLs all 200, data matches pages. Leo fixed 3 bugs: per-window host summary rows, fully-down hosts rendered as "no successful samples" instead of "collecting" (incl. monthly report), JSON-LD base URL; plus compare lede spacing. Raph re-tested: PASS.
- Added 10 hosts (Mike verified reference pages; Don added): heroku, google-cloud-run, azure-static-web-apps, cloudflare-workers, fastly-compute, appwrite-sites, northflank, wasmer-edge, codeberg-pages, upsun. 24 targets, 192 tests/run, 44 compare pairs, 309 pages. Raph: PASS. Live run: 24/24 measured, 79 s, all new hosts up.
- Hardened measure run (Don): 30 s request timeouts, tests counted on 202, fail fast on limits() throw, job `timeout-minutes: 75`. Raph: PASS after the cap was raised from 45.
- All commits pushed; last data run 2026-10-21T19:31Z (6 runs total).

## In flight / not working yet
- Scheduled cron has never fired (all 4 runs were manual dispatches). Workflow is active, Actions enabled, file on main. Repo is <4 h old; GitHub can take hours to start schedules on new repos. A background wait was watching the 20:23 UTC slot when this file was written; check `gh run list --workflow=measure.yml` for an `event=schedule` row. If none by 2026-10-22 morning, that is a Don task (consider a second repo-level trigger or a scheduled dispatch from elsewhere).
- Reference-page fragility: heroku (2025 sample app), azure-static-web-apps (2023 content) and northflank (dashboard shell) are the least stable picks; swap rather than record downtime if one goes 404.
- Budget headroom is 58 tests/h; runner IPs may be shared. Watch `stoppedEarly` in data/runs.jsonl.

## Next steps (ordered)
1. Confirm a scheduled run exists; if not, debug the cron (Don, /debug).
2. Human: join affiliate programs (DigitalOcean, Railway, Google Cloud via CJ, Cloudways, Kinsta, Hostinger, UptimeRobot, Better Stack) and fill `affiliateUrl` in config/targets.json; add an uptime-tool affiliate block near availability data.
3. Human: publish a sponsor contact address; src/pages/advertise.astro currently says "open a GitHub issue".
4. Human: pick a HostBench domain; set it on the hostbench repo (not the user site) and update SITE_URL/BASE_PATH in deploy.yml.
5. Human: create accounts/tokens per test-page/deploy/README.md to promote hosts from reference to controlled; optionally a GLOBALPING_TOKEN secret (500 tests/h).
6. After 4+ weeks of data: first monthly report + Show HN (April drafts the post).
7. Low-priority pipeline items (pre-existing): in-progress measurement at poll deadline counts as measured with 0 probes; `HOSTBENCH_ONLY=""` selects 0 targets.

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

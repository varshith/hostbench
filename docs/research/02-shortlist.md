# Research round 2 — shortlist and decision (2026-10-21)

Two parallel scouts: data-moat idea generation (16 ideas scored on demand, competition weakness,
supply-side money, data moat, buildability, low maintenance) and supply-side verification
(directory rate cards, affiliate program terms, traffic needed per vertical).

## Top 3

### 1. HostBench — continuous multi-region benchmark of static / edge / PaaS hosts  (BUILD)
What: every hour, measure TTFB, TLS handshake, HTTP/3 support, uptime and cold-start of an
identical test page on ~15-20 hosting platforms (Cloudflare Pages, Vercel, Netlify, GitHub Pages,
Render, Railway, Fly.io, DigitalOcean App Platform, Firebase, Amplify, Deno Deploy, Azure SWA,
GitLab Pages, Surge, Koyeb...) from 8+ regions via the Globalping API. Per-host pages, pairwise
compare pages for the queries people type ("cloudflare pages vs vercel"), a methodology page and a
monthly auto-generated "State of Edge Hosting" report.
Why #1: the only candidate with first-party data nobody can copy from the same API (the time
series accrues into the moat); no continuous measured competitor found across several phrasings
(vpsbenchmarks is VPS-only, blog posts are one-offs); HN-native launch story; verified affiliates
in-category (DigitalOcean 10% of spend x 12 mo, Cloudways $50-125, Kinsta $50-500 + 10% lifetime,
Hostinger ~40%, Railway 15% x 12 mo, UptimeRobot 20% lifetime, Better Stack 25%) and a proven
featured-provider model (vpsbenchmarks sells it; OpenAlternative sells $147-597/mo slots to the
same dev audience via Revinel).
Risks: pipeline rests on Globalping's free tier (250 tests/h keyless, 500/h registered); the hosts
people search for most (Vercel, Netlify, Cloudflare) have no affiliate program, so revenue depends
on 3-5 mid-tier featured providers; controlled test pages need an account per host (human task),
so day one uses clearly labelled public reference deployments and swaps in controlled pages as
tokens arrive.

### 2. WordPress plugin health index
What: per-plugin pages from the keyless api.wordpress.org plugin API (76k plugins): abandonment
risk, support-threads-resolved ratio, tested-up-to lag vs current core, PHP-version mix, download
trend; "State of WP plugins" report. Payers: plugin vendors with 20-50% affiliate programs and a
habit of buying placements.
Why not first: three trackers launched 2025-26 (Plugin Pulse by WP Mayor, WP Analyze, StatWP) and
the data is copyable by anyone from the same API; a differentiated hub is required to win.

### 3. Terraform / OpenTofu registry health index
What: per-provider/module pages from registry.terraform.io + api.opentofu.org + GitHub (download
velocity, release cadence, OpenTofu availability, open-issue age); a download time series accrues
into a moat because the registry shows only snapshots.
Why not first: lowest ops of all, but weakest demand (queries are navigational to the registry)
and sponsor appetite from Spacelift/env0/Scalr/Harness is unproven for indie sites.

## Rejected after evidence
- Round-1 tool suites (hardware tester, subtitle toolkit, puzzle maker, HEIC converter): live
  SERPs show 6-10 clones each plus SaaS funnels; AdSense rejects tool sites; Google now renders
  tools in AI Overviews.
- Vehicle reliability (NHTSA): forcar.org launched Oct 2026 with more sources; lead payouts weak.
- Solar / ISP by ZIP: DSIRE API paid, FCC data gated, EnergySage $9.60/lead, CJ approval unlikely.
- Indian mutual funds: no website affiliate route for brokers; low RPM.
- Game economy value index: needs weekly human valuation; clones appear in weeks.

## Monetization plan for HostBench (from the supply-side report)
Day 1: affiliate links (disclosed) for hosts with programs; UptimeRobot / Better Stack recurring
beside uptime data; sponsor and featured-provider slots wired via Revinel/Stripe at
launch pricing. Month 3-6: 3-5 featured providers at $99-197/mo; sponsor slot $147-297/mo.
Realistic: $500/mo needs ~5-10k monthly visitors in this vertical. Launch event: Show HN after
4+ weeks of data, with the first monthly report.

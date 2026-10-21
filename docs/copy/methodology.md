---
title: Methodology
---

# Methodology

HostBench sends a small HTTP request to each hosting platform from 8 regions every hour and publishes what comes back. This page covers what is measured, how it is rolled up, and where the numbers stop being useful.

## What we measure

Each test is an HTTP GET to a small static page hosted on the platform. We run the tests through [Globalping](https://globalping.io), an open measurement network run by jsDelivr. Its probes are hosted by volunteers and sponsors.

For every probe we record the HTTP status, the protocol used, and six timings in milliseconds, as Globalping reports them:

- **DNS**: time to resolve the hostname.
- **TCP connect**: time from the end of the DNS lookup to an open TCP connection.
- **TLS handshake**: time from the open TCP connection to an established TLS session.
- **TTFB (time to first byte)**: time from the established connection to the first byte of the response. This excludes DNS, TCP and TLS, which are reported separately. Some tools define TTFB from the start of the request, so our figure will be lower than theirs for the same request. [VERIFY: pipeline stores Globalping's `firstByte` as-is rather than a cumulative sum]
- **Download**: time from the first byte to the end of the response.
- **Total**: the full request time.

Globalping makes requests over HTTP/1.1 or HTTP/2. It does not make HTTP/3 requests, so we cannot measure HTTP/3 performance. Where a platform advertises HTTP/3 in its response headers we mark it as advertised. Otherwise the field reads "unknown". [VERIFY: whether the pipeline reads the Alt-Svc header, and which protocol option the requests use]

## Regions and cadence

Tests run once an hour from probes in 8 regions: US East, US West, Canada or Brazil, Western Europe, the UK, India, Singapore or Japan, and Australia. Where a region lists two options, the probe comes from whichever has capacity at the time. [VERIFY: how many probes per region per run, and how the either/or regions are chosen]

## Rollups

Samples are rolled up into 24-hour, 7-day and 30-day windows, per region and globally. For TTFB and total time we publish the p50 (median) and the p95. The p50 tells you what a typical request looks like. The p95 tells you how bad the slow ones get.

Availability is the share of samples that returned a 2xx or 3xx status. A timeout, a connection error or a 4xx/5xx status counts against the host. [VERIFY: classification of timeouts and connection errors]

## Controlled and reference measurements

Every result on the site carries one of two labels.

**Controlled** means we deployed our own identical test page, about 1 KB, on that platform. Controlled results are the fair comparison because the file is the same everywhere. GitHub Pages is controlled from launch. Other platforms move to controlled as we set up deployments on them.

**Reference** means we are measuring a small public static page that the vendor itself hosts on the platform's default domain. The host page names the exact URL. A reference result tells you something about how that platform's edge responds from each region. It does not measure an identical workload, and two reference results should not be compared as if they did. When a platform switches from reference to controlled, its history shows where the switch happened.

## Limitations

- **Probe networks vary.** Some probes sit on residential ISPs, others in datacenters. Datacenter probes usually sit closer to CDN edges than home connections do. Results reflect the probes we got, not every user in that region.
- **Sample sizes are modest.** Globalping's free tier caps the number of tests per hour, so each region contributes a handful of samples per host per hour. A p95 over 24 hours rests on fewer data points than one over 30 days.
- **Deployment region matters.** Platforms that serve from a single origin region will look fast near it and slow far from it. Where a platform lets us choose a region, the host page says which one we used.
- **TTFB is one metric.** Build times, developer experience, pricing, bandwidth limits and support are all out of scope. A host can lose on latency and still be the right choice.
- **No vendor endorsement.** No platform has reviewed or approved these numbers.
- **Our outages are not their outages.** If our pipeline fails for an hour, that hour shows as missing samples. It is never counted as downtime for the host.

## Reproduce it

The pipeline code and the test page are public at [REPO_URL]. The latest rollups are published as JSON at [SITE_URL]/latest.json and update with each run. You can rerun any test yourself through Globalping and compare.

## Report a problem

If a number looks wrong, a reference page has moved, or you work for a platform and think we have misconfigured something, open an issue at [REPO_URL]/issues. Include the host, the region and the time window.

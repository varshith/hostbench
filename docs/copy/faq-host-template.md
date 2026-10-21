---
title: Host page FAQ template
---

<!-- Reusable FAQ for per-host pages. Replace {host} with the platform name. -->

## How often is this updated?

Every hour. Probes in 8 regions request the {host} test page once per run, and the rollups on this page are recalculated after each run. The time of the last update is shown at the top of the page.

## Why does {host} show "reference" instead of "controlled"?

We have not yet deployed our own test page on {host}. Until we do, we measure a small public static page that {host} itself hosts on its default domain, named on this page. Those numbers show how the {host} edge responds from each region, but they are not an identical workload to the controlled pages, so treat comparisons with controlled hosts as indicative only.

## Is {host} TTFB from India representative?

It is representative of our probes in India, which is a narrower claim. Probes sit on a mix of residential and datacenter networks, and each region contributes a modest number of samples per hour. Your own users in India may see different numbers depending on their ISP and on where {host} serves the page from.

## Does a lower TTFB mean {host} is the best choice?

No. TTFB on a 1 KB static page measures how quickly the platform's network answers, and nothing else. Build times, pricing, usage limits, framework support and developer experience are outside what we measure, and for many projects they matter more than a few milliseconds.

## Why is p95 so much higher than p50?

The p50 is the median request. The p95 is the point that 95 percent of requests come in under, so it reflects the slowest 5 percent. That tail can pick up cache misses, congested probe networks, slow DNS answers and the occasional route change. A large gap between the two means latency is uneven, even if the typical request is fast.

## What counts as an outage?

A sample counts as down when the request does not return a 2xx or 3xx status, including timeouts and connection errors. [VERIFY: timeout and connection-error handling] Availability is the share of samples that were up. If our own pipeline fails to run, the missing hour is shown as a gap and is not counted against {host}.

## Which {host} region is being tested?

Where {host} lets us choose a deployment region, this page names the one we use. A platform serving from a single region will look fast near it and slower far from it, which is a property of that setup and not only of the platform.

## Does {host} pay to be listed here?

Measurements and rankings are automated and are not affected by payment. If {host} has an affiliate program, links to it may earn us a commission, and any paid placement is labelled "Featured" or "Sponsored" and kept outside the ranked table.

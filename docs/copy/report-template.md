---
title: "State of Edge Hosting: {month}"
---

<!-- Skeleton for the auto-generated monthly report. {placeholders} are filled by the generator. Lines marked FIXED are reusable as written. -->

# State of Edge Hosting: {month}

Data covers {period_start} to {period_end}: {sample_count} samples across {host_count} platforms and 8 regions.

<!-- FIXED --> All figures come from hourly HTTP requests to a small static page on each platform, sent through Globalping probes. Methods and limitations are on the [methodology page](/methodology).

## Summary

- Lowest global p50 TTFB: {fastest_global} at {fastest_global_p50} ms.
- Lowest global p95 TTFB: {fastest_global_p95_host} at {fastest_global_p95} ms.
- Highest availability: {availability_leader} at {availability_leader_pct}%.
- Biggest change from {prev_month}: {biggest_mover}, p50 TTFB {biggest_mover_direction} by <!-- "down" or "up" --> {biggest_mover_delta} ms.

## Global ranking

{global_table}

<!-- FIXED --> Rows labelled "reference" measure a public page the vendor hosts on the platform, not our identical test page, so compare them with controlled rows as indicative only.

## By region

{region_tables}

Fastest p50 TTFB per region:

{region_leaders}

## Availability

{availability_table}

<!-- FIXED --> Availability counts a sample as up when it returned a 2xx or 3xx status. Hours when our own pipeline did not run are excluded, not counted as downtime.

{incidents}

## Changes this month

{measurement_changes}

<!-- Use for hosts added, hosts moved from reference to controlled, reference URLs changed, pipeline gaps. If empty, use the FIXED line below. -->

<!-- FIXED --> No hosts were added or reclassified this month.

## Data

<!-- FIXED --> The data behind this report is public at [REPO_URL] [VERIFY: raw samples or rollups only], and the latest numbers are at [SITE_URL]/latest.json.

<!-- FIXED --> Rankings are generated automatically from measured results. Affiliate relationships and paid placements have no effect on them.

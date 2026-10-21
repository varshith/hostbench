---
title: Glossary
---

# Glossary

**TTFB (time to first byte)**
How long the server takes to start answering once the connection is open. On HostBench it is measured from the established connection (after TLS) to the first byte of the response, so it excludes DNS, TCP and TLS time. Other tools often include those, which gives a larger number for the same request.

**p50 and p95**
Percentiles over a set of samples. Half the samples are at or below the p50 (the median). 95 percent are at or below the p95, so it describes the slow tail rather than the typical request.

**TLS handshake**
The exchange that sets up an encrypted HTTPS connection: agreeing on keys and checking the certificate. It happens after the TCP connection opens and before any page data is sent.

**HTTP/3**
The version of HTTP that runs over QUIC, a UDP-based transport, instead of TCP. It can set up connections in fewer round trips. Our probes cannot make HTTP/3 requests, so HostBench reports HTTP/3 only as advertised by the host or as unknown.

**Cold start**
The extra delay when a platform has to start a server process or function that was idle before it can answer. Static files served from a CDN cache usually have no cold start. Server-rendered and function-backed pages can.

**Edge**
The servers a platform runs close to users, usually in many cities, that answer requests without going back to a central origin. A platform with edge servers near a region tends to show lower TCP, TLS and TTFB times there.

**Availability**
The share of samples in a time window that returned a 2xx or 3xx status. Samples missing because our own pipeline failed are excluded rather than counted as downtime.

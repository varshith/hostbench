# Research round 1 — passive-income site landscape (2026-10-21)

Three parallel scouts: monetization landscape, idea generation, owner-reported case studies.
Keyword-volume validation via DataForSEO was unavailable (account has no credit); competition
was checked with live SERP pulls instead.

## Settled conclusions

1. **Display ads are no longer an on-ramp for small sites.** Ezoic requires 250k monthly users
   (sites added after 2026-02-19). Journey by Mediavine: 1k sessions, domain >= 4 months, Grow
   script installed 30 days. Raptive: 25k pageviews with >= 50% tier-1 traffic. AdSense has no
   minimum but rejects tool-only pages as "low value content" as a category; owners report RPM
   collapse on utility traffic ($500/mo -> $36/mo on more traffic).
2. **Google renders tools in the SERP.** Generative UI in AI Overviews (since 2026-08-19) builds
   calculators/converters inline. Simple single-input tools lose first. Position-1 CTR on
   informational queries fell 7.6% -> 3.9% (Ahrefs, Dec 2023 -> Dec 2025); 68% of US searches
   are zero-click (SparkToro 2026).
3. **Client-side tool niches are flooding.** Live SERPs for keyboard tester, webcam test, mic test,
   dead pixel test, gamepad tester, srt-to-vtt, subtitle shifter each show 6-10 near-identical
   sites, several launched 2025-26, plus SaaS funnel pages (Loom, VEED, HappyScribe, TechSmith).
   Round-1's tool-suite picks were rejected on this evidence.
4. **Affiliate economics shifted toward SaaS.** Amazon cut to 1-4.5% with a 3-sales/180-day rule.
   ShareASale folded into Awin (2025-10). Booking.com moved to CJ at ~4%. Recurring SaaS/dev-tool
   programs (20-50% recurring) accept new sites.
5. **What earned (owner-reported, 2024-26):** OpenAlternative ($6.5k/mo: sponsors + $197/mo
   featured listings; built in 48h from GitHub API data; 2-3 h/wk), Kulpinski (AdSense $200/mo ->
   direct sponsors $3k/mo on the same traffic), Blox Fruits Values (community trade index, est.
   $83k/mo), Nomad List, stockanalysis.com, Fix My Speakers (one tool, launch spike, #1 for 4+ yrs).
6. **Shared traits of winners:** scheduled-refresh dataset from an official API or data release;
   >= 3 unique facts per page; an interactive filter/compare per hub; a periodic data report that
   earns links; supply-side revenue (vendors pay for placement) or recurring affiliates; one real
   launch event (HN / Product Hunt / Reddit) for backlinks.
7. **What died:** templated programmatic pages (hundreds -> thousands deindexed; "lost faith in
   your site"), AI-article sites, Amazon-dependent review sites, CSR React shells Googlebot
   renders empty, non-US traffic at $1-3 RPM.

## Decision shape for round 2

Data-driven directory/aggregator with a stable official data source, a few hundred to low
thousands of genuinely distinct pages, one interactive tool per hub, a recurring "state of X"
report, monetized by featured listings/sponsors plus recurring affiliates. Tier-1 audience
unless supply-side money is strong regardless. Zero weekly labor: pipelines only against
official APIs, never HTML scraping.

## Sources (selection)
- Ezoic requirements: https://support.ezoic.com/kb/article/getting-started-ezoics-requirements
- AdSense publisher policies: https://support.google.com/adsense/answer/10502938
- Raptive 25k: https://www.searchenginejournal.com/raptive-drops-traffic-requirement-by-75-to-25000-views/558780/
- Ahrefs AIO CTR: https://ahrefs.com/blog/ai-overviews-reduce-clicks-update/
- Seer AIO CTR: https://www.seerinteractive.com/blog/aio-impact-on-google-ctr-2026-update
- SparkToro zero-click: https://sparktoro.com/blog/in-2026-less-than-one-third-of-google-searches-still-send-a-click/
- Generative UI in AIO: https://www.searchenginejournal.com/googles-generated-interfaces-could-compete-with-tool-pages/586589/
- OpenAlternative case: https://dirstarter.com/blog/openalternative-case-study
- Kulpinski sponsors: https://www.indiehackers.com/post/from-200-to-3k-month-why-i-ditched-adsense-for-direct-ad-sales-with-numbers-d1098e3aae
- AdSense rejects tool sites: https://support.google.com/adsense/thread/128071230
- Amazon rate card: https://affiliate-program.amazon.com/help/node/topic/GRXPHT8U84RAYDXZ
- Chartbeat small-publisher losses: https://www.axios.com/2026/03/17/chartbeat-search-traffic-ai-chatbots

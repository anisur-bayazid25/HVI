# Changelog

## v2.1.1 � October 2026

- Use SVG on phones and touch tablets to avoid large high-DPI canvas textures.
- Remove blurred map panels and mobile zoom/fade transitions.
- Keep mobile map height stable as browser controls appear and disappear.
- Refresh map dimensions after resizing, tab restoration and returning from the background.
- Reuse map shapes when switching variables or basemaps.

## v2.1.0 — October 2026

- Rename to Dhaka Heat Vulnerability Atlas and simplify public copy.
- Add Anisur Rahman Bayazid's copyright, contact, CHORUS Project / Innovation Fund 2 and FCDO credits.
- Correct healthcare attribution to Survey of Bangladesh, OpenStreetMap and Google Maps.
- Add estimated road-network routes and nearest-five distance ranking, respecting available one-way directions.
- Distinguish mapped road distance from estimated access links and straight-line proximity.
- Update documentation with data sources and years.

## v2.0.0 — 6 October 2026

The initial single-layer webmap becomes an interactive explorer of October results.

- Replace June grid scores and geometry with the completed 5 October results. All 7,706 analytical grid IDs are preserved; 1,497 cells change HVI class.
- Add 134 ward units with independently fitted scores and all source indicators.
- Add selectable HVI/domain/13-indicator maps, within-scale quintile legends, class filters, highest-decile filtering and visible-area summaries.
- Add area search, numeric HVI/rank, domain bars, complete indicator profiles, imputation flags and boundary-fragment notes.
- Add 402 recorded healthcare facilities, type filters, nearest-five straight-line distances, numbered markers, connecting lines and distance rings.
- Add local Leaflet assets, four basemaps, responsive drawer/detail layouts, shareable views and CSV/GeoJSON downloads.
- Replace unguarded class-only hover behavior with numeric metric tooltips. Preserve valid zero scores and handle empty filters.
- Add reproducible keyed data export, source hashes, data dictionary, methodology notes and CI validation.

Healthcare results describe recorded point proximity, not routing or verified facility availability. Source years differ from the analytical update date.

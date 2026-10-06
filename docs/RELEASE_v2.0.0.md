# Dhaka Heat Atlas v2.0.0

The original webmap now explores the completed **5 October 2026 Primary_70_PA results**, with new grid geometry and scores, ward results, all source indicators, and nearby healthcare.

## What's included

- **7,706 grid cells and 134 ward units**, joined to the new analytical outputs by stable keys.
- **17 selectable maps per scale:** HVI, three domain scores and 13 source indicators.
- HVI class checkboxes, highest-decile filtering, updated counts and mean HVI, exact area search and detailed profiles.
- **402 recorded healthcare facilities**, with a type filter, optional markers, and the five nearest facilities from a map click or area representative point.
- Numbered healthcare markers, dashed connections, straight-line distances and optional 1 km / 3 km rings.
- Light, street, satellite and dark basemaps, opacity controls and mobile layouts.
- Visible-data CSV, individual-area GeoJSON, nearby-care CSV and shareable views.
- Reproducible export script, source hashes, methodology/data documentation, locally bundled Leaflet and automated validation.

**[Open the atlas](https://anisur-bayazid25.github.io/HVI/)**

## Data notes

HVI is relative and separately normalized at each scale. Indicator maps use quintiles; HVI uses fixed 0.2 classes. Source observation years differ from the analysis date. Grid imputation and small boundary fragments are flagged. Healthcare distances are straight-line proximity estimates, not road travel or verified facility availability. The supplied facility layer's survey currency and current operations are unverified.

## Validation

The exporter checks all spatial keys, geometry validity, score agreement with primary analytical GeoPackages and class thresholds. Seven Node tests cover classes, distances, nearest-five/type filtering, quintiles, intersecting filters, escaped output and all published datasets. Browser checks cover grid/ward selection, raw indicators, decile filtering, area profiles, nearest-five results and the 390 × 844 mobile layout. See the methodology and data dictionary for limitations.

# Methodology and interpretation

## Analytical release

Results are from the completed **5 October 2026** combined ward/grid analysis (`Primary_70_PA`). Both scales use the same decision rules, fitted separately. This website exports results; it does not independently reproduce source rasters or refit the model.

1. Standardize each indicator to a z-score and harmonize directions using the existing scale-specific indicator definitions.
2. Fit PCA within exposure, sensitivity and adaptive capacity. Retain **all PCs with eigenvalue >1 and individual variance ≥10%**. If their cumulative variance is below 70%, add successive PCs until at least 70% is explained. Preserve the full qualifying set even if a smaller subset would already reach 70%.
3. For each indicator, sum absolute eigenvector coefficients weighted by the retained components' proportions of total variance, then normalize indicator weights within the domain. Domain scores are weighted sums of direction-harmonized standardized indicators, not signed PC scores.
4. Min-max normalize the three domain scores. Fit centered correlation PCA across the domains. Retain consecutive leading PCs whose eigenvalues exceed corresponding 95th-percentile thresholds from **5,000 independent standard-normal simulations**, seed **20261005**. Derive positive domain weights using the same variance-weighted absolute-eigenvector formula.
5. Calculate `HVI_raw = wE × Exposure_s + wS × Sensitivity_s − wA × Adaptive_s`, then min-max normalize HVI to 0–1. Adaptive capacity always represents protection.

For eigenvector coefficient `a_ij` and total-variance proportion `p_j`, the weighting rule is `u_i = Σ_j |a_ij| p_j`, then `w_i = u_i / Σ_i u_i`. This is a documented analytical adaptation, not an assertion of exact replication of a published method.

| Domain | Grid weight | Ward weight |
|---|---:|---:|
| Exposure | 0.3775948358 | 0.2932108153 |
| Sensitivity | 0.3564149803 | 0.3710422838 |
| Adaptive capacity | 0.2659901839 | 0.3357469008 |

## Map classification

HVI uses fixed, right-closed 0.2 intervals: Very Low ≤0.2; Low >0.2–0.4; Moderate >0.4–0.6; High >0.6–0.8; Very High >0.8. Zero is a valid score. Other maps use interpolated 20th/40th/60th/80th percentiles from the full active-scale dataset, before filters. Values equal to a threshold stay in the lower bin. Tied values can produce uneven or empty groups; displayed thresholds are rounded.

The highest decile uses `Rank ≤ ceil(N × 0.1)`, yielding 771 grid cells or 14 ward units before class filters. The sidebar mean HVI is an unweighted mean of currently visible areas. It is not population- or area-weighted.

## Geometry and missing values

Grid geometry is taken from the new primary GeoPackage, not the former webmap. The input is a nominal 250 m-wide hexagonal grid, clipped to the analysis boundary; it is **not 250 square metres per cell**. A nominal full hexagon is approximately 54,125 m². Fragments below 25% of that area are flagged in profiles. The release retains all 7,706 analytical cells and 134 ward units, including restricted areas.

Attributes join by analytical keys, not row order. Source projected geometry (EPSG:32646) is transformed to WGS84 longitude/latitude. Display coordinates are rounded to six decimals and numerical properties to eight decimals.

Grid input values come from aligned, mean-imputed extraction outputs. Individual imputed indicators are flagged in area profiles. Current ward inputs report zero missing values. Population density and indicator units retain the supplied source values; the reanalysis did not independently reconstruct them.

## Nearby healthcare

The supplied updated Survey of Bangladesh facility layer contributes 402 point records. Only a generated ID, name, facility type, source and coordinates are published. Empty types are displayed as `Unspecified facility`; nonempty source categories such as `HS_Misc` are retained. Identical name/coordinate records are deduplicated. The exporter does not merge an additional OSM directory, infer facility capacity or verify current operations.

For a selected origin, eligible facility points are ranked by Haversine great-circle distance using mean Earth radius **6,371,008.8 m**. A facility-type filter applies before ranking. Up to five are returned, with numbered markers and dashed straight connections. Rings show radial 1 km and 3 km distances. Clicking a map location uses that location; the area-profile button uses a representative point inside the polygon.

These values are not road-network distances, travel times, nearest emergency-service guarantees or estimates of current accessibility. Specialist and diagnostic facilities may be included. Survey date/currency and service availability are unverified. The analytical `Hospitals_distance` raster mean and ward `Hosp_count` belong to the upstream HVI inputs and may differ from this separate point directory.

## Limits

HVI and domain scores are normalized separately at each scale and cannot be treated as absolute risk or directly comparable magnitudes across scales. Spatial dependence is not modeled by the independent-row parallel-analysis null. PCA diagnostics and indicator weights do not establish causal effects or predict illness. Source observation years differ from the analysis date; LST is a historical land-surface measure, not live air temperature. Border fragments, imputation and supplied density scaling should be considered when interpreting individual areas.

The June webmap and October release share 7,706 grid IDs, but 1,497 cells change HVI class. This reflects updated analytical results and must not be interpreted as observed change in climate or health between June and October.

The authoritative upstream method notes are `October 2026/HVI_70PA_Methods_and_References.md` in the analysis workspace. Source checksums are recorded in `data/metadata.json`.

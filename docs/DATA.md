# Data dictionary and provenance

## Files

| File | Contents | Key |
|---|---|---|
| `data/hvi.geojson` | 7,706 new primary grid polygons and analytical attributes | `Grid_ID` / `unit_id` |
| `data/wards.geojson` | 134 new primary ward polygons and analytical attributes | `Ward_Name` / `unit_id` |
| `data/healthcare.geojson` | 402 supplied Survey of Bangladesh facility points | generated `id` |
| `data/metadata.json` | Version, dates, counts, weights, source paths and SHA-256 hashes | scale / source path |

Both polygon datasets include `HVI`, `HVI_raw`, `HVI_Class`, `Rank` (1 is highest vulnerability), `Area_m2`, raw domain scores (`Exposure`, `Sensitivity`, `Adaptive_Capacity`), normalized domain scores (`Exposure_s`, `Sensitivity_s`, `Adaptive_s`), source indicators, `name`, string `unit_id`, `center` (longitude/latitude representative point) and `imputed` (indicator-key array). Wards additionally include `Corporation`.

## Indicator fields

| Concept | Grid field | Ward field | Display interpretation |
|---|---|---|---|
| Land surface temperature | `LST_resampled` | `LST_mean` | Historical 2023 LST, °C |
| Population density | `Pop_density_resampled` | `Pop_Density` | WorldPop 2020 supplied values; source scaling preserved |
| Roads | `Roads_resampled` | `Road_Density` | Grid mean distance in supplied metres / ward supplied density |
| Sky view factor | `SVF_resampled` | `SVF_mean` | Dimensionless sky openness; inverted by the model |
| Industry | `Industries_distance` | `industry%` | Grid distance in supplied metres / ward industrial share (%) |
| Poverty | `poverty_final` | `Poverty_HCR` | Supplied headcount rate (%) |
| Buildings | `Building_resampled` | `build_km2` | Grid distance in supplied metres / ward buildings per km² |
| Informal settlements | `Informal_resampled` | `informal%` | Grid distance in supplied metres / ward area share (%) |
| Built-up index | `NDBI_resampled` | `NDBI_media` | Dimensionless NDBI |
| Water | `Water_distance` | `Blue%` | Grid distance in supplied metres / ward water share (%) |
| Nighttime lights | `NTL_resampled` | `NTL_median` | Supplied source units |
| Healthcare | `Hospitals_distance` | `Hosp_count` | Grid raster distance mean in supplied metres / analytical ward count |
| Green space | `Green_distance` | `Green%` | Grid distance in supplied metres / ward green share (%) |

Grid distance indicators represent polygon means of the supplied rasters, not distances from each polygon center. Original indicator directions are preserved: grid roads/industry/SVF are inverted within exposure; buildings/informal distance within sensitivity; green/healthcare/water distance within adaptive capacity. Ward SVF is inverted; other ward indicator directions are retained.

Population density, ward road density and nighttime-light units are intentionally labeled `source units` where upstream scaling has not been independently validated. Distance labels retain supplied metre definitions and do not assert that source rasters were rebuilt.

## Export sources

- `October 2026/results_combined_70PA/{grid,ward}/04_HVI_Results/HVI_Final_{grid,ward}.csv`
- `.../grid/01_Input_Audit/Analysis_Input_Aligned_Imputed.csv`
- `.../ward/01_Input_Audit/Indicators_Aligned.csv`
- `.../{grid,ward}/07_Maps/{grid,ward}_HVI_All_Methods.gpkg`, layer `Primary_70_PA`
- `.../grid/01_Input_Audit/Imputed_Cells.csv`
- `.../{grid,ward}/03_Weights/Domain_Weights.csv`, scenario `Primary_70_PA`
- `Final Data/Dhaka_Health_Facilities_SoB_updated.shp` and sidecars

The public repository contains derived web assets, not the full upstream analysis bundle. Checksums in the metadata identify the exact analytical inputs used by the exporter. Facility incidental fields, local file paths and original workstation attributes are omitted. Source observation dates and operational currency are not independently certified by this release.

## Downloads and sharing

Visible-area CSV contains all published polygon properties for the current scale and HVI filters. Area GeoJSON contains one selected feature. Nearby-care CSV includes facility name/type, straight-line distance, facility and origin coordinates, and source. Browser sharing encodes active scale, metric, filters, basemap, opacity, layer visibility, facility type/rings, map center/zoom and selected area or care origin in the URL.

If you share a nearby-care URL, its selected location coordinates are visible to anyone with the link. No automatic device location is requested. Map tile requests go to the chosen external provider; clicking a facility link opens its coordinates in Google Maps. No analytics are installed.

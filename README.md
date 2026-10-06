# Dhaka Heat Atlas

An interactive explorer for Dhaka's **5 October 2026 heat vulnerability results**, with 7,706 clipped hexagonal grid cells, 134 ward units and 402 recorded healthcare facilities.

**[Open the live atlas](https://anisur-bayazid25.github.io/HVI/)** · [Methodology](docs/METHODOLOGY.md) · [Data dictionary](docs/DATA.md) · [Release notes](CHANGELOG.md)

## Explore the city

- Switch between the nominal **250 m hexagonal grid** and ward results. The two scales are fitted and normalized separately.
- Color the map by HVI, exposure, sensitivity, adaptive capacity or any of the **13 source indicators** at either scale.
- Filter HVI classes or focus on the highest HVI decile. Counts and unweighted mean HVI update with the filters.
- Search an exact grid ID or ward name. Select an area to see its HVI, rank, domain bars, source indicators, imputation flags and small-fragment notes.
- Open **Nearby care**, then click any map location. See the five nearest recorded facilities, distance-ranked markers, connecting lines, optional 1 km / 3 km rings and a facility-type filter.
- Toggle all facility markers, adjust color opacity, choose light/street/satellite/dark basemaps, download visible area CSVs or individual GeoJSON profiles, and share the current view.
- The mobile layout provides an Explore drawer and a scrollable bottom detail panel.

Healthcare distances are **straight-line great-circle estimates**, not road distances, travel times or service-availability estimates. Area-profile searches use a representative point inside the polygon; direct map clicks use the clicked location. The facility dataset is the supplied Survey of Bangladesh layer, not a live directory.

## Results and interpretation

The release uses `Primary_70_PA` from the completed combined ward/grid analysis. HVI is a normalized weighted combination of exposure, sensitivity and protective adaptive capacity. The page displays completed analytical outputs; it does not refit PCA in the browser.

| HVI class | Interval | Grid cells | Ward units |
|---|---|---:|---:|
| Very Low | 0–0.2 | 68 | 4 |
| Low | >0.2–0.4 | 592 | 18 |
| Moderate | >0.4–0.6 | 2,521 | 38 |
| High | >0.6–0.8 | 3,738 | 63 |
| Very High | >0.8–1 | 787 | 11 |

Indicator and domain maps use within-scale quintiles for exploration. HVI filters continue to filter by HVI, regardless of the displayed indicator. Tied indicator values can create unequal quintile groups. The highest decile is defined as analytical rank ≤ ceiling(10% × area count).

HVI describes relative vulnerability within each spatial scale. The atlas is not a current temperature forecast or a validated prediction of heat-related illness. Source years differ from the 2026 analysis date. Supplied population-density values and source scaling are preserved.

## Run locally

No build step, API key or npm dependency installation is required. Serve this folder over HTTP:

```sh
python -m http.server 8080
```

Open `http://localhost:8080`. Basemap tiles require internet access. Leaflet 1.9.4 is bundled locally with its license. The optional facility links open Google Maps only when clicked. The app uses no analytics and requests no device geolocation permission.

## Update the analytical data

The private analysis workspace is **not** included in this public repository. Rerun the upstream analysis first, then export its completed results:

```sh
python -m pip install -r requirements-export.txt
python scripts/export_data.py --workspace "E:/Heat Vulnerability/Vulnerability Index"
node --check app.js
npm test
```

The exporter reads `October 2026/results_combined_70PA`, joins attributes by `Grid_ID` / `Ward_Name`, transforms the primary GeoPackage geometry from EPSG:32646 to WGS84, and exports the supplied healthcare points. It stops on missing/duplicate keys, invalid geometry, mismatched HVI or incorrect classes. Published numbers are rounded to eight decimal places and geographic coordinates to six; analytical calculations remain upstream.

`data/metadata.json` records source paths and SHA-256 checksums. No workstation paths or incidental shapefile attributes are published for healthcare facilities. See [DATA.md](docs/DATA.md) for the exact export inventory and provenance limitations.

## Publish

The existing GitHub Pages site serves the repository's root static files. Push the reviewed files to `main`; no separate application server is needed. Keep Pages configured for the current branch/root source. Run the Node checks and verify desktop/mobile interactions before tagging a release. The CI workflow validates application syntax, distance/filter logic and all published result classes.

## Repository layout

| File | Purpose |
|---|---|
| `index.html`, `styles.css` | Accessible controls and responsive layout |
| `app.js` | Leaflet layers, profiles, nearby care, filters and sharing |
| `core.js` | Distance, classification, binning, filtering and export utilities |
| `data/` | Grid, ward and facility GeoJSON plus export manifest |
| `scripts/export_data.py` | Reproducible export from completed local outputs |
| `tests/`, `.github/workflows/checks.yml` | Logic/data validation and CI |
| `vendor/` | Leaflet 1.9.4 and its third-party license |

The repository's existing [LICENSE](LICENSE) remains in place. Leaflet uses its own BSD-2-Clause license. Basemap providers and source datasets retain their applicable terms; exporting a dataset does not create new redistribution rights.

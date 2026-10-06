# Data sources and years

**Dhaka Heat Vulnerability Atlas**

**Updated on: October 2026**

The update month describes the atlas, not the observation year of every dataset.

| Data | Source | Data year / date |
|---|---|---|
| Land surface temperature | Prepared satellite-derived temperature data | 2023 |
| Population density | WorldPop | 2020 |
| Building footprints | Google Open Buildings | 2023 |
| Informal settlements | Compiled informal-settlement mapping | 2016 |
| Poverty | Supplied World Bank poverty estimates, combined with population data | Poverty estimates: 2022; population: 2020 |
| Healthcare facilities | Combined Survey of Bangladesh, OpenStreetMap and Google Maps locations | Mixed collection dates; exact dates not confirmed |
| Roads | OpenStreetMap | Extraction date not recorded in the compiled layer |
| Green space and water bodies | Compiled environmental GIS layers | Year not confirmed |
| Industrial areas | Compiled industrial-area GIS layer | Year not confirmed |
| Sky view factor | Prepared sky-view-factor surface | Year not confirmed |
| Built-up index (NDBI) | Prepared satellite-derived built-up index | 2023 |
| Nighttime light | Prepared nighttime-light dataset | 2023 |
| Ward boundaries | Supplied Dhaka administrative boundaries | Boundary edition not confirmed |

The atlas contains 7,706 clipped grid cells, 134 ward units and 402 healthcare records. Healthcare attribution applies to the combined directory; the original source of each individual location is not identified separately.

## Understanding the values

Temperature represents historical land-surface temperature rather than current air temperature. Distance indicators on grid maps describe average values within an area. The nearby-care tool instead measures from a selected map point, so the two can differ.

Values labeled “source units” retain the scaling supplied with the dataset. Some grid indicators contain substituted values where source observations were missing; those indicators are flagged in area profiles. Small boundary fragments are also identified.

Healthcare locations may include hospitals, clinics, specialist services and diagnostic centres. Current opening status, capacity and service availability have not been verified.

## Road routes

The road layer includes primary, secondary, tertiary and local roads. Available one-way directions are respected. Crossing lines are not automatically treated as junctions.

Each selected location connects to its closest mapped road segment within 500 metres. Solid colored lines show the road path; dotted lines show access links. Total distance includes the road path and both access links. Access links are geometric estimates and may not represent a usable entrance or crossing.

The five nearest reachable facilities are ranked by estimated total distance. Facilities on disconnected roads are not assigned invented connections. If a road route cannot be found, select another point or switch to straight-line mode. Road routes are approximate and do not model traffic, closures, turn restrictions, private-access restrictions or live navigation.

Road data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), under the Open Database License. The compiled healthcare directory also credits Survey of Bangladesh and Google Maps.

## Project

CHORUS Project · Innovation Fund 2. Funded by FCDO.

© Anisur Rahman Bayazid · [anisur.rahman.bayazid@gmail.com](mailto:anisur.rahman.bayazid@gmail.com)

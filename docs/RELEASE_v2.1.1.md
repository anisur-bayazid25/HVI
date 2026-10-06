# Dhaka Heat Vulnerability Atlas v2.1.1

Mobile rendering stability update.

- SVG drawing on phones and touch tablets replaces the large high-DPI canvas.
- Remove blurred overlays and mobile zoom/fade transitions.
- Stable mobile map height and map-size refresh on resize, restored pages and returning to the tab.
- Reuse existing map shapes when changing variables and basemaps.
- Version stylesheet and application URLs so reopened pages load the fix.

Validation: JavaScript syntax checks, data/routing/text-encoding tests, and responsive browser checks across portrait, landscape, layer changes, zooming and area/nearby-care interactions. The reported Android graphics corruption is intermittent and cannot be conclusively reproduced in the desktop browser; verification on the affected device remains useful.

Updated on: October 2026

© Anisur Rahman Bayazid · CHORUS Project · Innovation Fund 2 · Funded by FCDO.

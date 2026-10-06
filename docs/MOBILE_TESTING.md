# Mobile rendering checks

Version 2.1.1 uses SVG on narrow screens and coarse-pointer devices. Desktop browsers retain canvas drawing. Mobile zoom/fade transitions and panel backdrop blur are disabled, and the mobile map uses a stable small-viewport height. A resize observer and page/visibility events refresh map dimensions without animated panning.

Checked in the browser at 390 × 844, 390 × 740, 844 × 390 and 1280 × 800:

- All 7,706 grid cells load; the mobile map has no canvas elements.
- Change HVI, temperature and green-space variables; restore HVI.
- Highest-decile filtering produces 771 cells; resetting restores all cells.
- Switch to 134 wards and back to the grid.
- Search Grid 76, inspect its profile and calculate five road-network routes.
- Resize portrait to landscape and back with routes displayed.
- Repeatedly zoom in/out and change light, dark and street basemaps.
- Toggle the 402 healthcare markers and clear selected routes.
- Desktop canvas rendering remains functional; no application console errors observed.
- All 12 data, routing and text-encoding tests pass.

The supplied recording shows pinch-zoom overlay lag; the screenshot shows severe intermittent graphics corruption. These point to rendering/compositing pressure but do not prove a particular browser or GPU fault. Desktop responsive checks cannot reproduce the affected Android hardware. On that phone, reload the atlas, repeat pinch zooming/panning, rotate the phone, switch variables and leave/return to the browser. Check that tiles, polygon fills, markers and panels remain intact.

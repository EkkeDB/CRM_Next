This folder stores locally vendored GeoJSON for the dashboard geo choropleth.

Expected files:

- spain-provinces.geojson
- portugal-districts.geojson

You can fetch them automatically via:

  npm run fetch-geo

The fetch script tries Opendatasoft dataset exports first and falls back to GitHub mirrors. If it fails, download the files manually from trusted sources and place them here.


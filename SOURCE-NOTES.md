# Source notes

Catalog identities and images were inspected on 2026-09-11. Prices, ratings,
stock claims, shipping origins, and logistics were not imported as live data.
No fabricated review counts/ratings are presented. Game prices are illustrative.

- Sony WH-CH520: https://www.amazon.com/dp/B0BS1PRC4L
- LEGO Mini Orchid 10343: https://www.amazon.com/LEGO-Botanicals-Mini-Orchid-Building/dp/B0DJ19VGDD
- Kindle Paperwhite 16 GB: https://www.amazon.com/dp/B0CTMS64NT
- Logitech Pebble Mouse 2 M350s: https://www.amazon.com/dp/B0BT4DXWQD
- Amazon Basics Adjustable Dumbbell 25 lb: https://www.amazon.com/Amazon-Basics-Adjustable-Dumbbell-25/dp/B0FC6RZNK2
- Amazon Basics Dumbbell Set 38 lb: https://www.amazon.com/Amazon-Basics-Adjustable-Barbell-Dumbells/dp/B071WSFSGC

Image URLs in catalog.js were obtained from each listing's main image metadata.
They are external references and may fail or change. Product names and imagery
belong to their respective owners; source attribution alone is not a license.
No affiliation with Amazon or product brands is claimed.

Map land geometry: Natural Earth, 1:110m land polygons, retrieved from
https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_land.geojson

Coordinates were converted to an equirectangular SVG canvas: x=(longitude+180)*2,
y=(90-latitude)*2. assets/world-land.json bundles the derived paths for offline
map rendering. Routes and hub coordinates are game content, not carrier data.

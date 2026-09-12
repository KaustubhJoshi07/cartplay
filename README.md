# CartPlay Style Adventures 0.3.1

Complete Expo SDK 57 React Native shopping-simulator source. No real payments,
orders, delivery, GPS tracking, or account signup. The first launch requires
acceptance of the in-app simulation policy.

## Upgrade from the previous CartPlay

This update adds several files and native dependencies. Replacing App.js alone
will not work. Stop your old Expo terminal with Ctrl+C. Keep the old folder as a
backup. Extract this ZIP into a NEW folder and open Command Prompt inside the
extracted cartplay folder (the one containing package.json).

    npm install
    npm install --save-dev @expo/ngrok@^4.1.0
    npx expo start --clear --tunnel

Scan the NEW QR code in Expo Go. The app's header reads CARTPLAY · THE STYLE EDIT · 0.3.
If your phone and computer are on the same Wi-Fi, you can skip ngrok and use:

    npx expo start --clear --lan

Do not copy old node_modules or old package-lock.json into this project.
The previous 0.1 prototype had no durable storage to migrate. Version 0.2 saves
its new orders and policy acceptance locally under cartplay.game.v2. Reopening
the same app keeps them. Clearing Expo Go/app data or uninstalling may remove
saved progress. There is no cloud backup.

## What is implemented

- First-launch simulation policy: affirmative checkbox, accept/decline, persisted
  policy version and acceptance timestamp, review from Me.
- 1,042 women-focused fashion inspiration items across 55 categories, plus the
  original six source-linked extras. This is NOT a live Amazon integration.
- Bundled fashion photos, A–Z category browsing, full-text search, favorites,
  color/occasion/size filters, price and alphabetical sorting.
- Product pages require a valid game-size selection for sized items. The chosen
  size is preserved in the cart, checkout, saved order, and package journey.
- Product-detail photos open into a full-screen viewer with zoom in, zoom out,
  reset, and close controls. Zoom interaction is tested without extra packages.
- Prices formatted as USD ($59.99), labeled as illustrative game prices; real
  charge remains $0.00. No card fields or payment service.
- Product details, category browsing, search, persistent cart, swipe checkout,
  tap fallback, persisted order confirmation and history.
- 13 selectable destination cities. No precise address, GPS, or location request.
- Separate shipments for every item, including mixed-origin carts. Shipping
  origins are explicitly fictional and do not describe seller warehouses.
- Bundled Natural Earth world map, animated package, route lines, origin and
  destination pins, zoom-to-package toggle, timestamped scans and ETA.
- Domestic base duration: randomly 3 or 4 full 24-hour days.
- International base duration: randomly 8, 9, 10, 11 or 12 full days.
- 22% chance of a sorting mix-up, recovery after 12 hours, and a +12-hour ETA.
  The package pauses at the hub; the delay is shown after the misplacement scan.
- 65% chance of a package postcard. Arrival unboxing grants a collectible and
  10 Joy Points, or 50 for the 12% golden wrapping outcome. Lost packages get a
  Lost & Found souvenir unless their wrapping is golden.
- An origin-country passport, souvenir shelf, quiet animation switch, local
  reset confirmation, and policy review.
- Whole-state writes are serialized. A failed checkout save leaves the cart
  intact and allows retry. Duplicate checkout/unbox callbacks do not duplicate
  orders or rewards.

## Timing and testing

Routes and random outcomes are saved once at checkout. Progress is calculated
from timestamps using the device clock; it does not require the app to stay
open. Foreground scans refresh every 10 seconds and immediately on app resume.
This is a local prototype: changing the device clock can change progression.
There is no trusted server clock or push notification service. The bouncing box
is decorative; travel position follows the elapsed journey. The map depicts
fictional routes, not actual roads, flight paths, or carrier telemetry.

    npm test
    npx expo export --platform ios --platform android --output-dir dist

The tests use real React hooks with mocked native components and storage. They
exercise consent, save failures, retry, swipe handlers, repeated checkout,
restart, timing boundaries, lost recovery, map coordinates, and one-time rewards.
They do not replace physical iPhone/Android touch and layout testing. No
production time-skip button exists; accelerated clocks are used only by tests.

## Manual acceptance check on your phone

1. Decline the policy: catalog remains locked. Reconsider, check the box, accept.
2. Open a fashion item, choose a size, add it, then choose Dallas as destination.
3. Cancel checkout once: both items remain in the cart.
4. Reopen checkout and swipe; confirmation lists two package adventures.
5. Track each package: Tokyo is international; Seattle is domestic.
6. Close/reopen Expo Go: policy stays accepted and packages/ETAs stay the same.
7. In Me, turn quiet animation on/off and review the policy.
8. After arrival, unbox: one collectible/point award only.

## Catalog and publishing limits

The fashion catalog uses a historical public fashion-image archive; its images
are bundled so the fashion grid works without third-party image hosting. Names,
sizes, prices, origin cities, availability, and delivery are game content rather
than current retailer facts. The original six extras retain source links and
remote images with a visible fallback.

A full continuously updated Amazon catalog is not implemented. That requires a
permitted product-data integration and appropriate access/credentials. No API
credentials are embedded. Before publishing retailer imagery in a commercial
release, establish the rights/data arrangement you will use. SOURCE-NOTES.md
records the listings and map data source.

This is runnable source, not a signed APK/IPA or a store submission. Existing
EAS configuration is retained. The policy is a plain-language in-app disclosure,
not a store-review approval or a legal compliance certification.

# Local Three.js (offline)

Put `three.min.js` (Three.js r128) **next to `index.html`** (the project root, not a `lib/` folder). `three-loader.js` tries this file first, then the public CDNs.
Keep the Three.js license notice with the library. The archive does not ship the runtime because the build environment had no network.

To fetch it and get an SRI hash (run once on a machine with internet):

    node tools_fetch_three.js

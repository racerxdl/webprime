# AGENTS.md

Original Pump It Up Prime web visualizer (2015), fixed for modern browsers.

## The only logic change made

**`lib/webprime.js` lines 516-528**: Custom Elements v0 (`document.registerElement` + `createdCallback`) replaced with v1 (`customElements.define` + class extends HTMLElement + `connectedCallback`).

This was the sole reason the project stopped working in Chrome 80+, Firefox, Safari, and Edge.

All 21 other `lib/*.js` files are untouched original code — game logic, timing engine, BPM handling, scroll factors, drawing, WebGL, skins, effects, etc.

## Build system

Vite-based. jQuery and @teskevirtualsystem/jpak from npm.

```bash
npm install
npm run dev       # serve on localhost:8082
npm run build     # production build to dist/
```

## Architecture

- Source: `lib/*.js` (22 files, IIFE + window globals, ES5, jQuery, Canvas/WebGL).
- All lib files loaded as plain `<script>` tags in alphabetical order (original concat order) via `index.html`.
- Custom element `<web-prime>` registered by `lib/webprime.js`.
- Data: `ucs/`, `datapack/`, `nx/` (static assets).
- jQuery: `npm` dependency, served from `node_modules/jquery/dist/jquery.min.js`.

## Dependencies

- Runtime: jquery (npm), @teskevirtualsystem/jpak (npm)
- Dev: Vite ^5


## Testing

Chrome DevTools MCP confirmed all systems working:
- Custom Elements v1 registration
- jQuery + JPAK globals
- UCS file loading + parsing (43 splits, BPM 310, 4 BPM changes)
- MP3 audio loading + continuous playback
- WebGL initialization + all webgl backgrounds
- BPM change handling (310 → 155 → ...)
- Combo tracking (84+ from CS131)
- Scroll speed controls (Play/Pause/Speed±)
- All 145 skin/texture objects loaded
- Full game loop running (drawer, looper, skin, sentinel, effect bank)

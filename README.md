    __        __   _     ____       _
    \ \      / /__| |__ |  _ \ _ __(_)_ __ ___   ___
     \ \ /\ / / _ \ '_ \| |_) | '__| | '_ ` _ \ / _ \
      \ V  V /  __/ |_) |  __/| |  | | | | | | |  __/
       \_/\_/ \___|_.__/|_|   |_|  |_|_| |_| |_|\___|

========

Remake of Pump It Up Prime for Web — modernized (2026)

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:8082

## Usage

```html
<web-prime
  file-name="ucs/CS131.ucs"
  song-id="S12"
  song-type="UCS"
  graphical-mode="HD"
  debug-mode></web-prime>
```

Attributes:
| Attribute | Values | Description |
|-----------|--------|-------------|
| `file-name` | path | UCS or JPAK file |
| `song-type` | `UCS`, `JPAKNX` | Chart format |
| `song-id` | string | Song ID for media lookup |
| `song-mode` | `SINGLE`, `DOUBLE` | For JPAKNX charts |
| `song-level` | number | Chart level (JPAKNX) |
| `graphical-mode` | `HD` (1280×720), `SD` (640×480) | Resolution |
| `debug-mode` | boolean attr | Show debug overlay |
| `disable-sound` | boolean attr | Mute audio |
| `disable-webgl` | boolean attr | Force Canvas 2D |

## Commands

```bash
npm run dev       # dev server on :8082
npm run build     # production build to dist/
npm run deploy    # build + deploy to GitHub Pages
```

## Architecture

- 22 ES5 lib files (`lib/*.js`) with game logic — untouched from 2015 original
- Custom element `<web-prime>` (v1 — fixed from the original v0)
- Canvas 2D + WebGL rendering
- jQuery + JPAK from npm
- UCS and JPAKNX chart formats supported

## Deploy to GitHub Pages

Pushes to `master` auto-deploy via GitHub Actions to `https://<user>.github.io/webprime/`.
Manual deploy: `npm run deploy`.

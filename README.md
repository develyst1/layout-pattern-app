# layout-pattern-app

Electron desktop app for photo pattern / collage templates.

Two modes are planned: **Layout Designer** (design rectangular slots on a Konva
stage and save/load the layout as JSON) and **Use Template** (drop images into a
saved template and export a full-resolution PNG). Only the project skeleton is
present at this point — see `ai-worker/` in the workspace repo for the current
requirement, spec and tasks.

## Prerequisites

- **Node.js 22.12.0 or newer** — required, not merely recommended: the Electron
  installer declares `engines.node >= 22.12.0` and its postinstall step fails on
  older Node. Verified on `v22.23.2`.
- **npm 10 or newer** — verified on `10.9.8`.
- Windows, macOS or Linux desktop session (the app opens a native window).

Nothing else has to be installed globally.

## Run from a clean checkout

```bash
npm install       # installs dependencies
npm run dev       # starts Vite and opens the Electron window
```

These two commands are the whole procedure — there is no extra manual step. Note
that the Electron binary (~150 MB) is fetched on **first launch**, not during
`npm install`, so the first `npm run dev` prints `Downloading Electron binary...`
and pauses for a while before the window appears. That is expected, happens once
per Electron version, and is not a hang.

`npm run dev` starts the Vite dev server on <http://localhost:5173>, builds
`electron/main.ts` and `electron/preload.ts` into `dist-electron/`, and launches
Electron pointed at the dev server. Editing files under `src/` hot-reloads;
editing files under `electron/` restarts the Electron process. Close the window
or press `Ctrl+C` in the terminal to stop.

## Other scripts

```bash
npm run typecheck   # tsc --noEmit over the app and the Vite config (strict)
npm run build       # typecheck, then production build into dist/ + dist-electron/
```

There is no packaging/installer step yet — it is out of scope for the current
requirement.

## Project layout

```
electron/          Electron main process + preload (Node side)
src/               React renderer (UI)
shared/            types shared across the IPC seam (added by a later task)
dist/              built renderer      (generated, git-ignored)
dist-electron/     built main+preload  (generated, git-ignored)
```

## Toolchain notes

- Electron tracks the **latest stable** line (43.x at the time of writing). This
  is a project constraint rather than a convenience, and it is the reason Node
  22.12+ is a hard prerequisite above.
- Vite stays on the **5.x** line and React on **18** — a deliberate decision for
  this project, not a toolchain limitation. Moving either one is its own decision,
  never a side effect of an Electron upgrade.
- `package.json` deliberately has **no** `"type": "module"`. That is what makes
  the Electron main and preload bundles come out as CommonJS, which is what
  `sandbox: true` requires.
- The renderer runs with `contextIsolation: true`, `nodeIntegration: false` and
  `sandbox: true`. It has no `fs` and no `require`; everything that touches the
  filesystem crosses the preload IPC seam.

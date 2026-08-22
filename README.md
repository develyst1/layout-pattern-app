# layout-pattern-app

Electron desktop app for photo pattern / collage templates.

Two modes are planned: **Layout Designer** (design rectangular slots on a Konva
stage and save/load the layout as JSON) and **Use Template** (drop images into a
saved template and export a full-resolution PNG). Only the project skeleton is
present at this point — see `ai-worker/` in the workspace repo for the current
requirement, spec and tasks.

## Prerequisites

- **Node.js 20.x or newer** — verified on `v21.7.3`.
  (Node 22.12+ would additionally allow Electron 40+; see "Toolchain notes".)
- **npm 10 or newer** — verified on `10.5.0`.
- Windows, macOS or Linux desktop session (the app opens a native window).

Nothing else has to be installed globally.

## Run from a clean checkout

```bash
npm install       # installs dependencies and downloads the Electron binary
npm run dev       # starts Vite and opens the Electron window
```

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

- Electron is pinned to the **39.x** line. Electron 40 and newer declare
  `engines.node >= 22.12.0` and their installer fails on Node 21 and below,
  so 39.x is the newest line that installs on the Node version this project is
  developed against. Moving to the latest Electron is a one-line change in
  `package.json` once the toolchain runs on Node 22.12+.
- Vite is on the **5.x** line for the same reason: Vite 6 and newer exclude
  Node 21 in their `engines` field.
- The renderer runs with `contextIsolation: true`, `nodeIntegration: false` and
  `sandbox: true`. It has no `fs` and no `require`; everything that touches the
  filesystem crosses the preload IPC seam.

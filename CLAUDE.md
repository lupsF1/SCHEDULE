# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev mode with HMR (requires graphical session) |
| `npm run build` | Compile to `out/` |
| `npm run test` | Vitest unit tests |
| `npm run typecheck` | Type check main + renderer (`tsc --noEmit`) |
| `npm run dist` | Build installer for current platform |
| `npm run design:lint` | Validate DESIGN.md tokens |

Type check a single target: `npx tsc --noEmit -p tsconfig.node.json` (main/preload) or `npx tsc --noEmit -p tsconfig.web.json` (renderer).

Run a single test file: `npx vitest run src/renderer/src/domain/appData.test.ts`

## Architecture

Three-process Electron app built with `electron-vite`:

- **main** (`src/main/`) — Frameless BrowserWindow (`transparent: true`), IPC handlers for state persistence (`app-state.json`, `window-state.json` in userData), window bounds debounced save (400ms).
- **preload** (`src/preload/`) — `contextBridge` exposes `window.desktop` API (loadState, saveState, setAlwaysOnTop, closeWindow, quitApp).
- **renderer** (`src/renderer/src/`) — React 19 + TypeScript. Single-page app, no router. All state in `App.tsx` via `useState`/`useCallback` (no state library). CSS is vanilla in one file (`main.css`, ~1600 lines), using CSS custom properties from DESIGN.md tokens.

### Key data flow

`App.tsx` owns all top-level state (`data: AppDataV1`, `focusImmersiveItemId`, `celebration`, `mdiPanels`). State is debounced (420ms) to disk via `window.desktop.saveState`. Child components receive state + updater callbacks as props.

### Focus mode (immersive)

When `focusImmersiveItemId` is set: `focus-immersive` CSS class toggled on html/body (transparent background), toolbar/memo hidden, `FocusMdiWorkspace` renders. Contains MDI sub-windows (dockable/floating panels via `MdiPanel`), the focused card (`StickyScheduleCard`), and a celebration overlay on exit.

### Plant system

Uses `svg-plant` library. `plantEngine/generators/svgPlantGen.ts` wraps `createPlant(genusKey, seed, cfg)`. 50 species in `stickyPlantKinds.ts` mapped to 4 genera (BushyPlant, DragonTree, Zamia, Pilea). Growth driven by `progress` prop → `plant.age` → `plant.update()`. CSS selects `.sticky-plant-slot > svg` (not a class on the SVG element).

### Time domain

`scheduleTime.ts` contains all time calculations: `getStickyLive` (card status), `getRemainingMs` (countdown), `getPlantGrowthFraction` (growth 0-1), `sortItemsByUrgency` (active > soon > upcoming > past). `useScheduleLiveClock` drives 1-second ticks for active items.

## Design system

Tokens in `DESIGN.md` YAML front matter are authoritative. Key values:
- Accent: `#047857` (emerald), primary: `#18181B`, surface: `#FFFFFF`
- Font: Geist (system-ui fallback), 8px spacing rhythm
- Border radius: 4/8/12px. Prefer borders over shadows.
- Run `npm run design:lint` after editing DESIGN.md.

## Constraints

- No CSS framework — all vanilla CSS in `main.css`
- No state management library — `useState`/`useCallback` in `App.tsx`
- No routing — state-driven view switching
- Electron window is `transparent: true` (focus mode sees desktop through)
- Node.js 20.19+ or 22.x required
- UI language: Chinese (Simplified)

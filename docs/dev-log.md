# 开发日志

## 2026-05-14

### 文档与设计与窗口说明

- [DESIGN.md](../DESIGN.md) 增补 **Electron 窗口与不透明度**：说明默认 **opaque shell**、`transparent: false` 与 `backgroundColor` 对边框缩放/拖拽命中测试的稳定作用；沉浸式 CSS 可把页面画成透明感，但不会透过窗口看到真实桌面背后的内容（仍叠在 Electron 底色上）。
- `src/main/index.ts`：`WINDOW_BACKGROUND` 与创建窗口注释与上述文档对齐。

### UI / 渲染

- **专注庆祝弹层**：`FocusCelebrationOverlay` 改用 `createPortal` 挂到 `document.body`，叠层独立于便签树根布局；配套 `main.css` 中 modal / confetti（含 `prefers-reduced-motion`）。
- **布局刷新**：新增 `hooks/useWindowResizeBump.ts`，在窗口 `resize` 与 `#root` 的 `ResizeObserver` 时递增计数；`ScheduleStickySection` 将 `now` 的 `useMemo` 依赖 `layoutBump`，便于 vmin 等依赖视口的布局在无 remount 时刷新。
- 专注模式下主滚动区：`cork-scroll--focusImmersive` 使用 `overflow: hidden`，避免与沉浸式单层布局冲突。
- Git 历史中若干提交说明曾为占位符 `"--"`，建议后续提交使用有意义的第一行摘要。

---

## 2026-05-13

### 环境与脚本

- 栈：**Electron + electron-vite + React 19 + TypeScript**。
- 运行：`npm run dev`（需图形环境：`DISPLAY`/Wayland）。
- **仅编译**（不打包）：`npm run compile` / `npm run build` → `out/`。
- **发布安装包**（electron-builder，`release/`）：见根目录 [electron-builder.yml](../electron-builder.yml)。
  - **Windows 安装包（三种方式）**：
    1. **GitHub Actions（推荐在 Linux/WSL 开发时）**：推送仓库后于 **Actions** 运行「Build Windows installer」，在产物中下载 **`Schedule-Setup-*.exe`**（见 [.github/workflows/build-windows-installer.yml](../.github/workflows/build-windows-installer.yml)）。
    2. **本机 Windows**：`npm install` → `npm run dist:win` → **`release/`**。
    3. **仅 Linux/WSL 本机**：Wine 交叉打 NSIS **不推荐**；优先 Actions 或真机 Windows。
  - **Linux**：`npm run dist:linux` → `release/` 下 AppImage。
  - **当前平台**：`npm run dist`。
- `npm run test` — Vitest：`appData`、`scheduleTime`、`stickyPlantKinds` 等域逻辑测试。
- **一键提交并推送**：`./scripts/git-save-push.sh ["提交说明"]` 或 `npm run git:push -- "提交说明"`（默认 `chore: sync <UTC 时间>`）。

### 迭代摘要（提交顺序节选）

| 主题 | 说明 |
|------|------|
| 脚手架初始化 | Electron + electron-vite 工程，主进程 / 预加载 / 渲染三层。 |
| 便签与时间线 UI | Corkboard、`ScheduleStickySection`、草稿→保存、`scheduleTime` 相位与 HMS 环形倒计时。**只要圆环在走（remainMs > 0），钩子即秒级刷新**（与早期「仅十分钟内秒级」不同）。 |
| 植物与时间域 | `StickyPlantGrowth`、`stickyPlantKinds`；`getPlantGrowthFraction`、测试补充。 |
| 滚动与动效 | `#root`/`.app-shell` 滚动链，植物摇摆与近峰值表盘轻微呼吸，`prefers-reduced-motion` 关闭动画。 |
| 窗口拖拽与布局 | Toolbar / 拖拽 shim、专注顶栏左上角拖条、`thickFrame` 边框缩放。 |
| 专注与会话统计 | `FocusCelebrationOverlay`、`focusStats` 与 app 持久化、`MIN_FOCUS_SESSION_CELEBRATION_MS`；与 `ScheduleStickySection`、App 数据流接线。 |

### 已落地功能一览

| 区块 | 说明 |
|------|------|
| 脚手架 | electron.vite 配置，源码 `src/main`、`src/preload`、`src/renderer`。 |
| 窗口 | 置顶、防抖保存 bounds/置顶、`window.desktop` IPC；不透明主窗体与沉浸式视觉策略（见 DESIGN + `src/main/index.ts`）。 |
| 数据 | 用户数据路径下 `app-state.json`：`scheduledItems`、`noteBlocks` 及扩展字段（如专注统计）；渲染进程防抖写入。 |
| UI | 「此刻安排」便签：**专注模式 / 重叠选择 / 庆祝层**；**纸片备忘**；圆环 HMS、植物生长图示与动效；设计令牌见 DESIGN.md。 |

### 关键文件一览

- `src/main/index.ts` — BrowserWindow、`WINDOW_BACKGROUND`、IPC。
- `src/preload/index.ts` — `window.desktop`。
- `src/renderer/src/App.tsx` — Shell、备忘录、日程与庆祝层挂载。
- `src/renderer/src/domain/appData.ts` — 解析/序列化、默认数据结构。
- `src/renderer/src/domain/scheduleTime.ts` — `getStickyLive`、`getRemainingMs`、`needsLiveSecondTick`、`getPlantGrowthFraction`。
- `src/renderer/src/domain/focusStats.ts` — 专注会话统计常量与类型。
- `src/renderer/src/components/ScheduleStickySection.tsx` — 日程便签主干。
- `src/renderer/src/components/FocusCelebrationOverlay.tsx` — Portal 庆祝弹层。
- `scripts/git-save-push.sh` — `git add` + `commit` + `push` 快捷脚本。

### 验证记录

- `npm run typecheck`、`npm run build`、`npm run test`：最近一次本地开发中已通过（随代码变更请在发版前重跑）。
- Electron 置顶、缩放与庆祝层请在图形会话手动确认。
- CI：Windows 安装包见上述 Actions 流程。

### 已知局限 / 后续想法

- Electron postinstall 需写 `~/.cache/electron`；受限环境建议配置 `ELECTRON_CACHE`。
- Node **`v20.18.x`** 对 `vite@7` / `electron-vite@5` 可能出现 `EBADENGINE`；建议 **`20.19+` 或 `22.x`**。
- 未签名 Windows 安装包可能触发 SmartScreen。
- 若需真正的「看穿到桌面」，需权衡 `transparent: true` 与各 OS 缩放/拖拽体验（见 DESIGN.md）。

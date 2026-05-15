# 开发日志

## 2026-05-15

### MDI 子窗口系统

- 新增 `FocusMdiWorkspace` 容器组件，专注模式下支持浮动/停靠子窗口。
- 新增 `MdiPanel` 组件：标题栏拖拽、8 方向缩放手柄、收起/展开、停靠/浮动切换。
- 新增 `useMdiDrag` hook：基于 Pointer Events 的拖拽和缩放逻辑。
- 新增 `useMdiSnap` hook：边缘吸附检测（30px 阈值）。
- 新增 `mdiTypes.ts`：`MdiPanelState`、`MdiDockSide`、`MdiPanelType` 类型定义。
- 三种面板类型：其他事项、纸片备忘、专注统计。
- 底部工具栏可手动添加面板，已存在则切换到该面板。

### 透明窗口

- `BrowserWindow` 设置 `transparent: true`，专注模式下可穿透看到桌面。
- CSS 链：html/body → app-shell → MDI workspace → panel，全部 `background: transparent`。
- 子窗口（标题栏、内容区、dock 容器）在专注模式下同步透明。

### 主页面样式优化

- 背景从软木板改为笔记本风格纯色渐变（`#f7f3ea → #f0ece2`）。
- 外框添加 `border-radius: var(--radius-lg)` 圆角。
- 工具栏更紧凑（`padding: 4px`），去掉 `box-shadow`。
- 便签卡片：统一圆角、顶部色条替代左侧色条、更轻阴影。
- 滚动条更细（`width: 4px`）。
- 删除 `cork-banner` 提示文字。

### 植物系统扩展

- 新增 10 种多肉植物（仙人掌、芦荟、石莲花等），总计 50 种。
- 新增 `SucculentSvg` 组件：莲座叶片 + 陶盆。
- 花卉美化：8 片水滴形花瓣（5 外 + 3 内）、多层花蕊、茎部叶片。
- 树木美化：椭圆树冠、树叶纹理、树干纹理、小草装饰。
- SVG viewBox 扩展为 `-2 -26 84 122`，修复树冠溢出。
- 植物容器添加 `max-height` 和 `overflow: hidden` 约束。
- 主页面卡片隐藏植物，只在专注模式显示。

### 专注模式增强

- 移除默认子窗口创建，进入专注时只显示居中卡片。
- 新增「立即专注」模式：不限时长，选择任意事项开始计时。
- 植物按 1 小时周期生长（`getInstantPlantGrowthFraction`）。
- 新增草坪模式（`LawnPlantGrowth`）：12 株随机散布小植物。
- 庆祝页面取消 3 秒自动退出，改为手动关闭。
- 倒计时结束自动弹出庆祝页面。

### 日程排序与提醒

- 新增 `sortItemsByUrgency`：active > soon > upcoming > past，同状态按 startTime。
- 新增「此刻」按钮：编辑器和作曲器中同步当前时间到开始时间。
- 新增事项开始提醒：每 30 秒检测，匹配时弹窗可选择「开始专注」或「稍后」。

### 面板收起

- 主页面「此刻安排」和「纸片备忘」区域可收起/展开。
- 收起后显示关键摘要（最近事项时间+标题 / 第一条备忘标题）。

### 快速时段按钮

- 编辑器和作曲器的结束时间下方新增快速时段按钮：10 分钟、30 分钟、1 小时、2 小时。
- 点击后基于开始时间自动计算结束时间（跨日取模 24 小时）。

### 修复开始提醒

- 重写提醒检测逻辑：从 30 秒 interval 改为基于渲染的检测（每次 bumpClock 重渲染时执行）。
- 新增 `lastCheckedMinuteRef` 确保每分钟只检查一次，避免重复弹窗。
- 解决了 interval 闭包捕获旧 `data.scheduledItems` 导致提醒无法显示的问题。

### 修复专注模式树溢出

- 进一步收紧专注模式植物容器尺寸：`max-height` 从 `min(140px, 30vmin)` 降至 `min(100px, 22vmin)`。
- SVG 宽度从 `min(7rem, 36vmin)` 降至 `min(5rem, 28vmin)`。

### 快速时段按钮

- 编辑器和作曲器的结束时间下方新增快速时段按钮：10 分钟、30 分钟、1 小时、2 小时。
- 点击后基于开始时间自动计算结束时间（跨日取模 24 小时）。

### 可自定义提前提醒

- `ScheduledItem` 新增 `reminderAdvance` 字段（提前提醒分钟数，0 = 准时，默认 1）。
- 作曲器和编辑器新增提醒提前量选择器：准时 / 提前 1 分 / 3 分 / 5 分 / 10 分。
- 提醒检测逻辑改为按每个事项的 `reminderAdvance` 计算对应的提醒分钟。

### 修复即时专注植物消失

- Bug：提醒页面点击「开始专注」后，专注页面植物生长模块消失。
- 根因：`showClock = remainMs != null && remainMs > 0`，即时专注的事项 `startTime` 已过，`getRemainingMs` 返回 `null`，导致 `clockAside` 整体不渲染。
- 修复：`showClock` 条件改为 `isInstantFocus || (remainMs != null && remainMs > 0)`。
- 即时专注无倒计时时，时钟面显示已专注时长（`now - instantFocusStartMs`）。

### 专注模式气泡缩小动画

- 新增 `remainRatio`（0~1）：有 endTime 的事项按 `remainMs / totalSpan` 计算，即时专注按 `1 - growth` 计算。
- DOM 顺序调整：专注模式下气泡在上、植物在下（锚定底部），非专注模式保持原顺序。
- 气泡通过 CSS 自定义属性 `--remain-ratio` 控制尺寸和透明度，随倒计时逐渐缩小到消失。
- `.sticky-clock-face--shrinking`：宽高用 `calc(var(--remain-ratio) * maxSize)`，透明度用 `var(--remain-ratio)`，transition 1s linear。
- `.sticky-clock--focusImmersive` 添加 `justify-content: flex-end`（底部对齐）。
- 遵守 `prefers-reduced-motion`（禁用 transition）。

### 植物模块重构：svg-plant 库

- 引入 `svg-plant` 库（`npm install svg-plant`）替换手写 SVG 组件。
- 新增 `src/renderer/src/plantEngine/generators/svgPlantGen.ts`：植物工厂，封装 `createPlant(genusKey, seed, cfg)` 函数。
- 4 个属映射：花卉→`pilea`/`bushy`，树木→`dragon`/`bushy`，多肉→`zamia`。
- `StickyPlantGrowth` 重构为 React 容器组件：用 `ref` 挂载 `svg-plant` 生成的 SVG DOM，`progress` 变化时更新 `plant.age` 并调用 `plant.update()`。
- `stickyPlantKinds.ts` 的 `StickyPlantSpecies` 类型新增 `genusKey` 字段（替换原 `hue`）。
- CSS 选择器从 `.sticky-plant-svg` 改为 `.sticky-plant-slot > svg`（适配库生成的 SVG）。
- 构建体积增加约 34KB（650KB → 684KB）。

### svg-plant 重构后 Bug 修复

- **Bug 1 气泡缩小失效**：CSS 特异性冲突，`.sticky-clock-face--shrinking`（0-2-0）被 `.sticky-note--focusImmersive .sticky-clock-face`（0-2-0）覆盖。修复：提高为 `.sticky-note--focusImmersive .sticky-clock-face--shrinking`（0-3-0）。
- **Bug 2 专注模式植物消失**：`getPlantGrowthFraction` 对无 endTime 事项在开始后返回 `null`。修复：无 endTime 已开始时用 1 小时作为默认生长周期。
- **Bug 3 主页出现植物**：非专注分支（`immersive=false`）仍渲染植物。修复：去掉非专注分支的植物渲染。
- **Bug 4 立即专注计时失效**：`useScheduleLiveClock` 不为无 endTime 事项触发秒级 tick。修复：`FocusMdiWorkspace` 新增条件化 fallback interval（仅在 `useScheduleLiveClock` 连续 2 秒不 tick 时激活，避免双重 tick）。

### Code Review 修复

- **growth span**：无 endTime 事项默认生长周期从 1 小时改为 4 小时（14,400,000ms），避免 1 小时后植物停滞。
- **fallback 条件化**：用 ref 检测 `useScheduleLiveClock` 的 tick 是否活跃，仅当 tick 连续 2 秒不变时才触发 fallback 状态更新，消除双重 tick 性能问题。

### 立即专注重构：自定义时长 + 复用常规逻辑

- 立即专注改为两步流程：选择事项 → 选择时长（15分/30分/1小时/2小时/3小时/6小时）。
- 选择时长后，给临时事项设置 `endTime`（当前时间 + 时长），复用常规专注的全部逻辑。
- 删除 `instantFocusStartMs` state 和所有相关分支（`isInstantFocus`、`getInstantPlantGrowthFraction`）。
- 删除 `LawnPlantGrowth` 组件和草坪 CSS（不再需要）。
- 删除 `FocusMdiWorkspace` 的 fallback tick（`useScheduleLiveClock` 现在能正常 tick）。
- `StickyScheduleCard` 简化为纯常规逻辑：`showClock`、`growth`、`remainRatio` 全部基于 `getRemainingMs` 和 `getPlantGrowthFraction`。
- 开始提醒的「开始专注」默认使用 60 分钟时长。
- **跨日修复**：`onInstantFocus` 检测 endTime 是否跨日，跨日时 cap 到 `23:59`，避免 dayKey 不变导致 `getRemainingMs` 计算异常。

### 立即专注重构：FocusSession 独立计时

- 新增 `FocusSession` 类型（`itemId`、`startMs`、`durationMs`），独立于日程卡片的时间段。
- `onInstantFocus` 不再修改事项的 `endTime`，改为设置 `focusSession` state。
- `StickyScheduleCard` 根据是否有 `focusSession` 决定倒计时和植物生长的计算基准：有 `focusSession` 时以 session 的 `durationMs` 为完整周期，无时用常规 `getPlantGrowthFraction`。
- `remainRatio`（气泡缩小比例）同样以 `focusSession.durationMs` 为基准。
- 退出专注时累计时间取 `Math.min(durationMs, 实际经过时间)`。
- 解决了 3 个 bug：不修改原始时间段、气泡/植物以选择时长为基准、每个时长选择独立。

---

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

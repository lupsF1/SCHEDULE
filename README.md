# Schedule

便签风格的**桌面日程**与**纸片备忘**。使用 **Electron** 呈现笔记本风格 UI，置顶小窗即可查看当日「此刻安排」与随手备忘。

远程仓库：https://github.com/lupsF1/SCHEDULE

## 功能概览

### 日程管理

- **日程便签**：「贴上来」创建草稿 → 设定开始/可选结束时间与标题 → 保存后卡片进入时间线。
- **紧急度排序**：进行中 → 即将开始 → 待开始 → 已结束，同状态内按开始时间排序。
- **状态与时间**：距开始（upcoming / soon）、进行中、已结束；环形 **H:M:S** 倒计时每秒刷新。
- **同步当前时间**：新建/编辑卡片时点击「此刻」按钮自动填入当前时间。
- **区域收起**：「此刻安排」和「纸片备忘」区域可收起/展开，收起后显示关键摘要。
- **开始提醒**：事项到达开始时间时弹窗提醒，可选择「开始专注」或「稍后」。

### 专注模式

- **限时专注**：进行中事项可切入沉浸式单卡视图，倒计时结束后自动弹出庆祝页面。
- **立即专注**：不限时长，选择任意已创建事项开始专注计时，植物按 1 小时周期生长。
- **MDI 子窗口**：专注模式下可手动添加浮动/停靠子窗口（其他事项、纸片备忘、专注统计），支持拖拽、缩放、边缘吸附、收起/展开。
- **透明窗口**：专注模式下窗口背景完全透明，可穿透看到桌面；子窗口背景同步透明。
- **庆祝页面**：专注结束后显示植物、本次时长、累计时间，手动点击退出。

### 植物图示

- **50 种植物**：20 种花卉 + 20 种树木 + 10 种多肉，随时间进度生长。
- **草坪模式**：立即专注时显示随机散布的小植物草坪，逐株生长。
- **生长动画**：植物摇摆、花瓣展开、峰值高光（遵守系统「减少动画」）。
- **专注模式显示**：植物仅在专注模式卡片中显示，主页面卡片只显示倒计时钟。

### 纸片备忘

- 多块便签正文，独立于日程，支持收起/展开。

### 窗口

- 拖拽移动（顶栏/专用拖拽区）、可选置顶；位置与置顶状态防抖落盘。
- 圆角边框、笔记本风格渐变背景、细滚动条。
- 透明窗口模式（`transparent: true`），专注模式下穿透桌面。

### 设计系统

见根目录 **[DESIGN.md](./DESIGN.md)**（YAML 令牌 + Markdown 导读）；可按 `package.json` 脚本做 `design:lint` / 导出令牌。

## 技术栈

- **Electron** + **electron-vite** — 主进程、预加载、[React 19](https://react.dev/) + **TypeScript** 渲染进程
- **Vite 7**、**Vitest** 单元测试
- **[svg-plant](https://github.com/days-later/svg-plant)** — 程序化 SVG 植物生成（4 个属：BushyPlant、DragonTree、Zamia、Pilea）
- **[design.md](https://github.com/google-labs-code/design.md)** — `DESIGN.md` 规范性校验（`npm run design:lint`）

## 环境与安装

需要 **Node.js**（建议 **20.19+** 或 **22.x**；过旧的 20.18 可能与当前 Vite 生态出现 engine 告警）。开发与运行桌面应用需要**图形会话**（本机桌面或 forwarding 的 `DISPLAY` / Wayland）。

```bash
git clone git@github.com:lupsF1/SCHEDULE.git
cd SCHEDULE   # 或克隆后的目录名
npm install
```

首次安装将下载 Electron；若受限环境写入失败，可自行设置 `ELECTRON_CACHE` 等缓存路径。

## 常用命令

| 命令 | 作用 |
|------|------|
| `npm run dev` | 启动开发模式（electron-vite + HMR）。 |
| `npm run compile` | 编译到 `out/`（不写安装包）。 |
| `npm run build` | 同 `compile`。 |
| `npm run test` | Vitest 跑单元测试。 |
| `npm run typecheck` | `tsc --noEmit`（主进程 + renderer）。 |
| `npm run dist` | 构建当前平台安装包产物到 **`release/`**。 |
| `npm run dist:win` / `dist:linux` | 分别构建 Windows NSIS / Linux AppImage（需在对应或可交叉环境）。 |
| `npm run design:lint` | 校验 `DESIGN.md`。 |
| `./scripts/git-save-push.sh` 或 `npm run git:push -- "提交说明"` | `git add -A`、`commit`、`push origin`（无改动则跳过提交仍执行 push）。 |

## 目录结构

```
src/
  main/
    index.ts              # Electron 主进程（窗口、IPC、状态路径）
    statePaths.ts         # 用户数据路径
    windowPersistence.ts  # 窗口 bounds/置顶状态持久化
  preload/
    index.ts              # window.desktop 桥接
    index.d.ts            # DesktopAPI 类型声明
  renderer/
    index.html            # HTML 入口
    src/
      main.tsx            # React 入口
      App.tsx             # 根组件：状态管理、页面切换、庆祝层
      assets/
        main.css          # 全部样式（~1300 行）
      components/
        ScheduleStickySection.tsx    # 日程卡片、编辑器、专注模式、MDI 面板
        FocusCelebrationOverlay.tsx  # 专注结束庆祝弹层
        FocusMdiWorkspace.tsx        # 专注模式 MDI 工作区容器
        MdiPanel.tsx                 # 浮动/停靠子窗口组件
        StickyPlantGrowth.tsx        # 植物 SVG（花/树/多肉/草坪）
      domain/
        appData.ts          # 数据类型、解析/序列化、默认值
        scheduleTime.ts     # 时间计算、紧急度排序、植物生长
        focusStats.ts       # 专注会话统计
        stickyPlantKinds.ts # 50 种植物定义
        mdiTypes.ts         # MDI 子窗口类型和常量
      hooks/
        useScheduleLiveClock.ts  # 秒级/分钟级时钟
        useWindowResizeBump.ts   # ResizeObserver 布局刷新
        useMdiDrag.ts            # MDI 拖拽/缩放
        useMdiSnap.ts            # MDI 边缘吸附
      plantEngine/
        generators/
          svgPlantGen.ts         # svg-plant 植物工厂
DESIGN.md                 # 设计令牌与 UI 准则
docs/dev-log.md           # 开发与迭代记录（中文）
```

运行时用户数据路径由主进程 IPC 暴露；应用状态（日程、备忘录、专注统计）经由预加载 **`state:save` / `state:load`** 由渲染进程读写 JSON。

## 视图状态

### 主页面

- 笔记本风格渐变背景 + 圆角边框
- 「此刻安排」日程卡片列表（紧急度排序）
- 「纸片备忘」便签区域
- 两个区域均可收起/展开
- 顶部工具栏（置顶、收起窗口）

### 专注模式

进入专注后，界面切换为沉浸式工作区：

1. **空白工作区** — 顶部拖拽条 + 居中专注卡片，无子窗口
2. **停靠面板** — 子窗口停靠在四边，中心卡片自动适配
3. **浮动面板** — 自由拖拽、缩放，独立 z-index
4. **混合模式** — 停靠 + 浮动同时存在
5. **面板收起** — 单行摘要替代完整内容

### 庆祝覆盖层

专注结束后弹出，显示植物、时长、累计统计，手动关闭返回主页面。

## Windows 安装包（无本机 Windows 时）

在 **GitHub Actions** 中手动运行 workflow **「Build Windows installer」**（参见 [.github/workflows/build-windows-installer.yml](./.github/workflows/build-windows-installer.yml)），在运行结果 **Artifacts** 中下载 **`Schedule-Setup-*.exe`**。

## 相关文档

- [docs/dev-log.md](./docs/dev-log.md) — 按日期的开发与修改纪要、已知局限。
- [DESIGN.md](./DESIGN.md) — 视觉与组件约定（含 Electron 透明窗口与沉浸式说明）。

## 许可证

本项目以 **MIT** 许可分发（见 `package.json` 中 `license` 字段）。

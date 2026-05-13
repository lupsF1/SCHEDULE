# 开发日志

## 2026-05-13

### 环境与脚本

- 栈：**Electron + electron-vite + React 19 + TypeScript**。
- 运行：`npm run dev`（需图形环境：`DISPLAY`/Wayland）。
- **仅编译**（不打包）：`npm run compile` / `npm run build` → `out/`。
- **发布安装包**（electron-builder，`release/`）：见根目录 [`electron-builder.yml`](/home/lups/Schedule/electron-builder.yml)。
  - **Windows 安装包（三种方式）**：  
    1. **本项目内自动化（推荐在 Linux/WSL 开发时）**：把仓库推到 **GitHub**，在 **Actions** 里打开 **「Build Windows installer」** 工作流，点 **Run workflow**；成功后到该次运行页面 **Artifacts** 下载 `schedule-setup-exe`（解压即得 `Schedule-Setup-*.exe`）。工作流定义见 [`.github/workflows/build-windows-installer.yml`](../.github/workflows/build-windows-installer.yml)（云端使用 `windows-latest`，无需本地 Windows）。  
    2. **本机已是 Windows**：在项目根目录 `npm install` → `npm run dist:win`，在 **`release/`** 目录得到 **`Schedule-Setup-0.1.0.exe`**（版本与 `package.json` 一致）。  
    3. **仅 Linux/WSL 本机**：用 Wine 交叉打 NSIS **可行但不推荐**（环境问题多）；优先用上面的 GitHub Actions 或借一台 Windows。
  - **Linux**：`npm run dist:linux` → `release/` 下的 **AppImage**（若在 WSL/需图形）。
  - **当前平台全套**：`npm run dist`。
- `npm run test` — Vitest（`src/renderer/src/domain/appData.test.ts`）。

### 已落地功能

| 区块 | 说明 |
|------|------|
| 脚手架 | [electron.vite.config.ts](../electron.vite.config.ts)，源码 `src/main`、`src/preload`、`src/renderer`。 |
| 窗口 | 置顶切换、防抖保存窗口 bounds + 置顶到 `window-state.json`（见 `src/main/index.ts`）。 |
| 数据 | `app-state.json` 存 `scheduledItems`、`noteBlocks`；渲染进程约 420ms 防抖写入（见 `src/renderer/src/App.tsx`）。 |
| UI | 「今日时间线」按开始时间排序；可编辑时间与标题；可编辑多版块备忘录；对齐 `DESIGN.md` CSS 变量（`src/renderer/src/assets/main.css`）。 |

### 关键文件一览

- `src/main/index.ts` — 窗口与 IPC。
- `src/preload/index.ts` — `window.desktop` 桥。
- `src/renderer/src/App.tsx` — UI 入口。
- `src/renderer/src/domain/appData.ts` — 序列化与时间排序。

### 验证记录

- `npm run typecheck`：**通过**。
- `npm run build`：**通过**。
- `npm run test`：**通过**（`appData` 解析与时间解析）。
- `electron-builder` 配置已加入（`npm run dist:win` 等）；完整安装包需在对应操作系统上执行打包（含下载 Electron 二进制）。
- 未在无显示环境下执行 Electron 预览；置顶与缩放需在图形会话手动确认。

### 已知局限 / 后续想法

- Electron postinstall 需写 `~/.cache/electron`；沙盒或未授权路径会失败，建议在完整权限或自定义 `ELECTRON_CACHE` 下安装。
- Node `v20.18.x` 对 `vite@7` / `electron-vite@5` 可能出现 `EBADENGINE` 警告；建议 `20.19+` 或 `22.x`。
- 未签名的 Windows 安装包可能触发 SmartScreen，需「仍要运行」或日后配置代码签名。
- 打包时若从 GitHub 拉取 Electron 出现 `EOF`/超时，多为网络问题：重试或使用稳定网络/镜像（如企业环境需代理）。

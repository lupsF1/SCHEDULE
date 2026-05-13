# Schedule

便签风格的**桌面日程**与**纸片备忘**。使用 **Electron** 呈现软木板 Corkboard UI，置顶小窗即可查看当日「此刻安排」与随手备忘。

远程仓库：https://github.com/lupsF1/SCHEDULE

## 功能概览

- **日程便签**：「贴上来」创建草稿 → 设定开始/可选结束时间与标题 → 保存后卡片进入时间线排序。
- **状态与时间**：距开始（upcoming / soon）、进行中、已结束；环形 **H:M:S** 在距开始或距结束仍为正值时每秒刷新。
- **植物图示**：与时间进度联动的简略花/树 SVG，附带轻微摆动与临近完成时的微弱表盘高光（遵守系统「减少动画」）。
- **专注模式**：进行中事项可切入单卡沉浸视图；会话结束可申请「庆祝」弹层（统计数据持久化）。
- **纸片备忘**：多块便签正文，独立于日程。
- **窗口**：拖拽移动（顶栏/专用拖拽区）、可选置顶；位置与置顶状态防抖落盘。
- **设计系统**：见根目录 **[DESIGN.md](./DESIGN.md)**（YAML 令牌 + Markdown 导读）；可按 `package.json` 脚本做 `design:lint` / 导出令牌。

## 技术栈

- **Electron** + **electron-vite** — 主进程、预加载、[React 19](https://react.dev/) + **TypeScript** 渲染进程  
- **Vite 7**、**Vitest** 单元测试  
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

## 目录结构（简要）

```
src/
  main/           # Electron 主进程（窗口、IPC、状态路径）
  preload/        # 预加载：`window.desktop` 桥接
  renderer/       # React：App、样式、hooks、组件、domain（纯函数与类型）
DESIGN.md         # 设计令牌与 UI 准则
docs/dev-log.md   # 开发与迭代记录（中文）
electron-builder.yml
.github/workflows/build-windows-installer.yml
scripts/git-save-push.sh
```

运行时用户数据路径由主进程 IPC 暴露；应用状态（日程、备忘录、扩展字段）经由预加载 **`state:save` / `state:load`** 由渲染进程读写 JSON。

## Windows 安装包（无本机 Windows 时）

在 **GitHub Actions** 中手动运行 workflow **「Build Windows installer」**（参见 [.github/workflows/build-windows-installer.yml](./.github/workflows/build-windows-installer.yml)），在运行结果 **Artifacts** 中下载 **`Schedule-Setup-*.exe`**。

## 相关文档

- [docs/dev-log.md](./docs/dev-log.md) — 按日期的开发与修改纪要、已知局限。  
- [DESIGN.md](./DESIGN.md) — 视觉与组件约定（含 Electron 不透明窗口与沉浸式说明）。

## 许可证

本项目以 **MIT** 许可分发（见 `package.json` 中 `license` 字段）。

# 桌面贴片日程 — 设计规格（MVP）

## 范围

Electron 单机应用：单列「当日」时间安排 + 可编辑文字版块；窗口可自由缩放，支持桌面置顶以便「贴片」使用。数据仅存本机 JSON（`userData`），无云同步。

## 用户体验

| 需求 | MVP 行为 |
|------|-----------|
| 贴桌面感 | 「置顶」复选框，调用 `BrowserWindow.setAlwaysOnTop` |
| 调窗口尺寸 | OS 原生拉伸；`minWidth` 320 / `minHeight` 360 |
| 持久化几何 | `window-state.json` 保存边界与置顶状态 |
| 记时间 | 每条日程含 `startTime`/`endTime`（HTML `time`，本地日 `dayKey=YYYY-MM-DD`）|
| 可编辑版块 | 多个 `noteBlocks`，标题 + 多行正文；可增减版块 |

## 数据模型（`app-state.json`，version 1）

```ts
ScheduledItem {
  id: string
  dayKey: string   // YYYY-MM-DD（本地日历）
  title: string
  startTime: string // HH:mm
  endTime: string | null
}

NoteBlock {
  id: string
  title: string
  body: string
}

AppDataV1 {
  version: 1
  scheduledItems: ScheduledItem[]
  noteBlocks: NoteBlock[]
}
```

渲染层每 60 秒唤醒一次以使跨日时 `dayKey` 与文案更新（轻量）。

## 进程与安全

- `contextIsolation: true`，preload 仅 `contextBridge.exposeInMainWorld('electron' | 'desktop', …)`。
- IPC：`state:load`/`state:save`、`window:setAlwaysOnTop`、`window:getAlwaysOnTop`、`window:close`、路径查询等。

## 分发与安装包（electron-builder）

- 配置见根目录 `electron-builder.yml`；产物输出到 `release/`。
- **Windows 安装包**：在 Windows 上执行 `npm run dist:win`，在 `release/` 得到 **`Schedule-Setup-<version>.exe`**；或在 **GitHub Actions**（本仓库 `build-windows-installer` 工作流）中构建并下载 Artifact。
- 在 macOS/Linux 上交叉打 Windows 包需额外工具链（如 Wine 或 CI Windows runner），本仓库默认按「在目标系统上打包」使用。

## 非目标（本阶段）

- 跨设备云同步与账号体系
- 系统日历订阅（Apple/Google Calendar）
- 复杂重复规则（RRULE）
- 多窗口 / 日历月视图（可后续迭代）
- 端到端加密与账号

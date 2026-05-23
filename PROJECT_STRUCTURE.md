
# MyTool 项目结构文档

## 项目概述

**MyTool** 是一个基于 Electron + Vue 3 + TypeScript 开发的桌面应用工具集，包含多种实用功能模块。

- **项目名称**: mytool
- **当前版本**: 1.0.52
- **技术栈**: Electron 39, Vue 3, TypeScript, Vite, Element Plus, Pinia, Vue Router

---

## 目录结构

```
MyTool/
├── .github/                    # GitHub 配置
│   └── workflows/
│       └── ci.yml              # CI/CD 配置
├── .qoder/                     # Qoder 文档
│   └── repowiki/
│       └── zh/                 # 中文文档
├── .trae/                      # Trae 配置
├── .vscode/                    # VS Code 配置
│   ├── extensions.json
│   ├── launch.json
│   └── settings.json
├── build/                      # 构建相关文件
│   ├── afterAllArtifactBuild.cjs
│   ├── afterPack.cjs
│   ├── entitlements.mac.plist
│   ├── icon.icns               # macOS 图标
│   ├── icon.ico                # Windows 图标
│   └── icon.png
├── resources/                  # 资源文件
│   └── icon.png
├── src/                        # 源代码目录
│   ├── main/                   # Electron 主进程
│   │   ├── api/                # API 模块
│   │   │   ├── index.ts
│   │   │   └── ipc.ts          # IPC 通信
│   │   ├── db/                 # 数据库模块
│   │   │   ├── services/       # 数据服务
│   │   │   │   ├── note.ts     # 记事本服务
│   │   │   │   └── user.ts     # 用户服务
│   │   │   └── index.ts        # 数据库入口
│   │   ├── wechat-watch/       # 微信监控模块
│   │   │   ├── index.ts
│   │   │   ├── macos.ts
│   │   │   └── windows.ts
│   │   ├── about.ts            # 关于窗口
│   │   ├── index.ts            # 主进程入口
│   │   ├── logger.ts           # 日志模块
│   │   ├── media.ts            # 媒体处理
│   │   ├── upload.ts           # 上传模块
│   │   └── wechat.ts           # 微信相关
│   ├── preload/                # 预加载脚本
│   │   ├── index.d.ts          # 类型定义
│   │   └── index.ts
│   └── renderer/               # 渲染进程（Vue 应用）
│       ├── src/
│       │   ├── assets/         # 静态资源
│       │   │   ├── img/
│       │   │   │   └── user.png
│       │   │   ├── base.css
│       │   │   ├── electron.svg
│       │   │   ├── main.css
│       │   │   ├── tool-layout.scss
│       │   │   └── wavy-lines.svg
│       │   ├── components/     # 通用组件
│       │   │   └── Versions.vue
│       │   ├── hooks/          # 组合式函数
│       │   │   ├── useFileSave.ts
│       │   │   ├── useFormat.ts
│       │   │   └── useMediaConvert.ts
│       │   ├── layout/         # 布局组件
│       │   │   ├── components/
│       │   │   │   └── Sidebar.vue
│       │   │   └── index.vue
│       │   ├── router/         # 路由配置
│       │   │   └── index.ts
│       │   ├── store/          # Pinia 状态管理
│       │   │   ├── apiHistory.ts
│       │   │   ├── index.ts
│       │   │   ├── settings.ts
│       │   │   ├── user.ts
│       │   │   └── wechat.ts
│       │   ├── utils/          # 工具函数
│       │   │   ├── request.ts
│       │   │   └── theme.ts
│       │   ├── views/          # 页面视图
│       │   │   ├── AIChat/            # AI 聊天
│       │   │   ├── About/             # 关于页面
│       │   │   ├── ApiTest/           # 接口测试工具
│       │   │   ├── AudioConvert/      # 音频转换
│       │   │   ├── Calculator/        # 计算器
│       │   │   ├── FileUpload/        # 文件上传
│       │   │   ├── FormatConvert/     # 格式转换
│       │   │   ├── ImageConvert/      # 图片转换
│       │   │   ├── Login/             # 登录页
│       │   │   ├── Notepad/           # 本地记事本
│       │   │   ├── NovelReader/       # 小说阅读器
│       │   │   ├── Profile/           # 个人中心
│       │   │   ├── QQChat/            # QQ 聊天
│       │   │   ├── Settings/          # 系统设置
│       │   │   ├── VideoConvert/      # 视频转换
│       │   │   └── WechatAssistant/   # 微信助手
│       │   ├── App.vue                # 根组件
│       │   └── main.ts                # Vue 应用入口
│       └── index.html                 # HTML 模板
├── .cursorrules
├── .editorconfig
├── .gitignore
├── .prettierignore
├── .prettierrc.cjs
├── .prettierrc.yaml
├── .traerules
├── README.md
├── dev-app-update.yml
├── electron-builder.yml       # Electron Builder 配置
├── electron.vite.config.ts    # Electron Vite 配置
├── eslint.config.mjs
├── jsconfig.json
├── package.json
├── tsconfig.json
├── tsconfig.node.json
└── tsconfig.web.json
```

---

## 核心模块说明

### 1. 主进程 ([src/main](file:///Users/tph/Desktop/tool/MyTool/src/main))

| 文件/目录 | 功能说明 |
|----------|---------|
| [index.ts](file:///Users/tph/Desktop/tool/MyTool/src/main/index.ts) | 主进程入口，负责创建和管理应用窗口 |
| [api/ipc.ts](file:///Users/tph/Desktop/tool/MyTool/src/main/api/ipc.ts) | IPC 通信处理，主进程与渲染进程交互 |
| [db/](file:///Users/tph/Desktop/tool/MyTool/src/main/db) | SQLite 数据库相关，包含用户和记事本数据服务 |
| [wechat-watch/](file:///Users/tph/Desktop/tool/MyTool/src/main/wechat-watch) | 微信监控模块，支持 macOS 和 Windows |
| [media.ts](file:///Users/tph/Desktop/tool/MyTool/src/main/media.ts) | 音视频处理，使用 FFmpeg |
| [upload.ts](file:///Users/tph/Desktop/tool/MyTool/src/main/upload.ts) | 文件上传模块 |

### 2. 预加载脚本 ([src/preload](file:///Users/tph/Desktop/tool/MyTool/src/preload))

| 文件 | 功能说明 |
|------|---------|
| [index.ts](file:///Users/tph/Desktop/tool/MyTool/src/preload/index.ts) | 预加载脚本，暴露安全的 API 给渲染进程 |
| [index.d.ts](file:///Users/tph/Desktop/tool/MyTool/src/preload/index.d.ts) | 类型定义文件 |

### 3. 渲染进程 ([src/renderer/src](file:///Users/tph/Desktop/tool/MyTool/src/renderer/src))

#### 3.1 页面视图 ([views](file:///Users/tph/Desktop/tool/MyTool/src/renderer/src/views))

| 模块 | 功能说明 |
|------|---------|
| **AIChat** | AI 聊天助手 |
| **ApiTest** | 接口测试工具，支持请求发送和响应查看 |
| **AudioConvert** | 音频格式转换 |
| **Calculator** | 计算器 |
| **FileUpload** | 云端文件上传 |
| **FormatConvert** | 通用格式转换 |
| **ImageConvert** | 图片格式转换 (PNG/JPEG/WEBP/BMP/ICO) |
| **Notepad** | 本地记事本，富文本编辑 |
| **NovelReader** | 小说阅读器 |
| **VideoConvert** | 视频转换与裁剪 |
| **WechatAssistant** | 微信助手 |
| **Login/Profile/Settings** | 用户系统与设置 |

#### 3.2 状态管理 ([store](file:///Users/tph/Desktop/tool/MyTool/src/renderer/src/store))

使用 Pinia 进行状态管理：
- [user.ts](file:///Users/tph/Desktop/tool/MyTool/src/renderer/src/store/user.ts) - 用户状态
- [settings.ts](file:///Users/tph/Desktop/tool/MyTool/src/renderer/src/store/settings.ts) - 设置状态
- [apiHistory.ts](file:///Users/tph/Desktop/tool/MyTool/src/renderer/src/store/apiHistory.ts) - API 历史记录
- [wechat.ts](file:///Users/tph/Desktop/tool/MyTool/src/renderer/src/store/wechat.ts) - 微信相关状态

---

## 技术栈与依赖

### 核心框架

- **Electron** ^39.2.6 - 桌面应用框架
- **Vue** ^3.5.25 - 前端框架
- **TypeScript** ^5.9.3 - 类型安全
- **Vite** ^7.2.6 + **electron-vite** ^5.0.0 - 构建工具

### UI 与状态管理

- **Element Plus** ^2.13.7 - UI 组件库
- **Pinia** ^3.0.4 - 状态管理
- **Vue Router** ^5.0.4 - 路由管理
- **pinia-plugin-persistedstate** ^4.7.1 - 状态持久化

### 功能库

- **SQLite3** ^6.0.1 - 本地数据库
- **FFmpeg** - 音视频处理
  - `@ffmpeg-installer/ffmpeg` ^1.1.0
  - `@ffprobe-installer/ffprobe` ^2.1.2
  - `fluent-ffmpeg` ^2.1.3
- **Jimp** ^1.6.1 - 图片处理
- **七牛云 SDK** ^7.15.1 - 云存储
- **Axios** ^1.15.0 - HTTP 请求
- **Socket.IO** ^4.7.5 - WebSocket 通信
- **WangEditor** ^5.1.23 - 富文本编辑器

### 开发工具

- **ESLint** ^9.39.1 - 代码检查
- **Prettier** ^3.7.4 - 代码格式化
- **Electron Builder** ^25.1.8 - 应用打包
- **Electron Updater** ^6.3.9 - 自动更新

---

## 可用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发模式 |
| `npm run build` | 执行类型检查并构建 |
| `npm run build:win` | 构建 Windows 版本 |
| `npm run build:mac` | 构建 macOS 版本 |
| `npm run build:linux` | 构建 Linux 版本 |
| `npm run lint` | 代码检查 |
| `npm run format` | 代码格式化 |
| `npm run typecheck` | 类型检查 |

---

## 配置文件

| 文件 | 说明 |
|------|------|
| [electron.vite.config.ts](file:///Users/tph/Desktop/tool/MyTool/electron.vite.config.ts) | Electron Vite 构建配置 |
| [electron-builder.yml](file:///Users/tph/Desktop/tool/MyTool/electron-builder.yml) | 应用打包配置 |
| [tsconfig.json](file:///Users/tph/Desktop/tool/MyTool/tsconfig.json) | TypeScript 基础配置 |
| [tsconfig.node.json](file:///Users/tph/Desktop/tool/MyTool/tsconfig.node.json) | Node 环境 TypeScript 配置 |
| [tsconfig.web.json](file:///Users/tph/Desktop/tool/MyTool/tsconfig.web.json) | Web 环境 TypeScript 配置 |
| [eslint.config.mjs](file:///Users/tph/Desktop/tool/MyTool/eslint.config.mjs) | ESLint 配置 |
| [.prettierrc.yaml](file:///Users/tph/Desktop/tool/MyTool/.prettierrc.yaml) | Prettier 格式化配置 |


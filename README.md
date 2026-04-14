# mytool

An Electron application with Vue and TypeScript

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar)

## Project Setup

### Install

```bash
$ npm install
```

### Development

```bash
$ npm run dev
```

### Build

```bash
# For windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```

## 新增功能 (Media Tools)

- **图片格式转换**：支持 PNG/JPEG/WEBP/BMP/ICO 等多种格式相互转换。
- **音视频转换与裁剪**：内置原生媒体播放器，支持 MP3, WAV, MP4, MKV 等常见格式，并支持通过直观拖拽与时间轴截取精准的时间段。
- **自动持久化配置**：可在系统设置中一键配置全局输出目录，实现静默后台转换。

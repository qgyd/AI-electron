# IPC通信API

<cite>
**本文档引用的文件**
- [src/main/index.ts](file://src/main/index.ts)
- [src/preload/index.ts](file://src/preload/index.ts)
- [src/preload/index.d.ts](file://src/preload/index.d.ts)
- [src/main/db.ts](file://src/main/db.ts)
- [src/main/logger.ts](file://src/main/logger.ts)
- [src/renderer/src/views/Notepad/index.vue](file://src/renderer/src/views/Notepad/index.vue)
- [src/renderer/src/views/Settings/index.vue](file://src/renderer/src/views/Settings/index.vue)
- [package.json](file://package.json)
</cite>

## 目录

1. [简介](#简介)
2. [项目结构](#项目结构)
3. [核心组件](#核心组件)
4. [架构概览](#架构概览)
5. [详细组件分析](#详细组件分析)
6. [依赖关系分析](#依赖关系分析)
7. [性能考虑](#性能考虑)
8. [故障排除指南](#故障排除指南)
9. [结论](#结论)

## 简介

MyTool项目采用Electron框架构建，实现了主进程与渲染进程之间的安全IPC通信机制。本文档详细说明了数据库操作IPC和日志管理IPC的完整API规范，包括消息传递协议、参数格式、返回值规范和错误处理机制。

项目使用了现代的Electron开发模式，通过`contextBridge` API在渲染进程中暴露受限制的Electron功能，确保了上下文隔离的安全性。

## 项目结构

MyTool项目的IPC通信架构基于以下核心文件组织：

```mermaid
graph TB
subgraph "主进程"
Main[index.ts<br/>主进程入口]
DB[db.ts<br/>数据库操作]
Logger[logger.ts<br/>日志管理]
end
subgraph "预加载层"
Preload[index.ts<br/>API暴露]
Types[index.d.ts<br/>类型定义]
end
subgraph "渲染进程"
Notepad[Notepad/index.vue<br/>笔记应用]
Settings[Settings/index.vue<br/>设置界面]
end
Main --> DB
Main --> Logger
Preload --> Main
Notepad --> Preload
Settings --> Preload
```

**图表来源**

- [src/main/index.ts:1-112](file://src/main/index.ts#L1-L112)
- [src/preload/index.ts:1-37](file://src/preload/index.ts#L1-L37)

**章节来源**

- [src/main/index.ts:1-112](file://src/main/index.ts#L1-L112)
- [src/preload/index.ts:1-37](file://src/preload/index.ts#L1-L37)

## 核心组件

### IPC通信协议

MyTool项目实现了两种主要的IPC通信方式：

1. **invoke模式**：用于需要返回值的异步操作
2. **send模式**：用于不需要返回值的通知型操作

### API暴露机制

通过`contextBridge` API在渲染进程中暴露受限的Electron功能：

```mermaid
sequenceDiagram
participant Renderer as 渲染进程
participant Preload as 预加载脚本
participant Main as 主进程
participant DB as 数据库模块
participant Logger as 日志模块
Renderer->>Preload : 调用 window.api.db.getNotes()
Preload->>Main : ipcRenderer.invoke('db : getNotes')
Main->>DB : dbOperations.getNotes()
DB-->>Main : 笔记列表数据
Main-->>Preload : Promise结果
Preload-->>Renderer : 异步结果
Note over Renderer,Logger : 日志操作示例
Renderer->>Preload : window.api.log.getPath()
Preload->>Main : ipcRenderer.invoke('log : getPath')
Main->>Logger : getLogPath()
Logger-->>Main : 日志路径
Main-->>Preload : Promise结果
Preload-->>Renderer : 日志路径
```

**图表来源**

- [src/preload/index.ts:5-18](file://src/preload/index.ts#L5-L18)
- [src/main/index.ts:80-85](file://src/main/index.ts#L80-L85)

**章节来源**

- [src/preload/index.ts:1-37](file://src/preload/index.ts#L1-L37)
- [src/main/index.ts:58-92](file://src/main/index.ts#L58-L92)

## 架构概览

### IPC通道架构

```mermaid
graph TD
subgraph "渲染进程API"
DB_API[db API]
LOG_API[log API]
end
subgraph "预加载层"
INVOKE[invoke模式]
SEND[send模式]
end
subgraph "主进程处理"
DB_HANDLERS[数据库处理器]
LOG_HANDLERS[日志处理器]
end
subgraph "底层服务"
SQLITE[SQLite数据库]
FS[文件系统]
SHELL[系统外壳]
end
DB_API --> INVOKE
LOG_API --> INVOKE
INVOKE --> DB_HANDLERS
INVOKE --> LOG_HANDLERS
DB_HANDLERS --> SQLITE
LOG_HANDLERS --> FS
LOG_HANDLERS --> SHELL
```

**图表来源**

- [src/main/index.ts:80-85](file://src/main/index.ts#L80-L85)
- [src/main/db.ts:58-99](file://src/main/db.ts#L58-L99)
- [src/main/logger.ts:25-39](file://src/main/logger.ts#L25-L39)

### 上下文隔离安全机制

项目采用了严格的上下文隔离安全策略：

```mermaid
flowchart TD
Start([应用启动]) --> CheckIsolation{"上下文隔离启用?"}
CheckIsolation --> |是| BridgeInit[初始化contextBridge]
CheckIsolation --> |否| DirectExpose[直接暴露到全局]
BridgeInit --> ExposeAPI[暴露受限制API]
DirectExpose --> ExposeAPI
ExposeAPI --> DefineTypes[定义TypeScript类型]
DefineTypes --> Ready([API就绪])
ExposeAPI --> SecurityCheck[安全检查]
SecurityCheck --> ErrorHandle[错误处理]
ErrorHandle --> Ready
```

**图表来源**

- [src/preload/index.ts:24-36](file://src/preload/index.ts#L24-L36)
- [src/preload/index.d.ts:1-22](file://src/preload/index.d.ts#L1-L22)

**章节来源**

- [src/preload/index.ts:24-36](file://src/preload/index.ts#L24-L36)
- [src/preload/index.d.ts:1-22](file://src/preload/index.d.ts#L1-L22)

## 详细组件分析

### 数据库操作IPC API

#### API定义

数据库操作通过`window.api.db`对象提供，支持以下方法：

| 方法名        | 参数                                             | 返回值                                                                                                      | 描述               |
| ------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- | ------------------ |
| `addNote`     | `{ title: string; content: string }`             | `Promise<{ id: number; title: string; content: string; create_time: number; update_time: number }>`         | 添加新笔记         |
| `updateNote`  | `{ id: number; title: string; content: string }` | `Promise<{ id: number; title: string; content: string; update_time: number }>`                              | 更新现有笔记       |
| `getNotes`    | 无                                               | `Promise<Array<{ id: number; title: string; create_time: number; update_time: number }>>`                   | 获取笔记列表       |
| `getNoteById` | `number`                                         | `Promise<{ id: number; title: string; content: string; create_time: number; update_time: number } \| null>` | 根据ID获取笔记详情 |
| `deleteNote`  | `number`                                         | `Promise<boolean>`                                                                                          | 删除指定ID的笔记   |

#### 数据库实现细节

```mermaid
classDiagram
class DbOperations {
+addNote(note) Promise~Object~
+updateNote(note) Promise~Object~
+getNotes() Promise~Array~
+getNoteById(id) Promise~Object|null~
+deleteNote(id) Promise~boolean~
}
class Sqlite3Database {
+run(sql, params) Promise~number~
+all(sql, params) Promise~Array~
}
class Note {
+id : number
+title : string
+content : string
+create_time : number
+update_time : number
}
DbOperations --> Sqlite3Database : 使用
DbOperations --> Note : 操作
```

**图表来源**

- [src/main/db.ts:58-99](file://src/main/db.ts#L58-L99)

#### 主进程注册

主进程通过`ipcMain.handle`注册数据库相关IPC处理器：

```mermaid
sequenceDiagram
participant Renderer as 渲染进程
participant Preload as 预加载层
participant Main as 主进程
participant DB as 数据库模块
Renderer->>Preload : api.db.addNote(note)
Preload->>Main : ipcRenderer.invoke('db : addNote', note)
Main->>DB : dbOperations.addNote(note)
DB->>DB : 插入新记录
DB-->>Main : 返回新记录ID
Main-->>Preload : Promise结果
Preload-->>Renderer : 完整笔记对象
```

**图表来源**

- [src/main/index.ts:81-85](file://src/main/index.ts#L81-L85)
- [src/main/db.ts:60-67](file://src/main/db.ts#L60-L67)

**章节来源**

- [src/main/db.ts:58-99](file://src/main/db.ts#L58-L99)
- [src/main/index.ts:80-85](file://src/main/index.ts#L80-L85)

### 日志管理IPC API

#### API定义

日志管理通过`window.api.log`对象提供，支持以下方法：

| 方法名       | 参数 | 返回值            | 描述                         |
| ------------ | ---- | ----------------- | ---------------------------- |
| `getPath`    | 无   | `Promise<string>` | 获取当前日志文件路径         |
| `openFolder` | 无   | `Promise<void>`   | 打开日志文件所在目录         |
| `changePath` | 无   | `Promise<string>` | 更改日志存储目录并返回新路径 |

#### 日志实现机制

```mermaid
flowchart TD
Start([日志操作请求]) --> GetPath{"获取路径?"}
GetPath --> |是| ResolvePath[解析日志路径]
GetPath --> |否| ChangePath{"更改路径?"}
ChangePath --> |是| OpenDialog[打开文件对话框]
OpenDialog --> ValidatePath{路径有效?}
ValidatePath --> |是| SetCustomPath[设置自定义路径]
ValidatePath --> |否| UseDefaultPath[使用默认路径]
SetCustomPath --> LogInfo[记录日志变更]
UseDefaultPath --> LogInfo
LogInfo --> ReturnPath[返回新路径]
ChangePath --> |否| OpenFolder{"打开目录?"}
OpenFolder --> |是| ShellOpen[使用系统外壳打开]
OpenFolder --> |否| End([完成])
ResolvePath --> ReturnPath
ReturnPath --> End
ShellOpen --> End
```

**图表来源**

- [src/main/logger.ts:25-39](file://src/main/logger.ts#L25-L39)

**章节来源**

- [src/main/logger.ts:1-42](file://src/main/logger.ts#L1-L42)
- [src/main/index.ts:61-73](file://src/main/index.ts#L61-L73)

### 类型安全定义

项目提供了完整的TypeScript类型定义，确保编译时类型检查：

```mermaid
classDiagram
class ElectronAPI {
<<interface>>
+os : string
+arch : string
+platform : string
+versions : Object
}
class DbAPI {
<<interface>>
+addNote(note) Promise~any~
+updateNote(note) Promise~any~
+getNotes() Promise~any[]~
+getNoteById(id) Promise~any~
+deleteNote(id) Promise~boolean~
}
class LogAPI {
<<interface>>
+getPath() Promise~string~
+openFolder() Promise~void~
+changePath() Promise~string~
}
class WindowAPI {
<<interface>>
+electron : ElectronAPI
+api : {
db : DbAPI
log : LogAPI
}
}
WindowAPI --> ElectronAPI
WindowAPI --> DbAPI
WindowAPI --> LogAPI
```

**图表来源**

- [src/preload/index.d.ts:4-19](file://src/preload/index.d.ts#L4-L19)

**章节来源**

- [src/preload/index.d.ts:1-22](file://src/preload/index.d.ts#L1-L22)

## 依赖关系分析

### 外部依赖

项目的主要外部依赖包括：

| 依赖包                      | 版本    | 用途             |
| --------------------------- | ------- | ---------------- |
| `electron`                  | ^39.2.6 | Electron框架核心 |
| `electron-log`              | ^5.4.3  | 日志记录功能     |
| `sqlite3`                   | ^6.0.1  | SQLite数据库驱动 |
| `@electron-toolkit/preload` | ^3.0.2  | 预加载工具包     |
| `@electron-toolkit/utils`   | ^4.0.0  | 工具函数集合     |

### 内部模块依赖

```mermaid
graph LR
subgraph "主进程模块"
MainIndex[src/main/index.ts]
DBModule[src/main/db.ts]
LoggerModule[src/main/logger.ts]
end
subgraph "预加载模块"
PreloadIndex[src/preload/index.ts]
PreloadTypes[src/preload/index.d.ts]
end
subgraph "渲染进程组件"
NotepadView[src/renderer/.../Notepad/index.vue]
SettingsView[src/renderer/.../Settings/index.vue]
end
MainIndex --> DBModule
MainIndex --> LoggerModule
PreloadIndex --> MainIndex
PreloadTypes --> PreloadIndex
NotepadView --> PreloadIndex
SettingsView --> PreloadIndex
```

**图表来源**

- [package.json:23-38](file://package.json#L23-L38)

**章节来源**

- [package.json:1-61](file://package.json#L1-L61)

## 性能考虑

### 异步处理优化

1. **Promise链式调用**：所有IPC操作都返回Promise，避免阻塞主线程
2. **数据库查询优化**：笔记列表查询仅返回必要字段，减少传输数据量
3. **延迟加载**：数据库模块在应用准备完成后才加载，避免早期I/O操作

### 错误处理策略

```mermaid
flowchart TD
Request[IPC请求] --> TryExecute[执行操作]
TryExecute --> Success{执行成功?}
Success --> |是| ReturnSuccess[返回成功结果]
Success --> |否| CatchError[捕获异常]
CatchError --> LogError[记录错误日志]
LogError --> ReturnError[返回错误信息]
ReturnSuccess --> End[完成]
ReturnError --> End
```

**章节来源**

- [src/main/index.ts:89-92](file://src/main/index.ts#L89-L92)
- [src/main/db.ts:21-23](file://src/main/db.ts#L21-L23)

## 故障排除指南

### 常见问题及解决方案

#### 数据库连接失败

**症状**：应用启动时报数据库连接错误
**原因**：应用数据目录尚未创建或权限不足
**解决方案**：

1. 确认应用具有写入用户数据目录的权限
2. 检查磁盘空间是否充足
3. 重启应用以重新初始化数据库连接

#### IPC调用超时

**症状**：渲染进程长时间等待IPC响应
**原因**：主进程处理逻辑阻塞或数据库操作耗时过长
**解决方案**：

1. 检查数据库查询是否过于复杂
2. 优化SQL查询语句
3. 考虑添加适当的索引

#### 类型定义错误

**症状**：TypeScript编译时报类型错误
**原因**：预加载API类型定义与实际实现不匹配
**解决方案**：

1. 确保预加载脚本中的API定义与TypeScript声明一致
2. 重新编译TypeScript类型定义文件

**章节来源**

- [src/main/db.ts:20-35](file://src/main/db.ts#L20-L35)
- [src/preload/index.d.ts:1-22](file://src/preload/index.d.ts#L1-L22)

## 结论

MyTool项目的IPC通信API设计体现了现代Electron应用的最佳实践：

1. **安全性**：通过上下文隔离和受限制的API暴露，确保渲染进程只能访问必要的功能
2. **类型安全**：完整的TypeScript类型定义提供编译时类型检查
3. **异步设计**：基于Promise的异步架构确保UI响应性
4. **错误处理**：完善的错误处理机制提供可靠的用户体验

该架构为数据库操作和日志管理提供了清晰、安全且高效的IPC通信接口，为后续功能扩展奠定了良好的基础。

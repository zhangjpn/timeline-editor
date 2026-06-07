# timeline-editor

## 介绍

这是一个查看和编辑时间线的工具，可以方便地在图形界面创建时间线，添加时间和事件。

### 特性

- **React + Electron架构** - 支持桌面应用部署
- **时间线编辑器** - 添加、编辑、删除事件
- **可视化时间线** - 图形化展示时间事件
- **JSON持久化** - 文本化存储格式
- **无限时间长度** - 可伸展的时间轴
- **图形数据支持** - 事件可包含图片
- **Element UI集成** - 现代化UI组件库

## 技术栈

- **前端框架**: React 18 + TypeScript
- **桌面框架**: Electron
- **UI组件**: Element UI
- **数据存储**: JSON文件格式
- **构建工具**: Create React App

## 实现

### 领域对象
#### 时间和事件
时间线上的所有事件都锚定在一个时间点或时间段上。

#### 时间线
时间线用于容纳不同时间上的事件

#### 看板
看板用于容纳多条时间线

#### 项目
项目容纳多个看板。

#### 数据资产
数据资产是一系列时序数据，以时间为索引，比如经济数据，股票走势数据，数据资产可以通过可视化图表的形式嵌入到时间线中。


## 项目结构

```text
timeline-editor/
├── package.json              # 项目配置和依赖
├── tsconfig.json            # TypeScript配置
├── public/
│   ├── electron.js          # Electron主进程文件
│   └── index.html           # HTML模板
├── src/
│   ├── types/
│   │   └── timeline.ts      # 时间线数据类型定义
│   ├── utils/
│   │   └── timelineStorage.ts # JSON持久化工具
│   ├── components/
│   │   ├── TimelineEditor.tsx # 时间线编辑器组件
│   │   └── TimelineView.tsx   # 时间线视图组件
│   ├── App.tsx              # 主应用组件
│   ├── index.tsx            # 应用入口
│   └── index.css            # 全局样式
└── .gitignore               # Git忽略文件
```

## 开发

### 本地运行

本项目基于 React + Electron。下面说明在开发和调试时的本地运行步骤。

**先决条件**:
- Node.js (建议 16+)
- npm 或 yarn

1. 安装依赖

```bash
npm install
# 或者使用 yarn
# yarn
```

2. 在浏览器模式下本地开发（仅运行 React 开发服务器）

```bash
npm start
```

3. 在 Electron 开发模式（同时启动 React 开发服务器并打开 Electron）

```bash
npm run electron-dev
```

4. 生成生产包并在 Electron 中运行（用于测试构建产物）

```bash
npm run build
npm run electron
```

5. 打包应用（生成安装包）

```bash
npm run electron-pack
```

常见问题：
- 如果 `npm run electron-dev` 无法启动，请确认 `concurrently` 和 `wait-on` 已安装（已列在 devDependencies）。
- 如需在不同端口运行开发服务器，可设置环境变量 `PORT`，例如 `PORT=3001 npm start`。

更多细节和脚本定义请参见 `package.json` 中的 `scripts` 部分。

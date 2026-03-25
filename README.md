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


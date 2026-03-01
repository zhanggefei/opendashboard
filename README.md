# OpenDashboard 🎯

> OpenClaw 任务管理可视化面板 - 让任务追踪更简单

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![OpenClaw](https://img.shields.io/badge/Powered-OpenClaw-blue)](https://github.com/openclaw/openclaw)

## 📖 项目简介

OpenDashboard 是一个为 OpenClaw 设计的任务管理可视化面板，提供：

- ✅ **任务看板** - 待办/进行中/已完成 一目了然
- 🏷️ **优先级管理** - P0/P1/P2 标签分类
- 📊 **进度追踪** - 实时显示任务完成度
- 📱 **响应式设计** - 手机/电脑完美适配
- 🎨 **美观界面** - 现代化渐变设计

## 🚀 快速开始

### 在线预览

访问 [GitHub Pages](https://zhanggefei.github.io/opendashboard) (待部署)

### 本地运行

```bash
# 克隆项目
git clone https://github.com/zhanggefei/opendashboard.git

# 进入目录
cd opendashboard

# 直接用浏览器打开
open index.html
```

## 📁 项目结构

```
opendashboard/
├── index.html          # 主页面（任务面板）
├── css/
│   └── style.css       # 样式文件
├── js/
│   └── app.js          # 数据加载逻辑
├── tasks/
│   └── tasks.json      # 任务数据
├── docs/
│   └── API.md          # 集成文档
└── README.md           # 项目说明
```

## 🎯 使用场景

### 1. OpenClaw 任务追踪
与 OpenClaw 集成，自动同步任务状态。

### 2. 个人任务管理
作为个人待办事项管理器使用。

### 3. 团队看板
共享任务进度，团队协作。

## 🔧 配置说明

### 任务数据格式

```json
{
  "id": "T001",
  "title": "任务名称",
  "priority": "P0",
  "status": "progress",
  "progress": 50,
  "description": "任务描述",
  "startTime": "2026-03-01 08:03",
  "estimatedTime": "30 分钟"
}
```

### 状态说明

| 状态 | 说明 | 颜色 |
|------|------|------|
| todo | 待办 | 🟡 黄色 |
| progress | 进行中 | 🔵 蓝色 |
| blocked | 阻塞 | 🔴 红色 |
| done | 已完成 | 🟢 绿色 |

### 优先级说明

| 优先级 | 说明 | 颜色 |
|--------|------|------|
| P0 | 紧急重要 | 🔴 红色 |
| P1 | 重要 | 🟠 橙色 |
| P2 | 普通 | 🔵 蓝色 |

## 🤝 集成 OpenClaw

### 方式 1: 手动更新 tasks.json

将 OpenClaw 的 `TASKS.md` 转换为 `tasks.json` 格式。

### 方式 2: API 自动同步

```javascript
// 示例：从 OpenClaw 加载任务
fetch('http://localhost:18789/api/tasks')
  .then(res => res.json())
  .then(tasks => renderTasks(tasks));
```

### 方式 3: Webhook 实时更新

配置 OpenClaw webhook，任务变更时自动推送。

## 📸 截图预览

![任务面板预览](docs/screenshot.png)

## 🛠️ 开发指南

### 添加新任务

1. 编辑 `tasks/tasks.json`
2. 刷新页面即可看到更新

### 自定义样式

修改 `css/style.css` 中的颜色和布局。

### 扩展功能

在 `js/app.js` 中添加新功能。

## 📝 更新日志

### v0.1.0 (2026-03-01)
- ✅ 初始版本发布
- ✅ 基础任务看板功能
- ✅ 响应式设计

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 👤 作者

- GitHub: [@zhanggefei](https://github.com/zhanggefei)
- OpenClaw: [openclaw/openclaw](https://github.com/openclaw/openclaw)

---

<div align="center">

**Made with ❤️ for OpenClaw Community**

[🌟 Star this repo](https://github.com/zhanggefei/opendashboard) | [📖 Documentation](docs/API.md)

</div>

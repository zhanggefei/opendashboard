# OpenDashboard API 参考文档

## 📋 概述

本文档描述 OpenDashboard 的内部 JavaScript API，供开发者扩展功能使用。

---

## 🏗️ 核心类

### TaskManager

任务管理核心类，负责任务的 CRUD 操作。

```javascript
// 获取实例
const taskManager = window.taskManager;

// 方法
taskManager.getTasks()              // 获取所有任务
taskManager.getTaskById(id)         // 获取单个任务
taskManager.createTask(task)        // 创建任务
taskManager.updateTask(id, data)    // 更新任务
taskManager.deleteTask(id)          // 删除任务
taskManager.batchUpdate(ids, data)  // 批量更新
taskManager.batchDelete(ids)        // 批量删除
```

### IdentityManager

身份管理类，管理不同身份的任务视图。

```javascript
const identityManager = window.identityManager;

identityManager.getIdentities()     // 获取所有身份
identityManager.getCurrentId()      // 获取当前身份 ID
identityManager.switchTo(id)        // 切换身份
identityManager.addIdentity(data)   // 添加身份
identityManager.updateIdentity(id, data) // 更新身份
identityManager.deleteIdentity(id)  // 删除身份
```

### PerformanceMonitor

性能监控类（功能点 53）。

```javascript
const perfMonitor = window.perfMonitor;

perfMonitor.startRender()           // 开始渲染计时
perfMonitor.endRender(count)        // 结束渲染计时
perfMonitor.startAPICall()          // 开始 API 计时
perfMonitor.endAPICall()            // 结束 API 计时
perfMonitor.getReport()             // 获取性能报告
perfMonitor.exportPerformanceData() // 导出性能数据
```

---

## 📦 数据结构

### Task 对象

```javascript
{
    id: "string",           // 任务唯一 ID
    title: "string",        // 任务标题
    description: "string",  // 任务描述
    status: "string",       // 状态：todo|progress|blocked|done
    priority: "string",     // 优先级：P0|P1|P2
    assignee: "string",     // 负责人
    identityId: "string",   // 所属身份 ID
    tags: ["string"],       // 标签数组
    dueDate: "number",      // 截止日期（时间戳）
    createdAt: "number",    // 创建时间（时间戳）
    updatedAt: "number",    // 更新时间（时间戳）
    dependencies: ["string"], // 依赖的任务 ID 数组
    subtasks: [],           // 子任务数组
    comments: [],           // 评论数组
    timeTracking: {         // 时间追踪
        totalSeconds: 0,
        sessions: []
    },
    attachments: [],        // 附件数组
    activityLog: []         // 活动日志
}
```

### Identity 对象

```javascript
{
    id: "string",           // 身份唯一 ID
    name: "string",         // 身份名称
    color: "string",        // 身份颜色
    icon: "string",         // 身份图标 emoji
    createdAt: "number"     // 创建时间
}
```

---

## 🔔 事件系统

### 监听任务事件

```javascript
// 任务创建
document.addEventListener('task:created', (e) => {
    console.log('新任务:', e.detail.task);
});

// 任务更新
document.addEventListener('task:updated', (e) => {
    console.log('任务更新:', e.detail.task);
});

// 任务删除
document.addEventListener('task:deleted', (e) => {
    console.log('任务删除:', e.detail.taskId);
});

// 任务状态变更
document.addEventListener('task:statusChanged', (e) => {
    console.log('状态变更:', e.detail);
});
```

### 触发事件

```javascript
// 触发自定义事件
document.dispatchEvent(new CustomEvent('task:created', {
    detail: { task: newTask }
}));
```

---

## 🎨 工具函数

### 日期格式化

```javascript
// 格式化日期
function formatDate(timestamp, format = 'YYYY-MM-DD') {
    const date = new Date(timestamp);
    // 实现略...
    return formattedDate;
}
```

### 防抖函数

```javascript
// 防抖
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
```

### 本地存储封装

```javascript
// 存储
localStorage.setItem('key', JSON.stringify(data));

// 读取
const data = JSON.parse(localStorage.getItem('key'));

// 删除
localStorage.removeItem('key');
```

---

## 🔌 扩展开发

### 添加新功能模块

1. 在 `js/` 目录创建新文件
2. 定义功能类
3. 在 `index.html` 中引入脚本
4. 在 `app.js` 中初始化

```javascript
// js/my-feature.js
class MyFeature {
    constructor() {
        this.init();
    }

    init() {
        // 初始化逻辑
    }

    // 公开方法
    doSomething() {
        // 功能实现
    }
}

// 暴露全局实例
window.myFeature = new MyFeature();
```

### 添加新模态框

```html
<!-- 在 index.html 添加 -->
<div id="myModal" class="modal" style="display: none;">
    <div class="modal-content">
        <div class="modal-header">
            <h3>我的功能</h3>
            <button class="modal-close" onclick="closeMyModal()">✕</button>
        </div>
        <div class="modal-body">
            <!-- 内容 -->
        </div>
    </div>
</div>
```

---

## 📊 性能优化建议

1. **减少 DOM 操作**: 使用 DocumentFragment 批量更新
2. **事件委托**: 在父元素上监听事件
3. **防抖节流**: 搜索、滚动等高频事件
4. **懒加载**: 大量数据时分页或虚拟滚动
5. **缓存**: 频繁访问的数据使用缓存

---

## 🐛 调试技巧

### 查看本地存储

```javascript
// 查看所有任务
JSON.parse(localStorage.getItem('opendashboard_tasks'))

// 查看身份
JSON.parse(localStorage.getItem('opendashboard_identities'))

// 查看设置
JSON.parse(localStorage.getItem('opendashboard_settings'))
```

### 清空数据

```javascript
// 清空所有数据
localStorage.clear()

// 清空特定数据
localStorage.removeItem('opendashboard_tasks')
```

### 导入测试数据

```javascript
// 在控制台执行
fetch('tasks/sample-tasks.json')
    .then(r => r.json())
    .then(data => {
        localStorage.setItem('opendashboard_tasks', JSON.stringify(data));
        location.reload();
    });
```

---

## 📝 更新日志

### v1.0 (2026-03-03)
- ✅ 新增性能监控模块
- ✅ 完善用户文档和 API 文档
- ✅ 优化任务渲染性能

---

*最后更新：2026-03-03*  
*维护者：OpenDashboard Team*

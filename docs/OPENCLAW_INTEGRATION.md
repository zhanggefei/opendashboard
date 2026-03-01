# OpenClaw 快速集成指南

## 🚀 三种集成方式

### 方式 1：API 调用（最简单）⭐

**适用场景**: 从 OpenDashboard 触发 OpenClaw 执行任务

**步骤**:

1. **确认 OpenClaw Gateway 地址**
```bash
# 本地开发
http://localhost:18789

# 生产环境（如果有）
http://your-server:18789
```

2. **调用执行接口**
```javascript
// OpenDashboard 中调用
async function executeWithOpenClaw(taskId, taskData) {
    const response = await fetch('http://localhost:18789/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            taskId: taskId,
            taskTitle: taskData.title,
            taskDescription: taskData.description,
            action: 'auto'
        })
    });
    
    const result = await response.json();
    return result;
}
```

3. **在 OpenDashboard 中添加按钮**
```html
<button onclick="executeWithOpenClaw('${task.id}', ${JSON.stringify(task)})">
    🤖 用 OpenClaw 执行
</button>
```

---

### 方式 2：Webhook 自动触发（推荐）⭐⭐

**适用场景**: 任务状态变更时自动触发 OpenClaw

**步骤**:

1. **在 OpenClaw 中注册 Webhook**
```bash
# 编辑 OpenClaw 配置
~/.openclaw/config.json

# 添加 webhook 配置
{
    "webhooks": {
        "enabled": true,
        "url": "http://localhost:18789/webhook",
        "events": ["task.created", "task.updated"]
    }
}
```

2. **OpenDashboard 发送 Webhook**
```javascript
// 任务状态变更时触发
function onTaskStatusChange(taskId, newStatus) {
    fetch('http://localhost:18789/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            event: 'task.status_changed',
            taskId: taskId,
            status: newStatus,
            timestamp: new Date().toISOString()
        })
    });
}
```

---

### 方式 3：共享任务数据（最简单）⭐⭐⭐

**适用场景**: OpenDashboard 和 OpenClaw 共享同一份任务数据

**步骤**:

1. **使用共享 JSON 文件**
```javascript
// OpenDashboard 保存任务到共享文件
const sharedTasksPath = '/Users/zhang/.openclaw/workspace/shared-tasks.json';

function saveTasks() {
    const data = {
        tasks: tasks,
        lastUpdate: new Date().toISOString()
    };
    // 保存到共享文件
    // OpenClaw 会读取这个文件
}

// OpenClaw 执行后更新文件
function updateTaskFromOpenClaw(taskId, result) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.status = result.status;
        task.result = result.data;
        saveTasks();
    }
}
```

2. **OpenClaw 监听文件变化**
```bash
# OpenClaw 配置监听
{
    "watchFiles": [
        "/Users/zhang/.openclaw/workspace/shared-tasks.json"
    ]
}
```

---

## 🎯 推荐方案

**最快实现**: 方式 1（API 调用）
- ✅ 5 分钟内完成
- ✅ 代码量少
- ✅ 易于调试

**最佳体验**: 方式 2（Webhook）
- ✅ 自动化程度高
- ✅ 用户体验好
- ✅ 实时响应

**最稳定**: 方式 3（共享文件）
- ✅ 不依赖网络
- ✅ 简单可靠
- ✅ 易于维护

---

## 📝 实施步骤（选择方式 1）

### 第 1 步：测试 OpenClaw 连接

```bash
# 检查 OpenClaw Gateway 是否运行
curl http://localhost:18789/status

# 预期响应
{"status": "ok", "version": "2026.2.25"}
```

### 第 2 步：在 OpenDashboard 中添加集成

```javascript
// 在 app.js 中添加
class OpenClawIntegration {
    constructor() {
        this.apiEndpoint = 'http://localhost:18789';
    }
    
    async executeTask(task) {
        const response = await fetch(`${this.apiEndpoint}/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                taskId: task.id,
                taskTitle: task.title,
                taskDescription: task.description,
                action: 'auto'
            })
        });
        
        return await response.json();
    }
}

window.openclaw = new OpenClawIntegration();
```

### 第 3 步：添加 UI 按钮

```javascript
// 在任务卡片中添加按钮
const openclawButton = `
    <button class="action-btn" onclick="window.openclaw.executeTask(${JSON.stringify(task)})">
        🤖 OpenClaw 执行
    </button>
`;
```

### 第 4 步：处理执行结果

```javascript
// 监听执行结果
function onOpenClawResult(taskId, result) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.status = result.status;
        task.progress = 100;
        task.result = result.data;
        saveTasks();
        renderTasks();
    }
}
```

---

## 🔧 常见问题

### Q1: OpenClaw Gateway 未运行？
```bash
# 启动 Gateway
openclaw gateway start

# 检查状态
openclaw gateway status
```

### Q2: 跨域问题？
```javascript
// 在 OpenClaw 配置中允许 CORS
{
    "cors": {
        "enabled": true,
        "origins": ["*"]
    }
}
```

### Q3: 认证问题？
```javascript
// 如果需要认证，添加 token
headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
}
```

---

## 📞 需要帮助？

1. 检查 OpenClaw 文档：`~/.openclaw/workspace/docs/`
2. 查看 Gateway 日志：`openclaw gateway logs`
3. 测试 API：使用 Postman 或 curl

---

**推荐从方式 1 开始，5 分钟内即可完成集成！** 🚀

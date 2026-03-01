// OpenDashboard 应用逻辑 - 支持重试和排序

let tasks = [];
let taskOrder = [];

// 页面加载时获取任务
document.addEventListener('DOMContentLoaded', loadTasks);

// 加载任务数据
async function loadTasks() {
    try {
        showLoading();
        
        const response = await fetch('tasks/tasks.json');
        if (!response.ok) throw new Error('无法加载任务数据');
        
        const data = await response.json();
        tasks = data.tasks || [];
        taskOrder = data.taskOrder || [];
        
        // 应用自定义顺序
        if (taskOrder.length > 0) {
            applyCustomOrder();
        }
        
        renderTasks();
        updateLastUpdate();
        
    } catch (error) {
        console.error('加载任务失败:', error);
        loadSampleTasks();
    }
}

// 应用自定义顺序
function applyCustomOrder() {
    const orderMap = new Map();
    taskOrder.forEach((id, index) => {
        orderMap.set(id, index);
    });
    
    tasks.sort((a, b) => {
        const aOrder = orderMap.has(a.id) ? orderMap.get(a.id) : 999;
        const bOrder = orderMap.has(b.id) ? orderMap.get(b.id) : 999;
        return aOrder - bOrder;
    });
}

// 显示加载状态
function showLoading() {
    document.querySelectorAll('.task-list').forEach(list => {
        list.innerHTML = '<div class="loading">加载中...</div>';
    });
}

// 加载示例数据（备用）
function loadSampleTasks() {
    tasks = [
        {
            id: 'T001',
            title: '公海客户优先级分析',
            priority: 'P0',
            status: 'done',
            progress: 100,
            description: '完成 5,800 个公海客户的优先级分析。',
            startTime: '2026-03-01 08:03',
            completedTime: '2026-03-01 08:17',
            retryCount: 0
        },
        {
            id: 'T003',
            title: '定期汇报机制',
            priority: 'P1',
            status: 'blocked',
            progress: 50,
            description: '建立每 30 分钟定期汇报机制。',
            startTime: '2026-03-01 08:03',
            retryCount: 0,
            lastError: '错过 4 次汇报，需要重新建立机制'
        },
        {
            id: 'T004',
            title: 'B 级客户详细列表导出',
            priority: 'P1',
            status: 'todo',
            progress: 0,
            description: '导出 987 个 B 级客户的详细信息。',
            estimatedTime: '5 分钟',
            retryCount: 0,
            order: 1
        },
        {
            id: 'T007',
            title: 'GitHub opendashboard 项目创建',
            priority: 'P0',
            status: 'done',
            progress: 100,
            description: '创建 GitHub 项目并推送代码。',
            startTime: '2026-03-01 12:02',
            completedTime: '2026-03-01 12:19',
            retryCount: 2,
            lastError: 'Token 权限不足，已重新生成'
        }
    ];
    
    renderTasks();
    updateLastUpdate();
}

// 渲染所有任务
function renderTasks() {
    // 清空列表
    document.getElementById('progressTasks').innerHTML = '';
    document.getElementById('todoTasks').innerHTML = '';
    document.getElementById('doneTasks').innerHTML = '';
    document.getElementById('blockedTasks').innerHTML = '';
    
    // 统计
    let stats = { done: 0, progress: 0, todo: 0, blocked: 0 };
    
    // 按状态分组
    tasks.forEach(task => {
        stats[task.status]++;
        renderTaskCard(task);
    });
    
    // 更新统计
    document.getElementById('statDone').textContent = stats.done;
    document.getElementById('statProgress').textContent = stats.progress;
    document.getElementById('statTodo').textContent = stats.todo;
    document.getElementById('statBlocked').textContent = stats.blocked;
    
    // 处理空状态
    handleEmptyState('progressTasks', stats.progress);
    handleEmptyState('todoTasks', stats.todo);
    handleEmptyState('doneTasks', stats.done);
    handleEmptyState('blockedTasks', stats.blocked);
}

// 渲染单个任务卡片
function renderTaskCard(task) {
    const card = document.createElement('div');
    card.className = 'task-card';
    
    const statusLabels = {
        done: '已完成',
        progress: '进行中',
        todo: '待办',
        blocked: '阻塞'
    };
    
    // 重试信息
    const retryInfo = task.retryCount > 0 
        ? `<span class="retry-badge" title="重试 ${task.retryCount} 次">🔄 ${task.retryCount}次</span>` 
        : '';
    
    // 错误信息
    const errorInfo = task.lastError 
        ? `<div class="error-message">⚠️ ${task.lastError}</div>` 
        : '';
    
    // 重试按钮（仅阻塞和失败任务）
    const retryButton = (task.status === 'blocked' || task.status === 'failed')
        ? `<button class="action-btn retry-btn" onclick="retryTask('${task.id}')">🔄 重试</button>`
        : '';
    
    // 调整顺序按钮（仅待办任务）
    const orderButtons = task.status === 'todo'
        ? `
        <button class="action-btn order-btn" onclick="moveTaskUp('${task.id}')" title="上移">⬆️</button>
        <button class="action-btn order-btn" onclick="moveTaskDown('${task.id}')" title="下移">⬇️</button>
        `
        : '';
    
    card.innerHTML = `
        <div class="task-header">
            <span class="task-title">${task.id} - ${task.title}</span>
            <span class="status-badge status-${task.status}">${statusLabels[task.status]}</span>
        </div>
        <div class="task-meta">
            <span class="badge badge-${task.priority.toLowerCase()}">${task.priority} 优先级</span>
            ${task.progress !== undefined ? `<span>进度：${task.progress}%</span>` : ''}
            ${task.startTime ? `<span>开始：${task.startTime}</span>` : ''}
            ${task.estimatedTime ? `<span>预计：${task.estimatedTime}</span>` : ''}
            ${task.completedTime ? `<span>完成：${task.completedTime}</span>` : ''}
            ${retryInfo}
        </div>
        ${errorInfo}
        ${task.progress !== undefined ? `
        <div class="progress-bar">
            <div class="progress-fill" style="width: ${task.progress}%"></div>
        </div>
        ` : ''}
        <p class="task-desc">${task.description}</p>
        <div class="task-actions">
            ${orderButtons}
            ${retryButton}
        </div>
    `;
    
    // 添加到对应列表
    const container = document.getElementById(`${task.status}Tasks`);
    if (container) {
        container.appendChild(card);
    }
}

// 重试任务
function retryTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    if (confirm(`确定要重试任务 "${task.title}" 吗？`)) {
        task.status = 'todo';
        task.progress = 0;
        task.retryCount = (task.retryCount || 0) + 1;
        task.lastError = null;
        
        // 保存到文件（需要后端支持）
        saveTasks();
        
        // 重新渲染
        renderTasks();
        
        alert(`任务 ${taskId} 已重置为待办状态，可以重新开始！`);
    }
}

// 上移任务
function moveTaskUp(taskId) {
    const index = tasks.findIndex(t => t.id === taskId);
    if (index <= 0) return;
    
    // 交换顺序
    [tasks[index - 1], tasks[index]] = [tasks[index], tasks[index - 1]];
    
    // 更新 order 数组
    updateTaskOrder();
    
    // 保存并重新渲染
    saveTasks();
    renderTasks();
}

// 下移任务
function moveTaskDown(taskId) {
    const index = tasks.findIndex(t => t.id === taskId);
    if (index < 0 || index >= tasks.length - 1) return;
    
    // 交换顺序
    [tasks[index], tasks[index + 1]] = [tasks[index + 1], tasks[index]];
    
    // 更新 order 数组
    updateTaskOrder();
    
    // 保存并重新渲染
    saveTasks();
    renderTasks();
}

// 更新任务顺序
function updateTaskOrder() {
    taskOrder = tasks.map(t => t.id);
}

// 保存任务（模拟，实际需要后端）
function saveTasks() {
    console.log('保存任务数据:', {
        tasks: tasks,
        taskOrder: taskOrder
    });
    
    // 提示用户手动更新
    alert('任务顺序已更新！\n\n请推送更改到 GitHub：\n1. 提交 tasks/tasks.json\n2. git push\n\n或者我帮您自动推送？');
}

// 处理空状态
function handleEmptyState(containerId, count) {
    const container = document.getElementById(containerId);
    if (count === 0 && container.children.length === 0) {
        container.innerHTML = '<div class="empty-state">暂无任务</div>';
    }
}

// 更新时间
function updateLastUpdate() {
    const now = new Date();
    const timeStr = now.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
    document.getElementById('lastUpdate').textContent = `最后更新：${timeStr}`;
}

// 自动刷新（每 5 分钟）
setInterval(() => {
    loadTasks();
}, 5 * 60 * 1000);

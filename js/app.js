// OpenDashboard - 简化版核心逻辑

let tasks = [];

// 页面加载时获取任务
document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
});

// 加载任务
async function loadTasks() {
    try {
        showLoading();
        
        const response = await fetch('tasks/tasks.json');
        if (!response.ok) throw new Error('无法加载任务数据');
        
        const data = await response.json();
        tasks = data.tasks || [];
        
        renderTasks();
        updateStats();
        updateLastUpdate();
        
    } catch (error) {
        console.error('加载任务失败:', error);
        tasks = [];
        renderTasks();
    }
}

// 渲染任务列表
function renderTasks() {
    const taskList = document.getElementById('taskList');
    if (!taskList) return;
    
    taskList.innerHTML = '';
    
    if (tasks.length === 0) {
        taskList.innerHTML = '<div class="empty-state">暂无任务</div>';
        return;
    }
    
    tasks.forEach(task => {
        const card = createTaskCard(task);
        taskList.appendChild(card);
    });
}

// 创建任务卡片
function createTaskCard(task) {
    const card = document.createElement('div');
    card.className = `task-card task-${task.status}`;
    
    const statusLabels = {
        done: '✅ 已完成',
        progress: '🔄 执行中',
        todo: '🆕 待办',
        blocked: '⏸️ 阻塞'
    };
    
    const statusLabel = statusLabels[task.status] || task.status;
    const priorityLabel = task.priority || 'P2';
    
    card.innerHTML = `
        <div class="task-header">
            <span class="task-status">${statusLabel}</span>
            <span class="task-priority">${priorityLabel}</span>
        </div>
        <h3 class="task-title">${escapeHtml(task.title)}</h3>
        ${task.assignee ? `<div class="task-assignee">👤 ${escapeHtml(task.assignee)}</div>` : ''}
        <p class="task-desc">${escapeHtml(task.description || '')}</p>
        <div class="task-meta">
            ${task.startTime ? `<span>开始：${task.startTime}</span>` : ''}
            ${task.completedTime ? `<span>完成：${task.completedTime}</span>` : ''}
        </div>
    `;
    
    return card;
}

// 更新统计
function updateStats() {
    const stats = {
        done: tasks.filter(t => t.status === 'done').length,
        progress: tasks.filter(t => t.status === 'progress').length,
        todo: tasks.filter(t => t.status === 'todo').length
    };
    
    const statDone = document.getElementById('statDone');
    const statProgress = document.getElementById('statProgress');
    const statTodo = document.getElementById('statTodo');
    
    if (statDone) statDone.textContent = stats.done;
    if (statProgress) statProgress.textContent = stats.progress;
    if (statTodo) statTodo.textContent = stats.todo;
}

// 更新最后更新时间
function updateLastUpdate() {
    const lastUpdate = document.getElementById('lastUpdate');
    if (lastUpdate) {
        const now = new Date();
        lastUpdate.textContent = `最后更新：${now.toLocaleString('zh-CN')}`;
    }
}

// 显示加载中
function showLoading() {
    const taskList = document.getElementById('taskList');
    if (taskList) {
        taskList.innerHTML = '<div class="loading">加载中...</div>';
    }
}

// HTML 转义
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 身份管理面板切换
function showIdentityPanel() {
    const panel = document.getElementById('identityPanel');
    if (panel) {
        panel.style.display = 'block';
        if (window.identityManager) {
            window.identityManager.render();
        }
    }
}

function toggleIdentityPanel() {
    const panel = document.getElementById('identityPanel');
    if (panel) {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }
}

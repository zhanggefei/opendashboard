// OpenDashboard - 简化版核心逻辑

let tasks = [];

// 全局任务变量
window.tasks = [];

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
        window.tasks = tasks;
        
        renderIdentityTabs();
        renderTasks();
        updateStats();
        updateLastUpdate();
        
    } catch (error) {
        console.error('加载任务失败:', error);
        tasks = [];
        renderTasks();
    }
}

// 当前选中的身份
let currentIdentity = 'all';

// 渲染任务列表
function renderTasks() {
    const taskList = document.getElementById('taskList');
    if (!taskList) return;
    
    taskList.innerHTML = '';
    
    // 按身份筛选
    let filteredTasks = tasks;
    if (currentIdentity !== 'all') {
        const identity = window.identityManager.identities.find(i => i.id === currentIdentity);
        if (identity) {
            const namePrefix = identity.name.split(' ')[0];
            filteredTasks = tasks.filter(t => t.assignee && t.assignee.includes(namePrefix));
        }
    }
    
    if (filteredTasks.length === 0) {
        taskList.innerHTML = '<div class="empty-state">暂无任务</div>';
        return;
    }
    
    filteredTasks.forEach(task => {
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

// 渲染身份页签
function renderIdentityTabs() {
    const container = document.getElementById('identityTabs');
    if (!container || !window.identityManager) return;
    
    const identities = window.identityManager.identities;
    const tasks = window.tasks || [];
    
    let html = `<div class="identity-tab active" onclick="switchIdentityTab('all', this)">📊 全部 (${tasks.length})</div>`;
    
    identities.forEach(identity => {
        const taskCount = tasks.filter(t => t.assignee && t.assignee.includes(identity.name.split(' ')[0])).length;
        html += `<div class="identity-tab" onclick="switchIdentityTab('${identity.id}', this)">${identity.icon} ${identity.name.split(' - ')[0]} (${taskCount})</div>`;
    });
    
    container.innerHTML = html;
}

// 切换身份页签
function switchIdentityTab(identityId, tabElement) {
    currentIdentity = identityId;
    
    // 更新页签样式
    document.querySelectorAll('.identity-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    tabElement.classList.add('active');
    
    // 显示技能区域
    const skillsSection = document.getElementById('skillsSection');
    if (skillsSection && identityId !== 'all') {
        skillsSection.style.display = 'block';
        // 更新标题
        const h3 = skillsSection.querySelector('h3');
        if (h3) {
            const identity = window.identityManager.identities.find(i => i.id === identityId);
            if (identity) {
                h3.textContent = `🎯 ${identity.name} 的技能`;
            }
        }
        // 渲染技能
        if (window.renderSkills) {
            window.renderSkills(identityId);
        }
    } else if (skillsSection) {
        skillsSection.style.display = 'none';
    }
    
    // 重新渲染任务
    renderTasks();
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

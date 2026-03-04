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
        
        const response = await fetch('tasks/tasks.json?' + Date.now());
        if (!response.ok) throw new Error('无法加载任务数据');
        
        const data = await response.json();
        tasks = data.tasks || [];
        const completedTasks = data.completedTasks || [];
        
        window.tasks = tasks;
        window.completedTasks = completedTasks;
        
        renderIdentityTabs();
        renderTasks();
        renderCompletedTasks();
        updateStats();
        updateLastUpdate();
        
        console.log('✅ 数据已加载', new Date().toLocaleTimeString('zh-CN'));
        console.log(`   当前任务：${tasks.length} 个`);
        console.log(`   已完成：${completedTasks.length} 个`);
        
    } catch (error) {
        console.error('加载任务失败:', error);
        tasks = [];
        window.completedTasks = [];
        renderTasks();
        renderCompletedTasks();
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
        taskList.innerHTML = '<div class="empty-state">暂无当前任务</div>';
        return;
    }
    
    filteredTasks.forEach(task => {
        const card = createTaskCard(task);
        taskList.appendChild(card);
    });
}

// 渲染已完成任务
function renderCompletedTasks() {
    const completedList = document.getElementById('completedTaskList');
    if (!completedList) return;
    
    completedList.innerHTML = '';
    
    const completedTasks = window.completedTasks || [];
    
    if (completedTasks.length === 0) {
        completedList.innerHTML = '<div class="empty-state">暂无已完成任务</div>';
        return;
    }
    
    // 只显示最近 10 个
    completedTasks.slice(0, 10).forEach(task => {
        const card = createCompletedTaskCard(task);
        completedList.appendChild(card);
    });
}

// 创建已完成任务卡片
function createCompletedTaskCard(task) {
    const card = document.createElement('div');
    card.className = 'task-card task-done';
    card.style.background = 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)';
    card.style.border = '2px solid rgba(16, 185, 129, 0.3)';
    
    const tokens = task.tokenUsage || {};
    const executionTime = task.executionTime || '-';
    const completedTime = task.completedTime || '-';
    const model = task.metadata?.model || '-';
    
    card.innerHTML = `
        <div class="task-header">
            <span class="task-status">✅ 已完成</span>
            <span class="task-priority">${task.priority || 'P2'}</span>
        </div>
        <h3 class="task-title">${escapeHtml(task.title)}</h3>
        ${task.assignee ? `<div class="task-assignee">👤 ${escapeHtml(task.assignee)}</div>` : ''}
        <p class="task-desc">${escapeHtml(task.description || '')}</p>
        <div class="task-stats" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;padding-top:10px;border-top:2px solid rgba(16,185,129,0.15);">
            <div style="font-size:12px;">
                <div style="color:#95a5a6;font-size:10px;text-transform:uppercase;">📊 模型</div>
                <div style="color:#2c3e50;font-weight:600;">${model}</div>
            </div>
            <div style="font-size:12px;">
                <div style="color:#95a5a6;font-size:10px;text-transform:uppercase;">⏱️ 执行时间</div>
                <div style="color:#2c3e50;font-weight:600;">${executionTime}</div>
            </div>
            <div style="font-size:12px;">
                <div style="color:#95a5a6;font-size:10px;text-transform:uppercase;">💬 Token</div>
                <div style="color:#2c3e50;font-weight:600;">${(tokens.total || 0).toLocaleString()}</div>
            </div>
            <div style="font-size:12px;">
                <div style="color:#95a5a6;font-size:10px;text-transform:uppercase;">🕐 完成时间</div>
                <div style="color:#2c3e50;font-weight:600;">${completedTime}</div>
            </div>
        </div>
    `;
    
    return card;
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

// 更新时间显示
function updateLastUpdate() {
    const el = document.getElementById('lastUpdate');
    if (el) {
        const now = new Date();
        el.textContent = `最后更新：${now.toLocaleTimeString('zh-CN')}`;
    }
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

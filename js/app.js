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
        const todoTasks = data.todoTasks || [];
        const completedTasks = data.completedTasks || [];
        
        window.tasks = tasks;
        window.todoTasks = todoTasks;
        window.completedTasks = completedTasks;
        
        renderIdentityTabs();
        renderTasks();
        renderTodoTasks();
        renderCompletedTasks();
        updateStats();
        updateLastUpdate();
        
        console.log('✅ 数据已加载', new Date().toLocaleTimeString('zh-CN'));
        console.log(`   当前任务：${tasks.length} 个`);
        console.log(`   待办任务：${todoTasks.length} 个`);
        console.log(`   已完成：${completedTasks.length} 个`);
        
    } catch (error) {
        console.error('加载任务失败:', error);
        tasks = [];
        window.todoTasks = [];
        window.completedTasks = [];
        renderTasks();
        renderTodoTasks();
        renderCompletedTasks();
    }
}

// 当前选中的身份
let currentIdentity = 'all';

// 渲染任务列表
function renderTasks() {
    const taskList = document.getElementById('taskList');
    const progressCount = document.getElementById('progressCount');
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
    
    // 更新计数
    if (progressCount) {
        progressCount.textContent = `${filteredTasks.length}个`;
    }
    
    if (filteredTasks.length === 0) {
        taskList.innerHTML = '<div class="empty-state" style="text-align:center;padding:40px;color:#9ca3af;">暂无当前任务</div>';
        return;
    }
    
    filteredTasks.forEach(task => {
        const card = createTaskCard(task);
        taskList.appendChild(card);
    });
}

// 渲染待办任务
function renderTodoTasks() {
    const todoList = document.getElementById('todoTaskList');
    if (!todoList) return;
    
    todoList.innerHTML = '';
    
    const todoTasks = window.todoTasks || [];
    
    if (todoTasks.length === 0) {
        todoList.innerHTML = '<div class="empty-state">暂无待办任务</div>';
        return;
    }
    
    todoTasks.forEach(task => {
        const card = createTodoTaskCard(task);
        todoList.appendChild(card);
    });
}

// 创建待办任务卡片
function createTodoTaskCard(task) {
    const card = document.createElement('div');
    card.className = 'task-card task-todo';
    card.style.background = 'white';
    card.style.border = '2px solid #f59e0b';
    card.style.borderRadius = '12px';
    card.style.padding = '18px';
    card.style.boxShadow = '0 2px 8px rgba(245,158,11,0.15)';
    
    const tokens = task.tokenUsage || {};
    const executionTime = task.executionTime || '-';
    const startTime = task.startTime || '-';
    
    card.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <div style="display:flex;align-items:center;gap:10px;">
                <span style="background:linear-gradient(135deg,#f59e0b,#d97706);color:white;padding:5px 12px;border-radius:16px;font-size:11px;font-weight:700;">🆕 待办</span>
                <span style="background:#f3f4f6;color:#6b7280;padding:5px 12px;border-radius:16px;font-size:11px;font-weight:600;">${task.priority || 'P2'}</span>
            </div>
            <span style="font-size:11px;color:#9ca3af;">${startTime.split(' ')[0] || ''}</span>
        </div>
        
        <h3 style="margin:0 0 6px 0;font-size:15px;font-weight:700;color:#1f2937;line-height:1.4;">${escapeHtml(task.title)}</h3>
        
        <p style="margin:0 0 12px 0;color:#6b7280;font-size:12px;line-height:1.5;">${escapeHtml(task.description || '')}</p>
        
        <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;">
            <span style="background:#f3f4f6;color:#6b7280;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:600;">⏰ ${executionTime}</span>
            <span style="background:#f3f4f6;color:#6b7280;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:600;">💬 ${(tokens.total || 0).toLocaleString()}</span>
            <span style="background:#f3f4f6;color:#6b7280;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:600;">🕐 ${startTime.split(' ')[1] || startTime}</span>
        </div>
    `;
    
    return card;
}

// 渲染已完成任务
function renderCompletedTasks() {
    const completedList = document.getElementById('completedTaskList');
    const completedCount = document.getElementById('completedCount');
    if (!completedList) return;
    
    completedList.innerHTML = '';
    
    const completedTasks = window.completedTasks || [];
    
    // 更新计数
    if (completedCount) {
        completedCount.textContent = `${completedTasks.length}个`;
    }
    
    if (completedTasks.length === 0) {
        completedList.innerHTML = '<div class="empty-state" style="grid-column:1/-1;text-align:center;padding:40px;color:#9ca3af;">暂无已完成任务</div>';
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
    card.style.background = 'white';
    card.style.border = '2px solid #10b981';
    card.style.borderRadius = '12px';
    card.style.padding = '18px';
    card.style.boxShadow = '0 2px 8px rgba(16,185,129,0.15)';
    
    const tokens = task.tokenUsage || {};
    const executionTime = task.executionTime || '-';
    const completedTime = task.completedTime || '-';
    const model = task.metadata?.model || '-';
    
    card.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <div style="display:flex;align-items:center;gap:10px;">
                <span style="background:linear-gradient(135deg,#10b981,#059669);color:white;padding:5px 12px;border-radius:16px;font-size:11px;font-weight:700;">✅ 已完成</span>
                <span style="background:#f3f4f6;color:#6b7280;padding:5px 12px;border-radius:16px;font-size:11px;font-weight:600;">${task.priority || 'P2'}</span>
            </div>
            <span style="font-size:11px;color:#9ca3af;">${completedTime.split(' ')[0] || ''}</span>
        </div>
        
        <h3 style="margin:0 0 6px 0;font-size:15px;font-weight:700;color:#1f2937;line-height:1.4;">${escapeHtml(task.title)}</h3>
        
        <p style="margin:0 0 12px 0;color:#6b7280;font-size:12px;line-height:1.5;">${escapeHtml(task.description || '')}</p>
        
        <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;">
            <span style="background:#f3f4f6;color:#6b7280;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:600;">📊 ${model}</span>
            <span style="background:#f3f4f6;color:#6b7280;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:600;">⏱️ ${executionTime}</span>
            <span style="background:#f3f4f6;color:#6b7280;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:600;">💬 ${(tokens.total || 0).toLocaleString()}</span>
            <span style="background:#f3f4f6;color:#6b7280;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:600;">🕐 ${completedTime.split(' ')[1] || completedTime}</span>
        </div>
    `;
    
    return card;
}

// 创建任务卡片
function createTaskCard(task) {
    const card = document.createElement('div');
    card.className = `task-card task-${task.status}`;
    card.style.background = 'white';
    card.style.border = '2px solid #3b82f6';
    card.style.borderRadius = '12px';
    card.style.padding = '18px';
    card.style.boxShadow = '0 2px 8px rgba(59,130,246,0.15)';
    
    const statusLabels = {
        done: '✅ 已完成',
        progress: '🔄 执行中',
        todo: '🆕 待办',
        blocked: '⏸️ 阻塞'
    };
    
    const statusLabel = statusLabels[task.status] || task.status;
    const priorityLabel = task.priority || 'P2';
    const tokens = task.tokenUsage || {};
    const executionTime = task.executionTime || '-';
    
    card.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <div style="display:flex;align-items:center;gap:10px;">
                <span style="background:linear-gradient(135deg,#3b82f6,#2563eb);color:white;padding:5px 12px;border-radius:16px;font-size:11px;font-weight:700;">${statusLabel}</span>
                <span style="background:#f3f4f6;color:#6b7280;padding:5px 12px;border-radius:16px;font-size:11px;font-weight:600;">${priorityLabel}</span>
            </div>
            <span style="font-size:11px;color:#9ca3af;">${task.startTime ? task.startTime.split(' ')[0] : ''}</span>
        </div>
        
        <h3 style="margin:0 0 6px 0;font-size:15px;font-weight:700;color:#1f2937;line-height:1.4;">${escapeHtml(task.title)}</h3>
        
        ${task.assignee ? `<p style="margin:0 0 8px 0;color:#6b7280;font-size:12px;">👤 ${escapeHtml(task.assignee)}</p>` : ''}
        <p style="margin:0 0 12px 0;color:#6b7280;font-size:12px;line-height:1.5;">${escapeHtml(task.description || '')}</p>
        
        ${task.status === 'progress' ? `
        <div style="display:flex;gap:8px;margin-top:12px;padding-top:12px;border-top:2px solid #e5e7eb;">
            <span style="background:#eff6ff;color:#3b82f6;padding:6px 12px;border-radius:8px;font-size:12px;font-weight:600;">⏱️ ${executionTime}</span>
            <span style="background:#eff6ff;color:#3b82f6;padding:6px 12px;border-radius:8px;font-size:12px;font-weight:600;">💬 ${(tokens.total || 0).toLocaleString()}</span>
            <span style="background:#eff6ff;color:#3b82f6;padding:6px 12px;border-radius:8px;font-size:12px;font-weight:600;">🕐 ${task.startTime ? task.startTime.split(' ')[1] : '-'}</span>
        </div>
        ` : ''}
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

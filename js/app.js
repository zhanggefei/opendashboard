// OpenDashboard - 统一卡片布局

let tasks = [];
window.tasks = [];
window.todoTasks = [];
window.completedTasks = [];

// 页面加载时获取任务
document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
});

// 加载任务
async function loadTasks() {
    try {
        const response = await fetch('tasks/tasks.json?' + Date.now());
        if (!response.ok) throw new Error('无法加载任务数据');
        
        const data = await response.json();
        tasks = data.tasks || [];
        window.todoTasks = data.todoTasks || [];
        window.completedTasks = data.completedTasks || [];
        
        window.tasks = tasks;
        
        renderIdentityTabs();
        renderTasks();
        renderTodoTasks();
        renderCompletedTasks();
        updateStats();
        updateLastUpdate();
        
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

let currentIdentity = 'all';

// 渲染任务列表
function renderTasks() {
    const taskList = document.getElementById('taskList');
    const progressCount = document.getElementById('progressCount');
    if (!taskList) return;
    
    taskList.innerHTML = '';
    
    let filteredTasks = tasks;
    if (currentIdentity !== 'all') {
        const identity = window.identityManager.identities.find(i => i.id === currentIdentity);
        if (identity) {
            const namePrefix = identity.name.split(' ')[0];
            filteredTasks = tasks.filter(t => t.assignee && t.assignee.includes(namePrefix));
        }
    }
    
    if (progressCount) {
        progressCount.textContent = `${filteredTasks.length}个`;
    }
    
    if (filteredTasks.length === 0) {
        taskList.innerHTML = '<div style="text-align:center;padding:40px;color:#9ca3af;">暂无当前任务</div>';
        return;
    }
    
    filteredTasks.forEach(task => {
        const card = createTaskCard(task, 'progress');
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
        todoList.innerHTML = '<div style="text-align:center;padding:40px;color:#9ca3af;">暂无待办任务</div>';
        return;
    }
    
    todoTasks.forEach(task => {
        const card = createTaskCard(task, 'todo');
        todoList.appendChild(card);
    });
}

// 渲染已完成任务
function renderCompletedTasks() {
    const completedList = document.getElementById('completedTaskList');
    const completedCount = document.getElementById('completedCount');
    if (!completedList) return;
    
    completedList.innerHTML = '';
    
    const completedTasks = window.completedTasks || [];
    
    if (completedCount) {
        completedCount.textContent = `${completedTasks.length}个`;
    }
    
    if (completedTasks.length === 0) {
        completedList.innerHTML = '<div style="text-align:center;padding:40px;color:#9ca3af;">暂无已完成任务</div>';
        return;
    }
    
    completedTasks.slice(0, 10).forEach(task => {
        const card = createTaskCard(task, 'done');
        completedList.appendChild(card);
    });
}

// 统一创建任务卡片
function createTaskCard(task, type) {
    const card = document.createElement('div');
    card.style.background = 'white';
    card.style.borderRadius = '10px';
    card.style.padding = '16px';
    card.style.boxShadow = '0 2px 6px rgba(0,0,0,0.1)';
    card.style.marginBottom = '12px';
    
    // 根据类型设置边框颜色
    const borderColors = {
        progress: '#3b82f6',
        todo: '#f59e0b',
        done: '#10b981',
        blocked: '#ef4444'
    };
    card.style.borderLeft = `4px solid ${borderColors[type] || '#6b7280'}`;
    
    const statusLabels = {
        done: '✅ 已完成',
        progress: '🔄 执行中',
        todo: '🆕 待办',
        blocked: '⏸️ 阻塞'
    };
    
    const statusLabel = statusLabels[task.status] || statusLabels[type] || type;
    const priorityLabel = task.priority || 'P2';
    const tokens = task.tokenUsage || {};
    const executionTime = task.executionTime || '-';
    const startTime = task.startTime || '-';
    const completedTime = task.completedTime || '-';
    
    // 第一行：标题 + 优先级 + 状态
    // 第二行：负责人 + 描述
    // 第三行：统计信息（执行时长、Token、时间）
    card.innerHTML = `
        <div style="margin-bottom:12px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <h3 style="margin:0;font-size:15px;font-weight:700;color:#1f2937;">${escapeHtml(task.title)}</h3>
                <div style="display:flex;gap:6px;flex-shrink:0;">
                    <span style="background:#f3f4f6;color:#6b7280;padding:4px 10px;border-radius:12px;font-size:11px;font-weight:600;">${priorityLabel}</span>
                    <span style="background:linear-gradient(135deg,${getGradientColor(type)});color:white;padding:4px 10px;border-radius:12px;font-size:11px;font-weight:600;">${statusLabel}</span>
                </div>
            </div>
            
            ${task.assignee ? `<p style="margin:0 0 6px 0;color:#6b7280;font-size:12px;">👤 ${escapeHtml(task.assignee)}</p>` : ''}
            <p style="margin:0;color:#6b7280;font-size:12px;line-height:1.5;">${escapeHtml(task.description || '')}</p>
        </div>
        
        <div style="display:flex;gap:20px;align-items:center;padding-top:12px;border-top:2px solid #f3f4f6;">
            <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:18px;">⏱️</span>
                <div>
                    <div style="font-size:10px;color:#9ca3af;text-transform:uppercase;">${type === 'todo' ? '等待时长' : '执行时长'}</div>
                    <div style="font-size:15px;font-weight:700;color:#3b82f6;">${executionTime}</div>
                </div>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:18px;">💬</span>
                <div>
                    <div style="font-size:10px;color:#9ca3af;text-transform:uppercase;">Token</div>
                    <div style="font-size:15px;font-weight:700;color:#10b981;">${(tokens.total || 0).toLocaleString()}</div>
                </div>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:18px;">🕐</span>
                <div>
                    <div style="font-size:10px;color:#9ca3af;text-transform:uppercase;">${type === 'done' ? '完成时间' : '开始时间'}</div>
                    <div style="font-size:15px;font-weight:700;color:#f59e0b;">${type === 'done' ? (completedTime.split(' ')[1] || completedTime) : startTime}</div>
                </div>
            </div>
        </div>
    `;
    
    return card;
}

// 获取渐变颜色
function getGradientColor(type) {
    const colors = {
        progress: '#3b82f6,#2563eb',
        todo: '#f59e0b,#d97706',
        done: '#10b981,#059669',
        blocked: '#ef4444,#dc2626'
    };
    return colors[type] || '#6b7280,#4b5563';
}

// 更新统计
function updateStats() {
    // 已在 render 函数中更新
}

// 更新时间
function updateLastUpdate() {
    const lastUpdate = document.getElementById('lastUpdate');
    if (lastUpdate) {
        lastUpdate.textContent = `最后更新：${new Date().toLocaleTimeString('zh-CN')}`;
    }
}

// 转义 HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// OpenDashboard - 统一卡片布局

let tasks = [];
window.tasks = [];
window.todoTasks = [];
window.completedTasks = [];

// 同步按钮功能
async function syncFromOpenClaw() {
    const syncBtn = document.getElementById('syncBtn');
    const syncStatus = document.getElementById('syncStatus');
    
    if (!syncBtn || syncBtn.disabled) return;
    
    // 禁用按钮
    syncBtn.disabled = true;
    syncBtn.innerHTML = '⏳ 同步中...';
    syncBtn.style.opacity = '0.6';
    
    // 显示状态
    if (syncStatus) {
        syncStatus.style.display = 'inline';
        syncStatus.textContent = '🔄 正在同步...';
        syncStatus.style.color = '#f59e0b';
    }
    
    try {
        // 添加时间戳强制刷新
        const timestamp = Date.now();
        const response = await fetch('tasks/tasks.json?t=' + timestamp);
        
        if (!response.ok) throw new Error('无法获取任务数据');
        
        const data = await response.json();
        const stats = data.statistics || {};
        
        // 显示成功状态
        if (syncStatus) {
            syncStatus.textContent = '✅ 同步成功！';
            syncStatus.style.color = '#10b981';
        }
        
        // 重新加载任务
        await loadTasks();
        
        // 3 秒后隐藏状态
        setTimeout(() => {
            if (syncStatus) syncStatus.style.display = 'none';
        }, 3000);
        
        alert('✅ 同步成功！\n\n已从 OpenClaw 同步任务数据。\n\n执行中：' + (stats.progress || 0) + ' 个\n待办：' + (stats.todo || 0) + ' 个\n已完成：' + (stats.done || 0) + ' 个');
    } catch (error) {
        console.error('同步失败:', error);
        
        // 显示错误状态
        if (syncStatus) {
            syncStatus.textContent = '❌ 同步失败';
            syncStatus.style.color = '#ef4444';
        }
        
        alert('❌ 同步失败：' + error.message + '\n\n请确保任务文件存在且可访问。');
    } finally {
        // 恢复按钮
        syncBtn.disabled = false;
        syncBtn.innerHTML = '🔄 同步';
        syncBtn.style.opacity = '1';
    }
}

// 自动刷新配置
const AUTO_REFRESH_INTERVAL = 30000; // 30 秒自动刷新一次
let lastSyncTime = null;

// 页面加载时获取任务
document.addEventListener('DOMContentLoaded', () => {
    // 立即显示内联统计数据（如果有）
    if (window.INLINE_STATS) {
        const progressEl = document.getElementById('progressCount');
        const todoEl = document.getElementById('todoCount');
        const completedEl = document.getElementById('completedCount');
        
        console.log('⚡ 使用内联统计数据:', window.INLINE_STATS);
        
        if (progressEl) progressEl.textContent = `${window.INLINE_STATS.progress}个`;
        if (todoEl) todoEl.textContent = `${window.INLINE_STATS.todo}个`;
        if (completedEl) completedEl.textContent = `${window.INLINE_STATS.done}个`;
    }
    
    // 加载任务
    loadTasks();
    
    // 启动自动刷新
    setInterval(() => {
        console.log('🔄 自动刷新任务数据...');
        loadTasks();
    }, AUTO_REFRESH_INTERVAL);
    
    console.log('✅ 页面已加载，自动刷新已启动（30 秒间隔）');
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
        
        // 保存统计数据（优先使用后端计算的准确数据）
        window.dashboardStatistics = data.statistics || null;
        
        window.tasks = tasks;
        
        renderIdentityTabs();
        renderTasks();
        renderTodoTasks();
        renderCompletedTasks();
        updateStats();
        updateLastUpdate();
        
        console.log('✅ 任务加载成功，统计数据:', window.dashboardStatistics);
        
    } catch (error) {
        console.error('加载任务失败:', error);
        tasks = [];
        window.todoTasks = [];
        window.completedTasks = [];
        window.dashboardStatistics = null;
        renderTasks();
        renderTodoTasks();
        renderCompletedTasks();
        updateStats();
    }
}

let currentIdentity = 'all';

// 渲染任务列表（只显示执行中的任务）
function renderTasks() {
    const taskList = document.getElementById('taskList');
    if (!taskList) return;
    
    taskList.innerHTML = '';
    
    // 过滤：只显示执行中的任务（status === 'progress'）
    let filteredTasks = tasks.filter(t => t.status === 'progress');
    
    if (currentIdentity !== 'all') {
        const identity = window.identityManager.identities.find(i => i.id === currentIdentity);
        if (identity) {
            const namePrefix = identity.name.split(' ')[0];
            filteredTasks = filteredTasks.filter(t => t.assignee && t.assignee.includes(namePrefix));
        }
    }
    
    // 更新执行中任务卡片数量徽章（不是顶部统计）
    const progressBadge = document.querySelector('#taskList .section-header .badge');
    if (progressBadge) {
        progressBadge.textContent = `${filteredTasks.length}个`;
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
    
    // 第一行：标题 + 负责人 + 优先级 + 状态
    // 第二行：描述
    // 第三行：统计信息（执行时长、Token、时间）
    card.innerHTML = `
        <div style="margin-bottom:12px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <div style="display:flex;align-items:center;gap:8px;flex:1;overflow:hidden;">
                    <h3 style="margin:0;font-size:15px;font-weight:700;color:#1f2937;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${escapeHtml(task.title)}">${escapeHtml(task.title)}</h3>
                    ${task.assignee ? `<span style="color:#6b7280;font-size:12px;white-space:nowrap;" title="负责人：${escapeHtml(task.assignee)}">👤 ${escapeHtml(task.assignee)}</span>` : ''}
                    ${task.metadata?.source === 'feishu' ? `<span style="color:#3b82f6;font-size:12px;white-space:nowrap;" title="来源：飞书">📧</span>` : ''}
                </div>
                <div style="display:flex;gap:6px;flex-shrink:0;">
                    <span style="background:#f3f4f6;color:#6b7280;padding:4px 10px;border-radius:12px;font-size:11px;font-weight:600;">${priorityLabel}</span>
                    <span style="background:linear-gradient(135deg,${getGradientColor(type)});color:white;padding:4px 10px;border-radius:12px;font-size:11px;font-weight:600;">${statusLabel}</span>
                </div>
            </div>
            
            <p style="margin:0;color:#6b7280;font-size:12px;line-height:1.5;">${escapeHtml(task.description || '')}</p>
        </div>
        
        <div style="display:flex;gap:32px;align-items:center;padding-top:12px;border-top:2px solid #f3f4f6;">
            <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:18px;">⏱️</span>
                <div>
                    <div style="font-size:15px;font-weight:700;color:#3b82f6;">${executionTime}</div>
                    <div style="font-size:10px;color:#9ca3af;text-transform:uppercase;">${type === 'todo' ? '等待时长' : '执行时长'}</div>
                </div>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:18px;">💬</span>
                <div>
                    <div style="font-size:15px;font-weight:700;color:#10b981;">${(tokens.total || 0).toLocaleString()}</div>
                    <div style="font-size:10px;color:#9ca3af;text-transform:uppercase;">Token</div>
                </div>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:18px;">🕐</span>
                <div>
                    <div style="font-size:15px;font-weight:700;color:#f59e0b;">${type === 'done' ? (completedTime.split(' ')[1] || completedTime) : startTime}</div>
                    <div style="font-size:10px;color:#9ca3af;text-transform:uppercase;">${type === 'done' ? '完成时间' : '开始时间'}</div>
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

// 更新统计（顶部卡片数字）
function updateStats() {
    const progressEl = document.getElementById('progressCount');
    const todoEl = document.getElementById('todoCount');
    const completedEl = document.getElementById('completedCount');
    
    // 优先使用 statistics 字段（后端已计算好的准确数据）
    if (window.dashboardStatistics && window.dashboardStatistics.verified) {
        console.log('📊 使用后端统计数据:', window.dashboardStatistics);
        
        if (progressEl) progressEl.textContent = `${window.dashboardStatistics.progress}个`;
        if (todoEl) todoEl.textContent = `${window.dashboardStatistics.todo}个`;
        if (completedEl) completedEl.textContent = `${window.dashboardStatistics.done}个`;
        return;
    }
    
    // 降级方案：自己计算
    const progressCount = tasks.filter(t => t.status === 'progress').length;
    const todoCount = (tasks.filter(t => t.status === 'todo').length) + (window.todoTasks?.length || 0);
    const completedCount = window.completedTasks?.length || 0;
    
    console.log('📊 使用前端计算统计:', { progress: progressCount, todo: todoCount, done: completedCount });
    
    if (progressEl) progressEl.textContent = `${progressCount}个`;
    if (todoEl) todoEl.textContent = `${todoCount}个`;
    if (completedEl) completedEl.textContent = `${completedCount}个`;
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

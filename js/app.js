// OpenDashboard 应用逻辑 v1.2 - OpenClaw API 集成

let tasks = [];
let taskOrder = [];
let selectedTasks = new Set();
let filters = {
    search: '',
    status: 'all',
    priority: 'all',
    assignee: 'all'
};

// 初始化全局管理器
window.dependencyManager = new TaskDependencyManager();
window.commentManager = new TaskCommentManager();
window.subtaskManager = new SubtaskManager();
window.analyticsManager = new DashboardAnalytics();
window.templateManager = new TaskTemplateManager();
window.timeTracker = new TimeTracker();
window.openclawIntegration = new OpenClawIntegration();

// ============== OpenClaw API 集成 ==============

class OpenClawIntegration {
    constructor() {
        this.apiEndpoint = 'http://localhost:18789';
        this.gatewayStatus = null;
    }
    
    // 检查 OpenClaw Gateway 状态
    async checkGatewayStatus() {
        try {
            const response = await fetch(`${this.apiEndpoint}/status`);
            if (response.ok) {
                const data = await response.json();
                this.gatewayStatus = { online: true, ...data };
                return this.gatewayStatus;
            }
        } catch (error) {
            this.gatewayStatus = { online: false, error: error.message };
        }
        return this.gatewayStatus;
    }
    
    // 执行任务
    async executeTask(task) {
        const status = await this.checkGatewayStatus();
        if (!status.online) {
            throw new Error('OpenClaw Gateway 未运行，请先启动服务');
        }
        
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
        
        if (!response.ok) {
            throw new Error(`API 请求失败：${response.status}`);
        }
        
        return await response.json();
    }
    
    // 发送消息到飞书
    async sendFeishuMessage(message) {
        const response = await fetch(`${this.apiEndpoint}/message/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                channel: 'feishu',
                message: message
            })
        });
        
        return await response.json();
    }
}

// 页面加载时获取任务
document.addEventListener('DOMContentLoaded', () => {
    initDarkMode(); // 初始化深色模式
    loadTasks();
    window.commentManager.load(); // 加载评论和日志
    window.subtaskManager.load(); // 加载子任务
    window.timeTracker.load(); // 加载时间追踪
    window.notificationManager = new NotificationManager(); // 启动通知服务
});

// 身份管理面板切换
function showIdentityPanel() {
    document.getElementById('identityPanel').style.display = 'block';
    if (window.identityManager) {
        renderIdentities();
        renderTasks();
    }
}

function toggleIdentityPanel() {
    const panel = document.getElementById('identityPanel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

function showIdentityPanel() {
    document.getElementById('identityPanel').style.display = 'block';
    if (window.identityManager) {
        renderIdentities();
        renderTasks();
    }
}

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
        
        // 初始化负责人筛选
        initAssigneeFilter();
        
        // 应用筛选
        applyFilters();
        
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

// 初始化负责人筛选
function initAssigneeFilter() {
    const assignees = new Set();
    tasks.forEach(task => {
        if (task.assignee) {
            assignees.add(task.assignee);
        }
    });
    
    const select = document.getElementById('assigneeFilter');
    select.innerHTML = '<option value="all">全部</option>';
    
    assignees.forEach(assignee => {
        const option = document.createElement('option');
        option.value = assignee;
        option.textContent = assignee;
        select.appendChild(option);
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
            assignee: '狗蛋',
            retryCount: 0
        },
        {
            id: 'T002',
            title: '客户跟进情况评估',
            priority: 'P0',
            status: 'done',
            progress: 100,
            description: '分析 5,565 个客户的跟进记录。',
            startTime: '2026-03-01 10:14',
            completedTime: '2026-03-01 10:17',
            assignee: '狗蛋',
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
            assignee: '狗蛋',
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
            assignee: '狗蛋',
            retryCount: 0,
            order: 1
        },
        {
            id: 'T005',
            title: 'KA 区域激活方案',
            priority: 'P1',
            status: 'todo',
            progress: 0,
            description: '针对 KA 区域跟进率仅 10.9% 的问题。',
            estimatedTime: '15 分钟',
            assignee: '狗蛋',
            retryCount: 0,
            order: 2
        },
        {
            id: 'T006',
            title: '销售跟进效率分析',
            priority: 'P2',
            status: 'todo',
            progress: 0,
            description: '分析每个销售的跟进效率。',
            estimatedTime: '10 分钟',
            assignee: '狗蛋',
            retryCount: 0,
            order: 3
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
            assignee: '狗蛋',
            retryCount: 2,
            lastError: 'Token 权限不足，已重新生成'
        },
        {
            id: 'T008',
            title: 'GitHub Pages 在线环境部署',
            priority: 'P0',
            status: 'progress',
            progress: 90,
            description: '部署 GitHub Pages 在线测试环境。',
            startTime: '2026-03-01 12:22',
            assignee: '狗蛋',
            retryCount: 0
        }
    ];
    
    initAssigneeFilter();
    applyFilters();
    updateLastUpdate();
}

// 应用筛选
function applyFilters() {
    // 获取筛选条件
    filters.search = document.getElementById('searchInput').value.toLowerCase();
    filters.status = document.getElementById('statusFilter').value;
    filters.priority = document.getElementById('priorityFilter').value;
    filters.assignee = document.getElementById('assigneeFilter').value;
    
    // 筛选任务
    const filteredTasks = tasks.filter(task => {
        // 搜索筛选
        if (filters.search && !task.title.toLowerCase().includes(filters.search) && 
            !task.description.toLowerCase().includes(filters.search)) {
            return false;
        }
        
        // 状态筛选
        if (filters.status !== 'all' && task.status !== filters.status) {
            return false;
        }
        
        // 优先级筛选
        if (filters.priority !== 'all' && task.priority !== filters.priority) {
            return false;
        }
        
        // 负责人筛选
        if (filters.assignee !== 'all' && task.assignee !== filters.assignee) {
            return false;
        }
        
        return true;
    });
    
    // 更新统计（使用筛选后的数据）
    updateStats(filteredTasks);
    
    // 渲染任务
    renderTasks(filteredTasks);
    
    // 更新结果计数
    document.getElementById('resultCount').textContent = `显示 ${filteredTasks.length}/${tasks.length} 任务`;
    
    // 更新顶部统计卡片显示（筛选后的数量）
    updateStatDisplay('statDone', filteredTasks.filter(t => t.status === 'done').length);
    updateStatDisplay('statProgress', filteredTasks.filter(t => t.status === 'progress').length);
    updateStatDisplay('statTodo', filteredTasks.filter(t => t.status === 'todo').length);
    updateStatDisplay('statBlocked', filteredTasks.filter(t => t.status === 'blocked').length);
}

// 更新统计卡片显示
function updateStatDisplay(elementId, count) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = count;
    }
}

// 更新统计
function updateStats(filteredTasks) {
    let stats = { done: 0, progress: 0, todo: 0, blocked: 0 };
    
    filteredTasks.forEach(task => {
        stats[task.status]++;
    });
    
    document.getElementById('statDone').textContent = stats.done;
    document.getElementById('statProgress').textContent = stats.progress;
    document.getElementById('statTodo').textContent = stats.todo;
    document.getElementById('statBlocked').textContent = stats.blocked;
}

// 渲染任务
function renderTasks(filteredTasks) {
    // 清空列表
    document.getElementById('progressTasks').innerHTML = '';
    document.getElementById('todoTasks').innerHTML = '';
    document.getElementById('blockedTasks').innerHTML = '';
    document.getElementById('doneTasks').innerHTML = '';
    
    // 按状态分组渲染
    filteredTasks.forEach(task => {
        renderTaskCard(task);
    });
    
    // 处理空状态
    handleEmptyState('progressTasks', filteredTasks.filter(t => t.status === 'progress').length);
    handleEmptyState('todoTasks', filteredTasks.filter(t => t.status === 'todo').length);
    handleEmptyState('blockedTasks', filteredTasks.filter(t => t.status === 'blocked').length);
    handleEmptyState('doneTasks', filteredTasks.filter(t => t.status === 'done').length);
}

// 渲染单个任务卡片
function renderTaskCard(task) {
    const card = document.createElement('div');
    card.className = 'task-card';
    card.draggable = true;
    card.dataset.taskId = task.id;
    card.title = '🖱️ 拖动整个卡片调整顺序';
    
    // 添加拖拽事件（整个卡片可拖动）
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragover', handleDragOver);
    card.addEventListener('dragleave', handleDragLeave);
    card.addEventListener('drop', handleDrop);
    card.addEventListener('dragend', handleDragEnd);
    
    if (selectedTasks.has(task.id)) {
        card.classList.add('selected');
    }
    
    const statusLabels = {
        done: '已完成',
        progress: '进行中',
        todo: '待办',
        blocked: '阻塞'
    };
    
    const retryInfo = task.retryCount > 0 
        ? `<span class="retry-badge" title="重试 ${task.retryCount} 次">🔄 ${task.retryCount}次</span>` 
        : '';
    
    const errorInfo = task.lastError 
        ? `<div class="error-message">⚠️ ${task.lastError}</div>` 
        : '';
    
    const assigneeInfo = task.assignee 
        ? `<span>👤 ${task.assignee}</span>` 
        : '';
    
    const retryButton = (task.status === 'blocked' || task.status === 'failed')
        ? `<button class="action-btn retry-btn" onclick="retryTask('${task.id}')">🔄 重试</button>`
        : '';
    
    // 整个卡片可拖拽，不需要单独的拖拽提示
    const dragHint = '';
    
    card.innerHTML = `
        <div class="task-checkbox">
            <input type="checkbox" ${selectedTasks.has(task.id) ? 'checked' : ''} 
                   onchange="toggleTaskSelection('${task.id}')">
        </div>
        <div class="task-content">
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
                ${assigneeInfo}
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
                ${dragHint}
                ${retryButton}
                <button class="action-btn info-btn" onclick="showDependencyModal('${task.id}')" title="依赖关系">🔗</button>
                <button class="action-btn info-btn" onclick="showCommentsModal('${task.id}')" title="评论日志">💬</button>
                <button class="action-btn info-btn" onclick="showSubtasksModal('${task.id}')" title="子任务">🌳</button>
                <button class="action-btn info-btn" onclick="showTemplatesModal()" title="任务模板">📋</button>
                <button class="action-btn info-btn" onclick="showTimeStatsModal()" title="时间统计">⏱️</button>
                <button class="action-btn info-btn" onclick="showOpenClawIntegration('${task.id}')" title="OpenClaw 自动化">🤖</button>
            </div>
        </div>
    `;
    
    const container = document.getElementById(`${task.status}Tasks`);
    if (container) {
        container.appendChild(card);
    }
}

// 按状态筛选（阻塞时显示原因）
function filterByStatus(status) {
    // 如果是阻塞状态，显示阻塞原因
    if (status === 'blocked') {
        showBlockedReasons();
        return;
    }
    
    // 其他状态正常筛选
    document.getElementById('statusFilter').value = status;
    applyFilters();
    
    // 滚动到第一个任务
    setTimeout(() => {
        const firstTask = document.querySelector(`.task-card[data-task-id]`);
        if (firstTask) {
            firstTask.scrollIntoView({ behavior: 'smooth', block: 'center' });
            firstTask.classList.add('highlight-task');
            setTimeout(() => firstTask.classList.remove('highlight-task'), 2000);
        }
    }, 100);
}

// 显示阻塞原因统计
function showBlockedReasons() {
    const blockedTasks = tasks.filter(t => t.status === 'blocked');
    
    // 统计阻塞原因
    const reasons = {};
    blockedTasks.forEach(task => {
        const reason = task.lastError || '未知原因';
        if (!reasons[reason]) {
            reasons[reason] = { count: 0, tasks: [] };
        }
        reasons[reason].count++;
        reasons[reason].tasks.push(task);
    });
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>⏸️ 阻塞任务分析（共 ${blockedTasks.length} 个）</h3>
                <button class="modal-close" onclick="this.closest('.modal').remove()">✕</button>
            </div>
            <div class="modal-body">
                ${Object.keys(reasons).length === 0 ? 
                    '<div class="empty-state">暂无阻塞任务</div>' : 
                    `<div class="blocked-reasons">
                        ${Object.entries(reasons).map(([reason, data]) => `
                            <div class="reason-group">
                                <div class="reason-header">
                                    <span class="reason-name">${reason}</span>
                                    <span class="reason-count">${data.count}个任务</span>
                                </div>
                                <div class="reason-tasks">
                                    ${data.tasks.map(task => `
                                        <div class="reason-task">
                                            <span class="task-id">${task.id}</span>
                                            <span class="task-title">${task.title}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>`
                }
                <div class="modal-actions">
                    <button class="btn-primary" onclick="filterByBlocked()">查看阻塞任务</button>
                    <button class="btn-secondary" onclick="this.closest('.modal').remove()">关闭</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// 筛选阻塞任务
function filterByBlocked() {
    document.getElementById('statusFilter').value = 'blocked';
    applyFilters();
    
    // 关闭模态框
    const modal = document.querySelector('.modal');
    if (modal) modal.remove();
}

// 清空筛选
function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('statusFilter').value = 'all';
    document.getElementById('priorityFilter').value = 'all';
    document.getElementById('assigneeFilter').value = 'all';
    applyFilters();
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
    
    // 任务加载完成后渲染图表
    setTimeout(() => renderCharts(), 100);
}

// 选择任务
function toggleTaskSelection(taskId) {
    if (selectedTasks.has(taskId)) {
        selectedTasks.delete(taskId);
    } else {
        selectedTasks.add(taskId);
    }
    updateBatchActions();
    renderTasks(getFilteredTasks());
}

// 全选分区
function toggleSectionSelect(status, checked) {
    const filtered = getFilteredTasks();
    filtered.filter(t => t.status === status).forEach(task => {
        if (checked) {
            selectedTasks.add(task.id);
        } else {
            selectedTasks.delete(task.id);
        }
    });
    updateBatchActions();
    renderTasks(filtered);
}

// 更新批量操作栏
function updateBatchActions() {
    const batchBar = document.getElementById('batchActions');
    const countLabel = document.getElementById('selectedCount');
    
    if (selectedTasks.size > 0) {
        batchBar.style.display = 'flex';
        countLabel.textContent = `已选择 ${selectedTasks.size} 个任务`;
    } else {
        batchBar.style.display = 'none';
    }
}

// 获取筛选后的任务
function getFilteredTasks() {
    return tasks.filter(task => {
        if (filters.search && !task.title.toLowerCase().includes(filters.search) && 
            !task.description.toLowerCase().includes(filters.search)) {
            return false;
        }
        if (filters.status !== 'all' && task.status !== filters.status) return false;
        if (filters.priority !== 'all' && task.priority !== filters.priority) return false;
        if (filters.assignee !== 'all' && task.assignee !== filters.assignee) return false;
        return true;
    });
}

// 批量更新状态
function batchUpdateStatus(newStatus) {
    if (selectedTasks.size === 0) return;
    
    const confirmMsg = `确定将选中的 ${selectedTasks.size} 个任务设为${newStatus}吗？`;
    if (!confirm(confirmMsg)) return;
    
    tasks.forEach(task => {
        if (selectedTasks.has(task.id)) {
            task.status = newStatus;
            if (newStatus === 'done') {
                task.completedTime = new Date().toLocaleString('zh-CN', {
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                task.progress = 100;
            }
        }
    });
    
    selectedTasks.clear();
    updateBatchActions();
    applyFilters();
    saveTasks();
}

// 批量删除
function batchDelete() {
    if (selectedTasks.size === 0) return;
    
    const confirmMsg = `确定要删除选中的 ${selectedTasks.size} 个任务吗？此操作不可恢复！`;
    if (!confirm(confirmMsg)) return;
    
    tasks = tasks.filter(task => !selectedTasks.has(task.id));
    selectedTasks.clear();
    updateBatchActions();
    applyFilters();
    saveTasks();
}

// 取消批量操作
function cancelBatch() {
    selectedTasks.clear();
    updateBatchActions();
    renderTasks(getFilteredTasks());
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
        saveTasks();
        applyFilters();
    }
}

// 上移任务
function moveTaskUp(taskId) {
    const index = tasks.findIndex(t => t.id === taskId);
    if (index <= 0) return;
    [tasks[index - 1], tasks[index]] = [tasks[index], tasks[index - 1]];
    updateTaskOrder();
    saveTasks();
    applyFilters();
}

// 下移任务
function moveTaskDown(taskId) {
    const index = tasks.findIndex(t => t.id === taskId);
    if (index < 0 || index >= tasks.length - 1) return;
    [tasks[index], tasks[index + 1]] = [tasks[index + 1], tasks[index]];
    updateTaskOrder();
    saveTasks();
    applyFilters();
}

// 更新任务顺序
function updateTaskOrder() {
    taskOrder = tasks.map(t => t.id);
}

// 保存任务
function saveTasks() {
    console.log('保存任务数据:', {
        tasks: tasks,
        taskOrder: taskOrder
    });
    alert('任务已更新！\n\n请推送更改到 GitHub 以同步在线环境。');
}

// 拖拽排序相关变量
let draggedTask = null;

// 拖拽开始
function handleDragStart(e) {
    draggedTask = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.dataset.taskId);
}

// 拖拽经过
function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    this.classList.add('drag-over');
}

// 拖拽离开
function handleDragLeave(e) {
    this.classList.remove('drag-over');
}

// 拖拽放下
function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');
    
    if (draggedTask && draggedTask !== this) {
        const fromId = draggedTask.dataset.taskId;
        const toId = this.dataset.taskId;
        
        // 交换任务顺序
        const fromIndex = tasks.findIndex(t => t.id === fromId);
        const toIndex = tasks.findIndex(t => t.id === toId);
        
        if (fromIndex !== -1 && toIndex !== -1) {
            // 移动任务
            const [movedTask] = tasks.splice(fromIndex, 1);
            tasks.splice(toIndex, 0, movedTask);
            
            // 更新顺序
            updateTaskOrder();
            
            // 保存并重新渲染
            saveTasks();
            applyFilters();
        }
    }
}

// 拖拽结束
function handleDragEnd(e) {
    this.classList.remove('dragging');
    document.querySelectorAll('.task-card').forEach(card => {
        card.classList.remove('dragging');
        card.classList.remove('drag-over');
    });
    draggedTask = null;
}

// 自动刷新（每 5 分钟）
setInterval(() => {
    loadTasks();
}, 5 * 60 * 1000);

// ============== 深色模式 ==============

// 初始化深色模式
function initDarkMode() {
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
        document.body.classList.add('dark-mode');
        updateDarkModeButton(true);
    }
}

// 切换深色模式
function toggleDarkMode() {
    const body = document.body;
    const isDark = body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', isDark);
    updateDarkModeButton(isDark);
    renderCharts(); // 重新渲染图表以适配主题
}

// 更新深色模式按钮图标
function updateDarkModeButton(isDark) {
    const btn = document.querySelector('.dark-mode-toggle');
    if (btn) {
        btn.textContent = isDark ? '☀️' : '🌙';
    }
}

// ============== 数据图表 ==============

let statusChartInstance = null;
let priorityChartInstance = null;
let assigneeChartInstance = null;
let progressChartInstance = null;

// 渲染所有图表
function renderCharts() {
    renderStatusChart();
    renderPriorityChart();
    renderAssigneeChart();
    renderProgressChart();
}

// 获取图表颜色
function getChartColors() {
    const isDark = document.body.classList.contains('dark-mode');
    return {
        text: isDark ? '#e0e0e0' : '#333',
        grid: isDark ? '#3a3a4e' : '#e5e7eb'
    };
}

// 渲染状态分布图
function renderStatusChart() {
    const ctx = document.getElementById('statusChart');
    if (!ctx) return;
    
    const stats = {
        done: tasks.filter(t => t.status === 'done').length,
        progress: tasks.filter(t => t.status === 'progress').length,
        todo: tasks.filter(t => t.status === 'todo').length,
        blocked: tasks.filter(t => t.status === 'blocked').length
    };
    
    if (statusChartInstance) {
        statusChartInstance.destroy();
    }
    
    statusChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['✅ 已完成', '🔄 进行中', '🆕 待办', '⏸️ 阻塞'],
            datasets: [{
                data: [stats.done, stats.progress, stats.todo, stats.blocked],
                backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: getChartColors().text }
                }
            }
        }
    });
}

// 渲染优先级分布图
function renderPriorityChart() {
    const ctx = document.getElementById('priorityChart');
    if (!ctx) return;
    
    const stats = {
        p0: tasks.filter(t => t.priority === 'P0').length,
        p1: tasks.filter(t => t.priority === 'P1').length,
        p2: tasks.filter(t => t.priority === 'P2').length
    };
    
    if (priorityChartInstance) {
        priorityChartInstance.destroy();
    }
    
    priorityChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['🔴 P0 紧急重要', '🟠 P1 重要', '🔵 P2 普通'],
            datasets: [{
                label: '任务数量',
                data: [stats.p0, stats.p1, stats.p2],
                backgroundColor: ['#ef4444', '#f97316', '#3b82f6'],
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: getChartColors().text },
                    grid: { color: getChartColors().grid }
                },
                x: {
                    ticks: { color: getChartColors().text },
                    grid: { display: false }
                }
            }
        }
    });
}

// 渲染负责人任务量图
function renderAssigneeChart() {
    const ctx = document.getElementById('assigneeChart');
    if (!ctx) return;
    
    const assigneeStats = {};
    tasks.forEach(task => {
        const assignee = task.assignee || '未分配';
        assigneeStats[assignee] = (assigneeStats[assignee] || 0) + 1;
    });
    
    if (assigneeChartInstance) {
        assigneeChartInstance.destroy();
    }
    
    assigneeChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(assigneeStats),
            datasets: [{
                data: Object.values(assigneeStats),
                backgroundColor: [
                    '#667eea', '#764ba2', '#f093fb', '#f5576c',
                    '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
                    '#fa709a', '#fee140', '#30cfd0', '#330867'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: { color: getChartColors().text }
                }
            }
        }
    });
}

// 渲染完成进度趋势图（模拟数据）
function renderProgressChart() {
    const ctx = document.getElementById('progressChart');
    if (!ctx) return;
    
    // 模拟 7 天数据
    const labels = [];
    const completedData = [];
    const todoData = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        labels.push(`${date.getMonth() + 1}/${date.getDate()}`);
        completedData.push(Math.floor(Math.random() * 10) + i * 2);
        todoData.push(Math.floor(Math.random() * 5) + (6 - i) * 3);
    }
    
    if (progressChartInstance) {
        progressChartInstance.destroy();
    }
    
    progressChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: '✅ 已完成',
                    data: completedData,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: '🆕 待完成',
                    data: todoData,
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: { color: getChartColors().text }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: getChartColors().text },
                    grid: { color: getChartColors().grid }
                },
                x: {
                    ticks: { color: getChartColors().text },
                    grid: { display: false }
                }
            }
        }
    });
}

// ============== OpenClaw 集成功能 ==============

// 显示 OpenClaw 集成面板
function showOpenClawIntegration(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
                <h3>🤖 OpenClaw 自动化执行</h3>
                <button class="modal-close" onclick="this.closest('.modal').remove()">✕</button>
            </div>
            <div class="modal-body">
                <div class="openclaw-status" id="gatewayStatus">
                    <p>检查 Gateway 状态中...</p>
                </div>
                
                <div class="task-info">
                    <h4>任务信息</h4>
                    <p><strong>ID:</strong> ${task.id}</p>
                    <p><strong>标题:</strong> ${task.title}</p>
                    <p><strong>描述:</strong> ${task.description}</p>
                    <p><strong>状态:</strong> ${task.status}</p>
                    <p><strong>优先级:</strong> ${task.priority}</p>
                </div>
                
                <div class="openclaw-actions">
                    <button class="btn-primary" onclick="executeWithOpenClaw('${task.id}')">
                        🚀 立即执行
                    </button>
                    <button class="btn-secondary" onclick="checkGatewayStatus()">
                        🔄 刷新状态
                    </button>
                </div>
                
                <div class="openclaw-help">
                    <h4>📖 使用说明</h4>
                    <ol>
                        <li>确保 OpenClaw Gateway 正在运行</li>
                        <li>点击"立即执行"将任务发送给 OpenClaw</li>
                        <li>OpenClaw 会自动执行任务并更新状态</li>
                        <li>执行完成后任务状态会自动同步</li>
                    </ol>
                    
                    <h4>🔧 启动 Gateway</h4>
                    <pre><code>openclaw gateway start</code></pre>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 自动检查 Gateway 状态
    checkGatewayStatus();
}

// 检查 Gateway 状态
async function checkGatewayStatus() {
    const statusDiv = document.getElementById('gatewayStatus');
    const integration = window.openclawIntegration;
    
    try {
        const status = await integration.checkGatewayStatus();
        
        if (status.online) {
            statusDiv.innerHTML = `
                <div class="status-indicator online">
                    <span class="status-dot">🟢</span>
                    <span>OpenClaw Gateway 在线</span>
                    <span class="status-detail">版本：${status.version || '未知'}</span>
                </div>
            `;
        } else {
            statusDiv.innerHTML = `
                <div class="status-indicator offline">
                    <span class="status-dot">🔴</span>
                    <span>OpenClaw Gateway 离线</span>
                    <span class="status-detail">${status.error || '无法连接'}</span>
                </div>
                <div class="alert alert-warning">
                    <strong>请先启动 Gateway：</strong>
                    <pre><code>openclaw gateway start</code></pre>
                </div>
            `;
        }
    } catch (error) {
        statusDiv.innerHTML = `
            <div class="status-indicator offline">
                <span class="status-dot">🔴</span>
                <span>检查失败</span>
                <span class="status-detail">${error.message}</span>
            </div>
        `;
    }
}

// 使用 OpenClaw 执行任务
async function executeWithOpenClaw(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const integration = window.openclawIntegration;
    
    try {
        // 更新任务状态为执行中
        task.status = 'progress';
        task.progress = 0;
        saveTasks();
        applyFilters();
        
        // 调用 OpenClaw API
        const result = await integration.executeTask(task);
        
        // 更新任务状态
        task.status = result.status || 'done';
        task.progress = 100;
        task.completedTime = new Date().toLocaleString('zh-CN', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
        task.result = result.data;
        
        saveTasks();
        applyFilters();
        
        // 显示成功消息
        alert(`✅ 任务执行成功！\n\n状态：${task.status}\n结果：${JSON.stringify(result.data, null, 2)}`);
        
        // 关闭模态框
        const modal = document.querySelector('.modal');
        if (modal) modal.remove();
        
    } catch (error) {
        // 执行失败，恢复状态
        task.status = 'blocked';
        task.lastError = error.message;
        saveTasks();
        applyFilters();
        
        alert(`❌ 任务执行失败\n\n错误信息：${error.message}\n\n请检查 OpenClaw Gateway 是否正常运行`);
    }
}

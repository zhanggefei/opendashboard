// OpenDashboard 应用逻辑 v1.1 - 筛选搜索 + 批量操作

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

// 页面加载时获取任务
document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    window.commentManager.load(); // 加载评论和日志
    window.subtaskManager.load(); // 加载子任务
    window.notificationManager = new NotificationManager(); // 启动通知服务
});

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
    
    // 更新统计
    updateStats(filteredTasks);
    
    // 渲染任务
    renderTasks(filteredTasks);
    
    // 更新结果计数
    document.getElementById('resultCount').textContent = `显示 ${filteredTasks.length}/${tasks.length} 任务`;
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
    
    const orderButtons = task.status === 'todo'
        ? `
        <button class="action-btn order-btn" onclick="moveTaskUp('${task.id}')" title="上移">⬆️</button>
        <button class="action-btn order-btn" onclick="moveTaskDown('${task.id}')" title="下移">⬇️</button>
        `
        : '';
    
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
                ${orderButtons}
                ${retryButton}
                <button class="action-btn info-btn" onclick="showDependencyModal('${task.id}')" title="依赖关系">🔗</button>
                <button class="action-btn info-btn" onclick="showCommentsModal('${task.id}')" title="评论日志">💬</button>
                <button class="action-btn info-btn" onclick="showSubtasksModal('${task.id}')" title="子任务">🌳</button>
            </div>
        </div>
    `;
    
    const container = document.getElementById(`${task.status}Tasks`);
    if (container) {
        container.appendChild(card);
    }
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

// 自动刷新（每 5 分钟）
setInterval(() => {
    loadTasks();
}, 5 * 60 * 1000);

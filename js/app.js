// OpenDashboard 应用逻辑

let tasks = [];

// 页面加载时获取任务
document.addEventListener('DOMContentLoaded', loadTasks);

// 加载任务数据
async function loadTasks() {
    try {
        // 显示加载状态
        showLoading();
        
        // 从本地文件加载（开发环境）
        const response = await fetch('tasks/tasks.json');
        if (!response.ok) throw new Error('无法加载任务数据');
        
        tasks = await response.json();
        
        // 渲染任务
        renderTasks();
        
        // 更新时间
        updateLastUpdate();
        
    } catch (error) {
        console.error('加载任务失败:', error);
        // 使用示例数据
        loadSampleTasks();
    }
}

// 显示加载状态
function showLoading() {
    document.querySelectorAll('.task-list').forEach(list => {
        list.innerHTML = '<div class="loading">加载中...</div>';
    });
}

// 加载示例数据（备用）
function loadSampleTasks() {
    tasks = {
        tasks: [
            {
                id: 'T001',
                title: '公海客户优先级分析',
                priority: 'P0',
                status: 'done',
                progress: 100,
                description: '完成 5,800 个公海客户的优先级分析，输出 B/C/D/E 分级报告。',
                startTime: '2026-03-01 08:03',
                completedTime: '2026-03-01 08:17'
            },
            {
                id: 'T002',
                title: '客户跟进情况评估',
                priority: 'P0',
                status: 'done',
                progress: 100,
                description: '分析 5,565 个客户的跟进记录，输出跟进率、行业分布等详细报告。',
                startTime: '2026-03-01 10:14',
                completedTime: '2026-03-01 10:17'
            },
            {
                id: 'T003',
                title: '定期汇报机制',
                priority: 'P1',
                status: 'progress',
                progress: 50,
                description: '建立每 30 分钟定期汇报机制，确保及时了解任务进展。',
                startTime: '2026-03-01 08:03'
            },
            {
                id: 'T004',
                title: 'B 级客户详细列表导出',
                priority: 'P1',
                status: 'todo',
                progress: 0,
                description: '导出 987 个 B 级客户（30 天内有跟进）的详细信息。',
                estimatedTime: '5 分钟'
            },
            {
                id: 'T005',
                title: 'KA 区域激活方案',
                priority: 'P1',
                status: 'todo',
                progress: 0,
                description: '针对 KA 区域跟进率仅 10.9% 的问题，制定重新激活方案。',
                estimatedTime: '15 分钟'
            },
            {
                id: 'T006',
                title: '销售跟进效率分析',
                priority: 'P2',
                status: 'todo',
                progress: 0,
                description: '分析每个销售的跟进效率，找出最佳实践和改进空间。',
                estimatedTime: '10 分钟'
            }
        ]
    };
    
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
    tasks.tasks.forEach(task => {
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
        </div>
        ${task.progress !== undefined ? `
        <div class="progress-bar">
            <div class="progress-fill" style="width: ${task.progress}%"></div>
        </div>
        ` : ''}
        <p class="task-desc">${task.description}</p>
    `;
    
    // 添加到对应列表
    const container = document.getElementById(`${task.status}Tasks`);
    if (container) {
        container.appendChild(card);
    }
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

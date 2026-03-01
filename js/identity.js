// 身份管理模块

class IdentityManager {
    constructor() {
        this.identities = [
            {
                id: 'dog蛋',
                name: '狗蛋 - 专属 AI 助手',
                icon: '🤖',
                color: '#667eea',
                description: '专业的 AI 助手，专注于 IT 管理和销售支持',
                tasks: []
            },
            {
                id: 'crm_analyst',
                name: 'CRM 数据分析师',
                icon: '📊',
                color: '#10b981',
                description: '分析客户数据，提供分级和跟进建议',
                tasks: []
            },
            {
                id: 'developer',
                name: 'OpenDashboard 开发者',
                icon: '💻',
                color: '#3b82f6',
                description: '开发和维护 OpenDashboard 项目',
                tasks: []
            },
            {
                id: 'optimizer',
                name: '30 天优化计划执行者',
                icon: '🎯',
                color: '#f59e0b',
                description: '每天完成 2 个功能点优化',
                tasks: []
            }
        ];
        this.currentIdentity = 'dog蛋';
        this.load();
    }

    // 添加任务到身份
    addTask(identityId, task) {
        const identity = this.identities.find(i => i.id === identityId);
        if (identity) {
            identity.tasks.push(task);
            this.save();
        }
    }

    // 获取当前身份
    getCurrentIdentity() {
        return this.identities.find(i => i.id === this.currentIdentity);
    }

    // 切换身份
    switchIdentity(identityId) {
        this.currentIdentity = identityId;
        this.save();
    }

    // 获取紧急任务（P0 级）
    getUrgentTasks() {
        const urgentTasks = [];
        this.identities.forEach(identity => {
            identity.tasks.forEach(task => {
                if (task.priority === 'P0') {
                    urgentTasks.push({
                        ...task,
                        identityName: identity.name,
                        identityIcon: identity.icon
                    });
                }
            });
        });
        return urgentTasks;
    }

    // 保存
    save() {
        localStorage.setItem('identityManager', JSON.stringify({
            identities: this.identities,
            currentIdentity: this.currentIdentity
        }));
    }

    // 加载
    load() {
        try {
            const data = JSON.parse(localStorage.getItem('identityManager'));
            if (data) {
                this.identities = data.identities || this.identities;
                this.currentIdentity = data.currentIdentity || 'dog蛋';
            }
        } catch (e) {
            console.error('加载身份管理失败:', e);
        }
    }
}

// 渲染身份列表
function renderIdentities() {
    const container = document.getElementById('identityList');
    if (!container) return;

    const html = window.identityManager.identities.map(identity => {
        const taskCount = identity.tasks.length;
        const urgentCount = identity.tasks.filter(t => t.priority === 'P0').length;
        const isActive = identity.id === window.identityManager.currentIdentity;

        return `
            <div class="identity-card ${isActive ? 'active' : ''}" onclick="switchIdentity('${identity.id}')">
                <div class="identity-header">
                    <span class="identity-icon">${identity.icon}</span>
                    <span class="identity-name">${identity.name}</span>
                </div>
                <p class="identity-desc">${identity.description}</p>
                <div class="identity-stats">
                    <span class="task-count">任务：${taskCount}</span>
                    ${urgentCount > 0 ? `<span class="urgent-count">紧急：${urgentCount}</span>` : ''}
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = html;
}

// 切换身份
function switchIdentity(identityId) {
    window.identityManager.switchIdentity(identityId);
    renderIdentities();
    setTimeout(() => {
        renderTasks();
    }, 100);
}

// 渲染任务列表
function renderTasks() {
    const container = document.getElementById('taskList');
    if (!container) return;

    const identity = window.identityManager.getCurrentIdentity();
    if (!identity) return;

    console.log('当前身份:', identity.id, '任务数:', identity.tasks.length);

    // 紧急任务优先显示
    const urgentTasks = identity.tasks.filter(t => t.priority === 'P0');
    const normalTasks = identity.tasks.filter(t => t.priority !== 'P0');

    let html = '';

    // 紧急任务
    if (urgentTasks.length > 0) {
        html += '<div class="task-section"><h3>🔴 紧急任务（立即执行）</h3>';
        html += urgentTasks.map(task => renderTaskCard(task)).join('');
        html += '</div>';
    }

    // 普通任务
    if (normalTasks.length > 0) {
        html += '<div class="task-section"><h3>📋 普通任务</h3>';
        html += normalTasks.map(task => renderTaskCard(task)).join('');
        html += '</div>';
    }

    if (identity.tasks.length === 0) {
        html = '<div class="empty-state">暂无任务</div>';
    }

    container.innerHTML = html;
    
    // 更新身份卡片上的任务数量显示
    renderIdentities();
}

// 渲染任务卡片
function renderTaskCard(task) {
    const priorityColors = {
        'P0': '#ef4444',
        'P1': '#f59e0b',
        'P2': '#3b82f6'
    };

    const statusColors = {
        'todo': '#f59e0b',
        'progress': '#3b82f6',
        'done': '#10b981'
    };

    return `
        <div class="task-card">
            <div class="task-header">
                <span class="task-title">${task.title}</span>
                <span class="task-priority" style="background: ${priorityColors[task.priority] || '#999'}">
                    ${task.priority}
                </span>
            </div>
            <p class="task-desc">${task.description || ''}</p>
            <div class="task-meta">
                <span class="task-status" style="color: ${statusColors[task.status] || '#999'}">
                    ${task.status === 'todo' ? '🆕 待办' : task.status === 'progress' ? '🔄 进行中' : '✅ 已完成'}
                </span>
                ${task.deadline ? `<span>⏰ 截止：${task.deadline}</span>` : ''}
            </div>
            <div class="task-actions">
                <button class="btn-start" onclick="startTask('${task.id}')">开始</button>
                <button class="btn-complete" onclick="completeTask('${task.id}')">完成</button>
            </div>
        </div>
    `;
}

// 开始任务
function startTask(taskId) {
    const identity = window.identityManager.getCurrentIdentity();
    const task = identity.tasks.find(t => t.id === taskId);
    if (task) {
        task.status = 'progress';
        window.identityManager.save();
        renderTasks();
    }
}

// 完成任务
function completeTask(taskId) {
    const identity = window.identityManager.getCurrentIdentity();
    const task = identity.tasks.find(t => t.id === taskId);
    if (task) {
        task.status = 'done';
        window.identityManager.save();
        renderTasks();
    }
}

// 添加示例任务
function addSampleTasks() {
    console.log('添加示例任务...');
    
    // CRM 数据分析师任务
    window.identityManager.addTask('crm_analyst', {
        id: 'crm_001',
        title: '分析公海池客户数据',
        description: '分析 5,802 条公海池客户，生成分级和跟进建议',
        priority: 'P0',
        status: 'done',
        deadline: '2026-03-01'
    });
    console.log('CRM 分析师任务数:', window.identityManager.identities.find(i => i.id === 'crm_analyst').tasks.length);

    // OpenDashboard 开发者任务
    window.identityManager.addTask('developer', {
        id: 'dev_001',
        title: '开发身份管理功能',
        description: '在 OpenDashboard 中增加身份管理模块',
        priority: 'P0',
        status: 'progress',
        deadline: '2026-03-01'
    });
    console.log('开发者任务数:', window.identityManager.identities.find(i => i.id === 'developer').tasks.length);

    // 30 天优化计划任务
    window.identityManager.addTask('optimizer', {
        id: 'opt_001',
        title: '30 天优化计划 - 第 1 天',
        description: '每天完成 2 个功能点优化',
        priority: 'P0',
        status: 'todo',
        deadline: '2026-03-02'
    });
    console.log('优化计划任务数:', window.identityManager.identities.find(i => i.id === 'optimizer').tasks.length);
}

// 初始化
window.IdentityManager = IdentityManager;
window.switchIdentity = switchIdentity;
window.renderIdentities = renderIdentities;
window.renderTasks = renderTasks;
window.startTask = startTask;
window.completeTask = completeTask;

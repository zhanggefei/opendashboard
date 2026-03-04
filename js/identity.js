// 身份管理模块

class IdentityManager {
    constructor() {
        this.identities = [
            {
                id: 'dogdan',
                name: '狗蛋 - 专属 AI 助手',
                icon: '🤖',
                color: '#667eea',
                description: '专业的 AI 助手，专注于 IT 管理和销售支持',
                skills: [
                    { name: '数据分析', icon: '📊', level: 95, component: 'openclaw-memory' },
                    { name: 'CRM 管理', icon: '👥', level: 95, component: 'feishu-bitable' },
                    { name: '客户分级', icon: '🎯', level: 95, component: 'feishu-bitable' },
                    { name: '跟进分析', icon: '📈', level: 95, component: 'feishu-bitable' },
                    { name: '数据清洗', icon: '🧹', level: 90, component: 'openclaw-memory' },
                    { name: '趋势预测', icon: '🔮', level: 85, component: 'web-search' },
                    { name: '销售支持', icon: '💼', level: 90, component: 'feishu-chat' },
                    { name: '报告生成', icon: '📝', level: 95, component: 'feishu-doc' },
                    { name: '自动化任务', icon: '⚡', level: 90, component: 'openclaw-cron' },
                    { name: '多任务并行', icon: '🎯', level: 90, component: 'sessions-spawn' },
                    { name: '记忆管理', icon: '🧠', level: 95, component: 'memory_*' },
                    { name: '会话历史', icon: '📜', level: 90, component: 'sessions_history' }
                ],
                tasks: []
            },
            {
                id: 'developer',
                name: 'OpenDashboard 开发者',
                icon: '💻',
                color: '#3b82f6',
                description: '开发和维护 OpenDashboard 项目',
                skills: [
                    { name: 'JavaScript', icon: '🟨', level: 95, component: 'nodejs' },
                    { name: 'HTML/CSS', icon: '🎨', level: 90, component: 'browser' },
                    { name: 'Python', icon: '🐍', level: 85, component: 'python3' },
                    { name: 'Git 版本控制', icon: '📦', level: 90, component: 'git' },
                    { name: '服务器部署', icon: '🚀', level: 85, component: 'systemd' },
                    { name: 'Bug 修复', icon: '🔧', level: 95, component: 'debug' }
                ],
                tasks: []
            }
        ];
        this.currentIdentity = 'dogdan';
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
            if (data && data.identities) {
                // 合并保存的身份和默认身份，保留任务
                this.identities = this.identities.map(defaultIdentity => {
                    const savedIdentity = data.identities.find(i => i.id === defaultIdentity.id);
                    if (savedIdentity) {
                        return { ...defaultIdentity, tasks: savedIdentity.tasks || [] };
                    }
                    return defaultIdentity;
                });
                this.currentIdentity = data.currentIdentity || 'dogdan';
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

// 渲染技能
function renderSkills(identityId) {
    const container = document.getElementById('skillsList');
    const section = document.getElementById('skillsSection');
    if (!container || !section) return;
    
    const identity = window.identityManager.identities.find(i => i.id === identityId);
    if (!identity || !identity.skills) {
        section.style.display = 'none';
        return;
    }
    
    section.style.display = 'block';
    const html = identity.skills.map(skill => `
        <div class="skill-card">
            <div class="skill-header">
                <span class="skill-icon">${skill.icon}</span>
                <span class="skill-name">${skill.name}</span>
                <span class="skill-level">${skill.level}%</span>
            </div>
            <div class="skill-bar">
                <div class="skill-fill" style="width: ${skill.level}%"></div>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

// 导出 renderSkills 函数
window.renderSkills = renderSkills;

// 渲染身份页签
function renderIdentityTabs() {
    const container = document.getElementById('identityTabs');
    if (!container) return;

    const html = window.identityManager.identities.map(identity => {
        const isActive = identity.id === window.identityManager.currentIdentity;
        return `
            <div class="identity-tab ${isActive ? 'active' : ''}" onclick="switchIdentity('${identity.id}')">
                ${identity.icon} ${identity.name.split(' - ')[0]}
            </div>
        `;
    }).join('');

    container.innerHTML = html;
}

// 导出 renderIdentityTabs 函数
window.renderIdentityTabs = renderIdentityTabs;

// 切换身份
function switchIdentity(identityId) {
    const wasActive = window.identityManager.currentIdentity === identityId;
    
    window.identityManager.switchIdentity(identityId);
    renderIdentityTabs();
    renderTasks();
    renderSkills(identityId);
    
    // 显示技能区域
    const skillsSection = document.getElementById('skillsSection');
    if (skillsSection) {
        skillsSection.style.display = 'block';
        // 滚动到技能区域
        skillsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// 渲染任务列表
function renderTasks() {
    const container = document.getElementById('taskList');
    if (!container) return;

    const identity = window.identityManager.getCurrentIdentity();
    if (!identity) return;

    // 紧急任务优先显示
    const urgentTasks = identity.tasks.filter(t => t.priority === 'P0');
    const normalTasks = identity.tasks.filter(t => t.priority !== 'P0');

    let html = '';

    // 紧急任务
    if (urgentTasks.length > 0) {
        html += '<div class="task-section"><h3>🔴 紧急任务（立即执行）</h3><div class="task-grid">';
        html += urgentTasks.map(task => renderTaskCard(task)).join('');
        html += '</div></div>';
    }

    // 普通任务
    if (normalTasks.length > 0) {
        html += '<div class="task-section"><h3>📋 普通任务</h3><div class="task-grid">';
        html += normalTasks.map(task => renderTaskCard(task)).join('');
        html += '</div></div>';
    }

    if (identity.tasks.length === 0) {
        html = '<div class="empty-state">暂无任务</div>';
    }

    container.innerHTML = html;
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

// 初始化
window.IdentityManager = IdentityManager;
window.switchIdentity = switchIdentity;
window.renderIdentities = renderIdentities;
window.renderIdentityTabs = renderIdentityTabs;
window.renderTasks = renderTasks;
window.renderSkills = renderSkills;
window.startTask = startTask;
window.completeTask = completeTask;

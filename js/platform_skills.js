// 平台技能数据
const platformSkills = [
    // 数据分析类
    { name: '数据分析', icon: '📊', category: 'data', component: 'openclaw-memory' },
    { name: '客户分级', icon: '🎯', category: 'data', component: 'feishu-bitable' },
    { name: '跟进分析', icon: '📈', category: 'data', component: 'feishu-bitable' },
    { name: '数据清洗', icon: '🧹', category: 'data', component: 'openclaw-memory' },
    { name: '趋势预测', icon: '🔮', category: 'data', component: 'web-search' },
    
    // CRM 管理类
    { name: 'CRM 管理', icon: '👥', category: 'crm', component: 'feishu-bitable' },
    { name: '销售支持', icon: '💼', category: 'crm', component: 'feishu-chat' },
    { name: '报告生成', icon: '📝', category: 'crm', component: 'feishu-doc' },
    
    // 自动化类
    { name: '自动化任务', icon: '⚡', category: 'auto', component: 'openclaw-cron' },
    { name: '多任务并行', icon: '🎯', category: 'auto', component: 'sessions-spawn' },
    
    // 开发工具类
    { name: 'JavaScript', icon: '🟨', category: 'dev', component: 'nodejs' },
    { name: 'HTML/CSS', icon: '🎨', category: 'dev', component: 'browser' },
    { name: 'Python', icon: '🐍', category: 'dev', component: 'python3' },
    { name: 'Git 版本控制', icon: '📦', category: 'dev', component: 'git' },
    { name: '服务器部署', icon: '🚀', category: 'dev', component: 'systemd' },
    { name: 'Bug 修复', icon: '🔧', category: 'dev', component: 'debug' },
    
    // 通信类
    { name: '飞书消息', icon: '💬', category: 'comm', component: 'feishu-chat' },
    { name: '通知推送', icon: '🔔', category: 'comm', component: 'message' },
    { name: '语音合成', icon: '🎙️', category: 'comm', component: 'tts' },
    
    // 文件处理类
    { name: '读取文件', icon: '📄', category: 'file', component: 'read' },
    { name: '编辑文件', icon: '✏️', category: 'file', component: 'edit' },
    { name: '写入文件', icon: '💾', category: 'file', component: 'write' },
    { name: 'PDF 分析', icon: '📊', category: 'file', component: 'pdf' },
    { name: '图片分析', icon: '🖼️', category: 'file', component: 'image' },
    
    // 网络工具类
    { name: '网络搜索', icon: '🔍', category: 'net', component: 'web-search' },
    { name: '浏览器控制', icon: '🌐', category: 'net', component: 'browser' },
    { name: 'Canvas 展示', icon: '🖥️', category: 'net', component: 'canvas' },
    
    // 系统管理类
    { name: '命令执行', icon: '⚙️', category: 'sys', component: 'exec' },
    { name: '进程管理', icon: '📋', category: 'sys', component: 'process' },
    { name: '会话管理', icon: '💾', category: 'sys', component: 'sessions_*' },
    { name: '记忆管理', icon: '🧠', category: 'sys', component: 'memory_*' }
];

// 显示平台技能
function showPlatformSkills(category) {
    // 更新标签样式
    document.querySelectorAll('.skills-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    // 过滤技能
    const container = document.getElementById('platformSkillsList');
    if (!container) return;
    
    const filtered = category === 'all' 
        ? platformSkills 
        : platformSkills.filter(skill => skill.category === category);
    
    const html = filtered.map(skill => `
        <div class="platform-skill-card">
            <div class="platform-skill-icon">${skill.icon}</div>
            <div class="platform-skill-name">${skill.name}</div>
            <div class="platform-skill-component">🔌 ${skill.component}</div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

// 切换平台技能显示/隐藏
function togglePlatformSkills() {
    const content = document.getElementById('platformSkillsContent');
    const icon = document.getElementById('platformSkillsToggleIcon');
    if (content.classList.contains('collapsed')) {
        content.classList.remove('collapsed');
        icon.textContent = '▼';
    } else {
        content.classList.add('collapsed');
        icon.textContent = '▶';
    }
}

// 初始化平台技能
window.showPlatformSkills = showPlatformSkills;
window.togglePlatformSkills = togglePlatformSkills;

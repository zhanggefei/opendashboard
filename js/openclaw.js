// OpenClaw 自动化集成模块

class OpenClawIntegration {
    constructor() {
        this.apiEndpoint = 'http://localhost:18789'; // OpenClaw Gateway 地址
        this.webhookUrl = null;
        this.autoExecuteEnabled = false;
    }

    // 检查 OpenClaw 连接状态
    async checkConnection() {
        try {
            const response = await fetch(`${this.apiEndpoint}/status`);
            if (response.ok) {
                return { connected: true, status: await response.json() };
            }
            return { connected: false, error: '无法连接到 OpenClaw' };
        } catch (e) {
            return { connected: false, error: e.message };
        }
    }

    // 注册 Webhook
    async registerWebhook() {
        try {
            const response = await fetch(`${this.apiEndpoint}/webhooks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: window.location.origin + '/api/openclaw/webhook',
                    events: ['task.created', 'task.updated', 'task.completed']
                })
            });
            
            if (response.ok) {
                this.webhookUrl = await response.json();
                return { success: true };
            }
            return { success: false, error: '注册失败' };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    // 发送任务到 OpenClaw 执行
    async executeTask(taskId, action = 'auto') {
        const task = window.tasksData?.tasks?.find(t => t.id === taskId);
        if (!task) return { success: false, error: '任务不存在' };
        
        try {
            const response = await fetch(`${this.apiEndpoint}/execute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    taskId: task.id,
                    taskTitle: task.title,
                    taskDescription: task.description,
                    action: action,
                    timestamp: new Date().toISOString()
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                
                // 更新任务状态
                if (window.tasksData?.tasks) {
                    task.status = 'progress';
                    window.commentManager?.addLog(taskId, 'OpenClaw 执行', `开始自动执行：${action}`, '系统');
                }
                
                return { success: true, result };
            }
            
            return { success: false, error: '执行失败' };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    // 设置自动执行规则
    setAutoExecuteRule(taskId, rule) {
        const rules = this.getAutoExecuteRules();
        rules[taskId] = {
            enabled: true,
            trigger: rule.trigger, // 'status_change', 'time_based', 'dependency_complete'
            action: rule.action,
            conditions: rule.conditions || {}
        };
        
        localStorage.setItem('openclaw_auto_rules', JSON.stringify(rules));
    }

    // 获取自动执行规则
    getAutoExecuteRules() {
        try {
            return JSON.parse(localStorage.getItem('openclaw_auto_rules')) || {};
        } catch (e) {
            return {};
        }
    }

    // 删除自动执行规则
    removeAutoExecuteRule(taskId) {
        const rules = this.getAutoExecuteRules();
        delete rules[taskId];
        localStorage.setItem('openclaw_auto_rules', JSON.stringify(rules));
    }

    // 检查并执行自动规则
    async checkAutoRules(taskId) {
        const rules = this.getAutoExecuteRules();
        const rule = rules[taskId];
        
        if (!rule || !rule.enabled) return;
        
        const task = window.tasksData?.tasks?.find(t => t.id === taskId);
        if (!task) return;
        
        // 检查条件
        if (this.checkRuleConditions(task, rule.conditions)) {
            await this.executeTask(taskId, rule.action);
        }
    }

    // 检查规则条件
    checkRuleConditions(task, conditions) {
        if (!conditions) return true;
        
        if (conditions.status && task.status !== conditions.status) {
            return false;
        }
        
        if (conditions.priority && task.priority !== conditions.priority) {
            return false;
        }
        
        return true;
    }

    // 处理 Webhook 回调
    handleWebhook(data) {
        console.log('收到 OpenClaw Webhook:', data);
        
        switch (data.event) {
            case 'task.executed':
                // 任务执行完成
                this.handleTaskExecuted(data.taskId, data.result);
                break;
            case 'task.failed':
                // 任务执行失败
                this.handleTaskFailed(data.taskId, data.error);
                break;
            case 'task.progress':
                // 任务进度更新
                this.handleTaskProgress(data.taskId, data.progress);
                break;
        }
    }

    // 处理任务执行完成
    handleTaskExecuted(taskId, result) {
        const task = window.tasksData?.tasks?.find(t => t.id === taskId);
        if (!task) return;
        
        task.status = 'done';
        task.progress = 100;
        task.completedTime = new Date().toISOString();
        
        window.commentManager?.addLog(taskId, 'OpenClaw 执行', `执行完成：${JSON.stringify(result)}`, '系统');
        
        // 触发依赖此任务的其他任务
        window.dependencyManager?.onTaskComplete(taskId);
    }

    // 处理任务执行失败
    handleTaskFailed(taskId, error) {
        const task = window.tasksData?.tasks?.find(t => t.id === taskId);
        if (!task) return;
        
        task.status = 'blocked';
        task.lastError = `OpenClaw 执行失败：${error}`;
        
        window.commentManager?.addLog(taskId, 'OpenClaw 执行', `执行失败：${error}`, '系统');
    }

    // 处理任务进度更新
    handleTaskProgress(taskId, progress) {
        const task = window.tasksData?.tasks?.find(t => t.id === taskId);
        if (!task) return;
        
        task.progress = progress;
    }

    // 显示 OpenClaw 集成面板
    showIntegrationPanel(taskId) {
        const task = window.tasksData?.tasks?.find(t => t.id === taskId);
        if (!task) return;
        
        const rules = this.getAutoExecuteRules();
        const currentRule = rules[taskId];
        
        const modal = document.createElement('div');
        modal.className = 'modal openclaw-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>🤖 OpenClaw 自动化集成 - ${task.id}</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">✕</button>
                </div>
                <div class="modal-body">
                    <div class="connection-status" id="connectionStatus">
                        检查连接中...
                    </div>
                    
                    <div class="integration-section">
                        <h4>手动执行</h4>
                        <div class="action-buttons">
                            <button onclick="openclawExecute('${task.id}', 'analyze')">📊 分析任务</button>
                            <button onclick="openclawExecute('${task.id}', 'process')">⚙️ 处理任务</button>
                            <button onclick="openclawExecute('${task.id}', 'report')">📝 生成报告</button>
                        </div>
                    </div>
                    
                    <div class="integration-section">
                        <h4>自动执行规则</h4>
                        <div class="rule-config">
                            <label>
                                <input type="checkbox" 
                                    ${currentRule?.enabled ? 'checked' : ''} 
                                    onchange="toggleAutoRule('${task.id}', this.checked)">
                                启用自动执行
                            </label>
                            
                            <div class="rule-settings">
                                <label>触发条件:</label>
                                <select id="ruleTrigger">
                                    <option value="status_change">状态变更时</option>
                                    <option value="time_based">定时执行</option>
                                    <option value="dependency_complete">依赖完成后</option>
                                </select>
                                
                                <label>执行动作:</label>
                                <select id="ruleAction">
                                    <option value="analyze">分析</option>
                                    <option value="process">处理</option>
                                    <option value="report">生成报告</option>
                                </select>
                                
                                <button onclick="saveAutoRule('${task.id}')">保存规则</button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="integration-section">
                        <h4>执行历史</h4>
                        <div class="execution-history">
                            ${this.getExecutionHistory(taskId)}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 检查连接状态
        this.checkConnectionStatus(taskId);
    }

    // 检查连接状态
    async checkConnectionStatus(taskId) {
        const statusEl = document.getElementById('connectionStatus');
        if (!statusEl) return;
        
        const status = await this.checkConnection();
        
        if (status.connected) {
            statusEl.innerHTML = '<span class="status-ok">✅ 已连接到 OpenClaw</span>';
        } else {
            statusEl.innerHTML = `<span class="status-error">❌ 未连接：${status.error}</span>`;
        }
    }

    // 获取执行历史
    getExecutionHistory(taskId) {
        const logs = window.commentManager?.getLogs(taskId) || [];
        const execLogs = logs.filter(log => log.action.includes('OpenClaw'));
        
        if (execLogs.length === 0) {
            return '<div class="empty-state">暂无执行记录</div>';
        }
        
        return `
            <div class="history-list">
                ${execLogs.map(log => `
                    <div class="history-item">
                        <span class="history-time">${new Date(log.timestamp).toLocaleString('zh-CN')}</span>
                        <span class="history-action">${log.action}</span>
                        <span class="history-details">${log.details}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }
}

// 手动执行任务
function openclawExecute(taskId, action) {
    window.openclawIntegration?.executeTask(taskId, action);
    alert(`已发送执行请求：${action}\n\n请查看 OpenClaw 执行结果`);
}

// 切换自动规则
function toggleAutoRule(taskId, enabled) {
    const rules = window.openclawIntegration?.getAutoExecuteRules() || {};
    
    if (enabled) {
        rules[taskId] = {
            enabled: true,
            trigger: 'status_change',
            action: 'analyze'
        };
    } else {
        delete rules[taskId];
    }
    
    localStorage.setItem('openclaw_auto_rules', JSON.stringify(rules));
}

// 保存自动规则
function saveAutoRule(taskId) {
    const triggerSelect = document.getElementById('ruleTrigger');
    const actionSelect = document.getElementById('ruleAction');
    
    if (!triggerSelect || !actionSelect) return;
    
    window.openclawIntegration?.setAutoExecuteRule(taskId, {
        trigger: triggerSelect.value,
        action: actionSelect.value
    });
    
    alert('自动执行规则已保存！');
}

// 显示 OpenClaw 集成面板
function showOpenClawIntegration(taskId) {
    if (!window.openclawIntegration) {
        window.openclawIntegration = new OpenClawIntegration();
    }
    window.openclawIntegration.showIntegrationPanel(taskId);
}

// 全局实例
window.OpenClawIntegration = OpenClawIntegration;
window.openclawExecute = openclawExecute;
window.showOpenClawIntegration = showOpenClawIntegration;
window.toggleAutoRule = toggleAutoRule;
window.saveAutoRule = saveAutoRule;

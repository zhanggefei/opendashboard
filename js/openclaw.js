// OpenClaw 自动化集成

class OpenClawIntegration {
    constructor() {
        this.apiEndpoint = 'http://localhost:18789';
    }

    // 检查连接
    async checkConnection() {
        try {
            const res = await fetch(`${this.apiEndpoint}/status`);
            return { connected: res.ok };
        } catch (e) {
            return { connected: false, error: e.message };
        }
    }

    // 执行任务
    async executeTask(taskId, action = 'auto') {
        const task = window.tasksData?.tasks?.find(t => t.id === taskId);
        if (!task) return { success: false, error: '任务不存在' };
        
        try {
            const res = await fetch(`${this.apiEndpoint}/execute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    taskId: task.id,
                    taskTitle: task.title,
                    action: action
                })
            });
            
            if (res.ok) {
                task.status = 'progress';
                window.commentManager?.addLog(taskId, 'OpenClaw', `开始执行：${action}`, '系统');
                return { success: true };
            }
            return { success: false };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    // 显示集成面板
    showIntegrationPanel(taskId) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>🤖 OpenClaw 自动化 - ${taskId}</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">✕</button>
                </div>
                <div class="modal-body">
                    <div id="connectionStatus">检查连接中...</div>
                    <div class="action-buttons">
                        <button onclick="openclawExecute('${taskId}', 'analyze')">📊 分析</button>
                        <button onclick="openclawExecute('${taskId}', 'process')">⚙️ 处理</button>
                        <button onclick="openclawExecute('${taskId}', 'report')">📝 报告</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        this.checkConnection();
    }

    async checkConnection() {
        const status = await this.checkConnection();
        const el = document.getElementById('connectionStatus');
        if (el) {
            el.innerHTML = status.connected ? 
                '<span class="status-ok">✅ 已连接</span>' : 
                '<span class="status-error">❌ 未连接</span>';
        }
    }
}

function openclawExecute(taskId, action) {
    window.openclawIntegration?.executeTask(taskId, action);
    alert(`已发送执行请求：${action}`);
}

function showOpenClawIntegration(taskId) {
    if (!window.openclawIntegration) window.openclawIntegration = new OpenClawIntegration();
    window.openclawIntegration.showIntegrationPanel(taskId);
}

window.OpenClawIntegration = OpenClawIntegration;
window.openclawExecute = openclawExecute;
window.showOpenClawIntegration = showOpenClawIntegration;

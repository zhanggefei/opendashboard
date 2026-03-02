// 任务活动日志 v1.0

class ActivityLogger {
    constructor() {
        this.logs = [];
        this.load();
    }
    
    load() {
        const saved = localStorage.getItem('opendashboard_activity');
        if (saved) {
            this.logs = JSON.parse(saved);
        }
    }
    
    save() {
        localStorage.setItem('opendashboard_activity', JSON.stringify(this.logs));
    }
    
    // 记录活动
    log(taskId, action, details = '') {
        const task = window.tasks?.find(t => t.id === taskId);
        
        this.logs.unshift({
            id: `log_${Date.now()}`,
            taskId: taskId,
            taskTitle: task?.title || '未知任务',
            action: action,
            details: details,
            user: '狗蛋',
            timestamp: new Date().toISOString()
        });
        
        // 保留最近 1000 条记录
        if (this.logs.length > 1000) {
            this.logs = this.logs.slice(0, 1000);
        }
        
        this.save();
    }
    
    // 获取任务的活动日志
    getTaskLogs(taskId) {
        return this.logs.filter(log => log.taskId === taskId);
    }
    
    // 获取所有活动日志
    getAllLogs(limit = 50) {
        return this.logs.slice(0, limit);
    }
    
    // 格式化时间
    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return '刚刚';
        if (minutes < 60) return `${minutes}分钟前`;
        if (hours < 24) return `${hours}小时前`;
        if (days < 7) return `${days}天前`;
        
        return date.toLocaleString('zh-CN', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    // 显示活动日志模态框
    showActivityModal(taskId) {
        const logs = taskId ? this.getTaskLogs(taskId) : this.getAllLogs(100);
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 700px;">
                <div class="modal-header">
                    <h3>📜 ${taskId ? '任务活动日志' : '全部活动日志'}</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">✕</button>
                </div>
                <div class="modal-body">
                    <div class="activity-timeline">
                        ${logs.length === 0 ? '<p class="empty-state">暂无活动记录</p>' : ''}
                        ${logs.map(log => `
                            <div class="activity-item">
                                <div class="activity-marker"></div>
                                <div class="activity-content">
                                    <div class="activity-header">
                                        <span class="activity-user">👤 ${log.user}</span>
                                        <span class="activity-time">${this.formatTime(log.timestamp)}</span>
                                    </div>
                                    <div class="activity-action">
                                        <strong>${log.taskId}</strong> ${log.action}
                                        ${log.details ? `<span class="activity-details">${log.details}</span>` : ''}
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    // 清除日志
    clearLogs() {
        if (confirm('确定要清除所有活动日志吗？')) {
            this.logs = [];
            this.save();
            alert('活动日志已清除');
        }
    }
}

// 全局注册
window.ActivityLogger = ActivityLogger;

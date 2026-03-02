// 任务时间追踪 v1.0

class TimeTracker {
    constructor() {
        this.tracking = {};
        this.history = [];
        this.load();
    }
    
    load() {
        const saved = localStorage.getItem('opendashboard_timetracking');
        if (saved) {
            const data = JSON.parse(saved);
            this.tracking = data.tracking || {};
            this.history = data.history || [];
        }
    }
    
    save() {
        localStorage.setItem('opendashboard_timetracking', JSON.stringify({
            tracking: this.tracking,
            history: this.history
        }));
    }
    
    // 开始追踪
    startTracking(taskId) {
        if (this.tracking[taskId]) {
            alert('此任务已在追踪中');
            return;
        }
        
        this.tracking[taskId] = {
            startTime: Date.now(),
            totalTime: 0
        };
        this.save();
        this.updateUI();
    }
    
    // 停止追踪
    stopTracking(taskId) {
        if (!this.tracking[taskId]) return;
        
        const endTime = Date.now();
        const duration = endTime - this.tracking[taskId].startTime;
        
        this.history.push({
            taskId: taskId,
            startTime: this.tracking[taskId].startTime,
            endTime: endTime,
            duration: duration,
            date: new Date().toISOString()
        });
        
        delete this.tracking[taskId];
        this.save();
        this.updateUI();
    }
    
    // 获取任务总耗时
    getTotalTime(taskId) {
        const taskHistory = this.history.filter(h => h.taskId === taskId);
        const total = taskHistory.reduce((sum, h) => sum + h.duration, 0);
        
        // 如果正在追踪，加上当前时间
        if (this.tracking[taskId]) {
            return total + (Date.now() - this.tracking[taskId].startTime);
        }
        
        return total;
    }
    
    // 格式化时间
    formatTime(ms) {
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((ms % (1000 * 60)) / 1000);
        
        if (hours > 0) {
            return `${hours}小时 ${minutes}分钟`;
        } else if (minutes > 0) {
            return `${minutes}分钟 ${seconds}秒`;
        } else {
            return `${seconds}秒`;
        }
    }
    
    // 检查任务是否在追踪中
    isTracking(taskId) {
        return !!this.tracking[taskId];
    }
    
    // 更新 UI 显示
    updateUI() {
        // 重新渲染任务列表以显示时间追踪状态
        if (window.applyFilters) {
            window.applyFilters();
        }
    }
    
    // 显示时间统计
    showStats() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 700px;">
                <div class="modal-header">
                    <h3>⏱️ 时间追踪统计</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">✕</button>
                </div>
                <div class="modal-body">
                    <div class="time-stats-grid">
                        <div class="time-stat-card">
                            <h4>今日总耗时</h4>
                            <p class="time-stat-value">${this.formatTime(this.getTodayTotal())}</p>
                        </div>
                        <div class="time-stat-card">
                            <h4>本周总耗时</h4>
                            <p class="time-stat-value">${this.formatTime(this.getWeekTotal())}</p>
                        </div>
                        <div class="time-stat-card">
                            <h4>任务总数</h4>
                            <p class="time-stat-value">${this.history.length}</p>
                        </div>
                    </div>
                    
                    <h4>最近记录</h4>
                    <div class="time-history">
                        ${this.history.slice(-10).reverse().map(h => {
                            const task = window.tasks?.find(t => t.id === h.taskId);
                            return `
                                <div class="time-history-item">
                                    <span class="task-id">${h.taskId}</span>
                                    <span class="task-title">${task?.title || '未知'}</span>
                                    <span class="time-duration">${this.formatTime(h.duration)}</span>
                                    <span class="time-date">${new Date(h.startTime).toLocaleString('zh-CN')}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    getTodayTotal() {
        const today = new Date().toDateString();
        return this.history
            .filter(h => new Date(h.startTime).toDateString() === today)
            .reduce((sum, h) => sum + h.duration, 0);
    }
    
    getWeekTotal() {
        const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        return this.history
            .filter(h => h.startTime >= weekAgo)
            .reduce((sum, h) => sum + h.duration, 0);
    }
}

// 全局注册
window.TimeTracker = TimeTracker;

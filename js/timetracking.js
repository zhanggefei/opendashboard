// 时间追踪模块

class TimeTracker {
    constructor() {
        this.trackingSessions = {};
        this.timeLogs = {};
        this.load();
    }

    // 开始追踪
    startTracking(taskId) {
        if (this.trackingSessions[taskId]) return false;
        
        this.trackingSessions[taskId] = {
            taskId,
            startTime: Date.now(),
            pauses: []
        };
        
        this.save();
        return true;
    }

    // 停止追踪
    stopTracking(taskId) {
        const session = this.trackingSessions[taskId];
        if (!session) return null;
        
        const endTime = Date.now();
        const totalTime = this.calculateSessionTime(session, endTime);
        
        if (!this.timeLogs[taskId]) this.timeLogs[taskId] = [];
        
        this.timeLogs[taskId].push({
            id: `tl_${Date.now()}`,
            startTime: session.startTime,
            endTime: endTime,
            totalTime: totalTime
        });
        
        delete this.trackingSessions[taskId];
        this.save();
        
        return { taskId, totalTime, formattedTime: this.formatTime(totalTime) };
    }

    // 计算时间
    calculateSessionTime(session, endTime = Date.now()) {
        let total = endTime - session.startTime;
        session.pauses.forEach(pause => {
            if (pause.end) total -= (pause.end - pause.start);
        });
        return Math.max(0, total);
    }

    // 获取当前追踪时间
    getCurrentTrackingTime(taskId) {
        const session = this.trackingSessions[taskId];
        if (!session) return 0;
        return this.calculateSessionTime(session);
    }

    // 获取总时间
    getTotalTime(taskId) {
        const logs = this.timeLogs[taskId] || [];
        const current = this.getCurrentTrackingTime(taskId);
        return logs.reduce((sum, log) => sum + log.totalTime, 0) + current;
    }

    // 格式化时间
    formatTime(ms) {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}分${seconds}秒`;
    }

    // 获取统计
    getAllTimeStats() {
        const stats = {};
        Object.entries(this.timeLogs).forEach(([taskId, logs]) => {
            stats[taskId] = {
                totalTime: logs.reduce((sum, log) => sum + log.totalTime, 0),
                sessions: logs.length
            };
        });
        Object.entries(this.trackingSessions).forEach(([taskId]) => {
            if (!stats[taskId]) stats[taskId] = { totalTime: 0, sessions: 0 };
            stats[taskId].tracking = true;
            stats[taskId].currentSession = this.getCurrentTrackingTime(taskId);
        });
        return stats;
    }

    // 保存/加载
    save() {
        localStorage.setItem('timeTrackingSessions', JSON.stringify(this.trackingSessions));
        localStorage.setItem('timeLogs', JSON.stringify(this.timeLogs));
    }

    load() {
        try {
            this.trackingSessions = JSON.parse(localStorage.getItem('timeTrackingSessions')) || {};
            this.timeLogs = JSON.parse(localStorage.getItem('timeLogs')) || {};
        } catch (e) { console.error('加载时间追踪失败:', e); }
    }
}

// 渲染时间追踪器
function renderTimeTracker(taskId) {
    const isTracking = !!window.timeTracker?.trackingSessions?.[taskId];
    const totalTime = window.timeTracker?.getTotalTime(taskId) || 0;
    
    return `
        <div class="time-tracker">
            <span class="time-display">${isTracking ? '🔴 追踪中' : '⏱️'} ${window.timeTracker.formatTime(totalTime)}</span>
            ${isTracking ? 
                `<button onclick="stopTracking('${taskId}')">⏹️ 停止</button>` : 
                `<button onclick="startTracking('${taskId}')">▶️ 开始</button>`
            }
        </div>
    `;
}

function startTracking(taskId) { window.timeTracker?.startTracking(taskId); }
function stopTracking(taskId) {
    const result = window.timeTracker?.stopTracking(taskId);
    if (result) alert(`本次耗时：${result.formattedTime}`);
}

function showTimeStatsModal() {
    const stats = window.timeTracker?.getAllTimeStats() || {};
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>⏱️ 时间统计</h3>
                <button class="modal-close" onclick="this.closest('.modal').remove()">✕</button>
            </div>
            <div class="modal-body">
                ${Object.keys(stats).length === 0 ? '<div class="empty-state">暂无数据</div>' : 
                Object.entries(stats).map(([id, s]) => `
                    <div class="time-stat">
                        <strong>${id}</strong>
                        <span>总计：${window.timeTracker.formatTime(s.totalTime)}</span>
                        ${s.tracking ? '<span class="tracking-badge">🔴 追踪中</span>' : ''}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

window.TimeTracker = TimeTracker;
window.renderTimeTracker = renderTimeTracker;
window.startTracking = startTracking;
window.stopTracking = stopTracking;
window.showTimeStatsModal = showTimeStatsModal;

// 每秒更新追踪显示（不刷新页面）
setInterval(() => {
    if (window.timeTracker) {
        // 更新所有追踪中的任务显示
        Object.keys(window.timeTracker.trackingSessions).forEach(taskId => {
            const el = document.querySelector(`.time-tracker[data-task="${taskId}"]`);
            if (el) {
                const time = window.timeTracker.getCurrentTrackingTime(taskId);
                el.querySelector('.time-display').textContent = window.timeTracker.formatTime(time);
            }
        });
    }
}, 1000);

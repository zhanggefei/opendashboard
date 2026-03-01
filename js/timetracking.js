// 时间追踪模块

class TimeTracker {
    constructor() {
        this.trackingSessions = {}; // taskId -> session
        this.timeLogs = {}; // taskId -> logs[]
        this.load();
    }

    // 开始追踪
    startTracking(taskId) {
        if (this.trackingSessions[taskId]) {
            console.warn('任务已在追踪中');
            return false;
        }
        
        const session = {
            taskId,
            startTime: Date.now(),
            pauses: []
        };
        
        this.trackingSessions[taskId] = session;
        this.save();
        
        // 添加日志
        this.addTimeLog(taskId, 'start', session.startTime);
        
        return true;
    }

    // 暂停追踪
    pauseTracking(taskId) {
        const session = this.trackingSessions[taskId];
        if (!session) return false;
        
        const pauseTime = Date.now();
        session.pauses.push({
            start: pauseTime
        });
        
        // 添加日志
        this.addTimeLog(taskId, 'pause', pauseTime);
        
        this.save();
        return true;
    }

    // 恢复追踪
    resumeTracking(taskId) {
        const session = this.trackingSessions[taskId];
        if (!session) return false;
        
        const lastPause = session.pauses[session.pauses.length - 1];
        if (!lastPause || lastPause.end) return false;
        
        lastPause.end = Date.now();
        
        // 添加日志
        this.addTimeLog(taskId, 'resume', Date.now());
        
        this.save();
        return true;
    }

    // 停止追踪
    stopTracking(taskId) {
        const session = this.trackingSessions[taskId];
        if (!session) return null;
        
        const endTime = Date.now();
        const totalTime = this.calculateSessionTime(session, endTime);
        
        // 保存时间记录
        if (!this.timeLogs[taskId]) {
            this.timeLogs[taskId] = [];
        }
        
        this.timeLogs[taskId].push({
            id: `tl_${Date.now()}`,
            startTime: session.startTime,
            endTime: endTime,
            totalTime: totalTime,
            pauses: session.pauses.length
        });
        
        // 删除会话
        delete this.trackingSessions[taskId];
        
        // 添加日志
        this.addTimeLog(taskId, 'stop', endTime, totalTime);
        
        this.save();
        
        return {
            taskId,
            totalTime,
            formattedTime: this.formatTime(totalTime)
        };
    }

    // 计算会话时间
    calculateSessionTime(session, endTime = Date.now()) {
        let total = endTime - session.startTime;
        
        // 减去暂停时间
        session.pauses.forEach(pause => {
            if (pause.end) {
                total -= (pause.end - pause.start);
            } else {
                // 当前暂停中，减去从暂停开始到现在的时间
                total -= (Date.now() - pause.start);
            }
        });
        
        return Math.max(0, total);
    }

    // 获取当前追踪时间
    getCurrentTrackingTime(taskId) {
        const session = this.trackingSessions[taskId];
        if (!session) return 0;
        
        return this.calculateSessionTime(session);
    }

    // 获取任务总时间
    getTotalTime(taskId) {
        const logs = this.timeLogs[taskId] || [];
        const current = this.getCurrentTrackingTime(taskId);
        
        const loggedTime = logs.reduce((sum, log) => sum + log.totalTime, 0);
        
        return loggedTime + current;
    }

    // 获取所有任务时间统计
    getAllTimeStats() {
        const stats = {};
        
        // 已记录的时间
        Object.entries(this.timeLogs).forEach(([taskId, logs]) => {
            if (!stats[taskId]) {
                stats[taskId] = {
                    totalTime: 0,
                    sessions: 0,
                    averageSession: 0
                };
            }
            
            const total = logs.reduce((sum, log) => sum + log.totalTime, 0);
            stats[taskId].totalTime = total;
            stats[taskId].sessions = logs.length;
            stats[taskId].averageSession = logs.length > 0 ? Math.round(total / logs.length) : 0;
        });
        
        // 当前正在追踪的
        Object.entries(this.trackingSessions).forEach(([taskId, session]) => {
            if (!stats[taskId]) {
                stats[taskId] = {
                    totalTime: 0,
                    sessions: 0,
                    averageSession: 0,
                    tracking: true
                };
            }
            stats[taskId].tracking = true;
            stats[taskId].currentSession = this.getCurrentTrackingTime(taskId);
        });
        
        return stats;
    }

    // 添加时间日志
    addTimeLog(taskId, action, timestamp, extraData = null) {
        if (!this.timeLogs[taskId]) {
            this.timeLogs[taskId] = [];
        }
        
        this.timeLogs[taskId].push({
            id: `log_${Date.now()}`,
            action,
            timestamp,
            ...extraData
        });
    }

    // 格式化时间
    formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}小时 ${minutes % 60}分钟`;
        } else if (minutes > 0) {
            return `${minutes}分钟 ${seconds % 60}秒`;
        } else {
            return `${seconds}秒`;
        }
    }

    // 获取时间日志
    getTimeLogs(taskId) {
        return this.timeLogs[taskId] || [];
    }

    // 保存
    save() {
        localStorage.setItem('timeTrackingSessions', JSON.stringify(this.trackingSessions));
        localStorage.setItem('timeLogs', JSON.stringify(this.timeLogs));
    }

    // 加载
    load() {
        try {
            this.trackingSessions = JSON.parse(localStorage.getItem('timeTrackingSessions')) || {};
            this.timeLogs = JSON.parse(localStorage.getItem('timeLogs')) || {};
        } catch (e) {
            console.error('加载时间追踪失败:', e);
        }
    }
}

// 渲染时间追踪 UI
function renderTimeTracker(taskId) {
    const isTracking = !!window.timeTracker?.trackingSessions?.[taskId];
    const currentTime = window.timeTracker?.getCurrentTrackingTime(taskId) || 0;
    const totalTime = window.timeTracker?.getTotalTime(taskId) || 0;
    
    return `
        <div class="time-tracker" data-task-id="${taskId}">
            <div class="time-display">
                <span class="current-time" id="currentTime-${taskId}">
                    ${isTracking ? window.timeTracker.formatTime(currentTime) : '0 秒'}
                </span>
                <span class="total-time">总计：${window.timeTracker.formatTime(totalTime)}</span>
            </div>
            <div class="time-actions">
                ${isTracking ? `
                    <button class="btn-pause" onclick="pauseTracking('${taskId}')">⏸️ 暂停</button>
                    <button class="btn-stop" onclick="stopTracking('${taskId}')">⏹️ 停止</button>
                ` : `
                    <button class="btn-start" onclick="startTracking('${taskId}')">▶️ 开始追踪</button>
                `}
            </div>
        </div>
    `;
}

// 开始追踪
function startTracking(taskId) {
    window.timeTracker?.startTracking(taskId);
    refreshTimeTracker(taskId);
}

// 暂停追踪
function pauseTracking(taskId) {
    window.timeTracker?.pauseTracking(taskId);
    refreshTimeTracker(taskId);
}

// 恢复追踪
function resumeTracking(taskId) {
    window.timeTracker?.resumeTracking(taskId);
    refreshTimeTracker(taskId);
}

// 停止追踪
function stopTracking(taskId) {
    const result = window.timeTracker?.stopTracking(taskId);
    if (result) {
        alert(`时间追踪已停止\n本次耗时：${result.formattedTime}`);
    }
    refreshTimeTracker(taskId);
}

// 刷新时间追踪显示
function refreshTimeTracker(taskId) {
    const container = document.querySelector(`.time-tracker[data-task-id="${taskId}"]`);
    if (container) {
        container.outerHTML = renderTimeTracker(taskId);
    }
}

// 更新所有追踪中的任务
function updateAllTrackers() {
    if (!window.timeTracker) return;
    
    Object.keys(window.timeTracker.trackingSessions).forEach(taskId => {
        refreshTimeTracker(taskId);
    });
}

// 显示时间统计模态框
function showTimeStatsModal() {
    const stats = window.timeTracker?.getAllTimeStats() || {};
    const taskIds = Object.keys(stats);
    
    const modal = document.createElement('div');
    modal.className = 'modal time-stats-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>⏱️ 时间统计报表</h3>
                <button class="modal-close" onclick="this.closest('.modal').remove()">✕</button>
            </div>
            <div class="modal-body">
                ${taskIds.length === 0 ? 
                    '<div class="empty-state">暂无时间记录</div>' : 
                    `<div class="time-stats-list">
                        ${taskIds.map(id => {
                            const taskStats = stats[id];
                            const task = window.tasksData?.tasks?.find(t => t.id === id);
                            return `
                                <div class="time-stat-item">
                                    <div class="stat-task-info">
                                        <strong>${id} - ${task?.title || '未知任务'}</strong>
                                        ${taskStats.tracking ? '<span class="tracking-badge">🔴 追踪中</span>' : ''}
                                    </div>
                                    <div class="stat-details">
                                        <span>总耗时：${window.timeTracker.formatTime(taskStats.totalTime)}</span>
                                        <span>会话数：${taskStats.sessions}</span>
                                        <span>平均：${window.timeTracker.formatTime(taskStats.averageSession)}</span>
                                        ${taskStats.tracking && taskStats.currentSession ? 
                                            `<span>当前：${window.timeTracker.formatTime(taskStats.currentSession)}</span>` : ''}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>`
                }
                
                <div class="time-stats-summary">
                    <h4>总体统计</h4>
                    ${calculateOverallStats(stats)}
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// 计算总体统计
function calculateOverallStats(stats) {
    const taskIds = Object.keys(stats);
    if (taskIds.length === 0) return '<p>暂无数据</p>';
    
    const totalTime = taskIds.reduce((sum, id) => sum + stats[id].totalTime, 0);
    const totalSessions = taskIds.reduce((sum, id) => sum + stats[id].sessions, 0);
    const trackingCount = taskIds.filter(id => stats[id].tracking).length;
    
    return `
        <div class="summary-grid">
            <div class="summary-item">
                <span class="summary-label">总耗时</span>
                <span class="summary-value">${window.timeTracker.formatTime(totalTime)}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">总 sessions</span>
                <span class="summary-value">${totalSessions}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">追踪中</span>
                <span class="summary-value">${trackingCount} 个任务</span>
            </div>
        </div>
    `;
}

// 全局实例
window.TimeTracker = TimeTracker;
window.renderTimeTracker = renderTimeTracker;
window.startTracking = startTracking;
window.pauseTracking = pauseTracking;
window.resumeTracking = resumeTracking;
window.stopTracking = stopTracking;
window.refreshTimeTracker = refreshTimeTracker;
window.updateAllTrackers = updateAllTrackers;
window.showTimeStatsModal = showTimeStatsModal;

// 每秒更新追踪中的任务
setInterval(() => {
    if (window.timeTracker) {
        updateAllTrackers();
    }
}, 1000);

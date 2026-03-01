// 数据可视化报表模块

class DashboardAnalytics {
    constructor() {
        this.tasks = [];
    }

    // 获取任务总数
    getTotalTasks() {
        return this.tasks.length;
    }

    // 按状态统计
    getStatusDistribution() {
        const stats = { todo: 0, progress: 0, blocked: 0, done: 0 };
        this.tasks.forEach(task => {
            if (stats[task.status] !== undefined) {
                stats[task.status]++;
            }
        });
        return stats;
    }

    // 按优先级统计
    getPriorityDistribution() {
        const stats = { P0: 0, P1: 0, P2: 0 };
        this.tasks.forEach(task => {
            if (stats[task.priority] !== undefined) {
                stats[task.priority]++;
            }
        });
        return stats;
    }

    // 按负责人统计
    getAssigneeDistribution() {
        const stats = {};
        this.tasks.forEach(task => {
            const assignee = task.assignee || '未分配';
            if (!stats[assignee]) {
                stats[assignee] = 0;
            }
            stats[assignee]++;
        });
        return stats;
    }

    // 任务完成率
    getCompletionRate() {
        if (this.tasks.length === 0) return 0;
        const done = this.tasks.filter(t => t.status === 'done').length;
        return Math.round((done / this.tasks.length) * 100);
    }

    // 按时完成率
    getOnTimeRate() {
        const withDeadline = this.tasks.filter(t => t.deadline);
        if (withDeadline.length === 0) return 100;
        
        const onTime = withDeadline.filter(t => {
            if (t.status !== 'done') return true;
            return new Date(t.completedTime) <= new Date(t.deadline);
        }).length;
        
        return Math.round((onTime / withDeadline.length) * 100);
    }

    // 平均完成时间
    getAverageCompletionTime() {
        const completed = this.tasks.filter(t => 
            t.status === 'done' && t.startTime && t.completedTime
        );
        
        if (completed.length === 0) return 'N/A';
        
        const totalMinutes = completed.reduce((sum, task) => {
            const start = new Date(task.startTime);
            const end = new Date(task.completedTime);
            return sum + (end - start) / (1000 * 60);
        }, 0);
        
        const avg = Math.round(totalMinutes / completed.length);
        
        if (avg < 60) return `${avg} 分钟`;
        return `${Math.round(avg / 60)} 小时 ${avg % 60} 分钟`;
    }

    // 任务趋势（按天统计）
    getTaskTrend() {
        const trend = {};
        this.tasks.forEach(task => {
            const date = new Date(task.startTime || task.createdTime).toLocaleDateString('zh-CN');
            if (!trend[date]) {
                trend[date] = { created: 0, completed: 0 };
            }
            trend[date].created++;
            if (task.status === 'done' && task.completedTime) {
                const completedDate = new Date(task.completedTime).toLocaleDateString('zh-CN');
                if (!trend[completedDate]) {
                    trend[completedDate] = { created: 0, completed: 0 };
                }
                trend[completedDate].completed++;
            }
        });
        return trend;
    }

    // 阻塞原因分析
    getBlockedReasons() {
        const reasons = {};
        this.tasks.filter(t => t.status === 'blocked').forEach(task => {
            const reason = task.lastError || '未知原因';
            if (!reasons[reason]) {
                reasons[reason] = 0;
            }
            reasons[reason]++;
        });
        return reasons;
    }

    // 重试次数统计
    getRetryStats() {
        const stats = { noRetry: 0, oneRetry: 0, multipleRetries: 0 };
        this.tasks.forEach(task => {
            const count = task.retryCount || 0;
            if (count === 0) stats.noRetry++;
            else if (count === 1) stats.oneRetry++;
            else stats.multipleRetries++;
        });
        return stats;
    }
}

// 渲染统计卡片
function renderAnalyticsCards() {
    if (!window.analyticsManager) return;
    
    const html = `
        <div class="analytics-section">
            <div class="analytics-grid">
                <div class="analytics-card">
                    <div class="analytics-icon">📊</div>
                    <div class="analytics-value">${window.analyticsManager.getTotalTasks()}</div>
                    <div class="analytics-label">总任务数</div>
                </div>
                <div class="analytics-card">
                    <div class="analytics-icon">✅</div>
                    <div class="analytics-value">${window.analyticsManager.getCompletionRate()}%</div>
                    <div class="analytics-label">完成率</div>
                </div>
                <div class="analytics-card">
                    <div class="analytics-icon">⏱️</div>
                    <div class="analytics-value">${window.analyticsManager.getAverageCompletionTime()}</div>
                    <div class="analytics-label">平均完成时间</div>
                </div>
                <div class="analytics-card">
                    <div class="analytics-icon">🎯</div>
                    <div class="analytics-value">${window.analyticsManager.getOnTimeRate()}%</div>
                    <div class="analytics-label">按时完成率</div>
                </div>
            </div>
        </div>
    `;
    
    const container = document.getElementById('analyticsContainer');
    if (container) {
        container.innerHTML = html;
    }
}

// 渲染图表
function renderCharts() {
    if (!window.analyticsManager) return;
    
    // 状态分布
    const statusStats = window.analyticsManager.getStatusDistribution();
    renderPieChart('statusChart', statusStats, '任务状态分布');
    
    // 优先级分布
    const priorityStats = window.analyticsManager.getPriorityDistribution();
    renderBarChart('priorityChart', priorityStats, '任务优先级分布');
    
    // 负责人分布
    const assigneeStats = window.analyticsManager.getAssigneeDistribution();
    renderBarChart('assigneeChart', assigneeStats, '任务负责人分布');
}

// 渲染饼图（简化版）
function renderPieChart(containerId, data, title) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const total = Object.values(data).reduce((a, b) => a + b, 0);
    if (total === 0) {
        container.innerHTML = '<div class="empty-state">暂无数据</div>';
        return;
    }
    
    const colors = {
        todo: '#f59e0b',
        progress: '#3b82f6',
        blocked: '#ef4444',
        done: '#10b981',
        P0: '#dc2626',
        P1: '#d97706',
        P2: '#2563eb'
    };
    
    let html = `<div class="chart-container"><h4>${title}</h4><div class="pie-chart">`;
    
    Object.entries(data).forEach(([key, value]) => {
        const percentage = Math.round((value / total) * 100);
        const color = colors[key] || '#667eea';
        html += `
            <div class="pie-segment" style="background: ${color}">
                <span>${key}</span>
                <span>${percentage}%</span>
            </div>`;
    });
    
    html += '</div></div>';
    container.innerHTML = html;
}

// 渲染柱状图（简化版）
function renderBarChart(containerId, data, title) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const maxValue = Math.max(...Object.values(data), 1);
    
    let html = `<div class="chart-container"><h4>${title}</h4><div class="bar-chart">`;
    
    Object.entries(data).forEach(([key, value]) => {
        const height = Math.round((value / maxValue) * 100);
        html += `
            <div class="bar-item">
                <div class="bar" style="height: ${height}%">
                    <span class="bar-value">${value}</span>
                </div>
                <div class="bar-label">${key}</div>
            </div>`;
    });
    
    html += '</div></div>';
    container.innerHTML = html;
}

// 显示报表模态框
function showAnalyticsModal() {
    const modal = document.createElement('div');
    modal.className = 'modal analytics-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>📊 数据可视化报表</h3>
                <button class="modal-close" onclick="this.closest('.modal').remove()">✕</button>
            </div>
            <div class="modal-body">
                ${renderAnalyticsCards()}
                
                <div class="charts-grid">
                    <div id="statusChart" class="chart-wrapper"></div>
                    <div id="priorityChart" class="chart-wrapper"></div>
                    <div id="assigneeChart" class="chart-wrapper"></div>
                </div>
                
                <div class="export-actions">
                    <button onclick="exportToCSV()">📥 导出 CSV</button>
                    <button onclick="exportToPDF()">📄 导出 PDF</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 延迟渲染图表
    setTimeout(() => {
        renderCharts();
    }, 100);
}

// 导出 CSV
function exportToCSV() {
    if (!window.tasksData || !window.tasksData.tasks) return;
    
    const headers = ['ID', '标题', '优先级', '状态', '进度', '负责人', '开始时间', '完成时间'];
    const rows = window.tasksData.tasks.map(task => [
        task.id,
        task.title,
        task.priority,
        task.status,
        task.progress,
        task.assignee || '',
        task.startTime || '',
        task.completedTime || ''
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `tasks_${new Date().toLocaleDateString('zh-CN')}.csv`;
    link.click();
}

// 导出 PDF（简化版，实际应用中需要 pdf 库）
function exportToPDF() {
    alert('PDF 导出功能需要集成 pdfmake 或 jsPDF 库\n\n当前可导出 CSV 格式');
}

// 全局实例
window.DashboardAnalytics = DashboardAnalytics;
window.renderAnalyticsCards = renderAnalyticsCards;
window.showAnalyticsModal = showAnalyticsModal;
window.exportToCSV = exportToCSV;
window.exportToPDF = exportToPDF;

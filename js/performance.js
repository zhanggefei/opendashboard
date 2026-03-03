/**
 * 性能监控模块
 * 功能点 53: 性能监控面板 - 监控任务加载、渲染、API 调用等性能指标
 */

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            pageLoadTime: 0,
            taskRenderTime: 0,
            apiCallTime: 0,
            totalTasks: 0,
            memoryUsage: 0
        };
        this.startTime = performance.now();
        this.init();
    }

    init() {
        // 记录页面加载开始时间
        this.pageStartTime = performance.now();
        
        // 监听页面加载完成
        window.addEventListener('load', () => {
            this.metrics.pageLoadTime = performance.now() - this.pageStartTime;
            this.updateDisplay();
        });

        // 定期更新内存使用
        setInterval(() => {
            this.updateMemoryUsage();
        }, 5000);
    }

    // 开始任务渲染计时
    startRender() {
        this.renderStartTime = performance.now();
    }

    // 结束任务渲染计时
    endRender(taskCount) {
        this.metrics.taskRenderTime = performance.now() - this.renderStartTime;
        this.metrics.totalTasks = taskCount;
        this.updateDisplay();
    }

    // 开始 API 调用计时
    startAPICall() {
        this.apiStartTime = performance.now();
    }

    // 结束 API 调用计时
    endAPICall() {
        this.metrics.apiCallTime = performance.now() - this.apiStartTime;
        this.updateDisplay();
    }

    // 更新内存使用
    updateMemoryUsage() {
        if (performance.memory) {
            this.metrics.memoryUsage = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
            this.updateDisplay();
        }
    }

    // 更新显示
    updateDisplay() {
        const perfPanel = document.getElementById('performancePanel');
        if (!perfPanel) return;

        const html = `
            <div class="perf-metric">
                <span class="perf-label">页面加载:</span>
                <span class="perf-value ${this.getMetricClass(this.metrics.pageLoadTime, 1000)}">${this.metrics.pageLoadTime.toFixed(0)}ms</span>
            </div>
            <div class="perf-metric">
                <span class="perf-label">渲染耗时:</span>
                <span class="perf-value ${this.getMetricClass(this.metrics.taskRenderTime, 500)}">${this.metrics.taskRenderTime.toFixed(0)}ms</span>
            </div>
            <div class="perf-metric">
                <span class="perf-label">API 耗时:</span>
                <span class="perf-value ${this.getMetricClass(this.metrics.apiCallTime, 1000)}">${this.metrics.apiCallTime.toFixed(0)}ms</span>
            </div>
            <div class="perf-metric">
                <span class="perf-label">任务数量:</span>
                <span class="perf-value">${this.metrics.totalTasks}</span>
            </div>
            <div class="perf-metric">
                <span class="perf-label">内存使用:</span>
                <span class="perf-value">${this.metrics.memoryUsage || 'N/A'}MB</span>
            </div>
        `;
        perfPanel.innerHTML = html;
    }

    // 获取指标样式类
    getMetricClass(value, threshold) {
        if (value === 0) return '';
        if (value < threshold) return 'perf-good';
        if (value < threshold * 2) return 'perf-warning';
        return 'perf-bad';
    }

    // 获取性能报告
    getReport() {
        return {
            timestamp: new Date().toISOString(),
            metrics: { ...this.metrics },
            performance: {
                navigation: performance.getEntriesByType('navigation')[0],
                resources: performance.getEntriesByType('resource').length
            }
        };
    }

    // 导出性能数据
    exportPerformanceData() {
        const report = this.getReport();
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `performance-report-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// 性能监控面板 HTML 片段
const performancePanelHTML = `
    <div class="performance-panel" id="performancePanel">
        <div class="panel-header">
            <h3>⚡ 性能监控</h3>
            <button class="btn-small" onclick="window.perfMonitor.exportPerformanceData()">导出数据</button>
        </div>
        <div class="perf-metrics"></div>
    </div>
`;

// 添加性能监控样式
const performanceStyles = `
    .performance-panel {
        background: var(--card-bg);
        border-radius: 8px;
        padding: 15px;
        margin: 20px 0;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .perf-metric {
        display: inline-block;
        margin-right: 20px;
        padding: 8px 12px;
        background: var(--bg-secondary);
        border-radius: 6px;
    }

    .perf-label {
        font-size: 12px;
        color: var(--text-secondary);
        margin-right: 5px;
    }

    .perf-value {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-primary);
    }

    .perf-good { color: #10b981; }
    .perf-warning { color: #f59e0b; }
    .perf-bad { color: #ef4444; }

    .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
    }

    .panel-header h3 {
        margin: 0;
        font-size: 16px;
    }

    .btn-small {
        padding: 4px 10px;
        font-size: 12px;
        border-radius: 4px;
        border: 1px solid var(--border-color);
        background: var(--bg-secondary);
        color: var(--text-primary);
        cursor: pointer;
    }

    .btn-small:hover {
        background: var(--primary-color);
        color: white;
    }
`;

// 注入样式
const styleSheet = document.createElement('style');
styleSheet.textContent = performanceStyles;
document.head.appendChild(styleSheet);

// 全局实例
window.perfMonitor = new PerformanceMonitor();

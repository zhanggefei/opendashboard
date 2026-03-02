// 数据导入导出增强 v2.0

class ImportExportManager {
    constructor() {
        this.importHistory = [];
        this.load();
    }
    
    load() {
        const saved = localStorage.getItem('opendashboard_importexport');
        if (saved) {
            const data = JSON.parse(saved);
            this.importHistory = data.importHistory || [];
        }
    }
    
    save() {
        localStorage.setItem('opendashboard_importexport', JSON.stringify({
            importHistory: this.importHistory
        }));
    }
    
    // 从 Excel/CSV 导入
    importFromFile(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const content = e.target.result;
            let tasks = [];
            
            if (file.name.endsWith('.csv')) {
                tasks = this.parseCSV(content);
            } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                // 简单 XLS 解析（实际项目中建议使用 xlsx 库）
                alert('Excel 文件需要使用 xlsx 库解析，当前仅支持 CSV 格式');
                return;
            } else {
                // 尝试 JSON
                try {
                    const json = JSON.parse(content);
                    tasks = json.tasks || json;
                } catch (err) {
                    alert('文件格式不支持，请使用 CSV 或 JSON 格式');
                    return;
                }
            }
            
            if (tasks.length === 0) {
                alert('文件中没有有效数据');
                return;
            }
            
            // 确认导入
            if (confirm(`发现 ${tasks.length} 个任务，确定要导入吗？`)) {
                this.processImport(tasks);
            }
        };
        
        reader.readAsText(file);
    }
    
    // 解析 CSV
    parseCSV(content) {
        const lines = content.split('\n').filter(line => line.trim());
        if (lines.length < 2) return [];
        
        // 解析表头
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        
        // 解析数据
        const tasks = [];
        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            if (values.length !== headers.length) continue;
            
            const task = {};
            headers.forEach((header, index) => {
                const key = header.toLowerCase().replace(/\s+/g, '');
                if (key === 'id') task.id = values[index];
                else if (key === 'title' || key === '标题') task.title = values[index];
                else if (key === 'priority' || key === '优先级') task.priority = values[index];
                else if (key === 'status' || key === '状态') task.status = values[index];
                else if (key === 'progress' || key === '进度') task.progress = parseInt(values[index]) || 0;
                else if (key === 'description' || key === '描述') task.description = values[index];
                else if (key === 'assignee' || key === '负责人') task.assignee = values[index];
                else if (key === 'estimatedtime' || key === '预计时间') task.estimatedTime = values[index];
            });
            
            if (task.title) {
                task.id = task.id || `T${String(window.tasks.length + tasks.length + 1).padStart(3, '0')}`;
                task.status = task.status || 'todo';
                task.priority = task.priority || 'P2';
                tasks.push(task);
            }
        }
        
        return tasks;
    }
    
    // 解析 CSV 行（处理引号）
    parseCSVLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        values.push(current.trim());
        return values;
    }
    
    // 处理导入
    processImport(tasks) {
        // 合并任务
        tasks.forEach(task => {
            // 避免 ID 冲突
            if (window.tasks.find(t => t.id === task.id)) {
                task.id = `T${String(Date.now()).slice(-6)}`;
            }
            
            // 添加默认值
            task.createdAt = task.createdAt || new Date().toLocaleString('zh-CN');
            task.retryCount = task.retryCount || 0;
            
            window.tasks.unshift(task);
        });
        
        // 记录导入历史
        this.importHistory.unshift({
            date: new Date().toISOString(),
            count: tasks.length,
            file: tasks[0]?.title || '批量导入'
        });
        
        this.save();
        window.saveTasks();
        window.applyFilters();
        
        alert(`✅ 成功导入 ${tasks.length} 个任务！`);
    }
    
    // 导出带图表的 HTML 报告
    exportHTMLReport() {
        const stats = {
            total: window.tasks.length,
            done: window.tasks.filter(t => t.status === 'done').length,
            progress: window.tasks.filter(t => t.status === 'progress').length,
            todo: window.tasks.filter(t => t.status === 'todo').length,
            blocked: window.tasks.filter(t => t.status === 'blocked').length
        };
        
        const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OpenDashboard 任务报告</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 40px; background: #f5f5f5; }
        .container { max-width: 1000px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        h1 { color: #667eea; border-bottom: 3px solid #667eea; padding-bottom: 15px; }
        .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 30px 0; }
        .stat-card { padding: 20px; border-radius: 10px; text-align: center; }
        .stat-card.done { background: #d1fae5; }
        .stat-card.progress { background: #dbeafe; }
        .stat-card.todo { background: #fef3c7; }
        .stat-card.blocked { background: #fee2e2; }
        .stat-number { font-size: 36px; font-weight: bold; margin-bottom: 5px; }
        .stat-label { color: #666; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin-top: 30px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        th { background: #667eea; color: white; }
        tr:hover { background: #f9fafb; }
        .badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; color: white; }
        .badge-p0 { background: #ef4444; }
        .badge-p1 { background: #f97316; }
        .badge-p2 { background: #3b82f6; }
        .status-done { color: #10b981; }
        .status-progress { color: #3b82f6; }
        .status-todo { color: #f59e0b; }
        .status-blocked { color: #ef4444; }
        .meta { color: #666; margin-bottom: 20px; }
        @media print { body { background: white; } .container { box-shadow: none; } }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎯 OpenDashboard 任务报告</h1>
        <div class="meta">
            <p>生成时间：${new Date().toLocaleString('zh-CN')}</p>
            <p>任务总数：${stats.total}</p>
        </div>
        
        <div class="stats">
            <div class="stat-card done">
                <div class="stat-number">${stats.done}</div>
                <div class="stat-label">✅ 已完成</div>
            </div>
            <div class="stat-card progress">
                <div class="stat-number">${stats.progress}</div>
                <div class="stat-label">🔄 进行中</div>
            </div>
            <div class="stat-card todo">
                <div class="stat-number">${stats.todo}</div>
                <div class="stat-label">🆕 待办</div>
            </div>
            <div class="stat-card blocked">
                <div class="stat-number">${stats.blocked}</div>
                <div class="stat-label">⏸️ 阻塞</div>
            </div>
        </div>
        
        <h2>任务列表</h2>
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>标题</th>
                    <th>优先级</th>
                    <th>状态</th>
                    <th>进度</th>
                    <th>负责人</th>
                </tr>
            </thead>
            <tbody>
                ${window.tasks.map(task => `
                    <tr>
                        <td>${task.id}</td>
                        <td>${task.title}</td>
                        <td><span class="badge badge-${task.priority.toLowerCase()}">${task.priority}</span></td>
                        <td class="status-${task.status}">${task.status}</td>
                        <td>${task.progress || 0}%</td>
                        <td>${task.assignee || '-'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    <script>window.onload = function() { if (window.location.search.includes('print')) window.print(); }</script>
</body>
</html>
        `;
        
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `opendashboard-report-${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert('✅ 报告已导出！打开后可点击"打印"保存为 PDF');
    }
    
    // 显示导入历史
    showImportHistory() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3>📥 导入历史</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">✕</button>
                </div>
                <div class="modal-body">
                    ${this.importHistory.length === 0 ? '<p class="empty-state">暂无导入记录</p>' : ''}
                    ${this.importHistory.map(record => `
                        <div class="import-history-item">
                            <span>${new Date(record.date).toLocaleString('zh-CN')}</span>
                            <span>导入 ${record.count} 个任务</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
}

// 全局注册
window.ImportExportManager = ImportExportManager;

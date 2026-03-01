// 任务依赖管理模块

class TaskDependencyManager {
    constructor() {
        this.tasks = [];
    }

    // 设置任务依赖
    setDependency(taskId, dependsOn) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return false;
        
        if (!task.dependencies) {
            task.dependencies = [];
        }
        
        // 避免循环依赖
        if (this.hasCircularDependency(taskId, dependsOn)) {
            console.error('❌ 检测到循环依赖');
            return false;
        }
        
        if (!task.dependencies.includes(dependsOn)) {
            task.dependencies.push(dependsOn);
        }
        
        // 检查依赖是否已完成
        this.checkDependencies(taskId);
        
        return true;
    }

    // 移除依赖
    removeDependency(taskId, dependsOn) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task || !task.dependencies) return false;
        
        task.dependencies = task.dependencies.filter(id => id !== dependsOn);
        return true;
    }

    // 检查循环依赖
    hasCircularDependency(taskId, dependsOn) {
        if (taskId === dependsOn) return true;
        
        const dependsOnTask = this.tasks.find(t => t.id === dependsOn);
        if (!dependsOnTask || !dependsOnTask.dependencies) return false;
        
        for (const depId of dependsOnTask.dependencies) {
            if (this.hasCircularDependency(taskId, depId)) {
                return true;
            }
        }
        
        return false;
    }

    // 检查依赖是否完成
    checkDependencies(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task || !task.dependencies) return true;
        
        const allCompleted = task.dependencies.every(depId => {
            const depTask = this.tasks.find(t => t.id === depId);
            return depTask && depTask.status === 'done';
        });
        
        if (!allCompleted && task.status === 'todo') {
            task.blockedByDependencies = true;
        } else {
            task.blockedByDependencies = false;
        }
        
        return allCompleted;
    }

    // 获取依赖状态
    getDependencyStatus(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task || !task.dependencies) {
            return {
                hasDependencies: false,
                allCompleted: true,
                pending: [],
                completed: []
            };
        }
        
        const pending = [];
        const completed = [];
        
        task.dependencies.forEach(depId => {
            const depTask = this.tasks.find(t => t.id === depId);
            if (depTask) {
                if (depTask.status === 'done') {
                    completed.push(depTask);
                } else {
                    pending.push(depTask);
                }
            }
        });
        
        return {
            hasDependencies: true,
            allCompleted: pending.length === 0,
            pending,
            completed
        };
    }

    // 获取依赖此任务的所有任务
    getDependentTasks(taskId) {
        return this.tasks.filter(task => 
            task.dependencies && task.dependencies.includes(taskId)
        );
    }

    // 更新依赖状态（当任务完成时）
    onTaskComplete(taskId) {
        const dependentTasks = this.getDependentTasks(taskId);
        
        dependentTasks.forEach(task => {
            this.checkDependencies(task.id);
        });
        
        return dependentTasks.map(t => t.id);
    }
}

// 全局实例
window.TaskDependencyManager = TaskDependencyManager;

// 依赖关系可视化
function renderDependencyGraph(taskId) {
    const task = window.tasksData?.tasks?.find(t => t.id === taskId);
    if (!task || !task.dependencies) {
        return '<div class="empty-state">无依赖关系</div>';
    }
    
    const status = window.dependencyManager?.getDependencyStatus(taskId);
    if (!status) return '';
    
    let html = '<div class="dependency-graph">';
    
    // 依赖的任务
    if (status.pending.length > 0) {
        html += '<div class="dependency-section">';
        html += '<h4>⏳ 等待以下任务完成:</h4>';
        status.pending.forEach(dep => {
            html += `
            <div class="dependency-item pending">
                <span class="dependency-task">${dep.id} - ${dep.title}</span>
                <span class="dependency-status status-${dep.status}">${getStatusLabel(dep.status)}</span>
            </div>`;
        });
        html += '</div>';
    }
    
    // 已完成依赖
    if (status.completed.length > 0) {
        html += '<div class="dependency-section">';
        html += '<h4>✅ 已完成依赖:</h4>';
        status.completed.forEach(dep => {
            html += `
            <div class="dependency-item completed">
                <span class="dependency-task">${dep.id} - ${dep.title}</span>
                <span class="dependency-status status-done">✅ 已完成</span>
            </div>`;
        });
        html += '</div>';
    }
    
    html += '</div>';
    return html;
}

// 获取状态标签
function getStatusLabel(status) {
    const labels = {
        todo: '🆕 待办',
        progress: '🔄 进行中',
        blocked: '⏸️ 阻塞',
        done: '✅ 已完成'
    };
    return labels[status] || status;
}

// 设置依赖关系 UI
function showDependencyModal(taskId) {
    const task = window.tasksData?.tasks?.find(t => t.id === taskId);
    if (!task) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal dependency-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>🔗 设置任务依赖 - ${task.id}</h3>
                <button class="modal-close" onclick="this.closest('.modal').remove()">✕</button>
            </div>
            <div class="modal-body">
                <div class="dependency-selector">
                    <label>此任务依赖于:</label>
                    <select id="dependencySelect">
                        <option value="">选择前置任务...</option>
                        ${window.tasksData.tasks
                            .filter(t => t.id !== taskId && t.status !== 'done')
                            .map(t => `<option value="${t.id}">${t.id} - ${t.title}</option>`)
                            .join('')}
                    </select>
                    <button class="btn-primary" onclick="addDependency('${task.id}')">添加依赖</button>
                </div>
                
                <div class="current-dependencies">
                    <h4>当前依赖:</h4>
                    ${renderDependencyGraph(taskId)}
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// 添加依赖
function addDependency(taskId) {
    const select = document.getElementById('dependencySelect');
    const dependsOn = select.value;
    
    if (!dependsOn) {
        alert('请选择前置任务');
        return;
    }
    
    const success = window.dependencyManager?.setDependency(taskId, dependsOn);
    if (success) {
        alert('依赖关系已设置');
        // 重新渲染
        const modal = document.querySelector('.dependency-modal');
        if (modal) {
            modal.remove();
            showDependencyModal(taskId);
        }
    } else {
        alert('无法设置依赖关系（可能存在循环依赖）');
    }
}

// 移除依赖
function removeDependency(taskId, dependsOn) {
    window.dependencyManager?.removeDependency(taskId, dependsOn);
    // 重新渲染
    const modal = document.querySelector('.dependency-modal');
    if (modal) {
        modal.remove();
        showDependencyModal(taskId);
    }
}

// 任务依赖关系管理 v1.0

class TaskDependencyManager {
    constructor() {
        this.dependencies = [];
        this.load();
    }
    
    load() {
        const saved = localStorage.getItem('opendashboard_dependencies');
        if (saved) {
            this.dependencies = JSON.parse(saved);
        }
    }
    
    save() {
        localStorage.setItem('opendashboard_dependencies', JSON.stringify(this.dependencies));
    }
    
    // 添加依赖
    addDependency(taskId, dependsOn) {
        this.dependencies.push({
            taskId: taskId,
            dependsOn: dependsOn,
            createdAt: new Date().toISOString()
        });
        this.save();
    }
    
    // 获取任务的所有依赖
    getDependencies(taskId) {
        return this.dependencies.filter(d => d.taskId === taskId);
    }
    
    // 获取依赖此任务的所有任务
    getDependents(taskId) {
        return this.dependencies.filter(d => d.dependsOn === taskId);
    }
    
    // 移除依赖
    removeDependency(taskId, dependsOn) {
        this.dependencies = this.dependencies.filter(
            d => !(d.taskId === taskId && d.dependsOn === dependsOn)
        );
        this.save();
    }
    
    // 检查依赖是否都已完成
    areDependenciesMet(taskId) {
        const deps = this.getDependencies(taskId);
        return deps.every(dep => {
            const task = window.tasks?.find(t => t.id === dep.dependsOn);
            return task && task.status === 'done';
        });
    }
    
    // 显示依赖模态框
    showDependencyModal(taskId) {
        const task = window.tasks?.find(t => t.id === taskId);
        if (!task) return;
        
        const deps = this.getDependencies(taskId);
        const dependents = this.getDependents(taskId);
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h3>🔗 任务依赖关系 - ${task.id}</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">✕</button>
                </div>
                <div class="modal-body">
                    <div class="dependency-section">
                        <h4>⬅️ 依赖于 (前置任务)</h4>
                        <div class="dependency-list">
                            ${deps.length === 0 ? '<p class="empty-state">无前置依赖</p>' : ''}
                            ${deps.map(dep => {
                                const depTask = window.tasks?.find(t => t.id === dep.dependsOn);
                                return `
                                    <div class="dependency-item ${depTask?.status === 'done' ? 'completed' : 'pending'}">
                                        <span class="dependency-task">${dep.dependsOn} - ${depTask?.title || '未知'}</span>
                                        <span class="dependency-status">${depTask?.status === 'done' ? '✅ 已完成' : '⏳ 待完成'}</span>
                                        <button class="btn-remove" onclick="window.dependencyManager.removeDependency('${taskId}', '${dep.dependsOn}'); window.dependencyManager.showDependencyModal('${taskId}');">删除</button>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                        <div class="dependency-add">
                            <select id="addDependencySelect">
                                <option value="">选择前置任务...</option>
                                ${window.tasks?.filter(t => t.id !== taskId).map(t => `
                                    <option value="${t.id}">${t.id} - ${t.title}</option>
                                `).join('')}
                            </select>
                            <button class="btn-primary" onclick="window.dependencyManager.addDependencyFromSelect('${taskId}')">添加依赖</button>
                        </div>
                    </div>
                    
                    <div class="dependency-section">
                        <h4>➡️ 被依赖 (后续任务)</h4>
                        <div class="dependency-list">
                            ${dependents.length === 0 ? '<p class="empty-state">无后续依赖</p>' : ''}
                            ${dependents.map(dep => {
                                const depTask = window.tasks?.find(t => t.id === dep.taskId);
                                return `
                                    <div class="dependency-item">
                                        <span class="dependency-task">${dep.taskId} - ${depTask?.title || '未知'}</span>
                                        <span class="dependency-status">等待此任务</span>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    addDependencyFromSelect(taskId) {
        const select = document.getElementById('addDependencySelect');
        const dependsOn = select.value;
        if (!dependsOn) {
            alert('请选择前置任务');
            return;
        }
        
        this.addDependency(taskId, dependsOn);
        this.showDependencyModal(taskId);
    }
}

// 全局注册
window.TaskDependencyManager = TaskDependencyManager;

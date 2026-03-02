// 批量操作增强 v1.0

class BulkOperationsManager {
    constructor() {
        this.selectedTasks = new Set();
    }
    
    // 选择任务
    selectTask(taskId) {
        if (this.selectedTasks.has(taskId)) {
            this.selectedTasks.delete(taskId);
        } else {
            this.selectedTasks.add(taskId);
        }
        this.updateBatchActionsUI();
    }
    
    // 全选当前筛选的任务
    selectAll(filteredTasks) {
        filteredTasks.forEach(task => this.selectedTasks.add(task.id));
        this.updateBatchActionsUI();
    }
    
    // 取消全选
    clearSelection() {
        this.selectedTasks.clear();
        this.updateBatchActionsUI();
    }
    
    // 更新批量操作栏 UI
    updateBatchActionsUI() {
        const batchBar = document.getElementById('batchActions');
        const countLabel = document.getElementById('selectedCount');
        
        if (!batchBar || !countLabel) return;
        
        if (this.selectedTasks.size > 0) {
            batchBar.style.display = 'flex';
            countLabel.textContent = `已选择 ${this.selectedTasks.size} 个任务`;
        } else {
            batchBar.style.display = 'none';
        }
    }
    
    // 批量更新状态
    batchUpdateStatus(newStatus) {
        if (this.selectedTasks.size === 0) {
            alert('请先选择任务');
            return;
        }
        
        const confirmMsg = `确定将选中的 ${this.selectedTasks.size} 个任务设为${newStatus}吗？`;
        if (!confirm(confirmMsg)) return;
        
        window.tasks.forEach(task => {
            if (this.selectedTasks.has(task.id)) {
                task.status = newStatus;
                if (newStatus === 'done') {
                    task.completedTime = new Date().toLocaleString('zh-CN', {
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    task.progress = 100;
                }
            }
        });
        
        this.clearSelection();
        window.saveTasks();
        window.applyFilters();
    }
    
    // 批量更新优先级
    batchUpdatePriority(priority) {
        if (this.selectedTasks.size === 0) {
            alert('请先选择任务');
            return;
        }
        
        window.tasks.forEach(task => {
            if (this.selectedTasks.has(task.id)) {
                task.priority = priority;
            }
        });
        
        this.clearSelection();
        window.saveTasks();
        window.applyFilters();
    }
    
    // 批量分配负责人
    batchAssign(assignee) {
        if (this.selectedTasks.size === 0) {
            alert('请先选择任务');
            return;
        }
        
        window.tasks.forEach(task => {
            if (this.selectedTasks.has(task.id)) {
                task.assignee = assignee;
            }
        });
        
        this.clearSelection();
        window.saveTasks();
        window.applyFilters();
    }
    
    // 批量删除
    batchDelete() {
        if (this.selectedTasks.size === 0) {
            alert('请先选择任务');
            return;
        }
        
        const confirmMsg = `确定要删除选中的 ${this.selectedTasks.size} 个任务吗？此操作不可恢复！`;
        if (!confirm(confirmMsg)) return;
        
        window.tasks = window.tasks.filter(task => !this.selectedTasks.has(task.id));
        this.clearSelection();
        window.saveTasks();
        window.applyFilters();
    }
    
    // 批量编辑
    batchEdit() {
        if (this.selectedTasks.size === 0) {
            alert('请先选择任务');
            return;
        }
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3>✏️ 批量编辑 (${this.selectedTasks.size} 个任务)</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">✕</button>
                </div>
                <div class="modal-body">
                    <div class="bulk-edit-form">
                        <div class="form-group">
                            <label>更新状态</label>
                            <select id="bulkStatus" onchange="document.getElementById('bulkStatusBtn').disabled = !this.value">
                                <option value="">不更改</option>
                                <option value="todo">待办</option>
                                <option value="progress">进行中</option>
                                <option value="blocked">阻塞</option>
                                <option value="done">已完成</option>
                            </select>
                            <button id="bulkStatusBtn" class="btn-primary" disabled onclick="window.bulkOps.batchUpdateStatus(document.getElementById('bulkStatus').value); this.closest('.modal').remove();">应用</button>
                        </div>
                        
                        <div class="form-group">
                            <label>更新优先级</label>
                            <select id="bulkPriority" onchange="document.getElementById('bulkPriorityBtn').disabled = !this.value">
                                <option value="">不更改</option>
                                <option value="P0">P0 紧急重要</option>
                                <option value="P1">P1 重要</option>
                                <option value="P2">P2 普通</option>
                            </select>
                            <button id="bulkPriorityBtn" class="btn-primary" disabled onclick="window.bulkOps.batchUpdatePriority(document.getElementById('bulkPriority').value); this.closest('.modal').remove();">应用</button>
                        </div>
                        
                        <div class="form-group">
                            <label>分配负责人</label>
                            <select id="bulkAssignee" onchange="document.getElementById('bulkAssigneeBtn').disabled = !this.value">
                                <option value="">不更改</option>
                                ${[...new Set(window.tasks.map(t => t.assignee).filter(Boolean))].map(a => `<option value="${a}">${a}</option>`).join('')}
                            </select>
                            <button id="bulkAssigneeBtn" class="btn-primary" disabled onclick="window.bulkOps.batchAssign(document.getElementById('bulkAssignee').value); this.closest('.modal').remove();">应用</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    // 获取选中的任务
    getSelectedTasks() {
        return window.tasks.filter(task => this.selectedTasks.has(task.id));
    }
}

// 全局注册
window.bulkOps = new BulkOperationsManager();

// 子任务管理模块

class SubtaskManager {
    constructor() {
        this.subtasks = {}; // parentTaskId -> subtasks[]
    }

    // 创建子任务
    createSubtask(parentTaskId, subtask) {
        if (!this.subtasks[parentTaskId]) {
            this.subtasks[parentTaskId] = [];
        }
        
        const newSubtask = {
            id: `st_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            parentId: parentTaskId,
            title: subtask.title,
            description: subtask.description || '',
            status: 'todo',
            progress: 0,
            assignee: subtask.assignee || '',
            priority: subtask.priority || 'P2',
            createdTime: new Date().toISOString(),
            completedTime: null
        };
        
        this.subtasks[parentTaskId].push(newSubtask);
        this.updateParentProgress(parentTaskId);
        this.save();
        return newSubtask;
    }

    // 更新子任务
    updateSubtask(parentTaskId, subtaskId, updates) {
        const subtask = this.getSubtask(parentTaskId, subtaskId);
        if (!subtask) return false;
        
        Object.assign(subtask, updates);
        
        if (updates.status === 'done') {
            subtask.completedTime = new Date().toISOString();
            subtask.progress = 100;
        }
        
        this.updateParentProgress(parentTaskId);
        this.save();
        return true;
    }

    // 删除子任务
    deleteSubtask(parentTaskId, subtaskId) {
        if (!this.subtasks[parentTaskId]) return false;
        
        const index = this.subtasks[parentTaskId].findIndex(st => st.id === subtaskId);
        if (index === -1) return false;
        
        this.subtasks[parentTaskId].splice(index, 1);
        this.updateParentProgress(parentTaskId);
        this.save();
        return true;
    }

    // 获取子任务
    getSubtask(parentTaskId, subtaskId) {
        if (!this.subtasks[parentTaskId]) return null;
        return this.subtasks[parentTaskId].find(st => st.id === subtaskId);
    }

    // 获取所有子任务
    getSubtasks(parentTaskId) {
        return this.subtasks[parentTaskId] || [];
    }

    // 更新父任务进度
    updateParentProgress(parentTaskId) {
        const subtasks = this.subtasks[parentTaskId];
        if (!subtasks || subtasks.length === 0) return;
        
        const total = subtasks.length;
        const completed = subtasks.filter(st => st.status === 'done').length;
        const progress = Math.round((completed / total) * 100);
        
        // 更新主任务数据
        if (window.tasksData && window.tasksData.tasks) {
            const parentTask = window.tasksData.tasks.find(t => t.id === parentTaskId);
            if (parentTask) {
                parentTask.progress = progress;
                parentTask.subtaskCount = total;
                parentTask.subtaskCompleted = completed;
                
                // 如果所有子任务完成，自动设置父任务为完成
                if (completed === total && parentTask.status !== 'done') {
                    // 可选：自动完成父任务
                    // parentTask.status = 'done';
                    // parentTask.completedTime = new Date().toISOString();
                }
            }
        }
    }

    // 获取子任务统计
    getSubtaskStats(parentTaskId) {
        const subtasks = this.subtasks[parentTaskId] || [];
        return {
            total: subtasks.length,
            todo: subtasks.filter(st => st.status === 'todo').length,
            progress: subtasks.filter(st => st.status === 'progress').length,
            done: subtasks.filter(st => st.status === 'done').length,
            progressPercent: subtasks.length > 0 
                ? Math.round((subtasks.filter(st => st.status === 'done').length / subtasks.length) * 100)
                : 0
        };
    }

    // 保存
    save() {
        console.log('保存子任务数据...');
        localStorage.setItem('taskSubtasks', JSON.stringify(this.subtasks));
    }

    // 加载
    load() {
        try {
            this.subtasks = JSON.parse(localStorage.getItem('taskSubtasks')) || {};
        } catch (e) {
            console.error('加载子任务失败:', e);
        }
    }
}

// 渲染子任务列表
function renderSubtasks(parentTaskId) {
    const subtasks = window.subtaskManager?.getSubtasks(parentTaskId) || [];
    const stats = window.subtaskManager?.getSubtaskStats(parentTaskId);
    
    if (subtasks.length === 0) {
        return '<div class="empty-state">暂无子任务，点击"添加子任务"创建</div>';
    }
    
    let html = '<div class="subtasks-list">';
    
    subtasks.forEach(subtask => {
        html += `
        <div class="subtask-item subtask-${subtask.status}">
            <div class="subtask-checkbox">
                <input type="checkbox" 
                    ${subtask.status === 'done' ? 'checked' : ''} 
                    onchange="toggleSubtask('${parentTaskId}', '${subtask.id}')">
            </div>
            <div class="subtask-content">
                <div class="subtask-title">${subtask.title}</div>
                ${subtask.description ? `<div class="subtask-desc">${subtask.description}</div>` : ''}
                <div class="subtask-meta">
                    <span class="badge badge-${subtask.priority.toLowerCase()}">${subtask.priority}</span>
                    ${subtask.assignee ? `<span>👤 ${subtask.assignee}</span>` : ''}
                    <span class="subtask-status status-${subtask.status}">${getSubtaskStatusLabel(subtask.status)}</span>
                </div>
            </div>
            <div class="subtask-actions">
                <button onclick="editSubtask('${parentTaskId}', '${subtask.id}')">✏️</button>
                <button onclick="deleteSubtask('${parentTaskId}', '${subtask.id}')" class="delete-btn">🗑️</button>
            </div>
        </div>`;
    });
    
    html += '</div>';
    
    // 添加统计信息
    html += `
    <div class="subtask-stats">
        <div class="progress-bar">
            <div class="progress-fill" style="width: ${stats.progressPercent}%"></div>
        </div>
        <div class="stats-summary">
            总计：${stats.total} | 
            待办：${stats.todo} | 
            进行中：${stats.progress} | 
            已完成：${stats.done}
        </div>
    </div>`;
    
    return html;
}

// 获取子任务状态标签
function getSubtaskStatusLabel(status) {
    const labels = {
        todo: '🆕 待办',
        progress: '🔄 进行中',
        done: '✅ 已完成'
    };
    return labels[status] || status;
}

// 切换子任务状态
function toggleSubtask(parentTaskId, subtaskId) {
    const subtask = window.subtaskManager?.getSubtask(parentTaskId, subtaskId);
    if (!subtask) return;
    
    const newStatus = subtask.status === 'done' ? 'todo' : 'done';
    window.subtaskManager?.updateSubtask(parentTaskId, subtaskId, { status: newStatus });
    
    // 重新渲染
    const modal = document.querySelector('.subtasks-modal');
    if (modal) {
        modal.remove();
        showSubtasksModal(parentTaskId);
    }
}

// 显示子任务模态框
function showSubtasksModal(parentTaskId) {
    const task = window.tasksData?.tasks?.find(t => t.id === parentTaskId);
    if (!task) return;
    
    const stats = window.subtaskManager?.getSubtaskStats(parentTaskId);
    
    const modal = document.createElement('div');
    modal.className = 'modal subtasks-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>🌳 子任务分解 - ${task.id}</h3>
                <button class="modal-close" onclick="this.closest('.modal').remove()">✕</button>
            </div>
            <div class="modal-body">
                <div class="subtask-progress-summary">
                    <div class="progress-info">
                        <span>总体进度</span>
                        <span>${stats.progressPercent}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${stats.progressPercent}%"></div>
                    </div>
                    <div class="progress-detail">
                        已完成 ${stats.done}/${stats.total} 个子任务
                    </div>
                </div>
                
                <div class="add-subtask">
                    <input type="text" id="newSubtaskTitle" placeholder="子任务标题...">
                    <textarea id="newSubtaskDesc" placeholder="子任务描述（可选）..."></textarea>
                    <select id="newSubtaskPriority">
                        <option value="P2">P2 普通</option>
                        <option value="P1">P1 重要</option>
                        <option value="P0">P0 紧急</option>
                    </select>
                    <button onclick="addNewSubtask('${parentTaskId}')">添加子任务</button>
                </div>
                
                ${renderSubtasks(parentTaskId)}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// 添加新子任务
function addNewSubtask(parentTaskId) {
    const titleInput = document.getElementById('newSubtaskTitle');
    const descInput = document.getElementById('newSubtaskDesc');
    const prioritySelect = document.getElementById('newSubtaskPriority');
    
    const title = titleInput.value.trim();
    if (!title) {
        alert('请输入子任务标题');
        return;
    }
    
    window.subtaskManager?.createSubtask(parentTaskId, {
        title,
        description: descInput.value.trim(),
        priority: prioritySelect.value
    });
    
    // 清空输入
    titleInput.value = '';
    descInput.value = '';
    
    // 重新渲染
    const modal = document.querySelector('.subtasks-modal');
    if (modal) {
        modal.remove();
        showSubtasksModal(parentTaskId);
    }
}

// 编辑子任务
function editSubtask(parentTaskId, subtaskId) {
    const subtask = window.subtaskManager?.getSubtask(parentTaskId, subtaskId);
    if (!subtask) return;
    
    const newTitle = prompt('编辑子任务标题:', subtask.title);
    if (newTitle === null) return;
    
    const newDesc = prompt('编辑子任务描述:', subtask.description);
    
    window.subtaskManager?.updateSubtask(parentTaskId, subtaskId, {
        title: newTitle.trim(),
        description: newDesc ? newDesc.trim() : subtask.description
    });
    
    // 重新渲染
    const modal = document.querySelector('.subtasks-modal');
    if (modal) {
        modal.remove();
        showSubtasksModal(parentTaskId);
    }
}

// 删除子任务
function deleteSubtask(parentTaskId, subtaskId) {
    if (confirm('确定要删除这个子任务吗？')) {
        window.subtaskManager?.deleteSubtask(parentTaskId, subtaskId);
        
        // 重新渲染
        const modal = document.querySelector('.subtasks-modal');
        if (modal) {
            modal.remove();
            showSubtasksModal(parentTaskId);
        }
    }
}

// 全局实例
window.SubtaskManager = SubtaskManager;
window.renderSubtasks = renderSubtasks;
window.showSubtasksModal = showSubtasksModal;
window.addNewSubtask = addNewSubtask;
window.deleteSubtask = deleteSubtask;
window.editSubtask = editSubtask;
window.toggleSubtask = toggleSubtask;

// 任务模板管理模块

class TaskTemplateManager {
    constructor() {
        this.templates = [];
        this.load();
    }

    // 从任务创建模板
    createTemplateFromTask(taskId, templateName) {
        const task = window.tasksData?.tasks?.find(t => t.id === taskId);
        if (!task) return null;
        
        const template = {
            id: `tpl_${Date.now()}`,
            name: templateName || `模板_${task.title}`,
            description: task.description || '',
            baseTask: {
                title: task.title,
                description: task.description,
                priority: task.priority || 'P2',
                estimatedTime: task.estimatedTime || '',
                assignee: task.assignee || ''
            },
            subtasks: window.subtaskManager?.getSubtasks(taskId) || [],
            dependencies: task.dependencies || [],
            tags: task.tags || [],
            createdTime: new Date().toISOString(),
            usedCount: 0
        };
        
        this.templates.push(template);
        this.save();
        return template;
    }

    // 创建空白模板
    createTemplate(templateData) {
        const template = {
            id: `tpl_${Date.now()}`,
            name: templateData.name || '新模板',
            description: templateData.description || '',
            baseTask: {
                title: templateData.title || '',
                description: templateData.description || '',
                priority: templateData.priority || 'P2',
                estimatedTime: templateData.estimatedTime || '',
                assignee: templateData.assignee || ''
            },
            subtasks: templateData.subtasks || [],
            dependencies: templateData.dependencies || [],
            tags: templateData.tags || [],
            createdTime: new Date().toISOString(),
            usedCount: 0
        };
        
        this.templates.push(template);
        this.save();
        return template;
    }

    // 更新模板
    updateTemplate(templateId, updates) {
        const template = this.templates.find(t => t.id === templateId);
        if (!template) return false;
        
        Object.assign(template, updates);
        this.save();
        return true;
    }

    // 删除模板
    deleteTemplate(templateId) {
        const index = this.templates.findIndex(t => t.id === templateId);
        if (index === -1) return false;
        
        this.templates.splice(index, 1);
        this.save();
        return true;
    }

    // 获取模板
    getTemplate(templateId) {
        return this.templates.find(t => t.id === templateId);
    }

    // 获取所有模板
    getTemplates() {
        return this.templates;
    }

    // 从模板创建任务
    createTaskFromTemplate(templateId, overrides = {}) {
        const template = this.getTemplate(templateId);
        if (!template) return null;
        
        const newTask = {
            id: `T${Date.now()}`,
            title: overrides.title || template.baseTask.title,
            priority: overrides.priority || template.baseTask.priority,
            status: 'todo',
            progress: 0,
            description: overrides.description || template.baseTask.description,
            estimatedTime: overrides.estimatedTime || template.baseTask.estimatedTime,
            assignee: overrides.assignee || template.baseTask.assignee,
            createdTime: new Date().toISOString(),
            fromTemplate: template.id,
            templateName: template.name
        };
        
        // 创建子任务
        if (template.subtasks && template.subtasks.length > 0) {
            template.subtasks.forEach(st => {
                if (window.subtaskManager) {
                    window.subtaskManager.createSubtask(newTask.id, {
                        title: st.title,
                        description: st.description,
                        priority: st.priority
                    });
                }
            });
        }
        
        // 更新模板使用次数
        template.usedCount++;
        this.save();
        
        return newTask;
    }

    // 保存
    save() {
        localStorage.setItem('taskTemplates', JSON.stringify(this.templates));
    }

    // 加载
    load() {
        try {
            this.templates = JSON.parse(localStorage.getItem('taskTemplates')) || [];
        } catch (e) {
            console.error('加载模板失败:', e);
            this.templates = [];
        }
    }
}

// 显示模板管理模态框
function showTemplatesModal() {
    const templates = window.templateManager?.getTemplates() || [];
    
    const modal = document.createElement('div');
    modal.className = 'modal templates-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>📋 任务模板管理</h3>
                <button class="modal-close" onclick="this.closest('.modal').remove()">✕</button>
            </div>
            <div class="modal-body">
                <div class="template-actions">
                    <button onclick="showCreateTemplateForm()">➕ 新建模板</button>
                </div>
                
                ${templates.length === 0 ? 
                    '<div class="empty-state">暂无模板，创建一个吧~</div>' : 
                    `<div class="templates-grid">
                        ${templates.map(tpl => `
                            <div class="template-card">
                                <div class="template-header">
                                    <h4>${tpl.name}</h4>
                                    <span class="template-usage">已使用 ${tpl.usedCount} 次</span>
                                </div>
                                <p class="template-desc">${tpl.description || '无描述'}</p>
                                <div class="template-meta">
                                    <span>🎯 ${tpl.baseTask.priority}</span>
                                    <span>⏱️ ${tpl.baseTask.estimatedTime || '未设置'}</span>
                                </div>
                                <div class="template-actions">
                                    <button class="btn-primary" onclick="useTemplate('${tpl.id}')">使用此模板</button>
                                    <button class="btn-danger" onclick="deleteTemplate('${tpl.id}')">删除</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>`
                }
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// 显示创建模板表单
function showCreateTemplateForm() {
    const modal = document.createElement('div');
    modal.className = 'modal template-form-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>➕ 创建新模板</h3>
                <button class="modal-close" onclick="this.closest('.modal').remove()">✕</button>
            </div>
            <div class="modal-body">
                <form id="templateForm" onsubmit="submitTemplateForm(event)">
                    <div class="form-group">
                        <label>模板名称 *</label>
                        <input type="text" name="name" required placeholder="例如：客户分析报告模板">
                    </div>
                    <div class="form-group">
                        <label>任务标题 *</label>
                        <input type="text" name="title" required placeholder="任务标题">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>优先级</label>
                            <select name="priority">
                                <option value="P2">P2 普通</option>
                                <option value="P1">P1 重要</option>
                                <option value="P0">P0 紧急</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>预计时间</label>
                            <input type="text" name="estimatedTime" placeholder="例如：30 分钟">
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn-primary">创建模板</button>
                        <button type="button" class="btn-secondary" onclick="this.closest('.modal').remove()">取消</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// 提交模板表单
function submitTemplateForm(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    window.templateManager?.createTemplate({
        name: formData.get('name'),
        title: formData.get('title'),
        priority: formData.get('priority'),
        estimatedTime: formData.get('estimatedTime')
    });
    
    const modal = document.querySelector('.template-form-modal');
    if (modal) { modal.remove(); showTemplatesModal(); }
    alert('模板创建成功！');
}

// 使用模板创建任务
function useTemplate(templateId) {
    if (confirm('确定要使用此模板创建任务吗？')) {
        const newTask = window.templateManager?.createTaskFromTemplate(templateId);
        if (newTask && window.tasksData?.tasks) {
            window.tasksData.tasks.unshift(newTask);
            const modal = document.querySelector('.templates-modal');
            if (modal) modal.remove();
            alert(`任务已创建！ID: ${newTask.id}`);
        }
    }
}

// 删除模板
function deleteTemplate(templateId) {
    if (confirm('确定要删除这个模板吗？')) {
        window.templateManager?.deleteTemplate(templateId);
        const modal = document.querySelector('.templates-modal');
        if (modal) { modal.remove(); showTemplatesModal(); }
    }
}

window.TaskTemplateManager = TaskTemplateManager;
window.showTemplatesModal = showTemplatesModal;
window.useTemplate = useTemplate;
window.deleteTemplate = deleteTemplate;
window.showCreateTemplateForm = showCreateTemplateForm;
window.submitTemplateForm = submitTemplateForm;
